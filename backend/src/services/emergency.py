"""
Deterministic Emergency Screening Service for VMEC Healthcare.
Executes rule-based triage BEFORE any AI / LLM invocation.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from typing import Final

EMERGENCY_ACTION_MESSAGE: Final[str] = (
    "🚨 **CẢNH BÁO KHẨN CẤP (CẤP CỨU 115):**\n\n"
    "Dựa trên các dấu hiệu bạn vừa mô tả, đây có thể là tình huống y tế khẩn cấp đe dọa tính mạng! "
    "Vui lòng **gọi ngay Cấp cứu 115** hoặc nhờ người thân đưa đến **Khoa Cấp Cứu của Bệnh viện gần nhất** ngay lập tức.\n\n"
    "⚠️ **Hệ thống tạm dừng quy trình đặt lịch khám thông thường để đảm bảo an toàn tính mạng cho bạn.**"
)

# Adult & General Emergency Keywords & Patterns (Normalized without accents)
EMERGENCY_RULES: Final[list[tuple[str, str, str]]] = [
    # (rule_id, category, phrase_normalized)
    ("EMG_CARDIO_01", "CARDIO", "dau nguc du doi"),
    ("EMG_CARDIO_02", "CARDIO", "dau nguc chen ep"),
    ("EMG_CARDIO_03", "CARDIO", "kho tho va mo hoi"),
    ("EMG_CARDIO_04", "CARDIO", "dau nguc lan ra canh tay trai"),
    ("EMG_CARDIO_05", "CARDIO", "ngung tim"),
    ("EMG_STROKE_01", "STROKE", "dot quy"),
    ("EMG_STROKE_02", "STROKE", "liet nua nguoi"),
    ("EMG_STROKE_03", "STROKE", "meo mieng"),
    ("EMG_STROKE_04", "STROKE", "noi do"),
    ("EMG_STROKE_05", "STROKE", "yeu nua nguoi dot ngot"),
    ("EMG_RESP_01", "RESPIRATORY", "suy ho hap"),
    ("EMG_RESP_02", "RESPIRATORY", "khong tho duoc"),
    ("EMG_RESP_03", "RESPIRATORY", "nghet tho du doi"),
    ("EMG_ANAPHYLAXIS_01", "ALLERGY", "soc phan ve"),
    ("EMG_NEURO_01", "NEURO", "hon me"),
    ("EMG_NEURO_02", "NEURO", "ngat xiu"),
    ("EMG_NEURO_03", "NEURO", "co giat lien tuc"),
    ("EMG_GI_01", "GI", "non ra mau"),
    ("EMG_GI_02", "GI", "di ngoai ra mau xoi xa"),
    ("EMG_TRAUMA_01", "TRAUMA", "chay mau khong cam"),
    ("EMG_TRAUMA_02", "TRAUMA", "chan thuong so nao"),
]

NEGATION_MARKERS: Final[tuple[str, ...]] = (
    "khong bi",
    "khong co",
    "khong con",
    "da het",
    "chua tung",
    "khong thay",
    "het han",
)

HISTORICAL_MARKERS: Final[tuple[str, ...]] = (
    "truoc day",
    "thang truoc",
    "nam ngoai",
    "hoi truoc",
    "da tung",
)


@dataclass(frozen=True)
class EmergencyResult:
    emergency: bool
    rule_ids: tuple[str, ...] = ()
    categories: tuple[str, ...] = ()
    action: str = ""
    ruleset_version: str = "vmec-emergency-v1"


def normalize_vietnamese_text(text: str) -> str:
    """
    Strips Vietnamese diacritics and converts to lowercase normalized ASCII.
    """
    value = unicodedata.normalize("NFD", text.casefold().replace("đ", "d"))
    value = "".join(char for char in value if unicodedata.category(char) != "Mn")
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]", " ", value)).strip()


def screen_emergency(text: str) -> EmergencyResult:
    """
    Performs deterministic screening of emergency symptoms.
    """
    normalized = normalize_vietnamese_text(text)
    if not normalized:
        return EmergencyResult(emergency=False)

    # Check for negations or historical mentions that disqualify an acute emergency
    # For example: "tôi không bị đau ngực" or "năm ngoái đã từng ngất xỉu"
    matched_rules: list[str] = []
    matched_categories: list[str] = []

    for rule_id, category, phrase in EMERGENCY_RULES:
        if phrase in normalized:
            idx = normalized.find(phrase)
            prefix = normalized[:idx]

            # Check if prefix contains negation markers
            is_negated = any(neg in prefix for neg in NEGATION_MARKERS) or any(
                f"{neg} {phrase}" in normalized for neg in NEGATION_MARKERS
            )

            # Check if prefix contains historical markers
            is_historical = any(hist in prefix for hist in HISTORICAL_MARKERS) or any(
                f"{hist} {phrase}" in normalized for hist in HISTORICAL_MARKERS
            )

            if not is_negated and not is_historical:
                matched_rules.append(rule_id)
                matched_categories.append(category)

    if matched_rules:
        return EmergencyResult(
            emergency=True,
            rule_ids=tuple(matched_rules),
            categories=tuple(set(matched_categories)),
            action=EMERGENCY_ACTION_MESSAGE,
        )

    return EmergencyResult(emergency=False)
