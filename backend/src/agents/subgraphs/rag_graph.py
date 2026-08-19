"""
RagGraph Subgraph (Nodes 21, 22, 23, 24, 25).
Encapsulates RAG-enabled feature check, Supabase pgvector retrieval, synthesis, grounding validation,
and PEARLS empathy + appointment offers.
"""

from typing import Any, Literal
from langgraph.graph import END, START, StateGraph

from src.agents.nodes.generate_node import generate_node
from src.agents.nodes.limited_safe_response_node import limited_safe_response_node
from src.agents.nodes.psychology_node import psychology_node
from src.agents.nodes.retrieve_node import retrieve_node
from src.agents.nodes.validate_node import validate_node
from src.agents.state import AgentState
from src.config import get_settings


def route_rag_enabled_check(state: AgentState) -> Literal["retrieve", "limited_safe_response"]:
    settings = get_settings()
    is_rag_on = state.get("rag_enabled", getattr(settings, "rag_enabled", True))
    if not is_rag_on:
        return "limited_safe_response"
    return "retrieve"


def create_rag_graph() -> Any:
    builder = StateGraph(AgentState)

    builder.add_node("retrieve", retrieve_node)
    builder.add_node("generate", generate_node)
    builder.add_node("validate", validate_node)
    builder.add_node("psychology", psychology_node)
    builder.add_node("limited_safe_response", limited_safe_response_node)

    builder.add_conditional_edges(START, route_rag_enabled_check)
    builder.add_edge("retrieve", "generate")
    builder.add_edge("generate", "validate")
    builder.add_edge("validate", "psychology")
    builder.add_edge("psychology", END)
    builder.add_edge("limited_safe_response", END)

    return builder.compile()


rag_graph = create_rag_graph()
