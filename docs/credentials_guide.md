# 🔑 CẨM NANG TOÀN DIỆN VỀ BIẾN MÔI TRƯỜNG & KHÓA API DỰ ÁN VMEC (BẢN BẢO MẬT)

Tài liệu này tổng hợp đầy đủ danh sách các Khóa API (API Keys) của dự án VMEC đã được lưu trữ vĩnh viễn vào **Windows User Environment Variables** trên máy tính của bạn. Tất cả các giá trị khóa đã được ẩn đi để đảm bảo an toàn thông tin.

---

## 🚀 1. NHÓM GOOGLE GEMINI API KEYS (7 KHÓA)

Các khóa này dùng để cấp hạn ngạch (quota) và phân tải truy vấn mô hình trí tuệ nhân tạo Gemini 3.1 & 3.5 Flash:

| Tên biến (Variable) | Trạng thái | Mô tả |
| :--- | :--- | :--- |
| **`GEMINI_API_KEY`** | **Khóa chính (Primary)** | Đã lưu trên hệ thống |
| **`GEMINI_API_KEY_2`** | Dự phòng (Backup) | Đã lưu trên hệ thống |
| **`GEMINI_API_KEY_3`** | Dự phòng (Backup) | Đã lưu trên hệ thống |
| **`GEMINI_API_KEY_4`** | Dự phòng (Backup) | Đã lưu trên hệ thống |
| **`GEMINI_API_KEY_5`** | Dự phòng (Backup) | Đã lưu trên hệ thống |
| **`GEMINI_API_KEY_6`** | Dự phòng (Backup) | Đã lưu trên hệ thống |
| **`GEMINI_API_KEY_7`** | Dự phòng (Backup) | Đã lưu trên hệ thống |

---

## 🌪️ 2. NHÓM MISTRAL API KEYS (13 KHÓA)

Các khóa này được dùng cho việc sinh Vector nhúng (Mistral Embeddings 1024D) khi thực hiện tra cứu Vector RAG trên CSDL:

| Tên biến (Variable) | Mô tả |
| :--- | :--- |
| **`MISTRAL_API_KEY`** | Đã lưu trên hệ thống |
| **`MISTRAL_API_KEY_2`** | Đã lưu trên hệ thống |
| **`MISTRAL_API_KEY_3`** | Đã lưu trên hệ thống |
| **`MISTRAL_API_KEY_4`** | Đã lưu trên hệ thống |
| **`MISTRAL_API_KEY_5`** | Đã lưu trên hệ thống |
| **`MISTRAL_API_KEY_6`** | Đã lưu trên hệ thống |
| **`MISTRAL_API_KEY_7`** | Đã lưu trên hệ thống |
| **`MISTRAL_API_KEY_8`** | Đã lưu trên hệ thống |
| **`MISTRAL_API_KEY_9`** | Đã lưu trên hệ thống |
| **`MISTRAL_API_KEY_10`** | Đã lưu trên hệ thống |
| **`MISTRAL_API_KEY_11`** | Đã lưu trên hệ thống |
| **`MISTRAL_API_KEY_12`** | Đã lưu trên hệ thống |
| **`MISTRAL_API_KEY_13`** | Đã lưu trên hệ thống |

---

## 🔮 3. NHÓM PHOENIX / TELEMETRY HOOK (1 KHÓA)

Khóa dùng cho Phoenix AI Log Hook để giám sát (Monitor) và thu thập log hoạt động của AI Agent:

| Tên biến (Variable) | Mô tả |
| :--- | :--- |
| **`AI_LOG_API_KEY`** | Đã lưu trên hệ thống |
| **`AI_LOG_SERVER`** | Đã lưu trên hệ thống |

---

## 🐙 4. NHÓM GITHUB ACCESS TOKEN (1 KHÓA)

Mã truy cập cá nhân GitHub (GitHub Personal Access Token) dùng để xác thực thao tác với GitHub API, Git CLI và các công cụ AI Agent:

| Tên biến (Variable) | Mô tả |
| :--- | :--- |
| **`GITHUB_TOKEN`** | GitHub Personal Access Token (Đã lưu trên hệ thống) |
| **`GH_TOKEN`** | GitHub Personal Access Token (Đã lưu trên hệ thống - dự phòng) |

---

## 🚀 5. NHÓM RENDER API / MCP KEY (1 KHÓA)

Mã khóa API Render (Render API Key / MCP Key) dùng để tương tác với Render Cloud Platform, quản lý deployment và tích hợp MCP Server:

| Tên biến (Variable) | Mô tả |
| :--- | :--- |
| **`RENDER_API_KEY`** | Render API / MCP Key (Đã lưu trên hệ thống) |
| **`RENDER_TOKEN`** | Render API / MCP Key (Đã lưu trên hệ thống - dự phòng) |

---

## ⚡ 6. NHÓM SUPABASE ACCESS TOKEN & CẤU HÌNH (1 KHÓA)

Mã truy cập cá nhân Supabase (Supabase Personal Access Token) dùng để tương tác với Supabase Management API, cấu hình MCP Server và quản lý dự án:

| Tên biến (Variable) | Mô tả |
| :--- | :--- |
| **`SUPABASE_ACCESS_TOKEN`** | Supabase Personal Access Token (Đã lưu trên hệ thống) |
| **`SUPABASE_PROJECT_REF`** | Mã định danh dự án Supabase (`nntxlqchytvfmutmixea`) |

