# Hướng Dẫn Dành Cho AI Agent Phát Triển Dự Án VMEC Healthcare (Team P-208)

## 1. Phạm Vi Áp Dụng & Nguồn Chuẩn (Source of Truth)

Tài liệu này là quy chuẩn bắt buộc áp dụng cho toàn bộ AI Agent (Antigravity, Codex, Claude Code, Cursor, Copilot) khi làm việc trên repository VMEC Healthcare.

### 1.1. Nguồn Tham Chiếu Chuẩn Xác:
- **Kiến trúc tổng thể & Sơ đồ hệ thống**: [`ARCHITECTURE.md`](ARCHITECTURE.md) và [`docs/architecture_diagram.md`](docs/architecture_diagram.md).
- **Tổng quan sản phẩm, danh mục 18 chuyên khoa & API**: [`README.md`](README.md).
- **Cấu hình & Biến môi trường**: [`backend/src/config.py`](backend/src/config.py) và [`.env.example`](.env.example).
- **Cơ sở dữ liệu RAG chuẩn hóa**: [`data/vmec_prepared_knowledge_3650.jsonl`](data/vmec_prepared_knowledge_3650.jsonl) và [`backend/scripts/supabase_schema_and_seed.sql`](backend/scripts/supabase_schema_and_seed.sql).

---

## 2. Kiến Trúc Chuẩn Hiện Tại Của Dự Án (5 Trụ Cột Cốt Lõi)

Tuyệt đối không được nhầm lẫn với các bản thiết kế thử nghiệm cũ (như Flask, MongoDB, Redis hay ChromaDB). Kiến trúc chính thức 100% của dự án là:

1. **Frontend Web UI (`frontend/`)**:
   - Next.js 16 (App Router, Turbopack, Tailwind CSS, TypeScript).
   - Cơ chế Pure Database-Driven Citations: Trích dẫn trực tiếp mã Quyết định Bộ Y Tế và URL bài viết lâm sàng chính thống hoạt động thực tế (HTTP 200 OK).
   - Role Switcher thời gian thực: Bệnh nhân (Patient), Bác sĩ (Doctor), Lễ tân (Receptionist).

2. **Backend Dedicated API (`backend/src/`)**:
   - Python 3.12, **FastAPI**, Uvicorn ASGI Server, Pydantic v2 Settings.
   - Chạy độc lập trên cổng **8000** (stateless architecture).
   - Entrypoint khởi chạy: `backend/run.py` hoặc `uvicorn backend.src.main:app --port 8000`.

3. **AI Clinical Triage Engine 28-Node (`backend/src/agents/`)**:
   - Đồ thị điều phối hội thoại lâm sàng 28-node với 3 Subgraphs:
     + `TriageGraph`: Thu thập 4 slot lâm sàng (Triệu chứng chính -> Tính chất/Khởi phát -> Thời gian diễn tiến -> Dấu hiệu kèm theo/Cảnh báo đỏ).
     + `RagGraph`: Truy vấn ngữ nghĩa 1024 chiều qua Supabase pgvector.
     + `CatalogGraph`: Khám phá bác sĩ và khung giờ khám trống thời gian thực.
   - Tích hợp Model Armor (chống Prompt Injection, rò rỉ secret, ẩn PII) và Emergency Guard 115.
   - Module đồng cảm y khoa chuyên sâu: `backend/src/services/psychology.py`.

4. **Cơ Sở Dữ Liệu Tri Thức & Vector RAG (`Supabase pgvector`)**:
   - Supabase Cloud PostgreSQL tích hợp extension `pgvector`.
   - 3.650 vectors 1024 chiều (Mistral Embeddings) chuẩn hóa từ phác đồ Bộ Y Tế.
   - RPC `public.match_knowledge_chunks` thực hiện cosine similarity search kết hợp bridge metadata trích dẫn bài viết bệnh viện trực tiếp.

5. **State & Slot Hold Engine (`Azure Cosmos DB Free Tier`)**:
   - Azure Cosmos DB (`slot_holds` với Atomic Locking sub-5ms, TTL 900s tự hủy).
   - `patient_sessions` lưu trữ trạng thái hội thoại đa lượt (TTL 24h).
   - `medical_records`, `appointments`, `audit_logs`.

6. **AI Model Pools**:
   - Google Gemini Rotation Pool (7 API Keys: `gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`).
   - Mistral Embedding Rotation Pool (13 API Keys: `mistral-embed`, 1024 dimensions).

---

## 3. Quy Tắc Triển Khai Mã Nguồn (Code Rules)

### 3.1. Quy Tắc Backend:
- Toàn bộ mã nguồn backend bắt buộc nằm trong `backend/src/`.
- Không tạo thêm code ngoài `backend/src/`.
- Kiểm thử bắt buộc đặt tại `backend/tests/` và phải đảm bảo chạy vượt qua toàn bộ 29 ca kiểm thử (`pytest backend/tests -v`).

