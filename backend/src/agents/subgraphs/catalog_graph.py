"""
CatalogGraph Subgraph (Nodes 15, 16, 17).
Handles hospital service directory inquiries, doctor searches, specialty listings, and slot lookups.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Literal
from langgraph.graph import END, START, StateGraph

from src.agents.nodes.psychology_node import DOCTOR_DIRECTORY
from src.agents.state import AgentState
from src.config import get_settings

SPECIALTY_NAME_MAP: dict[str, str] = {
    "TIM_MACH": "Khoa Tim Mạch Can Thiệp",
    "TIEU_HOA": "Khoa Tiêu Hóa - Gan Mật",
    "NHI_KHOA": "Khoa Nhi & Sơ Sinh",
    "THAN_KINH": "Khoa Thần Kinh",
    "CO_XUONG_KHOP": "Khoa Cơ Xương Khớp",
    "NOI_TONG_QUAT": "Khoa Nội Tổng Quát",
}

SPECIALTY_KEYWORD_PATTERNS: dict[str, list[str]] = {
    "TIM_MACH": ["tim", "tim mạch", "huyết áp", "mạch vành", "nhịp tim"],
    "TIEU_HOA": ["tiêu hóa", "dạ dày", "gan", "mật", "đại tràng", "trực tràng"],
    "NHI_KHOA": ["nhi", "trẻ em", "em bé", "sơ sinh", "bé"],
    "THAN_KINH": ["thần kinh", "tiền đình", "đau đầu mạn tính", "não"],
    "CO_XUONG_KHOP": ["xương", "khớp", "cột sống", "thoái hóa", "gút"],
    "NOI_TONG_QUAT": ["nội", "tổng quát", "khám chung", "tổng hợp"],
}


def find_matching_specialty(user_message: str) -> str:
    text_lower = user_message.lower()
    for spec_code, keywords in SPECIALTY_KEYWORD_PATTERNS.items():
        if any(kw in text_lower for kw in keywords):
            return spec_code
    return "NOI_TONG_QUAT"


async def catalog_lookup_node(state: AgentState) -> dict[str, Any]:
    user_message = state.get("user_message", "")
    audit_events = list(state.get("audit_events", []))

    spec_code = find_matching_specialty(user_message)
    spec_name = SPECIALTY_NAME_MAP.get(spec_code, "Khoa Nội Tổng Quát")
    doc_info = DOCTOR_DIRECTORY.get(spec_code, DOCTOR_DIRECTORY["NOI_TONG_QUAT"])

    # Check if asking for general directory
    is_general_list = any(kw in user_message.lower() for kw in ["danh sách", "tất cả", "các khoa", "bảng giá"])

    if is_general_list:
        lines = [
            "### 🏥 Danh Mục Bác Sĩ & Chuyên Khoa Bệnh Viện VMEC\n",
            "Dưới đây là danh sách các chuyên khoa và bác sĩ phụ trách tiếp nhận khám trực tiếp:\n",
        ]
        for sc, info in DOCTOR_DIRECTORY.items():
            s_name = SPECIALTY_NAME_MAP.get(sc, sc)
            lines.append(f"- **{s_name}**: {info['name']} ({info['room']}) — Phí khám: 350.000 VNĐ")
        lines.append("\n*Bạn có thể chọn một trong các khung giờ dưới đây để hoàn tất giữ chỗ khám.*")
        response_text = "\n".join(lines)
    else:
        response_text = (
            f"### 👨‍⚕️ Thông Tin Bác Sĩ Chuyên Khoa ({spec_name})\n\n"
            f"- **Bác sĩ phụ trách:** {doc_info['name']}\n"
            f"- **Chuyên khoa:** {spec_name}\n"
            f"- **Phòng khám:** {doc_info['room']}\n"
            f"- **Giá khám:** 350.000 VNĐ / lượt\n\n"
            f"Hệ thống đã chuẩn bị sẵn 3 khung giờ khám gần nhất vào ngày mai dưới đây. "
            f"Bạn vui lòng nhấn chọn giờ phù hợp để tiếp tục giữ chỗ nhé!"
        )

    # Generate 3 appointment slots
    tomorrow = datetime.now(timezone.utc) + timedelta(days=1)
    slot_hours = [(8, 30), (10, 0), (14, 30)]
    offers = []
    for idx, (h, m) in enumerate(slot_hours, 1):
        st = tomorrow.replace(hour=h, minute=m, second=0, microsecond=0)
        et = st + timedelta(minutes=30)
        offers.append({
            "offer_id": f"OFFER_CAT_{spec_code}_{idx}",
            "doctor_id": doc_info["id"],
            "doctor_name": doc_info["name"],
            "specialty_code": spec_code,
            "specialty_name": spec_name,
            "room": doc_info["room"],
            "start_time": st.isoformat(),
            "end_time": et.isoformat(),
            "consultation_fee": 350000,
        })

    audit_events.append({
        "event": "CATALOG_LOOKUP_COMPLETED",
        "specialty_code": spec_code,
        "is_general_list": is_general_list,
    })

    return {
        "response": response_text,
        "top_specialty_code": spec_code,
        "top_specialty_name": spec_name,
        "appointment_offers": offers,
        "active_workflow": "CATALOG",
        "halt": True,
        "audit_events": audit_events,
    }


def route_mcp_check(state: AgentState) -> Literal["catalog_lookup"]:
    # MCP catalog stubbed for future extension
    return "catalog_lookup"


def create_catalog_graph() -> Any:
    builder = StateGraph(AgentState)

    builder.add_node("catalog_lookup", catalog_lookup_node)

    builder.add_conditional_edges(START, route_mcp_check)
    builder.add_edge("catalog_lookup", END)

    return builder.compile()


catalog_graph = create_catalog_graph()
