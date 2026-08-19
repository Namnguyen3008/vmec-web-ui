# VMEC Healthcare - He Thong Tro Ly Y Te AI Dieu Huong Chuyen Khoa & Dat Lich Kham

VMEC Healthcare (Team P-208) la nen tang Tro ly Y te AI toan dien phuc vu tiep nhan trieu chung benh nhan, lam ro tinh trang da luot (Multi-turn Clinical Triage), dinh tuyen chinh xac 18 chuyen khoa lam sang theo quy chuan Bo Y Te, tra cuu bac si phu hop va ho tro giu cho dat lich kham tu dong voi co che kiem soat Human-in-the-loop (Le tan phe duyet).

---

## 1. Tong Quan Kien Truc He Thong

He thong duoc thiet ke dua tren 5 tru cot cong nghe hien dai, dam bao tinh san sang cao, do tre thap, an toan bao mat thong tin y te va trinh bay nguon goc du lieu minh bach:

### 1.1. Frontend Web Application (Next.js 16)
- Xay dung tren Next.js 16 voi kien truc App Router, Turbopack engine va Tailwind CSS.
- Tich hop he thong trich dan thuan co so du lieu (Pure Database-Driven Citations), ket noi truc tiep vao bai viet lam sang chinh thong (HTTP 200 OK) va so Hieu Quyet dinh Bo Y Te.
- Cung cap bo chuyen doi vai tro trai nghiem tuc thi (Role Switcher) gom 3 phan he:
  + Benh nhan (Patient Portal): Hoi thoai AI, nhan dinh tuyen chuyen khoa, giu cho lich kham, xem chi dan duong va quan ly ma QR/So benh an.
  + Bac si (Doctor Clinical Panel): Xem hang doi benh nhan thoi gian thuc, tong hop benh an dien tu (EMR) do AI khoi tao va ghi chu ket luan kham.
  + Le tan / Dieu phoi vien (Receptionist Approvals): Phe duyet hoac dieu chinh cac yeu cau giu cho tu dong, giam tai un tac phong kham.

### 1.2. Backend Dedicated API (FastAPI)
- Phat trien tren Python 3.12 voi framework FastAPI, Uvicorn ASGI server va Pydantic v2 Settings.
- Kien truc Stateless Microservices phuc vu tai cong 8000, ho tro day du OpenAPI/Swagger docs, CORS da nguon va co che xu ly loi tap trung.

### 1.3. AI Clinical Triage Engine (28-Node Graph)
- He thong dieu phoi hoi thoai lam sang 28-node gom 3 subgraphs doc lap:
  + TriageGraph: Thu thap 4 slot lam sang (Trieu chung chinh, Tinh chat/Khoi phat, Thoi gian dien tien, Dau hieu canh bao).
  + RagGraph: Truy van tuong dong tri thuc y te 1024-chieu qua pgvector.
  + CatalogGraph: Tra cuu bac si va lich trong theo thoi gian thuc.
- Tich hop bo loc an toan Model Armor (phat hien Prompt Injection, lo lot PII/Credentials) va bo chan cap cuu Emergency Guard 115.

### 1.4. Co So Du Lieu Tri Thuc & Vector RAG (Supabase pgvector)
- Su dung Supabase Cloud PostgreSQL tich hop extension pgvector.
- Luu tru 3.650 vector tri thuc y te 1024-chieu duoc chuan hoa tu phac do Bo Y Te qua Mistral Embeddings.
- Ham luu tru RPC `public.match_knowledge_chunks` thuc hien cosine similarity search va tu dong lam giau metadata trinh bay bai viet thuc te.

### 1.5. Atomic State & Slot Holding Engine (Azure Cosmos DB Free Tier)
- Su dung Azure Cosmos DB (1.000 RU/s + 25GB Storage mien phi vinh vien).
- Ho tro tao khoa giu cho lich kham nguyen tu (Atomic Slot Hold) voi do tre duoi 5ms va co che tu huy sau 15 phut (TTL = 900s).
- Luu tru phien hoi thoai nguoi dung voi co che tu dong het han sau 24 gio (TTL = 86400s).

