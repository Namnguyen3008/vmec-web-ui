import pytest
from src.agents.nodes.input_validation_node import input_validation_node
from src.agents.state import AgentState


@pytest.mark.asyncio
async def test_input_validation_empty_message():
    state: AgentState = {
        "session_id": "sess_123",
        "user_id": "user_123",
        "user_message": "   ",
    }
    result = await input_validation_node(state)
    assert result.get("halt") is True
    assert "vui lòng nhập nội dung" in result.get("response", "").lower()
    assert any(e.get("event") == "INPUT_VALIDATION_FAILED" for e in result.get("audit_events", []))


@pytest.mark.asyncio
async def test_input_validation_too_long_message():
    long_msg = "A" * 2500
    state: AgentState = {
        "session_id": "sess_123",
        "user_id": "user_123",
        "user_message": long_msg,
    }
    result = await input_validation_node(state)
    assert result.get("halt") is True
    assert "quá dài" in result.get("response", "").lower()
    assert any(e.get("event") == "INPUT_VALIDATION_FAILED" for e in result.get("audit_events", []))


@pytest.mark.asyncio
async def test_input_validation_missing_session_id():
    state: AgentState = {
        "session_id": "",
        "user_id": "user_123",
        "user_message": "Tôi bị đau đầu",
    }
    result = await input_validation_node(state)
    assert result.get("halt") is True
    assert any(e.get("event") == "INPUT_VALIDATION_FAILED" for e in result.get("audit_events", []))


@pytest.mark.asyncio
async def test_input_validation_valid_message():
    state: AgentState = {
        "session_id": "sess_123",
        "user_id": "user_123",
        "user_message": "Tôi bị đau tức ngực trái 2 ngày nay",
    }
    result = await input_validation_node(state)
    assert result.get("halt") is False
    assert result.get("user_message") == "Tôi bị đau tức ngực trái 2 ngày nay"
    assert result.get("sanitized_message") == "Tôi bị đau tức ngực trái 2 ngày nay"
