"""Seed chuyên khoa Miễn dịch - Dị ứng (MIEN_DICH_DI_UNG) + 3 bác sĩ + khoảng BLOCKED demo.

Mô hình lưới động: KHÔNG sinh row AVAILABLE — lịch trống tự sinh từ giờ làm việc
(xem backend/app/schedule/availability.py). Script chỉ tạo:
  - specialty MIEN_DICH_DI_UNG (code để tên 'Miễn dịch - Dị ứng' resolve
    qua CatalogRepository.resolve_specialty_id)
  - 3 bác sĩ (trước đây là Da liễu; data mới không còn nhóm Da liễu nên
    chuyển sang khoa gần nhất Miễn dịch - Dị ứng; account qua
    AuthService.admin_upsert_user khi --apply; profiles.id = auth.users.id
    bắt buộc cho FK doctors.user_id)
  - 2 row BLOCKED demo (id theo công thức window deterministic → idempotent)

Dry-run mặc định; pass --apply để commit.

Cách chạy:
    python -m backend.scripts.seed_da_lieu            # dry-run
    python -m backend.scripts.seed_da_lieu --apply    # commit
"""
from __future__ import annotations

import argparse
import logging
import os
import sys
from datetime import datetime, time, timedelta
from uuid import NAMESPACE_URL, uuid5
from zoneinfo import ZoneInfo

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import NullPool

from backend.app.config import Settings
from backend.app.models.catalog import Doctor, DoctorSpecialty, MedicalFacility, Specialty
from backend.app.models.schedule import DoctorScheduleSlot, ScheduleStatus
from backend.app.repositories.postgresql.profile_repository import ProfileRepository
from backend.app.services.auth_service import AuthService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_da_lieu")

SPECIALTY_CODE = "MIEN_DICH_DI_UNG"
SPECIALTY_NAME = "Miễn dịch - Dị ứng"
FACILITY_CODE = "VINMEC_SMART_CITY"
FACILITY_NAME = "Bệnh viện Đa khoa Quốc tế Vinmec Smart City"

DOCTORS = [
    {
        "email": "dailieu1@phongkham.vn",
        "full_name": "BS. Nguyễn Thị Hồng",
        "phone_number": "0912345680",
    },
    {
        "email": "dailieu2@phongkham.vn",
        "full_name": "BS. Lê Văn Đạt",
        "phone_number": "0912345681",
    },
    {
        "email": "dailieu3@phongkham.vn",
        "full_name": "BS. Trần Thu Hà",
        "phone_number": "0912345682",
    },
]


