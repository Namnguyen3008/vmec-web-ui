"""
Script khởi tạo tài khoản Bác sĩ mẫu trong Supabase Auth và upsert Profile.

Idempotent: có thể chạy lại nhiều lần mà không tạo user trùng hoặc lỗi
duplicate. Sau khi upsert Auth user, profile được upsert bằng ID trả về
từ Supabase Auth (đảm bảo profiles.id = auth.users.id).

Cách chạy:
    python -m backend.scripts.seed_doctors
"""

from __future__ import annotations

import logging
import os
import sys

from sqlalchemy import create_engine

from backend.app.config import Settings
from backend.app.repositories.postgresql.profile_repository import ProfileRepository
from backend.app.services.auth_service import AuthService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_doctors")


def main():
    settings = Settings.from_env()

    if not settings.supabase_url or not settings.supabase_secret_key:
        logger.error("Thiếu SUPABASE_URL hoặc SUPABASE_SECRET_KEY trong .env")
        sys.exit(1)
    if not settings.database_url:
        logger.error("Thiếu SUPABASE_DATABASE_URL trong .env")
        sys.exit(1)

    password = os.getenv("DOCTOR_SEED_PASSWORD", "")
    if not password:
        logger.error("Thiếu DOCTOR_SEED_PASSWORD trong .env")
        sys.exit(1)

    engine = create_engine(settings.database_url)
    profile_repo = ProfileRepository(engine)
    auth_svc = AuthService(
        supabase_url=settings.supabase_url,
        supabase_anon_key=settings.supabase_anon_key,
        supabase_secret_key=settings.supabase_secret_key,
        profile_repo=profile_repo,
    )

    doctors = [
        {
            "email": "bacsi1@phongkham.vn",
            "full_name": "BS. Trần Văn Bình",
            "phone_number": "0912345678",
        },
        {
            "email": "bacsi2@phongkham.vn",
            "full_name": "BS. Phạm Thị Mai",
            "phone_number": "0987654321",
        },
    ]

    logger.info("Đang upsert tài khoản Bác sĩ mẫu...")
    for item in doctors:
        try:
            profile = auth_svc.admin_upsert_user(
                email=item["email"],
                password=password,
                full_name=item["full_name"],
                role="DOCTOR",
                phone_number=item["phone_number"],
            )
            logger.info("✓ Upsert thành công: %s (ID: %s)", item["email"], profile.id)
        except Exception as exc:
            logger.warning("! Không thể upsert %s: %s", item["email"], exc)

    logger.info("Hoàn tất seed bác sĩ.")


if __name__ == "__main__":
    main()
