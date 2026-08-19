import pytest
from src.agents.nodes.workflow_check_node import workflow_check_node, classify_workflow_action
from src.agents.state import AgentState


@pytest.mark.asyncio
async def test_workflow_check_no_active_workflow():
    state: AgentState = {
        "session_id": "sess_1",
        "user_id": "user_1",
        "active_workflow": "",
        "user_message": "Tôi bị đau đầu 3 ngày nay",
    }
    result = await workflow_check_node(state)
    assert result.get("workflow_action") == "NONE"
    assert result.get("active_workflow") == ""


@pytest.mark.asyncio
async def test_workflow_check_continue_triage():
    state: AgentState = {
        "session_id": "sess_1",
        "user_id": "user_1",
        "active_workflow": "TRIAGE",
        "user_message": "Đau nhức từng cơn, không sốt",
    }
    result = await workflow_check_node(state)
    assert result.get("workflow_action") == "CONTINUE"
    assert result.get("active_workflow") == "TRIAGE"


@pytest.mark.asyncio
async def test_workflow_check_cancel_workflow():
    state: AgentState = {
        "session_id": "sess_1",
        "user_id": "user_1",
        "active_workflow": "TRIAGE",
        "user_message": "Thôi tôi không muốn tư vấn nữa, dừng lại đi",
    }
    result = await workflow_check_node(state)
    assert result.get("workflow_action") == "CANCEL"
    assert result.get("active_workflow") == ""
    assert "đã dừng" in result.get("response", "").lower() or result.get("halt") is True


@pytest.mark.asyncio
async def test_workflow_check_interrupt_workflow():
    state: AgentState = {
        "session_id": "sess_1",
        "user_id": "user_1",
        "active_workflow": "TRIAGE",
        "user_message": "Cho tôi xem danh sách bác sĩ chuyên khoa tim mạch trước đã",
    }
    result = await workflow_check_node(state)
    assert result.get("workflow_action") == "INTERRUPT"