---

## 2. So Do Kien Truc & Luong Du Lieu

### 2.1. So Do Tong The (System Architecture)

```
+-----------------------------------------------------------------------------------+
|                           LOP GIAO DIEN (NEXT.JS 16)                              |
|   +---------------------+   +---------------------+   +-----------------------+   |
|   |   Patient Portal    |   |   Doctor Panel      |   | Receptionist Approvals|   |
|   |  - AI Chat & Triage |   |  - Patient Queue    |   |  - Slot Approval      |   |
|   |  - Booking & QR     |   |  - Clinical Notes   |   |  - Schedule Manager   |   |
|   +---------------------+   +---------------------+   +-----------------------+   |
+------------------------------------------+----------------------------------------+
                                           | REST / JSON (HTTP)
                                           v
+-----------------------------------------------------------------------------------+
|                        FASTAPI DEDICATED BACKEND (PORT 8000)                      |
|   +--------------------+ +--------------------+ +--------------------+            |
|   |  /api/v1/chat      | |  /api/v1/triage    | |  /api/v1/bookings  |            |
|   +--------------------+ +--------------------+ +--------------------+            |
|                                          |                                        |
|   +--------------------------------------v------------------------------------+   |
|   |                 28-NODE CLINICAL TRIAGE ENGINE                            |   |
|   |  [Model Armor] -> [Emergency Guard 115] -> [Intent Router]                |   |
|   |  -> Subgraphs: (TriageGraph | RagGraph | CatalogGraph)                    |   |
|   |  -> [Psychological Soothing] -> [Grounding & Legal Validator]             |   |
|   +---------------------------------------------------------------------------+   |
+------------------------------------------+----------------------------------------+
                                           |
        +----------------------------------+----------------------------------+
        |                                  |                                  |
        v                                  v                                  v
+-----------------------+      +-----------------------+      +-----------------------+
|  Supabase pgvector    |      |    Azure Cosmos DB    |      |  AI Model Providers   |
|  - 3.650 vectors 1024D|      |  - Atomic Slot Holds  |      |  - Gemini Pool (7)    |
|  - match_knowledge RPC|      |  - Session TTL (24h)  |      |  - Mistral Pool (13)  |
+-----------------------+      +-----------------------+      +-----------------------+
```

### 2.2. Quy Trinh Pure Database-Driven Citations

1. Nguoi dung mo ta trieu chung tai giao dien Chat.
2. Backend tiep nhan va goi Mistral Embedding Pool (13 keys xoay vong) de chuyen hoa thanh vector 1024 chieu.
3. Goi RPC `match_knowledge_chunks` tren Supabase Cloud PostgreSQL.
4. PostgreSQL thuc hien tinh toan cosine similarity tren 3.650 chunks, lay 5 ket qua phu hop nhat va bridge metadata (URL bai viet truc tiep HTTP 200, So QD-BYT, Tieu de, Chuyen khoa).
5. Fast API tra ve payload day du cho Next.js UI hien thi the trich dan voi nut lien ket mo thang vao bai viet tham chieu cua Benh vien Bach Mai, Benh vien Nhi TW hoac Cuc Quan ly Kham chua benh.

---

## 3. Danh Muc 18 Chuyen Khoa Lam Sang Chuan Hoa

