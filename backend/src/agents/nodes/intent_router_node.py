"""
Node 14: Intent Router Node.
Classifies user intent into CATALOG, MEDICAL, or OTHER.
"""

from typing import Any
from src.agents.state import AgentState
from src.services.llm import get_llm_service

CATALOG_KEYWORDS = [
    "tìm bác sĩ", "danh sách bác sĩ", "xem bác sĩ", "bác sĩ giỏi",
    "lịch khám", "xem lịch", "đặt lịch", "hẹn khám", "tìm slot", "đặt chỗ",
    "chuyên khoa", "danh mục khoa", "các khoa", "phòng khám",
    "bảng giá", "chi phí khám", "giá dịch vụ", "giờ làm việc", "địa chỉ bệnh viện",
]

OTHER_KEYWORDS = [
    "cảm ơn", "cam on", "thanks", "thank you", "tạm biệt", "tam biet",
    "bye", "hẹn gặp lại", "ok cảm ơn", "ok hiểu rồi", "tuyệt vời",
    "rất tốt", "chúc bạn", "chúc một ngày", "không có gì",
]

INTENT_CLASSIFICATION_PROMPT = """Bạn là bộ phân loại ý định (Intent Classifier) trong Hệ thống Y tế Bệnh viện VMEC.
Hãy phân loại câu nói của người dùng vào 1 trong 3 nhóm chính:
1. CATALOG: Người dùng muốn tra cứu danh mục, tìm bác sĩ, xem lịch khám, đặt lịch, xem chuyên khoa, bảng giá, cơ sở khám.
2. MEDICAL: Người dùng mô tả triệu chứng bệnh, hỏi về bệnh lý, thuốc, xét nghiệm, hoặc tư vấn sức khỏe.
3. OTHER: Người dùng cảm ơn, chào tạm biệt, khen ngợi hoặc trò chuyện xã giao thông thường.

Nội dung người dùng: "{user_message}"

Trả về định dạng JSON duy nhất:
{{
  "intent": "CATALOG" | "MEDICAL" | "OTHER",
  "confidence": 0.0 - 1.0,
  "reason": "Giải thích ngắn gọn"
}}
"""


async def classify_intent(message: str) -> tuple[str, float, str]:
    text_lower = message.lower().strip()

    # 1. Fast path: OTHER (thanks, goodbyes)
    if any(kw in text_lower for kw in OTHER_KEYWORDS) and not any(
        med in text_lower for med in ["đau", "sốt", "khám", "bác sĩ"]
    ):
        return "OTHER", 0.95, "Fast-path match: OTHER conversation"

    # 2. Fast path: CATALOG
    if any(kw in text_lower for kw in CATALOG_KEYWORDS) and not any(
        sym in text_lower for sym in ["tôi bị", "đau quặn", "sốt cao", "buồn nôn", "khó thở"]
    ):
        return "CATALOG", 0.95, "Fast-path match: CATALOG inquiry"

    # 3. Fast path: MEDICAL
    if any(sym in text_lower for sym in ["tôi bị", "đau", "sốt", "mệt", "khó thở", "ho", "tức ngực", "ngứa", "buồn nôn", "tiêu chảy"]):
        return "MEDICAL", 0.95, "Fast-path match: Clinical symptom"

    # 4. LLM Classification fallback
    try:
        llm = get_llm_service()
        prompt = INTENT_CLASSIFICATION_PROMPT.format(user_message=message)
        result = await llm.generate_json(prompt)
        intent = str(result.get("intent", "MEDICAL")).upper()
        if intent not in ["CATALOG", "MEDICAL", "OTHER"]:
            intent = "MEDICAL"
        confidence = float(result.get("confidence", 0.85))
        reason = str(result.get("reason", "LLM classified"))
        return intent, confidence, reason
    except Exception:
        # Default to MEDICAL to ensure patient symptom safety
        return "MEDICAL", 0.70, "Fallback to MEDICAL"


async def intent_router_node(state: AgentState) -> dict[str, Any]:
    message = state.get("user_message", "")
    audit_events = list(state.get("audit_events", []))

    intent, confidence, reason = await classify_intent(message)

    audit_events.append({
        "event": "INTENT_CLASSIFIED",
        "intent": intent,
        "confidence": confidence,
        "reason": reason,
    })

    return {
        "intent": intent,
        "audit_events": audit_events,
    }
