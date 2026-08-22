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

# Robust Clinical Emergency Patterns (Regex on normalized ASCII text)
EMERGENCY_PATTERNS: Final[list[tuple[str, str, re.Pattern[str]]]] = [
    # 1. Cardiovascular Emergencies (AMI / ACS)
    ("EMG_CARDIO_01", "CARDIO", re.compile(r"\b(dau|tuc|that|de|nang|rat|nghen)\b.*?\bnguc\b.*?\b(du doi|bop nghet|nhu da de|lan len|lan ra|trai|cap)\b")),
    ("EMG_CARDIO_02", "CARDIO", re.compile(r"\bdau that nguc\b")),
    ("EMG_CARDIO_03", "CARDIO", re.compile(r"\b(va|do|ra)\s+mo hoi\b.*?\b(kho tho|dau nguc|that nguc|tuc nguc)\b")),
    ("EMG_CARDIO_04", "CARDIO", re.compile(r"\b(kho tho|dau nguc|that nguc|tuc nguc)\b.*?\b(va|do|ra)\s+mo hoi\b")),
    ("EMG_CARDIO_05", "CARDIO", re.compile(r"\bdau nguc\b.*?\blan\b.*?\b(tay|vai|cam|co)\b")),
    ("EMG_CARDIO_06", "CARDIO", re.compile(r"\bngung tim\b")),

    # 2. Stroke & Acute Neurological Emergencies
    ("EMG_STROKE_01", "STROKE", re.compile(r"\bdot quy\b")),
    ("EMG_STROKE_02", "STROKE", re.compile(r"\b(liet|yeu)\s+(nua nguoi|tay chan|mot ben)\b")),
    ("EMG_STROKE_03", "STROKE", re.compile(r"\b(meo|lech)\s+(mieng|mat)\b")),
    ("EMG_STROKE_04", "STROKE", re.compile(r"\b(noi do|noi ngong|khong noi duoc|kho noi)\b")),
    ("EMG_STROKE_05", "STROKE", re.compile(r"\b(dau dau|nhuc dau)\b.*?\b(du doi|nhu bua bo|set danh|dot ngot)\b")),

    # 3. Acute Respiratory Distress
    ("EMG_RESP_01", "RESPIRATORY", re.compile(r"\b(suy ho hap|ngung tho|khong tho duoc|nghet tho du doi)\b")),
    ("EMG_RESP_02", "RESPIRATORY", re.compile(r"\bkho tho\b.*?\b(du doi|tim tai|rut lom|tho rit|muon ngat)\b")),
    ("EMG_RESP_03", "RESPIRATORY", re.compile(r"\btim tai\s+(moi|dau chi|nguoi)\b")),

    # 4. Anaphylaxis & Severe Allergic Shock
    ("EMG_ANAPHYLAXIS_01", "ALLERGY", re.compile(r"\bsoc phan ve\b")),
    ("EMG_ANAPHYLAXIS_02", "ALLERGY", re.compile(r"\b(nghen co hong|kho tho|phu mat)\b.*?\b(sau khi tiem|sau khi uong|sau khi an)\b")),

    # 5. Neurological / Consciousness / Seizures
    ("EMG_NEURO_01", "NEURO", re.compile(r"\b(hon me|ngat xiu|bat tinh|mat y thuc)\b")),
    ("EMG_NEURO_02", "NEURO", re.compile(r"\b(co giat|dong kinh)\b.*?\b(lien tuc|du doi|toan than)\b")),

    # 6. Severe Hemorrhage & Trauma
    ("EMG_GI_01", "GI", re.compile(r"\b(non|oi)\s+ra\s+mau\b")),
    ("EMG_GI_02", "GI", re.compile(r"\b(di ngoai|di cau)\s+ra\s+mau\s+(xoi xa|den nhu ba ca phe|o at)\b")),
    ("EMG_TRAUMA_01", "TRAUMA", re.compile(r"\bchay mau\b.*?\b(khong cam|o at|phun)\b")),
    ("EMG_TRAUMA_02", "TRAUMA", re.compile(r"\bchan thuong so nao\b")),
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
    "tung bi",
    "nam truoc",
)


@dataclass(frozen=True)
class EmergencyResult:
    emergency: bool
    rule_ids: tuple[str, ...] = ()
    categories: tuple[str, ...] = ()
    action: str = ""
    ruleset_version: str = "vmec-emergency-v2"


def normalize_vietnamese_text(text: str) -> str:
    """
    Strips Vietnamese diacritics and converts to lowercase normalized ASCII.
    """
    value = unicodedata.normalize("NFD", text.casefold().replace("đ", "d"))
    value = "".join(char for char in value if unicodedata.category(char) != "Mn")
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]", " ", value)).strip()


def screen_emergency(text: str) -> EmergencyResult:
    """
    Performs deterministic screening of emergency symptoms using clinical regexes.
    """
    normalized = normalize_vietnamese_text(text)
    if not normalized:
        return EmergencyResult(emergency=False)

    matched_rules: list[str] = []
    matched_categories: list[str] = []

    for rule_id, category, pattern in EMERGENCY_PATTERNS:
        match = pattern.search(normalized)
        if match:
            match_start = match.start()
            prefix = normalized[:match_start]

            # Check if prefix contains negation markers
            is_negated = any(neg in prefix for neg in NEGATION_MARKERS) or any(
                f"{neg} {match.group(0)}" in normalized for neg in NEGATION_MARKERS
            )

            # Check if prefix contains historical markers
            is_historical = any(hist in prefix for hist in HISTORICAL_MARKERS) or any(
                f"{hist} {match.group(0)}" in normalized for hist in HISTORICAL_MARKERS
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
