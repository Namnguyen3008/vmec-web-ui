"""
Kùzu Clinical Knowledge Graph Search Service for VMEC Healthcare.
Executes sub-millisecond Cypher traversals on embedded clinical property graph (22,275 symptom nodes, 18 specialties, 3 risk classes).
"""

from __future__ import annotations

import logging
import os
import re
import time
from dataclasses import dataclass, field
from typing import Any

import kuzu

from src.config import Settings, get_settings

logger = logging.getLogger("vmec.services.graph_search")

SPECIALTY_NAMES: dict[str, str] = {
    "TIM_MACH": "Khoa Tim Mạch",
    "THAN_KINH": "Khoa Nội Thần Kinh",
    "TIEU_HOA": "Khoa Tiêu Hóa - Gan Mật",
    "HO_HAP": "Khoa Hô Hấp",
    "CO_XUONG_KHOP": "Khoa Cơ Xương Khớp",
    "LAO_KHOA": "Khoa Lão Khoa",
    "NOI_TIET": "Khoa Nội Tiết - Đái Tháo Đường",
    "CAP_CUU": "Khoa Cấp Cứu 115",
    "MAT": "Khoa Mắt",
    "THAN_TIET_NIEU": "Khoa Thận - Tiết Niệu",
    "TAM_THAN": "Khoa Sức Khỏe Tâm Thần",
    "TAI_MUI_HONG": "Khoa Tai Mũi Họng",
    "NOI_TONG_QUAT": "Khoa Khám Bệnh Đa Khoa",
    "DA_LIEU": "Khoa Da Liễu",
    "SAN_PHU_KHOA": "Khoa Sản Phụ Khoa",
    "NHI_KHOA": "Khoa Nhi",
    "RANG_HAM_MAT": "Khoa Răng Hàm Mặt",
    "TRUYEN_NHIEM": "Khoa Bệnh Nhiệt Đới & Truyền Nhiễm",
}

STOPWORDS = {
    "tôi", "bị", "và", "là", "các", "những", "một", "nhiều", "có", "không", "khi",
    "trong", "trên", "dưới", "sau", "trước", "của", "cho", "đến", "với", "như",
    "được", "do", "tại", "ra", "vào", "theo", "người", "bệnh", "nhân", "rất", "hơi",
    "thấy", "cảm", "thấy", "ngày", "hôm", "nay", "qua", "vừa"
}


@dataclass(frozen=True)
class GraphSearchResult:
    top_specialty_code: str
    top_specialty_name: str
    confidence: float
    specialty_scores: dict[str, float] = field(default_factory=dict)
    matched_symptoms: list[str] = field(default_factory=list)
    is_emergency: bool = False
    emergency_probability: float = 0.0
    subgraph_paths: list[str] = field(default_factory=list)
    latency_ms: float = 0.0


