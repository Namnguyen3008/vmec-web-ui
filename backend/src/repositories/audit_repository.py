"""
Azure Cosmos DB Repository for HIPAA/PHI Audit Logging.
Container: audit_logs (Partition Key: /sessionId, TTL: -1 / Permanent).
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from src.persistence.cosmos_client import CosmosClientManager, get_cosmos_manager

logger = logging.getLogger("vmec.repositories.audit")


class AuditLogDocument(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str  # Audit Log ID, e.g. "AUDIT_xxx"
    sessionId: str  # Partition Key: /sessionId
    userId: str
    eventType: str  # e.g., "TRIAGE_COMPLETED", "EMERGENCY_DETECTED", "PROMPT_BLOCKED", "APPOINTMENT_CONFIRMED"
    details: dict[str, Any] = Field(default_factory=dict)
    ipAddress: str = "127.0.0.1"
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    ttl: int = -1  # Permanent audit log


class AuditRepository:
    """
    Manages Cosmos DB CRUD operations for security and compliance audit logs.
    """

    def __init__(self, cosmos_manager: CosmosClientManager | None = None) -> None:
        self.cosmos = cosmos_manager or get_cosmos_manager()
        self._container_name = "audit_logs"

    def _get_container(self) -> Any:
        return self.cosmos.get_container(self._container_name)

    async def log_event(
        self,
        session_id: str,
        user_id: str,
        event_type: str,
        details: dict[str, Any] | None = None,
        ip_address: str = "127.0.0.1",
    ) -> AuditLogDocument:
        log_id = f"AUDIT_{uuid.uuid4().hex[:10]}"
        entry = AuditLogDocument(
            id=log_id,
            sessionId=session_id,
            userId=user_id,
            eventType=event_type,
            details=details or {},
            ipAddress=ip_address,
            timestamp=datetime.now(timezone.utc).isoformat(),
            ttl=-1,
        )
        container = self._get_container()
        container.upsert_item(entry.model_dump())
        logger.info("Recorded audit log '%s' for event '%s'", log_id, event_type)
        return entry


_audit_repo_instance: AuditRepository | None = None


def get_audit_repository() -> AuditRepository:
    global _audit_repo_instance
    if _audit_repo_instance is None:
        _audit_repo_instance = AuditRepository()
    return _audit_repo_instance
