"""Seed dữ liệu demo THẬT cho trang /approvals của lễ tân.

Tạo (idempotent — chạy lại nhiều lần an toàn):
  1. 4 tài khoản bệnh nhân (Supabase Auth + profiles) qua AuthService.admin_upsert_user.
  2. 4 lịch hẹn PENDING_RECEPTIONIST_APPROVAL trên slot AVAILABLE thật (Postgres).
  3. 4 phiên chat + message + handover PENDING cho lễ tân (MongoDB Atlas).

Cách chạy:
    python -m backend.scripts.seed_reception_demo_data
"""

from __future__ import annotations

import logging
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import UUID, uuid4

from bson import ObjectId
from dotenv import load_dotenv
from pymongo import MongoClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import NullPool

from backend.app.config import Settings
from backend.app.models.appointment import Appointment, AppointmentStatus
from backend.app.models.catalog import Doctor, Specialty
from backend.app.models.notification import (
    Notification,
    NotificationChannel,
    NotificationStatus,
    NotificationType,
)
from backend.app.repositories.postgresql.profile_repository import ProfileRepository
from backend.app.repositories.postgresql.schedule_repository import ScheduleRepository
from backend.app.services.auth_service import AuthService

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger("seed_reception_demo_data")

PATIENT_PASSWORD = "NguoiDung@SmartCity2026!"

# Lễ tân nhận thông báo (đồng bộ với _notify_receptionists_handover trong triage_service).
RECEPTIONIST_IDS = [
    UUID("5ed4e1c0-965e-44c3-96df-96419a5cd78e"),  # Lễ tân Vinmec Smart City 1
    UUID("4441092f-9fed-4bc6-a318-cdd58bc41d4a"),  # Lễ tân Vinmec Smart City 2
]

HANDOVER_NOTIFICATION_TEXT = {
    "NO_AVAILABLE_REAL_SLOT": "Có ca đã xác định chuyên khoa nhưng chưa có lịch phù hợp.",
    "SPECIALTY_LOW_CONFIDENCE": "Có ca cần hỗ trợ xác định chuyên khoa.",
}

PATIENTS = [
    {
        "email": "benhnhan.huong@p208.local",
        "full_name": "Trần Thị Mai Hương",
        "phone_number": "0912 345 671",
        "date_of_birth": "1992-03-15",
        "gender": "FEMALE",
        "address": "Số 12 Nguyễn Trãi, Thanh Xuân, Hà Nội",
        "age": 34,
        "booking_reason": "Đau bụng âm ỉ vùng thượng vị kéo dài 1 tuần, kèm ợ hơi, ăn chậm tiêu. "
        "Đã tự mua thuốc uống nhưng không đỡ, muốn đi khám tiêu hóa để làm nội soi dạ dày.",
    },
    {
        "email": "benhnhan.khanh@p208.local",
        "full_name": "Lê Văn Khánh",
        "phone_number": "0988 123 456",
        "date_of_birth": "1985-07-22",
        "gender": "MALE",
        "address": "Số 45 Hoàng Quốc Việt, Cầu Giấy, Hà Nội",
        "age": 41,
        "booking_reason": "Đau tức ngực trái xuất hiện khi gắng sức, hết đau khi nghỉ ngơi. "
        "Có tiền sử tăng huyết áp 3 năm, muốn khám tim mạch và đo điện tim, siêu âm tim.",
    },
    {
        "email": "benhnhan.trang@p208.local",
        "full_name": "Nguyễn Thu Trang",
        "phone_number": "0967 654 321",
        "date_of_birth": "2000-01-09",
        "gender": "FEMALE",
        "address": "Số 88 Trần Duy Hưng, Cầu Giấy, Hà Nội",
        "age": 26,
        "booking_reason": "Ho khan kéo dài hơn 2 tuần, gần đây kèm sốt nhẹ về chiều, ra mồ hôi đêm. "
        "Lo lắng sức khỏe, muốn khám tổng quát và chụp X-quang phổi.",
    },
    {
        "email": "benhnhan.bao@p208.local",
        "full_name": "Phạm Quốc Bảo",
        "phone_number": "0901 234 567",
        "date_of_birth": "1978-11-30",
        "gender": "MALE",
        "address": "Số 5 Lạc Long Quân, Tây Hồ, Hà Nội",
        "age": 47,
        "booking_reason": "Đau vai gáy lan xuống cánh tay phải, tê bì các ngón tay, "
        "đã đau 3 tuần, muốn khám cơ xương khớp và chụp MRI cột sống cổ.",
    },
]

