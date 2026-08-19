"""
Node 2: Input Validation Node.
Validates input format, non-emptiness, maximum character length, and session identification.
"""

from typing import Any
from src.agents.state import AgentState
from src.config import get_settings


async def input_validation_node(state: AgentState) -> dict[str, Any]:
    settings = get_settings()
    raw_message = state.get("user_message", "")
    session_id = state.get("session_id", "")
    user_id = state.get("user_id", "")
    audit_events = list(state.get("audit_events", []))

    # 1. Check Session & User identifiers
    if not session_id or not user_id:
        audit_events.append({
            "event": "INPUT_VALIDATION_FAILED",
            "reason": "Missing session_id or user_id",
        })
        return {
            "halt": True,
            "response": "Yêu cầu không hợp lệ. Vui lòng làm mới phiên làm việc.",
            "audit_events": audit_events,
        }

    # 2. Check empty or whitespace message
    cleaned_message = raw_message.strip()
    if not cleaned_message:
        audit_events.append({
            "event": "INPUT_VALIDATION_FAILED",
            "reason": "Empty message",
        })
        return {
            "halt": True,
            "response": "Vui lòng nhập nội dung câu hỏi hoặc triệu chứng bạn đang gặp phải.",
            "audit_events": audit_events,
        }

    # 3. Check message length
    max_len = getattr(settings, "input_max_length", 2000)
    if len(cleaned_message) > max_len:
        audit_events.append({
            "event": "INPUT_VALIDATION_FAILED",
            "reason": f"Message exceeded max length ({len(cleaned_message)} > {max_len})",
        })
        return {
            "halt": True,
            "response": f"Nội dung câu hỏi quá dài (tối đa {max_len} ký tự). Vui lòng tóm tắt ngắn gọn hơn.",
            "audit_events": audit_events,
        }

    # Valid input
    return {
        "user_message": cleaned_message,
        "sanitized_message": cleaned_message,
        "halt": False,
        "audit_events": audit_events,
    }
