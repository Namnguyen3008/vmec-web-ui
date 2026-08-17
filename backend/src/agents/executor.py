"""
Session Lifecycle Orchestrator for Multi-Turn Stateful Clinical Agent.
Coordinates Cosmos DB persistence, state hydration, LangGraph invocation, and state committing.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from azure.cosmos.exceptions import CosmosHttpResponseError

from src.agents.graph import clinical_graph
from src.agents.state import (
    AppointmentOffer,
    ChatMessage,
    QuickChip,
    SessionDocument,
    SlotItem,
    create_initial_slots,
)
from src.persistence.cosmos_client import CosmosClientManager, get_cosmos_manager
from src.services.grounding import Citation
from src.services.psychology import PsychologicalSoothingPayload

logger = logging.getLogger("vmec.agents.executor")


class ClinicalAgentExecutor:
    """
    Manages multi-turn stateful conversational triage backed by Azure Cosmos DB.
    """

    def __init__(self, cosmos_manager: CosmosClientManager | None = None) -> None:
        self.cosmos_manager = cosmos_manager or get_cosmos_manager()

    async def _load_or_create_session(
        self, session_id: str, user_id: str
    ) -> SessionDocument:
        container = self.cosmos_manager.get_container("patient_sessions")
        try:
            doc = container.read_item(item=session_id, partition_key=user_id)
            logger.info("Loaded active session '%s' from Cosmos DB", session_id)
            return SessionDocument(**doc)
        except (
            CosmosHttpResponseError,
            KeyError,
            ValueError,
            RuntimeError,
            OSError,
        ) as ex:
            logger.info(
                "Initializing fresh clinical session '%s' for user '%s' (%s)",
                session_id,
                user_id,
                ex,
            )
            return SessionDocument(
                id=session_id,
                userId=user_id,
                slots=create_initial_slots(),
                turn_count=0,
                progress_percent=0,
                urgency="ROUTINE",
                last_updated=datetime.now(timezone.utc).isoformat(),
            )

    async def _save_session(self, session: SessionDocument) -> None:
        container = self.cosmos_manager.get_container("patient_sessions")
        session.last_updated = datetime.now(timezone.utc).isoformat()
        try:
            container.upsert_item(session.model_dump())
            logger.debug(
                "Committed session '%s' (progress=%d%%) to Cosmos DB",
                session.id,
                session.progress_percent,
            )
        except (KeyError, ValueError, RuntimeError, OSError) as ex:
            logger.error(
                "Failed to commit session '%s' to Cosmos DB: %s", session.id, ex
            )

    async def process_turn(
        self,
        session_id: str,
        user_id: str,
        user_message: str,
    ) -> dict[str, Any]:
        """
        Executes one full conversational turn for the patient.
        """
        # 1. Load or initialize living session context from Cosmos DB
        session = await self._load_or_create_session(session_id, user_id)
        session.turn_count += 1

        # Record user message in history
        session.chatHistory.append(
            ChatMessage(
                role="user",
                content=user_message,
                timestamp=datetime.now(timezone.utc).isoformat(),
            )
        )

        # 2. Build AgentState for LangGraph
        initial_state = {
            "session_id": session_id,
            "user_id": user_id,
            "user_message": user_message,
            "slots": [s.model_dump() for s in session.slots],
            "atomic_facts": list(session.atomic_facts),
            "progress_percent": session.progress_percent,
            "turn_count": session.turn_count,
            "urgency": session.urgency,
            "halt": False,
            "is_emergency": False,
            "is_blocked": False,
        }

        # 3. Invoke LangGraph State Machine
        final_state = await clinical_graph.ainvoke(initial_state)

        # 4. Commit updated state back into SessionDocument
        if "slots" in final_state:
            session.slots = [SlotItem(**s) for s in final_state["slots"]]
        if "atomic_facts" in final_state:
            session.atomic_facts = final_state["atomic_facts"]
        if "progress_percent" in final_state:
            session.progress_percent = final_state["progress_percent"]
        if "urgency" in final_state:
            session.urgency = final_state["urgency"]
        if "citations" in final_state:
            session.citations = [Citation(**c) for c in final_state["citations"]]
        if "quick_chips" in final_state:
            session.quick_chips = [
                QuickChip(
                    id=c.get("id", f"c{i}"),
                    display=c.get("display", ""),
                    full_text=c.get("fullText") or c.get("full_text", ""),
                    clinical_category=c.get("clinicalCategory")
                    or c.get("clinical_category", ""),
                )
                for i, c in enumerate(final_state["quick_chips"], 1)
            ]
        if final_state.get("soothing_payload"):
            session.soothing_payload = PsychologicalSoothingPayload(
                **final_state["soothing_payload"]
            )
        if "appointment_offers" in final_state:
            session.appointment_offers = [
                AppointmentOffer(**o) if isinstance(o, dict) else o
                for o in final_state["appointment_offers"]
            ]

        assistant_response = final_state.get(
            "response",
            "Bác sĩ đã ghi nhận thông tin. Vui lòng chia sẻ thêm để được hỗ trợ chu đáo nhất.",
        )

        session.chatHistory.append(
            ChatMessage(
                role="assistant",
                content=assistant_response,
                timestamp=datetime.now(timezone.utc).isoformat(),
            )
        )

        # 5. Persist updated session to Cosmos DB
        await self._save_session(session)

        # 6. Format API response for frontend
        return {
            "session_id": session.id,
            "user_id": session.userId,
            "turn_count": session.turn_count,
            "progress_percent": session.progress_percent,
            "urgency": session.urgency,
            "response": assistant_response,
            "slots": [s.model_dump() for s in session.slots],
            "atomic_facts": session.atomic_facts,
            "quick_chips": [c.model_dump() for c in session.quick_chips],
            "soothing_payload": (final_state.get("soothing_payload")),
            "appointment_offers": (final_state.get("appointment_offers", [])),
            "citations": [c.model_dump() for c in session.citations],
            "is_emergency": final_state.get("is_emergency", False),
            "is_blocked": final_state.get("is_blocked", False),
        }


_executor_instance: ClinicalAgentExecutor | None = None


def get_agent_executor() -> ClinicalAgentExecutor:
    global _executor_instance
    if _executor_instance is None:
        _executor_instance = ClinicalAgentExecutor()
    return _executor_instance
