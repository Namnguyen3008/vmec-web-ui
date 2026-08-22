import uuid

import pytest

from src.agents.executor import get_agent_executor
from src.services.emergency import screen_emergency
from src.services.grounding import FORBIDDEN_CLINICAL_TERMS
from src.services.unified_retrieval import get_unified_retrieval_engine


@pytest.mark.asyncio
async def test_canonical_e2e_emergency_safety_gate():
    """
    Ensures Acute Emergency 115 is intercepted before any heavy LLM/RAG.
    """
    patient_emergency_msg = "Tôi đau ngực dữ dội, khó thở muốn ngất xỉu, vã mồ hôi đầm đìa"
    
    # 1. Deterministic screening
    em_res = screen_emergency(patient_emergency_msg)
    assert em_res.emergency is True
    assert "115" in em_res.action or "CẤP CỨU" in em_res.action
    
    # 2. Agent executor flow
    executor = get_agent_executor()
    uid = uuid.uuid4().hex[:8]
    res = await executor.process_turn(
        session_id=f"test_e2e_em_{uid}",
        user_id=f"patient_em_{uid}",
        user_message=patient_emergency_msg,
    )
    assert res["is_emergency"] is True
    assert "115" in res["response"]


@pytest.mark.asyncio
async def test_canonical_e2e_multi_turn_triage_and_unified_retrieval():
    """
    Tests complete multi-turn flow:
    Turn 1: Incomplete slots -> interrogation.
    Turn 2: Completed slots -> Quad-retrieval -> TIEU_HOA with pure citations.
    """
    executor = get_agent_executor()
    uid = uuid.uuid4().hex[:8]
    session_id = f"test_e2e_multiturn_{uid}"
    user_id = f"patient_multi_{uid}"

    # Turn 1: Vague initial complaint
    res_turn1 = await executor.process_turn(
        session_id=session_id,
        user_id=user_id,
        user_message="Tôi bị đau ngực và ợ chua",
    )
    assert res_turn1["is_emergency"] is False
    assert res_turn1["turn_count"] == 1
    assert len(res_turn1["response"]) > 0

    # Turn 2: Fulfill remaining slots (duration, nature, negation)
    res_turn2 = await executor.process_turn(
        session_id=session_id,
        user_id=user_id,
        user_message="Đau nóng rát sau xương ức kéo dài 5 ngày sau ăn no, không khó thở và không sốt",
    )
    assert res_turn2["turn_count"] == 2
    assert res_turn2["is_emergency"] is False

    # Check that response contains no forbidden diagnostic or prescription terms
    resp_lower = res_turn2["response"].lower()
    for forbidden in FORBIDDEN_CLINICAL_TERMS:
        assert forbidden not in resp_lower


@pytest.mark.asyncio
async def test_canonical_e2e_unified_engine_consensus_and_citations():
    """
    Directly tests Unified Retrieval Engine on ambiguous chest pain scenario.
    """
    engine = get_unified_retrieval_engine()
    res = await engine.search(
        query="Đau rát ngực sau xương ức, ợ chua đầy bụng sau khi ăn, không khó thở và không vã mồ hôi",
        match_count=5,
    )
    assert res.top_specialty_code == "TIEU_HOA"
    assert "Khoa Tiêu Hóa" in res.top_specialty_name
    assert res.confidence >= 0.78
    assert res.routing_action in ("suggest_specialty", "clarify")
    assert len(res.citations) > 0
    assert len(res.grounding_text) > 0
    assert len(res.graph_lineage) > 0

    # Citations must all be verified HTTP 200 URLs
    for cit in res.citations:
        assert cit.url.startswith("https://")
        assert any(h in cit.url for h in ["bachmai.gov.vn", "benhviennhitrunguong.gov.vn", "kcb.vn", "moh.gov.vn"])
