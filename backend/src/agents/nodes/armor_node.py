"""
Model Armor Shield Node.
Screens user message for Prompt Injection, Jailbreak, Credential queries, and masks PII/PHI.
"""

from typing import Any

from src.agents.state import AgentState
from src.security.model_armor import sanitize_user_prompt_sync


async def armor_node(state: AgentState) -> dict[str, Any]:
    raw_message = state.get("user_message", "").strip()
    result = sanitize_user_prompt_sync(raw_message)

    if not result.is_safe:
        return {
            "user_message": result.sanitized_text,
            "response": result.safety_refusal_message
            or "Yêu cầu bị từ chối do vi phạm an toàn.",
            "halt": True,
            "is_blocked": True,
            "quick_chips": [],
        }

    return {
        "user_message": result.sanitized_text,
        "halt": False,
        "is_blocked": False,
    }
