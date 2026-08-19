"""Seed catalog đặt lịch theo 6 nhóm chuyên khoa của knowledge base.

Mô hình lưới động: KHÔNG sinh row AVAILABLE — cửa sổ trống được backend sinh
động từ giờ làm việc (xem backend/app/schedule/availability.py). Script chỉ
link bác sĩ (profile DOCTOR ACTIVE đã tồn tại) với facility + chuyên khoa.
Dry-run mặc định; pass --apply để commit.

Chuyên khoa theo đúng 6 nhóm trong data/processed/diseases/du_lieu_benh_trieu_chung_heading.md:
khoa mắt, hô hấp, khoa tiêu hóa - gan mật, Chấn thương chỉnh hình – Y học thể thao,
miễn dịch - dị ứng, tai, mũi, họng.

Bác sĩ từ CSV Vinmec được gán vào khoa gần nhất qua CSV_SPECIALTY_MAP; bác sĩ thuộc
chuyên khoa không có trong 6 nhóm vẫn GIỮ profile (đăng nhập được) nhưng KHÔNG tạo
Doctor row → không nhận lịch đặt qua chat.
"""
from __future__ import annotations

import argparse
import csv
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5

from sqlalchemy import create_engine, delete, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import NullPool

from backend.app.config import Settings
from backend.app.models.catalog import Doctor, DoctorSpecialty, MedicalFacility, Specialty
from backend.app.models.profile import Profile

FACILITY_CODE = "VINMEC_SMART_CITY"
FACILITY_NAME = "Bệnh viện Đa khoa Quốc tế Vinmec Smart City"

# (code, tên hiển thị) — code khớp với _code(name) của từng chuyên khoa trong data mới.
NEW_SPECIALTIES: list[tuple[str, str]] = [
    ("KHOA_MAT", "Khoa Mắt"),
    ("HO_HAP", "Hô hấp"),
    ("KHOA_TIEU_HOA_GAN_MAT", "Khoa Tiêu hóa - Gan mật"),
    ("CHAN_THUONG_CHINH_HINH_Y_HOC_THE_THAO", "Chấn thương chỉnh hình - Y học thể thao"),
    ("MIEN_DICH_DI_UNG", "Miễn dịch - Dị ứng"),
    ("TAI_MUI_HONG", "Tai, Mũi, Họng"),
]

# primary_specialty trong CSV Vinmec → mã chuyên khoa mới (khoa gần nhất).
CSV_SPECIALTY_MAP: dict[str, str] = {
    "Mắt": "KHOA_MAT",
    "Nội Tiêu hóa - Nội soi": "KHOA_TIEU_HOA_GAN_MAT",
    "Ngoại Chấn thương chỉnh hình": "CHAN_THUONG_CHINH_HINH_Y_HOC_THE_THAO",
    "Hồi sức - Cấp cứu": "HO_HAP",
    "Nhi": "TAI_MUI_HONG",
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    settings = Settings.from_env()
    if not settings.database_url:
        raise RuntimeError("SUPABASE_DATABASE_URL is required")
    csv_path = Path(__file__).resolve().parents[2] / "scripts_data" / "vinmec_smart_city_doctors.csv"
    with csv_path.open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))

    facility_id = uuid5(NAMESPACE_URL, f"p208:facility:{FACILITY_CODE}")
    specialty_ids = {
        code: uuid5(NAMESPACE_URL, f"p208:specialty:{code}") for code, _ in NEW_SPECIALTIES
    }
    # NullPool + prepare_threshold=None: tương thích Supabase transaction pooler :6543.
    engine = create_engine(
        settings.database_url,
        pool_pre_ping=True,
        poolclass=NullPool,
        connect_args={"prepare_threshold": None},
    )
    linked_doctors = 0
    skipped_doctors = 0
    with Session(engine) as session:
        # ── Facility + 6 chuyên khoa ───────────────────────────────────────────
        facility = session.get(MedicalFacility, facility_id) or MedicalFacility(
            id=facility_id, code=FACILITY_CODE, name=FACILITY_NAME
        )
        facility.name = FACILITY_NAME
        session.add(facility)

        for code, name in NEW_SPECIALTIES:
            specialty = session.get(Specialty, specialty_ids[code]) or Specialty(
                id=specialty_ids[code],
                code=code,
                name=name,
                keywords=[name],
            )
            specialty.name = name
            specialty.is_active = True
            session.add(specialty)

        # ── Profiles bác sĩ đang hoạt động ─────────────────────────────────────
        profiles = {
            profile.full_name.casefold(): profile
            for profile in session.scalars(
                select(Profile).where(Profile.role == "DOCTOR", Profile.status == "ACTIVE")
            )
        }

        for row in rows:
            profile = profiles.get((row.get("name") or "").strip().casefold())
            specialty_name = (row.get("primary_specialty") or "").strip()
            if profile is None or not specialty_name:
                continue
            code = CSV_SPECIALTY_MAP.get(specialty_name)
            if code is None or code not in specialty_ids:
                # Giữ profile nhưng không tạo Doctor row → không nhận lịch qua chat.
                skipped_doctors += 1
                continue

            doctor = session.get(Doctor, profile.id) or Doctor(user_id=profile.id)
            doctor.facility_id = facility_id
            doctor.bio = f"{profile.full_name} - {specialty_name}"
            doctor.is_accepting_appointments = True
            session.add(doctor)
            # Xoá liên kết chuyên khoa cũ trước khi gắn khoa mới (idempotent khi chạy lại)
            session.execute(delete(DoctorSpecialty).where(DoctorSpecialty.doctor_id == profile.id))
            session.merge(
                DoctorSpecialty(
                    doctor_id=profile.id,
                    specialty_id=specialty_ids[code],
                    is_primary=True,
                )
            )
            linked_doctors += 1

        if args.apply:
            session.commit()
        else:
            session.rollback()

    print({
        "apply": args.apply,
        "linked_doctors": linked_doctors,
        "skipped_doctors_keep_profile": skipped_doctors,
        "note": "Availability is derived from working hours; no AVAILABLE rows are seeded.",
    })


if __name__ == "__main__":
    main()
