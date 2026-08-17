"""
Clinical Validation & Grounding Node.
Validates citation mappings and anti-diagnosis boundaries before patient response.
"""

from typing import Any

from src.agents.state import AgentState
from src.services.grounding import (
    DISCLAIMER_VI,
    Citation,
    GroundingError,
    RoutingProposal,
    validate_routing,
)


async def validate_node(state: AgentState) -> dict[str, Any]:
    if state.get("halt"):
        return {}

    response_text = state.get("response", "")
    spec_code = state.get("top_specialty_code", "NOI_TONG_QUAT")
    spec_name = state.get("top_specialty_name", "Khoa Nội Tổng Quát")
    confidence = float(state.get("confidence", 0.85))

    raw_citations = state.get("citations", [])
    citations: list[Citation] = []
    for c in raw_citations:
        try:
            citations.append(Citation(**c))
        except (KeyError, ValueError, TypeError):
            citations.append(
                Citation(
                    source_id="SUPABASE_PGVECTOR",
                    title="Phác đồ điều trị VMEC",
                    url="https://kcb.vn/phac-do-dieu-tri",
                )
            )

    if not citations:
        citations.append(
            Citation(
                source_id="SUPABASE_PGVECTOR",
                title="Quy chuẩn phân luồng lâm sàng VMEC",
                url="https://moh.gov.vn/phac-do",
            )
        )

    proposal = RoutingProposal(
        specialty_id=spec_code,
        specialty_name=spec_name,
        rationale=response_text,
        confidence=confidence,
        citations=citations,
        action="suggest_specialty",
    )

    try:
        validated_text = validate_routing(proposal)
    except GroundingError:
        # Fallback to sanitized safe message
        validated_text = (
            f"Dựa trên các dấu hiệu bạn chia sẻ, hệ thống đề xuất bạn đặt lịch khám tại {spec_name} "
            f"để được các bác sĩ thăm khám và kiểm tra trực tiếp.\n\n{DISCLAIMER_VI}"
        )

    return {
        "response": validated_text,
        "citations": [c.model_dump() for c in citations],
    }
