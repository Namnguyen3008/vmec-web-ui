"""
Node 12 & 13: Active Workflow Check and Workflow Message Router.
Evaluates in-flight workflow state and determines CONTINUE, INTERRUPT, or CANCEL routing.
"""

from typing import Any
from src.agents.state import AgentState

CANCEL_KEYWORDS = [
    "thôi", "dừng lại", "dừng", "hủy", "không muốn tư vấn", "không cần",
    "bỏ qua", "stop", "cancel", "kết thúc", "thoát", "không khám nữa",
]

INTERRUPT_KEYWORDS_FOR_TRIAGE = [
    "danh sách bác sĩ", "tìm bác sĩ", "xem bác sĩ", "đặt lịch khám",
    "bảng giá", "chi phí", "giờ làm việc", "địa chỉ bệnh viện",
]


async def classify_workflow_action(active_workflow: str, user_message: str) -> tuple[str, str]:
    if not active_workflow:
        return "NONE", "No active workflow"

    text_lower = user_message.lower().strip()

    # 1. Check CANCEL
    if any(kw in text_lower for kw in CANCEL_KEYWORDS):
        return "CANCEL", "User requested workflow cancellation"

    # 2. Check INTERRUPT
    if active_workflow == "TRIAGE":
        if any(kw in text_lower for kw in INTERRUPT_KEYWORDS_FOR_TRIAGE):
            return "INTERRUPT", "User switched topic away from triage"

    # 3. Default CONTINUE
    return "CONTINUE", f"User is continuing {active_workflow}"


async def workflow_check_node(state: AgentState) -> dict[str, Any]:
    active_workflow = state.get("active_workflow", "")
    message = state.get("user_message", "")
    audit_events = list(state.get("audit_events", []))

    action, reason = await classify_workflow_action(active_workflow, message)

    audit_events.append({
        "event": "WORKFLOW_ACTION_DETERMINED",
        "active_workflow": active_workflow,
        "workflow_action": action,
        "reason": reason,
    })

    if action == "CANCEL":
        return {
            "active_workflow": "",
            "workflow_action": "CANCEL",
            "halt": True,
            "response": "Đã dừng quy trình tư vấn hiện tại theo yêu cầu của bạn. Tôi có thể hỗ trợ gì khác cho bạn không?",
            "audit_events": audit_events,
        }

    return {
        "active_workflow": active_workflow,
        "workflow_action": action,
        "audit_events": audit_events,
    }
