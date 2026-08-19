"""
Master LangGraph StateGraph Definition for VMEC 28-Node Clinical & Enterprise Chat Flow.
Orchestrates Input Validation, Security, Medical Relevance, Emergency Screening,
Workflow State Machine, Intent Routing, and 3 Modular Subgraphs (Triage, RAG, Catalog).
"""

from typing import Any, Literal
from langgraph.graph import END, START, StateGraph

from src.agents.nodes.armor_node import armor_node
from src.agents.nodes.commit_audit_node import commit_audit_node
from src.agents.nodes.emergency_node import emergency_node
from src.agents.nodes.fallback_node import fallback_node
from src.agents.nodes.input_validation_node import input_validation_node
from src.agents.nodes.intent_router_node import intent_router_node
from src.agents.nodes.medical_relevance_node import medical_relevance_node
from src.agents.nodes.workflow_check_node import workflow_check_node
from src.agents.state import AgentState
from src.agents.subgraphs.catalog_graph import catalog_graph
from src.agents.subgraphs.rag_graph import rag_graph
from src.agents.subgraphs.triage_graph import triage_graph


def route_after_input_validation(state: AgentState) -> Literal["armor", "commit_audit"]:
    if state.get("halt"):
        return "commit_audit"
    return "armor"


def route_after_armor(state: AgentState) -> Literal["medical_relevance", "commit_audit"]:
    if state.get("halt") or state.get("is_blocked"):
        return "commit_audit"
    return "medical_relevance"


def route_after_medical_relevance(state: AgentState) -> Literal["emergency", "commit_audit"]:
    if state.get("halt") or not state.get("is_medical", True):
        return "commit_audit"
    return "emergency"


def route_after_emergency(state: AgentState) -> Literal["workflow_check", "commit_audit"]:
    if state.get("halt") or state.get("is_emergency"):
        return "commit_audit"
    return "workflow_check"


def route_after_workflow_check(
    state: AgentState,
) -> Literal["triage_graph", "catalog_graph", "intent_router", "commit_audit"]:
    if state.get("halt"):
        return "commit_audit"

    action = state.get("workflow_action", "NONE")
    active_wf = state.get("active_workflow", "")

    if action == "CONTINUE":
        if active_wf == "TRIAGE":
            return "triage_graph"
        elif active_wf == "CATALOG":
            return "catalog_graph"

    return "intent_router"


def route_after_intent(
    state: AgentState,
) -> Literal["catalog_graph", "triage_graph", "rag_graph", "fallback"]:
    intent = state.get("intent", "MEDICAL")

    if intent == "CATALOG":
        return "catalog_graph"
    elif intent == "OTHER":
        return "fallback"

    # Default MEDICAL intent
    if state.get("progress_percent", 0) >= 100:
        return "rag_graph"
    return "triage_graph"


def route_after_triage(state: AgentState) -> Literal["rag_graph", "commit_audit"]:
    # If triage completed 100% and not halted with clarification, proceed directly to RAG
    if state.get("progress_percent", 0) >= 100 and not state.get("halt"):
        return "rag_graph"
    return "commit_audit"


def create_clinical_graph() -> Any:
    builder = StateGraph(AgentState)

    # 1. Register all nodes and compiled subgraphs
    builder.add_node("input_validation", input_validation_node)
    builder.add_node("armor", armor_node)
    builder.add_node("medical_relevance", medical_relevance_node)
    builder.add_node("emergency", emergency_node)
    builder.add_node("workflow_check", workflow_check_node)
    builder.add_node("intent_router", intent_router_node)
    builder.add_node("triage_graph", triage_graph)
    builder.add_node("rag_graph", rag_graph)
    builder.add_node("catalog_graph", catalog_graph)
    builder.add_node("fallback", fallback_node)
    builder.add_node("commit_audit", commit_audit_node)

    # 2. Wire edges and conditional branching
    builder.add_edge(START, "input_validation")
    builder.add_conditional_edges("input_validation", route_after_input_validation)
    builder.add_conditional_edges("armor", route_after_armor)
    builder.add_conditional_edges("medical_relevance", route_after_medical_relevance)
    builder.add_conditional_edges("emergency", route_after_emergency)
    builder.add_conditional_edges("workflow_check", route_after_workflow_check)
    builder.add_conditional_edges("intent_router", route_after_intent)
    builder.add_conditional_edges("triage_graph", route_after_triage)

    builder.add_edge("rag_graph", "commit_audit")
    builder.add_edge("catalog_graph", "commit_audit")
    builder.add_edge("fallback", "commit_audit")
    builder.add_edge("commit_audit", END)

    return builder.compile()


clinical_graph = create_clinical_graph()