| Ma Chuyen Khoa | Ten Khoa Lam Sang | Don Vi Tham Chieu | So Quyet Dinh / Phac Do |
| :--- | :--- | :--- | :--- |
| `TIM_MACH` | Khoa Tim Mach | Vien Tim Mach - BV Bach Mai | QD-3381/QD-BYT |
| `HO_HAP` | Khoa Ho Hap | Trung tam Ho hap - BV Bach Mai | QD-2767/QD-BYT |
| `TIEU_HOA` | Khoa Tieu Hoa - Gan Mat | Trung tam Tieu hoa - BV Bach Mai | QD-4068/QD-BYT |
| `THAN_KINH` | Khoa Noi Than Kinh & Dot Quy | Trung tam Than kinh - BV Bach Mai | QD-3968/QD-BYT |
| `CO_XUONG_KHOP` | Khoa Co Xuong Khop | BV Bach Mai | QD-3612/QD-BYT |
| `DA_LIEU` | Khoa Da Lieu & Di Ung | BV Bach Mai | QD-3615/QD-BYT |
| `TAI_MUI_HONG` | Khoa Tai Mui Hong | BV Bach Mai | QD-3860/QD-BYT |
| `MAT` | Khoa Mat | BV Mat Trung Uong / Bach Mai | QD-3912/QD-BYT |
| `RANG_HAM_MAT` | Khoa Rang Ham Mat | BV Rang Ham Mat Trung Uong | QD-3714/QD-BYT |
| `NOI_TIET` | Khoa Noi Tiet & Dai Thao Duong | Cuc QLKCB - Bo Y Te | QD-5481/QD-BYT |
| `THAN_TIET_NIEU` | Khoa Than - Tiet Nieu & Nam Hoc | BV Bach Mai | QD-3381/QD-BYT |
| `NHI_KHOA` | Khoa Nhi | Benh vien Nhi Trung Uong | QD-3312/QD-BYT |
| `SAN_PHU_KHOA` | Khoa San Phu Khoa | BV Bach Mai | QD-4112/QD-BYT |
| `LAO_KHOA` | Khoa Lao Khoa & CS Nguoi Cao Tuoi | BV Bach Mai | QD-3381/QD-BYT |
| `TAM_THAN` | Khoa Suc Khoe Tam Than | Viện Suc Khoe Tam Than - BV Bach Mai | QD-3381/QD-BYT |
| `TRUYEN_NHIEM` | Khoa Benh Truyen Nhiem & Nhiet Doi | Cuc QLKCB - Bo Y Te | QD-1533/QD-BYT |
| `CAP_CUU` | Khoa Cap Cuu 115 & Dot Quy | Trung tam Cap cuu A9 - BV Bach Mai | QD-3381/QD-BYT |
| `NOI_TONG_QUAT` | Khoa Kham Benh & Noi Tong Quat | Trung tam Kham benh - BV Bach Mai | QD-3381/QD-BYT |

---

## 4. Cau Truc Thu Muc Du An

```
P-208/
|-- backend/                       # Ma nguon Backend FastAPI
|   |-- src/
|   |   |-- agents/                # 28-Node AI Agent Graph & Subgraphs
|   |   |-- api/                   # FastAPI Endpoints (chat, triage, vector, booking)
|   |   |-- persistence/           # Azure Cosmos DB Free Tier Client Manager
|   |   |-- repositories/          # Data Access Object Pattern
|   |   |-- security/              # Model Armor & Guardrails Layer
|   |   |-- services/              # Medical Embedding, LLM Pool, Psychology
|   |   |-- config.py              # Pydantic Settings Configuration
|   |   |-- main.py                # FastAPI Application Factory & Lifespan
|   |-- scripts/                   # Data Ingestion, Schema SQL & Seeding Scripts
|   |-- tests/                     # 29 Pytest Test Cases
|   |-- Dockerfile                 # Backend Multi-Stage Container Definition
|   |-- requirements.txt           # Backend Dependencies
|   |-- run.py                     # Entrypoint Script
|-- frontend/                      # Ma nguon Web UI Next.js 16
|   |-- src/
|   |   |-- app/                   # App Router Pages & API Routes
|   |   |-- components/            # UI Components (Chat, Doctor, Staff, Bookings)
|   |   |-- hooks/                 # Custom React Hooks
|   |   |-- lib/                   # AI Client, API Contracts, Cosmos Helper
|   |-- public/                    # Static Assets
|   |-- package.json               # Frontend Dependencies & Scripts
|   |-- next.config.ts             # Next.js Build Configuration
|-- data/                          # Co so tri thuc y te chuan hoa
|   |-- vmec_prepared_knowledge_3650.jsonl  # 3.650 vectors RAG dataset
|   |-- vmec_prepared_knowledge_3650.csv    # CSV dataset export
|   |-- raw/                       # Tai lieu goc
|   |-- processed/                 # Tai lieu xu ly trung gian
|   |-- README.md                  # Huong dan quan ly du lieu
|-- docs/                          # Tai lieu kien truc & huong dan
|   |-- architecture_diagram.md    # So do kien truc Mermaid
|-- eval/                          # Bo danh gia Benchmark lam sang
|   |-- Golden Dataset.json        # 20 tinh huong danh gia Golden
|-- mobile/                        # Module ung dung di dong (Expo React Native)
|-- .env.example                   # File mau bien moi truong he thong
|-- ARCHITECTURE.md                # Tai lieu dac ta kien truc 5 tru cot
|-- Dockerfile                     # Root Production Dockerfile
|-- docker-compose.yml             # Docker Compose orchestration
|-- Makefile                       # Tap lenh make quan tri
|-- pyproject.toml                 # Cua so cau hinh Python va Pytest
|-- requirements.txt               # Root Python Dependencies
|-- README.md                      # Tai lieu huong dan tong the nay
```

