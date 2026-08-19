import time

import pytest
from httpx import ASGITransport, AsyncClient

from src.main import app


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_api_chat_message_and_session(client):
    session_id = f"API_TEST_SESSION_{int(time.time())}"
    user_id = "patient_api_test"

    # 1. Send chat message
    payload = {
        "sessionId": session_id,
        "userId": user_id,
        "content": "Tôi bị đau tức ngực khi đi bộ nhanh",
    }
    resp = await client.post("/api/chat/message", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["data"]["session_id"] == session_id
    assert data["data"]["progress_percent"] == 25
    assert len(data["data"]["quick_chips"]) > 0

    # 2. Retrieve session
    resp_get = await client.get(f"/api/chat/session/{session_id}?user_id={user_id}")
    assert resp_get.status_code == 200
    get_data = resp_get.json()
    assert get_data["success"] is True
    assert get_data["data"]["id"] == session_id
    assert get_data["data"]["progress_percent"] == 25


@pytest.mark.asyncio
async def test_api_triage_screen_emergency(client):
    payload = {"text": "Bệnh nhân bị đau ngực dữ dội, vã mồ hôi và ngất xỉu"}
    resp = await client.post("/api/triage/screen", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["emergency"] is True
    assert "115" in data["action"]


@pytest.mark.asyncio
async def test_api_triage_evaluate_judge(client):
    payload = {
        "action": "JUDGE",
        "targetSlot": "chiefComplaint",
        "userMessage": "Tôi bị đau ngực và khó thở",
        "currentSlots": {},
    }
    resp = await client.post("/api/triage/evaluate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["action"] == "JUDGE"
    assert "verdict" in data["result"]


@pytest.mark.asyncio
async def test_api_vector_search(client):
    payload = {
        "query": "đau thắt ngực khi gắng sức hồi hộp đánh trống ngực",
        "match_count": 3,
        "match_threshold": 0.60,
    }
    resp = await client.post("/api/vector/search", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["top_specialty_code"] != ""
    assert len(data["matched_chunks"]) > 0
    assert len(data["citations"]) > 0


@pytest.mark.asyncio
async def test_api_booking_flow(client):
    patient_id = f"PATIENT_{int(time.time())}"
    doctor_id = "DOC_TIM_01"

    # 1. Get available slots
    resp_slots = await client.get("/api/booking/slots?specialty_code=TIM_MACH")
    assert resp_slots.status_code == 200
    slots_data = resp_slots.json()
    assert slots_data["success"] is True
    assert len(slots_data["data"]) > 0

    # 2. Create slot hold (15-min lock)
    hold_payload = {
        "doctorId": doctor_id,
        "doctorName": "GS.TS Nguyễn Văn A",
        "patientId": patient_id,
        "specialtyCode": "TIM_MACH",
        "specialtyName": "Khoa Tim Mạch",
        "slotStart": "2026-08-18T08:30:00Z",
        "slotEnd": "2026-08-18T09:00:00Z",
        "room": "P.302 - Tòa A",
        "consultationFee": 350000,
    }
    resp_hold = await client.post("/api/booking/hold", json=hold_payload)
    assert resp_hold.status_code == 201
    hold_res = resp_hold.json()
    assert hold_res["success"] is True
    hold_id = hold_res["data"]["id"]

    # 3. Confirm appointment
    confirm_payload = {
        "holdId": hold_id,
        "doctorId": doctor_id,
        "patientId": patient_id,
        "patientName": "Nguyễn Văn Nam",
        "patientPhone": "0912345678",
        "notes": "Bệnh nhân có tiền sử tăng huyết áp",
    }
    resp_confirm = await client.post("/api/booking/confirm", json=confirm_payload)
    assert resp_confirm.status_code == 200
    confirm_res = resp_confirm.json()
    assert confirm_res["success"] is True
    assert confirm_res["data"]["status"] == "CONFIRMED"
    assert confirm_res["data"]["patientName"] == "Nguyễn Văn Nam"

    # 4. List patient's confirmed appointments
    resp_list = await client.get(f"/api/booking/appointments/{patient_id}")
    assert resp_list.status_code == 200
    list_data = resp_list.json()
    assert list_data["success"] is True
    assert len(list_data["data"]) >= 1
    assert list_data["data"][0]["patientId"] == patient_id
