"""
FastAPI Booking Router for 15-minute Slot Holding and Permanent Appointment Confirmation.
Endpoints:
- POST /api/booking/hold : Create a 15-minute slot hold (Cosmos DB slot_holds).
- POST /api/booking/confirm : Confirm an appointment (Cosmos DB appointments).
- GET /api/booking/slots : List available booking time slots.
- GET /api/booking/appointments/{patient_id} : List confirmed appointments for patient.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field

from src.agents.nodes.psychology_node import DOCTOR_DIRECTORY
from src.repositories.audit_repository import get_audit_repository
from src.repositories.booking_repository import get_booking_repository

logger = logging.getLogger("vmec.api.booking")
router = APIRouter(prefix="/api/booking", tags=["booking"])


class HoldSlotRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    doctorId: str
    doctorName: str
    patientId: str
    specialtyCode: str
    specialtyName: str
    slotStart: str
    slotEnd: str
    room: str
    consultationFee: int = 350000


class ConfirmAppointmentRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    holdId: str
    doctorId: str
    patientId: str
    patientName: str = Field(min_length=1)
    patientPhone: str = Field(min_length=10)
    notes: str = ""


@router.post("/hold", status_code=status.HTTP_201_CREATED)
async def create_slot_hold(payload: HoldSlotRequest) -> dict[str, Any]:
    repo = get_booking_repository()
    try:
        hold = await repo.create_slot_hold(
            doctor_id=payload.doctorId,
            doctor_name=payload.doctorName,
            patient_id=payload.patientId,
            specialty_code=payload.specialtyCode,
            specialty_name=payload.specialtyName,
            slot_start=payload.slotStart,
            slot_end=payload.slotEnd,
            room=payload.room,
            consultation_fee=payload.consultationFee,
        )
        return {"success": True, "data": hold.model_dump()}
    except Exception as ex:
        logger.error("Failed to create slot hold: %s", ex)
        raise HTTPException(status_code=500, detail=str(ex)) from ex


@router.post("/confirm", status_code=status.HTTP_200_OK)
async def confirm_appointment(payload: ConfirmAppointmentRequest) -> dict[str, Any]:
    repo = get_booking_repository()
    audit_repo = get_audit_repository()
    try:
        appointment = await repo.confirm_appointment(
            hold_id=payload.holdId,
            doctor_id=payload.doctorId,
            patient_id=payload.patientId,
            patient_name=payload.patientName,
            patient_phone=payload.patientPhone,
            notes=payload.notes,
        )

        # Audit log the confirmed booking
        await audit_repo.log_event(
            session_id=payload.holdId,
            user_id=payload.patientId,
            event_type="APPOINTMENT_CONFIRMED",
            details={
                "appointmentId": appointment.id,
                "doctorId": appointment.doctorId,
                "doctorName": appointment.doctorName,
                "specialtyCode": appointment.specialtyCode,
                "slotStart": appointment.slotStart,
                "patientPhone": appointment.patientPhone,
            },
        )

        return {"success": True, "data": appointment.model_dump()}
    except Exception as ex:
        logger.error("Failed to confirm appointment: %s", ex)
        raise HTTPException(status_code=500, detail=str(ex)) from ex


@router.get("/slots", status_code=status.HTTP_200_OK)
async def get_available_slots(
    specialty_code: str = Query(default="TIM_MACH"),
) -> dict[str, Any]:
    doc_info = DOCTOR_DIRECTORY.get(specialty_code, DOCTOR_DIRECTORY["NOI_TONG_QUAT"])
    tomorrow = datetime.now(timezone.utc) + timedelta(days=1)
    slot_hours = [(8, 30), (10, 0), (14, 30), (16, 0)]

    slots = []
    for idx, (h, m) in enumerate(slot_hours, 1):
        st = tomorrow.replace(hour=h, minute=m, second=0, microsecond=0)
        et = st + timedelta(minutes=30)
        slots.append(
            {
                "slotId": f"SLOT_{specialty_code}_{idx}",
                "doctorId": doc_info["id"],
                "doctorName": doc_info["name"],
                "specialtyCode": specialty_code,
                "room": doc_info["room"],
                "slotStart": st.isoformat(),
                "slotEnd": et.isoformat(),
                "consultationFee": 350000,
                "isAvailable": True,
            }
        )

    return {"success": True, "specialty_code": specialty_code, "data": slots}


@router.get("/appointments/{patient_id}", status_code=status.HTTP_200_OK)
async def get_patient_appointments(patient_id: str) -> dict[str, Any]:
    repo = get_booking_repository()
    appointments = await repo.get_patient_appointments(patient_id)
    return {
        "success": True,
        "patient_id": patient_id,
        "data": [a.model_dump() for a in appointments],
    }
