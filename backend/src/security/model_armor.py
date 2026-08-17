"""
Google Model Armor Security Shield for VMEC Healthcare.
Implements Prompt Injection / Jailbreak Mitigation, Credential Leak Query Blocking,
Sensitive Data Protection (SDP/HIPAA) for PII/PHI Redaction, and Response Sanitization.
"""

from __future__ import annotations

import re
import time
from dataclasses import dataclass, field
from typing import Literal

RuleType = Literal[
    "PROMPT_INJECTION",
    "JAILBREAK",
    "SENSITIVE_DATA_PII",
    "CREDENTIAL_LEAK_QUERY",
    "MALICIOUS_URI",
    "HARMFUL_CONTENT",
]

ConfidenceLevel = Literal["HIGH", "MEDIUM", "LOW"]


@dataclass(frozen=True)
class ModelArmorViolation:
    rule: RuleType
    confidence: ConfidenceLevel
    description: str


@dataclass(frozen=True)
class ModelArmorFilterResult:
    is_safe: bool
    sanitized_text: str
    safety_refusal_message: str | None = None
    violations: list[ModelArmorViolation] = field(default_factory=list)
    latency_ms: float = 0.0


KNOWN_JAILBREAK_PATTERNS = (
    re.compile(r"ignore\s+(all\s+)?previous\s+instructions", re.IGNORECASE),
    re.compile(r"you\s+are\s+now\s+(DAN|unfiltered|jailbroken)", re.IGNORECASE),
    re.compile(r"forget\s+(your\s+)?system\s+(prompt|instructions)", re.IGNORECASE),
    re.compile(r"act\s+as\s+a\s+hacker", re.IGNORECASE),
    re.compile(r"bỏ\s+qua\s+(toàn\s+bộ\s+)?hướng\s+dẫn\s+trước\s+đó", re.IGNORECASE),
    re.compile(r"đóng\s+vai\s+kẻ\s+tấn\s+công", re.IGNORECASE),
    re.compile(r"bypass\s+safety", re.IGNORECASE),
)

SECURITY_CREDENTIAL_PATTERNS = (
    re.compile(r"api\s*key", re.IGNORECASE),
    re.compile(r"apikey", re.IGNORECASE),
    re.compile(r"api_key", re.IGNORECASE),
    re.compile(
        r"cung\s+cấp\s+(api|key|token|mật\s+khẩu|password|credentials|database)",
        re.IGNORECASE,
    ),
    re.compile(
        r"cho\s+(tôi\s+)?xin\s+(api|key|token|mật\s+khẩu|password|credentials|database)",
        re.IGNORECASE,
    ),
    re.compile(
        r"cần\s+(credentials|database|mật\s+khẩu|password|api\s*key)",
        re.IGNORECASE,
    ),
    re.compile(r"credential", re.IGNORECASE),
    re.compile(r"database\s+credentials", re.IGNORECASE),
    re.compile(r"credentials\s+database", re.IGNORECASE),
    re.compile(r"system\s+prompt", re.IGNORECASE),
    re.compile(r"prompt\s+hệ\s+thống", re.IGNORECASE),
    re.compile(r"cấu\s+hình\s+hệ\s+thống", re.IGNORECASE),
    re.compile(r"mã\s+nguồn", re.IGNORECASE),
    re.compile(r"source\s*code", re.IGNORECASE),
)

VIETNAMESE_ID_PATTERN = re.compile(r"\b\d{9}\b|\b\d{12}\b")
PHONE_NUMBER_PATTERN = re.compile(r"\b(0[3|5|7|8|9][0-9]{8})\b")

