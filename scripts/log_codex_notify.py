#!/usr/bin/env python3
"""Capture Codex's turn-complete notification and submit it to Phoenix."""

import json
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
LOG_FILE = PROJECT_ROOT / ".ai-log" / "session.jsonl"
VN_TZ = timezone(timedelta(hours=7))


def git(*args: str) -> str:
    try:
        return subprocess.check_output(
            ["git", *args], cwd=PROJECT_ROOT, text=True, stderr=subprocess.DEVNULL
        ).strip()
    except (OSError, subprocess.SubprocessError):
        return ""


def inside_project(cwd: str) -> bool:
    try:
        Path(cwd).resolve().relative_to(PROJECT_ROOT.resolve())
        return True
    except (OSError, ValueError):
        return False


def main() -> int:
    raw = sys.argv[-1] if len(sys.argv) >= 2 else sys.stdin.buffer.read().decode(
        "utf-8", errors="replace"
    ).strip()
    try:
        data = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return 0

    if data.get("type") not in {"agent-turn-complete", "turn-ended"}:
        return 0
    if not inside_project(data.get("cwd", "")):
        return 0

    origin = git("remote", "get-url", "origin")
    if not origin:
        return 0
    repo = origin.rstrip("/").rsplit("/", 1)[-1]
    if repo.endswith(".git"):
        repo = repo[:-4]
    messages = data.get("input-messages") or data.get("input_messages") or []
    prompt = "\n".join(str(message) for message in messages).strip()[:1000]
    if not prompt:
        return 0

    entry = {
        "ts": datetime.now(VN_TZ).isoformat(),
        "tool": "codex",
        "event": "UserPromptSubmit",
        "session_id": data.get("thread-id") or data.get("thread_id") or "",
        "turn_id": data.get("turn-id") or data.get("turn_id") or "",
        "model": data.get("model", ""),
        "repo": repo,
        "branch": git("rev-parse", "--abbrev-ref", "HEAD"),
        "commit": git("rev-parse", "--short", "HEAD"),
        "student": git("config", "user.email"),
        "prompt": prompt,
    }

    LOG_FILE.parent.mkdir(exist_ok=True)
    with LOG_FILE.open("a", encoding="utf-8") as stream:
        stream.write(json.dumps(entry, ensure_ascii=False) + "\n")

    # Submission failure is non-destructive: submit_log.py restores pending logs.
    subprocess.run(
        [sys.executable, str(PROJECT_ROOT / "scripts" / "submit_log.py")],
        cwd=PROJECT_ROOT,
        check=False,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
