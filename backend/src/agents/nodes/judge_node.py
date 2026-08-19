"""
Clinical Judge Node.
Evaluates whether the patient's message satisfies the current target slot.
"""

from typing import Any

from src.agents.prompts import (
    CLINICAL_JUDGE_SYSTEM_PROMPT,
    SLOT_METADATA,
    build_judge_prompt,
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
        lines.append(f"- {lbl} ({k}): {val} [{st}]")
    return "\n".join(lines)


async def judge_node(state: AgentState) -> dict[str, Any]:
    if state.get("halt"):
        return {}

    slots = [dict(s) for s in state.get("slots", [])]
    user_message = state.get("user_message", "")
    atomic_facts = list(state.get("atomic_facts", []))

    # Find the current pending slot
    target_slot = None
    for s in slots:
        if s.get("status") != "COMPLETED":
            target_slot = s
            break

    if not target_slot:
        # All slots already completed
        return {"current_slot_key": "completed"}

    target_key = target_slot["key"]
    slots_summary = _format_slots_summary(slots)
    judge_prompt = (
        f"{CLINICAL_JUDGE_SYSTEM_PROMPT}\n\n"
        f"{build_judge_prompt(target_key, user_message, slots_summary)}"
    )

    llm = get_llm_service()
    judge_res = await llm.generate_json(judge_prompt, purpose="clinical_judge")

    verdict = judge_res.get("verdict", "SATISFIED").upper()
    clarity_score = float(judge_res.get("clarityScore", 0.85))
    extracted_fact = judge_res.get("extractedFact", user_message)
    reasoning = judge_res.get("reasoning", "")
    clarification = judge_res.get(
        "clarificationPrompt",
        f"Bạn có thể chia sẻ cụ thể hơn về {SLOT_METADATA.get(target_key, {}).get('label', target_key)} được không?",
    )

    if verdict == "SATISFIED":
        target_slot["status"] = "COMPLETED"
        target_slot["value"] = user_message
        target_slot["extracted_fact"] = extracted_fact
        target_slot["clarity_score"] = clarity_score

        if extracted_fact and extracted_fact not in atomic_facts:
            atomic_facts.append(extracted_fact)

        completed_count = sum(1 for s in slots if s.get("status") == "COMPLETED")
        progress = int((completed_count / len(slots)) * 100)

        return {
            "slots": slots,
            "atomic_facts": atomic_facts,
            "progress_percent": progress,
            "current_slot_key": target_key,
            "judge_verdict": "SATISFIED",
            "judge_clarity": clarity_score,
            "judge_fact": extracted_fact,
            "judge_reasoning": reasoning,
        }
    else:
        # UNSATISFIED -> Ask for clarification on the same slot
        return {
            "slots": slots,
            "current_slot_key": target_key,
            "judge_verdict": "UNSATISFIED",
            "judge_reasoning": reasoning,
            "response": clarification,
            "halt": True,  # Wait for patient to clarify
        }