class GraphSearchClient:
    """
    Client for traversing the embedded Kùzu Clinical Property Graph.
    """

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._db: kuzu.Database | None = None
        self._conn: kuzu.Connection | None = None
        self._db_path = self._resolve_db_path()

    def _resolve_db_path(self) -> str:
        raw_path = self.settings.graph_db_path
        if os.path.isabs(raw_path):
            return raw_path

        # Try relative from current working dir or project root
        candidates = [
            os.path.abspath(raw_path),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/kuzu_clinical_graph")),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend/data/kuzu_clinical_graph")),
        ]
        for c in candidates:
            if os.path.exists(c):
                return c
        return candidates[0]

    def _ensure_connected(self) -> bool:
        if self._conn is not None:
            return True

        if not os.path.exists(self._db_path):
            logger.warning("Kùzu graph database not found at '%s'. Graph search will use fallback.", self._db_path)
            return False

        try:
            self._db = kuzu.Database(self._db_path)
            self._conn = kuzu.Connection(self._db)
            logger.info("Connected to Kùzu Clinical Knowledge Graph at %s", self._db_path)
            return True
        except Exception as ex:
            logger.error("Failed to initialize Kùzu connection at '%s': %s", self._db_path, ex)
            return False

    def extract_ngrams(self, text: str) -> list[str]:
        """
        Extracts 1-gram to 4-gram phrases from clinical text for graph node matching.
        """
        cleaned = re.sub(r"[^\w\s\d]", " ", text.lower())
        words = [w.strip() for w in cleaned.split() if w.strip()]
        
        ngrams: list[str] = []
        n_words = len(words)
        for n in range(1, min(5, n_words + 1)):
            for i in range(n_words - n + 1):
                phrase = " ".join(words[i : i + n])
                if len(phrase) >= 3 and phrase not in STOPWORDS:
                    ngrams.append(phrase)

        # Prioritize longer multi-word phrases first for better specificity
        ngrams.sort(key=lambda s: len(s), reverse=True)
        return ngrams[:30]

    def search(self, query: str, top_k: int = 5) -> GraphSearchResult:
        """
        Executes sub-millisecond Cypher traversal across symptoms and specialties.
        """
        start_time = time.perf_counter()

        if not self._ensure_connected() or not self._conn:
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            return GraphSearchResult(
                top_specialty_code="NOI_TONG_QUAT",
                top_specialty_name="Khoa Khám Bệnh Đa Khoa",
                confidence=0.70,
                latency_ms=elapsed_ms,
            )

        ngrams = self.extract_ngrams(query)
        if not ngrams:
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            return GraphSearchResult(
                top_specialty_code="NOI_TONG_QUAT",
                top_specialty_name="Khoa Khám Bệnh Đa Khoa",
                confidence=0.70,
                latency_ms=elapsed_ms,
            )

        # Build Cypher WHERE predicate for n-grams (escape single quotes)
        safe_terms = [ng.replace("'", "\\'") for ng in ngrams]
        where_parts = [f"s.normalized_name CONTAINS '{term}'" for term in safe_terms]
        where_clause = " OR ".join(where_parts)

        # 1. Specialty Traversal Query
        cypher_specialty = f"""
            MATCH (s:Symptom)-[r:INDICATES]->(sp:Specialty)
            WHERE {where_clause}
            RETURN sp.code, sp.name, sum(r.weight) AS score, sum(r.frequency) AS total_freq
            ORDER BY score DESC
            LIMIT {top_k}
        """

        scores: dict[str, float] = {}
        top_code = "NOI_TONG_QUAT"
        top_name = "Khoa Khám Bệnh Đa Khoa"

        try:
            res_spec = self._conn.execute(cypher_specialty)
            first = True
            while res_spec.has_next():
                row = res_spec.get_next()
                code, name, score_val, _ = row[0], row[1], float(row[2]), row[3]
                scores[code] = score_val
                if first:
                    top_code = code
                    top_name = name
                    first = False
        except Exception as ex:
            logger.error("Error executing specialty traversal Cypher query: %s", ex)

        # 2. Emergency Risk Check Query
        cypher_risk = f"""
            MATCH (s:Symptom)-[r:HAS_RISK]->(rl:RiskLevel)
            WHERE ({where_clause}) AND rl.code = 'EMERGENCY'
            RETURN sum(r.frequency) AS em_freq, avg(r.emergency_weight) AS avg_em_weight
        """
        is_emergency = False
        em_prob = 0.0
        try:
            res_risk = self._conn.execute(cypher_risk)
            if res_risk.has_next():
                r = res_risk.get_next()
                em_freq = r[0] if r[0] is not None else 0
                em_prob = float(r[1]) if r[1] is not None else 0.0
                if em_freq >= 5 and em_prob >= 0.70:
                    is_emergency = True
        except Exception as ex:
            logger.error("Error executing risk traversal Cypher query: %s", ex)

        # Calculate confidence based on margin between top and runner-up
        if scores:
            sorted_scores = sorted(scores.values(), reverse=True)
            top_sc = sorted_scores[0]
            runner_up_sc = sorted_scores[1] if len(sorted_scores) > 1 else 0.0
            
            margin = (top_sc - runner_up_sc) / max(1.0, top_sc)
            confidence = min(0.98, 0.80 + 0.18 * margin)
        else:
            confidence = 0.70

        # Build explainability lineage
        subgraph_paths = []
        for code, sc in list(scores.items())[:3]:
            sp_display = SPECIALTY_NAMES.get(code, code)
            subgraph_paths.append(f"[:INDICATES]->({code}: {sp_display}) [Trọng số: {sc:.2f}]")

        elapsed_ms = (time.perf_counter() - start_time) * 1000

        logger.info(
            "Kùzu Graph traversal completed in %.2f ms -> Top: %s (%s, conf=%.2f, em=%s)",
            elapsed_ms,
            top_code,
            top_name,
            confidence,
            is_emergency,
        )

        return GraphSearchResult(
            top_specialty_code=top_code,
            top_specialty_name=top_name,
            confidence=confidence,
            specialty_scores=scores,
            matched_symptoms=ngrams[:5],
            is_emergency=is_emergency,
            emergency_probability=em_prob,
            subgraph_paths=subgraph_paths,
            latency_ms=elapsed_ms,
        )


_graph_client_instance: GraphSearchClient | None = None


def get_graph_client() -> GraphSearchClient:
    global _graph_client_instance
    if _graph_client_instance is None:
        _graph_client_instance = GraphSearchClient()
    return _graph_client_instance
