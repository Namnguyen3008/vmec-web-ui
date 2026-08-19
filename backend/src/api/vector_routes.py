"""
FastAPI Vector Search Router for Supabase pgvector Semantic Retrieval.
Endpoint:
- POST /api/vector/search : Execute 1024D Mistral embedding + pgvector semantic match.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from src.services.vector_search import get_vector_client

logger = logging.getLogger("vmec.api.vector")
router = APIRouter(prefix="/api/vector", tags=["vector"])


class VectorSearchRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    query: str = Field(min_length=1)
    match_count: int = 5
    match_threshold: float = 0.60


@router.post("/search", status_code=status.HTTP_200_OK)
async def semantic_vector_search(payload: VectorSearchRequest) -> dict[str, Any]:
    client = get_vector_client()
    try:
        res = await client.search(
            query=payload.query,
            match_count=payload.match_count,
            similarity_threshold=payload.match_threshold,
        )
        return {
            "success": True,
            "top_specialty_code": res.top_specialty_code,
            "top_specialty_name": res.top_specialty_name,
            "confidence": res.confidence,
            "citations": [c.model_dump() for c in res.citations],
            "matched_chunks": [
                {
                    "chunk_id": c.chunk_id,
                    "record_id": c.record_id,
                    "normalized_text": c.normalized_text,
                    "metadata": c.metadata,
                    "similarity": c.similarity,
                }
                for c in res.matched_chunks
            ],
            "grounding_text": res.grounding_text,
            "latency_ms": res.latency_ms,
        }
    except Exception as ex:
        logger.error("Vector search endpoint failed: %s", ex)
        raise HTTPException(status_code=500, detail=str(ex)) from ex
