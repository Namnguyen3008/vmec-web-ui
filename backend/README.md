# P-208 Chat Backend MVP

Backend Flask độc lập cho phiên chat, lịch sử MongoDB, guardrail an toàn và RAG từ
Supabase pgvector. Chat dùng OpenRouter `openai/gpt-4o-mini`; query embedding dùng
`openai/text-embedding-3-small` với vector 1024 chiều.

## Chạy local bằng Docker

Docker build dùng repository root làm context để đóng gói symptom catalog vào image. Chạy lệnh từ root
repository hoặc dùng file Compose dưới đây; không build với `backend/` làm context.

```powershell
Copy-Item backend/.env.example backend/.env
# Điền OpenRouter API key vào LLM_API_KEY trong backend/.env
docker compose -f backend/docker-compose.yml up --build
```

API chạy tại `http://localhost:5000`. Mọi API chat cần header
`X-Dev-User-Id` là một UUID hợp lệ.

Cấu hình LLM mặc định:

```env
LLM_PROVIDER=openrouter
LLM_API_KEY=<OpenRouter API key>
LLM_MODEL=openai/gpt-4o-mini
```

Hoặc dùng Gemini API trực tiếp qua endpoint tương thích OpenAI đã triển khai:

```env
LLM_PROVIDER=google
LLM_API_KEY=<Gemini API key từ Google AI Studio>
LLM_MODEL=gemini-3.5-flash-lite
```

`LLM_PROVIDER` phải là `google`; không dùng `gemini` làm tên provider.

Hoặc dùng DeepSeek API trực tiếp qua endpoint tương thích OpenAI đã triển khai:

```env
LLM_PROVIDER=deepseek
LLM_API_KEY=<DeepSeek API key từ platform.deepseek.com>
LLM_MODEL=deepseek-v4-flash
```

## MCP catalog private

Compose có service `mcp-catalog` chạy Uvicorn tại cổng nội bộ 8001 với `/mcp`, `/health`, `/ready`; cổng
không được publish. API giữ nguyên endpoint chat và chỉ bật client khi `MCP_CATALOG_ENABLED=true`. Cần đặt
`MCP_SERVER_URL=http://mcp-catalog:8001/mcp`, một `MCP_INTERNAL_TOKEN` chung tối thiểu 32 byte và cấu hình
`MCP_DATABASE_URL`/`MCP_LLM_*` riêng cho process MCP. Không commit token, API key hoặc mật khẩu database.

Chạy Alembic revision `20260815_0007` trước, sau đó DBA provision login kế thừa role NOLOGIN
`p208_mcp_reader` bên ngoài migration. Role chỉ đọc `mcp_read.doctor_catalog` và
`mcp_read.schedule_conflicts`. Dev giữ feature flag tắt nếu thiếu cấu hình. Production chỉ bật sau khi
`/ready`, test role với `MCP_ROLE_TEST_DATABASE_URL`, contract Streamable HTTP và smoke test PostgreSQL đạt.

Chạy trực tiếp bằng Python sau khi cài dependency:

```powershell
# Từ thư mục gốc của dự án
python -m backend.run

# Hoặc từ thư mục backend
Set-Location backend
python run.py
```

## Logging chat và RAG

Đặt `LOG_LEVEL=INFO` để thấy các mốc chính của chat/RAG và kết quả HTTP. Dùng `LOG_LEVEL=DEBUG` khi cần
thêm traceback để điều tra lỗi retrieval; các giá trị hợp lệ khác là `WARNING`, `ERROR` và `CRITICAL`.
Log chat chỉ chứa ID, nhánh xử lý, loại lỗi, trạng thái và thời lượng; không ghi nội dung tin nhắn, prompt,
vector, access token hoặc secret.

## Langfuse tracing (tùy chọn)

Langfuse mặc định tắt (`LANGFUSE_TRACING_ENABLED=false`). Khi bật với đủ `LANGFUSE_PUBLIC_KEY`,
`LANGFUSE_SECRET_KEY` và `LANGFUSE_PSEUDONYMIZATION_KEY` (secret riêng, tối thiểu 32 byte), backend tạo một trace `chat-turn` cho mỗi
tin nhắn hoặc action; các turn của cùng một session được nhóm bằng session ID HMAC. Generation, retrieval,
embedding, guardrail và tool/workflow quan trọng là các observation lồng nhau, có model, token count, latency
và trạng thái an toàn.

