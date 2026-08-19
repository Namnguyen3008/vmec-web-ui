"""
LangGraph StateGraph Definition for VMEC Multi-Turn Clinical Agent.
Implements conditional routing across Safety, Triage, Judge, Interrogator, RAG, and Empathy nodes.
"""

from typing import Any, Literal

from langgraph.graph import END, START, StateGraph

from src.agents.nodes.armor_node import armor_node
from src.agents.nodes.emergency_node import emergency_node
from src.agents.nodes.generate_node import generate_node
from src.agents.nodes.interrogate_node import interrogate_node
from src.agents.nodes.judge_node import judge_node
from src.agents.nodes.psychology_node import psychology_node
from src.agents.nodes.retrieve_node import retrieve_node
from src.agents.nodes.validate_node import validate_node
from src.agents.state import AgentState


def route_after_armor(state: AgentState) -> Literal["emergency", "__end__"]:
    if state.get("halt"):
        return END
    return "emergency"


def route_after_emergency(state: AgentState) -> Literal["judge", "__end__"]:
    if state.get("halt") or state.get("is_emergency"):
        return END
    return "judge"


def route_after_judge(
    state: AgentState,
) -> Literal["interrogate", "retrieve", "__end__"]:
    if state.get("halt") or state.get("judge_verdict") == "UNSATISFIED":
        return END

    progress = state.get("progress_percent", 0)
    if progress >= 100:
        return "retrieve"
    return "interrogate"


def create_clinical_graph() -> Any:
    builder = StateGraph(AgentState)

    # 1. Add all nodes
    builder.add_node("armor", armor_node)
    builder.add_node("emergency", emergency_node)
    builder.add_node("judge", judge_node)
    builder.add_node("interrogate", interrogate_node)
    builder.add_node("retrieve", retrieve_node)
    builder.add_node("generate", generate_node)
    builder.add_node("validate", validate_node)
    builder.add_node("psychology", psychology_node)

    # 2. Add control flow edges
    builder.add_edge(START, "armor")
    builder.add_conditional_edges("armor", route_after_armor)
    builder.add_conditional_edges("emergency", route_after_emergency)
    builder.add_conditional_edges("judge", route_after_judge)
    builder.add_edge("interrogate", END)
    builder.add_edge("retrieve", "generate")
    builder.add_edge("generate", "validate")
    builder.add_edge("validate", "psychology")
    builder.add_edge("psychology", END)

    return builder.compile()


clinical_graph = create_clinical_graph()
