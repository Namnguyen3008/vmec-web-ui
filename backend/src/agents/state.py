"""
State definitions for LangGraph Multi-Turn Clinical Agent and Cosmos DB persistence.
"""

from __future__ import annotations

from typing import Any, Literal, TypedDict

from pydantic import BaseModel, ConfigDict, Field

from src.services.grounding import Citation
from src.services.psychology import PsychologicalSoothingPayload

SlotKey = Literal["chiefComplaint", "characterTriggers", "duration", "associatedSigns"]
SlotStatus = Literal["PENDING", "COMPLETED"]
UrgencyLevel = Literal["ROUTINE", "URGENT", "EMERGENCY"]


class SlotItem(BaseModel):
    model_config = ConfigDict(extra="ignore")

    key: SlotKey
    label: str
    value: str = ""
    status: SlotStatus = "PENDING"
    clarity_score: float = 0.0
    extracted_fact: str = ""


class QuickChip(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    display: str
    full_text: str
    clinical_category: str = ""


class AppointmentOffer(BaseModel):
    model_config = ConfigDict(extra="ignore")

    offer_id: str
    doctor_id: str
    doctor_name: str
    specialty_code: str
    specialty_name: str
    room: str
    start_time: str
    end_time: str
    consultation_fee: int = 350000


class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")

    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: str


class SessionDocument(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str  # e.g., "SESSION_user123_abc"
    userId: str  # Partition Key: /userId
    chatHistory: list[ChatMessage] = Field(default_factory=list)
    turn_count: int = 0
    progress_percent: int = 0  # 0, 25, 50, 75, 100
    urgency: UrgencyLevel = "ROUTINE"
    slots: list[SlotItem] = Field(default_factory=list)
    atomic_facts: list[str] = Field(default_factory=list)
    citations: list[Citation] = Field(default_factory=list)
    quick_chips: list[QuickChip] = Field(default_factory=list)
    soothing_payload: PsychologicalSoothingPayload | None = None
    appointment_offers: list[AppointmentOffer] = Field(default_factory=list)
    last_updated: str = ""
    ttl: int = 86400  # 24 hours


def create_initial_slots() -> list[SlotItem]:
    return [
        SlotItem(key="chiefComplaint", label="Vị trí & Triệu chứng chính"),
        SlotItem(key="characterTriggers", label="Tính chất & Cường độ"),
        SlotItem(key="duration", label="Thời gian & Diễn tiến"),
        SlotItem(key="associatedSigns", label="Dấu hiệu kèm theo"),
    ]


class AgentState(TypedDict, total=False):
    # Session Identifiers
    session_id: str
    user_id: str

    # Input for this turn
    user_message: str

    # Stateful Clinical Context (persisted across turns in Cosmos DB)
    slots: list[dict[str, Any]]
    atomic_facts: list[str]
    progress_percent: int
    turn_count: int
    urgency: str

    # Turn control flags
    halt: bool
    is_emergency: bool
    is_blocked: bool

    # Evaluation results for this turn
    current_slot_key: str
    judge_verdict: str  # "SATISFIED" | "UNSATISFIED"
    judge_clarity: float
    judge_fact: str
    judge_reasoning: str

    # RAG / Retrieval results (if slots == 100%)
    top_specialty_code: str
    top_specialty_name: str
    confidence: float
    citations: list[dict[str, Any]]
    grounding_text: str
    preliminary_tests: list[str]
    preparation_tips: list[str]

    # Output responses for UI
    response: str
    quick_chips: list[dict[str, Any]]
    soothing_payload: dict[str, Any] | None
    appointment_offers: list[dict[str, Any]]
    metadata: dict[str, Any]