# Mỗi bệnh nhân chọn 1 chuyên khoa thật (đúng tên trong DB) để lấy slot AVAILABLE.
PATIENT_SPECIALTIES = {
    "benhnhan.huong@p208.local": "Khoa Tiêu hóa - Gan mật",
    "benhnhan.khanh@p208.local": "Hô hấp",
    "benhnhan.trang@p208.local": "Khoa Mắt",
    "benhnhan.bao@p208.local": "Chấn thương chỉnh hình - Y học thể thao",
}

# Nội dung handover theo đúng format build_triage_summary_text của hệ thống.
HANDOVER_PLANS = {
    "benhnhan.huong@p208.local": {
        "reason": "NO_AVAILABLE_REAL_SLOT",
        "urgency": "ROUTINE",
        "summary": (
            "📋 **Tóm tắt thông tin bạn đã cung cấp:**\n\n"
            "- **Người cần khám:** Bản thân\n"
            "- **Tên người bệnh:** Trần Thị Mai Hương\n"
            "- **Tuổi:** 34\n"
            "- **Triệu chứng:** đau bụng thượng vị, ợ hơi, chậm tiêu\n"
            "- **Bắt đầu từ:** 1 tuần trước\n"
            "- **Diễn biến:** không đỡ dù đã uống thuốc\n"
            "- **Mức độ ảnh hưởng:** khó chịu khi ăn, ảnh hưởng công việc\n\n"
            "Chuyên khoa phù hợp: Tiêu hóa. Hiện chưa có bác sĩ và khung giờ phù hợp, "
            "yêu cầu đã chuyển cho lễ tân hỗ trợ."
        ),
        "context": {
            "patient_subject": "SELF",
            "patient_name": "Trần Thị Mai Hương",
            "age": "34",
            "main_symptoms": ["đau bụng thượng vị", "ợ hơi", "chậm tiêu"],
            "symptom_onset": "1 tuần trước",
            "symptom_progression": "không đỡ dù đã uống thuốc",
            "severity": "khó chịu khi ăn, ảnh hưởng công việc",
        },
    },
    "benhnhan.khanh@p208.local": {
        "reason": "NO_AVAILABLE_REAL_SLOT",
        "urgency": "PRIORITY",
        "summary": (
            "📋 **Tóm tắt thông tin bạn đã cung cấp:**\n\n"
            "- **Người cần khám:** Bản thân\n"
            "- **Tên người bệnh:** Lê Văn Khánh\n"
            "- **Tuổi:** 41\n"
            "- **Triệu chứng:** đau tức ngực trái khi gắng sức\n"
            "- **Bắt đầu từ:** khoảng 2 tuần trước\n"
            "- **Diễn biến:** tăng dần, hết đau khi nghỉ\n"
            "- **Mức độ ảnh hưởng:** đau xuất hiện khi leo cầu thang, đi bộ nhanh\n\n"
            "Chuyên khoa phù hợp: Tim mạch. Bệnh nhân có tiền sử tăng huyết áp — "
            "yêu cầu chuyển lễ tân để sắp xếp khám ưu tiên."
        ),
        "context": {
            "patient_subject": "SELF",
            "patient_name": "Lê Văn Khánh",
            "age": "41",
            "main_symptoms": ["đau tức ngực trái"],
            "symptom_onset": "2 tuần trước",
            "symptom_progression": "tăng dần, hết đau khi nghỉ",
            "severity": "đau khi leo cầu thang, đi bộ nhanh",
        },
    },
    "benhnhan.trang@p208.local": {
        "reason": "SPECIALTY_LOW_CONFIDENCE",
        "urgency": "ROUTINE",
        "summary": (
            "📋 **Tóm tắt thông tin bạn đã cung cấp:**\n\n"
            "- **Người cần khám:** Bản thân\n"
            "- **Tên người bệnh:** Nguyễn Thu Trang\n"
            "- **Tuổi:** 26\n"
            "- **Triệu chứng:** ho khan kéo dài, sốt nhẹ về chiều, ra mồ hôi đêm\n"
            "- **Bắt đầu từ:** hơn 2 tuần trước\n"
            "- **Diễn biến:** không thuyên giảm\n"
            "- **Mức độ ảnh hưởng:** lo lắng, mất ngủ\n\n"
            "Triệu chứng chưa đủ rõ để xác định chuyên khoa phù hợp — "
            "yêu cầu chuyển lễ tân tư vấn trực tiếp."
        ),
        "context": {
            "patient_subject": "SELF",
            "patient_name": "Nguyễn Thu Trang",
            "age": "26",
            "main_symptoms": ["ho khan", "sốt nhẹ về chiều", "ra mồ hôi đêm"],
            "symptom_onset": "hơn 2 tuần trước",
            "symptom_progression": "không thuyên giảm",
            "severity": "lo lắng, mất ngủ",
        },
    },
    "benhnhan.bao@p208.local": {
        "reason": "SPECIALTY_LOW_CONFIDENCE",
        "urgency": "ROUTINE",
        "summary": (
            "📋 **Tóm tắt thông tin bạn đã cung cấp:**\n\n"
            "- **Người cần khám:** Bản thân\n"
            "- **Tên người bệnh:** Phạm Quốc Bảo\n"
            "- **Tuổi:** 47\n"
            "- **Triệu chứng:** đau vai gáy, tê bì cánh tay phải\n"
            "- **Bắt đầu từ:** 3 tuần trước\n"
            "- **Diễn biến:** đau tăng khi ngồi lâu trước máy tính\n"
            "- **Mức độ ảnh hưởng:** tê các ngón tay, khó cầm nắm\n\n"
            "Triệu chứng có thể thuộc Cơ xương khớp hoặc Thần kinh — "
            "chưa đủ tự tin xác định chuyên khoa, chuyển lễ tân hỗ trợ."
        ),
        "context": {
            "patient_subject": "SELF",
            "patient_name": "Phạm Quốc Bảo",
            "age": "47",
            "main_symptoms": ["đau vai gáy", "tê bì cánh tay phải"],
            "symptom_onset": "3 tuần trước",
            "symptom_progression": "đau tăng khi ngồi lâu trước máy tính",
            "severity": "tê các ngón tay, khó cầm nắm",
        },
    },
}