SAFETY_REFUSAL_TEMPLATE = (
    "Tôi là **AI Agent Trợ Lý Đặt Lịch Khám & Điều Hướng Chuyên Khoa Thông Minh (VMEC)**, "
    "trực thuộc Hệ thống Y tế Đa khoa Quốc tế VMEC.\n\n"
    "🔒 **THÔNG CÁO AN TOÀN THÔNG TIN & BẢO MẬT DỮ LIỆU Y TẾ:**\n"
    "Hệ thống AI Agent tuân thủ nghiêm ngặt **Tiêu chuẩn An toàn Dữ liệu Y tế Quốc tế (ISO 27799 / HIPAA)** "
    "và **Khung Quản trị Ứng dụng Trí tuệ Nhân tạo của Bộ Y Tế**. Nhằm bảo vệ an toàn thông tin người bệnh (PHI/PII) "
    "và tính toàn vẹn hệ thống:\n"
    "• Toàn bộ tham số cấu hình máy chủ, System Prompts, API Keys, Database Credentials và mã nguồn nội bộ đều được mã hóa, "
    "cô lập nghiêm ngặt và không được phép tiết lộ.\n"
    "• AI Agent chỉ tiếp nhận mô tả triệu chứng và hỗ trợ điều hướng chuyên khoa/đặt lịch khám tại Hệ thống Y tế VMEC.\n\n"
    "Nếu bạn hoặc người thân đang cần tư vấn về triệu chứng khó chịu hoặc có nhu cầu đặt lịch khám, "
    "xin vui lòng chia sẻ thông tin để tôi hỗ trợ bạn chu đáo nhất!"
)


def sanitize_user_prompt_sync(prompt: str) -> ModelArmorFilterResult:
    start_time = time.perf_counter()
    violations: list[ModelArmorViolation] = []
    sanitized = prompt

    # 1. Check Prompt Injection / Jailbreak
    for pattern in KNOWN_JAILBREAK_PATTERNS:
        if pattern.search(prompt):
            violations.append(
                ModelArmorViolation(
                    rule="PROMPT_INJECTION",
                    confidence="HIGH",
                    description="Phát hiện nỗ lực ghi đè hệ thống hoặc jailbreak prompt",
                )
            )
            break

    # 2. Check Credential / System Secret Leak Queries
    for pattern in SECURITY_CREDENTIAL_PATTERNS:
        if pattern.search(prompt):
            violations.append(
                ModelArmorViolation(
                    rule="CREDENTIAL_LEAK_QUERY",
                    confidence="HIGH",
                    description="Phát hiện truy vấn yêu cầu tiết lộ API Key, Secret hoặc cấu hình bảo mật",
                )
            )
            break

    # 3. Sensitive Data Protection (PHI / PII Masking)
    if PHONE_NUMBER_PATTERN.search(sanitized):
        sanitized = PHONE_NUMBER_PATTERN.sub("[REDACTED_PHONE]", sanitized)
        violations.append(
            ModelArmorViolation(
                rule="SENSITIVE_DATA_PII",
                confidence="MEDIUM",
                description="Đã ẩn số điện thoại cá nhân theo chuẩn SDP / HIPAA",
            )
        )

    if VIETNAMESE_ID_PATTERN.search(sanitized):
        sanitized = VIETNAMESE_ID_PATTERN.sub("[REDACTED_CCCD]", sanitized)
        violations.append(
            ModelArmorViolation(
                rule="SENSITIVE_DATA_PII",
                confidence="HIGH",
                description="Đã ẩn số CCCD / CMND của người bệnh",
            )
        )

    is_blocked = any(
        v.rule in ("PROMPT_INJECTION", "JAILBREAK", "CREDENTIAL_LEAK_QUERY")
        for v in violations
    )

    elapsed_ms = (time.perf_counter() - start_time) * 1000

    return ModelArmorFilterResult(
        is_safe=not is_blocked,
        sanitized_text=sanitized,
        safety_refusal_message=SAFETY_REFUSAL_TEMPLATE if is_blocked else None,
        violations=violations,
        latency_ms=elapsed_ms,
    )


async def sanitize_user_prompt(prompt: str) -> ModelArmorFilterResult:
    return sanitize_user_prompt_sync(prompt)


def sanitize_model_response(response: str) -> ModelArmorFilterResult:
    start_time = time.perf_counter()
    violations: list[ModelArmorViolation] = []

    # Verify no sensitive API keys or credentials leaked
    if any(marker in response for marker in ("AIzaSy", "sk-", "Bearer ", "AQ.Ab8")):
        violations.append(
            ModelArmorViolation(
                rule="SENSITIVE_DATA_PII",
                confidence="HIGH",
                description="Phát hiện rò rỉ API credentials trong phản hồi của model",
            )
        )

    elapsed_ms = (time.perf_counter() - start_time) * 1000

    return ModelArmorFilterResult(
        is_safe=(len(violations) == 0),
        sanitized_text=response,
        violations=violations,
        latency_ms=elapsed_ms,
    )
