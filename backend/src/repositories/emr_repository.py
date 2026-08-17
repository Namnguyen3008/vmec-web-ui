"""
Azure Cosmos DB Repository for Electronic Medical Records (EMR).
Container: medical_records (Partition Key: /patientId, TTL: -1 / Permanent).
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from azure.cosmos.exceptions import CosmosHttpResponseError
from pydantic import BaseModel, ConfigDict, Field

from src.persistence.cosmos_client import CosmosClientManager, get_cosmos_manager

logger = logging.getLogger("vmec.repositories.emr")


class MedicalRecordDocument(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str  # EMR ID, e.g. "EMR_xxx"
    patientId: str  # Partition Key: /patientId
    sessionId: str
    chiefComplaint: str
    triageSummary: str
    recommendedSpecialtyCode: str
    recommendedSpecialtyName: str
    preliminaryTests: list[str] = Field(default_factory=list)
    doctorNotes: str = ""
    status: str = "OPEN"  # OPEN, REVIEWED, ARCHIVED
    createdAt: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    ttl: int = -1  # Permanent


class EMRRepository:
    """
    Manages Cosmos DB CRUD operations for patient medical records.
    """

    def __init__(self, cosmos_manager: CosmosClientManager | None = None) -> None:
        self.cosmos = cosmos_manager or get_cosmos_manager()
        self._container_name = "medical_records"

    def _get_container(self) -> Any:
        return self.cosmos.get_container(self._container_name)

    async def create_record(
        self,
        patient_id: str,
        session_id: str,
        chief_complaint: str,
        triage_summary: str,
        recommended_specialty_code: str,
        recommended_specialty_name: str,
        preliminary_tests: list[str] | None = None,
        doctor_notes: str = "",
    ) -> MedicalRecordDocument:
        record_id = f"EMR_{uuid.uuid4().hex[:10]}"
        record = MedicalRecordDocument(
            id=record_id,
            patientId=patient_id,
            sessionId=session_id,
            chiefComplaint=chief_complaint,
            triageSummary=triage_summary,
            recommendedSpecialtyCode=recommended_specialty_code,
            recommendedSpecialtyName=recommended_specialty_name,
            preliminaryTests=preliminary_tests or [],
            doctorNotes=doctor_notes,
            status="OPEN",
            createdAt=datetime.now(timezone.utc).isoformat(),
            ttl=-1,
        )
        container = self._get_container()
        container.upsert_item(record.model_dump())
        logger.info("Created EMR record '%s' for patient '%s'", record_id, patient_id)
        return record

    async def get_patient_records(self, patient_id: str) -> list[MedicalRecordDocument]:
        container = self._get_container()
        query = (
            "SELECT * FROM c WHERE c.patientId = @patientId ORDER BY c.createdAt DESC"
        )
        parameters = [{"name": "@patientId", "value": patient_id}]
        try:
            items = list(
                container.query_items(
                    query=query,
                    parameters=parameters,
                    enable_cross_partition_query=False,
                )
            )
            return [MedicalRecordDocument(**item) for item in items]
        except (
            CosmosHttpResponseError,
            KeyError,
            ValueError,
            RuntimeError,
            OSError,
        ) as ex:
            logger.error(
                "Failed to query EMR records for patient '%s': %s", patient_id, ex
            )
            return []


_emr_repo_instance: EMRRepository | None = None


def get_emr_repository() -> EMRRepository:
    global _emr_repo_instance
    if _emr_repo_instance is None:
        _emr_repo_instance = EMRRepository()
    return _emr_repo_instance
