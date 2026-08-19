"""
Model Armor Shield Node (Nodes 3 & 4).
Screens user message for Prompt Injection, Jailbreak, Credential queries, and masks PII/PHI.
"""

from typing import Any
from src.agents.state import AgentState
from src.security.model_armor import sanitize_user_prompt_sync


async def armor_node(state: AgentState) -> dict[str, Any]:
    raw_message = state.get("user_message", "").strip()
    audit_events = list(state.get("audit_events", []))
    result = sanitize_user_prompt_sync(raw_message)

    if not result.is_safe:
        violation_names = [v.rule for v in result.violations] if result.violations else ["SECURITY_VIOLATION"]
        audit_events.append({
            "event": "PROMPT_BLOCKED",
            "reason": ", ".join(violation_names),
            "details": [v.description for v in result.violations],
        })
        return {
            "user_message": result.sanitized_text,
            "sanitized_message": result.sanitized_text,
            "response": result.safety_refusal_message or "Yêu cầu bị từ chối do vi phạm an toàn.",
            "halt": True,
            "is_blocked": True,
            "quick_chips": [],
            "audit_events": audit_events,
        }

    return {
        "user_message": result.sanitized_text,
        "sanitized_message": result.sanitized_text,
        "halt": False,
        "is_blocked": False,
        "audit_events": audit_events,
    }