# Đối thoại chat ngắn của từng bệnh nhân (sender_type: PATIENT | AI).
CHAT_DIALOGUES = {
    "benhnhan.huong@p208.local": [
        ("PATIENT", "Chào bạn, tôi bị đau bụng vùng thượng vị gần 1 tuần nay, ăn xong là đầy bụng khó tiêu."),
        ("AI", "Cảm ơn bạn đã chia sẻ. Bạn có thể cho tôi biết thêm: cơn đau xuất hiện khi nào, mức độ ra sao?"),
        ("PATIENT", "Đau âm ỉ, tối và sau ăn đau nhiều hơn. Tôi tự mua thuốc uống nhưng không đỡ."),
        ("AI", "Tôi đã đủ thông tin về triệu chứng. Chuyên khoa phù hợp là Tiêu hóa, đang tìm lịch khám phù hợp cho bạn..."),
        ("AI", "Hiện chưa có bác sĩ và khung giờ phù hợp. Yêu cầu đã được chuyển cho lễ tân hỗ trợ."),
    ],
    "benhnhan.khanh@p208.local": [
        ("PATIENT", "Tôi thấy đau tức ngực trái, nhất là khi leo cầu thang hoặc đi bộ nhanh. Nghỉ một lúc là hết."),
        ("AI", "Tôi hiểu. Cơn đau có kèm khó thở, chóng mặt hay vã mồ hôi không? Bạn có tiền sử bệnh gì không?"),
        ("PATIENT", "Có tiền sử tăng huyết áp 3 năm, đang uống thuốc huyết áp hằng ngày. Không bị khó thở."),
        ("AI", "Với triệu chứng đau ngực khi gắng sức và tiền sử tăng huyết áp, chuyên khoa phù hợp là Tim mạch."),
        ("AI", "Hiện chưa có bác sĩ và khung giờ phù hợp. Yêu cầu đã được chuyển cho lễ tân hỗ trợ."),
    ],
    "benhnhan.trang@p208.local": [
        ("PATIENT", "Em bị ho khan hơn 2 tuần, chiều nào cũng sốt nhẹ và ra mồ hôi đêm, em hơi lo."),
        ("AI", "Triệu chứng của bạn khá đặc biệt. Bạn có giảm cân, mệt mỏi kéo dài hay tiếp xúc với người ho lâu ngày không?"),
        ("PATIENT", "Có, em giảm 2kg trong tháng này, cũng hay mệt."),
        ("AI", "Tôi chưa đủ thông tin để gợi ý chuyên khoa phù hợp. Vui lòng liên hệ nhân viên y tế để được tư vấn trực tiếp."),
    ],
    "benhnhan.bao@p208.local": [
        ("PATIENT", "Tôi bị đau vai gáy lan xuống cánh tay phải, các ngón tay bị tê, nhất là khi ngồi máy tính lâu."),
        ("AI", "Cơn tê lan xuống ngón tay nào? Có yếu cơ hay khó cầm nắm không?"),
        ("PATIENT", "Tê ngón trỏ và ngón giữa, cầm bút hơi yếu."),
        ("AI", "Triệu chứng của bạn có thể liên quan Cơ xương khớp hoặc Thần kinh. Tôi chưa đủ thông tin để xác định, vui lòng liên hệ nhân viên y tế để được tư vấn trực tiếp."),
    ],
}


