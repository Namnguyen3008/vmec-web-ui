"""
Node 26: Fallback Response Node.
Handles non-clinical OTHER intent conversation, thanks, goodbyes, and social banter.
"""

from typing import Any
from src.agents.state import AgentState

FALLBACK_RESPONSES = [
    "Rất vui được hỗ trợ bạn! Nếu bạn có bất kỳ câu hỏi nào về sức khỏe hoặc cần hướng dẫn đặt lịch khám tại VMEC, đừng ngần ngại nhắn cho tôi nhé.",
    "Cảm ơn bạn đã tin tưởng Hệ thống Y tế VMEC. Chúc bạn luôn dồi dào sức khỏe và một ngày tràn đầy năng lượng!",
    "Tôi luôn sẵn sàng hỗ trợ bạn khi cần tư vấn sức khỏe hoặc thông tin chuyên khoa. Chúc bạn một ngày tốt lành!",
]


async def fallback_node(state: AgentState) -> dict[str, Any]:
    user_msg = state.get("user_message", "").lower()
    audit_events = list(state.get("audit_events", []))

    if any(kw in user_msg for kw in ["cảm ơn", "cam on", "thanks", "thank"]):
        response = "Dạ, không có gì ạ! Rất vui được đồng hành và hỗ trợ bạn. Chúc bạn luôn nhiều sức khỏe và bình an nhé!"
    elif any(kw in user_msg for kw in ["tạm biệt", "tam biet", "bye"]):
        response = "Tạm biệt bạn! Hẹn gặp lại bạn khi cần hỗ trợ y tế. Chúc bạn một ngày thật vui vẻ!"
    else:
        response = FALLBACK_RESPONSES[0]

    audit_events.append({
        "event": "FALLBACK_RESPONSE_GENERATED",
        "intent": state.get("intent", "OTHER"),
        "user_message": state.get("user_message", ""),
    })

    return {
        "response": response,
        "halt": True,
        "audit_events": audit_events,
    }
