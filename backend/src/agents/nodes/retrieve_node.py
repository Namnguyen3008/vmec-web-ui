"""
Vector Retrieval Node.
Executes semantic RAG search across Supabase pgvector (2,670 vectors) when all 4 slots are complete.
"""

from typing import Any

from src.agents.state import AgentState
from src.services.vector_search import get_vector_client


async def retrieve_node(state: AgentState) -> dict[str, Any]:
    if state.get("halt"):
        return {}

    slots = state.get("slots", [])
    atomic_facts = state.get("atomic_facts", [])

    # Synthesize comprehensive clinical query from completed slots
    query_parts = []
    for s in slots:
        lbl = s.get("label", s.get("key", ""))
        val = s.get("value") or s.get("extracted_fact") or ""
        if val:
            query_parts.append(f"{lbl}: {val}")

    if atomic_facts:
        query_parts.extend(atomic_facts)

    full_query = (
        " ; ".join(query_parts) if query_parts else state.get("user_message", "")
    )

    vector_client = get_vector_client()
    result = await vector_client.search(full_query, match_count=5)

    citations_list = [c.model_dump() for c in result.citations]

    return {
        "top_specialty_code": result.top_specialty_code,
        "top_specialty_name": result.top_specialty_name,
        "confidence": result.confidence,
        "citations": citations_list,
        "grounding_text": result.grounding_text,
    }
