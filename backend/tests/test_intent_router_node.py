import pytest
from src.agents.nodes.intent_router_node import intent_router_node, classify_intent
from src.agents.state import AgentState


@pytest.mark.asyncio
async def test_intent_router_medical_symptom():
    state: AgentState = {
        "session_id": "sess_1",
        "user_id": "user_1",
        "user_message": "Tôi bị đau quặn bụng dưới và buồn nôn",
    }
    result = await intent_router_node(state)
    assert result.get("intent") == "MEDICAL"
    assert any(e.get("event") == "INTENT_CLASSIFIED" for e in result.get("audit_events", []))


@pytest.mark.asyncio
async def test_intent_router_catalog_query():
    state: AgentState = {
        "session_id": "sess_1",
        "user_id": "user_1",
        "user_message": "Cho tôi tìm bác sĩ chuyên khoa tiêu hóa và xem lịch khám ngày mai",
    }
    result = await intent_router_node(state)
    assert result.get("intent") == "CATALOG"


@pytest.mark.asyncio
async def test_intent_router_other_chitchat():
    state: AgentState = {
        "session_id": "sess_1",
        "user_id": "user_1",
        "user_message": "Cảm ơn bác sĩ nhiều nhé, thông tin rất hữu ích",
    }
    result = await intent_router_node(state)
    assert result.get("intent") == "OTHER"
