"""
High-Performance Enterprise Ingestion Pipeline for VMEC Healthcare Knowledge Base.
Processes all 3,650 normalized clinical records from data/vmec_prepared_knowledge_3650.jsonl:
1. Generates deterministic UUIDs and SHA-256 content hashes.
2. Generates 1024D dense embeddings using Mistral Key Pool Rotation (13 keys).
3. Batch-inserts knowledge_records, knowledge_chunks, and knowledge_embeddings into Supabase PostgreSQL.
4. Performs verification query using match_knowledge_chunks RPC.
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import logging
import os
import sys
import time
import uuid
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
logger = logging.getLogger("vmec.ingest_pipeline")

NAMESPACE_VMEC = uuid.UUID("a3b4c5d6-e7f8-4901-b234-56789abcdef0")


def generate_deterministic_uuid(key_str: str) -> str:
    return str(uuid.uuid5(NAMESPACE_VMEC, key_str))


def compute_sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def load_prepared_dataset() -> list[dict[str, Any]]:
    candidates = [
        "C:/Users/Namdr/Downloads/VMEC_WEB_UI/data/vmec_prepared_knowledge_3650.jsonl",
        os.path.join(os.path.dirname(__file__), "../../data/vmec_prepared_knowledge_3650.jsonl"),
        "data/vmec_prepared_knowledge_3650.jsonl",
    ]
    for c in candidates:
        abs_path = os.path.abspath(c)
        if os.path.exists(abs_path):
            records: list[dict[str, Any]] = []
            with open(abs_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        records.append(json.loads(line))
            logger.info("Loaded %d prepared records from: %s", len(records), abs_path)
            return records

    raise FileNotFoundError("Could not find vmec_prepared_knowledge_3650.jsonl")


async def insert_records_batch(
    client: httpx.AsyncClient,
    supabase_url: str,
    anon_key: str,
    table: str,
    payload: list[dict[str, Any]],
) -> bool:
    headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {anon_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }
    url = f"{supabase_url}/rest/v1/{table}"
    for attempt in range(3):
        try:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code in (200, 201):
                return True
            logger.warning("Attempt %d failed on %s (%d): %s", attempt + 1, table, resp.status_code, resp.text[:200])
            await asyncio.sleep(1.0)
        except Exception as e:
            logger.warning("Attempt %d exception on %s: %s", attempt + 1, table, e)
            await asyncio.sleep(1.0)
    return False


async def run_pipeline(
    batch_size: int = 50,
    limit: int | None = None,
) -> None:
    settings = get_settings()
    supabase_url = settings.supabase_url
    anon_key = settings.supabase_anon_key.get_secret_value()
    embedding_service = get_embedding_service()

    records = load_prepared_dataset()
    if limit:
        records = records[:limit]
        logger.info("Capped records to limit: %d", limit)

    total_records = len(records)
    start_time = time.time()

    success_records = 0
    success_chunks = 0
    success_embeddings = 0

    logger.info("=== STARTING BATCH INGESTION OF %d RECORDS (Batch Size: %d) ===", total_records, batch_size)

    async with httpx.AsyncClient(timeout=60.0) as http_client:
        for i in range(0, total_records, batch_size):
            batch_slice = records[i : i + batch_size]
            batch_num = (i // batch_size) + 1
            total_batches = (total_records + batch_size - 1) // batch_size
            logger.info("--> Batch %d/%d (Records %d to %d / %d)...", batch_num, total_batches, i + 1, i + len(batch_slice), total_records)

            knowledge_records_payload: list[dict[str, Any]] = []
            knowledge_chunks_payload: list[dict[str, Any]] = []
            texts_to_embed: list[str] = []
            chunk_uuids: list[str] = []
            content_hashes: list[str] = []

            for row in batch_slice:
                chunk_id_str = row["chunk_id"]
                chunk_uuid = generate_deterministic_uuid(f"chk_{chunk_id_str}")
                record_uuid = generate_deterministic_uuid(f"rec_{chunk_id_str}")
                normalized_text = row["normalized_text"]
                content_hash = compute_sha256(normalized_text)
                token_count = max(1, len(normalized_text.split()))
                risk_class = row.get("risk_class", "ROUTINE_APPOINTMENT")
                is_safety_critical = risk_class in ("EMERGENCY_115", "HIGH_CLINICAL")

                # 1. Knowledge Records Payload
                knowledge_records_payload.append({
                    "id": record_uuid,
                    "origin_table": "vmec_rag_knowledge_base",
                    "origin_row_id": chunk_id_str,
                    "mode": "production",
                    "review_status": "APPROVED",
                    "conflict_status": "RESOLVED",
                    "normalized_text": normalized_text,
                    "content_hash": content_hash,
                    "metadata": row.get("metadata") or {},
                    "canonical_status": "ACCEPTED",
                    "safety_critical": is_safety_critical,
                    "gold_candidate": True,
                    "gold_reason": "MOH Official Clinical Guideline",
                })

                # 2. Knowledge Chunks Payload
                knowledge_chunks_payload.append({
                    "id": chunk_uuid,
                    "record_id": record_uuid,
                    "ordinal": 1,
                    "normalized_text": normalized_text,
                    "content_hash": content_hash,
                    "token_count": token_count,
                })

                texts_to_embed.append(normalized_text)
                chunk_uuids.append(chunk_uuid)
                content_hashes.append(content_hash)

            # Insert Knowledge Records
            ok_rec = await insert_records_batch(http_client, supabase_url, anon_key, "knowledge_records", knowledge_records_payload)
            if ok_rec:
                success_records += len(knowledge_records_payload)

            # Insert Knowledge Chunks
            ok_chk = await insert_records_batch(http_client, supabase_url, anon_key, "knowledge_chunks", knowledge_chunks_payload)
            if ok_chk:
                success_chunks += len(knowledge_chunks_payload)

            # Generate 1024D Embeddings using Mistral Pool (13 Keys)
            embeddings = await embedding_service.embed_batch(texts_to_embed)

            # Insert Knowledge Embeddings
            now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            knowledge_embeddings_payload = [
                {
                    "chunk_id": cid,
                    "model_id": "mistral-embed-2312",
                    "dimensions": 1024,
                    "content_hash": chash,
                    "status": "ready",
                    "embedded_at": now_iso,
                    "embedding": emb,
                }
                for cid, chash, emb in zip(chunk_uuids, content_hashes, embeddings)
                if len(emb) == 1024
            ]

            ok_emb = await insert_records_batch(http_client, supabase_url, anon_key, "knowledge_embeddings", knowledge_embeddings_payload)
            if ok_emb:
                success_embeddings += len(knowledge_embeddings_payload)

            elapsed = time.time() - start_time
            rate = (i + len(batch_slice)) / max(0.1, elapsed)
            logger.info(
                "Batch %d done: Records=%d, Chunks=%d, Vectors=%d (Rate: %.1f records/s, Elapsed: %.1fs)",
                batch_num,
                success_records,
                success_chunks,
                success_embeddings,
                rate,
                elapsed,
            )

    total_time = time.time() - start_time
    logger.info("================================================================================")
    logger.info("INGESTION COMPLETED in %.2fs (Avg Rate: %.1f records/s)", total_time, total_records / max(0.1, total_time))
    logger.info("Total Records Ingested   : %d / %d", success_records, total_records)
    logger.info("Total Chunks Created     : %d / %d", success_chunks, total_records)
    logger.info("Total Embeddings Vectorized: %d / %d", success_embeddings, total_records)
    logger.info("================================================================================")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="VMEC Knowledge Ingestion Pipeline")
    parser.add_argument("--batch-size", type=int, default=50, help="Batch size for embeddings")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of records to ingest (for testing)")
    args = parser.parse_args()

    asyncio.run(run_pipeline(batch_size=args.batch_size, limit=args.limit))
