"""
TriageGraph Subgraph (Nodes 18, 19, 20).
Encapsulates clinical slot gating (Judge), follow-up questioning (Interrogator), and clinical output validation.
"""

from typing import Any, Literal
from langgraph.graph import END, START, StateGraph

from src.agents.nodes.interrogate_node import interrogate_node
from src.agents.nodes.judge_node import judge_node
from src.agents.nodes.validate_clinical_output_node import validate_clinical_output_node
from src.agents.state import AgentState


def route_after_judge_in_triage(
    state: AgentState,
) -> Literal["interrogate", "validate_clinical_output"]:
    if state.get("halt") or state.get("judge_verdict") == "UNSATISFIED":
        return "validate_clinical_output"

    progress = state.get("progress_percent", 0)
    if progress >= 100:
        return "validate_clinical_output"
    return "interrogate"


def create_triage_graph() -> Any:
    builder = StateGraph(AgentState)

    builder.add_node("judge", judge_node)
    builder.add_node("interrogate", interrogate_node)
    builder.add_node("validate_clinical_output", validate_clinical_output_node)

    builder.add_edge(START, "judge")
    builder.add_conditional_edges("judge", route_after_judge_in_triage)
    builder.add_edge("interrogate", "validate_clinical_output")
    builder.add_edge("validate_clinical_output", END)

    return builder.compile()


triage_graph = create_triage_graph()
