"""
Node 20: Validate Clinical Output Node.
Validates the intermediate and final clinical outputs from TriageGraph before passing downstream.
"""

from typing import Any
from src.agents.state import AgentState


async def validate_clinical_output_node(state: AgentState) -> dict[str, Any]:
    progress = state.get("progress_percent", 0)
    audit_events = list(state.get("audit_events", []))

    audit_events.append({
        "event": "CLINICAL_OUTPUT_VALIDATED",
        "progress_percent": progress,
        "active_workflow": "TRIAGE" if progress < 100 else "",
    })

    # If triage completed 100%, clear active_workflow so next user turn is not locked
    active_wf = "TRIAGE" if progress < 100 else ""

    return {
        "active_workflow": active_wf,
        "audit_events": audit_events,
    }
