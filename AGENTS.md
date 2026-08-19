# Hướng dẫn làm việc với dự án P-208

## Phạm vi áp dụng

Các quy tắc trong file này áp dụng cho toàn bộ repository.

## Việc bắt buộc làm trước mỗi yêu cầu

1. Trước khi phân tích, trả lời hoặc sửa code, phải xem danh sách tài liệu trong `vide/` và đọc tài liệu phù hợp với yêu cầu hiện tại.
2. Luôn dùng `vide/01_KIEN_TRUC_VA_CONG_NGHE_DU_AN.md` làm nguồn chuẩn cho kiến trúc, công nghệ, luồng xử lý, bảo mật, kiểm thử và cấu trúc backend dự kiến.
3. Nếu yêu cầu liên quan trực tiếp hoặc gián tiếp đến dữ liệu, phải đọc thêm `vide/02_MO_TA_CO_SO_DU_LIEU.md` trước khi trả lời hoặc triển khai. Phạm vi này gồm database, schema, bảng, collection, model, field, enum, quan hệ, khóa, constraint, index, migration, transaction, RLS, PostgreSQL, Supabase, MongoDB, Redis, pgvector, RAG storage, audit data và quyền truy cập dữ liệu.
4. Nếu một yêu cầu chạm cả kiến trúc và dữ liệu, phải đọc cả hai tài liệu.
5. Sau khi đọc tài liệu, phải kiểm tra cây thư mục/file thực tế có liên quan. Không được giả định rằng cấu trúc đề xuất trong tài liệu đã được tạo trên ổ đĩa.
6. Khi tài liệu và code thực tế khác nhau, phải nêu rõ sự khác biệt; không tự ý coi code cũ là kiến trúc đích.

## Quy tắc đồng bộ tài liệu trong `vide/`

- Khi sửa bất kỳ file code, cấu hình, migration, API, test, hạ tầng hoặc tài liệu nào có nội dung liên quan đến một hay nhiều tài liệu trong `vide/`, phải rà soát và cập nhật các tài liệu `vide/` bị ảnh hưởng ngay trong cùng yêu cầu.
- Trước khi cập nhật tài liệu, phải kiểm tra code, cấu hình, migration, test và cây thư mục thực tế có liên quan. Nội dung trong `vide/` sau khi sửa phải phản ánh đúng trạng thái hiện tại đã kiểm chứng của repository.
- Phải phân biệt rõ nội dung **đã triển khai**, **đang triển khai** và **kiến trúc/thiết kế mục tiêu**. Không được mô tả một thành phần là đã có nếu thành phần đó mới chỉ nằm trong thiết kế hoặc tài liệu đề xuất.
- Chỉ cập nhật các phần tài liệu thực sự bị tác động, đồng thời giữ nhất quán giữa tài liệu kiến trúc, mô tả dữ liệu, báo cáo triển khai, đặc tả API và tài liệu frontend có liên quan.
- Nếu thay đổi làm code thực tế lệch khỏi thiết kế chuẩn trong `vide/01_KIEN_TRUC_VA_CONG_NGHE_DU_AN.md` hoặc mô hình dữ liệu trong `vide/02_MO_TA_CO_SO_DU_LIEU.md`, phải nêu rõ độ lệch và lý do; phải xin xác nhận trước nếu độ lệch làm thay đổi kiến trúc hoặc mô hình dữ liệu đã thống nhất.
- Không sửa tài liệu theo suy đoán. Nếu chưa đủ bằng chứng để xác nhận trạng thái thực tế, phải ghi rõ phần chưa xác minh hoặc hỏi người dùng trước khi thay đổi nội dung mang tính quyết định.

## Quy tắc triển khai backend

- Mọi code backend mới của dự án phải được tạo trong `backend/`.
- Không thêm backend mới vào `src/`; `src/` là phần khung cũ hiện có và chỉ được đọc hoặc thay đổi khi người dùng yêu cầu rõ ràng.
- Backend đích là Flask theo mô hình Modular Monolith, được phân lớp theo kiến trúc trong `vide/01_KIEN_TRUC_VA_CONG_NGHE_DU_AN.md`.
- Route chỉ nhận request và trả response. Nghiệp vụ phải nằm trong service hoặc engine phù hợp.
- Khi thiết kế model, repository, migration hoặc truy vấn, phải đối chiếu `vide/02_MO_TA_CO_SO_DU_LIEU.md`.
- Không tự ý tạo cấu trúc khác tài liệu. Nếu cần lệch thiết kế, phải giải thích lý do và xin xác nhận khi thay đổi đó ảnh hưởng kiến trúc hoặc mô hình dữ liệu.