def _snapshot(patient: dict) -> dict:
    return {
        "full_name": patient["full_name"],
        "phone_number": patient["phone_number"],
        "date_of_birth": patient["date_of_birth"],
        "gender": patient["gender"],
        "address": patient["address"],
        "patient_subject": "SELF",
        "relationship": None,
        "age": patient["age"],
    }


def upsert_patients(auth_service: AuthService) -> dict[str, UUID]:
    """Tạo/phục hồi tài khoản bệnh nhân; trả về {email: user_id}."""
    result: dict[str, UUID] = {}
    for patient in PATIENTS:
        profile = auth_service.admin_upsert_user(
            email=patient["email"],
            password=PATIENT_PASSWORD,
            full_name=patient["full_name"],
            role="PATIENT",
            phone_number=patient["phone_number"],
        )
        result[patient["email"]] = profile.id
        logger.info("✓ Bệnh nhân: %s (ID: %s)", patient["full_name"], profile.id)
    return result


def seed_appointments(settings: Settings, patient_ids: dict[str, UUID]) -> int:
    """Chèn lịch hẹn PENDING_RECEPTIONIST_APPROVAL trên cửa sổ trống (lưới động)."""
    engine = create_engine(
        settings.database_url,
        pool_pre_ping=True,
        poolclass=NullPool,
        connect_args={"prepare_threshold": None},
    )
    schedule_repo = ScheduleRepository(engine)
    now = datetime.now(timezone.utc)
    created = 0
    try:
        with Session(engine) as session:
            specialties = {specialty.name: specialty for specialty in session.scalars(select(Specialty))}
            for patient in PATIENTS:
                email = patient["email"]
                specialty_name = PATIENT_SPECIALTIES[email]
                specialty = specialties.get(specialty_name)
                if specialty is None:
                    logger.warning("! Không có chuyên khoa %s — bỏ qua.", specialty_name)
                    continue

                windows = schedule_repo.list_free_windows(
                    specialty_id=specialty.id,
                    date_from=now,
                    date_to=now + timedelta(days=14),
                    limit=1,
                )
                if not windows:
                    logger.warning("! Không có cửa sổ trống cho chuyên khoa %s — bỏ qua.", specialty_name)
                    continue
                window = windows[0]
                doctor = session.get(Doctor, UUID(window["doctor_id"]))
                if doctor is None or doctor.facility_id is None:
                    logger.warning("! Thiếu Doctor/facility cho %s — bỏ qua.", window.get("doctor_name"))
                    continue

                exists = session.scalar(
                    select(Appointment).where(
                        Appointment.patient_id == patient_ids[email],
                        Appointment.status == AppointmentStatus.PENDING_RECEPTIONIST_APPROVAL,
                    )
                )
                if exists is not None:
                    logger.info("✓ Đã có lịch chờ duyệt cho %s — bỏ qua.", patient["full_name"])
                    continue

                appointment = Appointment(
                    appointment_code=f"APT-{uuid4().hex[:8].upper()}",
                    patient_id=patient_ids[email],
                    doctor_id=doctor.user_id,
                    facility_id=doctor.facility_id,
                    specialty_id=specialty.id,
                    schedule_id=UUID(window["slot_id"]),
                    status=AppointmentStatus.PENDING_RECEPTIONIST_APPROVAL,
                    booking_reason=patient["booking_reason"],
                    patient_snapshot=_snapshot(patient),
                    expires_at=now + timedelta(minutes=30),
                    created_at=now,
                    updated_at=now,
                )
                session.add(appointment)
                session.flush()
                logger.info(
                    "✓ Lịch chờ duyệt: %s (%s — %s %s)",
                    appointment.appointment_code,
                    patient["full_name"],
                    specialty_name,
                    window["slot_start"].isoformat(),
                )
                created += 1
            session.commit()
    finally:
        engine.dispose()
    return created


