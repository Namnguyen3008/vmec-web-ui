import pytest
from src.agents.subgraphs.catalog_graph import catalog_graph
from src.agents.state import AgentState


@pytest.mark.asyncio
async def test_catalog_graph_specific_specialty_search():
    state: AgentState = {
        "session_id": "sess_cat_1",
        "user_id": "user_cat_1",
        "user_message": "Cho tôi tìm bác sĩ chuyên khoa tim mạch",
        "intent": "CATALOG",
    }
    result = await catalog_graph.ainvoke(state)
    assert result.get("halt") is True
    assert result.get("top_specialty_code") == "TIM_MACH"
    assert "Tim Mạch" in result.get("response", "")
    assert len(result.get("appointment_offers", [])) == 3
    assert result.get("active_workflow") == "CATALOG"
    assert any(e.get("event") == "CATALOG_LOOKUP_COMPLETED" for e in result.get("audit_events", []))


@pytest.mark.asyncio
async def test_catalog_graph_general_directory():
    state: AgentState = {
        "session_id": "sess_cat_2",
        "user_id": "user_cat_2",
        "user_message": "Cho tôi xem danh sách tất cả các chuyên khoa và bác sĩ",
        "intent": "CATALOG",
    }
    result = await catalog_graph.ainvoke(state)
    assert result.get("halt") is True
    assert "Danh Mục Bác Sĩ" in result.get("response", "")
    assert len(result.get("appointment_offers", [])) == 3
