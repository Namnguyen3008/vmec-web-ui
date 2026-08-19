"""
Google Gemini Generative AI Service for VMEC Healthcare.
Strictly restricted to: gemini-3.1-flash-lite and gemini-3.5-flash-lite.
Implements 7-key rotation, alternating round-robin, circuit breaker, and automatic failover.
"""

from __future__ import annotations

import asyncio
import itertools
import json
import logging
import time
import uuid
from dataclasses import asdict, dataclass
from typing import Any, Final

import httpx

from src.config import ALLOWED_GEMINI_MODELS, Settings, get_settings

logger = logging.getLogger("vmec.services.llm")

SAFE_HANDOFF_MESSAGE: Final[str] = (
    "Hệ thống AI đang tạm thời gián đoạn. Vui lòng liên hệ nhân viên y tế VMEC để được hỗ trợ trực tiếp."
)


@dataclass(frozen=True)
class ModelTelemetry:
    model_call_id: str
    purpose: str
    selected_model: str
    attempted_models: tuple[str, ...]
    status: str
    failure_code: str | None
    latency_ms: int

    def safe_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class GeminiResult:
    text: str
    model: str
    failed_over: bool = False
    handoff: bool = False
    model_call_id: str = ""
    telemetry: ModelTelemetry | None = None


