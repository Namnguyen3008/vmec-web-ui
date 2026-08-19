"""Verify nhanh 2 API của lễ tân bằng JWT HS256 tự mint (chỉ dùng để kiểm thử)."""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt as pyjwt
from dotenv import load_dotenv

BACKEND_ENV = Path("backend/.env")
if BACKEND_ENV.is_file():
    load_dotenv(dotenv_path=BACKEND_ENV, override=True)

RECEPTIONIST_ID = os.getenv("VERIFY_RECEPTIONIST_ID", "5ed4e1c0-965e-44c3-96df-96419a5cd78e")
BASE_URL = os.getenv("VERIFY_API_BASE", "http://localhost:5000")


def main() -> int:
    secret = os.getenv("SUPABASE_JWT_SECRET", "")
    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    if not secret or not supabase_url:
        print("Thiếu SUPABASE_JWT_SECRET hoặc SUPABASE_URL trong backend/.env")
        return 2

    now = datetime.now(timezone.utc)
    payload = {
        "sub": RECEPTIONIST_ID,
        "iss": f"{supabase_url}/auth/v1",
        "aud": "authenticated",
        "exp": int((now + timedelta(hours=1)).timestamp()),
        "iat": int((now - timedelta(minutes=1)).timestamp()),
    }
    token = pyjwt.encode(payload, secret, algorithm="HS256")

    for path in [
        "/api/v1/appointments/reception/pending",
        "/api/v1/appointments/reception/handovers",
        "/api/v1/notifications?unread_only=true",
    ]:
        req = urllib.request.Request(
            f"{BASE_URL}{path}",
            headers={"Authorization": f"Bearer {token}"},
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode())
                total = data.get("data", {}).get("total")
                items = data.get("data", {}).get("items", [])
                print(f"=== {path} → HTTP {resp.status}, total={total}")
                for item in items[:6]:
                    brief = {
                        k: item.get(k)
                        for k in (
                            "appointment_code",
                            "status",
                            "patientName",
                            "patientPhone",
                            "reason",
                            "urgency",
                            "title",
                            "content",
                        )
                    }
                    print(" -", json.dumps(brief, ensure_ascii=False)[:220])
                if path == "/api/v1/notifications?unread_only=true":
                    print(f"   unread_count={data.get('data', {}).get('unread_count')}")
        except urllib.error.HTTPError as exc:
            print(f"=== {path} → HTTP {exc.code}:", exc.read().decode()[:300])
        except Exception as exc:  # noqa: BLE001
            print(f"=== {path} → ERROR:", exc)
    return 0


if __name__ == "__main__":
    sys.exit(main())