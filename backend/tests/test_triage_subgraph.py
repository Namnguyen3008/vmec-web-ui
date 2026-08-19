import pytest
from unittest.mock import AsyncMock, patch
from src.agents.subgraphs.triage_graph import triage_graph
from src.agents.state import AgentState, create_initial_slots


@pytest.mark.asyncio
async def test_triage_graph_first_turn():
    slots = [s.model_dump() for s in create_initial_slots()]
    state: AgentState = {
        "session_id": "sess_triage_1",
        "user_id": "user_triage_1",
        "user_message": "Tôi bị đau ngực âm ỉ",
        "slots": slots,
        "atomic_facts": [],
        "progress_percent": 0,
        "active_workflow": "TRIAGE",
    }

    # Mock judge and interrogator
    with patch("src.agents.nodes.judge_node.get_llm_service") as mock_judge_llm, \
         patch("src.agents.nodes.interrogate_node.get_llm_service") as mock_interrogate_llm:
        
        mock_judge = AsyncMock()
        mock_judge.generate_json.return_value = {
            "verdict": "SATISFIED",
            "clarityScore": 0.9,
            "extractedFact": "Đau ngực âm ỉ",
            "reasoning": "Chief complaint identified",
        }
        mock_judge_llm.return_value = mock_judge

        mock_interrogate = AsyncMock()
        mock_interrogate.generate_json.return_value = {
            "fullResponse": "Bác sĩ đã ghi nhận triệu chứng đau ngực của bạn. Cơn đau kéo dài bao lâu rồi?",
            "chips": [{"id": "c1", "display": "2 ngày nay", "fullText": "2 ngày nay"}],
        }
        mock_interrogate_llm.return_value = mock_interrogate

        result = await triage_graph.ainvoke(state)

        assert result.get("progress_percent") == 25
        assert result.get("halt") is True
        assert "triệu chứng đau ngực" in result.get("response", "")
        assert result.get("active_workflow") == "TRIAGE"
        assert any(e.get("event") == "CLINICAL_OUTPUT_VALIDATED" for e in result.get("audit_events", []))
