# AGENTS.md — Quy Tac Phat Trien & Chi Dao Ky Thuat He Thong VMEC Healthcare (P-208)

Tai lieu nay la kim chi nam bat buoc cho tat ca cac AI Agents (Claude, Gemini, Codex, Antigravity) va ky su khi tham gia phat trien du an VMEC Healthcare (Team P-208).

---

## 1. Su Menh & Pham Vi Du An (Mission & Scope)

Xay dung hoan thien nen tang Tro ly Y te AI cap Enterprise phuc vu:
1. Tiep nhan va lam ro trieu chung lam sang da luot (Multi-turn Clinical Triage).
2. Dinh tuyen chinh xac vao 1/18 Chuyen khoa lam sang theo quy chuan Bo Y Te.
3. Trich dan nguon goc y khoa minh bach 100% qua co che Pure Database-Driven Citations (So Quyet dinh Bo Y Te va Link bai viet truc tiep HTTP 200 OK tu Benh vien Bach Mai, Benh vien Nhi TW, Cuc QLKCB).
4. Tra cuu bac si phu hop, tao khoa giu cho lich kham nguyen tu (Atomic Slot Hold tren Azure Cosmos DB sub-5ms) va ho tro dat lich voi co che kiem soat Human-in-the-loop (Le tan phe duyet).

---

## 2. Kien Truc Cong Nghe Chuan Muc (Canonical Stack)

- **Frontend**: Next.js 16 (App Router, Turbopack, Tailwind CSS, Pure Database-Driven Citations, Chuyen doi 3 vai tro Patient / Doctor / Receptionist). Port 3000.
- **Backend**: FastAPI (Python 3.12, Uvicorn, Stateless API, Pydantic v2 Settings). Port 8000.
- **AI Triage Engine**: 28-Node LangGraph State Machine voi 3 Subgraphs (`TriageGraph`, `RagGraph`, `CatalogGraph`).
- **Kho Tri Thuc & Vector RAG**: Supabase Cloud PostgreSQL + `pgvector` (3.650 vectors 1024-chieu Mistral Embeddings, RPC `match_knowledge_chunks`).
- **Atomic Slot Holding & Session Storage**: Azure Cosmos DB Free Tier (`slot_holds` TTL 900s, `patient_sessions` TTL 24h).
- **AI Cloud Models**: Google Gemini Rotation Pool (Flash-Lite / Pro, 7 API Keys) + Mistral Semantic Embeddings Pool (13 API Keys).

---

## 3. Quy Tac An Toan Y Te & Bao Mat Bat Bien (Immutable Rules)

1. **Cam Tu Y Chan Doan & Ke Don**:
   - Tro ly chi duoc phep dinh huong chuyen khoa va goi y lich kham.
   - Tuyet doi CAM su dung cac cum tu: "chan doan xac dinh", "ke don thuoc", "uong thuoc nay", "tang lieu", "giam lieu".
2. **Chan Cap Cuu 115 Chu Dong (Acute Emergency Interception)**:
   - Bo loc Emergency Guard phai chay TRUOC bat ky buoc xu ly LLM, RAG hay Booking nao.
   - Khi phat hien dau hieu nguy hiem tinh mang (dau nguc du doi, kho tho va mo hoi, liet nua nguoi), ngay lap tuc tra ve giao dien cap cuu 115.
3. **Pure Database-Driven Citations**:
   - Moi trich dan phai duoc lay truc tiep tu PostgreSQL Supabase (So QD-BYT, Link bai viet HTTP 200).
   - Tuyet doi khong dung fallback URL tinh dan den loi 404.
4. **Human-In-The-Loop (HITL)**:
   - Lich hen AI khoi tao chi la giu cho tam thoi (`HOLD_ACTIVE`).
   - Bat buoc phai co su xac nhan cua Benh nhan va phe duyet cua Nhan vien Le tan moi chuyen sang trang thai `CONFIRMED`.
5. **Model Armor & PII Redaction**:
   - Tu dong an cac thong tin dinh danh (So dien thoai, CCCD, BHYT) va chan moi no luc Prompt Injection / Jailbreak.

---

## 4. Quy Trinh Phat Trien & Kiem Thu Bat Buoc (Verification Workflow)

Moi thay doi ma nguon phai duoc xac thuc truoc khi commit:
1. **Kiem thu Backend Pytest**:
   ```bash
   pytest backend/tests/ -v
   # Bat buoc 29/29 tests PASSED 100%
   ```
2. **Bien dich Frontend Next.js**:
   ```bash
   cd frontend && npm run build
   # Bat buoc 18/18 routes PASSED voi 0 loi TypeScript
   ```
3. **Quy tac Commit**:
   - Viet thong diep commit ngan gon, tap trung (vi du: `fix(citations): update direct article links`).
4. **Quy tac Tai lieu**:
   - Khong su dung bat ky icon / emoji nao trong `README.md`.
