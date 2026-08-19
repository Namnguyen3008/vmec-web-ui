import pytest
from unittest.mock import AsyncMock, patch
from src.agents.nodes.fallback_node import fallback_node
from src.agents.nodes.limited_safe_response_node import limited_safe_response_node
from src.agents.nodes.commit_audit_node import commit_audit_node
from src.agents.state import AgentState


@pytest.mark.asyncio
async def test_fallback_node_other_intent():
    state: AgentState = {
        "session_id": "sess_1",
        "user_id": "user_1",
        "user_message": "Cảm ơn bạn rất nhiều!",
        "intent": "OTHER",
    }
    result = await fallback_node(state)
    assert result.get("halt") is True
    assert len(result.get("response", "")) > 10
    assert any(e.get("event") == "FALLBACK_RESPONSE_GENERATED" for e in result.get("audit_events", []))


@pytest.mark.asyncio
async def test_limited_safe_response_node():
    state: AgentState = {
        "session_id": "sess_1",
        "user_id": "user_1",
        "user_message": "Tôi đau bụng quá",
        "rag_enabled": False,
    }
    result = await limited_safe_response_node(state)
    assert result.get("halt") is True
    assert "bác sĩ" in result.get("response", "").lower()
    assert any(e.get("event") == "LIMITED_SAFE_RESPONSE_TRIGGERED" for e in result.get("audit_events", []))


@pytest.mark.asyncio
async def test_commit_audit_node():
    state: AgentState = {
        "session_id": "sess_test_audit",
        "user_id": "user_test_audit",
        "intent": "MEDICAL",
        "urgency": "ROUTINE",
        "audit_events": [
            {"event": "INPUT_VALIDATED", "status": "OK"},
            {"event": "TRIAGE_COMPLETED", "slots_count": 4},
        ],
    }
    with patch("src.agents.nodes.commit_audit_node.get_audit_repository") as mock_repo_getter:
        mock_repo = AsyncMock()
        mock_repo.log_event.return_value = True
        mock_repo_getter.return_value = mock_repo

        result = await commit_audit_node(state)
        assert result.get("halt") is True or "audit_committed" in result
        assert mock_repo.log_event.call_count == 2
