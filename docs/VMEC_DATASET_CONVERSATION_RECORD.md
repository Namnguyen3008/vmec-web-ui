# BIÊN BẢN HỘI THOẠI & HỒ SƠ QUẢN TRỊ DỮ LIỆU DATASET VMEC-01
**(Tài liệu tích hợp toàn bộ tiến trình xử lý, làm sạch và chuẩn hóa dữ liệu cho Project `vmec_web_ui`)**

---

## 1. TỔNG QUAN TIẾN TRÌNH ĐÃ THỰC HIỆN

Cuộc hội thoại này đã hoàn thành toàn bộ chu trình xử lý dữ liệu y tế từ thô đến hoàn thiện (Data Engineering & Governance Pipeline):

1. **Khám phá & Thu thập Thông tin Sâu (Deep Analysis):**
   * Quét toàn bộ 40 Batches (`B01` - `B40`) thuộc Context `6.1.0-live-url-precise-citations` với **11,700 bản ghi dữ liệu**.
   * Phân tích 7 trụ cột y tế: Phân loại chuyên khoa BYT, Triệu chứng, 13 chuyên khoa lâm sàng, Cấp cứu 115, NLU tiếng Việt, Máy trạng thái Booking và Benchmark an toàn.
2. **Dọn dẹp & Tinh gọn Cấu trúc Tệp:**
   * Xóa bỏ **145 file nén và log rác** (`.zip`, `.png`, `.txt`, `*STATE*.json`) trong thư mục nguồn.
   * Bóc tách **935 sheets** từ 46 file Excel thành các tệp CSV độc lập.
   * Xóa tiếp **568 file log kiểm toán rác** (`CITATION_MATRIX`, `AUTOMATED_QA`...), giải phóng hơn **32 MB**.
3. **Làm sạch Nội dung & Lọc bỏ 109 Cột Rác:**
   * Giảm từ **124 cột rác** xuống còn **16 cột chuẩn hóa**.
   * Dùng Regex lọc sạch các mã nhãn kỹ thuật `[mẫu-ngữ-liệu...]`, `[TRACE...]`, tiền tố `DEMO=true;`.
   * Enrich liên kết với **323 nguồn văn bản chính thống của Bộ Y tế, BV Bạch Mai, Từ Dũ**.
4. **Chuẩn hóa 46 Data Cards:**
   * Lọc bỏ chuỗi hash SHA-256 và log kiểm thử máy.
   * Gom thành 1 cuốn **Sổ tay Thuyết minh 40 chương (`docs/VMEC_MASTER_DOCUMENTATION.md`)**.
   * Cắt thành **306 Chunks tri thức (`data/vmec_datacards_chunks.parquet`)** cho Vector DB.
5. **Xuất bản 4 Gói Dữ liệu Chuyên dụng vào Project `vmec_web_ui`:**
   * 📊 `data/vmec_rag_knowledge_base.parquet` (3,650 dòng định tuyến & triệu chứng)
   * 🚨 `data/vmec_emergency_guardrails.json` (1,536 quy tắc cấp cứu 115)
   * 🧪 `data/vmec_ai_benchmark_eval.jsonl` (600 test cases đánh giá AI)
   * 💬 `data/vmec_finetune_train.jsonl` & `val.jsonl` (3,650 cặp hội thoại train LLM)

---

## 2. VỊ TRÍ CÁC TỆP TIN ĐÃ TÍCH HỢP TRONG PROJECT `vmec_web_ui`

```
📁 vmec_web_ui/
│
├── 📂 docs/                                 <-- (TÀI LIỆU & THUYẾT MINH)
│   ├── 📄 VMEC_MASTER_DOCUMENTATION.md      (Sổ tay 40 chương chuyên khoa sạch 100%)
│   ├── 📄 VMEC_DATASET_MASTER_ENCYCLOPEDIA.md (Hồ sơ đặc tả toàn diện toàn bộ dataset)
│   └── 📄 VMEC_DATASET_CONVERSATION_RECORD.md (Biên bản toàn bộ cuộc hội thoại này)
│
├── 📂 data/                                 <-- (KHO DỮ LIỆU ĐÃ LÀM SẠCH)
│   ├── 📊 vmec_rag_knowledge_base.parquet   (Kho tri thức cho Chatbot Triage RAG)
│   ├── 📊 vmec_rag_knowledge_base.csv       (Bản CSV mở bằng Excel)
│   ├── 📊 vmec_datacards_chunks.parquet     (306 Chunks văn bản luật & quy chuẩn)
│   ├── 📊 vmec_datacards_chunks.csv
│   ├── 🚨 vmec_emergency_guardrails.json    (1,536 quy tắc Cấp cứu 115)
│   ├── 🚨 vmec_emergency_guardrails.csv
│   ├── 🧪 vmec_ai_benchmark_eval.jsonl      (600 test cases đánh giá AI)
│   ├── 🧪 vmec_ai_benchmark_eval.csv
│   ├── 💬 vmec_finetune_train.jsonl         (3,102 hội thoại train LLM)
│   └── 💬 vmec_finetune_val.jsonl           (548 hội thoại val LLM)
│
├── 📂 src/app/                              <-- (GIAO DIỆN WEB NEXT.JS)
└── ...
```

---

## 3. HƯỚNG DẪN KẾT NỐI DỮ LIỆU VÀO WEB UI (`src/`)

### 1. Kết nối Bộ lọc Cấp cứu vào Patient Chat (`src/app/(patient)/chat/page.tsx`):
Import file `data/vmec_emergency_guardrails.json` để kiểm tra tin nhắn bệnh nhân trước khi gọi API LLM. Nếu phát hiện dấu hiệu nguy kịch (`CRITICAL_SAFETY`), hiển thị banner đỏ yêu cầu gọi 115 ngay lập tức.

### 2. Kết nối RAG Knowledge Base vào Clinical AI Panel (`src/components/doctor/ClinicalAIPanel.tsx`):
Dùng `data/vmec_rag_knowledge_base.parquet` để gợi ý cho Bác sĩ các căn cứ pháp lý và phác đồ chẩn đoán tương ứng từ Bộ Y tế khi xem hồ sơ bệnh án.

---
*Tài liệu này được tạo tự động bởi Antigravity Assistant, đóng vai trò là cầu nối tri thức hoàn chỉnh cho dự án VMEC Web UI.*
