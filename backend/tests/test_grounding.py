import pytest

from src.services.grounding import (
    DISCLAIMER_VI,
    Citation,
    GroundingError,
    RoutingProposal,
    validate_routing,
)


def test_valid_routing_proposal_passes():
    proposal = RoutingProposal(
        specialty_id="TIM_MACH",
        specialty_name="Khoa Tim Mạch",
        rationale="Bệnh nhân có triệu chứng đau tức ngực khi gắng sức, phù hợp thăm khám chuyên khoa Tim Mạch.",
        confidence=0.88,
        citations=[
            Citation(
                source_id="SUPABASE_PGVECTOR",
                document_id="DOC_TIM_01",
                title="Phác đồ Tim Mạch Bộ Y Tế",
                url="https://moh.gov.vn/phac-do-tim-mach",
                section_title="Tiêu chuẩn tiếp nhận",
                confidence=95.0,
            )
        ],
        action="suggest_specialty",
    )
    result = validate_routing(proposal)
    assert DISCLAIMER_VI in result
    assert "Tim Mạch" in result


def test_routing_missing_citation_fails():
    with pytest.raises(
        ValueError, match="requires a valid specialty_id and at least one citation"
    ):
        RoutingProposal(
            specialty_id="TIM_MACH",
            rationale="Khám tim mạch nhé",
            confidence=0.90,
            citations=[],
            action="suggest_specialty",
        )


def test_routing_with_forbidden_diagnostic_term_rejected():
    proposal = RoutingProposal(
        specialty_id="TIM_MACH",
        rationale="Tôi chẩn đoán xác định bạn bị nhồi máu cơ tim và kê đơn thuốc aspirin.",
        confidence=0.95,
        citations=[
            Citation(
                source_id="SUPABASE_PGVECTOR",
                title="Phác đồ Tim Mạch",
                url="https://moh.gov.vn/phac-do",
            )
        ],
        action="suggest_specialty",
    )
    with pytest.raises(GroundingError, match="forbidden diagnostic term"):
        validate_routing(proposal)


def test_routing_with_untrusted_url_rejected():
    proposal = RoutingProposal(
        specialty_id="TIM_MACH",
        rationale="Khám tim mạch dựa trên bài viết diễn đàn.",
        confidence=0.85,
        citations=[
            Citation(
                source_id="UNTRUSTED",
                title="Blog sức khỏe rác",
                url="https://hack-health-fake-news.xyz/article",
            )
        ],
        action="suggest_specialty",
    )
    with pytest.raises(GroundingError, match="untrusted public host"):
        validate_routing(proposal)