Chỉ metadata đã allowlist được gửi: loại route/chiến lược, số lượng chunk/citation, token count, latency và
kết quả guardrail. Không gửi nội dung chat/prompt/phản hồi, RAG context, vector, cookie/header, secret hoặc
raw user/session/request ID. `mask_otel_spans` của Langfuse là lớp phòng thủ xuất dữ liệu bổ sung; nó không
thay thế chính sách không tạo dữ liệu nhạy cảm ở nguồn và không bảo vệ exporter telemetry khác.

Đặt URL của Langfuse project đã được phê duyệt (region hoặc self-hosted nếu tổ chức yêu cầu) vào
`LANGFUSE_BASE_URL`; không đưa bất kỳ biến Langfuse nào sang frontend. Nếu thiếu cấu hình hoặc SDK lỗi,
backend tự dùng no-op tracing và `/ready` không bị ảnh hưởng. Client dùng batch/atexit của SDK, không flush
theo từng request. Script `ingest_knowledge` tạo trace `ingest-medical-knowledge` metadata-only và gọi
shutdown một lần khi tiến trình CLI kết thúc, không gửi đường dẫn, nội dung tài liệu hoặc vector.

```powershell
$headers = @{ "X-Dev-User-Id" = "11111111-1111-4111-8111-111111111111" }
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/v1/chat/sessions `
  -Headers $headers -ContentType application/json `
  -Body '{"language":"vi","channel":"web"}'
```

## Kiểm thử

```powershell
py -m pip install -r backend/requirements.txt
py -m pytest backend/tests -q
ruff check backend
ruff format --check backend
```

Chạy cả test integration trên MongoDB thật trong container:

```powershell
docker compose -f backend/docker-compose.yml --profile test run --rm test
```

Không dùng `AUTH_MODE=dev_anonymous` với dữ liệu thật hoặc môi trường production.

## Guardrail trong chat

Mọi tin nhắn đi qua `InputGuard.sanitize()` trước router/LLM để loại ký tự điều khiển, chuẩn hóa khoảng
trắng và chặn tin nhắn rỗng. Prompt injection được kiểm tra riêng bởi `PromptInjectionGuard`; nội dung
bị phát hiện nhận phản hồi `RULE_BASED` an toàn và không được gửi tới model.

Mọi nội dung AI (model, rule, emergency và triage) đi qua `OutputGuard` rồi `PIIGuard` trước khi lưu/trả về.
`OutputGuard` thay output rỗng, khẳng định chẩn đoán/kê đơn, yêu cầu tự ngừng thuốc, hướng dẫn y tế gây hại,
cam kết kết quả chắc chắn hoặc rò prompt hệ thống bằng fallback an toàn. `PIIGuard` chịu trách
nhiệm riêng cho việc thay email, số điện thoại, secret, bearer token, JWT và data URI bằng placeholder.
Nếu phản hồi RAG chỉ vi phạm ở mẫu câu khẳng định chẩn đoán nhưng context đã xác định được chuyên khoa,
backend thay phản hồi đó bằng hướng dẫn chuyên khoa cố định, không chẩn đoán, và chỉ giữ citation của chunk tốt nhất.
Chi tiết can thiệp nằm trong `guardrail_results.input`, `guardrail_results.output` và `guardrail_results.pii`.
Riêng phản hồi RAG còn qua `CitationGuard`: nguồn phải tồn tại, marker `[n]` phải đúng phạm vi và gắn với
phát biểu; mỗi đoạn có nhận định y tế phải có citation. Kết quả nằm trong `guardrail_results.citation`.

