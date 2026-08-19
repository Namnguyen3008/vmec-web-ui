"""Cấp tài khoản cho bác sĩ Vinmec Smart City và các vai trò mẫu.

Mặc định chỉ kiểm tra kế hoạch:
    python -m backend.scripts.seed_vinmec_smart_city_accounts

Tạo tài khoản thật và xuất thông tin đăng nhập ra CSV:
    python -m backend.scripts.seed_vinmec_smart_city_accounts --apply

Mỗi role dùng một mật khẩu chung được sinh khi chạy ``--apply``. CSV credentials
chứa mật khẩu rõ theo yêu cầu bàn giao. Không commit, không gửi qua log/chat và
nên xóa an toàn sau khi chuyển cho đúng người nhận.
"""

from __future__ import annotations

import argparse
import csv
import logging
import os
import re
import secrets
import string
import sys
from collections.abc import Iterable
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import create_engine

from backend.app.config import Settings
from backend.app.repositories.postgresql.profile_repository import ProfileRepository
from backend.app.services.auth_service import AuthService

LOGGER = logging.getLogger("seed_vinmec_smart_city_accounts")
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DOCTORS_CSV = PROJECT_ROOT / "scripts_data" / "vinmec_smart_city_doctors.csv"
DEFAULT_CREDENTIALS_DIR = PROJECT_ROOT / "backend" / "credentials"
TARGET_FACILITY = "Bệnh viện Đa khoa Quốc tế Vinmec Smart City"
EXPECTED_DOCTOR_COUNT = 75
PASSWORD_LENGTH = 20
PASSWORD_ALPHABET = string.ascii_letters + string.digits + "!@#$%*-_"
FIXED_ROLE_PASSWORDS = {
    "DOCTOR": "BacSi@SmartCity2026!",
    "RECEPTIONIST": "LeTan@SmartCity2026!",
    "PATIENT": "NguoiDung@SmartCity2026!",
}
EMAIL_DOMAIN_PATTERN = re.compile(r"^(?=.{1,253}$)(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z0-9-]{2,63}$")


@dataclass(frozen=True, slots=True)
class AccountSpec:
    username: str
    full_name: str
    role: str
    source_id: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=("Cấp tài khoản cho toàn bộ bác sĩ Vinmec Smart City, 2 lễ tân, 1 người dùng và 1 admin.")
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Thực sự tạo tài khoản. Nếu bỏ qua, script chỉ dry-run.",
    )
    parser.add_argument(
        "--doctors-csv",
        type=Path,
        default=DEFAULT_DOCTORS_CSV,
        help="CSV bác sĩ đã lọc.",
    )
    parser.add_argument(
        "--email-domain",
        default=os.getenv("ACCOUNT_SEED_EMAIL_DOMAIN", "p208.local"),
        help="Tên miền dùng để tạo email đăng nhập.",
    )
    parser.add_argument(
        "--credentials-output",
        type=Path,
        help=("File CSV credentials. Mặc định: backend/credentials/vinmec_smart_city_accounts_<UTC timestamp>.csv"),
    )
    parser.add_argument(
        "--allow-doctor-count-change",
        action="store_true",
        help="Cho phép chạy khi nguồn không còn đúng 75 bác sĩ.",
    )
    return parser.parse_args()


def normalize_domain(value: str) -> str:
    domain = value.strip().lower()
    if domain != "p208.local" and not EMAIL_DOMAIN_PATTERN.fullmatch(domain):
        raise ValueError(f"Tên miền email không hợp lệ: {value!r}")
    return domain


def load_doctor_accounts(csv_path: Path, email_domain: str) -> list[AccountSpec]:
    if not csv_path.is_file():
        raise FileNotFoundError(f"Không tìm thấy CSV bác sĩ: {csv_path}")

    accounts: list[AccountSpec] = []
    seen_ids: set[str] = set()
    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        required_columns = {"doctor_id", "name", "primary_facility"}
        missing = required_columns.difference(reader.fieldnames or [])
        if missing:
            raise ValueError(f"CSV thiếu cột bắt buộc: {', '.join(sorted(missing))}")

        for line_number, row in enumerate(reader, start=2):
            doctor_id = (row.get("doctor_id") or "").strip().lower()
            full_name = (row.get("name") or "").strip()
            facility = (row.get("primary_facility") or "").strip()
            if not doctor_id or not re.fullmatch(r"[a-z0-9_]+", doctor_id):
                raise ValueError(f"doctor_id không hợp lệ tại dòng {line_number}")
            if not full_name:
                raise ValueError(f"Thiếu tên bác sĩ tại dòng {line_number}")
            if facility != TARGET_FACILITY:
                raise ValueError(f"Bác sĩ {doctor_id} không thuộc đúng cơ sở {TARGET_FACILITY!r}")
            if doctor_id in seen_ids:
                raise ValueError(f"Trùng doctor_id: {doctor_id}")
            seen_ids.add(doctor_id)
            accounts.append(
                AccountSpec(
                    username=f"bs.{doctor_id}@{email_domain}",
                    full_name=full_name,
                    role="DOCTOR",
                    source_id=doctor_id,
                )
            )
    return accounts


