"""
Node 5 & 6: Medical Relevance Check and Non-medical Response.
Evaluates whether user input is relevant to healthcare, symptoms, medical services, or general greetings.
"""

import re
from typing import Any
from src.agents.state import AgentState
from src.services.llm import get_llm_service

# Fast-path keywords for medical & hospital services
MEDICAL_KEYWORDS = [
    "đau", "sốt", "mệt", "khó thở", "ho", "tức ngực", "chóng mặt", "buồn nôn",
    "tiêu chảy", "nổi mẩn", "ngứa", "huyết áp", "tim", "phổi", "gan", "thận",
    "dạ dày", "xương", "khớp", "mắt", "tai", "mũi", "họng", "răng", "da",
    "bác sĩ", "bác sỹ", "khám", "chữa", "bệnh", "thuốc", "viện", "phòng khám",
    "chuyên khoa", "lịch", "đặt lịch", "tư vấn", "xét nghiệm", "siêu âm",
    "chụp", "chẩn đoán", "điều trị", "sức khỏe", "y tế", "cấp cứu", "115",
    "nhi", "sản", "phụ khoa", "nam khoa", "ung bướu", "tai mũi họng", "răng hàm mặt",
    "chào", "hello", "hi", "alo", "bạn ơi", "cho tôi hỏi", "cần giúp",
]

# Obvious non-medical domain keywords
NON_MEDICAL_KEYWORDS = [
    "thời tiết", "dự báo thời tiết", "mưa bão", "nhiệt độ ngoài trời",
    "bóng đá", "tỷ số", "world cup", "chứng khoán", "cổ phiếu", "bitcoin", "crypto",
    "nấu ăn", "công thức nấu", "món ngon", "viết code", "python", "javascript",
    "giải toán", "làm thơ", "kể chuyện cười",
]

MEDICAL_RELEVANCE_PROMPT = """Bạn là bộ phân loại ý định trong Hệ thống Trợ lý Y tế Bệnh viện VMEC.
Hãy xác định xem câu nói sau của người dùng có liên quan đến Y TẾ, SỨC KHỎE, TRIỆU CHỨNG, BÁC SĨ, LỊCH KHÁM, DỊCH VỤ BỆNH VIỆN hoặc LỜI CHÀO MỞ ĐẦU hay không.

Nội dung người dùng: "{user_message}"

Trả về định dạng JSON duy nhất:
{{
  "is_medical": true hoặc false,
  "reason": "Giải thích ngắn gọn"
}}
"""


async def check_medical_relevance(message: str) -> tuple[bool, str]:
    text_lower = message.lower().strip()

    # 1. Fast path: Obvious non-medical triggers
    for kw in NON_MEDICAL_KEYWORDS:
        if kw in text_lower and not any(med in text_lower for med in ["đau", "khám", "bệnh", "bác sĩ"]):
            return False, f"Matched non-medical keyword: {kw}"

    # 2. Fast path: Obvious medical keywords or greetings
    for kw in MEDICAL_KEYWORDS:
        if kw in text_lower:
            return True, f"Matched medical keyword: {kw}"

    # 3. Fallback: LLM Classification for ambiguous queries
    try:
        llm = get_llm_service()
        prompt = MEDICAL_RELEVANCE_PROMPT.format(user_message=message)
        result = await llm.generate_json(prompt)
        is_med = bool(result.get("is_medical", True))
        reason = str(result.get("reason", "LLM classified"))
        return is_med, reason
    except Exception:
        # Fail open to allow patient query through to triage
        return True, "Fallback allow"


async def medical_relevance_node(state: AgentState) -> dict[str, Any]:
    message = state.get("user_message", "")
    audit_events = list(state.get("audit_events", []))

    is_medical, reason = await check_medical_relevance(message)

    if not is_medical:
        audit_events.append({
            "event": "NON_MEDICAL_QUERY_REDIRECTED",
            "reason": reason,
            "query": message,
        })
        return {
            "is_medical": False,
            "halt": True,
            "response": (
                "Xin lỗi, hiện tại tôi là trợ lý y tế AI của Bệnh viện VMEC, "
                "chỉ hỗ trợ giải đáp các thắc mắc về sức khỏe, triệu chứng lâm sàng "
                "và hướng dẫn đặt lịch khám chuyên khoa. Bạn có thể chia sẻ tình trạng sức khỏe "
                "hoặc nhu cầu khám bệnh để tôi hỗ trợ nhé!"
            ),
            "audit_events": audit_events,
        }

    return {
        "is_medical": True,
        "halt": False,
        "audit_events": audit_events,
    }
