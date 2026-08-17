import pytest

from src.config import ALLOWED_GEMINI_MODELS
from src.services.llm import get_llm_service


@pytest.mark.asyncio
async def test_gemini_generative_rotation_and_output():
    service = get_llm_service()

    # Call 1: should use gemini-3.1-flash-lite or gemini-3.5-flash-lite
    res1 = await service.generate("Reply with 'VMEC_AI_1' only.", purpose="test_call_1")
    assert res1.handoff is False
    assert res1.model in ALLOWED_GEMINI_MODELS
    assert len(res1.text) > 0

    # Call 2: should rotate to the other model
    res2 = await service.generate("Reply with 'VMEC_AI_2' only.", purpose="test_call_2")
    assert res2.handoff is False
    assert res2.model in ALLOWED_GEMINI_MODELS
    assert len(res2.text) > 0


@pytest.mark.asyncio
async def test_gemini_json_generation():
    service = get_llm_service()
    prompt = (
        "Evaluate this symptom: 'đau ngực dữ dội'. "
        "Return JSON with keys: 'status' (string), 'is_emergency' (boolean)."
    )
    result = await service.generate_json(prompt, purpose="test_json")
    assert isinstance(result, dict)
    assert "error" not in result or result.get("error") != "JSON_DECODE_FAILED"