Luồng triage không hỏi tuần tự các trường còn thiếu bằng rule-based policy. Sau khi LLM trích xuất được
`main_symptoms`, specialty matcher yêu cầu model chọn `symptom_id` trong catalog chuẩn hóa, đếm tỷ lệ
theo chuyên khoa và tạo offer ngay nếu khoa dẫn đầu đạt 0,75 với khoảng cách tối thiểu 0,15. Trường hợp
không có triệu chứng hoặc điểm không đạt ngưỡng, triage giữ trạng thái thu thập thông tin và hỏi người dùng
mô tả rõ hơn, không tự động chuyển lễ tân. Handover vẫn dùng cho ca khẩn cấp hoặc khi đã xác định chuyên khoa
nhưng không có lịch phù hợp.

## Bật đăng nhập cho 3 vai trò

Chạy migration `backend/migrations/sql/20260805_0004_create_profiles_and_auth.sql`, sau đó cấu hình:

```env
AUTH_MODE=supabase_jwt
SUPABASE_DATABASE_URL=postgresql+psycopg://...
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SECRET_KEY=<backend-secret-key>
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_JWT_SECRET=<legacy-jwt-secret-tùy-chọn>
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

Nếu dùng Supabase Transaction pooler (`*.pooler.supabase.com:6543`), backend tự động
dùng `NullPool` và tắt prepared statements của Psycopg (`prepare_threshold=None`).
Không bật lại prepared statements trên cổng `6543`; có thể dùng Session pooler hoặc kết
nối trực tiếp cổng `5432` khi cần session-level connection state.

Container chạy `python -m backend.scripts.setup_langgraph_checkpointer` một lần trước Gunicorn để tạo/nâng
cấp schema checkpoint. Không gọi `PostgresSaver.setup()` trong từng worker. Trên Railway, đặt **Root
Directory** là root repository và **Dockerfile Path** là `backend/Dockerfile`; nếu để Root Directory là
`backend`, Docker không thể đóng gói `docs/y_te_vin_chuan_hoa.json`.

`POST /api/v1/auth/login` dùng chung cho `PATIENT`, `DOCTOR` và `RECEPTIONIST`. Backend xác thực
email/mật khẩu qua Supabase Auth, sau đó luôn đọc role và trạng thái thật từ `public.profiles`.
Tài khoản bác sĩ/lễ tân được cấp qua script seed backend; người dùng chỉ được tự đăng ký role `PATIENT`.
`POST /api/v1/auth/register` xử lý đúng response REST của Supabase ở cả hai chế độ. Khi bật Confirm email,
endpoint trả `requires_email_confirmation=true` và không trả token; frontend yêu cầu người dùng xác nhận email
thay vì tạo session rỗng. Khi tắt Confirm email, endpoint trả token và đăng nhập ngay.
Backend xác minh token ES256/RS256 qua JWKS công khai của project và cache khóa 10 phút. Biến
`SUPABASE_JWT_SECRET` chỉ còn là fallback cho token HS256 legacy. Frontend không được nhận
`SUPABASE_SECRET_KEY` hay `SUPABASE_JWT_SECRET`. Verifier cho phép clock skew tối đa 30 giây đối với
claim thời gian nhưng vẫn bắt buộc chữ ký, issuer, audience và expiry hợp lệ.

Riêng luồng đăng nhập chấp nhận namespace nội bộ `@p208.local` do script seed tạo. Các email đăng nhập
khác vẫn được kiểm tra theo chuẩn email thông thường; luồng tự đăng ký không chấp nhận namespace nội bộ này.
Nếu `AUTH_MODE` chưa là `supabase_jwt` hoặc thiếu `SUPABASE_URL`/`SUPABASE_ANON_KEY`, AuthService
không được đăng ký và endpoint đăng nhập trả `503 SERVICE_UNAVAILABLE`.

Đặt `DOCTOR_SEED_PASSWORD` và `RECEPTIONIST_SEED_PASSWORD` mạnh trong `backend/.env`, rồi chạy:

```powershell
python -m backend.scripts.seed_doctors
python -m backend.scripts.seed_receptionists
```

Script không có mật khẩu mặc định và không ghi mật khẩu ra log.

Để cấp đồng loạt tài khoản cho 75 bác sĩ đã lọc của Vinmec Smart City, 2 lễ tân,
1 bệnh nhân mẫu và 1 admin, kiểm tra kế hoạch trước rồi mới áp dụng:

```powershell
python -m backend.scripts.seed_vinmec_smart_city_accounts
python -m backend.scripts.seed_vinmec_smart_city_accounts --apply
```

Tên đăng nhập mặc định dùng miền giả `p208.local` và không cần hộp thư email thật. Có thể đổi miền
bằng `ACCOUNT_SEED_EMAIL_DOMAIN` nếu cần. Lệnh `--apply` dùng mật khẩu chung cố định cho ba role
`DOCTOR`, `RECEPTIONIST`, `PATIENT`; mật khẩu `ADMIN` được sinh ngẫu nhiên. Script ghi username/password của từng tài khoản tạo
thành công vào `backend/credentials/`. Thư mục này bị Git bỏ qua; file chứa mật khẩu rõ chỉ dùng để
bàn giao kín và cần xóa sau khi người nhận đổi mật khẩu. Script không ghi mật khẩu ra log.

Script có thể chạy lại an toàn sau lỗi một phần: Auth user đã có được tìm theo email, đặt lại mật khẩu
chung của role và upsert `profiles`; Auth user chưa có mới được tạo. Mỗi lần chạy tạo một file credentials
mới, không ghi đè file cũ. Script tra cứu read-only ID theo email trong `auth.users`, còn việc tạo hoặc
đặt lại mật khẩu vẫn chỉ thực hiện qua Supabase Auth Admin API; script không ghi trực tiếp vào schema `auth`.

## Nhúng tài liệu vào Supabase pgvector

Chat và embedding có thể dùng hai provider độc lập. Embedding dùng endpoint riêng `/embeddings` và model
embedding chuyên dụng; model chat không thể thay thế model embedding. Điền các biến sau trong `backend/.env`:

```env
EMBEDDING_PROVIDER=openrouter
# Bắt buộc khi LLM_PROVIDER không phải openrouter; phải là khóa OpenRouter hợp lệ
EMBEDDING_API_KEY=<openrouter-api-key>
EMBEDDING_MODEL=openai/text-embedding-3-small
EMBEDDING_DIMENSION=1024
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SECRET_KEY=<sb_secret_...>
```

`SUPABASE_SECRET_KEY` chỉ được dùng ở backend và không được đưa sang frontend hoặc commit.
Runtime ingest dùng Supabase Data API qua HTTPS nên không phụ thuộc direct database hostname
hay IPv6. Với khóa opaque dạng `sb_secret_...`, client RAG chỉ gửi header `apikey`; không gửi khóa
này dưới dạng Bearer JWT vì Supabase sẽ từ chối `401`.

Backend chỉ dùng lại `LLM_API_KEY` khi `LLM_PROVIDER` trùng `EMBEDDING_PROVIDER`. Ví dụ
`LLM_PROVIDER=deepseek` và `EMBEDDING_PROVIDER=openrouter` bắt buộc có `EMBEDDING_API_KEY`
(hoặc `OPENROUTER_API_KEY`) riêng; khóa DeepSeek gửi sang OpenRouter sẽ bị từ chối `401`.

Lần đầu, mở **Supabase Dashboard → SQL Editor** và chạy toàn bộ file:

`backend/migrations/sql/20260803_0001_supabase_knowledge_base.sql`

Sau đó chạy RPC tìm kiếm phục vụ chat:

`backend/migrations/sql/20260803_0003_add_match_knowledge_chunks.sql`

File SQL tạo extension `vector`, hai bảng có RLS, HNSW index và RPC transaction. Sau đó ingest:

```powershell
py -m backend.scripts.ingest_knowledge docs/y_te_vin.md
```

Nếu môi trường có direct database hoặc Session pooler, Alembic vẫn có thể được dùng bằng biến
`SUPABASE_DATABASE_URL`; biến này không cần thiết cho runtime ingest qua Data API.

Pipeline chỉ nhận tài liệu có `review_status: APPROVED` và `is_active: true`. SHA-256 checksum
giúp chạy lại an toàn: nếu nội dung file không đổi thì không gọi embedding và không tạo dữ liệu
trùng. Các chunk được lưu tại `knowledge_chunks.embedding vector(1024)` cùng metadata chuyên
khoa, bệnh, nhóm bệnh nhân và URL nguồn.

## Bật RAG trong chat

```env
RAG_ENABLED=true
RAG_TOP_K=4
RAG_SIMILARITY_THRESHOLD=0.40
RAG_MAX_CONTEXT_TOKENS=2000
```

Ngưỡng mặc định `0.40` được hiệu chỉnh cho embedding tiếng Việt của kho tài liệu hiện tại. Nếu tăng ngưỡng,
hãy đo similarity của các câu hỏi mẫu trước; ngưỡng `0.60` đã loại cả chunk Da liễu phù hợp có similarity khoảng `0.42`.

`GET /ready` trả thêm `rag_configured`. Có thể đặt `RAG_ENABLED=false` để toàn bộ câu
hỏi quay về luồng chat `FALLBACK`. Khi RAG bật, câu hỏi y tế không tìm thấy nguồn phù
hợp hoặc retrieval lỗi nhận phản hồi giới hạn cố định và không gọi chat model.

## Bật luồng đặt lịch thật

Chạy migration profile/auth trước, sau đó chạy booking workflow:

```powershell
# Sau khi tạo lại database từ đầu: chạy toàn bộ migration
alembic upgrade head   # trong backend/migrations (hoặc chạy từng file SQL qua SQL Editor)

