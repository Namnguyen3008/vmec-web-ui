"""
Node 25: Limited Safe Medical Response Node.
Provides a strictly bounded and safe clinical advisory when RAG knowledge retrieval is disabled or offline.
"""

from typing import Any
from src.agents.state import AgentState

SAFE_MEDICAL_RESPONSE_TEMPLATE = (
    "Hiện tại hệ thống tri thức y khoa chuyên sâu đang tạm thời được bảo trì và cập nhật dữ liệu chuẩn của Bộ Y Tế.\n\n"
    "Đối với các triệu chứng bạn vừa chia sẻ, để đảm bảo an toàn tuyệt đối cho sức khỏe, "
    "bạn nên đến cơ sở y tế gần nhất hoặc liên hệ đặt lịch khám trực tiếp với bác sĩ chuyên khoa "
    "để được thăm khám lâm sàng và thực hiện các xét nghiệm cần thiết.\n\n"
    "*Lưu ý: Khuyến cáo trên chỉ mang tính chất định hướng an toàn, không thay thế cho chẩn đoán y khoa chính thức.*"
)


async def limited_safe_response_node(state: AgentState) -> dict[str, Any]:
    audit_events = list(state.get("audit_events", []))

    audit_events.append({
        "event": "LIMITED_SAFE_RESPONSE_TRIGGERED",
        "reason": "RAG disabled or knowledge base unreachable",
        "user_message": state.get("user_message", ""),
    })

    return {
        "response": SAFE_MEDICAL_RESPONSE_TEMPLATE,
        "halt": True,
        "audit_events": audit_events,
    }
