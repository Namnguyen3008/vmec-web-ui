"""
Azure Cosmos DB Repository for Patient Sessions (container: patient_sessions).
Partition Key: /userId, TTL: 86,400s (24 hours).
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from azure.cosmos.exceptions import CosmosHttpResponseError

from src.agents.state import SessionDocument, create_initial_slots
from src.persistence.cosmos_client import CosmosClientManager, get_cosmos_manager

logger = logging.getLogger("vmec.repositories.session")


class SessionRepository:
    """
    Manages Cosmos DB CRUD operations for patient conversational sessions.
    """

    def __init__(self, cosmos_manager: CosmosClientManager | None = None) -> None:
        self.cosmos = cosmos_manager or get_cosmos_manager()
        self._container_name = "patient_sessions"

    def _get_container(self) -> Any:
        return self.cosmos.get_container(self._container_name)

    async def get_session(
        self, session_id: str, user_id: str
    ) -> SessionDocument | None:
        container = self._get_container()
        try:
            doc = container.read_item(item=session_id, partition_key=user_id)
            return SessionDocument(**doc)
        except (
            CosmosHttpResponseError,
            KeyError,
            ValueError,
            RuntimeError,
            OSError,
        ) as ex:
            logger.debug(
                "Session '%s' not found for user '%s': %s", session_id, user_id, ex
            )
            return None

    async def get_or_create_session(
        self, session_id: str, user_id: str
    ) -> SessionDocument:
        existing = await self.get_session(session_id, user_id)
        if existing:
            return existing

        new_session = SessionDocument(
            id=session_id,
            userId=user_id,
            slots=create_initial_slots(),
            turn_count=0,
            progress_percent=0,
            urgency="ROUTINE",
            last_updated=datetime.now(timezone.utc).isoformat(),
            ttl=86400,
        )
        await self.save_session(new_session)
        return new_session

    async def save_session(self, session: SessionDocument) -> SessionDocument:
        container = self._get_container()
        session.last_updated = datetime.now(timezone.utc).isoformat()
        try:
            container.upsert_item(session.model_dump())
            logger.info(
                "Upserted session '%s' (user='%s', progress=%d%%)",
                session.id,
                session.userId,
                session.progress_percent,
            )
            return session
        except Exception as ex:
            logger.error("Failed to upsert session '%s': %s", session.id, ex)
            raise

    async def delete_session(self, session_id: str, user_id: str) -> bool:
        container = self._get_container()
        try:
            container.delete_item(item=session_id, partition_key=user_id)
            return True
        except (
            CosmosHttpResponseError,
            KeyError,
            ValueError,
            RuntimeError,
            OSError,
        ) as ex:
            logger.warning("Failed to delete session '%s': %s", session_id, ex)
            return False


_session_repo_instance: SessionRepository | None = None


def get_session_repository() -> SessionRepository:
    global _session_repo_instance
    if _session_repo_instance is None:
        _session_repo_instance = SessionRepository()
    return _session_repo_instance