# Cấp tài khoản cho 75 bác sĩ Vinmec + 2 lễ tân + bệnh nhân mẫu + admin (dry-run trước)
py -m backend.scripts.seed_vinmec_smart_city_accounts
py -m backend.scripts.seed_vinmec_smart_city_accounts --apply

# 3 bác sĩ khoa Miễn dịch - Dị ứng (trước đây Da liễu) + khoảng BLOCKED demo
py -m backend.scripts.seed_da_lieu
py -m backend.scripts.seed_da_lieu --apply

# Liên kết bác sĩ với 6 chuyên khoa theo bộ dữ liệu bệnh mới; mặc định là dry-run
py -m backend.scripts.seed_booking_catalog
py -m backend.scripts.seed_booking_catalog --apply
```

Catalog từ 2026-08-12 chỉ còn **6 chuyên khoa theo bộ dữ liệu bệnh mới**
(`KHOA_MAT`, `HO_HAP`, `KHOA_TIEU_HOA_GAN_MAT`, `CHAN_THUONG_CHINH_HINH_Y_HOC_THE_THAO`,
`MIEN_DICH_DI_UNG`, `TAI_MUI_HONG`). Bác sĩ CSV Vinmec được gán khoa gần nhất qua
`CSV_SPECIALTY_MAP`; bác sĩ thuộc khoa không có trong 6 nhóm giữ profile nhưng không tạo
`Doctor` row → không nhận lịch qua chat.

Schema và ORM thống nhất `specialties.keywords` là `jsonb NOT NULL`, mặc định `[]`.
Script seed khởi tạo keyword từ tên chuyên khoa và dùng
`NullPool` và tắt prepared statements nên chạy được với cả Supabase Transaction pooler
cổng `6543`; thao tác được commit một lần ở cuối và có thể chạy lại theo ID xác định.
Migration căn chỉnh `0006` bổ sung `held_by_user_id` cho database đã có bảng lịch từ
trước; cần chạy migration này trước khi giữ slot hoặc đặt lịch.

Các biến runtime bổ sung:

```env
REDIS_URL=redis://redis:6379/0
RECEPTIONIST_APPROVAL_TIMEOUT_MINUTES=30
PATIENT_CONFIRMATION_TIMEOUT_MINUTES=15
```

Đặt scheduler chạy mỗi phút để giải phóng yêu cầu/hold hết hạn:

```powershell
py -m backend.scripts.cleanup_booking_state
```

Notification được lưu PostgreSQL trước khi publish SSE qua Redis. Nếu Redis tạm lỗi, dữ liệu chưa đọc vẫn
được tải lại qua `GET /api/v1/notifications`. Luồng backend booking chưa được chạy pytest/migration trên máy
cập nhật hiện tại vì máy không có Python runtime và Docker daemon; cần chạy bộ kiểm thử backend trong CI hoặc
container trước khi triển khai.