---

## 5. Dac Ta API Endpoints Chinh

### 5.1. Kiem Tra He Thong (Health & Status)
- `GET /health`: Kiem tra trang thai song cua Backend.
- `GET /status`: Kiem tra chi tiet ket noi Supabase, Cosmos DB, Gemini Pool va Mistral Pool.

### 5.2. Luong Hoi Thoai & Triage AI
- `POST /api/v1/chat/message`: Tiep nhan tin nhan nguoi dung, thuc thi 28-Node AI Agent, tra ve loi thoai lam sang kem the trich dan va danh sach khung gio kham.
- `POST /api/v1/triage/screen`: Danh gia nhanh nguy co cap cuu 115 (Emergency Interception).
- `POST /api/v1/triage/evaluate`: Danh gia ket qua hoi thoai 4 luot va de xuat chuyen khoa uu tien.

### 5.3. Truy Van Vector RAG
- `POST /api/v1/vector/search`: Nhan cau truy van text, vectorize qua Mistral 1024D va goi Supabase RPC `match_knowledge_chunks`.

### 5.4. Dat Lich & Giu Cho
- `POST /api/v1/bookings/hold`: Tao khoa giu cho Atomic Slot Hold tren Azure Cosmos DB (TTL 900s).
- `POST /api/v1/bookings/confirm`: Benh nhan xac nhan lich kham, chuyen trang thai sang cho Le tan duyet.

---

## 6. Huong Dan Cai Dat & Khoi Chay

### 6.1. Yeu Cau Moi Truong
- Python: Phien ban >= 3.11 (khuyen nghi 3.12).
- Node.js: Phien ban >= 18.18 (khuyen nghi 20.x hoac 22.x LTS).
- Trinh quan ly goi: `pip` va `npm`.

### 6.2. Thiet Lap Bien Moi Truong
Sao chep file `.env.example` thanh `.env`:
```bash
cp .env.example .env
```
Dien day du cac tham so:
```env
# Application
APP_NAME=VMEC-Dedicated-Backend
APP_ENV=development
APP_PORT=8000
APP_HOST=0.0.0.0
CORS_ORIGINS=http://localhost:3000,https://vmec-healthcare-web.vercel.app

# Google Gemini Pool (7 Keys)
GEMINI_API_KEY=AIzaSy...
GEMINI_API_KEY_2=AIzaSy...
GEMINI_GENERATIVE_MODEL_1=gemini-3.1-flash-lite
GEMINI_GENERATIVE_MODEL_2=gemini-3.5-flash-lite

# Mistral Embeddings Pool (13 Keys)
MISTRAL_API_KEY=...
MISTRAL_API_KEY_2=...
MISTRAL_EMBEDDING_MODEL=mistral-embed
MISTRAL_EMBEDDING_DIMENSIONS=1024

# Supabase Cloud pgvector
SUPABASE_URL=https://nntxlqchytvfmutmixea.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Azure Cosmos DB Free Tier
AZURE_COSMOS_ENDPOINT=https://cosmos-vmec-ai-2026.documents.azure.com:443/
AZURE_COSMOS_KEY=...
AZURE_COSMOS_DATABASE=vmec_healthcare_db
```

