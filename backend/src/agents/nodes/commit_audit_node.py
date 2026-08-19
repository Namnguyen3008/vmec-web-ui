"""
Node 27: Commit Session and Audit Node.
Persists turn-level metadata, accumulated audit events, and compliance logs to Cosmos DB.
"""

import logging
from typing import Any
from src.agents.state import AgentState
from src.repositories.audit_repository import get_audit_repository

logger = logging.getLogger("vmec.agents.nodes.commit_audit")


async def commit_audit_node(state: AgentState) -> dict[str, Any]:
    session_id = state.get("session_id", "")
    user_id = state.get("user_id", "")
    audit_events = list(state.get("audit_events", []))
    intent = state.get("intent", "UNKNOWN")
    urgency = state.get("urgency", "ROUTINE")

    if not session_id or not user_id:
        return {"audit_committed": False}

    try:
        audit_repo = get_audit_repository()
        for event in audit_events:
            event_type = event.get("event", "CHAT_TURN_PROCESSED")
            await audit_repo.log_event(
                session_id=session_id,
                user_id=user_id,
                event_type=event_type,
                details={
                    "intent": intent,
                    "urgency": urgency,
                    "progress_percent": state.get("progress_percent", 0),
                    "event_data": event,
                },
            )
    except Exception as e:
        logger.warning("Failed to commit audit events to Cosmos DB: %s", str(e))

    return {
        "audit_committed": True,
        "halt": True,
    }
