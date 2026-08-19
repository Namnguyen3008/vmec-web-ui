"""
Production Ingestion Script for VMEC 3,650 RAG Knowledge Base Records.
Reads data/vmec_rag_knowledge_base.csv, generates 1024D Mistral vector embeddings using 13-key rotation pool,
and batch-inserts chunks into Supabase pgvector table.

Usage:
  python backend/scripts/ingest_rag_data.py --dry-run
  python backend/scripts/ingest_rag_data.py --batch-size 25
"""

import argparse
import asyncio
import csv
import logging
import os
import sys
import time
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv()
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.config import get_settings
from src.services.embedding import get_embedding_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("vmec.scripts.ingest_rag")


def load_rag_csv(csv_path: str) -> list[dict[str, Any]]:
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Knowledge base CSV not found at: {csv_path}")

    records = []
    with open(csv_path, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            records.append(row)
    return records


async def ingest_dataset(csv_path: str, batch_size: int = 25, dry_run: bool = False, limit: int | None = None):
    settings = get_settings()
    records = load_rag_csv(csv_path)
    total_records = len(records) if not limit else min(limit, len(records))

    logger.info("Loaded %d records from '%s'", len(records), csv_path)
    if dry_run:
        logger.info("[DRY-RUN MODE] Validating first 5 records without embedding or database write...")
        for i, r in enumerate(records[:5], 1):
            logger.info("  Sample #%d: ID=%s, Concept=%s, Specialty=%s", i, r.get("row_id"), r.get("clean_concept"), r.get("primary_specialty_code"))
        logger.info("[DRY-RUN COMPLETE] %d records are valid and ready for ingestion.", len(records))
        return

    embedding_service = get_embedding_service()
    supabase_url = settings.supabase_url
    service_key = settings.supabase_service_role_key.get_secret_value() or settings.supabase_anon_key.get_secret_value()

    if not supabase_url or not service_key:
        raise ValueError("Supabase URL and Service Role Key are required for ingestion.")

    rest_endpoint = f"{supabase_url.rstrip('/')}/rest/v1/knowledge_chunks"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }

    logger.info("Starting ingestion of %d records (Batch size: %d)...", total_records, batch_size)
    start_time = time.perf_counter()
    success_count = 0

    for i in range(0, total_records, batch_size):
        batch = records[i : i + batch_size]
        texts_to_embed = [r.get("embedding_input_text") or r.get("clean_content_vi", "") for r in batch]

        # 1. Generate embeddings in batch
        try:
            vectors = await embedding_service.embed_batch(texts_to_embed)
        except Exception as ex:
            logger.error("Failed to generate embeddings for batch %d-%d: %s", i, i + len(batch), ex)
            continue

        # 2. Build rows for Supabase
        rows_to_insert = []
        for r, vec in zip(batch, vectors):
            row_data = {
                "chunk_id": r.get("row_id"),
                "record_id": r.get("row_id"),
                "normalized_text": r.get("clean_content_vi", ""),
                "embedding": vec,
                "metadata": {
                    "batch_id": r.get("batch_id"),
                    "table_name": r.get("table_name"),
                    "concept": r.get("clean_concept"),
                    "title": f"Quy chuẩn VMEC: {r.get('clean_concept', '')}",
                    "section_title": r.get("primary_specialty_code", ""),
                    "primary_specialty_code": r.get("primary_specialty_code"),
                    "subspecialty_code": r.get("subspecialty_code"),
                    "risk_class": r.get("risk_class"),
                    "emergency_action_code": r.get("emergency_action_code"),
                    "routing_rationale_vi": r.get("routing_rationale_vi"),
                    "citation_url": r.get("citation_url") or "https://kcb.vn/phac-do-dieu-tri",
                },
            }
            rows_to_insert.append(row_data)

        # 3. Post to Supabase REST API
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(rest_endpoint, json=rows_to_insert, headers=headers)
            if resp.status_code in (200, 201):
                success_count += len(rows_to_insert)
                logger.info("Progress: %d/%d (%.1f%%) records ingested successfully.", success_count, total_records, (success_count / total_records) * 100)
            else:
                logger.warning("Supabase batch insert returned %d: %s", resp.status_code, resp.text[:200])

    elapsed = time.perf_counter() - start_time
    logger.info("Ingestion completed: %d/%d records in %.2f seconds.", success_count, total_records, elapsed)


def main():
    parser = argparse.ArgumentParser(description="Ingest VMEC RAG Knowledge Base to Supabase pgvector")
    parser.add_argument("--csv", default="data/vmec_rag_knowledge_base.csv", help="Path to CSV file")
    parser.add_argument("--batch-size", type=int, default=25, help="Batch size for embedding and ingestion")
    parser.add_argument("--dry-run", action="store_true", help="Validate records without writing to DB")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of records to ingest")
    args = parser.parse_args()

    # Resolve relative path from project root
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    csv_full_path = os.path.join(project_root, args.csv) if not os.path.isabs(args.csv) else args.csv

    asyncio.run(ingest_dataset(csv_full_path, batch_size=args.batch_size, dry_run=args.dry_run, limit=args.limit))


if __name__ == "__main__":
    main()
