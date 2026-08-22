"""
Hybrid GraphRAG Search Service for VMEC Healthcare.
Combines Kùzu Embedded Property Graph (sub-5ms Cypher traversal) with Supabase PostgreSQL pgvector (36,298 Mistral 1024D vectors).
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import Any

from src.config import Settings, get_settings
from src.services.graph_search import GraphSearchClient, GraphSearchResult, get_graph_client
from src.services.grounding import Citation
from src.services.vector_search import KnowledgeChunkMatch, VectorSearchClient, VectorSearchResult, get_vector_client

logger = logging.getLogger("vmec.services.hybrid_search")


@dataclass(frozen=True)
class HybridSearchResult:
    top_specialty_code: str
    top_specialty_name: str
    confidence: float
    is_emergency: bool = False
    emergency_probability: float = 0.0
    matched_chunks: list[KnowledgeChunkMatch] = field(default_factory=list)
    citations: list[Citation] = field(default_factory=list)
    grounding_text: str = ""
    graph_lineage: list[str] = field(default_factory=list)
    graph_latency_ms: float = 0.0
    vector_latency_ms: float = 0.0
    total_latency_ms: float = 0.0


class HybridSearchClient:
    """
    Hybrid Search Client orchestrating Graph Traversal and Vector Retrieval.
    """

    def __init__(
        self,
        settings: Settings | None = None,
        graph_client: GraphSearchClient | None = None,
        vector_client: VectorSearchClient | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.graph_client = graph_client or get_graph_client()
        self.vector_client = vector_client or get_vector_client()

    async def search(
        self,
        query: str,
        match_count: int | None = None,
    ) -> HybridSearchResult:
        start_time = time.perf_counter()

        # 1. Step 1: Sub-5ms Graph Traversal (Kùzu DB)
        graph_res: GraphSearchResult = self.graph_client.search(query=query)

        # 2. Step 2: Dense Vector Retrieval (Supabase pgvector)
        vector_res: VectorSearchResult = await self.vector_client.search(
            query=query,
            match_count=match_count,
        )

        # 3. Step 3: Hybrid Rank Fusion
        graph_w = self.settings.graph_weight
        vec_w = self.settings.vector_weight

        # Specialty Scoring Aggregation
        combined_scores: dict[str, float] = {}

        # Normalize Graph Scores
        if graph_res.specialty_scores:
            max_g = max(graph_res.specialty_scores.values()) or 1.0
            for code, sc in graph_res.specialty_scores.items():
                combined_scores[code] = combined_scores.get(code, 0.0) + (sc / max_g) * graph_w

        # Vector Score contribution
        vec_code = vector_res.top_specialty_code
        combined_scores[vec_code] = combined_scores.get(vec_code, 0.0) + vector_res.confidence * vec_w

        # Determine Winning Specialty
        if combined_scores:
            top_code = max(combined_scores, key=combined_scores.get)
            if top_code == graph_res.top_specialty_code:
                top_name = graph_res.top_specialty_name
            else:
                top_name = vector_res.top_specialty_name
            top_confidence = min(0.99, max(graph_res.confidence, vector_res.confidence))
        else:
            top_code = vector_res.top_specialty_code
            top_name = vector_res.top_specialty_name
            top_confidence = vector_res.confidence

        # 4. Synthesize Grounding Text with Graph Lineage & Vector Evidence
        grounding_blocks: list[str] = []
        if graph_res.subgraph_paths:
            graph_summary = "Logic liên kết đồ thị tri thức (Knowledge Graph):\n" + "\n".join(
                [f" - {p}" for p in graph_res.subgraph_paths]
            )
            grounding_blocks.append(graph_summary)

        if vector_res.grounding_text:
            grounding_blocks.append(vector_res.grounding_text)

        grounding_text = "\n\n---\n\n".join(grounding_blocks)
        total_elapsed = (time.perf_counter() - start_time) * 1000

        logger.info(
            "Hybrid GraphRAG search finished in %.2f ms (Graph: %.1fms, Vector: %.1fms) -> Top: %s (%s, conf=%.2f)",
            total_elapsed,
            graph_res.latency_ms,
            vector_res.latency_ms,
            top_code,
            top_name,
            top_confidence,
        )

        return HybridSearchResult(
            top_specialty_code=top_code,
            top_specialty_name=top_name,
            confidence=top_confidence,
            is_emergency=graph_res.is_emergency,
            emergency_probability=graph_res.emergency_probability,
            matched_chunks=vector_res.matched_chunks,
            citations=vector_res.citations,
            grounding_text=grounding_text,
            graph_lineage=graph_res.subgraph_paths,
            graph_latency_ms=graph_res.latency_ms,
            vector_latency_ms=vector_res.latency_ms,
            total_latency_ms=total_elapsed,
        )


_hybrid_client_instance: HybridSearchClient | None = None


def get_hybrid_client() -> HybridSearchClient:
    global _hybrid_client_instance
    if _hybrid_client_instance is None:
        _hybrid_client_instance = HybridSearchClient()
    return _hybrid_client_instance