---

## ▲ 7. NHÓM VERCEL ACCESS TOKEN (1 KHÓA)

Mã truy cập cá nhân Vercel (Vercel Personal Access Token) dùng để điều khiển triển khai dự án frontend, tra cứu logs và tích hợp Vercel MCP Server:

| Tên biến (Variable) | Mô tả |
| :--- | :--- |
| **`VERCEL_TOKEN`** | Vercel Personal Access Token (Đã lưu trên hệ thống) |
| **`VERCEL_API_KEY`** | Vercel Personal Access Token (Đã lưu trên hệ thống - alias) |

---

## 📐 8. NHÓM LINEAR API KEY & QUẢN TRỊ DỰ ÁN (1 KHÓA)

Khóa API Linear cá nhân (Linear Personal API Key) dùng để tích hợp Linear MCP Server, quản lý issues, tasks, milestones và chu kỳ phát triển phần mềm:

| Tên biến (Variable) | Mô tả |
| :--- | :--- |
| **`LINEAR_API_KEY`** | Linear Personal API Key (Đã lưu trên hệ thống) |

---

## 🧠 9. NHÓM SERENA MCP (SEMANTIC CODE & REFACTORING AGENT)

Hệ thống **Serena MCP** (`oraios/serena`) cung cấp khả năng hiểu code ngữ nghĩa cấp IDE (Language Server Protocol - LSP), tra cứu symbol, tham chiếu chéo file và tái cấu trúc (refactoring) mã nguồn thông minh mà không cần đọc toàn bộ file:

| Thành phần | Cấu hình & Vị trí | Mô tả |
| :--- | :--- | :--- |
| **Trình thực thi (Runtime)** | `uvx` (`C:\Users\Namdr\.local\bin\uvx.exe`) | Quản lý môi trường Python độc lập |
| **Gói MCP (Package)** | `git+https://github.com/oraios/serena` | Đã build và cache sẵn sàng trên máy |
| **File cấu hình MCP** | `C:\Users\Namdr\.gemini\antigravity\mcp_config.json` | Khởi chạy tự động với transport `stdio` |

---

## ⚡ 10. NHÓM REDIS & DATABASE MCP (CACHE & CƠ SỞ DỮ LIỆU)

Cung cấp kết nối trực tiếp cho AI Agent thao tác với hệ thống Cache (Redis) và Cơ sở dữ liệu quan hệ (PostgreSQL / CockroachDB):

| Dịch vụ MCP | Công nghệ & Gói thực thi | Chức năng chính |
| :--- | :--- | :--- |
| **`redis`** | `uvx redis-mcp` (Port 6379) | Quản lý cache, session, key-value, hash, list, stream |
| **`database`** | `npx @modelcontextprotocol/server-postgres` | Thực thi truy vấn SQL, quản lý schema, bảng và quan hệ |

---

## 📚 11. NHÓM CONTEXT7 MCP (TRA CỨU TÀI LIỆU & API THỜI GIAN THỰC)

Hệ thống **Context7 MCP** (`@upstash/context7-mcp`) tự động nạp tài liệu chính thức (Official Docs) và ví dụ code mới nhất của bất kỳ thư viện / framework nào theo phiên bản chính xác, loại bỏ hoàn toàn hiện tượng AI sinh code dùng API cũ bị lỗi thời (deprecated):

| Thành phần | Cấu hình & Gói thực thi | Mô tả |
| :--- | :--- | :--- |
| **Trình thực thi (Runtime)** | `npx.cmd` (`Node.js v24+`) | Chạy package `@upstash/context7-mcp@latest` |
| **Chế độ kết nối** | `stdio` | Tích hợp tự động trong `mcp_config.json` |
| **Cách kích hoạt** | Thêm cụm từ *"use context7"* hoặc *"tra cứu tài liệu mới nhất"* trong prompt | Tự động lấy docs từ source repo chính thức |

---

## 🛡️ 12. CẤU HÌNH CƠ SỞ DỮ LIỆU & BẢO MẬT KHÁC

Các biến môi trường cấu hình đường dẫn và thông tin bảo mật lõi của dự án:

| Tên biến (Variable) | Mô tả |
| :--- | :--- |
| **`COCKROACH_DATABASE_URL`** | Đường dẫn kết nối trực tiếp đến database CockroachDB Cloud |
| **`POSTGRES_PASSWORD`** | Mật khẩu quản trị database PostgreSQL Local |
| **`LOCAL_BACKUP_PASSPHRASE`** | Mã khóa giải mã bản sao lưu dữ liệu y khoa |

---

## 💻 13. CÁCH WINDOWS TRUY XUẤT CÁC BIẾN NÀY

Hệ thống Windows sẽ cung cấp trực tiếp các khóa này cho bất kỳ mã nguồn Python, Node.js hoặc Docker chạy cục bộ:
- **Kiểm tra trong PowerShell**:
  ```powershell
  $env:LINEAR_API_KEY
  $env:VERCEL_TOKEN
  $env:SUPABASE_ACCESS_TOKEN
  $env:RENDER_API_KEY
  $env:GITHUB_TOKEN
  $env:GEMINI_API_KEY
  $env:MISTRAL_API_KEY_2
  ```
- **Kiểm tra qua GUI**: Tìm kiếm cụm từ `env` ➔ Chọn `Edit environment variables for your account` để quản lý trực tiếp bằng giao diện Windows.