### 3.2. Quy Tắc Frontend:
- Toàn bộ mã nguồn Web UI nằm trong `frontend/src/`.
- Tuân thủ nghiêm ngặt Next.js 16 App Router.
- Luôn đảm bảo lệnh `npm run build` trong `frontend/` biên dịch thành công 18/18 routes không lỗi TypeScript.

### 3.3. Quy Tắc An Toàn Y Tế & Guardrails:
- Tuyệt đối không sinh phản hồi khẳng định chẩn đoán xác định hoặc kê đơn thuốc ("chẩn đoán bệnh X", "uống thuốc Y").
- Khi phát hiện dấu hiệu cấp cứu báo động đỏ (đau ngực dữ dội, khó thở vã mồ hôi, liệt nửa người), lập tức kích hoạt Emergency Interception 115.
- Mọi lịch hẹn qua AI chỉ có giá trị giữ chỗ tạm thời (`HOLD_ACTIVE`); cần sự xác nhận của Lễ tân/Điều phối viên (Human-in-the-loop) để hoàn tất.

---

## 4. Vùng Cấm (Restricted Areas)

- Không đọc, không sửa, không di chuyển hoặc xóa các file liên quan đến AI Log và Log Hooks:
  + `.ai-log/**`
  + `scripts/log_antigravity.py`, `scripts/log_hook.py`, `scripts/log_manual.py`, `scripts/submit_log.py`
  + `scripts/setup_hooks.ps1`, `scripts/setup_hooks.sh`

---

## 5. Danh Mục 18 Chuyên Khoa Chuẩn Hóa

| Mã Code | Chuyên Khoa | Đơn Vị Bệnh Viện Tham Chiếu | Số Quyết Định BYT |
| :--- | :--- | :--- | :--- |
| `TIM_MACH` | Khoa Tim Mạch | Viện Tim Mạch - BV Bạch Mai | QĐ-3381/QĐ-BYT |
| `HO_HAP` | Khoa Hô Hấp | Trung tâm Hô hấp - BV Bạch Mai | QĐ-2767/QĐ-BYT |
| `TIEU_HOA` | Khoa Tiêu Hóa - Gan Mật | Trung tâm Tiêu hóa - BV Bạch Mai | QĐ-4068/QĐ-BYT |
| `THAN_KINH` | Khoa Nội Thần Kinh & Đột Quỵ | Trung tâm Thần kinh - BV Bạch Mai | QĐ-3968/QĐ-BYT |
| `CO_XUONG_KHOP` | Khoa Cơ Xương Khớp | Khoa Cơ Xương Khớp - BV Bạch Mai | QĐ-3612/QĐ-BYT |
| `DA_LIEU` | Khoa Da Liễu & Dị Ứng | Khoa Da Liễu - BV Bạch Mai | QĐ-3615/QĐ-BYT |
| `TAI_MUI_HONG` | Khoa Tai Mũi Họng | Khoa Tai Mũi Họng - BV Bạch Mai | QĐ-3860/QĐ-BYT |
| `MAT` | Khoa Mắt | BV Mắt Trung Ương / Bạch Mai | QĐ-3912/QĐ-BYT |
| `RANG_HAM_MAT` | Khoa Răng Hàm Mặt | BV Răng Hàm Mặt Trung Ương | QĐ-3714/QĐ-BYT |
| `NOI_TIET` | Khoa Nội Tiết & Đái Tháo Đường | Cục Quản lý Khám chữa bệnh | QĐ-5481/QĐ-BYT |
| `THAN_TIET_NIEU` | Khoa Thận - Tiết Niệu & Nam Học | Khoa Thận Tiết Niệu - BV Bạch Mai | QĐ-3381/QĐ-BYT |
| `NHI_KHOA` | Khoa Nhi | Bệnh viện Nhi Trung Ương | QĐ-3312/QĐ-BYT |
| `SAN_PHU_KHOA` | Khoa Sản Phụ Khoa | Khoa Phụ Sản - BV Bạch Mai | QĐ-4112/QĐ-BYT |
| `LAO_KHOA` | Khoa Lão Khoa & CS Người Cao Tuổi | BV Bạch Mai | QĐ-3381/QĐ-BYT |
| `TAM_THAN` | Khoa Sức Khỏe Tâm Thần | Viện Sức Khỏe Tâm Thần - BV Bạch Mai | QĐ-3381/QĐ-BYT |
| `TRUYEN_NHIEM` | Khoa Bệnh Truyền Nhiễm & Nhiệt Đới | Cục Quản lý Khám chữa bệnh | QĐ-1533/QĐ-BYT |
| `CAP_CUU` | Khoa Cấp Cứu 115 & Đột Quỵ | Trung tâm Cấp cứu A9 - BV Bạch Mai | QĐ-3381/QĐ-BYT |
| `NOI_TONG_QUAT` | Khoa Khám Bệnh & Nội Tổng Quát | Trung tâm Khám bệnh - BV Bạch Mai | QĐ-3381/QĐ-BYT |
