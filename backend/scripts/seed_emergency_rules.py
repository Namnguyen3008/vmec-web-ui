"""Seed dữ liệu mẫu cho bảng emergency_rules.

Script dùng SQLAlchemy trực tiếp (không qua Supabase Auth).
Mặc định chỉ dry-run; dùng --apply để commit.

Cách chạy:
    # Dry-run (kiểm tra kết nối và xem plan)
    python -m backend.scripts.seed_emergency_rules

    # Áp dụng thật
    python -m backend.scripts.seed_emergency_rules --apply
"""

from __future__ import annotations

import argparse
import logging
import uuid
from dataclasses import dataclass, field

from sqlalchemy import create_engine, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session
from sqlalchemy.pool import NullPool

from backend.app.config import Settings

LOGGER = logging.getLogger("seed_emergency_rules")

# ---------------------------------------------------------------------------
# Model cục bộ — không import ORM chính vì bảng mới chưa có model file.
# Dùng SQLAlchemy Core Table thay thế để tránh import cycle.
# ---------------------------------------------------------------------------

from sqlalchemy import (
    Boolean,
    Column,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID

metadata = MetaData()

emergency_rules_table = Table(
    "emergency_rules",
    metadata,
    Column("id", PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("code", String(100), nullable=False, unique=True),
    Column("name", String(255), nullable=False),
    Column("description", Text),
    Column("patterns", JSONB, nullable=False, default=list),
    Column("excluded_patterns", JSONB, nullable=False, default=list),
    Column("urgency", String(20), nullable=False, default="URGENT"),
    Column("action_message", Text),
    Column("priority", Integer, nullable=False, default=100),
    Column("requires_human_handover", Boolean, nullable=False, default=True),
    Column("is_active", Boolean, nullable=False, default=True),
    schema="public",
)


@dataclass
class RuleSpec:
    code: str
    name: str
    urgency: str
    priority: int
    action_message: str
    patterns: list[str] = field(default_factory=list)
    excluded_patterns: list[str] = field(default_factory=list)
    description: str = ""
    requires_human_handover: bool = True
    is_active: bool = True


# ---------------------------------------------------------------------------
# Dữ liệu seed
# ---------------------------------------------------------------------------

EMERGENCY_RULES: list[RuleSpec] = [
    RuleSpec(
        code="CHEST_PAIN_ACUTE",
        name="Đau ngực cấp tính",
        description="Phát hiện dấu hiệu đau ngực có thể liên quan đến tim mạch hoặc phổi khẩn cấp.",
        patterns=["đau ngực", "tức ngực", "nặng ngực", "đau tim", "nhồi máu", "khó thở kèm đau ngực"],
        excluded_patterns=["đau ngực mãn", "đau ngực khi gắng sức nhẹ"],
        urgency="EMERGENCY",
        action_message=(
            "Triệu chứng của bạn có thể nguy hiểm. "
            "Hãy gọi ngay 115 hoặc đến phòng cấp cứu gần nhất. Đừng tự lái xe."
        ),
        priority=10,
    ),
    RuleSpec(
        code="BREATHING_DIFFICULTY_ACUTE",
        name="Khó thở cấp tính",
        description="Phát hiện dấu hiệu khó thở nghiêm trọng hoặc đột ngột.",
        patterns=["khó thở", "thở không được", "hụt hơi", "ngạt thở", "tím tái", "không thở được"],
        excluded_patterns=["khó thở khi leo cầu thang", "khó thở nhẹ"],
        urgency="EMERGENCY",
        action_message=(
            "Triệu chứng khó thở nghiêm trọng cần được xử lý ngay. "
            "Hãy gọi 115 hoặc nhờ người đưa bạn đến cấp cứu."
        ),
        priority=10,
    ),
    RuleSpec(
        code="STROKE_SYMPTOMS",
        name="Dấu hiệu đột quỵ",
        description="Phát hiện các triệu chứng nghi ngờ đột quỵ não (FAST: Face, Arms, Speech, Time).",
        patterns=[
            "đột quỵ", "méo miệng", "liệt tay", "liệt mặt",
            "nói ngọng đột ngột", "yếu tay đột ngột",
            "đột ngột không nói được", "đau đầu dữ dội đột ngột",
        ],
        excluded_patterns=[],
        urgency="EMERGENCY",
        action_message="Đây có thể là dấu hiệu đột quỵ. Thời gian rất quan trọng — hãy gọi 115 ngay lập tức.",
        priority=5,
    ),
    RuleSpec(
        code="SEVERE_ALLERGY_ANAPHYLAXIS",
        name="Phản ứng dị ứng nặng / Sốc phản vệ",
        description="Phát hiện dấu hiệu sốc phản vệ hoặc dị ứng nghiêm trọng.",
        patterns=[
            "sốc phản vệ", "dị ứng nặng", "phù lưỡi",
            "phù họng", "khó nuốt đột ngột", "nổi mề đay toàn thân kèm khó thở",
        ],
        excluded_patterns=["dị ứng nhẹ", "ngứa nhẹ"],
        urgency="EMERGENCY",
        action_message=(
            "Phản ứng dị ứng nghiêm trọng có thể đe dọa tính mạng. "
            "Hãy gọi 115 ngay và tránh tiếp xúc thêm với tác nhân gây dị ứng."
        ),
        priority=10,
    ),
    RuleSpec(
        code="SUICIDE_SELF_HARM_IDEATION",
        name="Ý nghĩ tự làm hại bản thân",
        description="Phát hiện nội dung liên quan đến ý định tự tử hoặc tự làm hại bản thân.",
        patterns=[
            "muốn chết", "tự tử", "không muốn sống",
            "tự làm đau", "tự làm hại",
            "kết thúc tất cả", "không còn lý do để sống",
        ],
        excluded_patterns=["không muốn sống với nỗi đau này mãi"],
        urgency="URGENT",
        action_message=(
            "Chúng tôi rất quan tâm đến bạn. "
            "Vui lòng liên hệ đường dây hỗ trợ sức khỏe tâm thần 1800 599 920 "
            "(miễn phí, 24/7) hoặc gọi 115. Nhân viên của chúng tôi sẽ hỗ trợ bạn ngay."
        ),
        priority=15,
    ),
    RuleSpec(
        code="HIGH_FEVER_SEIZURE",
        name="Sốt cao và co giật",
        description="Phát hiện dấu hiệu sốt cao kèm co giật, đặc biệt nguy hiểm ở trẻ em.",
        patterns=["co giật", "sốt co giật", "sốt 40 độ", "sốt 41 độ", "co cứng tay chân"],
        excluded_patterns=[],
        urgency="EMERGENCY",
        action_message=(
            "Co giật hoặc sốt rất cao cần can thiệp y tế ngay. "
            "Gọi 115 hoặc đến phòng cấp cứu. Không cho bệnh nhân ăn uống trong cơn co giật."
        ),
        priority=10,
    ),
    RuleSpec(
        code="SEVERE_BLEEDING",
        name="Chảy máu nghiêm trọng",
        description="Phát hiện tình trạng chảy máu nhiều, khó cầm máu.",
        patterns=[
            "chảy máu nhiều", "máu không cầm", "xuất huyết",
            "nôn ra máu", "đi ngoài ra máu nhiều", "ho ra máu",
        ],
        excluded_patterns=["chảy máu cam nhẹ", "trầy xước nhỏ"],
        urgency="EMERGENCY",
        action_message=(
            "Chảy máu nghiêm trọng cần được cầm máu và xử lý khẩn. "
            "Hãy gọi 115 và ép chặt vết thương trong khi chờ đợi."
        ),
        priority=10,
    ),
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed emergency_rules table.")
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Commit dữ liệu vào database. Không có flag này sẽ dry-run.",
    )
    return parser.parse_args()


def seed(session: Session, *, apply: bool) -> dict[str, int]:
    """Upsert tất cả rule; trả về thống kê inserted/skipped."""
    inserted = skipped = 0

    for rule in EMERGENCY_RULES:
        exists = session.execute(
            select(emergency_rules_table.c.code).where(
                emergency_rules_table.c.code == rule.code
            )
        ).first()

        if exists:
            skipped += 1
            LOGGER.info("Skip (đã tồn tại): %s", rule.code)
            continue

        stmt = pg_insert(emergency_rules_table).values(
            id=uuid.uuid4(),
            code=rule.code,
            name=rule.name,
            description=rule.description or None,
            patterns=rule.patterns,
            excluded_patterns=rule.excluded_patterns,
            urgency=rule.urgency,
            action_message=rule.action_message,
            priority=rule.priority,
            requires_human_handover=rule.requires_human_handover,
            is_active=rule.is_active,
        )
        session.execute(stmt)
        inserted += 1
        LOGGER.info("Insert: %s (%s)", rule.code, rule.urgency)

    if apply:
        session.commit()
        LOGGER.info("Đã commit %d rule mới.", inserted)
    else:
        session.rollback()
        LOGGER.info(
            "Dry-run: %d rule sẽ được insert, %d đã tồn tại. Dùng --apply để commit.",
            inserted,
            skipped,
        )

    return {"inserted": inserted, "skipped": skipped}


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    args = parse_args()

    settings = Settings.from_env()
    if not settings.database_url:
        LOGGER.error("Thiếu SUPABASE_DATABASE_URL trong .env")
        raise SystemExit(2)

    engine = create_engine(
        settings.database_url,
        pool_pre_ping=True,
        poolclass=NullPool,
        connect_args={"prepare_threshold": None},
    )

    try:
        with Session(engine) as session:
            stats = seed(session, apply=args.apply)
        print(stats)
    finally:
        engine.dispose()


if __name__ == "__main__":
    main()
