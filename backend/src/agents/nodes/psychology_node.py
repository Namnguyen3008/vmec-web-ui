"""
Psychology & Appointment Offers Node.
Generates PEARLS empathy soothing payload and available appointment slots for booking.
"""

from dataclasses import asdict
from datetime import datetime, timedelta, timezone
from typing import Any

from src.agents.state import AgentState
from src.services.psychology import generate_psychological_soothing

DOCTOR_DIRECTORY: dict[str, dict[str, str]] = {
    "TIM_MACH": {
        "name": "GS.TS Nguyễn Văn A",
        "id": "DOC_TIM_01",
        "room": "P.302 - Tòa A",
    },
    "TIEU_HOA": {
        "name": "PGS.TS Trần Thị B",
        "id": "DOC_TH_01",
        "room": "P.205 - Tòa B",
    },
    "NHI_KHOA": {
        "name": "BS.CKII Lê Văn C",
        "id": "DOC_NK_01",
        "room": "P.108 - Tòa C",
    },
    "THAN_KINH": {
        "name": "BS.CKII Phạm Thị D",
        "id": "DOC_TK_01",
        "room": "P.401 - Tòa A",
    },
    "CO_XUONG_KHOP": {
        "name": "TS.BS Hoàng Văn E",
        "id": "DOC_CXK_01",
        "room": "P.201 - Tòa A",
    },
    "NOI_TONG_QUAT": {
        "name": "BS.CKI Vũ Thị F",
        "id": "DOC_NTQ_01",
        "room": "P.101 - Tòa A",
    },
}


async def psychology_node(state: AgentState) -> dict[str, Any]:
    if state.get("halt"):
        return {}

    spec_code = state.get("top_specialty_code", "NOI_TONG_QUAT")
    spec_name = state.get("top_specialty_name", "Khoa Nội Tổng Quát")
    doc_info = DOCTOR_DIRECTORY.get(spec_code, DOCTOR_DIRECTORY["NOI_TONG_QUAT"])

    # 1. Generate PEARLS Empathy Payload
    soothing = generate_psychological_soothing(
        specialty_code=spec_code,
        specialty_name=spec_name,
        doctor_name=doc_info["name"],
    )

    # 2. Generate 3 appointment slot offers for tomorrow
    tomorrow = datetime.now(timezone.utc) + timedelta(days=1)
    slot_hours = [(8, 30), (10, 0), (14, 30)]
    offers = []
    for idx, (h, m) in enumerate(slot_hours, 1):
        st = tomorrow.replace(hour=h, minute=m, second=0, microsecond=0)
        et = st + timedelta(minutes=30)
        offers.append(
            {
                "offer_id": f"OFFER_{spec_code}_{idx}",
                "doctor_id": doc_info["id"],
                "doctor_name": doc_info["name"],
                "specialty_code": spec_code,
                "specialty_name": spec_name,
                "room": doc_info["room"],
                "start_time": st.isoformat(),
                "end_time": et.isoformat(),
                "consultation_fee": 350000,
            }
        )

    return {
        "soothing_payload": asdict(soothing),
        "appointment_offers": offers,
        "halt": True,
    }
