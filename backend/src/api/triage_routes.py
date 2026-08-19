"""
FastAPI Triage Router for Clinical Evaluation & Emergency Screening.
Compatible with frontend /api/clinical/evaluate and standalone triage checks.
"""

from __future__ import annotations

import logging
from typing import Any, Literal

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from src.agents.prompts import (
    CLINICAL_INTERROGATOR_SYSTEM_PROMPT,
    CLINICAL_JUDGE_SYSTEM_PROMPT,
    build_interrogator_prompt,
    build_judge_prompt,
)
from src.services.emergency import screen_emergency
from src.services.llm import get_llm_service

logger = logging.getLogger("vmec.api.triage")
router = APIRouter(prefix="/api/triage", tags=["triage"])


class ClinicalEvaluateRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    action: Literal["JUDGE", "INTERROGATE"] = "JUDGE"
    targetSlot: str = "chiefComplaint"
    userMessage: str = ""
    currentSlots: dict[str, Any] = Field(default_factory=dict)
    specialtyCode: str = "TIM_MACH"
    specialtyName: str = "Khoa Tim Mạch"
    lastExtractedFact: str = ""


class EmergencyScreenRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    text: str


@router.post("/evaluate", status_code=status.HTTP_200_OK)
async def evaluate_clinical_slot(payload: ClinicalEvaluateRequest) -> dict[str, Any]:
    llm = get_llm_service()

    if payload.action == "JUDGE":
        slots_summary = "\n".join(
            f"- {k}: {v.get('value', '(Chưa có)') if isinstance(v, dict) else v}"
            for k, v in payload.currentSlots.items()
        )
        prompt = (
            f"{CLINICAL_JUDGE_SYSTEM_PROMPT}\n\n"
            f"{build_judge_prompt(payload.targetSlot, payload.userMessage, slots_summary)}"
        )
        try:
            result = await llm.generate_json(prompt, purpose="api_triage_judge")
            return {"success": True, "action": "JUDGE", "result": result}
        except Exception as ex:
            logger.error("Judge evaluation failed: %s", ex)
            raise HTTPException(status_code=500, detail=str(ex)) from ex

    elif payload.action == "INTERROGATE":
        slots_summary = "\n".join(
            f"- {k}: {v.get('value', '(Chờ bước sau)') if isinstance(v, dict) else v}"
            for k, v in payload.currentSlots.items()
        )
        prompt = (
            f"{CLINICAL_INTERROGATOR_SYSTEM_PROMPT}\n\n"
            f"{build_interrogator_prompt(payload.targetSlot, slots_summary, payload.lastExtractedFact)}"
        )
        try:
            result = await llm.generate_json(prompt, purpose="api_triage_interrogate")
            return {"success": True, "action": "INTERROGATE", "result": result}
        except Exception as ex:
            logger.error("Interrogate evaluation failed: %s", ex)
            raise HTTPException(status_code=500, detail=str(ex)) from ex

    raise HTTPException(status_code=400, detail=f"Unsupported action: {payload.action}")


@router.post("/screen", status_code=status.HTTP_200_OK)
async def emergency_screening(payload: EmergencyScreenRequest) -> dict[str, Any]:
    result = screen_emergency(payload.text)
    return {
        "emergency": result.emergency,
        "rule_ids": list(result.rule_ids),
        "categories": list(result.categories),
        "action": result.action,
        "ruleset_version": result.ruleset_version,
    }
