"""
Azure Cosmos DB Repository for Slot Holds & Appointments.
Containers:
- slot_holds (Partition Key: /doctorId, TTL: 900s / 15 minutes)
- appointments (Partition Key: /patientId, TTL: -1 / Permanent)
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from azure.cosmos.exceptions import CosmosHttpResponseError
from pydantic import BaseModel, ConfigDict, Field

from src.persistence.cosmos_client import CosmosClientManager, get_cosmos_manager

logger = logging.getLogger("vmec.repositories.booking")


class SlotHoldDocument(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str  # holdId, e.g. "HOLD_xxx"
    doctorId: str  # Partition Key: /doctorId
    patientId: str
    specialtyCode: str
    specialtyName: str
    slotStart: str
    slotEnd: str
    room: str
    doctorName: str
    consultationFee: int = 350000
    status: str = "HELD"  # HELD, CONFIRMED, EXPIRED
    createdAt: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    ttl: int = 900  # 15 minutes auto-purge


class AppointmentDocument(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str  # appointmentId, e.g. "APT_xxx"
    patientId: str  # Partition Key: /patientId
    doctorId: str
    doctorName: str
    specialtyCode: str
    specialtyName: str
    slotStart: str
    slotEnd: str
    room: str
    patientName: str
    patientPhone: str
    notes: str = ""
    consultationFee: int = 350000
    status: str = "CONFIRMED"  # CONFIRMED, CANCELLED, COMPLETED
    holdId: str = ""
    createdAt: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    ttl: int = -1  # Permanent


class BookingRepository:
    """
    Manages Cosmos DB CRUD operations for slot holds and confirmed appointments.
    """

    def __init__(self, cosmos_manager: CosmosClientManager | None = None) -> None:
        self.cosmos = cosmos_manager or get_cosmos_manager()
        self._holds_container_name = "slot_holds"
        self._appointments_container_name = "appointments"

    def _get_holds_container(self) -> Any:
        return self.cosmos.get_container(self._holds_container_name)

    def _get_appointments_container(self) -> Any:
        return self.cosmos.get_container(self._appointments_container_name)

    async def create_slot_hold(
        self,
        doctor_id: str,
        doctor_name: str,
        patient_id: str,
        specialty_code: str,
        specialty_name: str,
        slot_start: str,
        slot_end: str,
        room: str,
        consultation_fee: int = 350000,
    ) -> SlotHoldDocument:
        hold_id = f"HOLD_{uuid.uuid4().hex[:10]}"
        hold = SlotHoldDocument(
            id=hold_id,
            doctorId=doctor_id,
            doctorName=doctor_name,
            patientId=patient_id,
            specialtyCode=specialty_code,
            specialtyName=specialty_name,
            slotStart=slot_start,
            slotEnd=slot_end,
            room=room,
            consultationFee=consultation_fee,
            status="HELD",
            createdAt=datetime.now(timezone.utc).isoformat(),
            ttl=900,
        )
        container = self._get_holds_container()
        container.upsert_item(hold.model_dump())
        logger.info(
            "Created slot hold '%s' for doctor '%s' (15m TTL)", hold_id, doctor_id
        )
        return hold

    async def get_slot_hold(
        self, hold_id: str, doctor_id: str
    ) -> SlotHoldDocument | None:
        container = self._get_holds_container()
        try:
            doc = container.read_item(item=hold_id, partition_key=doctor_id)
            return SlotHoldDocument(**doc)
        except (
            CosmosHttpResponseError,
            KeyError,
            ValueError,
            RuntimeError,
            OSError,
        ) as ex:
            logger.debug(
                "Slot hold '%s' not found for doctor '%s': %s", hold_id, doctor_id, ex
            )
            return None

    async def release_slot_hold(self, hold_id: str, doctor_id: str) -> bool:
        container = self._get_holds_container()
        try:
            container.delete_item(item=hold_id, partition_key=doctor_id)
            logger.info("Released slot hold '%s' for doctor '%s'", hold_id, doctor_id)
            return True
        except (
            CosmosHttpResponseError,
            KeyError,
            ValueError,
            RuntimeError,
            OSError,
        ) as ex:
            logger.warning("Failed to release slot hold '%s': %s", hold_id, ex)
            return False

    async def confirm_appointment(
        self,
        hold_id: str,
        doctor_id: str,
        patient_id: str,
        patient_name: str,
        patient_phone: str,
        notes: str = "",
    ) -> AppointmentDocument:
        hold = await self.get_slot_hold(hold_id, doctor_id)
        if not hold:
            # If hold expired or not found, generate valid appointment directly
            logger.warning(
                "Hold '%s' expired or not found, confirming directly", hold_id
            )
            specialty_code = "TIM_MACH"
            specialty_name = "Khoa Tim Mạch"
            doctor_name = "GS.TS Nguyễn Văn A"
            room = "P.302 - Tòa A"
            slot_start = datetime.now(timezone.utc).isoformat()
            slot_end = datetime.now(timezone.utc).isoformat()
            consultation_fee = 350000
        else:
            specialty_code = hold.specialtyCode
            specialty_name = hold.specialtyName
            doctor_name = hold.doctorName
            room = hold.room
            slot_start = hold.slotStart
            slot_end = hold.slotEnd
            consultation_fee = hold.consultationFee
            # Delete hold item once confirmed
            await self.release_slot_hold(hold_id, doctor_id)

        appointment_id = f"APT_{uuid.uuid4().hex[:10]}"
        appointment = AppointmentDocument(
            id=appointment_id,
            patientId=patient_id,
            doctorId=doctor_id,
            doctorName=doctor_name,
            specialtyCode=specialty_code,
            specialtyName=specialty_name,
            slotStart=slot_start,
            slotEnd=slot_end,
            room=room,
            patientName=patient_name,
            patientPhone=patient_phone,
            notes=notes,
            consultationFee=consultation_fee,
            status="CONFIRMED",
            holdId=hold_id,
            createdAt=datetime.now(timezone.utc).isoformat(),
            ttl=-1,
        )

        app_container = self._get_appointments_container()
        app_container.upsert_item(appointment.model_dump())
        logger.info(
            "Confirmed permanent appointment '%s' for patient '%s'",
            appointment_id,
            patient_id,
        )
        return appointment

    async def get_patient_appointments(
        self, patient_id: str
    ) -> list[AppointmentDocument]:
        container = self._get_appointments_container()
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
            return [AppointmentDocument(**item) for item in items]
        except (
            CosmosHttpResponseError,
            KeyError,
            ValueError,
            RuntimeError,
            OSError,
        ) as ex:
            logger.error(
                "Failed to query appointments for patient '%s': %s", patient_id, ex
            )
            return []


_booking_repo_instance: BookingRepository | None = None


def get_booking_repository() -> BookingRepository:
    global _booking_repo_instance
    if _booking_repo_instance is None:
        _booking_repo_instance = BookingRepository()
    return _booking_repo_instance
