import pytest
from unittest.mock import AsyncMock, patch
from src.agents.nodes.medical_relevance_node import medical_relevance_node, check_medical_relevance
from src.agents.state import AgentState


@pytest.mark.asyncio
async def test_medical_relevance_clear_symptom():
    state: AgentState = {
        "session_id": "sess_1",
        "user_id": "user_1",
        "user_message": "Tôi bị sốt cao và đau nhức toàn thân 2 ngày nay",
    }
    result = await medical_relevance_node(state)
    assert result.get("is_medical") is True
    assert result.get("halt") is False


@pytest.mark.asyncio
async def test_medical_relevance_hospital_booking_query():
    state: AgentState = {
        "session_id": "sess_1",
        "user_id": "user_1",
        "user_message": "Cho tôi tìm bác sĩ tim mạch để đặt lịch khám",
    }
    result = await medical_relevance_node(state)
    assert result.get("is_medical") is True
    assert result.get("halt") is False


@pytest.mark.asyncio
async def test_medical_relevance_greeting():
    state: AgentState = {
        "session_id": "sess_1",
        "user_id": "user_1",
        "user_message": "Xin chào bác sĩ",
    }
    result = await medical_relevance_node(state)
    assert result.get("is_medical") is True
    assert result.get("halt") is False


@pytest.mark.asyncio
async def test_medical_relevance_non_medical_weather():
    state: AgentState = {
        "session_id": "sess_1",
        "user_id": "user_1",
        "user_message": "Hôm nay thời tiết Hà Nội thế nào, trời có mưa không?",
    }
    result = await medical_relevance_node(state)
    assert result.get("is_medical") is False
    assert result.get("halt") is True
    assert "chỉ hỗ trợ" in result.get("response", "").lower() or "sức khỏe" in result.get("response", "").lower()
    assert any(e.get("event") == "NON_MEDICAL_QUERY_REDIRECTED" for e in result.get("audit_events", []))
