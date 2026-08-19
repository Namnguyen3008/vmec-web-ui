"""
Emergency Screening Node (Nodes 9, 10, 11).
Executes deterministic rule-based screening for life-threatening acute symptoms.
"""

from typing import Any
from src.agents.state import AgentState
from src.services.emergency import screen_emergency


async def emergency_node(state: AgentState) -> dict[str, Any]:
    if state.get("halt"):
        return {}

    message = state.get("user_message", "")
    audit_events = list(state.get("audit_events", []))
    result = screen_emergency(message)

    if result.emergency:
        audit_events.append({
            "event": "EMERGENCY_DETECTED",
            "urgency": "EMERGENCY",
            "rule_ids": list(result.rule_ids),
            "categories": list(result.categories),
        })
        return {
            "response": result.action,
            "is_emergency": True,
            "urgency": "EMERGENCY",
            "halt": True,
            "quick_chips": [],
            "metadata": {
                "emergency_rule_ids": list(result.rule_ids),
                "emergency_categories": list(result.categories),
                "emergency_ruleset_version": result.ruleset_version,
                "routine_booking_blocked": True,
            },
            "audit_events": audit_events,
        }

    return {
        "is_emergency": False,
        "audit_events": audit_events,
    }