### 6.3. Khoi Chay Backend FastAPI (Cong 8000)
```bash
# Tao moi truong ao va cai dat thu vien
python -m venv backend/.venv
# Tren Windows:
backend\.venv\Scripts\activate
# Tren Linux/macOS:
source backend/.venv/bin/activate

pip install -r backend/requirements.txt

# Khoi chay server
uvicorn backend.src.main:app --reload --host 0.0.0.0 --port 8000
```
- Swagger UI tai: `http://localhost:8000/docs`
- ReDoc UI tai: `http://localhost:8000/redoc`

### 6.4. Khoi Chay Frontend Next.js 16 (Cong 3000)
```bash
cd frontend
npm install
npm run dev
```
Truy cap trinh duyet tai: `http://localhost:3000`

---

## 7. Kiem Thu Tu Dong & Chuan Hoa Chat Luong

### 7.1. Chay Toan Bo 29 Ca Kiem Thu Backend Pytest
```bash
pytest backend/tests -v
```
Danh sach cac file test duoc kiem tra:
- `test_agent_multiturn.py`: Hoi thoai da luot, bat cap cuu 115 va chan Prompt Injection.
- `test_api_routes.py`: Toan bo cac routes API backend.
- `test_embedding.py`: Mistral Embedding 1024D batch va single.
- `test_emergency.py`: Kiem tra phat hien cap cuu cap tinh vs phu dinh/tien su.
- `test_grounding.py`: Kiem tra tinh hop le cua trich dan va chan thuat ngu chan doan tuy tien.
- `test_health.py`: Healthcheck va Status verification.
- `test_llm.py`: Xoay vong Google Gemini Generative API.
- `test_model_armor.py`: Chan credential leak, chan prompt injection, an PII.
- `test_psychology.py`: Loi nhan an tam tam ly cho cac chuyen khoa.
- `test_vector_search.py`: Vector search Supabase pgvector voi threshold = 0.40.

### 7.2. Bien Dich Frontend Next.js
```bash
cd frontend
npm run build
```
Xac nhan toan bo 18 routes duoc bien dich thanh cong voi 0 loi TypeScript.

---

## 8. Tinh Nang Bao Mat & Tuan Thu Y Te

1. Khong Tu Y Dua Ra Chan Doan: Hệ thong tuyet doi khong dung cac cum tu cam doan nhu "chan doan xac dinh", "ke don thuoc", "uong thuoc nay". Tat ca khuyen cao chi mang tinh chat dinh huong chuyen khoa va ho tro giu cho kham.
2. Chan Cap Cuu 115 Chu Dong: Khi nguoi dung xuat hien cac trieu chung bao dong do (dau nguc du doi, kho tho va mo hoi, liet nua nguoi, sot cao co giat), he thong ngay lap tuc kich hoat giao dien khan cap va huong dan goi tong dai 115.
3. Model Armor: Tu dong che giau thong tin dinh danh ca nhan (PII) va vo hieu hoa cac no luc thao tung prompt (Jailbreak / Prompt Injection).
4. Co Che Human-In-The-Loop: Lich hen AI chi co gia tri giu cho tam thoi; quy trinh tiep nhan chi hoan tat khi duoc Nhan vien Le tan hoac Dieu phoi vien benh vien xac nhan tren he thong.
