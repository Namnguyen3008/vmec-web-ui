"""
Emergency Screening Node.
Executes deterministic rule-based screening for life-threatening acute symptoms.
"""

from typing import Any

from src.agents.state import AgentState
from src.services.emergency import screen_emergency


async def emergency_node(state: AgentState) -> dict[str, Any]:
    # If already halted by armor_node, pass through
    if state.get("halt"):
        return {}

    message = state.get("user_message", "")
    result = screen_emergency(message)

    if result.emergency:
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
        }

    return {
        "is_emergency": False,
    }