def build_account_plan(csv_path: Path, email_domain: str) -> list[AccountSpec]:
    accounts = load_doctor_accounts(csv_path, email_domain)
    accounts.extend(
        [
            AccountSpec(
                username=f"letan.smartcity.1@{email_domain}",
                full_name="Lễ tân Vinmec Smart City 1",
                role="RECEPTIONIST",
                source_id="receptionist_1",
            ),
            AccountSpec(
                username=f"letan.smartcity.2@{email_domain}",
                full_name="Lễ tân Vinmec Smart City 2",
                role="RECEPTIONIST",
                source_id="receptionist_2",
            ),
            AccountSpec(
                username=f"nguoidung.smartcity@{email_domain}",
                full_name="Người dùng Vinmec Smart City",
                role="PATIENT",
                source_id="patient_1",
            ),
            AccountSpec(
                username=f"admin.smartcity@{email_domain}",
                full_name="Quản trị viên Vinmec Smart City",
                role="ADMIN",
                source_id="admin_1",
            ),
        ]
    )

    usernames = [account.username for account in accounts]
    if len(usernames) != len(set(usernames)):
        raise ValueError("Kế hoạch có tên tài khoản bị trùng")
    return accounts


def generate_password(length: int = PASSWORD_LENGTH) -> str:
    if length < 16:
        raise ValueError("Mật khẩu seed phải dài ít nhất 16 ký tự")
    while True:
        password = "".join(secrets.choice(PASSWORD_ALPHABET) for _ in range(length))
        if (
            any(char.islower() for char in password)
            and any(char.isupper() for char in password)
            and any(char.isdigit() for char in password)
            and any(char in "!@#$%*-_" for char in password)
        ):
            return password


def default_credentials_path() -> Path:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    return DEFAULT_CREDENTIALS_DIR / f"vinmec_smart_city_accounts_{timestamp}.csv"


def open_credentials_file(path: Path):
    resolved = path.expanduser().resolve()
    resolved.parent.mkdir(parents=True, exist_ok=True)
    handle = resolved.open("x", encoding="utf-8-sig", newline="")
    try:
        os.chmod(resolved, 0o600)
    except OSError:
        LOGGER.warning("Không thể giới hạn quyền file credentials trên hệ điều hành này")
    return resolved, handle


def create_accounts(
    accounts: Iterable[AccountSpec],
    auth_service: AuthService,
    credentials_path: Path,
) -> tuple[int, int, Path]:
    account_list = list(accounts)
    role_passwords = {
        role: FIXED_ROLE_PASSWORDS.get(role) or generate_password()
        for role in sorted({account.role for account in account_list})
    }
    resolved_path, handle = open_credentials_file(credentials_path)
    created = 0
    failed = 0
    try:
        writer = csv.DictWriter(
            handle,
            fieldnames=["username", "password", "role", "full_name", "source_id", "user_id"],
        )
        writer.writeheader()
        handle.flush()

        for account in account_list:
            password = role_passwords[account.role]
            try:
                profile = auth_service.admin_upsert_user(
                    email=account.username,
                    password=password,
                    full_name=account.full_name,
                    role=account.role,
                )
            except Exception as exc:
                failed += 1
                LOGGER.error("Tạo thất bại %s (%s): %s", account.username, account.role, exc)
                continue

            writer.writerow(
                {
                    "username": account.username,
                    "password": password,
                    "role": account.role,
                    "full_name": account.full_name,
                    "source_id": account.source_id,
                    "user_id": str(profile.id),
                }
            )
            handle.flush()
            created += 1
            LOGGER.info("Đã tạo %s (%s)", account.username, account.role)
    finally:
        handle.close()
    return created, failed, resolved_path


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    args = parse_args()
    try:
        email_domain = normalize_domain(args.email_domain)
        accounts = build_account_plan(args.doctors_csv.resolve(), email_domain)
    except (FileNotFoundError, ValueError) as exc:
        LOGGER.error("Dữ liệu đầu vào không hợp lệ: %s", exc)
        return 2

    doctor_count = sum(account.role == "DOCTOR" for account in accounts)
    if doctor_count != EXPECTED_DOCTOR_COUNT and not args.allow_doctor_count_change:
        LOGGER.error(
            "Nguồn hiện có %d bác sĩ, khác mốc đã kiểm tra là %d. "
            "Dùng --allow-doctor-count-change sau khi đã rà soát dữ liệu.",
            doctor_count,
            EXPECTED_DOCTOR_COUNT,
        )
        return 2

    role_counts = {
        role: sum(account.role == role for account in accounts)
        for role in ("DOCTOR", "RECEPTIONIST", "PATIENT", "ADMIN")
    }
    LOGGER.info("Kế hoạch: %s (tổng %d tài khoản)", role_counts, len(accounts))
    LOGGER.info("Tên tài khoản là email định danh không cần hộp thư thật, domain %s", email_domain)
    if not args.apply:
        LOGGER.info("Dry-run hoàn tất; chưa tạo tài khoản và chưa sinh mật khẩu")
        return 0

    settings = Settings.from_env()
    if not settings.supabase_url or not settings.supabase_secret_key:
        LOGGER.error("Thiếu SUPABASE_URL hoặc SUPABASE_SECRET_KEY")
        return 2
    if not settings.database_url:
        LOGGER.error("Thiếu SUPABASE_DATABASE_URL")
        return 2

    engine = create_engine(settings.database_url)
    auth_service = AuthService(
        supabase_url=settings.supabase_url,
        supabase_anon_key=settings.supabase_anon_key,
        supabase_secret_key=settings.supabase_secret_key,
        profile_repo=ProfileRepository(engine),
    )
    output_path = args.credentials_output or default_credentials_path()
    try:
        created, failed, resolved_path = create_accounts(accounts, auth_service, output_path)
    except FileExistsError:
        LOGGER.error("File credentials đã tồn tại; từ chối ghi đè: %s", output_path)
        return 2
    finally:
        engine.dispose()

    LOGGER.info("Hoàn tất: tạo %d, lỗi %d", created, failed)
    LOGGER.info("Credentials của tài khoản tạo thành công: %s", resolved_path)
    LOGGER.warning("Mỗi role dùng một mật khẩu chung trong file; hãy bàn giao kín và xóa sau khi dùng")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