class GeminiRoundRobinService:
    """
    PHI-safe Gemini Service executing strict dual-model rotation across 7 API keys.
    """

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._keys = self.settings.get_gemini_api_keys()
        if not self._keys:
            raise ValueError("No Gemini API keys configured.")

        self._key_cycle = itertools.cycle(self._keys)
        self._lock = asyncio.Lock()
        self._round_robin_counter = 0
        self._timeout = self.settings.gemini_call_timeout_seconds
        self._max_attempts = self.settings.gemini_max_attempts_per_model
        self._circuit_breakers: dict[str, dict[str, Any]] = {
            m: {"state": "closed", "failures": 0, "opened_at": 0.0}
            for m in ALLOWED_GEMINI_MODELS
        }

    def _next_key(self) -> str:
        return next(self._key_cycle)

    async def _select_models(self) -> tuple[str, str]:
        """
        Alternates between gemini-3.1-flash-lite and gemini-3.5-flash-lite.
        """
        async with self._lock:
            self._round_robin_counter += 1
            index = (self._round_robin_counter - 1) % 2
            return ALLOWED_GEMINI_MODELS[index], ALLOWED_GEMINI_MODELS[1 - index]

    def _is_circuit_open(self, model: str) -> bool:
        cb = self._circuit_breakers.get(model, {})
        if cb.get("state") == "open":
            if time.time() - cb.get("opened_at", 0.0) < 60.0:  # 60s cooldown
                return True
            # Half-open
            cb["state"] = "closed"
            cb["failures"] = 0
        return False

    def _record_failure(self, model: str) -> None:
        cb = self._circuit_breakers.setdefault(
            model, {"state": "closed", "failures": 0, "opened_at": 0.0}
        )
        cb["failures"] = cb.get("failures", 0) + 1
        if cb["failures"] >= 3:
            cb["state"] = "open"
            cb["opened_at"] = time.time()
            logger.warning("Circuit breaker OPENED for model: %s", model)

    def _record_success(self, model: str) -> None:
        cb = self._circuit_breakers.setdefault(
            model, {"state": "closed", "failures": 0, "opened_at": 0.0}
        )
        cb["failures"] = 0
        cb["state"] = "closed"

    async def generate(
        self,
        prompt: str,
        *,
        purpose: str = "triage",
        temperature: float = 0.1,
        max_output_tokens: int = 2048,
    ) -> GeminiResult:
        call_id = str(uuid.uuid4())
        start_time = time.monotonic()
        primary_model, secondary_model = await self._select_models()

        candidate_models = (
            [secondary_model, primary_model]
            if self._is_circuit_open(primary_model)
            else [primary_model, secondary_model]
        )

        attempted_models: list[str] = []
        last_failure_code: str | None = None

        for model in candidate_models:
            attempted_models.append(model)
            for attempt in range(self._max_attempts):
                async with self._lock:
                    key = self._next_key()

                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": temperature,
                        "maxOutputTokens": max_output_tokens,
                    },
                }

                try:
                    async with httpx.AsyncClient(timeout=self._timeout) as client:
                        resp = await client.post(url, json=payload)

                        if resp.status_code == 200:
                            data = resp.json()
                            parts = (
                                data.get("candidates", [{}])[0]
                                .get("content", {})
                                .get("parts", [{}])
                            )
                            text = "".join(p.get("text", "") for p in parts).strip()
                            if text:
                                self._record_success(model)
                                latency_ms = int((time.monotonic() - start_time) * 1000)
                                telemetry = ModelTelemetry(
                                    model_call_id=call_id,
                                    purpose=purpose,
                                    selected_model=model,
                                    attempted_models=tuple(attempted_models),
                                    status="success",
                                    failure_code=None,
                                    latency_ms=latency_ms,
                                )
                                return GeminiResult(
                                    text=text,
                                    model=model,
                                    failed_over=(model != primary_model),
                                    handoff=False,
                                    model_call_id=call_id,
                                    telemetry=telemetry,
                                )

                        logger.warning(
                            "Gemini [%s] key ...%s returned HTTP %d: %s",
                            model,
                            key[:10],
                            resp.status_code,
                            resp.text[:100],
                        )
                        last_failure_code = f"HTTP_{resp.status_code}"

                except (
                    httpx.HTTPError,
                    TimeoutError,
                    asyncio.TimeoutError,
                    RuntimeError,
                    OSError,
                ) as ex:
                    logger.warning(
                        "Gemini [%s] error on attempt %d: %s", model, attempt + 1, ex
                    )
                    last_failure_code = type(ex).__name__

                await asyncio.sleep(0.3 * (attempt + 1))

            self._record_failure(model)

        # Both models failed -> Safe Handoff
        latency_ms = int((time.monotonic() - start_time) * 1000)
        telemetry = ModelTelemetry(
            model_call_id=call_id,
            purpose=purpose,
            selected_model="none",
            attempted_models=tuple(attempted_models),
            status="failed_handoff",
            failure_code=last_failure_code,
            latency_ms=latency_ms,
        )
        return GeminiResult(
            text=SAFE_HANDOFF_MESSAGE,
            model="none",
            failed_over=True,
            handoff=True,
            model_call_id=call_id,
            telemetry=telemetry,
        )

    async def generate_json(
        self,
        prompt: str,
        *,
        purpose: str = "triage_json",
        temperature: float = 0.0,
    ) -> dict[str, Any]:
        """
        Generates structured JSON output from Gemini and parses it reliably.
        """
        json_prompt = (
            f"{prompt}\n\n"
            "IMPORTANT: Output ONLY a valid JSON object. Do not include markdown code block ticks (```json) or extraneous commentary."
        )
        result = await self.generate(
            json_prompt,
            purpose=purpose,
            temperature=temperature,
        )
        raw_text = result.text.strip()

        # Clean markdown ticks if present
        if raw_text.startswith("```"):
            raw_text = raw_text.strip("`")
            if raw_text.startswith("json"):
                raw_text = raw_text[4:].strip()

        try:
            return json.loads(raw_text)
        except json.JSONDecodeError:
            # Attempt regex extraction of first JSON object
            import re

            match = re.search(r"\{.*\}", raw_text, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            logger.error("Failed to parse JSON from Gemini response: %s", raw_text)
            return {"error": "JSON_DECODE_FAILED", "raw_text": raw_text}


_llm_service_instance: GeminiRoundRobinService | None = None


def get_llm_service() -> GeminiRoundRobinService:
    global _llm_service_instance
    if _llm_service_instance is None:
        _llm_service_instance = GeminiRoundRobinService()
    return _llm_service_instance