def _next_weekday(day, *, skip_days: int = 1):
    day = day + timedelta(days=skip_days)
    while day.weekday() >= 5:  # bỏ cuối tuần
        day += timedelta(days=1)
    return day


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    settings = Settings.from_env()
    if not settings.database_url:
        raise RuntimeError("SUPABASE_DATABASE_URL is required")

    engine = create_engine(
        settings.database_url,
        pool_pre_ping=True,
        poolclass=NullPool,
        connect_args={"prepare_threshold": None},
    )
    specialty_id = uuid5(NAMESPACE_URL, f"p208:specialty:{SPECIALTY_CODE}")
    facility_id = uuid5(NAMESPACE_URL, f"p208:facility:{FACILITY_CODE}")
    tz = ZoneInfo("Asia/Bangkok")
    today = datetime.now(tz).date()

    doctor_ids: dict[str, object] = {}
    with Session(engine) as session:
        # ── Facility + Specialty ────────────────────────────────────────────────
        facility = session.get(MedicalFacility, facility_id) or MedicalFacility(
            id=facility_id, code=FACILITY_CODE, name=FACILITY_NAME
        )
        facility.name = FACILITY_NAME
        session.add(facility)

        specialty = session.get(Specialty, specialty_id) or Specialty(
            id=specialty_id,
            code=SPECIALTY_CODE,
            name=SPECIALTY_NAME,
            keywords=[SPECIALTY_NAME],
        )
        specialty.name = SPECIALTY_NAME
        specialty.is_active = True
        session.add(specialty)

        # ── Bác sĩ ──────────────────────────────────────────────────────────────
        if args.apply:
            if not settings.supabase_url or not settings.supabase_secret_key:
                logger.error("Thiếu SUPABASE_URL hoặc SUPABASE_SECRET_KEY trong .env")
                sys.exit(1)
            password = os.getenv("DOCTOR_SEED_PASSWORD", "")
            if not password:
                logger.error("Thiếu DOCTOR_SEED_PASSWORD trong .env")
                sys.exit(1)
            auth_svc = AuthService(
                supabase_url=settings.supabase_url,
                supabase_anon_key=settings.supabase_anon_key,
                supabase_secret_key=settings.supabase_secret_key,
                profile_repo=ProfileRepository(engine),
            )

            for item in DOCTORS:
                try:
                    profile = auth_svc.admin_upsert_user(
                        email=item["email"],
                        password=password,
                        full_name=item["full_name"],
                        role="DOCTOR",
                        phone_number=item["phone_number"],
                    )
                except Exception as exc:
                    logger.warning("! Không thể upsert %s: %s", item["email"], exc)
                    continue
                doctor = session.get(Doctor, profile.id) or Doctor(user_id=profile.id)
                doctor.facility_id = facility_id
                doctor.bio = f"{profile.full_name} - {SPECIALTY_NAME}"
                doctor.is_accepting_appointments = True
                doctor.consultation_duration_minutes = 30
                session.add(doctor)
                session.merge(
                    DoctorSpecialty(
                        doctor_id=profile.id,
                        specialty_id=specialty_id,
                        is_primary=True,
                    )
                )
                doctor_ids[item["email"]] = profile.id

        # ── 2 khoảng BLOCKED demo (id theo công thức window → idempotent) ─────
        blocked_rows: list[DoctorScheduleSlot] = []
        if args.apply and doctor_ids:
            demo_blocks = [
                (
                    DOCTORS[0]["email"],
                    _next_weekday(today, skip_days=1),
                    (9, 0),
                    (10, 0),
                    "Bác sĩ nghỉ phép buổi sáng",
                ),
                (
                    DOCTORS[1]["email"],
                    _next_weekday(today, skip_days=2),
                    (14, 0),
                    (15, 0),
                    "Họp hội đồng khoa",
                ),
            ]
            for email, day, (start_h, start_m), (end_h, end_m), reason in demo_blocks:
                doctor_id = doctor_ids[email]
                start_local = datetime.combine(day, time(start_h, start_m), tz)
                end_local = datetime.combine(day, time(end_h, end_m), tz)
                blocked_slot = DoctorScheduleSlot(
                    id=uuid5(NAMESPACE_URL, f"p208:slot:{doctor_id}:{start_local.isoformat()}"),
                    doctor_id=doctor_id,
                    facility_id=facility_id,
                    specialty_id=specialty_id,
                    start_time=start_local,
                    end_time=end_local,
                    status=ScheduleStatus.BLOCKED.value,
                    blocked_reason=reason,
                    created_by=doctor_id,
                )
                if session.get(DoctorScheduleSlot, blocked_slot.id) is None:
                    session.add(blocked_slot)
                    blocked_rows.append(blocked_slot)

        if args.apply:
            session.commit()
        else:
            session.rollback()

    print(
        {
            "apply": args.apply,
            "specialty": {"id": str(specialty_id), "code": SPECIALTY_CODE, "name": SPECIALTY_NAME},
            "doctors": [{"email": item["email"], "full_name": item["full_name"]} for item in DOCTORS],
            "new_blocked_rows": len(blocked_rows),
            "note": "Availability is derived from working hours; no AVAILABLE rows are seeded.",
        }
    )


if __name__ == "__main__":
    main()
