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

from src.services.graph_search import get_graph_client
from src.services.hybrid_search import get_hybrid_client
from src.services.unified_retrieval import get_unified_retrieval_engine
from src.services.vector_search import get_vector_client

logger = logging.getLogger("vmec.api.vector")
router = APIRouter(prefix="/api/vector", tags=["vector"])


class VectorSearchRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    query: str = Field(min_length=1)
    match_count: int = 5
    match_threshold: float = 0.60


@router.post("/unified-search", status_code=status.HTTP_200_OK)
async def canonical_unified_search(payload: VectorSearchRequest) -> dict[str, Any]:
    """
    Canonical End-to-End Search endpoint for VMEC Healthcare:
    Query Understanding -> Quad-Retrieval -> Weighted RRF -> FlashRank -> Diversity -> Citations & Consensus.
    """
    engine = get_unified_retrieval_engine()
    try:
        res = await engine.search(query=payload.query, match_count=payload.match_count)
        return {
            "success": True,
            "top_specialty_code": res.top_specialty_code,
            "top_specialty_name": res.top_specialty_name,
            "confidence": res.confidence,
            "routing_action": res.routing_action,
            "is_emergency": res.is_emergency,
            "emergency_probability": res.emergency_probability,
            "ambiguity_detected": res.ambiguity_detected,
            "specialty_consensus_scores": res.specialty_consensus_scores,
            "citations": [c.model_dump() for c in res.citations],
            "grounding_text": res.grounding_text,
            "graph_lineage": res.graph_lineage,
            "latency_breakdown": res.latency_breakdown,
            "total_latency_ms": res.total_latency_ms,
        }
    except Exception as ex:
        logger.error("Unified search endpoint failed: %s", ex)
        raise HTTPException(status_code=500, detail=str(ex)) from ex


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


@router.post("/graph-search", status_code=status.HTTP_200_OK)
async def graph_traversal_search(payload: VectorSearchRequest) -> dict[str, Any]:
    client = get_graph_client()
    try:
        res = client.search(query=payload.query, top_k=payload.match_count)
        return {
            "success": True,
            "top_specialty_code": res.top_specialty_code,
            "top_specialty_name": res.top_specialty_name,
            "confidence": res.confidence,
            "specialty_scores": res.specialty_scores,
            "matched_symptoms": res.matched_symptoms,
            "is_emergency": res.is_emergency,
            "emergency_probability": res.emergency_probability,
            "subgraph_paths": res.subgraph_paths,
            "latency_ms": res.latency_ms,
        }
    except Exception as ex:
        logger.error("Graph search endpoint failed: %s", ex)
        raise HTTPException(status_code=500, detail=str(ex)) from ex


@router.post("/emergency-search", status_code=status.HTTP_200_OK)
async def emergency_vector_search(payload: VectorSearchRequest) -> dict[str, Any]:
    """
    Dedicated Emergency Vector Search on Supabase emergency_knowledge_chunks.
    Fast-path semantic search across 14,351 emergency vectors.
    """
    client = get_vector_client()
    try:
        res = await client.search_emergency_vectors(
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
        logger.error("Emergency vector search endpoint failed: %s", ex)
        raise HTTPException(status_code=500, detail=str(ex)) from ex

