"""
Mistral 1024D Semantic Embedding Service for VMEC Healthcare.
Rotates requests across a pool of up to 13 Mistral API keys with retry & circuit breaker.
"""

from __future__ import annotations

import asyncio
import itertools
import logging
import time
from typing import Final

import httpx

from src.config import Settings, get_settings

logger = logging.getLogger("vmec.services.embedding")

MISTRAL_API_URL: Final[str] = "https://api.mistral.ai/v1/embeddings"
EXPECTED_DIMENSIONS: Final[int] = 1024


class MistralEmbeddingError(RuntimeError):
    pass


class MistralEmbeddingService:
    """
    Dedicated 1024D Semantic Embedding service using Mistral AI.
    """

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._keys = self.settings.get_mistral_api_keys()
        if not self._keys:
            raise ValueError("No Mistral API keys configured in settings.")

        self._key_cycle = itertools.cycle(self._keys)
        self._lock = asyncio.Lock()
        self._timeout = self.settings.mistral_call_timeout_seconds
        self._model = self.settings.mistral_embedding_model

    def _next_key(self) -> str:
        return next(self._key_cycle)

    async def embed_text(self, text: str) -> list[float]:
        """
        Embeds a single text input into a 1024-dimensional vector.
        """
        results = await self.embed_batch([text])
        if not results:
            raise MistralEmbeddingError(
                "Empty embedding response returned by Mistral API"
            )
        return results[0]

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """
        Embeds a batch of texts into 1024D vectors with key rotation and retry.
        """
        if not texts:
            return []

        clean_texts = [t.strip() for t in texts if t.strip()]
        if not clean_texts:
            raise ValueError("All input texts were empty after whitespace stripping")

        max_retries = min(len(self._keys), 3)
        last_error: Exception | None = None

        for attempt in range(max_retries):
            async with self._lock:
                api_key = self._next_key()

            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": self._model,
                "input": clean_texts,
            }

            try:
                start_time = time.perf_counter()
                async with httpx.AsyncClient(timeout=self._timeout) as client:
                    resp = await client.post(
                        MISTRAL_API_URL, json=payload, headers=headers
                    )
                    elapsed_ms = (time.perf_counter() - start_time) * 1000

                    if resp.status_code == 200:
                        data = resp.json()
                        embeddings_data = data.get("data", [])
                        embeddings = [
                            item.get("embedding", []) for item in embeddings_data
                        ]

                        # Verify dimensions
                        for idx, emb in enumerate(embeddings):
                            if len(emb) != EXPECTED_DIMENSIONS:
                                raise MistralEmbeddingError(
                                    f"Expected {EXPECTED_DIMENSIONS}D vector, got {len(emb)}D at index {idx}"
                                )

                        logger.debug(
                            "Embedded %d texts in %.2f ms using key ...%s",
                            len(texts),
                            elapsed_ms,
                            api_key[-6:],
                        )
                        return embeddings

                    if resp.status_code in (429, 500, 502, 503, 504):
                        logger.warning(
                            "Mistral API transient error %d (attempt %d/%d) using key ...%s: %s",
                            resp.status_code,
                            attempt + 1,
                            max_retries,
                            api_key[-6:],
                            resp.text[:100],
                        )
                        await asyncio.sleep(0.5 * (attempt + 1))
                        continue

                    raise MistralEmbeddingError(
                        f"Mistral API fatal error {resp.status_code}: {resp.text[:200]}"
                    )

            except httpx.TimeoutException as tex:
                logger.warning(
                    "Mistral embedding timeout on attempt %d: %s", attempt + 1, tex
                )
                last_error = tex
                await asyncio.sleep(0.5)
            except Exception as ex:
                logger.error(
                    "Mistral embedding exception on attempt %d: %s", attempt + 1, ex
                )
                last_error = ex
                if not isinstance(ex, httpx.RequestError):
                    raise

        raise MistralEmbeddingError(
            f"Failed to generate embeddings after {max_retries} attempts: {last_error}"
        )


_embedding_service_instance: MistralEmbeddingService | None = None


def get_embedding_service() -> MistralEmbeddingService:
    global _embedding_service_instance
    if _embedding_service_instance is None:
        _embedding_service_instance = MistralEmbeddingService()
    return _embedding_service_instance
