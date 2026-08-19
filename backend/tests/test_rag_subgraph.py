import pytest
from unittest.mock import AsyncMock, patch
from src.agents.subgraphs.rag_graph import rag_graph
from src.agents.state import AgentState
from src.services.grounding import Citation
from src.services.vector_search import VectorSearchResult


@pytest.mark.asyncio
async def test_rag_graph_disabled_returns_limited_safe_response():
    state: AgentState = {
        "session_id": "sess_rag_off",
        "user_id": "user_rag_off",
        "user_message": "Tôi bị sốt phát ban",
        "rag_enabled": False,
    }
    result = await rag_graph.ainvoke(state)
    assert result.get("halt") is True
    assert "hệ thống tri thức y khoa" in result.get("response", "").lower() or "bác sĩ" in result.get("response", "").lower()


@pytest.mark.asyncio
async def test_rag_graph_enabled_full_pipeline():
    state: AgentState = {
        "session_id": "sess_rag_on",
        "user_id": "user_rag_on",
        "user_message": "Tôi đau ngực trái lan lên vai",
        "rag_enabled": True,
        "slots": [
            {"key": "chiefComplaint", "label": "Vị trí", "value": "Đau ngực trái", "status": "COMPLETED"},
            {"key": "characterTriggers", "label": "Tính chất", "value": "Đau thắt", "status": "COMPLETED"},
            {"key": "duration", "label": "Thời gian", "value": "2 ngày", "status": "COMPLETED"},
            {"key": "associatedSigns", "label": "Kèm theo", "value": "Khó thở", "status": "COMPLETED"},
        ],
        "atomic_facts": ["Đau ngực trái lan lên vai", "Khó thở khi gắng sức"],
        "progress_percent": 100,
    }

    mock_search_res = VectorSearchResult(
        top_specialty_code="TIM_MACH",
        top_specialty_name="Khoa Tim Mạch Can Thiệp",
        confidence=0.92,
        citations=[Citation(source_id="SUPABASE_PGVECTOR", title="Phác đồ Tim Mạch BYT", url="https://kcb.vn/tim-mach")],
        grounding_text="Chỉ định khám Tim Mạch",
    )

    with patch("src.agents.nodes.retrieve_node.get_vector_client") as mock_vc, \
         patch("src.agents.nodes.generate_node.get_llm_service") as mock_gen_llm:
        
        client_mock = AsyncMock()
        client_mock.search.return_value = mock_search_res
        mock_vc.return_value = client_mock

        gen_mock = AsyncMock()
        gen_mock.generate_json.return_value = {
            "synthesisText": "Dựa trên các dấu hiệu đau ngực trái lan lên vai, bạn nên khám chuyên khoa Tim Mạch.",
            "preliminaryTests": ["Điện tâm đồ (ECG)", "Siêu âm tim"],
            "preparationTips": ["Nghỉ ngơi, tránh gắng sức"],
        }
        mock_gen_llm.return_value = gen_mock

        result = await rag_graph.ainvoke(state)

        assert result.get("top_specialty_code") == "TIM_MACH"
        assert len(result.get("appointment_offers", [])) == 3
        assert result.get("soothing_payload") is not None
        assert "Tim Mạch" in result.get("response", "")
