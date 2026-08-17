"""
Clinical Synthesis & Generation Node.
Synthesizes specialty routing recommendations grounded in Supabase pgvector evidence.
"""

from typing import Any

from src.agents.prompts import (
    CLINICAL_SYNTHESIS_SYSTEM_PROMPT,
    build_synthesis_prompt,
)
from src.agents.state import AgentState
from src.services.llm import get_llm_service


def _format_slots_summary(slots: list[dict[str, Any]]) -> str:
    lines = []
    for s in slots:
        lbl = s.get("label", s.get("key", ""))
        val = s.get("value") or s.get("extracted_fact") or "(Chưa có)"
        lines.append(f"- {lbl}: {val}")
    return "\n".join(lines)


async def generate_node(state: AgentState) -> dict[str, Any]:
    if state.get("halt"):
        return {}

    slots = state.get("slots", [])
    atomic_facts = state.get("atomic_facts", [])
    grounding_text = state.get("grounding_text", "")
    spec_code = state.get("top_specialty_code", "NOI_TONG_QUAT")
    spec_name = state.get("top_specialty_name", "Khoa Nội Tổng Quát")

    slots_summary = _format_slots_summary(slots)
    prompt = (
        f"{CLINICAL_SYNTHESIS_SYSTEM_PROMPT}\n\n"
        f"{build_synthesis_prompt(slots_summary, atomic_facts, grounding_text)}"
    )

    llm = get_llm_service()
    res = await llm.generate_json(prompt, purpose="clinical_synthesis")

    rationale = res.get(
        "rationale",
        f"Dựa trên các triệu chứng lâm sàng bạn cung cấp, việc thăm khám tại {spec_name} là định hướng phù hợp nhất.",
    )
    preliminary_tests = res.get(
        "preliminaryTests",
        ["Thăm khám lâm sàng chuyên khoa", "Đo dấu hiệu sinh tồn"],
    )
    preparation_tips = res.get(
        "preparationTips",
        [
            "Mang theo kết quả khám bệnh trước đây (nếu có)",
            "Nhịn ăn sáng nếu cần làm xét nghiệm máu",
        ],
    )

    return {
        "response": rationale,
        "preliminary_tests": preliminary_tests,
        "preparation_tips": preparation_tips,
        "metadata": {
            "specialty_code": spec_code,
            "specialty_name": spec_name,
            "synthesis_raw": res,
        },
    }