def seed_mongodb_handovers(settings: Settings, patient_ids: dict[str, UUID]) -> int:
    """Tạo phiên chat + message + handover PENDING cho lễ tân (idempotent)."""
    client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=8000)
    database = client[settings.mongodb_database]
    sessions = database["nosql_chat_sessions"]
    messages = database["nosql_chat_messages"]
    handovers = database["nosql_handover_events"]
    now = datetime.now(timezone.utc)
    created = 0

    try:
        for email, plan in HANDOVER_PLANS.items():
            patient = next(p for p in PATIENTS if p["email"] == email)
            patient_id = patient_ids[email]

            existing = handovers.find_one({"patient_id": str(patient_id), "status": "PENDING"})
            if existing is not None:
                logger.info("✓ Đã có handover PENDING cho %s — bỏ qua.", patient["full_name"])
                continue

            started_at = now - timedelta(hours=5, minutes=created * 37 % 90)
            session_id = ObjectId()
            session_doc = {
                "_id": session_id,
                "patient_id": str(patient_id),
                "appointment_id": None,
                "status": "ACTIVE",
                "language": "vi",
                "channel": "web",
                "title": f"Chat với {patient['full_name']}",
                "ai_extracted_metadata": plan["context"],
                "triage_data": {
                    "workflow_state": "HANDOFF_REQUIRED",
                    "patient_subject": "SELF",
                    "patient_name": patient["full_name"],
                    "age": str(patient["age"]),
                    "main_symptoms": plan["context"]["main_symptoms"],
                    "symptom_onset": plan["context"]["symptom_onset"],
                    "symptom_progression": plan["context"]["symptom_progression"],
                    "severity": plan["context"]["severity"],
                },
                "emergency_flag": False,
                "emergency_reason_codes": [],
                "suggested_specialty_id": None,
                "assigned_receptionist_id": None,
                "handover_reason": plan["reason"],
                "handed_over_at": started_at + timedelta(minutes=20),
                "started_at": started_at,
                "last_message_at": started_at + timedelta(minutes=18),
                "completed_at": None,
                "created_at": started_at,
                "updated_at": started_at + timedelta(minutes=20),
            }
            sessions.insert_one(session_doc)

            dialogue = CHAT_DIALOGUES[email]
            for index, (sender_type, content) in enumerate(dialogue):
                messages.insert_one(
                    {
                        "session_id": session_id,
                        "sender_id": str(patient_id) if sender_type == "PATIENT" else None,
                        "sender_type": sender_type,
                        "message_type": "TEXT",
                        "content": content,
                        "sanitized_content": content,
                        "routing_strategy": "triage" if sender_type == "AI" else "normal",
                        "intent_code": None,
                        "model_info": None,
                        "token_usage": None,
                        "citations": [],
                        "guardrail_results": None,
                        "metadata": None,
                        "created_at": started_at + timedelta(minutes=index * 3 + 1),
                    }
                )

            handovers.insert_one(
                {
                    "session_id": str(session_id),
                    "patient_id": str(patient_id),
                    "assigned_receptionist_id": None,
                    "reason": plan["reason"],
                    "urgency": plan["urgency"],
                    "summary": plan["summary"],
                    "extracted_context": plan["context"],
                    "status": "PENDING",
                    "accepted_at": None,
                    "resolved_at": None,
                    "created_at": started_at + timedelta(minutes=20),
                }
            )
            logger.info("✓ Handover PENDING: %s (%s)", patient["full_name"], plan["reason"])
            created += 1
    finally:
        client.close()
    return created


