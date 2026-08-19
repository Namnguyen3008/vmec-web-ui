"""
Grounding and Semantic Validation Service for VMEC Healthcare.
Ensures AI recommendations are anchored in verified medical evidence,
filters diagnostic/prescriptive claims, and verifies citation provenance.
"""

from __future__ import annotations

from typing import Final, Literal
from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, Field, model_validator

from src.config import DEFAULT_TRUSTED_PUBLIC_CITATION_HOSTS

DISCLAIMER_VI: Final[str] = (
    "Thông tin này chỉ hỗ trợ định hướng chuyên khoa và gợi ý đặt lịch khám, "
    "không thay thế chẩn đoán hoặc chỉ định điều trị trực tiếp của bác sĩ chuyên khoa."
)

FORBIDDEN_CLINICAL_TERMS: Final[tuple[str, ...]] = (
    "chẩn đoán xác định",
    "kê đơn thuốc",
    "ngừng thuốc",
    "tăng liều",
    "giảm liều",
    "uống thuốc này",
    "chắc chắn bạn bị bệnh",
)


class Citation(BaseModel):
    model_config = ConfigDict(extra="ignore")

    source_id: str = Field(default="SUPABASE_PGVECTOR", min_length=1, max_length=128)
    document_id: str = Field(default="", max_length=128)
    title: str = Field(default="", max_length=256)
    url: str = Field(default="", max_length=500)
    section_title: str = Field(default="", max_length=256)
    snippet: str = Field(default="", max_length=2000)
    confidence: float = Field(default=0.0, ge=0.0, le=100.0)


class RoutingProposal(BaseModel):
    model_config = ConfigDict(extra="ignore")

    specialty_id: str | None = Field(default=None, max_length=128)
    specialty_name: str | None = Field(default=None, max_length=256)
    rationale: str = Field(min_length=1, max_length=4000)
    confidence: float = Field(ge=0.0, le=1.0)
    citations: list[Citation] = Field(default_factory=list, max_length=10)
    action: Literal["suggest_specialty", "clarify", "handoff"]

    @model_validator(mode="after")
    def require_grounding_for_suggestion(self) -> RoutingProposal:
        if self.action == "suggest_specialty" and (
            not self.specialty_id or not self.citations
        ):
            raise ValueError(
                "Specialty suggestion requires a valid specialty_id and at least one citation"
            )
        return self


class GroundingError(ValueError):
    pass


def is_trusted_citation_host(
    url: str, allowed_hosts: frozenset[str] | None = None
) -> bool:
    if not url:
        return True
    hosts = allowed_hosts or DEFAULT_TRUSTED_PUBLIC_CITATION_HOSTS
    try:
        parsed = urlparse(url)
        hostname = (parsed.hostname or "").lower()
        if not hostname:
            return False
        return (
            any(hostname == h or hostname.endswith("." + h) for h in hosts)
            or "supabase" in hostname
        )
    except (ValueError, AttributeError):
        return False


def validate_routing(
    proposal: RoutingProposal,
    minimum_confidence: float = 0.60,
) -> str:
    """
    Validates that a proposal complies with clinical grounding policies.
    Returns the final grounded rationale with standard disclaimer attached.
    """
    if proposal.action == "handoff":
        return f"{proposal.rationale}\n\n{DISCLAIMER_VI}"

    if proposal.action == "clarify":
        return proposal.rationale

    if proposal.confidence < minimum_confidence:
        raise GroundingError(
            f"Proposal confidence ({proposal.confidence:.2f}) is below minimum threshold ({minimum_confidence:.2f})"
        )

    # Check for forbidden diagnostic or prescriptive assertions
    normalized_rationale = proposal.rationale.lower()
    for forbidden in FORBIDDEN_CLINICAL_TERMS:
        if forbidden in normalized_rationale:
            raise GroundingError(
                f"Proposal violates safety policy: Contains forbidden diagnostic term '{forbidden}'"
            )

    # Validate citations
    for cit in proposal.citations:
        if cit.url and not is_trusted_citation_host(cit.url):
            raise GroundingError(f"Citation contains untrusted public host: {cit.url}")

    return f"{proposal.rationale}\n\n{DISCLAIMER_VI}"
