from __future__ import annotations

import argparse
import json
from pathlib import Path

from dotenv import load_dotenv

from backend.app.config import Settings
from backend.app.observability.tracing import create_application_tracer
from backend.app.rag.embeddings import OpenAIEmbeddingGateway, OpenRouterEmbeddingGateway
from backend.app.rag.ingestion import KnowledgeIngestionService
from backend.app.repositories.supabase.knowledge_repository import (
    SupabaseKnowledgeRepository,
    create_knowledge_data_client,
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Embed an approved Markdown document into PostgreSQL/pgvector")
    parser.add_argument("path", type=Path)
    args = parser.parse_args()

    project_root = Path(__file__).resolve().parents[2]
    load_dotenv(project_root / ".env")
    load_dotenv(project_root / "backend" / ".env", override=True)
    settings = Settings.from_env()
    if not settings.embedding_configured:
        parser.error(
            "SUPABASE_URL, SUPABASE_SECRET_KEY, an embedding API key and EMBEDDING_MODEL are required"
        )
    if not args.path.is_file():
        parser.error(f"File not found: {args.path}")

    tracer = create_application_tracer(
        enabled=settings.langfuse_tracing_enabled,
        public_key=settings.langfuse_public_key,
        secret_key=settings.langfuse_secret_key,
        base_url=settings.langfuse_base_url,
        environment=settings.langfuse_environment,
        release=settings.langfuse_release,
        sample_rate=settings.langfuse_sample_rate,
        timeout_seconds=settings.langfuse_timeout_seconds,
        pseudonymization_key=settings.langfuse_pseudonymization_key,
    )

    repository = SupabaseKnowledgeRepository(
        create_knowledge_data_client(settings.supabase_url, settings.supabase_secret_key)
    )
    gateway_class = (
        OpenRouterEmbeddingGateway
        if settings.embedding_provider == "openrouter"
        else OpenAIEmbeddingGateway
    )
    gateway = tracer.wrap_embedding_gateway(
        gateway_class(
            api_key=settings.embedding_api_key,
            model=settings.embedding_model,
            dimension=settings.embedding_dimension,
            batch_size=settings.embedding_batch_size,
        )
    )
    try:
        with tracer.observation(name="ingest-medical-knowledge", as_type="chain") as observation:
            result = KnowledgeIngestionService(repository, gateway).ingest(args.path)
            observation.update(
                metadata={
                    "embedding_input_count": result.chunk_count,
                    "status": "skipped" if result.skipped else "completed",
                }
            )
        print(
            json.dumps(
                {
                    "document_id": str(result.document_id),
                    "chunk_count": result.chunk_count,
                    "skipped": result.skipped,
                    "checksum": result.checksum,
                },
                ensure_ascii=False,
            )
        )
    finally:
        # CLI processes are short-lived, so explicitly flush Langfuse once here.
        tracer.shutdown()


if __name__ == "__main__":
    main()
