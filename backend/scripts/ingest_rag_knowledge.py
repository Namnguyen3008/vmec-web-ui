"""
High-Performance Batch Ingestion Pipeline for VMEC Knowledge Base.
Reads data/vmec_rag_knowledge_base.csv (3,650 clinical records),
generates 1024D embeddings using Mistral Key Pool (13 keys),
and batch-inserts into Supabase pgvector database.
"""

from __future__ import annotations

import argparse
import asyncio
import csv
import logging
import os
import sys
import time
from typing import Any

import httpx

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.config import get_settings
from src.services.embedding import get_embedding_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("vmec.scripts.ingest_rag_knowledge")


def find_data_file() -> str:
    candidates = [
        os.path.join(os.path.dirname(__file__), "../../data/vmec_prepared_knowledge_3650.jsonl"),
        os.path.join(os.path.dirname(__file__), "../../../VMEC_WEB_UI/data/vmec_prepared_knowledge_3650.jsonl"),
        "C:/Users/Namdr/Downloads/VMEC_WEB_UI/data/vmec_prepared_knowledge_3650.jsonl",
        "data/vmec_prepared_knowledge_3650.jsonl",
        os.path.join(os.path.dirname(__file__), "../../data/vmec_prepared_knowledge_3650.csv"),
        "data/vmec_prepared_knowledge_3650.csv",
        "data/vmec_rag_knowledge_base.csv",
    ]
    for c in candidates:
        abs_path = os.path.abspath(c)
        if os.path.exists(abs_path):
            return abs_path
    raise FileNotFoundError("Could not find prepared knowledge dataset in known paths.")


async def purge_supabase_tables(supabase_url: str, anon_key: str) -> None:
    logger.info("Purging old knowledge data on Supabase...")
    headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {anon_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Delete embeddings
        del_emb = await client.delete(
            f"{supabase_url}/rest/v1/knowledge_embeddings?chunk_id=neq.placeholder",
            headers=headers,
        )
        logger.info("Delete embeddings status: %d", del_emb.status_code)

        # Delete chunks
        del_chk = await client.delete(
            f"{supabase_url}/rest/v1/knowledge_chunks?chunk_id=neq.placeholder",
            headers=headers,
        )
        logger.info("Delete chunks status: %d", del_chk.status_code)


async def insert_chunks_batch(
    client: httpx.AsyncClient,
    supabase_url: str,
    anon_key: str,
    chunks: list[dict[str, Any]],
) -> bool:
    headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {anon_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }
    url = f"{supabase_url}/rest/v1/knowledge_chunks"
    resp = await client.post(url, json=chunks, headers=headers)
    if resp.status_code not in (200, 201):
        logger.error("Failed to insert chunks batch (%d): %s", resp.status_code, resp.text[:200])
        return False
    return True


async def insert_embeddings_batch(
    client: httpx.AsyncClient,
    supabase_url: str,
    anon_key: str,
    embeddings: list[dict[str, Any]],
) -> bool:
    headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {anon_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }
    url = f"{supabase_url}/rest/v1/knowledge_embeddings"
    resp = await client.post(url, json=embeddings, headers=headers)
    if resp.status_code not in (200, 201):
        logger.error("Failed to insert embeddings batch (%d): %s", resp.status_code, resp.text[:200])
        return False
    return True


async def run_ingestion(
    purge_first: bool = False,
    batch_size: int = 50,
    limit: int | None = None,
) -> None:
    settings = get_settings()
    supabase_url = settings.supabase_url
    anon_key = settings.supabase_anon_key.get_secret_value()
    embedding_service = get_embedding_service()

    if not supabase_url or not anon_key:
        logger.error("SUPABASE_URL or SUPABASE_ANON_KEY is not configured.")
        return

    csv_path = find_data_file()
    logger.info("Reading knowledge records from: %s", csv_path)

    records: list[dict[str, Any]] = []
    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            records.append(row)

    total_records = len(records)
    logger.info("Total records in CSV: %d", total_records)
    if limit:
        records = records[:limit]
        logger.info("Capped records to limit: %d", limit)

    if purge_first:
        await purge_supabase_tables(supabase_url, anon_key)

    start_time = time.time()
    successful_chunks = 0
    successful_embeddings = 0

    async with httpx.AsyncClient(timeout=45.0) as http_client:
        for i in range(0, len(records), batch_size):
            batch_slice = records[i : i + batch_size]
            logger.info("Processing Batch %d to %d / %d...", i + 1, i + len(batch_slice), len(records))

            chunks_payload: list[dict[str, Any]] = []
            texts_to_embed: list[str] = []
            chunk_ids: list[str] = []

            for row in batch_slice:
                row_id = row.get("row_id") or row.get("\ufeffrow_id") or str(i)
                batch_id = row.get("batch_id", "B00")
                chunk_id = f"CHK_{batch_id}_{row_id}"
                specialty_code = row.get("primary_specialty_code", "NOI_TONG_QUAT")
                concept = row.get("clean_concept", "")
                record_id = f"REC_{specialty_code}_{concept[:40]}"
                content_vi = row.get("clean_content_vi", "")
                embed_text = row.get("embedding_input_text") or content_vi or concept
                citation_url = row.get("citation_url", "")
                risk_class = row.get("risk_class", "ROUTINE_APPOINTMENT")

                metadata = {
                    "batch_id": batch_id,
                    "concept": concept,
                    "subspecialty_code": row.get("subspecialty_code", ""),
                    "risk_class": risk_class,
                    "emergency_action_code": row.get("emergency_action_code", ""),
                    "routing_rationale_vi": row.get("routing_rationale_vi", ""),
                    "citation_url": citation_url,
                    "source_title": f"Hướng dẫn Chẩn đoán & Điều trị - Bộ Y Tế ({specialty_code})",
                }

                chunks_payload.append({
                    "chunk_id": chunk_id,
                    "record_id": record_id,
                    "normalized_text": embed_text,
                    "specialty_code": specialty_code,
                    "metadata": metadata,
                })
                texts_to_embed.append(embed_text)
                chunk_ids.append(chunk_id)

            # 1. Insert Chunks
            ok_chk = await insert_chunks_batch(http_client, supabase_url, anon_key, chunks_payload)
            if ok_chk:
                successful_chunks += len(chunks_payload)

            # 2. Generate 1024D Embeddings using Mistral Pool
            vectors = await embedding_service.embed_batch(texts_to_embed)

            # 3. Insert Embeddings
            embeddings_payload = [
                {"chunk_id": cid, "embedding": vec}
                for cid, vec in zip(chunk_ids, vectors)
                if len(vec) == 1024
            ]
            if embeddings_payload:
                ok_emb = await insert_embeddings_batch(http_client, supabase_url, anon_key, embeddings_payload)
                if ok_emb:
                    successful_embeddings += len(embeddings_payload)

            logger.info(
                "Batch complete. Chunks: %d, Embeddings: %d (Elapsed: %.1fs)",
                successful_chunks,
                successful_embeddings,
                time.time() - start_time,
            )

    elapsed = time.time() - start_time
    logger.info(
        "=== INGESTION FINISHED in %.1fs | Chunks: %d | Embeddings: %d ===",
        elapsed,
        successful_chunks,
        successful_embeddings,
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest VMEC knowledge base into Supabase pgvector")
    parser.add_argument("--purge", action="store_true", help="Purge existing data before ingesting")
    parser.add_argument("--batch-size", type=int, default=50, help="Batch size for embeddings")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of records to ingest (for testing)")
    args = parser.parse_args()

    asyncio.run(run_ingestion(purge_first=args.purge, batch_size=args.batch_size, limit=args.limit))