## Vùng cấm: AI log

- Không đọc, tìm kiếm nội dung, mở, sửa, tạo lại, di chuyển hoặc xóa bất kỳ file nào thuộc phần AI log.
- Tối thiểu phải loại trừ hoàn toàn `.ai-log/**` khỏi mọi lệnh duyệt file hoặc tìm kiếm toàn repository.
- Không đọc hoặc sửa các script/file có tên hoặc mục đích rõ ràng liên quan đến AI log, log hook hay việc nộp log, gồm `scripts/log_antigravity.py`, `scripts/log_hook.py`, `scripts/log_manual.py`, `scripts/submit_log.py` và các file thiết lập hook liên quan.
- Không dùng dữ liệu từ AI log để suy luận, mô tả hay triển khai dự án.
- Nếu một tác vụ bắt buộc phải chạm vùng này, phải dừng lại và báo người dùng thay vì tự thực hiện.

## Nguồn chuẩn theo loại câu hỏi

| Chủ đề | File phải đọc |
|---|---|
| Kiến trúc tổng thể, stack, backend, API, auth, workflow, agent, MCP, guardrail, RAG, bảo mật, deploy, test | `vide/01_KIEN_TRUC_VA_CONG_NGHE_DU_AN.md` |
| Database, schema, bảng/collection, enum, field, quan hệ, constraint, index, migration, quy tắc dữ liệu | `vide/02_MO_TA_CO_SO_DU_LIEU.md` |
| Tính năng backend có đọc/ghi dữ liệu | Cả hai file |

## Cấu trúc dự án thực tế tại thời điểm tạo hướng dẫn

```text
P-208/
├── AGENTS.md
├── backend/                 # Nơi viết toàn bộ backend mới; hiện chưa có code
├── vide/
│   ├── 01_KIEN_TRUC_VA_CONG_NGHE_DU_AN.md
│   └── 02_MO_TA_CO_SO_DU_LIEU.md
├── src/                     # Khung ứng dụng cũ, không phải nơi viết backend mới
│   ├── agents/
│   ├── api/
│   ├── models/
│   ├── services/
│   ├── config.py
│   └── main.py
├── tests/                   # Test hiện có cho khung trong src/
├── docs/                    # Tài liệu tham khảo bổ sung
├── eval/
├── presentation/
├── scripts/                 # Có file liên quan AI log: không đọc hoặc sửa các file đó
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── ruff.toml
├── Makefile
└── README.md
```

Cấu trúc trên chỉ là snapshot. Trước mỗi yêu cầu vẫn phải kiểm tra lại những thư mục được phép đọc, đặc biệt là `backend/` và `vide/`, đồng thời luôn loại trừ vùng AI log.

## Tóm tắt kiến trúc đích

- Frontend: Next.js, React, TypeScript và Tailwind CSS.
- Backend: Python, Flask REST API, Modular Monolith.
- Xác thực: Supabase Auth/JWT; phân quyền RBAC và RLS.
- Dữ liệu quan hệ: PostgreSQL/Supabase cho dữ liệu nghiệp vụ và lịch hẹn.
- Dữ liệu hội thoại/thực thi: MongoDB.
- Cache, lock và trạng thái tạm: Redis.
- Vector/RAG: PostgreSQL với pgvector, hybrid search và reranking.
- AI orchestration: router phân luồng Rule-based, Workflow, Agent và RAG.
- Tích hợp tool: MCP Gateway có policy, validation, confirmation và sanitization.
- An toàn: guardrails, human-in-the-loop, audit và không cho Agent truy cập trực tiếp database hoặc secret.

## Nguyên tắc trả lời và thay đổi

- Khi mô tả dự án, phân biệt rõ trạng thái hiện tại với kiến trúc đích trong tài liệu.
- Trước khi sửa, nêu ngắn gọn file nguồn trong `vide/` đã dùng để đối chiếu nếu thay đổi liên quan kiến trúc hoặc dữ liệu.
- Chỉ sửa đúng phạm vi người dùng yêu cầu và giữ nguyên các thay đổi không liên quan đang có.
- Không tiết lộ secret, token hoặc dữ liệu sức khỏe nhạy cảm trong code, log hay câu trả lời.
