"""
Clinical Interrogator Node.
Generates empathetic doctor dialogue and 4 Contextual Quick Chips for the next pending slot.
"""

from typing import Any

from src.agents.prompts import (
    CLINICAL_INTERROGATOR_SYSTEM_PROMPT,
    build_interrogator_prompt,
)
from src.agents.state import AgentState
from src.services.llm import get_llm_service


def _format_slots_summary(slots: list[dict[str, Any]]) -> str:
    lines = []
    for s in slots:
        k = s.get("key", "")
        lbl = s.get("label", k)
        val = s.get("value") or "(Chưa có)"
        st = s.get("status", "PENDING")
        lines.append(f"- {lbl}: {val} [{st}]")
    return "\n".join(lines)


async def interrogate_node(state: AgentState) -> dict[str, Any]:
    if state.get("halt"):
        return {}

    slots = state.get("slots", [])
    atomic_facts = state.get("atomic_facts", [])
    last_fact = atomic_facts[-1] if atomic_facts else state.get("user_message", "")

    # Identify the next pending slot
    next_slot = None
    for s in slots:
        if s.get("status") != "COMPLETED":
            next_slot = s
            break

    if not next_slot:
        # All slots are completed, should not enter interrogator
        return {}

    next_key = next_slot["key"]
    slots_summary = _format_slots_summary(slots)
    interrogate_prompt = (
        f"{CLINICAL_INTERROGATOR_SYSTEM_PROMPT}\n\n"
        f"{build_interrogator_prompt(next_key, slots_summary, last_fact)}"
    )

    llm = get_llm_service()
    interrogate_res = await llm.generate_json(
        interrogate_prompt, purpose="clinical_interrogate"
    )

    full_response = interrogate_res.get("fullResponse")
    if not full_response:
        label = next_slot.get("label", "triệu chứng")
        full_response = f"Bác sĩ đã hiểu tình trạng của bạn. Bạn có thể chia sẻ thêm về {label} không?"

    chips = interrogate_res.get("chips", [])
    if not isinstance(chips, list) or len(chips) == 0:
        chips = [
            {
                "id": "c1",
                "display": "Đau âm ỉ cả ngày",
                "fullText": "Triệu chứng xuất hiện âm ỉ liên tục cả ngày",
                "clinicalCategory": "CONTINUOUS",
            },
            {
                "id": "c2",
                "display": "Đau nhói từng cơn",
                "fullText": "Triệu chứng xuất hiện thành từng cơn nhói",
                "clinicalCategory": "PAROXYSMAL",
            },
            {
                "id": "c3",
                "display": "Tăng khi gắng sức",
                "fullText": "Cảm giác khó chịu tăng rõ rệt khi làm việc nặng",
                "clinicalCategory": "EXERTIONAL",
            },
            {
                "id": "c4",
                "display": "Không có dấu hiệu khác",
                "fullText": "Tôi không có biểu hiện bất thường nào khác",
                "clinicalCategory": "ISOLATED",
            },
        ]

    return {
        "response": full_response,
        "quick_chips": chips,
        "halt": True,  # Stop and wait for patient response
    }