def seed_notifications(settings: Settings, patient_ids: dict[str, UUID]) -> int:
    """Ghi thông báo IN_APP cho lễ tân: 4 TRIAGE_HANDOVER + 4 NEW_BOOKING_FOR_RECEPTIONIST."""
    engine = create_engine(settings.database_url)
    now = datetime.now(timezone.utc)
    created = 0
    try:
        with Session(engine) as session:
            for index, (email, plan) in enumerate(HANDOVER_PLANS.items()):
                patient = next(p for p in PATIENTS if p["email"] == email)
                patient_id = patient_ids[email]
                content = HANDOVER_NOTIFICATION_TEXT[plan["reason"]]
                sent_at = now - timedelta(hours=5, minutes=index * 37 % 90, seconds=15)
                for receptionist_id in RECEPTIONIST_IDS:
                    exists = session.scalar(
                        select(Notification).where(
                            Notification.user_id == receptionist_id,
                            Notification.type == NotificationType.TRIAGE_HANDOVER.value,
                            Notification.appointment_id.is_(None),
                            Notification.metadata_json["patient_id"].astext == str(patient_id),
                        )
                    )
                    if exists is not None:
                        continue
                    session.add(
                        Notification(
                            user_id=receptionist_id,
                            appointment_id=None,
                            channel=NotificationChannel.IN_APP,
                            type=NotificationType.TRIAGE_HANDOVER.value,
                            title="Ca triage cần lễ tân hỗ trợ",
                            content=f"Bệnh nhân {patient['full_name']}: {content}",
                            status=NotificationStatus.SENT.value,
                            metadata_json={"patient_id": str(patient_id)},
                            sent_at=sent_at,
                        )
                    )
                    created += 1

            for patient in PATIENTS:
                patient_id = patient_ids[patient["email"]]
                appointment = session.scalar(
                    select(Appointment).where(
                        Appointment.patient_id == patient_id,
                        Appointment.status == AppointmentStatus.PENDING_RECEPTIONIST_APPROVAL,
                    )
                )
                if appointment is None:
                    continue
                for receptionist_id in RECEPTIONIST_IDS:
                    exists = session.scalar(
                        select(Notification).where(
                            Notification.user_id == receptionist_id,
                            Notification.type == NotificationType.NEW_BOOKING_FOR_RECEPTIONIST.value,
                            Notification.appointment_id == appointment.id,
                        )
                    )
                    if exists is not None:
                        continue
                    session.add(
                        Notification(
                            user_id=receptionist_id,
                            appointment_id=appointment.id,
                            channel=NotificationChannel.IN_APP,
                            type=NotificationType.NEW_BOOKING_FOR_RECEPTIONIST.value,
                            title="Yêu cầu đặt lịch mới chờ duyệt",
                            content=(
                                f"Bệnh nhân {patient['full_name']} vừa đặt lịch "
                                f"{appointment.appointment_code}, chờ lễ tân duyệt."
                            ),
                            status=NotificationStatus.SENT.value,
                            metadata_json={"appointment_id": str(appointment.id)},
                            sent_at=appointment.created_at,
                        )
                    )
                    created += 1
            session.commit()
        logger.info("✓ Thông báo lễ tân: %d bản ghi mới", created)
    finally:
        engine.dispose()
    return created


def main() -> int:
    # Ưu tiên backend/.env (chứa MONGODB_URI Atlas); .env gốc dự án có thể thiếu key.
    backend_env = Path("backend/.env")
    if backend_env.is_file():
        load_dotenv(dotenv_path=backend_env, override=True)
    settings = Settings.from_env()
    if not settings.supabase_url or not settings.supabase_secret_key:
        logger.error("Thiếu SUPABASE_URL hoặc SUPABASE_SECRET_KEY trong .env")
        return 2
    if not settings.database_url:
        logger.error("Thiếu SUPABASE_DATABASE_URL trong .env")
        return 2
    if not settings.mongodb_uri:
        logger.error("Thiếu MONGODB_URI trong .env")
        return 2

    engine = create_engine(settings.database_url)
    auth_service = AuthService(
        supabase_url=settings.supabase_url,
        supabase_anon_key=settings.supabase_anon_key,
        supabase_secret_key=settings.supabase_secret_key,
        profile_repo=ProfileRepository(engine),
    )
    try:
        patient_ids = upsert_patients(auth_service)
        seed_appointments(settings, patient_ids)
        seed_mongodb_handovers(settings, patient_ids)
        seed_notifications(settings, patient_ids)
    finally:
        engine.dispose()

    logger.info("Hoàn tất seed dữ liệu demo lễ tân.")
    return 0


if __name__ == "__main__":
    sys.exit(main())