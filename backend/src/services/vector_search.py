"""
Supabase pgvector Knowledge Base Retrieval Client for VMEC Healthcare.
Integrates Mistral 1024D embeddings with Supabase PostgreSQL pgvector RPC (2,670 vectors).
"""

from __future__ import annotations

import logging
import re
import time
from dataclasses import dataclass, field
from typing import Any

import httpx

from src.config import Settings, get_settings
from src.services.embedding import MistralEmbeddingService, get_embedding_service
from src.services.grounding import Citation

logger = logging.getLogger("vmec.services.vector_search")

SPECIALTY_PATTERNS: list[tuple[str, str, re.Pattern]] = [
    (
        "TIM_MACH",
        "Khoa Tim Mạch",
        re.compile(
            r"\b(tim mạch|đau ngực|mạch vành|nhồi máu|điện tim|ecg|cardio|tim)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "TIEU_HOA",
        "Khoa Tiêu Hóa - Gan Mật",
        re.compile(
            r"\b(tiêu hóa|dạ dày|thượng vị|ruột|gan mật|ợ chua|gastro)\b", re.IGNORECASE
        ),
    ),
    (
        "NHI_KHOA",
        "Khoa Nhi",
        re.compile(r"\b(nhi khoa|trẻ em|bé|sơ sinh|pediatric)\b", re.IGNORECASE),
    ),
    (
        "THAN_KINH",
        "Khoa Nội Thần Kinh",
        re.compile(
            r"\b(thần kinh|đau đầu|chóng mặt|tiền đình|mất ngủ|não|neuro)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "CO_XUONG_KHOP",
        "Khoa Cơ Xương Khớp",
        re.compile(
            r"\b(cơ xương khớp|thoái hóa khớp|đau lưng|cột sống|ortho)\b", re.IGNORECASE
        ),
    ),
    (
        "TAI_MUI_HONG",
        "Khoa Tai Mũi Họng",
        re.compile(
            r"\b(tai mũi họng|viêm họng|viêm amidan|viêm xoang|ù tai|ent)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "DA_LIEU",
        "Khoa Da Liễu",
        re.compile(r"\b(da liễu|mẩn ngứa|mề đay|dị ứng da|mụn|derma)\b", re.IGNORECASE),
    ),
    (
        "SAN_PHU_KHOA",
        "Khoa Sản Phụ Khoa",
        re.compile(
            r"\b(sản phụ khoa|khám thai|kinh nguyệt|phụ khoa|obgyn)\b", re.IGNORECASE
        ),
    ),
    (
        "HO_HAP",
        "Khoa Hô Hấp",
        re.compile(
            r"\b(hô hấp|phổi|hen suyễn|viêm phế quản|ho kéo dài|pulmo)\b", re.IGNORECASE
        ),
    ),
    (
        "MAT",
        "Khoa Mắt",
        re.compile(
            r"\b(khoa mắt|nhãn khoa|đau mắt|cận thị|đục thủy tinh thể|ophtha)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "RANG_HAM_MAT",
        "Khoa Răng Hàm Mặt",
        re.compile(
            r"\b(răng hàm mặt|nha khoa|sâu răng|nhổ răng|dental)\b", re.IGNORECASE
        ),
    ),
]

SPECIALTY_DISPLAY_NAMES: dict[str, str] = {
    code: name for code, name, _ in SPECIALTY_PATTERNS
}
SPECIALTY_DISPLAY_NAMES["NOI_TONG_QUAT"] = "Khoa Khám Bệnh Đa Khoa"


@dataclass(frozen=True)
class KnowledgeChunkMatch:
    chunk_id: str
    record_id: str
    normalized_text: str
    metadata: dict[str, Any]
    similarity: float


@dataclass(frozen=True)
class VectorSearchResult:
    top_specialty_code: str
    top_specialty_name: str
    confidence: float
    matched_chunks: list[KnowledgeChunkMatch] = field(default_factory=list)
    citations: list[Citation] = field(default_factory=list)
    grounding_text: str = ""
    latency_ms: float = 0.0


class VectorSearchClient:
    """
    Client for executing semantic similarity search on Supabase PostgreSQL pgvector.
    """

    def __init__(
        self,
        settings: Settings | None = None,
        embedding_service: MistralEmbeddingService | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.embedding_service = embedding_service or get_embedding_service()
        self._supabase_url = self.settings.supabase_url.rstrip("/")
        self._anon_key = self.settings.supabase_anon_key.get_secret_value()
        self._rpc_url = f"{self._supabase_url}/rest/v1/rpc/match_knowledge_chunks"

    def _resolve_specialty(
        self, chunks: list[KnowledgeChunkMatch], query_text: str = ""
    ) -> tuple[str, str, float]:
        if not chunks:
            return "NOI_TONG_QUAT", "Khoa Khám Bệnh Đa Khoa", 0.70

        # Frequency and similarity aggregation
        scores: dict[str, float] = {}

        # 1. Match from retrieved chunk texts and metadata
        for chunk in chunks:
            meta_str = " ".join(str(v) for v in chunk.metadata.values())
            combined_text = f"{chunk.normalized_text} {meta_str}"
            for code, _, pattern in SPECIALTY_PATTERNS:
                if pattern.search(combined_text):
                    scores[code] = scores.get(code, 0.0) + chunk.similarity

        # 2. Boost score with direct query text match if available
        if query_text:
            for code, _, pattern in SPECIALTY_PATTERNS:
                if pattern.search(query_text):
                    scores[code] = scores.get(code, 0.0) + 1.5

        if not scores:
            top_chunk = chunks[0]
            return (
                "NOI_TONG_QUAT",
                "Khoa Khám Bệnh Đa Khoa",
                max(top_chunk.similarity, 0.75),
            )

        top_code = max(scores, key=scores.get)
        top_name = SPECIALTY_DISPLAY_NAMES.get(top_code, "Khoa Khám Bệnh Đa Khoa")
        top_confidence = min(max(chunks[0].similarity, 0.80), 0.98)
        return top_code, top_name, top_confidence

    async def search(
        self,
        query: str,
        match_count: int | None = None,
        similarity_threshold: float | None = None,
    ) -> VectorSearchResult:
        start_time = time.perf_counter()
        count = match_count or self.settings.retrieval_candidate_limit
        threshold = similarity_threshold or self.settings.retrieval_similarity_threshold

        logger.info(
            "Executing vector search for query: '%s' (limit=%d)", query[:60], count
        )

        # 1. Generate 1024D embedding using Mistral
        query_vector = await self.embedding_service.embed_text(query)

        # 2. Call Supabase pgvector RPC
        headers = {
            "apikey": self._anon_key,
            "Authorization": f"Bearer {self._anon_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "query_embedding": query_vector,
            "match_threshold": threshold,
            "match_count": count,
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(self._rpc_url, json=payload, headers=headers)
            if resp.status_code != 200:
                logger.error(
                    "Supabase pgvector RPC failed with HTTP %d: %s",
                    resp.status_code,
                    resp.text[:200],
                )
                elapsed_ms = (time.perf_counter() - start_time) * 1000
                return VectorSearchResult(
                    top_specialty_code="NOI_TONG_QUAT",
                    top_specialty_name="Khoa Nội Tổng Quát",
                    confidence=0.70,
                    latency_ms=elapsed_ms,
                )

            raw_chunks = resp.json()

        chunks: list[KnowledgeChunkMatch] = []
        citations: list[Citation] = []
        grounding_lines: list[str] = []

        for item in raw_chunks:
            meta = item.get("metadata") or {}
            chunk = KnowledgeChunkMatch(
                chunk_id=str(item.get("chunk_id", "")),
                record_id=str(item.get("record_id", "")),
                normalized_text=str(item.get("normalized_text", "")),
                metadata=meta,
                similarity=float(item.get("similarity", 0.0)),
            )
            chunks.append(chunk)

            title = (
                meta.get("source_title")
                or meta.get("title")
                or meta.get("document_title")
                or "Hướng dẫn Chẩn đoán & Điều trị - Bộ Y Tế"
            )
            section = (
                meta.get("concept")
                or meta.get("section")
                or meta.get("section_title")
                or "Quy trình lâm sàng"
            )
            raw_url = meta.get("citation_url") or meta.get("url") or meta.get("canonical_url")
            url = (
                raw_url
                if raw_url and raw_url.startswith("http") and not "phac-do-dieu-tri" in raw_url
                else "https://kcb.vn/van-ban"
            )

            citation = Citation(
                source_id=meta.get("batch_id") or "MOH_VIETNAM",
                document_id=meta.get("row_id") or chunk.record_id or chunk.chunk_id,
                title=title,
                url=url,
                section_title=section,
                snippet=chunk.normalized_text[:300],
                confidence=round(chunk.similarity * 100, 1),
            )
            citations.append(citation)
            grounding_lines.append(
                f"[{title} - {section}] (Độ tương đồng: {chunk.similarity:.2%}):\n{chunk.normalized_text}"
            )

        top_code, top_name, confidence = self._resolve_specialty(
            chunks, query_text=query
        )
        grounding_text = "\n\n---\n\n".join(grounding_lines)
        elapsed_ms = (time.perf_counter() - start_time) * 1000

        logger.info(
            "Vector search completed in %.2f ms -> Top specialty: %s (%s, conf=%.2f)",
            elapsed_ms,
            top_code,
            top_name,
            confidence,
        )

        return VectorSearchResult(
            top_specialty_code=top_code,
            top_specialty_name=top_name,
            confidence=confidence,
            matched_chunks=chunks,
            citations=citations,
            grounding_text=grounding_text,
            latency_ms=elapsed_ms,
        )

    async def search_emergency_vectors(
        self,
        query: str,
        match_count: int | None = None,
        similarity_threshold: float | None = None,
        filter_specialty: str | None = None,
    ) -> VectorSearchResult:
        """
        Executes dedicated semantic similarity search on Supabase emergency_knowledge_chunks table.
        """
        start_time = time.perf_counter()
        count = match_count or self.settings.retrieval_candidate_limit
        threshold = similarity_threshold or 0.35

        query_vector = await self.embedding_service.embed_text(query)
        headers = {
            "apikey": self._anon_key,
            "Authorization": f"Bearer {self._anon_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "query_embedding": query_vector,
            "match_threshold": threshold,
            "match_count": count,
        }
        rpc_url = f"{self._supabase_url}/rest/v1/rpc/match_emergency_knowledge_chunks"

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(rpc_url, json=payload, headers=headers)
            if resp.status_code != 200:
                logger.error(
                    "Supabase emergency pgvector RPC failed with HTTP %d: %s",
                    resp.status_code,
                    resp.text[:200],
                )
                elapsed_ms = (time.perf_counter() - start_time) * 1000
                return VectorSearchResult(
                    top_specialty_code="CAP_CUU",
                    top_specialty_name="Khoa Cấp Cứu 115 & Đột Quỵ Khẩn Cấp",
                    confidence=0.90,
                    latency_ms=elapsed_ms,
                )

            raw_chunks = resp.json()

        chunks: list[KnowledgeChunkMatch] = []
        citations: list[Citation] = []
        grounding_lines: list[str] = []

        for item in raw_chunks:
            meta = item.get("metadata") or {}
            chunk = KnowledgeChunkMatch(
                chunk_id=str(item.get("chunk_id", "")),
                record_id=str(item.get("record_id", "")),
                normalized_text=str(item.get("normalized_text", "")),
                metadata=meta,
                similarity=float(item.get("similarity", 0.0)),
            )
            chunks.append(chunk)

            spec_name = item.get("specialty_name") or "Khoa Cấp Cứu"
            title = f"Phác đồ Cấp cứu - {spec_name}"
            raw_url = item.get("citation_url") or "https://kcb.vn"
            url = raw_url if raw_url.startswith("http") else "https://kcb.vn"

            citation = Citation(
                source_id="BYT_EMERGENCY_2026",
                document_id=chunk.chunk_id,
                title=title,
                url=url,
                section_title="Phác đồ Xử trí Cấp cứu Tối cấp",
                snippet=chunk.normalized_text[:300],
                confidence=round(chunk.similarity * 100, 1),
            )
            citations.append(citation)
            grounding_lines.append(
                f"[{title}] (Độ khớp cấp cứu: {chunk.similarity:.2%}):\n{chunk.normalized_text}"
            )

        top_code = raw_chunks[0].get("specialty_code", "CAP_CUU") if raw_chunks else "CAP_CUU"
        top_name = raw_chunks[0].get("specialty_name", "Khoa Cấp Cứu 115 & Đột Quỵ Khẩn Cấp") if raw_chunks else "Khoa Cấp Cứu 115 & Đột Quỵ Khẩn Cấp"
        confidence = float(raw_chunks[0].get("similarity", 0.90)) if raw_chunks else 0.90

        elapsed_ms = (time.perf_counter() - start_time) * 1000
        return VectorSearchResult(
            top_specialty_code=top_code,
            top_specialty_name=top_name,
            confidence=confidence,
            matched_chunks=chunks,
            citations=citations,
            grounding_text="\n\n---\n\n".join(grounding_lines),
            latency_ms=elapsed_ms,
        )


_vector_client_instance: VectorSearchClient | None = None


def get_vector_client() -> VectorSearchClient:
    global _vector_client_instance
    if _vector_client_instance is None:
        _vector_client_instance = VectorSearchClient()
    return _vector_client_instance
