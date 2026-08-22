import pytest

from src.services.unified_retrieval import (
    ClinicalQueryParser,
    UnifiedRetrievalEngine,
    get_unified_retrieval_engine,
)


def test_query_parser_negation_and_temporal():
    parser = ClinicalQueryParser()
    text = "Tôi bị đau tức ngực âm ỉ kéo dài 3 ngày, nhưng không sốt và không khó thở"
    parsed = parser.parse(text)
    
    assert "sốt" in parsed.negated_symptoms or any("sốt" in n for n in parsed.negated_symptoms)
    assert "khó thở" in parsed.negated_symptoms or any("khó thở" in n for n in parsed.negated_symptoms)
    assert len(parsed.temporal_cues) > 0
    assert len(parsed.severity_cues) > 0
    assert "đau tức ngực" in parsed.positive_text


def test_unified_retrieval_engine_initialization():
    engine = get_unified_retrieval_engine()
    assert engine is not None
    assert engine.reranker is not None


@pytest.mark.asyncio
async def test_unified_retrieval_cardio_emergency():
    engine = get_unified_retrieval_engine()
    res = await engine.search("Đau thắt lồng ngực dữ dội lan lên cổ vai trái, vã mồ hôi lạnh buốt")
    
    assert res.top_specialty_code in ("TIM_MACH", "CAP_CUU")
    assert res.confidence >= 0.78
    assert res.routing_action in ("suggest_specialty", "clarify")
    assert len(res.citations) > 0
    assert len(res.grounding_text) > 0
    assert res.total_latency_ms > 0
    assert "graph_traversal_ms" in res.latency_breakdown


@pytest.mark.asyncio
async def test_unified_retrieval_gastro_with_negation():
    engine = get_unified_retrieval_engine()
    # Chest area discomfort, but with reflux and WITHOUT breathlessness
    res = await engine.search("Đau rát vùng sau xương ức, ợ chua sau khi ăn no nhưng không khó thở, không vã mồ hôi")
    
    assert res.top_specialty_code == "TIEU_HOA"
    assert "Khoa Tiêu Hóa" in res.top_specialty_name
    assert len(res.citations) > 0
    # URLs must be valid trusted hospital/MOH domains
    for cit in res.citations:
        assert any(domain in cit.url for domain in ["bachmai.gov.vn", "kcb.vn", "benhviennhitrunguong.gov.vn", "moh.gov.vn"])


@pytest.mark.asyncio
async def test_unified_retrieval_dermatology():
    engine = get_unified_retrieval_engine()
    res = await engine.search("Mẩn ngứa nổi mề đay phát ban khắp tay chân")
    
    assert res.top_specialty_code == "DA_LIEU"
    assert "Khoa Da Liễu" in res.top_specialty_name
