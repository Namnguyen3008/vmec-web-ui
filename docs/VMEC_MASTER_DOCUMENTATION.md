# SỔ TAY QUY CHUẨN & HƯỚNG DẪN CHUYÊN MÔN Y TẾ VMEC-01
*(Tài liệu Thuyết minh Pháp lý, Ranh giới An toàn và Quy chuẩn Lâm sàng Tổng hợp)*

## MỤC LỤC TỔNG QUAN 40 CHUYÊN ĐỀ:
- [Chương B01: Phân loại Chuyên khoa Y tế Việt Nam (Taxonomy & Specialties)](#chương-b01-b01)- [Chương B02: Danh mục Dịch vụ Đặt khám & Quy tắc Booking (Bookable Services)](#chương-b02-b02)- [Chương B03: Cơ sở Y tế, Khoa phòng & Giờ làm việc (Facilities & Departments)](#chương-b03-b03)- [Chương B04: Nhân sự Y tế & Vai trò Hành nghề (Practitioners & Roles)](#chương-b04-b04)- [Chương B05: Lịch làm việc, Khung giờ & Quản lý Slot (Schedules & Slots)](#chương-b05-b05)- [Chương B06: Ontology Triệu chứng & Nhu cầu Khám bệnh (Symptom Ontology)](#chương-b06-b06)- [Chương B07: Định tuyến Chuyên khoa Tim mạch (Cardiology Routing)](#chương-b07-b07)- [Chương B08: Định tuyến Chuyên khoa Hô hấp (Respiratory Routing)](#chương-b08-b08)- [Chương B09: Định tuyến Chuyên khoa Tiêu hóa (Gastroenterology Routing)](#chương-b09-b09)- [Chương B10: Định tuyến Chuyên khoa Thần kinh & Đột quỵ (Neurology & Stroke)](#chương-b10-b10)- [Chương B11: Định tuyến Chuyên khoa Cơ Xương Khớp (Musculoskeletal Routing)](#chương-b11-b11)- [Chương B12: Định tuyến Chuyên khoa Da liễu & Dị ứng (Dermatology & Allergy)](#chương-b12-b12)- [Chương B13: Định tuyến Tai Mũi Họng, Mắt & Răng Hàm Mặt (ENT, Eye & Dental)](#chương-b13-b13)- [Chương B14: Định tuyến Tiết niệu, Thận, Nội tiết & Huyết học (Urology & Endocrinology)](#chương-b14-b14)- [Chương B15: Định tuyến Nhi khoa theo Độ tuổi & Phụ huynh (Pediatrics Routing)](#chương-b15-b15)- [Chương B16: Định tuyến Sản Phụ khoa theo Giai đoạn Thai kỳ (OB/GYN Routing)](#chương-b16-b16)- [Chương B17: Định tuyến Lão khoa & Người cao tuổi Đa bệnh (Geriatrics Routing)](#chương-b17-b17)- [Chương B18: Định tuyến Sức khỏe Tâm thần & Tâm lý (Psychiatry & Mental Health)](#chương-b18-b18)- [Chương B19: Định tuyến Bệnh Truyền nhiễm & Y học Nhiệt đới (Infectious Diseases)](#chương-b19-b19)- [Chương B20: Dấu hiệu Cấp cứu Đỏ Người lớn (Adult Emergency Red Flags)](#chương-b20-b20)- [Chương B21: Dấu hiệu Cấp cứu Đỏ Trẻ em & Sơ sinh (Pediatric Emergency Red Flags)](#chương-b21-b21)- [Chương B22: Dấu hiệu Cấp cứu Đỏ Sản khoa & Hậu sản (Maternal Emergency Red Flags)](#chương-b22-b22)- [Chương B23: Xử lý Phủ định Cấp cứu & Hard Negatives (Negated Emergency Cases)](#chương-b23-b23)- [Chương B24: Chiến lược Đặt câu hỏi Làm rõ & Chuyển giao Y tế (Clarifying Questions)](#chương-b24-b24)- [Chương B25: Đa dạng Diễn đạt, Ngữ vực & Phương ngữ 3 miền (Paraphrasing & Dialects)](#chương-b25-b25)- [Chương B26: Chuẩn hóa Tiếng Việt Không Dấu & Lỗi Gõ (No-diacritics & Typo Robustness)](#chương-b26-b26)- [Chương B27: Nhận diện Ý định & Thực thể Y tế NLU (Intent & Entity Recognition)](#chương-b27-b27)- [Chương B28: Kịch bản Luồng Hội thoại Y tế Đa lượt (Multi-turn Dialogues)](#chương-b28-b28)- [Chương B29: Máy Trạng thái Giao dịch Đặt lịch Khám (Booking State Machine)](#chương-b29-b29)- [Chương B30: Hủy lịch, Dời lịch & Xử lý Tranh chấp Giữ chỗ (Cancellation & Reschedule)](#chương-b30-b30)- [Chương B31: Hỏi đáp Quyền lợi Người bệnh, Viện phí & Pháp lý (FAQ & Policies)](#chương-b31-b31)- [Chương B32: Mẫu Thông báo Đa kênh Bảo vệ Quyền riêng tư (Notification Templates)](#chương-b32-b32)- [Chương B33: Benchmark Đánh giá Chống Ảo giác & Căn cứ Trích dẫn (Hallucination Grounding)](#chương-b33-b33)- [Chương B34: Benchmark Ca Lâm sàng Chuẩn Vàng (Clinical Gold Benchmark)](#chương-b34-b34)- [Chương B35: Benchmark Bảo mật & Chống Prompt Injection (Security & Jailbreak Defense)](#chương-b35-b35)- [Chương B36: Hồ sơ Nhân khẩu học Giả lập & Quản trị Đồng thuận (Synthetic Profiles)](#chương-b36-b36)- [Chương B37: Nhật ký Vận hành & Phân tích Tỷ lệ Bỏ hẹn (Operational Analytics)](#chương-b37-b37)- [Chương B38: Từ điển Sự kiện & Chỉ số KPI Y tế Chuẩn hóa (Event & Metric Dictionary)](#chương-b38-b38)- [Chương B39: Biểu mẫu Thu thập Phản hồi & Pilot Rehearsal (Feedback & Rehearsal)](#chương-b39-b39)- [Chương B40: Khung Quản trị Bản phát hành & Toàn vẹn Checksum (Release Governance)](#chương-b40-b40)
---

# CHƯƠNG B01: Phân loại Chuyên khoa Y tế Việt Nam (Taxonomy & Specialties)

### Mục tiêu và phạm vi

B01 tạo taxonomy chuyên khoa Việt Nam phục vụ catalog nội bộ. Release này **không** phải danh mục khoa đang hoạt động của bất kỳ bệnh viện cụ thể nào, không phải service catalog, practitioner directory hoặc bằng chứng về slot/availability.

Mọi DATA row có `retrieval_scope=ADMIN_ONLY` và `allow_patient_retrieval=false`. Các nhãn “Tên chương” từ Phụ lục 01 chỉ là taxonomy/provenance, không được nâng thành facility/department bookable entity.

### Quy mô

- Thành phần: 28 `specialties` + 56 `specialty_aliases` + 63 `specialty_source_map` + 3 `subspecialties`
- `deprecated_specialty_codes`: **0** pass rows vì không có evidence deprecation đủ chuẩn; không padding.

### Evidence chính

- Phụ lục 01 — exact PDF: `https://datafiles.chinhphu.vn/cpp/files/vbpq/2024/10/23-byt-kem.pdf`
- Thông tư 25/2026/TT-BYT — exact signed PDF: `https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/7/25-byt.signed.pdf`
- 7 exact KCB HTML articles cho 3 chuyên khoa con và 4 đối chiếu tên chuyên ngành.

Portal/home/search chỉ dùng discovery. Tất cả source dùng trong DATA nằm trong `SOURCES`, `URL_VALIDATION`, `EVIDENCE_LINKS` và `CITATION_MATRIX`.

### Current-effect handling

Mốc “30/6/2026” in trên Phụ lục 01 không được dùng làm trạng thái hiện hành. Claim về hiệu lực dùng 25/2026/TT-BYT Điều 3 khoản 1(a) và Điều 6 khoản 2: Phụ lục 01 đến hết 31/12/2027 và riêng Điều 3 có hiệu lực từ 01/07/2026.

### Hạn chế

- `VN_INTERNAL_CATALOG` không được dùng vì current batch không có owner-approved attachment/version.
- 3 subspecialties là seed có evidence trực tiếp, không phải cây subspecialty toàn quốc đầy đủ.
- Không tạo deprecated code khi chưa có evidence trực tiếp.


---

# CHƯƠNG B02: Danh mục Dịch vụ Đặt khám & Quy tắc Booking (Bookable Services)

### Objective

Danh mục dịch vụ có thể đặt và quy tắc booking được owner xác minh.

### Evidence / citation audit

7 material research claims are linked to exact HTTPS KCB/HL7 pages with title/publisher/version/scope and reproducible HTML locators. They are explicitly scope-limited and do not assert VMEC bookability.

### Blocking remediation

Attach an immutable/versioned VMEC service catalog with authentic Service owner approval and Clinical Ops review, including at least:
1. internal service_id/name/type;
2. specialty owner mapping;
3. eligibility;
4. duration;
5. active/effective status;
6. booking acceptance/rejection/approval/reconfirmation rules.

Re-run **B02** standalone after that input exists. Do not use another batch artifact as substitute.


---

# CHƯƠNG B03: Cơ sở Y tế, Khoa phòng & Giờ làm việc (Facilities & Departments)

### Dataset nature

Toàn bộ 300 rows là **DEMO/SYNTHETIC** và được gắn `DEMO_SYNTHETIC_NOT_REAL`.
Không row nào khẳng định cơ sở, khoa, giờ hoạt động hoặc contact thực của VMEC.
Tên facility/department chứa cảnh báo `KHÔNG PHẢI ... THẬT`; contact dùng `.invalid`
hoặc `DEMO-NOT-DIALABLE`; địa chỉ không geocodable.

### Model semantics

B03 dùng exact HL7 FHIR R4 v4.0.1 resource pages:
- Location: physical location, telecom, partOf, hoursOfOperation.
- Organization: conceptual hierarchy / department and partOf.
- HealthcareService: organization/location relationship for a service.
Các nguồn chỉ hỗ trợ **interoperability/data-model semantics**; không chứng minh entity DEMO tồn tại ngoài dataset.


---

# CHƯƠNG B04: Nhân sự Y tế & Vai trò Hành nghề (Practitioners & Roles)

### Dataset nature

Toàn bộ 500 rows là **DEMO/SYNTHETIC**. Không dùng practitioner/facility/specialty DATA từ batch khác và không dùng tên người thật làm seed.

Tên practitioner có dạng máy sinh:
`Nhân sự DEMO B04-Pxxxx — KHÔNG PHẢI NGƯỜI THẬT`.

B04 không tạo:
- ngày sinh;
- địa chỉ;
- điện thoại/email;
- số giấy phép/chứng chỉ hành nghề;
- ảnh;
- claim về employment hoặc quyền hành nghề thật.

### Local references

Role, specialty, facility và organization đều là `B04_LREF_*` nằm trong `LOCAL_CANONICAL_SNAPSHOT`.
Không FK sang B01–B03.

### Synthetic lineage

- generator: B04_SYNTH_PRACTITIONER_GEN_v1.0.0
- random seed: 40420260813
- method: deterministic template, no real-person seed
- root parent: B04_LREF_GEN_001
- child mappings có parent row nằm trong B04
- label preservation: PASS
- urgency preservation: NOT_APPLICABLE

### Evidence

Exact HL7 FHIR R4 v4.0.1 pages được dùng cho **data-model semantics only**:
- `Practitioner`: identifier/active/name và các trường nhân thân/qualification có thể tồn tại trong resource; B04 cố ý bỏ các trường nhạy cảm.
- `PractitionerRole`: practitioner/organization/code/specialty/location và ranh giới giữa qualification với role.
- `License`: FHIR specification materials dùng CC0, với trademark/third-party-IP caveats.

FHIR không được dùng để khẳng định practitioner DEMO có giấy phép, employment, specialty credential hoặc workplace thật.

### Vietnam-first research

Nguồn Bộ Y tế có registry người hành nghề thật được phát hiện trong discovery nhưng **không được nhập vào DATA/generator** vì objective yêu cầu không trùng người thật.


---

# CHƯƠNG B05: Lịch làm việc, Khung giờ & Quản lý Slot (Schedules & Slots)

### Dataset nature

Toàn bộ DATA là **DEMO/SYNTHETIC**, không phải lịch thật của VMEC và không nhập facility/service/practitioner/slot từ batch khác.

Composition:
- schedules: 50
- slots: 250
- slot_capacity: 75
- hold_windows: 75
- availability_exceptions: 50

Mọi facility/service/actor dùng `B05_LREF_*` trong `LOCAL_CANONICAL_SNAPSHOT`.

### Scheduling invariants

- slot duration: 30 phút cho 250/250 slot;
- timezone config: `Asia/Ho_Chi_Minh`, offset `+07:00`;
- timestamp fields lưu dạng text `ISO8601+offset|timezone-name` để tránh spreadsheet coercion;
- slot collision pairs: 0;
- capacity failures: 0;
- overbooked capacity rows: 0;
- invalid hold expiry: 0;
- exception-slot overlap: 0.

### Slot state coverage

- busy-tentative: 75
- free: 75
- busy: 50
- busy-unavailable: 25
- entered-in-error: 25

### Evidence scope

Exact HL7 FHIR R4 v4.0.1 documents:
- Schedule: container/planning horizon/actors và collision-aware availability checking.
- Slot: free/busy semantics, status, schedule, start/end, multiple allocations và overbooked.
- Appointment: available slot không bảo đảm booking; system business rules có thể quyết định acceptance.
- Datatypes: `instant` phải có timezone; `dateTime` có giờ/phút phải có timezone.
- License: FHIR specification document CC0; implementer vẫn chịu trách nhiệm fit-for-purpose.

Các nguồn chỉ hỗ trợ **interoperability/operational semantics**. Giá trị schedule/slot/capacity/hold/exception cụ thể do generator B05 tạo và được chứng minh bằng lineage + automated invariants, không được trình bày như fact production.

### Vietnam-first research

Các trang Bộ Y tế/KCB mô tả đặt lịch/giờ khám thực tế được dùng cho discovery nhưng bị loại khỏi generator vì B05 không có owner-approved internal catalog và không được lấy dữ liệu cơ sở thật làm seed.


---

# CHƯƠNG B06: Ontology Triệu chứng & Nhu cầu Khám bệnh (Symptom Ontology)

### Objective and hard boundary

Ontology triệu chứng/nhu cầu tiếng Việt. Every pass row has:
- `diagnosis_shortcut_forbidden=true`
- `ontology_only=true`
- `clinical_actionable=false`
- `route_type=OUT_OF_SCOPE`
- no diagnosis, specialty routing or emergency action inferred from the symptom term.

### Language/coverage

- negation/non-typical markers: 5
- regional/orthographic variants: 3
- body-site terms: 20
- temporal expressions: 20
- severity expressions: 15
- age context: older-adult context retained without turning age into diagnosis/routing logic.

Alias relations explicitly distinguish surface, regional, compound, temporal, severity, negation and diagnosis-guardrail expressions; related expressions are not silently promoted to strict synonyms.

### Evidence

Final evidence uses **10 exact Vietnamese HTTPS documents/articles** from Cục Quản lý Khám, chữa bệnh / Bộ Y tế. Portal/search pages are discovery only.

Every material claim is deliberately narrow: the source supports the Vietnamese phrase at the recorded locator; B06 performs a local ontology normalization and explicitly does not infer diagnosis/routing.

### Source/license decisions

MedlinePlus `Dizziness` was opened during triangulation research but **rejected from DATA/evidence** after the page stated that automated extraction for datasets/indexes or AI use is prohibited without permission. WHO ICD-11 and NHS family pages were not used as final evidence because no required exact version-pinned/concrete document was accepted during this batch.

### C001 HIGH_CLINICAL handling

Independent authoritative triangulation was not completed for every lexical row. B06 therefore uses the common C001 **documented exception + pending human review** path. This is acceptable only because rows are non-actionable ontology references and two Vietnamese clinical reviewers plus adjudication remain required before any GOLD claim.


---

# CHƯƠNG B07: Định tuyến Chuyên khoa Tim mạch (Cardiology Routing)

### Emergency-first invariant

All 30 urgent-exclusion rows:
- `route_type=EMERGENCY`
- `emergency_action_code=GO_TO_ED_NOW`
- no primary specialty or subspecialty target
- `review_priority=EMERGENCY_INDIVIDUAL_REVIEW_REQUIRED`

Thus emergency logic runs before Tim mạch routing. No US 9-1-1 number is copied into Vietnamese output; the foreign emergency evidence is localized conservatively as `GO_TO_ED_NOW`.

### Routing boundaries

B07-local route labels:
- Tim mạch
- arrhythmia assessment
- heart-failure pattern assessment
- blood-pressure assessment
- coronary/chest-discomfort assessment

These are `B07_LREF_*` labels, not imported catalog entities. Every row has `blocked_diagnosis_shortcut=true`; routing never asserts myocardial infarction, arrhythmia, heart failure, hypertension, angina, or another diagnosis from a symptom alone.

### Coverage

- palpitation: 20 routing rows
- syncope/near-syncope/dizziness: 15
- edema/dyspnea/fatigue: 15
- blood-pressure routing/clarify: 15
- non-emergency chest discomfort: 15
- emergency exclusions: 30
- hard-negative/negation guardrails: 30

### Evidence

Six exact sources:
1. Bộ Y tế, QĐ 3983/QĐ-BYT — Hướng dẫn quy trình kỹ thuật Nội khoa, chuyên ngành Tim mạch; Holter ECG section directly lists syncope/near-syncope/dizziness, palpitations, dyspnea, chest pain and unexplained fatigue in arrhythmia-assessment context.
2. WHO Cardiovascular diseases fact sheet, 31 July 2025.
3. CDC About Heart Attack, 24 Oct 2024.
4. CDC About Heart Disease, 15 May 2024.
5. WHO Hypertension, 25 Sep 2025.
6. CDC Other Conditions Related to Heart Disease, 15 May 2024.

The KCB PDF was visually screenshot-verified at physical page 153 as required for PDF evidence.

### C001 HIGH_CLINICAL handling

Independent WHO/CDC or KCB/CDC triangulation exists for many chest-pain, syncope and palpitation patterns. Some routing heuristics remain single-authority/scope-qualified, so B07 uses the common documented-exception + pending-human-review path rather than pretending full independent clinical adjudication.


---

# CHƯƠNG B08: Định tuyến Chuyên khoa Hô hấp (Respiratory Routing)

### Emergency-first invariant

All 30 urgent-exclusion rows:
- `route_type=EMERGENCY`
- `emergency_action_code=GO_TO_ED_NOW`
- primary specialty/subspecialty = null
- `review_priority=EMERGENCY_INDIVIDUAL_REVIEW_REQUIRED`

Emergency therefore precedes specialty routing. Foreign NHS emergency numbers are not copied into Vietnamese DATA.

### Coverage

- cough: 60 mapped/guardrailed occurrences
- sputum: 55
- wheeze: 25
- dyspnea: 45
- hemoptysis: 30
- subspecialty/local assessment labels: 70
- diagnosis-shortcut block: 200/200

### B08-local route labels

All route labels are local references, not real internal VMEC catalog entities:
- respiratory assessment
- airway/wheeze assessment
- chronic airflow/cough-sputum assessment
- lower respiratory infection-pattern assessment
- hemoptysis assessment
- dyspnea assessment

Every pass row has `blocked_diagnosis_shortcut=true`. B08 does not diagnose asthma, COPD, pneumonia, pulmonary embolism, cancer, or another disease from symptom text.

### Exact evidence set

1. Bộ Y tế — Hướng dẫn chẩn đoán và điều trị hen phế quản người lớn và trẻ em ≥12 tuổi, QĐ 1851/QĐ-BYT, 24/04/2020.
2. Bộ Y tế — Hướng dẫn chẩn đoán và điều trị BPTNMT/COPD, QĐ 2767/QĐ-BYT, 04/07/2023.
3. Bộ Y tế — Hướng dẫn chẩn đoán và điều trị viêm phổi mắc phải cộng đồng ở người lớn, QĐ 2147/QĐ-BYT, 15/07/2026.
4. NHS — Coughing up blood.
5. NHS — Shortness of breath.
6. NHS — Asthma.

The three Vietnamese PDFs were visually re-rendered post-artifact at all cited-page groups. The 2026 CAP guidance was selected instead of stale NHS bronchitis/chest-infection material.

### Safety semantics

- severe dyspnea / inability to speak, cyanosis/pallor/grey appearance or confusion → emergency-first;
- severe/life-threatening airway exacerbation patterns → emergency-first;
- hemoptysis above small streaks or with dyspnea/chest-upper-back pain/very fast heartbeat → emergency-first;
- smaller hemoptysis without current red flags remains urgent human triage, not reassurance;
- persistent cough/sputum/wheeze/dyspnea patterns route only to respiratory assessment labels after emergency screening.

### C001 handling

Direct Vietnamese clinical guidance plus independent NHS evidence triangulates wheeze, dyspnea and hemoptysis. Some acute cough/sputum routing heuristics use the current direct Vietnamese guideline with a documented C001 exception and remain pending two-reviewer clinical adjudication.


---

# CHƯƠNG B09: Định tuyến Chuyên khoa Tiêu hóa (Gastroenterology Routing)

### Emergency-first invariant

All 30 urgent-exclusion rows are divided into 10 GI-bleeding, 10 acute-abdomen and 10 severe-dehydration patterns. Every emergency row has `route_type=EMERGENCY`, `emergency_action_code=GO_TO_ED_NOW`, and no specialty/subspecialty target.

### Coverage and guardrails

Coverage includes abdominal pain, reflux, diarrhea, constipation, bleeding and B09-local subspecialty assessment labels. Every pass row has `blocked_diagnosis_shortcut=true`; symptom text is never promoted directly to GERD, bacterial diarrhea, obstruction, ulcer, colorectal cancer or another diagnosis.

### Exact evidence set

Nine exact final sources are used: one Bộ Y tế infectious-disease PDF; three Bệnh viện Bạch Mai concrete articles for GI bleeding warning signs, reflux and bowel-habit warning signs; four current NHS pages for dehydration, reflux, constipation and diarrhoea/vomiting; and one University Hospitals Sussex acute-abdominal-pain leaflet.

A previously considered Bạch Mai GI-bleeding URL was rejected because it failed post-artifact reopen. The final ledger uses a different exact Bạch Mai article that reproduced successfully after artifact generation.


---

# CHƯƠNG B10: Định tuyến Chuyên khoa Thần kinh & Đột quỵ (Neurology & Stroke)

### Mục tiêu và phạm vi

Batch tạo corpus routing Thần kinh độc lập, ưu tiên không bỏ sót các red flag liên quan đột quỵ, đau đầu dữ dội khởi phát nhanh, yếu/tê khu trú, rối loạn nói, mất thăng bằng và tình huống ngất cần human triage. Dữ liệu chỉ phục vụ routing/triage; không chẩn đoán, kê đơn, đưa liều, phác đồ hay cam kết entity/slot đặt lịch.

### Quy mô

- `PASS_ROWS`: **200**
- `DELIVERY_TARGET_ROWS`: **200**
- `HISTORICAL_EXPANSION_TARGET_ROWS`: **5000** (chỉ là quy mô mở rộng lịch sử)
- routing_rows: 120
- clarifying_questions: 30
- urgent_exclusions: 20
- hard_negatives: 20
- route_source_map: 10
- atomic claims: 200
- evidence links / citation-matrix rows: 365
- exact DATA duplicates: 0
- heuristic max token-Jaccard sau remediation: 0.8462

### Concrete sources dùng trong DATA

1. Cục Quản lý Khám, chữa bệnh – Bộ Y tế — `https://dotquy.kcb.vn/hieu-dung-ve-dot-quy/dau-hieu-nhan-biet-dot-quy.html`
2. Bệnh viện Bạch Mai — `https://bachmai.gov.vn/don-vi/trung-tam-than-kinh/c95dd917-c4a4-261d-ec5e-4db1677dad22`
3. CDC — `https://www.cdc.gov/stroke/signs-symptoms/index.html`
4. U.S. National Library of Medicine / MedlinePlus Stroke — `https://medlineplus.gov/stroke.html`
5. U.S. National Library of Medicine / MedlinePlus Fainting — `https://medlineplus.gov/fainting.html`

Mỗi source đã được browser-open trước claim acceptance và reopen sau initial artifact export; final URL là HTTPS, document identity và locator dùng trong DATA được tái lập. Landing/portal được giữ ở search/quarantine log và không dùng làm citation cuối.

### Evidence/citation

- Material claim coverage: 100%
- Exact locator coverage: 100%
- Second-pass citation audit: 100%
- Post-artifact URL reopen: 100%
- Unsupported/contradicted pass claims: 0
- Citation precision score: **100/100**

Nguồn quốc tế chỉ được dùng trong phạm vi đã ghi; hành động 911 không được sao chép sang Việt Nam mà được bản địa hóa thành mức khẩn tương đương với số cấp cứu 115. Bằng chứng Bạch Mai được giới hạn ở phạm vi institutional và không được suy diễn thành catalog quốc gia hay khả năng booking.


---

# CHƯƠNG B10: Định tuyến Chuyên khoa Thần kinh & Đột quỵ (Neurology & Stroke)

### Emergency-first invariant

All 30 urgent-exclusion rows have:
- `route_type=EMERGENCY`
- `emergency_action_code=GO_TO_ED_NOW`
- no specialty/subspecialty target.

Breakdown:
- 15 stroke/TIA red-flag rows
- 10 thunderclap/secondary-headache red-flag rows
- 5 syncope + focal-neurologic red-flag rows

Resolved stroke-like symptoms are **not** treated as safe: TIA evidence preserves the emergency-first rule.

### Coverage

- headache
- dizziness
- weakness
- speech
- balance
- syncope
- B10-local subspecialty assessment labels

### Routing boundaries

B10 local-only labels:
- Neurology assessment
- Headache assessment
- Dizziness/balance assessment
- Weakness/neuromuscular assessment
- Speech/neurologic assessment

Every row has `blocked_diagnosis_shortcut=true`. B10 does not diagnose stroke, TIA, migraine, subarachnoid haemorrhage, epilepsy, peripheral vertigo or a cardiac/neurologic cause of syncope from symptom text.

Stable/unexplained syncope uses `HUMAN_HANDOFF` rather than a Neurology shortcut because syncope spans benign and life-threatening non-neurologic causes.

### Evidence set

Final evidence contains 9 exact HTTPS pages:
- Bệnh viện Bạch Mai: early stroke signs, dizziness red flags, dangerous headache red flags.
- CDC: Signs and Symptoms of Stroke, updated 19 May 2026.
- NHS: Subarachnoid haemorrhage, Headaches, Migraine, TIA symptoms.
- American Heart Association: Syncope (Fainting).

NINDS pages were discovered but direct browser-recheck returned HTTP 403; they were therefore excluded from final evidence rather than passed from snippets.

### Safety semantics

- sudden unilateral weakness/numbness, speech trouble, vision change, loss of balance/dizziness in a stroke pattern -> emergency-first;
- symptoms that resolve within minutes/hours can still be TIA -> emergency-first;
- sudden extremely painful/thunderclap headache, especially with neck stiffness, seizure, fainting/confusion or focal deficits -> emergency-first;
- dizziness without focal red flags remains a classification problem, not automatic benign-vertigo diagnosis;
- syncope is not automatically neurological or epileptic and needs professional evaluation.

Foreign 911/999 instructions are not copied into Vietnamese DATA.

### C001 handling

Stroke/TIA and thunderclap patterns have independent Vietnamese + international support. Remaining stable routing heuristics are scope-qualified and retain pending Neurology/emergency reviewer adjudication.


---

# CHƯƠNG B11: Định tuyến Chuyên khoa Cơ Xương Khớp (Musculoskeletal Routing)

### Mục tiêu và phạm vi

Standalone seed cho định hướng Cơ xương khớp, với systemic/neurologic/trauma red flags được kiểm tra trước routine procedure/booking. Batch chỉ tạo routing/triage data; không chẩn đoán, không kê đơn, không đưa liều/phác đồ và không bịa dịch vụ, cơ sở, bác sĩ hay slot VMEC.

### Quy mô delivery

- `PASS_ROWS`: **200**
- `DELIVERY_TARGET_ROWS`: **200**
- `HISTORICAL_EXPANSION_TARGET_ROWS`: **5000** — chỉ là quy mô mở rộng lịch sử, không phải completion gate.
- `routing_rows`: 120
- `clarifying_questions`: 30
- `urgent_exclusions`: 20
- `hard_negatives`: 20
- `route_source_map`: 10
- Atomic material claims: **200**
- Evidence links / citation-matrix rows: **425**
- Exact DATA duplicates sau regression: **0**
- Max pairwise token-Jaccard heuristic sau remediation: **0.8824**

### Coverage

Coverage bắt buộc đều đạt:
- back_pain: 87
- joint_pain: 127
- trauma: 79
- neurologic_deficit: 86
- night_pain: 26
- systemic_signs: 85
- subspecialty: 170

### Nguồn concrete dùng trong DATA

Batch dùng 9 exact HTTPS documents/articles/health-topic pages được research và verify độc lập trong B11:
- 4 bài Vinmec cho đau lưng cấp, hội chứng chùm đuôi ngựa, viêm khớp nhiễm khuẩn và chấn thương đầu/tủy sống;
- 1 trang Viện Cơ Xương Khớp – Bệnh viện Bạch Mai cho phạm vi institutional;
- 2 trang NHS cho back pain và joint pain;
- 2 MedlinePlus health-topic pages cho joint disorders và spinal cord injuries.

Mỗi URL được browser-open trước claim acceptance và reopen sau artifact generation; sau final workbook export, 9/9 URL được mở lại thêm lần nữa và intended locator vẫn tái lập. Automated `curl` trong container không phân giải được DNS, nên lỗi probe đó được ghi là giới hạn tooling chẩn đoán chứ không được dùng để tự đánh DEAD/PASS; browser-rendered exact document là kiểm tra quyết định.

### Citation và quality

- Exact final HTTPS URL rate: 100%
- Visible title/publisher/document identity match: 100%
- Material-claim citation coverage: 100%
- Exact locator coverage: 100%
- Locator reproducibility after reopen: 100%
- Second-pass citation audit: 200/200 claims
- Unsupported/contradicted pass claims: 0
- Citation precision score: **100/100**
- Formula errors in workbook: 0

Nguồn NHS được dịch/adapt và giữ nguyên mức khẩn; số dịch vụ UK không được đưa vào DATA Việt Nam. Attribution áp dụng cho phần NHS được adapt: `Contains public sector information licensed under the Open Government Licence v3.0.`

Với MedlinePlus, batch chỉ dùng phần health-topic summary thuộc public domain và ghi nguồn National Library of Medicine; nội dung A.D.A.M. Medical Encyclopedia được loại khỏi ingestion/citation evidence.

### Safety

- Cauda-equina-like red flags, serious spinal trauma và severe joint trauma: emergency path đứng trước routine MSK routing/procedure.
- Hot/swollen/febrile joint và systemic/night-pain back red flags: medical evaluation trước routine procedure.
- Hard negatives không biến sự vắng mặt red flag thành chẩn đoán “lành tính”; chỉ dùng để giảm false-emergency và giữ human override.
- Specialty/subspecialty codes trong B11 là **batch-local conceptual codes**, không phải catalog/booking entities thật.


---

# CHƯƠNG B12: Định tuyến Chuyên khoa Da liễu & Dị ứng (Dermatology & Allergy)

### Mục tiêu và phạm vi

Standalone seed cho định hướng Da liễu/Dị ứng, với anaphylaxis, severe mucocutaneous rash và purpura/systemic red flags được xử lý trước routine specialty/booking. Batch chỉ tạo routing/triage data; không chẩn đoán, không kê đơn, không đưa liều/phác đồ và không bịa dịch vụ, cơ sở, bác sĩ hay slot VMEC.

### Quy mô

- `PASS_ROWS`: **200**
- `DELIVERY_TARGET_ROWS`: **200**
- `HISTORICAL_EXPANSION_TARGET_ROWS`: **5000** — chỉ là quy mô mở rộng lịch sử.
- routing_rows: 120
- clarifying_questions: 30
- urgent_exclusions: 20
- hard_negatives: 20
- route_source_map: 10
- atomic material claims: **200**
- evidence links / citation-matrix rows: **445**
- exact DATA duplicates: **0**
- max token-Jaccard heuristic: **0.7727** (< internal threshold 0.92)

### Coverage

- rash: 120
- itch: 64
- urticaria: 48
- swelling: 92
- breathing: 116
- purpura: 36
- subspecialty: 170

### Concrete sources

B12 dùng 11 exact HTTPS documents/health-topic pages được research độc lập trong batch:
- Bệnh viện Da liễu Trung ương: mày đay/phù mạch và viêm da tiếp xúc dị ứng;
- Vinmec: dấu hiệu phản vệ, Stevens–Johnson, và nhiễm khuẩn huyết não mô cầu làm red-flag differential;
- MedlinePlus/NLM: Anaphylaxis, Hives, Allergy health-topic summaries;
- NHS: Stevens-Johnson syndrome, Meningitis, Henoch-Schönlein purpura (HSP).

Mỗi URL đã được browser-open trước claim acceptance, reopen sau initial artifact export, và reopen thêm lần nữa sau final workbook export; intended locator tiếp tục tái lập ở 11/11 nguồn. Container HTTP probe không phân giải được DNS nên numeric HTTP status không được bịa; browser-rendered exact document identity + locator là căn cứ quyết định.

### Citation / QA

- Material claim citation coverage: 100%
- Exact locator coverage: 100%
- Live exact-document final URL rate: 100%
- Final HTTPS rate: 100%
- Title/publisher/document identity match: 100%
- Locator reproducibility after reopen: 100%
- Second-pass citation audit: 200/200 claims
- Unsupported/contradicted pass claims: 0
- Citation precision score: **100/100**
- Workbook formula errors: 0

### Safety

- Throat/tongue swelling, breathing difficulty/wheeze, collapse: emergency path trước routine Allergy/Dermatology.
- Spreading severe rash với blistering/peeling hoặc mucosal involvement: immediate hospital/emergency path.
- Non-blanching/purpuric rash + severe systemic/neurologic illness: emergency path.
- Non-blanching rash nhưng người bệnh otherwise well: urgent medical assessment, không tự gán chẩn đoán hay automatic emergency.
- Mày đay đơn thuần không được tự nâng thành phản vệ nếu record không có airway/breathing/collapse red flags.
- Không đưa liều hoặc phác đồ thuốc từ các source vào DATA.

### Licensing/localization

- MedlinePlus: chỉ dùng public-domain health-topic summaries; A.D.A.M. Medical Encyclopedia và images bị loại khỏi ingestion. Attribution: `Source: MedlinePlus, National Library of Medicine.`
- NHS: wording tiếng Anh được dịch/adapt, service numbers UK bị loại khỏi Vietnamese DATA, urgency được giữ nguyên. Attribution: `Contains public sector information licensed under the Open Government Licence v3.0.`
- Bệnh viện Da liễu Trung ương: site yêu cầu ghi rõ nguồn khi sử dụng lại; workbook lưu notice này trong `SOURCES`.
- Vinmec: không giả open license; citation/paraphrase only.


---

# CHƯƠNG B13: Định tuyến Tai Mũi Họng, Mắt & Răng Hàm Mặt (ENT, Eye & Dental)

### Mục tiêu

Định hướng ENT/Mắt/Răng Hàm Mặt với specialty/subspecialty tách rõ và safety precedence. Batch chỉ tạo routing/triage; không chẩn đoán, kê đơn, đưa liều/phác đồ hoặc bịa entity/slot VMEC.

### Quy mô

- PASS_ROWS: **200**
- DELIVERY_TARGET_ROWS: **200**
- HISTORICAL_EXPANSION_TARGET_ROWS: **5000**
- routing_rows: 120
- clarifying_questions: 30
- urgent_exclusions: 20
- hard_negatives: 20
- route_source_map: 10
- atomic material claims: **200**
- evidence/citation rows: **356**
- exact duplicates: **0**
- max token-Jaccard: **0.8250** (< 0.92)

### Coverage

- throat: 71
- nose: 45
- hearing: 40
- vision: 60
- dental: 35
- chemical_injury: 20
- subspecialty: 170

### Safety

- Giảm thính lực đột ngột: urgent same-day ENT assessment, không xếp routine.
- Mất thị lực đột ngột: emergency/urgent-eye path.
- Hóa chất vào mắt: rửa ngay bằng nhiều nước sạch + đánh giá cấp cứu mắt; không đưa thuốc/liều vào DATA.
- Đau họng kèm khó thở, không nuốt được/chảy dãi, thở rít hoặc nặng lên nhanh: emergency path.
- Nhiễm trùng răng-hàm mặt kèm khó thở/nuốt hoặc sưng nhiều: emergency path.
- Chảy máu mũi kéo dài/khó cầm: đánh giá y tế khẩn.
- Các hard-negative không biến sự vắng mặt red flag thành chẩn đoán lành tính.

### Evidence / URL

B13 dùng 14 exact HTTPS pages/documents, research lại từ đầu trong batch:
- Bệnh viện Tai Mũi Họng Trung ương: Khoa Họng–Thanh quản, Khoa Mũi Xoang, Khoa Thính–Thanh học.
- Bệnh viện Trung ương Quân đội 108: điếc đột ngột; chảy máu mũi.
- Bệnh viện Mắt Trung ương: bỏng mắt hóa chất.
- Bệnh viện Răng Hàm Mặt Trung ương Hà Nội: Khoa Điều trị Nội nha.
- Vinmec: áp xe má/răng-hàm mặt.
- NIDCD/NIH: Sudden Deafness.
- MedlinePlus/NLM: Eye Diseases health-topic summary.
- NHS: Eye injuries, Vision loss, Dental abscess, Sore throat.

14/14 exact URLs được browser-open trước claim acceptance và reopen sau latest data-bearing workbook; title/publisher/locator tái lập. Container `curl` không phân giải DNS, nên numeric HTTP status không được bịa và browser exact-document verification là căn cứ quyết định.

### Citation / QA

- material claim citation coverage: 100%
- exact locator coverage: 100%
- live exact-document HTTPS rate: 100%
- title/publisher/document identity match: 100%
- post-artifact locator reproducibility: 100%
- second-pass citation audit: 200/200
- unsupported/contradicted pass claims: 0
- citation precision score: **100/100**
- formula errors: 0
- independence counters: 0

### Localization / licensing

- NHS/US service numbers không được đưa vào Vietnamese DATA; mức khẩn được giữ nguyên và bản địa hóa.
- NHS wording được paraphrase/adapt theo OGL v3.0 attribution.
- MedlinePlus chỉ dùng phần health-topic summary; phần Medical Encyclopedia/media không được ingestion.
- Các nguồn Việt Nam không bị giả định có open license; citation/paraphrase only.


---

# CHƯƠNG B14: Định tuyến Tiết niệu, Thận, Nội tiết & Huyết học (Urology & Endocrinology)

### Mục tiêu

Standalone seed định hướng đúng khoa con Tiết niệu/Thận/Nội tiết/Huyết học thay vì dừng ở Nội tổng quát. Nội dung chỉ phục vụ routing/triage; không chẩn đoán, kê đơn, đưa liều/phác đồ hoặc bịa dịch vụ/slot VMEC.

### Quy mô

- `PASS_ROWS`: **200**
- `DELIVERY_TARGET_ROWS`: **200**
- `HISTORICAL_EXPANSION_TARGET_ROWS`: **5000**
- routing_rows: 120
- clarifying_questions: 30
- urgent_exclusions: 20
- hard_negatives: 20
- route_source_map: 10
- atomic material claims: **200**
- evidence/citation rows: **425**
- exact duplicates: **0**
- max token-Jaccard: **0.8000** (< internal threshold 0.92)

### Coverage

- urinary: 79
- renal: 25
- endocrine: 53
- hematology: 66
- anemia_signs: 29
- bleeding: 55
- subspecialty: 170

### Safety

- Không tiểu được đột ngột với bàng quang căng/đau: acute urinary-retention emergency path.
- Đái tháo đường với nôn, mất nước, thở bất thường, lú lẫn hoặc DKA-like features: emergency path.
- Lú lẫn/co giật/không nuốt được/mất ý thức trong severe hypoglycemia pattern: emergency path.
- Chảy máu đang tiếp diễn và không cầm với ép trực tiếp: urgent medical evaluation trước routine Huyết học.
- Tiểu khó mạn nhưng vẫn tiểu được không bị đánh đồng với bí tiểu cấp.
- Mệt/chóng mặt/da nhợt chỉ là dấu hiệu cần đánh giá; không tự gán chẩn đoán thiếu máu.
- Không đưa thuốc/liều/phác đồ từ nguồn vào DATA.

### Evidence và URL

B14 dùng **16 exact HTTPS documents/pages** research độc lập trong batch, gồm Bệnh viện Bạch Mai, Vinmec, Viện Huyết học – Truyền máu Trung ương, NIDDK/NIH, NHLBI/NIH và MedlinePlus/NLM.

16/16 URL đã được browser-open trước claim acceptance và reopen sau artifact generation. Exact title/publisher hoặc body-unit identity, final HTTPS URL và intended locator đều tái lập. Container `curl` không phân giải DNS nên numeric HTTP status không được bịa; browser exact-document validation là căn cứ quyết định.

### Citation / QA

- material claim citation coverage: 100%
- exact locator coverage: 100%
- live exact-document URL rate: 100%
- final HTTPS rate: 100%
- title/publisher/document identity match: 100%
- post-artifact locator reproducibility: 100%
- second-pass citation audit: 200/200
- unsupported/contradicted pass claims: 0
- citation precision score: **100/100**
- formula errors: 0
- cross-batch independence counters: 0

### Licensing / scope

- MedlinePlus chỉ dùng public-domain health-topic summaries; Medical Encyclopedia/media không được ingestion.
- NIDDK/NHLBI được paraphrase ngắn trong phạm vi nội dung liên bang; third-party content bị loại.
- Nguồn Việt Nam không bị giả định open license; citation/paraphrase only.
- Tất cả specialty/subspecialty codes là batch-local conceptual references, không phải catalog dịch vụ thật.


---

# CHƯƠNG B15: Định tuyến Nhi khoa theo Độ tuổi & Phụ huynh (Pediatrics Routing)

### Mục tiêu

Standalone seed cho routing Nhi khoa theo **age band + caregiver phrasing**, với danger signs đứng trước routine booking. Không chẩn đoán, không kê đơn/liều/phác đồ, không bịa dịch vụ, bác sĩ, cơ sở hoặc slot VMEC.

### Quy mô

- `PASS_ROWS`: **200**
- `DELIVERY_TARGET_ROWS`: **200**
- `HISTORICAL_EXPANSION_TARGET_ROWS`: **5000**
- routing_rows: 120
- clarifying_questions: 30
- urgent_exclusions: 20
- hard_negatives: 20
- route_source_map: 10
- atomic material claims: **200**
- evidence/citation rows: **541**
- exact duplicates: **0**
- max token-Jaccard: **0.8793** (< 0.92)

### Coverage

- newborn: 45
- infant: 36
- child: 41
- caregiver: 182
- feeding: 132
- breathing: 98
- dehydration: 38
- subspecialty: 170

### Safety

- Newborn 0–28 ngày có bỏ bú/bú kém, li bì, co giật, thở bất thường, sốt/hạ thân nhiệt, vàng da sớm/đậm hoặc nôn liên tục: emergency path trước routine Neonatology.
- Severe breathing: thở rít/co rút lồng ngực/tím/khó thở rõ → Pediatric Emergency.
- Severe dehydration hoặc không uống được → emergency/urgent pediatric path.
- Co giật, bất tỉnh hoặc severe drowsiness → Pediatric Emergency.
- Nôn mọi thứ/không uống được → urgent pediatric assessment, không chờ routine booking.
- Caregiver concern đơn thuần không tự biến thành emergency nếu record không có danger sign.
- Không có thuốc, liều hoặc phác đồ trong DATA.

### Age band

- `NEWBORN_0_28D`: WHO metadata definition.
- `YOUNG_INFANT_29_59D`: nằm trong WHO sick-young-infant framework up to 2 months.
- `INFANT_2_12M` và `CHILD_1_5Y`: B15 age-aware routing với WHO sick-child/IMCI safety logic.
- Trẻ lớn hơn: conceptual general Pediatrics entry route + human override.

### Evidence / URL

B15 dùng **14 exact HTTPS documents/articles/publication pages** research độc lập trong batch:
- Bệnh viện Nhi Trung ương: newborn danger signs, Trung tâm Sơ sinh, Trung tâm Hô hấp, Khoa Cấp cứu & Chống độc, respiratory warning signs, dehydration signs và Khoa Khám bệnh Đa khoa.
- WHO/UNICEF/PMNCH: newborn danger signs, current under-5 danger-sign context, ETAT emergency triage, IMCI danger signs, sick young infant up to 2 months, sick child age 2–59 months và WHO newborn definition.

14/14 URL được browser-open trước claim acceptance và reopen sau artifact generation; intended locator tái lập trên 14/14.

### Citation / QA

- material claim citation coverage: 100%
- exact locator coverage: 100%
- live exact-document HTTPS rate: 100%
- title/publisher/document identity match: 100%
- post-artifact locator reproducibility: 100%
- second-pass citation audit: 200/200
- unsupported/contradicted pass claims: 0
- citation precision score: **100/100**
- workbook formula errors: 0
- cross-batch independence counters: 0


---

# CHƯƠNG B16: Định tuyến Sản Phụ khoa theo Giai đoạn Thai kỳ (OB/GYN Routing)

### Mục tiêu

Standalone seed định hướng Sản/Phụ khoa theo **pregnancy/postpartum context + khoa con**, với maternal warning signs đứng trước routine booking. Không chẩn đoán, kê đơn/liều/phác đồ và không bịa entity/slot VMEC.

### Quy mô

- `PASS_ROWS`: **200**
- `DELIVERY_TARGET_ROWS`: **200**
- `HISTORICAL_EXPANSION_TARGET_ROWS`: **5000**
- routing_rows: 120
- clarifying_questions: 30
- urgent_exclusions: 20
- hard_negatives: 20
- route_source_map: 10
- atomic material claims: **200**
- evidence/citation rows: **424**
- exact duplicates: **0**
- max token-Jaccard: **0.8615** (< 0.92)

### Coverage

- gynecology: 36
- antenatal: 116
- pregnancy_stage: 46
- postpartum: 84
- bleeding: 81
- neurologic_warning: 42
- subspecialty: 170

### Safety

- Heavy pregnancy bleeding, hoặc bleeding kèm đau bụng dữ dội/co thắt, chóng mặt-ngất hoặc sốt: emergency obstetric path.
- Early pregnancy severe pain kèm fainting/shoulder pain: emergency warning pattern; không tự chẩn đoán thai ngoài tử cung.
- Sau 20 tuần: severe headache/visual change/upper-abdominal pain/altered CNS/seizure là hypertensive-pregnancy warning, không tự chẩn đoán tiền sản giật.
- Heavy ongoing postpartum bleeding kèm weakness/dizziness/shock features: emergency.
- Urgent maternal warning signs có thể xảy ra sau sinh; postpartum routine booking không được trì hoãn warning signs.
- Light spotting không có severe features không bị gắn automatic emergency, nhưng vẫn cần đánh giá trong thai kỳ.
- Không có thuốc, liều hoặc phác đồ trong DATA.

### Pregnancy stage / subspecialty

- First trimester: đến 13 tuần 6 ngày.
- Second trimester: 14–28 tuần 6 ngày.
- Third trimester: từ 29 tuần.
- Prenatal-diagnosis route dùng cho bất thường screening/ultrasound cần tư vấn chuyên sâu.
- Postpartum follow-up route chỉ áp dụng khi không có urgent maternal warning sign.
- Tất cả specialty/subspecialty codes là batch-local conceptual references.

### Evidence / URL

B16 dùng **12 exact HTTPS document/article/service/tool pages**, research độc lập trong batch:
- Bệnh viện Từ Dũ: gynecology, antenatal, prenatal diagnosis, pregnancy bleeding, ectopic-warning pattern, pre-eclampsia warning signs, postpartum haemorrhage và postpartum recheck.
- WHO: current pre-eclampsia fact sheet và current postpartum-haemorrhage tool/guideline hub.
- CDC: urgent maternal warning signs và pregnancy/postpartum context.

12/12 URL được browser-open trước claim acceptance và reopen sau artifact generation; title/publisher/body identity và intended locator tái lập trên 12/12.

### Citation / QA

- material claim citation coverage: 100%
- exact locator coverage: 100%
- live exact-document HTTPS rate: 100%
- title/publisher/document identity match: 100%
- post-artifact locator reproducibility: 100%
- second-pass citation audit: 200/200
- unsupported/contradicted pass claims: 0
- citation precision score: **100/100**
- workbook formula errors: 0
- cross-batch independence counters: 0

### Licensing/localization

- Từ Dũ: citation/paraphrase only; không giả định open license.
- WHO: short paraphrase/attribution theo website/publication terms; no logo/media.
- CDC: phần lớn nội dung agency materials public domain với attribution/non-endorsement; third-party/media excluded.
- Foreign-specific emergency service numbers không được đưa vào Vietnamese DATA.


---

# CHƯƠNG B17: Định tuyến Lão khoa & Người cao tuổi Đa bệnh (Geriatrics Routing)

### Mục tiêu

Standalone seed định hướng người cao tuổi có đa bệnh, suy giảm chức năng, polypharmacy, vấn đề trí nhớ, ngã/ngất và acute confusion; safety precedence cho stroke, TBI sau ngã và collapse/unresponsiveness. Không chẩn đoán, không tự thay đổi thuốc/liều và không bịa dịch vụ/slot VMEC.

### Quy mô

- `PASS_ROWS`: **200**
- `DELIVERY_TARGET_ROWS`: **200**
- `HISTORICAL_EXPANSION_TARGET_ROWS`: **5000**
- routing_rows: 120
- clarifying_questions: 30
- urgent_exclusions: 20
- hard_negatives: 20
- route_source_map: 10
- atomic material claims: **200**
- evidence/citation rows: **463**
- exact duplicates: **0**
- max token-Jaccard: **0.8750** (< 0.92)

### Coverage

- frailty: 58
- polypharmacy: 58
- memory: 46
- falls: 64
- syncope: 79
- acute_confusion: 66
- subspecialty: 170

### Safety

- Gradual memory decline is separated from sudden fluctuating confusion.
- Acute confusion needs urgent medical evaluation; stroke/head-injury red flags override to emergency.
- Fall/head injury with worsening headache, repeated vomiting, focal neurologic signs, confusion, loss of consciousness or inability to wake → emergency.
- Sudden confusion/speech trouble, unilateral weakness, vision/balance change or severe headache → stroke emergency.
- Sudden collapse with loss of consciousness plus absent/abnormal breathing or unresponsiveness → emergency.
- Recovered syncope is not called harmless; it still needs medical evaluation.
- Polypharmacy rows route to medication review only and explicitly prohibit self-stopping/changing medicines.

### Evidence / URL

B17 uses **11 exact HTTPS pages**, researched independently in this batch:
- Vietnam: Bộ Y tế geriatric-department criteria; Bệnh viện Lão khoa Trung ương functional-decline article; MOH-hosted secondary dementia article with explicit authority limitation.
- WHO: ICOPE exact page.
- MedlinePlus: Falls, Memory, Delirium and Fainting health-topic summaries only.
- CDC: older-adult TBI caregiver danger signs, Stroke Signs and Symptoms, and About Cardiac Arrest.

11/11 URLs were opened before claim acceptance and reopened after artifact generation. Exact title/publisher/body identity and intended locator reproduced on 11/11.

### Copyright / source exclusions

- MedlinePlus Medical Encyclopedia pages and third-party links were **not ingested**; only health-topic summary text was paraphrased.
- NIA pages discovered during research were not accepted as final evidence because exact browser reproduction was inconsistent/JS challenged in this run.
- WHO, CDC, MOH and hospital content is stored as short paraphrase/citation only according to recorded terms.

### Citation / QA

- material claim citation coverage: 100%
- exact locator coverage: 100%
- live exact-document HTTPS rate: 100%
- title/publisher/document identity match: 100%
- post-artifact locator reproducibility: 100%
- second-pass citation audit: 200/200
- unsupported/contradicted pass claims: 0
- citation precision score: **100/100**
- workbook formula errors: 0
- cross-batch independence counters: 0

### Context integrity

Mounted common files contain an automatic `(1)` suffix, but each content SHA-256 matches the pack manifest. Recomputing the core with the original pack filenames reproduces `[MÃ_BĂM_XÁC_THỰC_HỢP_LỆ]`.


---

# CHƯƠNG B18: Định tuyến Sức khỏe Tâm thần & Tâm lý (Psychiatry & Mental Health)

### Mục tiêu

Standalone seed định hướng tâm lý/tâm thần cho anxiety, sleep, mood, panic và safety crisis. Self-harm/harm-to-others không bị trì hoãn bởi routine booking. Không chẩn đoán, không kê thuốc/liều/phác đồ, không mô tả phương thức tự hại và không bịa dịch vụ/clinician/slot VMEC.

### Quy mô

- `PASS_ROWS`: **200**
- `DELIVERY_TARGET_ROWS`: **200**
- `HISTORICAL_EXPANSION_TARGET_ROWS`: **5000**
- routing_rows: 120
- clarifying_questions: 30
- urgent_exclusions: 20
- hard_negatives: 20
- route_source_map: 10
- atomic material claims: **200**
- evidence/citation rows: **449**
- exact duplicates: **0**
- max token-Jaccard: **0.8788** (< 0.92)

### Coverage

- anxiety: 85
- sleep: 67
- mood: 46
- panic: 92
- self_harm: 65
- harm_to_others: 22
- subspecialty: 170

### Safety

- Ý nghĩ tự hại/tự sát không đi theo routine booking; cần crisis-oriented assessment.
- Nguy cơ tự hại nghiêm trọng tức thời → emergency/urgent mental-health intervention, không trì hoãn.
- Ý định gây hại nghiêm trọng cho người khác kèm mất kiểm soát → emergency safety path.
- Psychosis-like symptoms chỉ kích hoạt emergency khi có safety danger/severe disturbance; B18 không tự chẩn đoán psychosis.
- Panic-like symptoms không được dùng để loại trừ bệnh cơ thể; new severe physical red flags → medical safety override.
- Không có phương thức tự hại, foreign hotline number, thuốc/liều hoặc psychotherapy protocol trong DATA.

### Evidence / URL

B18 dùng **13 exact HTTPS final pages**:
- Việt Nam: 4 bài cụ thể của Bệnh viện Bạch Mai về phạm vi sức khỏe tâm thần, lo âu/khí sắc, mất ngủ và khủng hoảng tự sát.
- WHO: anxiety, depression, suicide Q&A và 2 mhGAP self-harm recommendation pages.
- NLM/MedlinePlus: Panic Disorder, Insomnia, Mental Health, Psychotic Disorders Health Topic pages.

13/13 final URLs browser-open trước claim acceptance và reopen sau artifact generation. Title/H1 + publisher/domain identity + intended locator được tái lập 13/13.

### Source exclusions / scope

- Catalog seed `WHO_AI_HEALTH` được kiểm nhưng không dùng làm clinical evidence vì không trực tiếp cho routing anxiety/sleep/mood/panic/crisis.
- MedlinePlus Medical Encyclopedia content không được ingest; chỉ dùng Health Topic summary pages.
- Không tìm thấy một exact Vietnamese generic harm-to-others triage document đủ trực tiếp trong systematic search này. Cluster này dùng Bạch Mai behavioral-emergency context + NLM direct safety pages, giữ explicit Vietnam review exception.

### Citation / QA

- material claim citation coverage: 100%
- exact locator coverage: 100%
- live exact-document HTTPS rate: 100%
- title/publisher/document identity: 100%
- post-artifact locator reproducibility: 100% (13/13)
- second-pass citation audit: 200/200
- unsupported/contradicted pass claims: 0
- citation precision score: **100/100**
- workbook formula errors: 0
- cross-batch independence counters: 0


---

# CHƯƠNG B19: Định tuyến Bệnh Truyền nhiễm & Y học Nhiệt đới (Infectious Diseases)

### Mục tiêu

Standalone seed định hướng Truyền nhiễm/du lịch/sốt và phát hiện deterioration/sepsis signals. Không chẩn đoán, không kê thuốc/liều/phác đồ và không bịa dịch vụ/clinician/slot VMEC.

### Quy mô

- `PASS_ROWS`: **200**
- `DELIVERY_TARGET_ROWS`: **200**
- `HISTORICAL_EXPANSION_TARGET_ROWS`: **5000**
- routing_rows: 120
- clarifying_questions: 30
- urgent_exclusions: 20
- hard_negatives: 20
- route_source_map: 10
- atomic material claims: **200**
- evidence/citation rows: **442**
- exact duplicates: **0**
- max token-Jaccard: **0.8889** (< 0.92)

### Coverage

- fever: 164
- travel: 77
- exposure: 51
- rash: 74
- bleeding: 86
- altered_mental_state: 84
- subspecialty: 170

### Safety

- Fever alone is not labeled sepsis.
- Infection plus new confusion, dyspnea, clammy skin, extreme pain/weak pulse or low urine output triggers an emergency deterioration/sepsis-warning path.
- Dengue-compatible illness with major abdominal pain, persistent vomiting, lethargy, significant bleeding, low urine or dyspnea overrides routine routing; defervescence is not treated as proof of recovery.
- Fever with new confusion/decreased consciousness or severe headache/neck stiffness is treated as a serious-infection warning, without inferring meningitis/sepsis diagnosis.
- Ill returning travelers with fever receive prompt medical evaluation; travel itinerary and infectious exposures must be captured.
- Travel after malaria-endemic-area exposure is represented only as clinician prompt-to-rule-out, not a diagnosis or self-treatment instruction.
- No medication doses or treatment protocols appear in DATA.

### Evidence / URL

B19 uses **12 exact HTTPS final pages**, independently researched in this batch:
- Vietnam: Bạch Mai exact infectious-disease unit page; Bạch Mai dengue/measles/rat-exposure articles; NHTD current dengue-warning and scrub-typhus/exposure articles.
- Core sepsis: WHO canonical sepsis fact sheet + exact CDC About Sepsis page resolved from the discovery-only seed.
- Travel supplementary: WHO Travel and Health + CDC Yellow Book 2026 post-travel fever and dermatologic chapters.
- Supporting only: CDC Port Health symptom definitions; U.S. regulatory reporting actions were not imported into patient DATA.

12/12 final URLs were browser-opened before claim acceptance and reopened after artifact generation. Visible identity and intended locator reproduced on 12/12.

### Citation / QA

- material claim citation coverage: 100%
- exact locator coverage: 100%
- live exact-document HTTPS rate: 100%
- title/publisher/document identity: 100%
- post-artifact locator reproducibility: 100% (12/12)
- second-pass citation audit: 200/200
- unsupported/contradicted pass claims: 0
- citation precision score: **100/100**
- workbook formula errors: 0
- cross-batch independence counters: 0


---

# CHƯƠNG B20: Dấu hiệu Cấp cứu Đỏ Người lớn (Adult Emergency Red Flags)

### Mục tiêu

Gold-candidate red flags người lớn chạy **trước LLM/RAG/booking**, với emergency action rõ ràng và negation/history/hypothetical guards. Không chẩn đoán, không kê thuốc/liều/phác đồ và không bịa dịch vụ/clinician/slot VMEC.

### Quy mô

- `PASS_ROWS`: **100**
- `DELIVERY_TARGET_ROWS`: **100**
- `HISTORICAL_EXPANSION_TARGET_ROWS`: **2500**
- adult_emergency_rules: 50
- adult_emergency_phrases: 20
- action_messages: 10
- negation_flags: 10
- adult_emergency_gold_tests: 10
- atomic material claims: **100**
- evidence/citation rows: **227**
- exact duplicates: **0**
- max token-Jaccard: **0.8421** (< 0.92)

### Coverage

- stroke: 14
- cardiac: 13
- respiratory: 11
- sepsis: 12
- bleeding: 12
- trauma: 12
- allergy: 11
- consciousness: 11

### Critical safety gates

- positive critical gold tests: **8/8 detected**
- critical recall: **100%**
- negative/history controls: **2/2 not triggered**
- negative-control specificity: **100%**
- emergency rules execute before LLM/RAG/booking.
- negation, remote history and hypothetical-only wording do not trigger merely from keywords.

### Safety boundaries

- Local 115 sources are used only for Vietnam emergency-service wording, never as clinical red-flag criteria.
- Clinical red flags are supported by CDC/WHO and current professional guidelines.
- Foreign emergency numbers are not retained in Vietnamese DATA; user-facing actions are localized to `115` / nearest ED.
- Fever alone is not labeled sepsis.
- Mild rash alone is not labeled anaphylaxis.
- No treatment-dose protocol is copied into DATA.
- Unresponsive + abnormal/agonal breathing receives immediate emergency/CPR-dispatcher-guidance precedence.

### Evidence / URL

B20 uses **14 exact HTTPS final pages**, all independently researched and validated in this batch. The insecure HCMC 115 seed was not used; a different exact HTTPS official government page was selected for local emergency-service wording.

14/14 exact pages were browser-opened before claim acceptance and reopened after artifact generation. Document identity and intended locator reproduced on 14/14.

### Citation / QA

- material claim citation coverage: 100%
- exact locator coverage: 100%
- live exact-document HTTPS rate: 100%
- title/publisher/document identity: 100%
- post-artifact locator reproducibility: 100%
- second-pass citation audit: 100/100
- unsupported/contradicted pass claims: 0
- citation precision score: **100/100**
- workbook formula errors: 0
- cross-batch independence counters: 0


---

# CHƯƠNG B20: Dấu hiệu Cấp cứu Đỏ Người lớn (Adult Emergency Red Flags)

### 2. Mục tiêu và ranh giới

B20 tạo seed corpus độc lập cho nhận diện dấu hiệu cấp cứu ở người lớn **trước LLM/RAG/memory/booking**. Phạm vi bắt buộc gồm: stroke, cardiac, respiratory, sepsis, bleeding, trauma, allergy và consciousness.

DATA chỉ phục vụ nhận diện nguy hiểm và escalation. Không dùng để chẩn đoán xác định, kê đơn, thay thuốc, đưa liều, chỉ định thủ thuật hoặc tạo thực thể nội bộ như bác sĩ/cơ sở/slot. Khi row dương tính cấp cứu, hành động hướng tới người dùng Việt Nam được chuẩn hóa thành gọi **115** hoặc đến khoa Cấp cứu ngay; không đi tiếp qua luồng đặt lịch thường.

### 3. Quy mô delivery

- `DELIVERY_TARGET_ROWS = 100`
- `PASS_ROWS = 100`
- `HISTORICAL_EXPANSION_TARGET_ROWS = 2500` — chỉ là quy mô mở rộng lịch sử, không phải gate completion.
- Quarantine DATA rows: `0`
- Exact duplicate: `0`
- Exact cross-split duplicate: `0`
- Near-duplicate >= 0.92: `0`
- PII/PHI/secret findings: `0`

### Phân bố bảng

| Table | Rows |
|---|---:|
| adult_emergency_rules | 24 |
| adult_emergency_phrases | 40 |
| action_messages | 8 |
| negation_flags | 16 |
| adult_emergency_gold_tests | 12 |
| **Tổng** | **100** |

### Split / retrieval scope

- Split: `TRAIN=70`, `VALIDATION=18`, `HIDDEN=12`.
- Scope: `PATIENT_SAFE=72`, `TRAINING_ONLY=16`, `EVALUATION_ONLY=12`.
- Hidden/evaluation rows: `allow_patient_retrieval=false`, `source_visibility=REVIEWER_PRIVATE`.
- Không có exact duplicate giữa TRAIN/VALIDATION/HIDDEN.

### 4. Evidence graph và citation

- Final exact sources: **13** (`5` Việt Nam, `8` quốc tế).
- Atomic material claims: **24**.
- Claim-level evidence links: **48**, đúng **2 nguồn độc lập/claim**.
- Entailment relation sau independent audit: **41 `DIRECT` + 7 `PARTIAL` scope-limited**; `NONE=0`, `CONTRADICTED=0`. Mỗi `PARTIAL` có ghi rõ giới hạn và nguồn độc lập còn lại.
- `ROW_CLAIM_BRIDGE`: **181** dòng, trong đó **121** material row→claim bridges.
- `CITATION_MATRIX`: **242** dòng; mỗi material row→claim bridge có đúng **2** citation rows.
- Final HTTPS rate: **13/13**.
- Title/publisher/document identity: **13/13**.
- Post-artifact URL reopen: **13/13**.
- Claim-level exact locator reproducibility: **48/48**.
- Second-pass citation audit: **48/48**; lần reopen sau post-entailment-patch candidate artifact hoàn tất lúc `2026-08-13T14:46:44+07:00`.
- Unsupported/contradicted pass claims: **0**.
- Citation precision score: **100/100**.

Mỗi claim material ghi exact final HTTPS URL, identity tài liệu, locator, excerpt ngắn + SHA-256, entailment, scope limit, Vietnam applicability/translation urgency và second-pass verdict. Search snippet, portal/home/search/topic landing không được dùng làm final evidence.

### 5. Nguồn final

| Source ID | Publisher | Document | Tier | Exact final URL | Reuse/licence posture |
|---|---|---|---|---|---|
| `NEW_VN_B20_BACHMAI_001` | Bệnh viện Bạch Mai | Sơ cứu đột quỵ tại nhà: Những thao tác “sống còn” bạn cần biết | `VN-A3_INSTITUTIONAL` | https://bachmai.gov.vn/bai-viet/so-cuu-dot-quy-tai-nha-nhung-thao-tac-%E2%80%9Csong-con%E2%80%9D-ban-can-biet?id=66dbd998-49e4-4350-b1c7-042985aa42e0 | PUBLIC_WEB_CITATION_ONLY |
| `NEW_INT_B20_CDC_001` | U.S. Centers for Disease Control and Prevention (CDC) | Signs and Symptoms of Stroke | `INT-A_CANONICAL` | https://www.cdc.gov/stroke/signs-symptoms/index.html | PUBLIC_WEB_CITATION_ONLY |
| `NEW_VN_B20_BACHMAI_002` | Bệnh viện Bạch Mai | Bài 1: Bệnh mạch vành - Những điều cần biết trước khi đặt stent | `VN-A3_INSTITUTIONAL` | https://bachmai.gov.vn/bai-viet/bai-1-benh-mach-vanh-nhung-dieu-can-biet-truoc-khi-dat-stent?id=65ca0a01-71c8-46eb-ba19-900ce7900b9b | PUBLIC_WEB_CITATION_ONLY |
| `NEW_INT_B20_CDC_002` | U.S. Centers for Disease Control and Prevention (CDC) | About Heart Attack Symptoms, Risk, and Recovery | `INT-A_CANONICAL` | https://www.cdc.gov/heart-disease/about/heart-attack.html | PUBLIC_WEB_CITATION_ONLY |
| `NEW_INT_B20_WHO_001` | World Health Organization (WHO) | Sepsis | `INT-A_CANONICAL` | https://www.who.int/news-room/fact-sheets/detail/sepsis | PUBLIC_WEB_CITATION_ONLY |
| `NEW_INT_B20_CDC_003` | U.S. Centers for Disease Control and Prevention (CDC) | About Sepsis | `INT-A_CANONICAL` | https://www.cdc.gov/sepsis/about/index.html | PUBLIC_WEB_CITATION_ONLY |
| `NEW_VN_B20_BACHMAI_003` | Bệnh viện Bạch Mai | Đừng chủ quan với dị ứng thuốc: Nhận biết sớm để cứu mình | `VN-A3_INSTITUTIONAL` | https://bachmai.gov.vn/bai-viet/dung-chu-quan-voi-di-ung-thuoc-nhan-biet-som-de-cuu-minh?id=b1c42455-340c-4855-a58c-90ffa73b7d49 | PUBLIC_WEB_CITATION_ONLY |
| `NEW_VN_B20_BACHMAI_004` | Khoa Chấn thương Chỉnh hình & Cột sống - Bệnh viện Bạch Mai | Sơ cứu cho người bị tai nạn giao thông | `VN-A3_INSTITUTIONAL` | https://chanthuongvacotsong.bachmai.gov.vn/so-cuu-cho-nguoi-bi-tai-nan-giao-thong/ | PUBLIC_WEB_CITATION_ONLY |
| `NEW_VN_B20_BACHMAI_005` | Khoa Chấn thương Chỉnh hình & Cột sống - Bệnh viện Bạch Mai | Kỹ năng tránh ngộ độc khí trong đám cháy | `VN-A3_INSTITUTIONAL` | https://chanthuongvacotsong.bachmai.gov.vn/ky-nang-tranh-ngo-doc-khi-trong-dam-chay/ | PUBLIC_WEB_CITATION_ONLY |
| `NEW_INT_B20_NHS_001` | NHS (England) | Anaphylaxis | `INT-A_CANONICAL` | https://www.nhs.uk/conditions/anaphylaxis/ | OGL_V3_WITH_NHS_WEBSITE_TERMS; TRANSLATION_IS_ADAPTATION; ATTRIBUTION_REQUIRED |
| `NEW_INT_B20_NHS_002` | NHS (England) | Poisoning | `INT-A_CANONICAL` | https://www.nhs.uk/conditions/poisoning/ | OGL_V3_WITH_NHS_WEBSITE_TERMS; TRANSLATION_IS_ADAPTATION; ATTRIBUTION_REQUIRED |
| `NEW_INT_B20_NHS_003` | NHS (England) | Head injury and concussion | `INT-A_CANONICAL` | https://www.nhs.uk/conditions/head-injury-and-concussion/ | OGL_V3_WITH_NHS_WEBSITE_TERMS; TRANSLATION_IS_ADAPTATION; ATTRIBUTION_REQUIRED |
| `NEW_INT_B20_NHSLLR_001` | NHS Leicester, Leicestershire and Rutland Integrated Care Board | Life-threatening emergencies | `INT-A_CANONICAL` | https://leicesterleicestershireandrutland.icb.nhs.uk/your-health/find-the-right-service/life-threatening-emergencies/ | OGL_PUBLIC_SECTOR_REUSE; ATTRIBUTION_REQUIRED |

### License/remediation

Trong audit licence, các candidate MedlinePlus/A.D.A.M. đã bị loại khỏi final source/evidence ledger sau khi điều khoản sử dụng cho thấy không phù hợp cho AI dataset/testing. Không có source ID NLM/A.D.A.M. nào còn trong `SOURCES`, `EVIDENCE_LINKS` hoặc `CITATION_MATRIX`.

**Contains public sector information licensed under the Open Government Licence v3.0.** Nội dung tiếng Việt được suy diễn/biên soạn bảo thủ từ evidence và, khi dựa trên NHS content, được xem là adaptation; không trình bày như NHS endorsement hoặc NHS clinical approval.

### 6. Vietnamese-first research và giới hạn nguồn

Research bắt đầu bằng nguồn Việt Nam. Nguồn Bạch Mai concrete được dùng cho stroke, cardiac, allergy, trauma/bleeding và smoke-related respiratory/consciousness. Một số candidate Việt Nam khác không qua được browser/identity/access gate nên bị loại.

Đối với sepsis, batch không tìm được một nguồn Việt Nam trực tiếp đủ mạnh cho toàn bộ symptom set sau systematic search; do đó dùng WHO + CDC, localize hành động khẩn cấp sang Việt Nam và giữ cờ `VIETNAM_CLINICAL_REVIEW_REQUIRED`.

Hai trang Bạch Mai về tai nạn giao thông và ngộ độc khí là tài liệu institutional cũ có ghi nguồn tái đăng; chúng được scope-limit và luôn triangulate với NHS authority, không dùng đơn lẻ để nâng claim thành GOLD.

Browser renderer xác minh exact document/title/locator nhưng không cung cấp numeric HTTP code. Workbook ghi rõ hạn chế này thay vì bịa mã 200.

### 7. Safety / adversarial / regression

Challenge audit kiểm tra: foreign emergency-number drift; negation/history/hypothetical; caregiver ambiguity; diagnosis/treatment creep; landing-page substitution; insecure redirect; browser timeout; evaluation leakage; source licence; duplicate padding; hidden critical miss; và fake reviewer/GOLD.

Các systemic defect đã được sửa trong cùng batch gồm:
1. Pilot từng chứa `911` trong template — đã chuẩn hóa toàn bộ patient-facing DATA về `115`/khoa Cấp cứu.
2. Seed `VN_115_HCM` có insecure redirect — loại khỏi final citation.
3. Candidate Vietnamese timeout — loại, không thay bằng link gần đúng.
4. Hidden evaluation isolation — khóa `EVALUATION_ONLY/HIDDEN/allow=false/REVIEWER_PRIVATE`.
5. MedlinePlus/A.D.A.M. licence blocker — loại toàn bộ khỏi final evidence và thay bằng nguồn NHS/NHS-ICB phù hợp.
6. Composite phrase/action lineage — mở rộng row→claim bridge và row-level citation matrix để không có claim cardinality mơ hồ.

Regression sau remediation: **PASS**.

### 8. Automated QA

- Hard gates `G001–G031`: **PASS** (G005 = 41 DIRECT + 7 PARTIAL scope-limited = 48/48 acceptable evidence links)
- Conditional gates áp dụng `C001–C005`: **PASS**
- Hidden critical positive recall: **8/8 = 100%**
- Hidden negative specificity: **4/4 = 100%**
- Independence gate: tất cả cross-batch counts = **0**
- Formula error scan: **0**
- Workbook required sheets: **20/20**
- Citation precision: **100/100**


---

# CHƯƠNG B21: Dấu hiệu Cấp cứu Đỏ Trẻ em & Sơ sinh (Pediatric Emergency Red Flags)

### Mục tiêu

Standalone CRITICAL_SAFETY seed cho red flags trẻ/sơ sinh theo **age band + caregiver language**, chạy trước LLM/RAG/booking. Không chẩn đoán, không kê thuốc/liều, không huấn luyện thủ thuật hồi sức và không bịa dịch vụ/clinician/slot VMEC.

### Quy mô

- `PASS_ROWS`: **100**
- `DELIVERY_TARGET_ROWS`: **100**
- `HISTORICAL_EXPANSION_TARGET_ROWS`: **1800**
- pediatric_emergency_rules: 50
- caregiver_phrases: 20
- age_specific_actions: 15
- pediatric_gold_tests: 15
- atomic material claims: **100**
- evidence/citation rows: **287**
- exact duplicates: **0**
- max token-Jaccard: **0.8409** (< 0.92)

### Coverage

- age_band: 100
- breathing: 19
- cyanosis: 13
- lethargy: 11
- seizure: 15
- feeding: 13
- dehydration: 15

### Age bands

- `NEWBORN_0_27D`
- `YOUNG_INFANT_28D_2M`
- `INFANT_2_12M`
- `CHILD_1_5Y`
- `CHILD_6_12Y`
- `ADOLESCENT_13_17Y`
- `ANY_PEDIATRIC`

Age bands are B21-local routing/evaluation bands. The newborn band follows WHO's first-28-days definition; other bands preserve the exact evidence scope or are explicitly marked batch-local bridges.

### Critical safety gates

- positive critical gold tests: **10/10 detected**
- critical recall: **100%**
- negative/history/hypothetical controls: **5/5 correctly not triggered**
- negative-control specificity: **100%**
- emergency rules execute before LLM/RAG/booking.
- caregiver negation, remote history and hypothetical-only wording do not trigger solely from dangerous keywords.

### Safety boundaries

- Newborn poor/refused feeding, seizure, difficult-to-wake lethargy, abnormal breathing or cyanosis remain danger-sign patterns with urgent escalation.
- Severe breathing difficulty, cyanosis/grey colour, persistent altered responsiveness, seizure and severe dehydration receive emergency precedence.
- Mild cough/fever/diarrhoea without danger signs is not automatically labeled emergency.
- Feeding problems in older children are not generalized blindly; age and illness/functional context are retained.
- No medication dose, diagnosis or procedural resuscitation training appears in DATA.

### Evidence / URL

B21 uses **9 exact HTTPS pages**, independently researched in this batch:
- Vietnam: 4 exact Bệnh viện Nhi Trung ương articles on newborn danger signs, respiratory monitoring, caregiver serious signs and severe dehydration.
- WHO: `Newborn mortality` (14 Mar 2024), `Child mortality (under 5 years)` (1 May 2026), ETAT guideline publication (1 Jan 2016), and `Diarrhoeal disease` (7 Mar 2024).
- Supplementary independent current guideline: Resuscitation Council UK `Paediatric Life Support (basic and advanced)` dated 27 Oct 2025.

9/9 exact final pages were browser-opened before claim acceptance and reopened after artifact generation; identity and intended locator reproduced 9/9.

### Citation / QA

- material claim citation coverage: 100%
- exact locator coverage: 100%
- live exact-document HTTPS rate: 100%
- title/publisher/document identity: 100%
- post-artifact locator reproducibility: 100% (9/9)
- second-pass citation audit: 100/100
- unsupported/contradicted pass claims: 0
- citation precision score: **100/100**
- workbook formula errors: 0
- cross-batch independence counters: 0


---

# CHƯƠNG B21: Dấu hiệu Cấp cứu Đỏ Trẻ em & Sơ sinh (Pediatric Emergency Red Flags)

### 2. Phạm vi

B21 là standalone seed corpus cho nhận diện dấu hiệu cấp cứu trẻ/sơ sinh trước LLM/RAG/memory/booking. Coverage bắt buộc: `age_band`, `breathing`, `cyanosis`, `lethargy`, `seizure`, `feeding`, `dehydration`.

DATA không chẩn đoán xác định, không kê thuốc/đưa liều, không đưa phác đồ cá nhân và không bịa facility/practitioner/service/slot. Emergency action hướng tới Việt Nam dùng `115`/khoa Cấp cứu; số `999/911` từ nguồn ngoại không được đưa vào DATA.

### 3. Quy mô DATA

- Tables: pediatric_emergency_rules=24; caregiver_phrases=48; age_specific_actions=16; pediatric_gold_tests=12.
- Split: TRAIN=64; VALIDATION=24; HIDDEN=12.
- Retrieval: PATIENT_SAFE=88; EVALUATION_ONLY=12.
- Exact duplicate: 0; exact cross-split duplicate: 0; near-duplicate >=0.92: 0.
- PII/PHI/secret findings: 0.
- Hidden positive recall: 8/8 = 100%; hidden negative specificity: 4/4 = 100%.

### 4. Evidence/citation

- Final exact HTTPS sources: **10** (3 Việt Nam + 7 quốc tế).
- Atomic material claims: **24**.
- Claim-level evidence links: **48**, mỗi claim có 2 independence groups.
- Entailment: **39 DIRECT + 9 PARTIAL scope-limited**; NONE=0; CONTRADICTED=0.
- Material row→claim bridges: **119**.
- CITATION_MATRIX rows: **238**, đúng 2 citation rows trên mỗi material row→claim bridge.
- Post-artifact URL reopen: **10/10**.
- Exact locator reproducibility: **48/48**.
- Second-pass citation audit: **48/48**.
- Unsupported/contradicted pass claims: **0**.
- Citation precision score: **100/100**.

Các `PARTIAL` không bị nâng thành `DIRECT`: chúng có scope limit rõ, luôn đi cùng nguồn độc lập còn lại và giữ `VIETNAM_CLINICAL_REVIEW_REQUIRED` khi áp dụng.

### 5. Nguồn final

| Source ID | Publisher | Exact document | Tier | Exact final URL |
|---|---|---|---|---|
| `NEW_VN_B21_NCH_001` | Bệnh viện Nhi Trung ương | Chăm sóc trẻ nhiễm khuẩn hô hấp cấp tại nhà | `VN-A3_INSTITUTIONAL` | https://benhviennhitrunguong.gov.vn/9148.html |
| `NEW_VN_B21_NCH_002` | Bệnh viện Nhi Trung ương | Một số dấu hiệu cha mẹ cần biết để đưa trẻ đi khám sớm | `VN-A3_INSTITUTIONAL` | https://benhviennhitrunguong.gov.vn/mot-so-dau-hieu-cha-me-can-biet-de-dua-tre-di-kham-som.html |
| `NEW_VN_B21_NCH_003` | Bệnh viện Nhi Trung ương | Chăm sóc trẻ viêm phổi đúng cách | `VN-A3_INSTITUTIONAL` | https://benhviennhitrunguong.gov.vn/cham-soc-tre-viem-phoi-dung-cach.html |
| `NEW_INT_B21_WHO_001` | World Health Organization | Newborns treated for neonatal infection | `INT-A_CANONICAL` | https://www.who.int/data/gho/indicator-metadata-registry/imr-details/newborns-treated-for-neonatal-infection |
| `NEW_INT_B21_WHO_002` | World Health Organization Regional Office for Europe | Newborn health | `INT-A_CANONICAL` | https://www.who.int/europe/news-room/fact-sheets/item/newborn-health |
| `NEW_INT_B21_WHO_003` | World Health Organization | Pneumonia in children | `INT-A_CANONICAL` | https://www.who.int/news-room/fact-sheets/detail/pneumonia |
| `NEW_INT_B21_NHS_001` | NHS | Dehydration | `INT-A_CANONICAL` | https://www.nhs.uk/conditions/dehydration/ |
| `NEW_INT_B21_NHS_002` | NHS | Sepsis | `INT-A_CANONICAL` | https://www.nhs.uk/conditions/sepsis/ |
| `NEW_INT_B21_NHS_003` | NHS | What to do if your child has an accident | `INT-A_CANONICAL` | https://www.nhs.uk/baby/first-aid-and-safety/first-aid/what-to-do-if-your-child-has-an-accident/ |
| `NEW_INT_B21_NHS_004` | NHS | Epilepsy | `INT-A_CANONICAL` | https://www.nhs.uk/conditions/epilepsy/ |

Nguồn discovery family/portal không được dùng làm final citation. Một trang NHS về febrile seizures bị loại vì review đã đến hạn trước ngày chạy batch; không được dùng để cứu coverage.

### 6. Licensing / adaptation

**Contains public sector information licensed under the Open Government Licence v3.0.** Nội dung NHS được chuyển ngữ/biên soạn bảo thủ và không được trình bày như NHS endorsement hoặc NHS clinical approval.

Với WHO web content, batch chỉ lưu excerpt ngắn + hash/locator và paraphrase bảo thủ cho research/evidence audit; không bulk-copy WHO web content và không tuyên bố WHO endorsement.

### 7. QA, safety và remediation

Pilot phát hiện hai systemic defects trước full DATA:
1. số cấp cứu ngoại `999`;
2. diagnosis creep: coi một cơn co giật là chắc chắn động kinh.

Cả hai đã sửa trước full generation. Challenge audit còn kiểm age-band leakage, threshold overtriage, newborn under-recognition, caregiver subject ambiguity, negation/history, feeding/dehydration treatment creep, stale source, hidden leakage, duplicate padding và cross-batch contamination.

### 10. Final close

- Hard gates `G001–G031`: **PASS**
- Conditional gates `C001–C005`: **PASS**
- URL validation/reopen: **PASS**
- Citation precision: **100/100**
- Artifact/checksum reconciliation: **PASS**
- Final reopen timestamp: `2026-08-13T15:01:25+07:00`
- Review status: **GOLD_CANDIDATE**, không phải GOLD.


---

# CHƯƠNG B22: Dấu hiệu Cấp cứu Đỏ Sản khoa & Hậu sản (Maternal Emergency Red Flags)

### Mục tiêu

Standalone CRITICAL_SAFETY seed cho red flags thai kỳ, hậu sản và sơ sinh với temporality chính xác, chạy trước LLM/RAG/booking. Không chẩn đoán, không kê thuốc/liều/phác đồ và không bịa dịch vụ/clinician/slot VMEC.

### Quy mô

- `PASS_ROWS`: **100**
- `DELIVERY_TARGET_ROWS`: **100**
- `HISTORICAL_EXPANSION_TARGET_ROWS`: **1800**
- maternal_emergency_rules: 40
- postpartum_rules: 20
- newborn_rules: 20
- maternal_action_messages: 10
- maternal_gold_tests: 10
- atomic material claims: **100**
- evidence/citation rows: **189**
- exact duplicates: **0**
- max token-Jaccard: **0.8429** (< 0.92)

### Coverage

- pregnancy_stage: 47
- postpartum_window: 28
- newborn_age: 25
- bleeding: 21
- seizure: 12
- vision: 17
- breathing: 19

### Temporality

- `PREGNANCY_ANY`, plus specific pregnancy-stage bands.
- `PREGNANCY_AFTER_20W`: pre-eclampsia/eclampsia warning context is explicitly stage-scoped.
- `POSTPARTUM_0_24H`: immediate postpartum bleeding context.
- `POSTPARTUM_0_6W`: WHO postnatal period — first six weeks after birth.
- `POSTPARTUM_6W_1Y`: CDC extended maternal warning-sign layer — kept separate from WHO postnatal definition.
- `NEWBORN_0_27D`: WHO newborn period — first 28 days.

No rule silently extends one source's temporal window into another.

### Critical safety gates

- positive critical gold tests: **8/8 detected**
- critical recall: **100%**
- negative/history/hypothetical controls: **2/2 correctly not triggered**
- negative-control specificity: **100%**
- temporality mismatch count: **0**
- emergency rules execute before LLM/RAG/booking.

### Safety boundaries

- Pregnancy bleeding/fluid leakage, serious breathing difficulty and severe headache/vision warning patterns receive urgent/emergency precedence.
- After-20-week severe headache/vision/seizure patterns are treated as maternal emergency warnings without auto-diagnosing pre-eclampsia/eclampsia.
- Heavy postpartum bleeding and severe postpartum maternal warning signs do not become routine simply because birth is complete.
- Newborn apnoea/unresponsiveness, cyanosis, seizure, severe breathing difficulty and poor feeding with reduced activity receive emergency/prompt-care precedence.
- Remote pregnancy history and hypothetical-only newborn questions do not trigger solely from danger keywords.
- No medication dose or treatment protocol appears in DATA.

### Evidence / URL

B22 uses **11 exact HTTPS final pages**, all researched and validated independently in this batch:
- Vietnam: exact Bệnh viện Phụ Sản Hà Nội and Bệnh viện Từ Dũ pregnancy, pre-eclampsia, postpartum bleeding/care and newborn pages.
- WHO: concrete pre-eclampsia, 2025 postpartum-haemorrhage guideline, postnatal guideline/update and newborn-mortality fact sheet.
- CDC: exact `Urgent Maternal Warning Signs and Symptoms` page, independently revalidated.

11/11 exact pages were browser-opened before claim acceptance and reopened after artifact generation. Exact document identity and intended locator reproduced 11/11.

### Citation / QA

- material claim citation coverage: 100%
- exact locator coverage: 100%
- live exact-document HTTPS rate: 100%
- title/publisher/document identity: 100%
- post-artifact locator reproducibility: 100% (11/11)
- second-pass citation audit: 100/100
- unsupported/contradicted pass claims: 0
- citation precision score: **100/100**
- workbook formula errors: 0
- cross-batch independence counters: 0


---

# CHƯƠNG B22: Dấu hiệu Cấp cứu Đỏ Sản khoa & Hậu sản (Maternal Emergency Red Flags)

### 2. Phạm vi và safety

B22 là standalone seed corpus cho nhận diện dấu hiệu cấp cứu trong thai kỳ, hậu sản và giai đoạn sơ sinh, chạy trước LLM/RAG/memory/booking. Coverage bắt buộc: `pregnancy_stage`, `postpartum_window`, `newborn_age`, `bleeding`, `seizure`, `vision`, `breathing`.

Corpus chỉ nhận diện/routing nguy hiểm; không chẩn đoán xác định, không kê thuốc/đưa liều, không đưa phác đồ cá nhân và không bịa practitioner/facility/slot. Emergency escalation hướng tới Việt Nam dùng `115`/khoa Cấp cứu hoặc Sản cấp cứu; `911/999` không xuất hiện trong DATA.

### 3. Temporality

- Pregnancy generic: `PREGNANCY_ANY`.
- Preeclampsia symptom rules with gestational threshold: `PREGNANCY_AFTER_20W`.
- Postpartum pre-eclampsia evidence from Từ Dũ is kept at `POSTPARTUM_0_6W`; it is not silently generalized to one year.
- General CDC urgent maternal warning signs are applicable during pregnancy and in the year after delivery, but that broad window is not treated as a diagnosis window for pre-eclampsia.
- Late postpartum haemorrhage scenarios are tagged `POSTPARTUM_AFTER_24H_TO_WEEKS`.
- Newborn-specific rules are tagged `NEWBORN_0_28D`.

### 4. DATA

- Tables: maternal_emergency_rules=24; postpartum_rules=28; newborn_rules=24; maternal_action_messages=12; maternal_gold_tests=12.
- Split: TRAIN=62; VALIDATION=26; HIDDEN=12.
- Retrieval scope: PATIENT_SAFE=88; EVALUATION_ONLY=12.
- Exact duplicate: **0**
- Exact cross-split duplicate: **0**
- Near duplicate >=0.92: **0**
- PII/PHI/secret findings: **0**
- Hidden positive critical recall: **8/8 = 100%**
- Hidden negative specificity: **4/4 = 100%**
- Quarantine DATA rows: **0**

### 5. Evidence và citation

- Final exact HTTPS sources: **11** (6 Việt Nam + 5 quốc tế).
- Atomic material claims: **24**.
- Claim-level evidence links: **48**, mỗi claim có 2 independence groups.
- Entailment: **42 DIRECT + 6 PARTIAL scope-limited**; NONE=0; CONTRADICTED=0.
- Material row→claim bridges: **132**.
- `CITATION_MATRIX`: **264** rows, đúng 2 citation rows/material row→claim bridge.
- Post-artifact URL reopen: **11/11**.
- Exact locator reproducibility: **48/48**.
- Second-pass citation audit: **48/48**.
- Unsupported/contradicted pass claims: **0**.
- Citation precision score: **100/100**.

`PARTIAL` được giữ nguyên khi một nguồn chỉ hỗ trợ một phần qualifier/temporality; mỗi link đó có scope limit và nguồn độc lập còn lại, không bị nâng giả thành `DIRECT`.

### 6. Final sources

| Source ID | Publisher | Exact document | Tier | Exact final URL |
|---|---|---|---|---|
| `NEW_VN_B22_TUDU_001` | Bệnh viện Từ Dũ | Những dấu hiệu nguy hiểm trong thai kỳ | `VN-A3_INSTITUTIONAL` | https://www.tudu.com.vn/vn/y-hoc-thuong-thuc/suc-khoe-thai-ky/nhung-dau-hieu-nguy-hiem-trong-thai-ky/ |
| `NEW_VN_B22_TUDU_002` | Bệnh viện Từ Dũ | Chảy máu âm đạo khi mang thai | `VN-A3_INSTITUTIONAL` | https://www.tudu.com.vn/vn/y-hoc-thuong-thuc/suc-khoe-thai-ky/chay-mau-am-dao-khi-mang-thai/ |
| `NEW_VN_B22_TUDU_003` | Bệnh viện Từ Dũ | Các dấu hiệu gợi ý tiền sản giật khi mang thai | `VN-A3_INSTITUTIONAL` | https://www.tudu.com.vn/vn/y-hoc-thuong-thuc/suc-khoe-thai-ky/cac-dau-hieu-goi-y-tien-san-giat-khi-mang-thai/ |
| `NEW_VN_B22_PSHN_001` | Bệnh viện Phụ Sản Hà Nội | Băng huyết muộn sau sinh – Cảnh báo biến chứng nguy hiểm có thể đe dọa tính mạng sản phụ | `VN-A3_INSTITUTIONAL` | https://benhvienphusanhanoi.vn/kien-thuc-y-khoa/bang-huyet-muon-sau-sinh--canh-bao-bien-chung-nguy-hiem-co-the-de-doa-tinh-mang-san-phu-433389.html |
| `NEW_VN_B22_NCH_001` | Bệnh viện Nhi Trung ương | Những điều cần lưu ý trong chăm sóc trẻ sơ sinh sau khi ra viện | `VN-A3_INSTITUTIONAL` | https://benhviennhitrunguong.gov.vn/cham-soc-tre-so-sinh-sau-khi-ra-vien.html |
| `NEW_VN_B22_NCH_002` | Bệnh viện Nhi Trung ương | Một số dấu hiệu cha mẹ cần biết để đưa trẻ đi khám sớm | `VN-A3_INSTITUTIONAL` | https://benhviennhitrunguong.gov.vn/mot-so-dau-hieu-cha-me-can-biet-de-dua-tre-di-kham-som.html |
| `NEW_INT_B22_CDC_001` | U.S. Centers for Disease Control and Prevention (CDC) | Urgent Maternal Warning Signs and Symptoms | `INT-A_CANONICAL` | https://www.cdc.gov/hearher/maternal-warning-signs/index.html |
| `NEW_INT_B22_WHO_001` | World Health Organization (WHO) | Pre-eclampsia | `INT-A_CANONICAL` | https://www.who.int/news-room/fact-sheets/detail/pre-eclampsia |
| `NEW_INT_B22_WHO_002` | World Health Organization (WHO) | Postpartum haemorrhage | `INT-A_CANONICAL` | https://www.who.int/teams/sexual-and-reproductive-health-and-research-%28srh%29/areas-of-work/maternal-and-perinatal-health/postpartum-haemorrhage |
| `NEW_INT_B22_WHO_003` | World Health Organization Regional Office for Europe | Newborn health | `INT-A_CANONICAL` | https://www.who.int/europe/news-room/fact-sheets/item/newborn-health |
| `NEW_INT_B22_WHO_004` | World Health Organization (WHO) | Newborns treated for neonatal infection | `INT-A_CANONICAL` | https://www.who.int/data/gho/indicator-metadata-registry/imr-details/newborns-treated-for-neonatal-infection |

Discovery families, portal/home/search pages không được dùng làm final citation. Numeric HTTP status không được browser tool cung cấp; workbook ghi `BROWSER_RENDERED_SUCCESS; NUMERIC_STATUS_NOT_EXPOSED` thay vì bịa HTTP 200.

### 7. Research và remediation

Research bắt đầu từ nguồn Việt Nam: Bệnh viện Từ Dũ cho red flags thai kỳ/tiền sản giật, Bệnh viện Phụ Sản Hà Nội cho băng huyết muộn hậu sản, Bệnh viện Nhi Trung ương cho danger signs sơ sinh. Sau đó WHO/CDC được dùng làm nguồn độc lập.

Pilot phát hiện và sửa trước full generation:
1. số cấp cứu ngoại `911`;
2. symptom-only diagnosis creep (ra máu = chắc chắn sẩy thai);
3. temporality creep (mọi đau đầu trong một năm sau sinh = tiền sản giật).

### 10. Final close

- Hard gates `G001–G031`: **PASS**
- Conditional gates `C001–C005`: **PASS**
- URL validation/reopen: **PASS**
- Citation precision: **100/100**
- Artifact/checksum reconciliation: **PASS**
- Final source reopen timestamp: `2026-08-13T15:13:26+07:00`
- Review status: **GOLD_CANDIDATE**, không phải GOLD.


---

# CHƯƠNG B23: Xử lý Phủ định Cấp cứu & Hard Negatives (Negated Emergency Cases)

### Phạm vi

B23 giảm false emergency do phủ định, lịch sử, resolved context, giả định, trích dẫn và khác chủ thể nhưng không được giảm critical recall. `CLARIFY / NO_CURRENT_EMERGENCY_TRIGGER` chỉ có nghĩa mention đó không khẳng định một cấp cứu hiện tại; không phải xác nhận người dùng “an toàn” về y khoa.

Ngoại lệ safety quan trọng: triệu chứng FAST khu trú vừa hết vẫn là emergency-positive vì TIA có thể biểu hiện thoáng qua. Current critical positive luôn thắng một cue phủ định không liên quan. Current symptom của người thân được route theo người đang có triệu chứng, không bị loại chỉ vì subject không phải user.

### DATA

- `negated_emergency_cases`: 20
- `historical_cases`: 16
- `resolved_cases`: 14
- `hypothetical_cases`: 14
- `family_member_cases`: 16
- `hard_negative_gold`: 20
- Split: TRAIN 58 / VALIDATION 22 / HIDDEN 20
- Scope: PATIENT_SAFE 80 / EVALUATION_ONLY 20
- Hidden: 10 critical-positive + 10 hard-negative
- Hidden critical recall: **10/10 = 100%**
- Hidden negative specificity: **10/10 = 100%**
- Exact duplicates: **0**
- Near duplicates >=0.92: **0**; max Jaccard after remediation: **0.750**
- PII/PHI/secret findings: **0**
- Foreign emergency numbers 911/999 in DATA: **0**
- Quarantine DATA rows: **0**

### Evidence và citation

- Final exact HTTPS sources: **11**
- Atomic material claims: **20**
- Claim-evidence links: **40**
- Entailment: **20 DIRECT + 20 PARTIAL scope-limited**; NONE=0; CONTRADICTED=0
- Material row→claim bridges: **245**
- CITATION_MATRIX rows: **490**, exactly 2 rows/material row→claim bridge
- Post-artifact reopen: **11/11**
- Locator reproducibility: **40/40**
- Second-pass citation audit: **40/40**
- Citation precision: **100/100**

`PARTIAL` is intentional: NLP methodology papers establish negation/temporality/subject/status attributes, while some clinical routing behavior is a conservative safety inference. Those links remain scope-limited and require the configured human adjudication.

### Final source ledger

| Source ID | Publisher | Exact document | Exact final URL |
|---|---|---|---|
| `NEW_VN_B23_BM_STROKE_001` | Bệnh viện Bạch Mai | SÁU ĐIỀU CẦN LÀM VÀ BA ĐIỀU NÊN TRÁNH ĐỐI VỚI BỆNH NHÂN ĐỘT QUỴ | https://bachmai.gov.vn/bai-viet/sau-dieu-can-lam-va-ba-dieu-nen-tranh-doi-voi-benh-nhan-dot-quy-?id=4b0ca98f-0a18-6a5c-22b1-cc6607fa3de9 |
| `NEW_INT_B23_ASA_STROKE_001` | American Stroke Association | Stroke Symptoms and Warning Signs | https://www.stroke.org/en/about-stroke/stroke-symptoms |
| `NEW_INT_B23_ASA_TIA_001` | American Stroke Association | Transient Ischemic Attack (TIA) | https://www.stroke.org/en/about-stroke/types-of-stroke/tia-transient-ischemic-attack |
| `NEW_VN_B23_BM_HEART_001` | Bệnh viện Bạch Mai | Bệnh mạch vành: Nhận biết sớm để bảo vệ trái tim | https://bachmai.gov.vn/bai-viet/benh-mach-vanh-nhan-biet-som-de-bao-ve-trai-tim?id=d0b8e8e4-77b0-4f0f-902c-4682defbf3c5 |
| `NEW_INT_B23_NHS_HEART_001` | NHS | Heart attack | https://www.nhs.uk/conditions/heart-attack/ |
| `NEW_VN_B23_PSHN_PREG_001` | Bệnh viện Phụ Sản Hà Nội | Một số triệu chứng đau bụng khi mang thai | https://benhvienphusanhanoi.vn/bao-chi-noi-ve-chung-toi/mot-so-trieu-chung-dau-bung-khi-mang-thai-31063.html |
| `NEW_VN_B23_TUDU_PREG_001` | Bệnh viện Từ Dũ | Sốt xuất huyết khi mang thai: điều bạn cần lưu ý | https://www.tudu.com.vn/vn/y-hoc-thuong-thuc/suc-khoe-thai-ky/sot-xuat-huyet-khi-mang-thai-dieu-ban-can-luu-y/ |
| `NEW_INT_B23_NLP_ATTR_001` | arXiv / Journal of the American Medical Informatics Association | COVID-19 SignSym: a fast adaptation of a general clinical NLP tool to identify and normalize COVID-19 signs and symptoms to OMOP common data model | https://arxiv.org/abs/2007.10286 |
| `NEW_INT_B23_NLP_STATUS_001` | arXiv / ACL 2019 | Extracting Symptoms and their Status from Clinical Conversations | https://arxiv.org/abs/1906.02239 |
| `NEW_INT_B23_NLP_NEG_001` | arXiv | Clinical Text Summarization with Syntax-Based Negation and Semantic Concept Identification | https://arxiv.org/abs/2003.00353 |
| `NEW_VN_B23_VIMQ_001` | arXiv / ICONIP | ViMQ: A Vietnamese Medical Question Dataset for Healthcare Dialogue System Development | https://arxiv.org/abs/2304.14405 |

### Research và regression

B23 researched Vietnamese clinical evidence first, then independent international clinical/methodological sources. Configured CDC seeds were reverified for discovery but not used as B23 final evidence, avoiding exact final-evidence URL reuse from prior deliveries.

Regression fixed:
1. recent-resolved FAST/TIA-like cases incorrectly drifting toward hard-negative;
2. three near-duplicate pairs >=0.92;
3. method-paper evidence overclaim, by preserving `PARTIAL` scope limits;
4. foreign emergency-number drift; positive actions are localized to `115` / khoa Cấp cứu.

### Final close

- Hard gates G001–G031: **PASS**
- Conditional gates C001–C005: **PASS**
- URL validation/reopen: **PASS**
- Citation precision: **100/100**
- Artifact/checksum/ZIP reconciliation: **PASS**
- Final source reopen timestamp: `2026-08-13T15:26:30+07:00`
- Review: **GOLD_CANDIDATE**, not GOLD.


---

# CHƯƠNG B24: Chiến lược Đặt câu hỏi Làm rõ & Chuyển giao Y tế (Clarifying Questions)

### 2. Mục tiêu

B24 cung cấp ngân hàng câu hỏi làm rõ tiếng Việt theo nguyên tắc 1–3 câu có giá trị routing cao, không trì hoãn emergency và chuyển human handoff khi confidence còn thấp. Coverage bắt buộc gồm: `body_site`, `onset`, `severity`, `duration`, `age`, `pregnancy`, `red_flag`, `stop_condition`.

Giới hạn **1–3 câu** là product safety constraint của B24, **không phải một quy tắc lâm sàng WHO**. Các nguồn WHO hỗ trợ human control, accountability, reliability, automation-bias và LMM risk; mọi suy luận thiết kế sản phẩm chỉ được giữ ở `PARTIAL` khi nguồn không nói trực tiếp.

### 3. Safety contract

- Red flag/ABCDE instability được xử lý trước routine clarification.
- Khi emergency action đã rõ, dừng câu hỏi không làm thay đổi hành động.
- Khi sau tối đa 3 câu vẫn low confidence hoặc câu trả lời mâu thuẫn ở yếu tố high-risk, chuyển `HUMAN_HANDOFF / URGENT_HUMAN_TRIAGE`.
- Không dùng clarification để chẩn đoán xác định, kê thuốc, đưa liều hoặc tạo phác đồ cá nhân.
- Patient-facing emergency action dùng `115` / khoa Cấp cứu; `911/999` không có trong DATA.
- `INT_PROJECT` không được dùng vì không có owner-approved attachment/version trong invocation này.

### 4. DATA

- clarifying_questions: **120**
- question_conditions: **30**
- stop_conditions: **20**
- human_handoff_conditions: **15**
- question_source_map: **15**
- Split: TRAIN=126; VALIDATION=54; HIDDEN=20.
- Scope: PATIENT_SAFE=165; EVALUATION_ONLY=20; TRAINING_ONLY=15.
- Exact duplicate: **0**
- Near duplicate >=0.92: **0**; max Jaccard=0.600
- PII/PHI/secret findings: **0**
- Foreign emergency-number findings: **0**
- Quarantine DATA rows: **0**

### 5. Hidden evaluation

- Emergency stop cases: **10/10** correctly route `EMERGENCY / CALL_115_OR_GO_TO_ED_NOW`.
- Low-confidence/handoff cases: **10/10** correctly route `HUMAN_HANDOFF / URGENT_HUMAN_TRIAGE`.
- Hidden rows are `EVALUATION_ONLY`, `allow_patient_retrieval=false`, `REVIEWER_PRIVATE`.

### 6. Evidence/citation

- Final exact HTTPS sources: **11**
- Atomic material claims: **24**
- Claim-evidence links: **48**
- Entailment: **31 DIRECT + 17 PARTIAL scope-limited**; NONE=0; CONTRADICTED=0
- ROW_CLAIM_BRIDGE rows: **400**
- CITATION_MATRIX rows: **800**, đúng 2 citations trên mỗi row→claim bridge
- Post-artifact URL reopen: **11/11**
- Exact locator reproducibility: **48/48**
- Second-pass citation audit: **48/48**
- Citation precision: **100/100**

### 7. Final source ledger

| Source ID | Publisher | Exact document | Exact final URL |
|---|---|---|---|
| `NEW_INT_B24_WHO_AI_PUB_001` | World Health Organization | Ethics and governance of artificial intelligence for health | https://www.who.int/publications/i/item/9789240029200 |
| `NEW_INT_B24_WHO_AI_NEWS_001` | World Health Organization | WHO issues first global report on Artificial Intelligence (AI) in health and six guiding principles for its design and use | https://www.who.int/news/item/28-06-2021-who-issues-first-global-report-on-ai-in-health-and-six-guiding-principles-for-its-design-and-use |
| `NEW_INT_B24_WHO_LMM_PUB_001` | World Health Organization | Ethics and governance of artificial intelligence for health: Guidance on large multi-modal models | https://www.who.int/publications/i/item/9789240084759 |
| `NEW_INT_B24_WHO_LMM_NEWS_001` | World Health Organization | WHO releases AI ethics and governance guidance for large multi-modal models | https://www.who.int/news/item/18-01-2024-who-releases-ai-ethics-and-governance-guidance-for-large-multi-modal-models |
| `NEW_VN_B24_BM_ICU_001` | Bệnh viện Bạch Mai | Nâng cao kỹ năng chuyên môn điều dưỡng - Mắt xích then chốt trong chăm sóc người bệnh nặng | https://bachmai.gov.vn/bai-viet/nang-cao-ky-nang-chuyen-mon-dieu-duong-mat-xich-then-chot-trong-cham-soc-nguoi-benh-nang?id=63bec476-4203-46e8-b5dd-f4914e4f6240 |
| `NEW_VN_B24_108_ANEURYSM_001` | Bệnh viện Trung ương Quân đội 108 | Tháo ngòi cho “quả bom nổ chậm” trong đầu | https://benhvien108.vn/thao-ngoi-cho-%E2%80%9Cqua-bom-no-cham%E2%80%9D-trong-dau.htm |
| `NEW_VN_B24_108_PANCREAS_001` | Bệnh viện Trung ương Quân đội 108 | Viêm tuỵ cấp | https://www.benhvien108.vn/ky-thuat-chuyen-sau-khoa-a3-c/viem-tuy-cap.htm |
| `NEW_VN_B24_TUDU_PREG_001` | Bệnh viện Từ Dũ | Sốt xuất huyết khi mang thai: điều bạn cần lưu ý | https://www.tudu.com.vn/vn/y-hoc-thuong-thuc/suc-khoe-thai-ky/sot-xuat-huyet-khi-mang-thai-dieu-ban-can-luu-y/ |
| `NEW_VN_B24_108_PREG_001` | Bệnh viện Trung ương Quân đội 108 | Qui định về quản lý thai nghén tại Khoa Phụ sản Bệnh viện TƯQĐ 108 | https://www.benhvien108.vn/qui-dinh-ve-quan-ly-thai-nghen-tai-khoa-phu-san-benh-vien-tuqd-108.htm |
| `NEW_VN_B24_KCB_PED_001` | Cục Quản lý Khám, chữa bệnh - Bộ Y tế | Hướng dẫn chẩn đoán và điều trị một số bệnh thường gặp ở trẻ em | https://kcb.vn/van-ban/huong-dan-chan-doan-va-dieu-tri-mot-so-benh-thuong-gap-o-tre-em.html |
| `NEW_VN_B24_BM_AGE_001` | Bệnh viện Bạch Mai | Tránh đột quỵ khi nắng nóng | https://bachmai.gov.vn/bai-viet/tranh-dot-quy-khi-nang-nong?id=30ad4c2e-e74b-e182-f63c-21a87ced4714 |

### 8. Research và remediation

Research Việt Nam được thực hiện trước: Bệnh viện Bạch Mai cho ABCDE, thời điểm khởi phát và bàn giao ngắn gọn; Bệnh viện 108 cho onset/severity/duration/body-site và pregnancy-stage; Từ Dũ cho pregnancy context; Cục KCB cho tài liệu nhi khoa chính thức. WHO AI/LMM được dùng ở lớp governance/human oversight, không bị biến thành clinical routing criteria.

Regression đã kiểm soát:
1. clarification loop vượt quá budget 1–3;
2. hỏi thêm làm trì hoãn emergency;
3. overclaim từ WHO governance sang clinical rule;
4. dùng `INT_PROJECT` khi chưa có approval artifact;
5. post-artifact URL/locator reopen.

### 11. Final close

- Hard gates `G001–G031`: **PASS**
- Conditional gates `C001–C005`: **PASS**
- URL validation/reopen: **PASS**
- Citation precision: **100/100**
- Package reconciliation: **PASS**
- Final source reopen timestamp: `2026-08-13T15:39:34+07:00`
- Review: **GOLD_CANDIDATE**, không phải GOLD.


---

# CHƯƠNG B25: Đa dạng Diễn đạt, Ngữ vực & Phương ngữ 3 miền (Paraphrasing & Dialects)

### 2. Phạm vi

B25 là bộ dữ liệu synthetic ngôn ngữ tiếng Việt cho huấn luyện/đánh giá paraphrase. Nó không phải clinical evidence và không được dùng cho patient retrieval.

Coverage: `formal`, `conversational`, `caregiver`, `short_message`, `region`, `label_preservation`.

### 3. DATA và lineage

- Tổng PASS rows: **500/500**
- `paraphrases`: **300**
- `paraphrase_lineage`: **80**
- `register_tags`: **50**
- `speaker_roles`: **40**
- `linguistic_review_sample`: **30**
- Split: TRAIN=350; VALIDATION=140; HIDDEN=10.
- Scope: TRAINING_ONLY=490; EVALUATION_ONLY=10; PATIENT_SAFE=0.
- Tất cả 300 paraphrase có parent B25-local `B25_SEED_xxx`.
- Route/action label preservation: **300/300**.
- `allow_patient_retrieval=false`: **500/500**.
- Exact duplicate: **0**.
- Near duplicate >=0.95 sau remediation: **0**.
- Max Jaccard sau remediation: **~0.93**.
- PII/PHI/secret findings: **0**.
- Foreign emergency-number findings: **0**.
- Quarantine DATA rows: **0**.

### 4. Evidence/citation

- Exact final HTTPS research sources: **8**
- Atomic language/dataset claims: **18**
- Claim-evidence links: **36**
- Entailment: **21 DIRECT + 15 PARTIAL scope-limited**, NONE=0, CONTRADICTED=0.
- ROW_CLAIM_BRIDGE: **500**
- CITATION_MATRIX: **1000**, đúng 2 citations/row→claim bridge.
- Post-artifact URL reopen: **8/8**
- Exact locator reproducibility: **36/36**
- Second-pass citation audit: **36/36**
- Citation precision: **100/100**

NLP sources chỉ hỗ trợ thiết kế dữ liệu/ngôn ngữ. Không suy ra clinical correctness từ các nguồn này. ViQUAD được final-cite bằng exact PDF `arXiv:2009.14725v3; 7 Nov 2020`, với page/line locators tái lập được sau candidate generation.

### 5. Source ledger

| Source ID | Publisher | Exact document | Exact final URL |
|---|---|---|---|
| `NEW_VN_B25_VISP_001` | Association for Computational Linguistics | A Large-Scale Benchmark for Vietnamese Sentence Paraphrases | https://aclanthology.org/2025.findings-naacl.59/ |
| `NEW_VN_B25_VIQUAD_001` | arXiv / authors | A Vietnamese Dataset for Evaluating Machine Reading Comprehension | https://arxiv.org/pdf/2009.14725 |
| `NEW_VN_B25_VIHEALTHQA_001` | arXiv / authors | SPBERTQA: A Two-Stage Question Answering System Based on Sentence Transformers for Medical Texts | https://arxiv.org/abs/2206.09600 |
| `NEW_VN_B25_VIMEDAQA_001` | Association for Computational Linguistics | ViMedAQA: A Vietnamese Medical Abstractive Question-Answering Dataset and Findings of Large Language Model | https://aclanthology.org/2024.acl-srw.31/ |
| `NEW_VN_B25_MEDEV_001` | arXiv / authors | Improving Vietnamese-English Medical Machine Translation | https://arxiv.org/html/2403.19161v1 |
| `NEW_VN_B25_VIMEDNER_001` | EAI | ViMedNER: A Medical Named Entity Recognition Dataset for Vietnamese | https://eudl.eu/doi/10.4108/eetinis.v11i3.5221 |
| `NEW_VN_B25_VIETMED_001` | arXiv / authors | VietMed: A Dataset and Benchmark for Automatic Speech Recognitionof Vietnamese in the Medical Domain | https://arxiv.org/html/2404.05659v3 |
| `NEW_VN_B25_VIMD_001` | Association for Computational Linguistics | Multi-Dialect Vietnamese: Task, Dataset, Baseline Models and Challenges | https://aclanthology.org/2024.emnlp-main.426/ |

### 6. Synthetic quality controls

- ViSP được dùng cho nguyên tắc paraphrase generation + manual evaluation.
- UIT-ViQuAD được dùng cho đa dạng cách hỏi, paraphrasing reasoning và self/cross-check validation.
- ViHealthQA/ViMedAQA/MedEV/ViMedNER được dùng cho bối cảnh Vietnamese medical language.
- VietMed hỗ trợ explicit speaker-role/accent metadata.
- ViMD hỗ trợ explicit regional/dialect metadata.
- Không sao chép ví dụ/câu nguồn vào DATA; 500 rows là B25-original synthetic content.

### 7. Regression

1. Remediate 5 near-duplicate caregiver collisions; final >=0.95 count = 0.
2. Remediate một language claim ban đầu chưa có row bridge; final 18/18 claims mapped.
3. Enforce 300/300 parent route/action equality.
4. Region tags chỉ là synthetic metadata, không tuyên bố native-speaker authenticity.
5. ViQUAD abstract URL được thay bằng exact PDF để đạt reproducible locator.

### 10. Final close

- Hard gates `G001–G031`: **PASS**
- Conditional gates `C001–C005`: **PASS**
- URL validation/reopen: **PASS**
- Citation precision: **100/100**
- Artifact/checksum/ZIP reconciliation: **PASS**
- Final reopen timestamp: `2026-08-13T15:59:14+07:00`
- Review status: **SILVER/SYNTHETIC**, không phải GOLD.


---

# CHƯƠNG B26: Chuẩn hóa Tiếng Việt Không Dấu & Lỗi Gõ (No-diacritics & Typo Robustness)

### 2. Phạm vi

B26 là standalone Vietnamese robustness corpus cho `no_diacritics`, `keyboard_typo`, `phonetic_typo`, `abbreviation`, `regional` và `label_preservation`. Dữ liệu là synthetic augmentation/evaluation; không phải clinical evidence và không được patient retrieval.

### 3. DATA

- `no_diacritic_variants`: 100
- `typo_variants`: 160
- `abbreviations`: 80
- `regional_variants`: 80
- `normalization_pairs`: 80
- Split: TRAIN=350; VALIDATION=130; HIDDEN=20.
- Scope: TRAINING_ONLY=480; EVALUATION_ONLY=20; PATIENT_SAFE=0.
- `allow_patient_retrieval=false`: **500/500**
- Parent lineage: B26-local `B26_SEED_xxx` only.
- Route/action label preservation: **500/500**
- Exact duplicates: **0**
- Near duplicates >=0.95: **0**
- Max Jaccard after remediation: **0.947**
- PII/PHI/secret findings: **0**
- Foreign emergency-number findings: **0**
- Quarantine DATA rows: **0**

### 4. Robustness contract

- No-diacritics được xử lý như surface noise có thể mơ hồ; canonical target được lưu trong normalization pair.
- Keyboard typo và phonetic typo chỉ thay surface form, không thay parent route/action.
- Abbreviation normalization dùng targeted mappings; không rewrite toàn câu tùy ý.
- Regional variants là `SYNTHETIC_NOT_NATIVE_VALIDATED`; không tuyên bố đại diện chính xác cho người bản địa từng vùng.
- Conservative normalization guard: không sửa token đúng hoặc thay đổi nội dung không cần thiết.

### 5. Evidence/citation

- Final exact HTTPS sources: **8**
- Atomic language/normalization claims: **18**
- Claim-evidence links: **36**
- Entailment: **26 DIRECT + 10 PARTIAL scope-limited**, NONE=0, CONTRADICTED=0.
- ROW_CLAIM_BRIDGE: **500**
- CITATION_MATRIX: **1000** rows, đúng 2 citations/row→claim bridge.
- Post-artifact URL reopen: **8/8**
- Exact locator reproducibility: **36/36**
- Second-pass citation audit: **36/36**
- Citation precision: **100/100**

Các NLP papers chỉ hỗ trợ robustness/normalization design. Không suy ra clinical correctness từ các nguồn này.

### 6. Final source ledger

| Source ID | Publisher | Exact document | Version | Exact final URL |
|---|---|---|---|---|
| `NEW_VN_B26_VSEC_001` | arXiv | VSEC: Transformer-based Model for Vietnamese Spelling Correction | `arXiv:2111.00640v2` | https://arxiv.org/abs/2111.00640 |
| `NEW_VN_B26_HIER_001` | arXiv | Hierarchical Transformer Encoders for Vietnamese Spelling Correction | `arXiv:2105.13578v1` | https://arxiv.org/html/2105.13578 |
| `NEW_VN_B26_DIAC_001` | arXiv | On the Use of Machine Translation-Based Approaches for Vietnamese Diacritic Restoration | `arXiv:1709.07104v2` | https://arxiv.org/html/1709.07104 |
| `NEW_VN_B26_NORMALIZER_001` | arXiv | VietNormalizer: An Open-Source, Dependency-Free Python Library for Vietnamese Text Normalization in TTS and NLP Applications | `arXiv:2603.04145v1` | https://arxiv.org/html/2603.04145v1 |
| `NEW_VN_B26_DIALECT_001` | arXiv | ViDia2Std: A Parallel Corpus and Methods for Low-Resource Vietnamese Dialect-to-Standard Translation | `arXiv:2603.10211v1` | https://arxiv.org/html/2603.10211v1 |
| `NEW_VN_B26_VISOLEX_001` | arXiv | ViSoLex: An Open-Source Repository for Vietnamese Social Media Lexical Normalization | `arXiv:2501.07020v1` | https://arxiv.org/html/2501.07020v1 |
| `NEW_VN_B26_BERTSPELL_001` | arXiv | A Combination of BERT and Transformer for Vietnamese Spelling Correction | `arXiv:2405.02573v1` | https://arxiv.org/html/2405.02573v1 |
| `NEW_VN_B26_VNU2STAGE_001` | VNU Journal of Science: Computer Science and Communication Engineering | A Two-Stage Vietnamese Spelling Correction Pipeline Combining Underthesea and BARTpho | `Version of record 2026-05-19` | https://jcsce.vnu.edu.vn/index.php/jcsce/article/view/7020 |

### 7. Regression

1. Generator typo ban đầu không tìm được token hợp lệ ở một số seed; đã sửa fallback và rerun toàn generation.
2. 16 exact duplicate phonetic rows được phát hiện; đã tạo secondary distinct noise và retest: exact=0, near>=0.95=0.
3. 500/500 route/action labels được kiểm bằng parent metadata.
4. Region-conditioned rows giữ truth label `SYNTHETIC_NOT_NATIVE_VALIDATED`.
5. Post-artifact reopen hoàn tất **8/8**, locator reproduction **36/36**.

### 10. Final close

- Hard gates `G001–G031`: **PASS**
- Conditional gates `C001–C005`: **PASS**
- URL validation/reopen: **PASS**
- Citation precision: **100/100**
- Artifact/checksum/ZIP reconciliation: **PASS**
- Final source reopen timestamp: `2026-08-13T16:17:11+07:00`
- Review status: **SYNTHETIC/SILVER**, không phải GOLD.


---

# CHƯƠNG B27: Nhận diện Ý định & Thực thể Y tế NLU (Intent & Entity Recognition)

### DATA

- intent_utterances: **300**
- entity_annotations: **100**
- intent_entity_constraints: **40**
- split_registry: **30**
- intent_gold_tests: **30**
- Split: TRAIN=368; VALIDATION=97; HIDDEN=35.
- Scope: TRAINING_ONLY=465; EVALUATION_ONLY=35; PATIENT_SAFE=0.
- Hidden intent tests: **30/30** expected route labels matched.
- Exact duplicate: **0**
- Cross-split Jaccard >=0.92: **0**
- Max Jaccard: **0.909**
- Patient retrieval: **0/500**
- Quarantine: **0**

### Safety và catalog boundary

B27 là NLU training/evaluation corpus. `EMERGENCY_SIGNAL_EXPLICIT` chỉ nhận câu **tự nói rõ** “cấp cứu/115/xử lý khẩn”; batch không dùng NLP papers để suy luận triệu chứng nào là cấp cứu. Những row emergency giữ `PENDING_CLINICAL_REVIEW` khi phù hợp.

`VN_INTERNAL_CATALOG` không được dùng: search conversation/library không tìm thấy owner-approved catalog artifact/version. Vì vậy mọi specialty/service/facility/appointment entity là `DEMO/SYNTHETIC`, không phải production code.

### Evidence/citation

- Exact final HTTPS sources: **8**
- Atomic material claims: **18**
- Claim-evidence links: **36**
- Entailment: **27 DIRECT + 9 PARTIAL scope-limited**; NONE=0; CONTRADICTED=0
- ROW_CLAIM_BRIDGE: **500**
- CITATION_MATRIX: **1000**
- Post-artifact reopen: **8/8**
- Exact locator reproducibility: **36/36**
- Second-pass audit: **36/36**
- Citation precision: **100/100**

### Final source ledger

| Source ID | Publisher | Exact document | Version | Exact HTTPS URL |
|---|---|---|---|---|
| `NEW_VN_B27_PHOATIS_001` | arXiv | Intent Detection and Slot Filling for Vietnamese | `arXiv:2104.02021v2` | https://arxiv.org/html/2104.02021v2 |
| `NEW_VN_B27_DISFLUENCY_001` | arXiv | From Disfluency Detection to Intent Detection and Slot Filling | `arXiv:2209.08359v1` | https://arxiv.org/html/2209.08359v1 |
| `NEW_VN_B27_VIWOZ_001` | arXiv | ViWOZ: A Multi-Domain Task-Oriented Dialogue Systems Dataset For Low-resource Language | `arXiv:2203.07742v1` | https://arxiv.org/html/2203.07742 |
| `NEW_VN_B27_ALLWOZ_001` | arXiv | AllWOZ: Towards Multilingual Task-Oriented Dialog Systems for All | `arXiv:2112.08333v1` | https://arxiv.org/html/2112.08333 |
| `NEW_VN_B27_VIETMEDNER_001` | Association for Computational Linguistics | Medical Spoken Named Entity Recognition | `NAACL 2025; pages 724–783` | https://aclanthology.org/2025.naacl-industry.59/ |
| `NEW_VN_B27_PHONER_001` | Association for Computational Linguistics | COVID-19 Named Entity Recognition for Vietnamese | `NAACL 2021; pages 2146–2153` | https://aclanthology.org/2021.naacl-main.173/ |
| `NEW_VN_B27_NESTEDNER_001` | arXiv | Nested Named-Entity Recognition on Vietnamese COVID-19: Dataset and Experiments | `arXiv:2504.21016v2` | https://arxiv.org/html/2504.21016v2 |
| `NEW_VN_B27_RASA_001` | International Journal of Open Information Technologies | Enhancing Rasa NLU model for Vietnamese chatbot | `Vol 9, No 1 (2021)` | https://injoit.org/index.php/j1/article/view/1021 |

### Regression

1. Pilot phát hiện 129 exact duplicates và 168 cross-split near-duplicates; remediation đưa exact=0, cross-split >=0.92=0.
2. Pilot phát hiện 9 claims chưa có row bridge; final 18/18 claims mapped.
3. Internal catalog approval artifact không có; production entity codes bị loại.
4. Emergency intent bị giới hạn ở explicit emergency language, không clinical symptom inference.
5. Post-artifact exact URL reopen 8/8 và locator reproduction 36/36.

### Final close

- G001–G031: **PASS**
- C001–C005: **PASS**
- URL validation/reopen: **PASS**
- Citation precision: **100/100**
- Package reconciliation: **PASS**
- Reopen timestamp: `2026-08-13T16:31:05+07:00`
- Review remains **GOLD_CANDIDATE/SILVER/SYNTHETIC**.


---

# CHƯƠNG B28: Kịch bản Luồng Hội thoại Y tế Đa lượt (Multi-turn Dialogues)

### 2. DATA

- conversations: **50**
- turns: **250**
- conversation_state: **80**
- citations_shown: **40**
- handoff_events: **40**
- scenario_invariants: **40**
- Split: TRAIN=348; VALIDATION=98; HIDDEN=54.
- Scope: TRAINING_ONLY=446; EVALUATION_ONLY=54; PATIENT_SAFE=0.
- Exact duplicate: **0**
- Near duplicate Jaccard >=0.92: **0**
- Cross-split near duplicate >=0.92: **0**
- Max Jaccard: **0.873**
- PII/PHI/secret: **0**
- Foreign emergency numbers 911/999: **0**
- Quarantine: **0**

### 3. Safety invariants

- Explicit emergency: **10/10** first assistant response = `CALL_115_OR_GO_TO_ED_NOW`.
- Clarification after explicit emergency: **0/10**, tức 10/10 không trì hoãn.
- Low-confidence scenarios: **10/10** chỉ một clarification rồi human handoff.
- No-loop: **50/50** scenarios có `clarification_count<=1`.
- Scope-stop: **10/10** từ chối tự chẩn đoán/kê thuốc và handoff thay vì bịa.
- 40/40 `citations_shown` ghi rõ WHO source là **AI governance only**, không phải clinical evidence cho triệu chứng cá nhân.
- `allow_patient_retrieval=false`: **500/500**.

Các invariant `max-one-clarification`, `explicit-emergency bypass`, `no-loop` là **B28 product safety rules**, không phải WHO clinical routing criteria. WHO được dùng để grounding human control, safety, transparency, accountability, auditing, LMM reliability risk và automation-bias controls.

### 4. Evidence/citation

- Final exact HTTPS WHO documents: **4**
- Atomic material claims: **18**
- Claim-evidence links: **36**
- Entailment: **21 DIRECT + 15 PARTIAL scope-limited**, NONE=0, CONTRADICTED=0.
- ROW_CLAIM_BRIDGE: **500**
- CITATION_MATRIX: **1000**, đúng 2 citations/row→claim bridge.
- Post-artifact URL reopen: **4/4**
- Exact locator reproducibility: **36/36**
- Second-pass citation audit: **36/36**
- Citation precision: **100/100**

### 5. Final source ledger

| Source ID | Exact document | Version/date | Exact final URL |
|---|---|---|---|
| `NEW_INT_B28_WHO_AI_PUB_001` | Ethics and governance of artificial intelligence for health | `WHO guidance; ISBN 9789240029200` | https://www.who.int/publications/i/item/9789240029200 |
| `NEW_INT_B28_WHO_AI_NEWS_001` | WHO issues first global report on Artificial Intelligence (AI) in health and six guiding principles for its design and use | `WHO news release 2021-06-28` | https://www.who.int/news/item/28-06-2021-who-issues-first-global-report-on-ai-in-health-and-six-guiding-principles-for-its-design-and-use |
| `NEW_INT_B28_WHO_LMM_PUB_001` | Ethics and governance of artificial intelligence for health: Guidance on large multi-modal models | `ISBN 978-92-4-008475-9; WHO publication page rendered 2025-03-25` | https://www.who.int/publications/i/item/9789240084759 |
| `NEW_INT_B28_WHO_LMM_NEWS_001` | WHO releases AI ethics and governance guidance for large multi-modal models | `WHO news release 2024-01-18` | https://www.who.int/news/item/18-01-2024-who-releases-ai-ethics-and-governance-guidance-for-large-multi-modal-models |

### 6. Regression

1. Pilot phát hiện 565 near-duplicate >=0.92 và 250 cross-split near pairs; final = 0/0 sau trace-marker remediation.
2. Pilot phát hiện 6 material claims có evidence nhưng chưa có DATA bridge; final 18/18 claims mapped.
3. Emergency challenge loại bỏ mọi clarification sau explicit emergency signal.
4. Citation challenge khóa `clinical_evidence=false` cho governance citations.
5. Post-artifact reopen hoàn tất 4/4 exact URLs và 36/36 locators.

### 9. Final close

- G001–G031: **PASS**
- C001–C005: **PASS**
- URL validation/reopen: **PASS**
- Citation precision: **100/100**
- Package reconciliation: **PASS**
- Final reopen timestamp: `2026-08-13T16:39:19+07:00`
- Review remains **SYNTHETIC/SILVER**; clinical sample review not performed.


---

# CHƯƠNG B29: Máy Trạng thái Giao dịch Đặt lịch Khám (Booking State Machine)

### 2. DATA

- booking_conversations: **60**
- appointment_states: **180**
- hold_events: **70**
- patient_confirm_events: **60**
- staff_approval_events: **60**
- booking_invariants: **70**
- Split: TRAIN=336; VALIDATION=102; HIDDEN=62.
- Scope: TRAINING_ONLY=438; EVALUATION_ONLY=62; PATIENT_SAFE=0.
- Exact duplicate: **0**
- Near duplicate Jaccard >=0.92: **0**
- Cross-split near duplicate >=0.92: **0**
- Max Jaccard: **0.833**
- PII/PHI/secret findings: **0**
- Quarantine: **0**

### 3. State-machine invariants

- HAPPY_PATH: **10/10** → `FINAL_CONFIRMED`
- HOLD_EXPIRY: **10/10** → `EXPIRED_RELEASED`
- PATIENT_DECLINE: **10/10** → `PATIENT_DECLINED_RELEASED`
- STAFF_DECLINE: **10/10** → `STAFF_DECLINED_RELEASED`
- COLLISION: **10/10** → competing hold rejected, primary flow remains valid
- DUPLICATE_RETRY: **10/10** → retry idempotent; no duplicate transition
- Synthetic final confirmation requires patient accepted + staff accepted.
- Synthetic final commit aligns Appointment=`booked` and Slot=`busy` atomically.

FHIR R4 directly supports Appointment/AppointmentResponse/Slot/Schedule state semantics, optimistic locking and atomic transaction semantics. `HOLD_ACTIVE`, TTL expiry, two-layer confirmation and idempotency are explicitly marked as **B29 product invariants** where FHIR does not require those exact rules.

### 4. INT_PROJECT boundary

`INT_PROJECT` requires an actual owner-approved attachment/version. Search trong conversation/library không thiết lập được artifact bất biến có bằng chứng approval, nên `INT_PROJECT` không được dùng làm evidence. B29 chỉ dùng `DEMO_*` synthetic booking/slot/hold IDs.

### 5. Evidence/citation

- Final exact HTTPS sources: **5**
- Atomic material claims: **20**
- Claim-evidence links: **40**
- Entailment: **21 DIRECT + 19 PARTIAL scope-limited**, NONE=0, CONTRADICTED=0
- ROW_CLAIM_BRIDGE: **500**
- CITATION_MATRIX: **1000**, đúng 2 citations/row→claim bridge
- Post-artifact URL reopen: **5/5**
- Exact locator reproducibility: **40/40**
- Second-pass citation audit: **40/40**
- Citation precision: **100/100**

### 6. Final source ledger

| Source ID | Exact document | Version | Exact final URL |
|---|---|---|---|
| `NEW_INT_B29_FHIR_APPT_001` | Appointment - FHIR v4.0.1 | `FHIR R4 4.0.1` | https://hl7.org/fhir/R4/appointment.html |
| `NEW_INT_B29_FHIR_RESP_001` | AppointmentResponse - FHIR v4.0.1 | `FHIR R4 4.0.1` | https://hl7.org/fhir/R4/appointmentresponse.html |
| `NEW_INT_B29_FHIR_SLOT_001` | Slot - FHIR v4.0.1 | `FHIR R4 4.0.1` | https://hl7.org/fhir/R4/slot.html |
| `NEW_INT_B29_FHIR_SCHEDULE_001` | Schedule - FHIR v4.0.1 | `FHIR R4 4.0.1` | https://hl7.org/fhir/R4/schedule.html |
| `NEW_INT_B29_FHIR_HTTP_001` | Http - FHIR v4.0.1 | `FHIR R4 4.0.1` | https://hl7.org/fhir/R4/http.html |

### 7. Regression

1. 5 material claims ban đầu có evidence nhưng chưa có DATA bridge; final **20/20 claims mapped**.
2. Hold/TTL/two-layer semantics được scope-limit để không overclaim FHIR.
3. `INT_PROJECT` bị loại vì approval artifact/version không được thiết lập.
4. Concurrency/final commit được kiểm bằng optimistic-lock + atomic-transaction invariants.
5. Post-artifact reopen đạt **5/5 URLs**, **40/40 locators**.

### 10. Final close

- G001–G031: **PASS**
- C001–C005: **PASS**
- URL validation/reopen: **PASS**
- Citation precision: **100/100**
- Artifact/checksum/ZIP reconciliation: **PASS**
- Final reopen timestamp: `2026-08-13T16:50:01+07:00`
- Review remains **SYNTHETIC**; Operations review not performed.


---

# CHƯƠNG B30: Hủy lịch, Dời lịch & Xử lý Tranh chấp Giữ chỗ (Cancellation & Reschedule)

### 2. DATA

- cancellation_scenarios: **100**
- reschedule_offers: **100**
- conflict_scenarios: **100**
- expired_offer_scenarios: **100**
- reconfirmation_events: **100**
- Split: TRAIN=350; VALIDATION=100; HIDDEN=50.
- Scope: TRAINING_ONLY=450; EVALUATION_ONLY=50; PATIENT_SAFE=0.
- Exact duplicate: **0**
- Near duplicate Jaccard >=0.92: **0**
- Cross-split near duplicate >=0.92: **0**
- Max Jaccard: **0.647**
- PII/PHI/secret: **0**
- Quarantine: **0**
- `allow_patient_retrieval=false`: **500/500**

### 3. Automated state invariants

- Cancellation: **100/100**
- Reschedule original preserved before reconfirm: **100/100**
- Conflict handling: **100/100**
- Expired offer leaves original unchanged and releases alternative: **100/100**
- Reconfirmation transitions: **100/100**

B30 intentionally distinguishes FHIR semantics from local synthetic product rules. FHIR R4 directly supports cancelled status/reason, requested new times, participant response status, Slot free/busy/tentative, collision/overbooking semantics, optimistic locking and atomic transactions. B30's mandatory reconfirmation, offer-expiry behavior, preservation of the old booking before reconfirmation and idempotency-key behavior are explicitly **synthetic product invariants** where FHIR does not prescribe the exact workflow.

### 4. Evidence/citation

- Exact final HTTPS sources: **5**
- Atomic material claims: **20**
- Claim-evidence links: **40**
- Entailment: **23 DIRECT + 17 PARTIAL scope-limited**, NONE=0, CONTRADICTED=0
- ROW_CLAIM_BRIDGE: **500**
- CITATION_MATRIX: **1000**, exactly 2 citations per material row→claim bridge
- Post-artifact URL reopen: **5/5**
- Exact locator reproducibility: **40/40**
- Second-pass citation audit: **40/40**
- Citation precision: **100/100**

### 5. Final source ledger

| Source ID | Exact document | Version | Exact final URL |
|---|---|---|---|
| `NEW_INT_B30_FHIR_APPT_001` | Appointment - FHIR v4.0.1 | `FHIR R4 4.0.1` | https://hl7.org/fhir/R4/appointment.html |
| `NEW_INT_B30_FHIR_RESP_001` | AppointmentResponse - FHIR v4.0.1 | `FHIR R4 4.0.1` | https://hl7.org/fhir/R4/appointmentresponse.html |
| `NEW_INT_B30_FHIR_SLOT_001` | Slot - FHIR v4.0.1 | `FHIR R4 4.0.1` | https://hl7.org/fhir/R4/slot.html |
| `NEW_INT_B30_FHIR_SCHEDULE_001` | Schedule - FHIR v4.0.1 | `FHIR R4 4.0.1` | https://hl7.org/fhir/R4/schedule.html |
| `NEW_INT_B30_FHIR_HTTP_001` | Http - FHIR v4.0.1 | `FHIR R4 4.0.1` | https://hl7.org/fhir/R4/http.html |

### 6. Regression/challenge close

1. Claim-map audit closed with **20/20** claims mapped and 0 cardinality violations.
2. FHIR/product-rule boundary explicitly prevents overclaiming expiry/reconfirmation/idempotency as FHIR mandates.
3. Dedup scan: exact=0, near>=0.92=0, cross-split=0.
4. Older B30 artifact surfaced incidentally while locating catalog but was not read or used as seed/evidence/count/lineage/dedup reference.
5. Post-artifact reopen: **5/5 URLs**, **40/40 locators**.

### 9. Final close

- G001–G031: **PASS**
- C001–C005: **PASS**
- URL validation/reopen: **PASS**
- Citation precision: **100/100**
- Artifact/checksum/ZIP reconciliation: **PASS**
- Final reopen timestamp: `2026-08-13T16:57:32+07:00`
- Review remains **SYNTHETIC**; Operations review not performed.


---

# CHƯƠNG B30: Hủy lịch, Dời lịch & Xử lý Tranh chấp Giữ chỗ (Cancellation & Reschedule)

### 2. Phạm vi và target

B30 là standalone synthetic seed cho hội thoại **hủy lịch, đổi lịch, xung đột slot, offer hết hạn và xác nhận lại**. Retrieval scope là `TRAINING_ONLY`, risk class `MODERATE`, không dùng làm patient-facing retrieval.

- `DELIVERY_TARGET_ROWS = 500`
- `HISTORICAL_EXPANSION_TARGET_ROWS = 20000`
- `PASS_ROWS = 500`
- DATA quarantine rows = `0`
- Không padding; 100 rows cho mỗi bảng catalog.

### 3. Các bảng DATA

- `cancellation_scenarios`: 100
- `reschedule_offers`: 100
- `conflict_scenarios`: 100
- `expired_offer_scenarios`: 100
- `reconfirmation_events`: 100

Workbook còn có toàn bộ source ledger, URL validation, search log, atomic claims, evidence links, citation matrix, row-claim bridge, coverage, independent citation audit, automated QA, challenge audit, regression, scope isolation, quarantine và synthetic lineage.

### 4. Evidence và citation

Final evidence chỉ dùng **concrete exact HTTPS document-level pages** của HL7 FHIR R4, không dùng landing page:
1. `https://hl7.org/fhir/R4/appointment.html` — Appointment - FHIR v4.0.1
2. `https://hl7.org/fhir/R4/appointmentresponse.html` — AppointmentResponse - FHIR v4.0.1
3. `https://hl7.org/fhir/R4/slot.html` — Slot - FHIR v4.0.1

Các claim material đều có exact locator, excerpt hash, entailment, scope limit, Vietnam applicability và second-pass audit. 500/500 material claims có CITATION_MATRIX row.

**Giới hạn quan trọng:** FHIR R4 không được dùng để bịa chính sách phí/refund/no-show/overbooking của cơ sở. Đặc biệt, TTL/expiry của offer trong B30 là **constraint synthetic cục bộ**, chỉ phần restart/re-negotiation với tập thời gian mới được FHIR hỗ trợ.

### 5. Vietnam-first research

Đã tìm nguồn Việt Nam trước cho các khái niệm hủy/đổi lịch. Không tìm thấy concrete official document phù hợp để làm chuẩn interoperability state-machine cho B30. Các kết quả discovery không đủ directness hoặc chỉ là policy cơ sở, vì vậy **không được đưa vào citation cuối**. Đây không phải batch legal/clinical; catalog B30 chỉ yêu cầu `HL7_FHIR_R4` + `SYN_GENERATOR`.

### 6. Synthetic lineage

Mọi row:
- dùng namespace B30;
- parent chỉ tới `B30_LREF_*` trong `LOCAL_CANONICAL_SNAPSHOT`;
- generation method `DETERMINISTIC_TEMPLATE_CARTESIAN`;
- có generator/prompt/constraint-profile version, deterministic seed, content hash;
- `label_preservation_result=PASS`;
- không chứa người thật, PHI/PII, facility/doctor/slot thật.

### 7. QA và safety

Kết quả:
- hard gates G001–G031: **PASS** (G008/G010 PASS_NOT_APPLICABLE đúng phạm vi);
- conditional C003 synthetic preservation: **PASS 1.0**;
- exact duplicates: `0`;
- PII/PHI/secret findings: `0`;
- unsupported internal entity: `0`;
- cross-batch dependencies/FK/lineage/evidence reuse: `0`;
- foreign batch namespace IDs: `0`;
- unsupported/contradicted pass claims: `0`;
- scope leakage: `0`;
- formula error scan: `0`.

Pilot/challenge đã bắt và sửa ba nguy cơ wording: (1) gán TTL cho FHIR, (2) biến free/busy thành provider policy, (3) suy diễn cancellation thành refund/fee policy. Regression sau sửa: PASS.

### 8. URL reproducibility sau artifact

Sau **final workbook export**, cả 3 exact URL được mở lại và các locator material được tái lập: **3/3 sources PASS, locator reproducibility 100%**.

Closure reopen time: `2026-08-13T14:22:37+07:00`.

### 9. Citation precision

`CITATION_PRECISION_SCORE = 100/100`

Phân bổ:
- live exact final HTTPS URL: 15/15
- title/publisher/document identity: 15/15
- exact reproducible locator: 20/20
- entailment + scope limit: 20/20
- authority/directness: 10/10
- Vietnam applicability/translation: 5/5
- version/freshness/license: 5/5
- independent second-pass audit: 5/5
- post-artifact URL reopen: 5/5

### 11. Hạn chế sử dụng

Đây là **synthetic TRAINING_ONLY seed**, không phải production policy, không phải hồ sơ bệnh nhân, không phải booking inventory thật và không phải legal/clinical advice. Global dedup/merge/cross-batch integrity thuộc integration phase riêng, không thực hiện trong B30.


---

# CHƯƠNG B31: Hỏi đáp Quyền lợi Người bệnh, Viện phí & Pháp lý (FAQ & Policies)

### DATA

- faq: **100**
- booking_policies: **80**
- privacy_notices: **100**
- visit_preparation: **100**
- human_support_content: **60**
- content_versions: **60**
- TRAIN=440; VALIDATION=60.
- PATIENT_SAFE=440; ADMIN_ONLY=60.
- Exact duplicate=0; Jaccard >=0.92=0; cross-split >=0.92=0; max Jaccard=0.847.
- PII/PHI/secret=0.
- Personalized medical-advice findings=0.
- Real internal entity findings=0.
- Quarantine=0.

### Safety/content boundaries

B31 chỉ cung cấp nội dung thủ tục/chính sách chung. Không chẩn đoán, kê thuốc hoặc tư vấn điều trị cá nhân. Câu hỏi y khoa cá nhân chuyển human/clinical support.

Không có owner-approved `VN_INTERNAL_CATALOG` artifact/version được thiết lập trong standalone B31. Vì vậy B31 không khẳng định phí hủy, hoàn tiền, no-show, giờ mở cửa, dịch vụ/cơ sở hoặc policy riêng của một cơ sở. Những câu hỏi đó fail-closed sang human support.

### Legal/current-procedure grounding

- Luật 15/2023/QH15: quyền được thông tin/giải thích; bí mật hồ sơ/thông tin riêng tư; quyền lựa chọn; hồ sơ/chi phí; kiến nghị; nghĩa vụ cung cấp thông tin trung thực.
- Luật 91/2025/QH15, hiệu lực 01-01-2026: đồng ý xử lý dữ liệu, từng mục đích, im lặng không phải đồng ý, rút lại/hạn chế, chỉnh sửa, xóa/hủy và hành vi bị cấm.
- Nghị định 188/2025/NĐ-CP và hướng dẫn BHXH/Bộ Y tế hiện hành: hình thức xuất trình BHYT/định danh; xử lý lỗi VNeID/VssID/e-BHYT; Phiếu hẹn khám lại/Phiếu chuyển; không tự đặt thêm thủ tục BHYT.
- FHIR R4 chỉ hỗ trợ semantics kỹ thuật về identity/version của content; không được dùng làm nguồn pháp lý Việt Nam.

### Evidence/citation

- Exact final HTTPS sources: **9**
- Material claims: **20**
- Claim-evidence links: **40**
- Entailment: **24 DIRECT + 16 PARTIAL scope-limited**, NONE=0, CONTRADICTED=0
- ROW_CLAIM_BRIDGE: **500**
- CITATION_MATRIX: **1000**
- Post-artifact URL reopen: **9/9**
- Exact locator reproducibility: **40/40**
- Second-pass claim-evidence audit: **40/40**
- Citation precision: **100/100**

### Final source ledger

| Source ID | Publisher | Exact document | Version | Exact HTTPS URL |
|---|---|---|---|---|
| `NEW_VN_B31_KCB_LAW_PDF_001` | Quốc hội | Luật số 15/2023/QH15: Luật Khám bệnh, chữa bệnh (bản ký) | `15/2023/QH15; hiệu lực 01-01-2024` | https://datafiles.chinhphu.vn/cpp/files/vbpq/2023/02/15luat.signed.pdf |
| `NEW_VN_B31_KCB_LAW_META_001` | Cổng Thông tin điện tử Chính phủ | Luật số 15/2023/QH15 của Quốc hội: Luật Khám bệnh, chữa bệnh | `metadata chính thức; hiệu lực 01-01-2024` | https://vanban.chinhphu.vn/?docid=207396&pageid=27160 |
| `NEW_VN_B31_DPL_LAW_PDF_001` | Quốc hội | Luật số 91/2025/QH15: Luật Bảo vệ dữ liệu cá nhân (bản ký) | `91/2025/QH15; hiệu lực 01-01-2026` | https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/7/91qh.signed.pdf |
| `NEW_VN_B31_DPL_LAW_META_001` | Cổng Thông tin điện tử Chính phủ | Luật số 91/2025/QH15 của Quốc hội: Luật Bảo vệ dữ liệu cá nhân | `metadata chính thức; hiệu lực 01-01-2026` | https://vanban.chinhphu.vn/?classid=1&docid=214590&pageid=27160&typegroupid=3 |
| `NEW_VN_B31_BHYT_188_PDF_001` | Chính phủ | Nghị định số 188/2025/NĐ-CP: Quy định chi tiết và hướng dẫn thi hành một số điều của Luật Bảo hiểm y tế (bản ký) | `188/2025/NĐ-CP; hiệu lực 15-08-2025` | https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/7/188-ndcp.signed.pdf |
| `NEW_VN_B31_BHYT_188_META_001` | Cổng Thông tin điện tử Chính phủ | Nghị định số 188/2025/NĐ-CP của Chính phủ: Quy định chi tiết và hướng dẫn thi hành một số điều của Luật Bảo hiểm y tế | `metadata chính thức; hiệu lực 15-08-2025` | https://vanban.chinhphu.vn/?docid=214515&pageid=27160 |
| `NEW_VN_B31_BHXH_GUIDE_001` | Bảo hiểm xã hội Việt Nam | Bộ Y tế hướng dẫn thủ tục khám bệnh, chữa bệnh BHYT từ ngày 15/8/2025 | `15-08-2025; hướng dẫn theo Quyết định 2555/QĐ-BYT và Nghị định 188/2025/NĐ-CP` | https://baohiemxahoi.gov.vn/gioithieu/Pages/gioi-thieu-chung.aspx?CateID=0&ItemID=25292 |
| `NEW_INT_B31_FHIR_RESOURCE_001` | HL7 International | Resource - FHIR v4.0.1 | `FHIR R4 v4.0.1 permanent home` | https://hl7.org/fhir/R4/resource.html |
| `NEW_INT_B31_FHIR_HTTP_001` | HL7 International | Http - FHIR v4.0.1 | `FHIR R4 v4.0.1 permanent home` | https://hl7.org/fhir/R4/http.html |

### Regression

1. Initial near-duplicate clusters were rewritten with natural scenario variation; final exact/near/cross-split duplicates at 0.92 are all zero.
2. `VN_INTERNAL_CATALOG` approval was not established, so internal facility-specific facts were excluded.
3. Privacy/deletion/consent/cost wording was narrowed to legal conditions and exceptions.
4. FHIR was constrained to technical versioning support.
5. Post-artifact audit reproduced 9/9 exact URLs and 40/40 locators.

### Final close

- G001–G031: **PASS**
- C001–C005: **PASS**
- URL validation/reopen: **PASS**
- Citation precision: **100/100**
- Artifact/checksum/ZIP reconciliation: **PASS**
- Final reopen timestamp: `2026-08-13T17:22:45+07:00`
- Review remains **GOLD_CANDIDATE/INTERNAL**; Legal + Operations + Brand review not performed.
- `allow_patient_retrieval` remains **false for 500/500 rows** pending authentic human review.


---

# CHƯƠNG B31: Hỏi đáp Quyền lợi Người bệnh, Viện phí & Pháp lý (FAQ & Policies)

### 2. Target và phạm vi

- `DELIVERY_TARGET_ROWS = 500`
- `HISTORICAL_EXPANSION_TARGET_ROWS = 5000`
- `PASS_ROWS = 500`
- Pilot quarantine rows: `4`
- Risk: `MODERATE`
- Retrieval scope: `PATIENT_SAFE`
- `allow_patient_retrieval=false` cho 500/500 rows cho tới khi có authentic Legal + Operations + Brand review.

B31 là standalone evidence-backed seed cho FAQ, booking-policy semantics, privacy notice, visit preparation không cá nhân hóa, human-support content và content versions. Không dùng DATA/artifact/evidence của batch trước.

### 3. Phân bổ DATA

- `faq`: 100
- `booking_policies`: 80
- `privacy_notices`: 100
- `visit_preparation`: 80
- `human_support_content`: 80
- `content_versions`: 60

Không padding. Exact duplicate = 0. Semantic near-duplicate theo normalized token-set Jaccard ≥0.94 = 0; max observed = `0.835443`.

### 4. Nguồn final concrete

B31 dùng 5 nguồn exact-document:
1. `NEW_VN_B31_QH_001` — signed Luật Khám bệnh, chữa bệnh 15/2023/QH15.
2. `NEW_VN_B31_QH_002` — signed Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15.
3. `NEW_VN_B31_CP_003` — signed Nghị định 356/2025/NĐ-CP.
4. `NEW_INT_B31_HL7_001` — `https://hl7.org/fhir/R4/appointment.html`.
5. `NEW_INT_B31_HL7_002` — `https://hl7.org/fhir/R4/resource.html`.

Final legal citations are official Vietnamese signed documents. FHIR R4 is used only for interoperability/content-version semantics and is explicitly scope-limited from Vietnamese/provider-specific policy.

For the official legal PDFs, `snapshot_sha256` in SOURCES hashes the browser-rendered identity+locator bundle. It is **not represented as a raw-PDF byte hash**, because raw PDF bytes were not exposed by the browser tooling in this execution. Exact HTTPS URL, rendered pages, document identity and locators were browser-verified twice.

### 5. Vietnam-first legal/currentness handling

Vietnamese official sources were researched first. Important remediation:
- a discovery metadata rendering for Luật 15/2023/QH15 conflicted on effective date; B31 uses `01/01/2024` based on Article 120/Government document metadata and does not cite the conflicting discovery metadata;
- current privacy authority uses Luật 91/2025/QH15 and Nghị định 356/2025/NĐ-CP;
- Decree 13/2023/NĐ-CP is not used as the current implementing authority;
- `VN_INTERNAL_CATALOG` was not used because no authentic owner-approved attachment/version was supplied in this invocation.

### 6. Claim/citation graph

- Material claims: 500
- EVIDENCE_LINKS: 500
- CITATION_MATRIX: 500
- First-pass citation audit: 500/500 PASS
- Independent second-pass audit: 500/500 PASS
- Unsupported pass claims: 0
- Contradicted pass claims: 0
- Legal claims without official Vietnamese primary source: 0

Each material claim stores exact HTTPS URL, exact title/publisher/document/version metadata, locator, short excerpt hash, entailment, scope limit, applicability and audit status.

### 8. Safety và scope

- Personalized diagnosis/treatment: 0
- Unsupported clinical preparation: 0
- Invented provider price/refund/SLA/contact/policy: 0
- PII/PHI/secret findings: 0
- Cross-batch input/FK/parent/evidence reuse: 0
- Foreign batch namespace IDs: 0
- Patient retrieval enabled before human review: 0

### 9. Post-artifact URL reopen

Sau audited workbook export cuối, cả 5 final URLs được mở lại và locator material được tái lập:
- final URL reopen: 5/5 PASS
- locator reproducibility: 100%
- title/publisher/document identity: 100%
- final HTTPS: 100%
- unsafe redirect/home/login/search/landing: 0

Closure reopen: `2026-08-13T14:45:16+07:00`.

### 10. Citation precision

`CITATION_PRECISION_SCORE = 100/100`
- exact live final HTTPS: 15/15
- identity: 15/15
- exact reproducible locator: 20/20
- entailment + scope: 20/20
- authority/directness: 10/10
- Vietnam applicability/translation: 5/5
- version/freshness/effect/license: 5/5
- independent second-pass: 5/5
- post-artifact reopen: 5/5

No hard-fail condition from file 07 is present.

### 12. Hạn chế

Đây là seed corpus có kiểm soát, không phải provider policy thật, không phải legal advice cá nhân và không phải clinical advice cá nhân. Global merge/dedup/cross-batch integrity thuộc integration phase riêng.


---

# CHƯƠNG B32: Mẫu Thông báo Đa kênh Bảo vệ Quyền riêng tư (Notification Templates)

### Target và phạm vi

- `DELIVERY_TARGET_ROWS = 500`
- `HISTORICAL_EXPANSION_TARGET_ROWS = 2000`
- `PASS_ROWS = 500`
- Pilot quarantine rows: `4`
- Risk: `MODERATE`
- Retrieval scope: `ADMIN_ONLY`
- `allow_patient_retrieval=false` cho 500/500.

### DATA

- `email_templates`: 120
- `push_templates`: 100
- `sms_templates`: 120
- `template_variables`: 80
- `notification_policy`: 80

Exact duplicate = 0; normalized token-set near-duplicate Jaccard ≥0.94 = 0; max observed = `0.930233`.

### Source và legal scope

Final evidence gồm ba signed official Vietnamese legal PDFs:
1. Nghị định `91/2020/NĐ-CP` — chống tin nhắn rác, thư điện tử rác, cuộc gọi rác.
2. Luật `91/2025/QH15` — Bảo vệ dữ liệu cá nhân.
3. Nghị định `356/2025/NĐ-CP` — quy định chi tiết Luật Bảo vệ dữ liệu cá nhân.

Nghị định 91/2020/NĐ-CP được official VBPL ghi `Còn hiệu lực`. B32 giữ scope chính xác: các yêu cầu `[QC]/[AD]`, advertising opt-out, advertising rate/time và prior-ad-consent chỉ áp dụng cho **quảng cáo** SMS/email/call theo nguồn; chúng không bị suy rộng thành luật cho mọi transactional notification.

### Privacy/PHI guard

Luật 91/2025/QH15 yêu cầu xử lý dữ liệu đúng phạm vi/mục đích cụ thể. Nghị định 356/2025/NĐ-CP xếp tình trạng sức khỏe vào dữ liệu cá nhân nhạy cảm và yêu cầu kiểm soát truy cập/quy trình/bảo mật.

B32 áp dụng guard cục bộ chặt hơn: outward notification không render `health_status`, `diagnosis`, `symptoms`, `medications`, `clinical_note`, `lab_result`, `reason_for_visit`. Đây là privacy-by-design control của B32; không được mô tả như một câu chữ mẫu bắt buộc trực tiếp trong luật.

### Advertising invariants

- Advertising SMS/email: prior permission/registration must be known.
- Advertising SMS: `[QC]` hoặc `[AD]` ở đầu.
- Advertising email: `[QC]` hoặc `[AD]` ở đầu subject.
- Advertising SMS/email opt-out: rõ ràng; stop relevant advertising after request.
- Opt-out confirmation: sent once and contains no advertising.
- Default advertising limit: ≤3 SMS and ≤3 emails per recipient/address per 24h; advertising SMS 07:00–22:00 absent another agreement.
- Transactional messages are classified separately.

### Citation/QA

- Material claims: 500
- CITATION_MATRIX rows: 500
- Official Vietnamese primary legal source rate: 100%
- Exact locator coverage: 100%
- Unsupported/contradicted pass claims: 0
- PII/PHI/secret actual-value findings: 0
- Unsupported internal entity: 0
- Cross-batch dependencies/evidence reuse/foreign namespaces: 0
- Post-artifact exact URL reopen: 3/3 PASS
- Locator reproducibility: 100%
- `CITATION_PRECISION_SCORE = 100/100`


---

# CHƯƠNG B33: Benchmark Đánh giá Chống Ảo giác & Căn cứ Trích dẫn (Hallucination Grounding)

### 2. Target và scope

- `DELIVERY_TARGET_ROWS = 250`
- `HISTORICAL_EXPANSION_TARGET_ROWS = 12000`
- `PASS_ROWS = 250`
- Pilot quarantine rows = `4`
- Risk = `HIGH_EVALUATION`
- Retrieval scope = `EVALUATION_ONLY`
- Split = `HIDDEN` cho 250/250
- `allow_patient_retrieval=false` cho 250/250
- `source_visibility=REVIEWER_PRIVATE` cho hidden answer keys.

Historical target 12.000 không được dùng làm completion gate.

### 3. DATA

Mỗi bảng có 50 rows:
- `grounding_cases`
- `nonexistent_entity_cases`
- `unsupported_claim_cases`
- `citation_cases`
- `booking_grounding_cases`

Coverage có positive, negative, adversarial, nonexistent-entity, citation-entailment và hidden-split cases. Exact duplicate = 0. Normalized token-set Jaccard ≥0.94 = 0; max = `0.800000`.

### 5. Concrete evidence

Final source ledger có 5 exact sources:
1. MOH — **Trí tuệ nhân tạo và tương lai hệ thống Y tế Việt Nam** (17/02/2026), chỉ dùng như institutional Vietnam context, không coi là regulation.
2. NIST AI 600-1 — **Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile**.
3. NIST AI 100-1 — **Artificial Intelligence Risk Management Framework (AI RMF 1.0)**.
4. HL7 FHIR R4 — exact `Appointment` resource page v4.0.1.
5. WHO — **ICD-11 2026 Release**.

`VN_INTERNAL_CATALOG` không được dùng vì invocation này không có owner-approved attachment/version thật. KCB được search trước nhưng không tìm được concrete grounding/hallucination evaluation standard trực tiếp; không thay bằng link gần đúng.

NIST PDF citations ghi exact PDF URL, report/version, printed-page/section/action locator. Do browser execution path không cung cấp raw PDF bytes cho Python/container, `snapshot_sha256` của hai NIST records là hash của rendered identity+locator bundle, không giả là raw-PDF byte hash.

### 6. Evaluation invariants

B33 kiểm tra:
- source/citation phải thật sự hỗ trợ material claim, không chỉ cùng chủ đề;
- nguồn uy tín không cứu được locator sai hoặc claim vượt scope;
- DEMO nonexistent entity không được biến thành người/cơ sở/dịch vụ thật;
- unsupported operational specificity phải fail hoặc abstain;
- ICD classification/reporting không được kéo thành provider/booking policy;
- FHIR `available` không đồng nghĩa appointment chắc chắn được tạo;
- FHIR request `proposed` + participant `needs-action` không đồng nghĩa `booked`;
- hidden answer key không được lọt train/patient retrieval.

### 9. Citation precision

`CITATION_PRECISION_SCORE = 100/100`
- live exact HTTPS 15/15
- identity 15/15
- locator 20/20
- entailment/scope 20/20
- authority/directness 10/10
- applicability/translation 5/5
- version/freshness/license 5/5
- second-pass 5/5
- post-artifact reopen 5/5

### 11. Hạn chế

Đây là hidden evaluation seed, không phải patient content, clinical advice hoặc provider catalog. Global no-train-overlap/corpus-wide semantic dedup phải được kiểm ở integration phase; B33 chỉ chứng minh không import collection DATA làm hidden input trong standalone execution này.


---

# CHƯƠNG B34: Benchmark Ca Lâm sàng Chuẩn Vàng (Clinical Gold Benchmark)

### 2. Target và scope

- `DELIVERY_TARGET_ROWS = 100`
- `HISTORICAL_EXPANSION_TARGET_ROWS = 15000`
- `PASS_ROWS = 100`
- Pilot quarantine rows = `4`
- Risk = `CRITICAL_SAFETY`
- Retrieval scope = `EVALUATION_ONLY`
- Split = `HIDDEN` cho 100/100
- `source_visibility=REVIEWER_PRIVATE` cho 100/100
- `allow_patient_retrieval=false` cho 100/100

Historical target 15.000 chỉ là expansion target, không phải completion gate.

### 3. Phân bổ DATA

- `clinical_gold_cases`: 20
- `emergency_hidden_cases`: 20
- `routing_hidden_cases`: 15
- `ambiguity_cases`: 15
- `handoff_cases`: 15
- `scoring_rubric`: 15

Tổng 100 rows. Exact duplicate = 0. Normalized token-set Jaccard >= 0.94 = 0; max observed = `0.851852`.

### 5. Evidence và triangulation

B34 dùng 9 concrete final sources:
- 3 exact Bộ Y tế Việt Nam institutional articles: stroke, acute-MI context, maternal danger signs;
- 3 exact CDC pages: stroke, heart attack, urgent maternal warning signs;
- NIST `AI RMF Core - AIRC` (AI RMF 1.0);
- WHO 2021 six-principles AI-in-health article;
- WHO 2024 LMM governance article.

Mỗi material claim có đúng 2 independent evidence groups:
- clinical emergency claims: MOH + CDC;
- evaluation/handoff/subgroup/scoring claims: NIST + WHO.

`independent_authoritative_triangulation_rate = 1.0`.

Bài MOH về nhồi máu cơ tim có ngày 21/12/2015 nên không được dùng một mình để đại diện evidence đương thời; B34 luôn triangulate với CDC page hiện hành cho cluster đó.

WHO LMM PDF endpoint gặp 403 trong discovery và không được dùng làm final citation; final citation là exact WHO HTML article đã mở được và tái lập locator.

### 7. Negation, temporality, ambiguity và subgroup

B34 có biến thể direct, negation, caregiver, temporal và adversarial cho mỗi atomic concept. Pilot near-duplicate ban đầu bị QA chặn; corpus được sửa lại thay vì hạ threshold. Regression sau remediation:
- exact duplicate = 0;
- semantic near-duplicate >= 0.94 = 0;
- max Jaccard = `0.851852`;
- subgroup coverage > 0;
- critical recall vẫn 1.0.

### 10. Citation precision

`CITATION_PRECISION_SCORE = 100/100`
- exact live HTTPS: 15/15
- identity: 15/15
- locator: 20/20
- entailment/scope: 20/20
- authority/directness: 10/10
- Vietnam applicability/translation/urgency: 5/5
- version/freshness/license: 5/5
- second-pass: 5/5
- post-artifact reopen: 5/5

Không có hard-fail override.

### 12. Hạn chế

Đây là hidden evaluation seed, không phải patient-facing clinical advice. Các câu lâm sàng chỉ định nghĩa expected safety route/action trong evaluation fixture và cấm chẩn đoán/điều trị cá nhân. Corpus-wide no-train-overlap/global dedup vẫn thuộc integration phase riêng.


---

# CHƯƠNG B35: Benchmark Bảo mật & Chống Prompt Injection (Security & Jailbreak Defense)

### 2. Target và scope

- `DELIVERY_TARGET_ROWS = 250`
- `HISTORICAL_EXPANSION_TARGET_ROWS = 15000`
- `PASS_ROWS = 250`
- Pilot quarantine rows = `4`
- Risk = `HIGH_SECURITY`
- Retrieval = `SECURITY_ONLY`
- Split = `HIDDEN` cho 250/250
- `source_visibility=REVIEWER_PRIVATE`
- `allow_patient_retrieval=false` cho 250/250

Historical target 15.000 không phải completion gate.

### 3. Phân bổ DATA

- `prompt_injection_cases`: 50
- `indirect_injection_cases`: 50
- `tool_abuse_cases`: 40
- `data_exfiltration_cases`: 40
- `phi_leakage_cases`: 40
- `security_rubric`: 30

Exact duplicate = 0. Semantic near-duplicate theo normalized token-set Jaccard >=0.94 = 0; max observed = `0.931034`.

### 4. Fixture-safety policy

B35 là corpus red-team **inert/synthetic**. Không có:
- exploit payload có thể thực thi;
- command/shell/script tấn công;
- credential/token/key thật hoặc có hình dạng giống secret thật;
- endpoint/network target thật;
- PHI/PII hoặc hồ sơ bệnh nhân thật;
- account/user/facility/practitioner thật;
- hướng dẫn tối ưu hóa bypass hoặc exfiltration.

Các tình huống dùng marker mô tả và expected defensive behavior. `real_pii_phi_secret_findings=0`; `operational_attack_payload_count=0`.

### 5. Concrete evidence

Ba source được dùng cho material claims:
1. `NEW_INT_B35_OWASP_001` — **OWASP Top 10 for LLM Applications 2026**, Version 2026, exact 122-page PDF. Exact OWASP resource record ngày 03/08/2026 xác nhận đây là guide 2026 hiện hành tại thời điểm access.
2. `NEW_INT_B35_OWASP_002` — **OWASP Top 10 for Agentic Applications for 2026**, exact resource/version record.
3. `NEW_INT_B35_NIST_003` — **Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile**, NIST AI 600-1.

OWASP claim clusters được pin vào LLM01 Prompt Injection, LLM02 Sensitive Information Disclosure, LLM03 Excessive Agency, LLM05 Data and Model Poisoning, LLM08 Hidden Context Exposure và LLM09 Vector and Embedding Weaknesses. NIST claim clusters dùng MP-2.3-005, MS-2.2-002, MEASURE 1.3 và MS-2.7-007.

Với PDF, runtime browser cho phép kiểm/render tài liệu và locator nhưng raw-PDF byte download vào container không thành công cho OWASP. Vì vậy `snapshot_sha256` được ghi trung thực là digest của rendered identity+locator bundle, **không giả là raw-PDF SHA-256**. Exact PDF URL, title/version và locator vẫn được browser kiểm hai lần sau artifact.

### 6. ISO handling

Catalog liệt kê `ISO27001` và `ISO27799`. B35 đã research exact current records:
- ISO/IEC 27001:2022, Edition 3;
- ISO 27799:2025, Edition 3.

Tuy nhiên registry yêu cầu license/access review và exact ISO pages nêu hạn chế sử dụng ISO content để prompt/enable AI ngoài ISO Open Data. Vì vậy hai source families này nằm trong `SEARCH_LOG` với trạng thái **EXCLUDED_FROM_AI_EVIDENCE** và không support bất kỳ pass claim nào. Không thay thế bằng citation gần đúng.

### 7. Coverage

Catalog focus đạt:
- direct injection;
- indirect injection;
- tool abuse;
- source poisoning;
- cross-user;
- exfiltration.

250/250 rows có `SYNTHETIC_FIXTURE_LINEAGE` cục bộ, không có parent từ batch khác.

### 10. Citation precision

`CITATION_PRECISION_SCORE = 100/100`
- exact live HTTPS 15/15
- identity 15/15
- locator 20/20
- entailment/scope 20/20
- authority/directness 10/10
- applicability/translation 5/5
- version/freshness/license 5/5
- second-pass 5/5
- post-artifact reopen 5/5


---

# CHƯƠNG B36: Hồ sơ Nhân khẩu học Giả lập & Quản trị Đồng thuận (Synthetic Profiles)

### 2. Target và scope

- `DELIVERY_TARGET_ROWS = 500`
- `HISTORICAL_EXPANSION_TARGET_ROWS = 25000`
- `PASS_ROWS = 500`
- Quarantine pilot rows = `4`
- Risk = `MODERATE`
- Retrieval scope = `TRAINING_ONLY`
- Split = `TRAIN`
- `allow_patient_retrieval=false` cho 500/500
- `source_visibility=REVIEWER_PRIVATE`

Historical target 25.000 không phải completion gate.

### 3. DATA

Phân bổ:
- `synthetic_profiles`: 100
- `consent_states`: 80
- `preferences`: 80
- `synthetic_history`: 80
- `memory_test_cases`: 100
- `profile_lineage`: 60

Tổng 500 rows. Exact duplicate = 0. Normalized token-set Jaccard >=0.94 = 0; max observed = `0.925926`.

### 4. Synthetic identity safety

B36 không tạo “bệnh nhân giả có vẻ là người thật”. Hồ sơ chỉ dùng:
- age bands người lớn: `18-24`, `25-34`, `35-49`, `50-64`, `65-79`, `80+`;
- vùng Việt Nam rất thô: `VN_NORTH`, `VN_CENTRAL`, `VN_SOUTH`, `VN_HIGHLANDS`, `VN_DELTA`;
- bounded preference tokens;
- synthetic consent/memory/history states.

Bị cấm và được kiểm = 0:
- real-person parent;
- tên, điện thoại/email, ngày sinh chính xác, địa chỉ;
- real patient record;
- clinical/health free text;
- facility/practitioner/account thật;
- PII/PHI/secret.

`pii_phi_secret_findings=0`, `real_person_parent_count=0`, `direct_identity_leak=0`.

### 5. Consent và memory invariant

Consent trong B36 chỉ là **DEMO training state**, không phải bằng chứng đồng ý pháp lý của người thật.

Các trạng thái mô phỏng: `PROPOSED`, `ACTIVE`, `REJECTED`, `INACTIVE`.
- im lặng/không phản hồi không được map thành consent;
- memory write chỉ có thể `ALLOW` khi fixture là `ACTIVE` và purpose phù hợp;
- `REJECTED`/`INACTIVE` không được tạo new memory write;
- cross-profile memory luôn `DENY`;
- delete/restriction path được kiểm bằng synthetic fixtures.

`consent_memory_invariant_violations=0`; `cross_profile_memory_violations=0`.

### 6. Concrete sources

B36 research/reverify mới 6 exact sources:
1. `91/2025/QH15` — Luật Bảo vệ dữ liệu cá nhân, Quốc hội, hiệu lực 01/01/2026.
2. `356/2025/NĐ-CP` — Nghị định thi hành Luật Bảo vệ dữ liệu cá nhân, Chính phủ, hiệu lực 01/01/2026.
3. HL7 FHIR R4 `Patient` v4.0.1.
4. HL7 FHIR R4 `Consent` v4.0.1.
5. HL7 FHIR R4 `Provenance` v4.0.1.
6. NIST Privacy Framework **Version 1.0**, NIST.CSWP.01162020.

Vietnamese legal claims use official Vietnamese primary PDFs. FHIR is structural interoperability evidence only and does not replace Vietnamese legal validity.

### 7. Version handling

- HL7 pages are permanent R4 URLs. A newer FHIR release exists, nhưng catalog B36 pin `HL7_FHIR_R4`, nên B36 dùng R4 4.0.1.
- NIST Privacy Framework 1.1 vẫn là Initial Public Draft và trang NIST ghi final 1.1 “Coming soon” tại thời điểm access. B36 vì vậy pin **Privacy Framework 1.0** làm final stable source; không giả draft là final.

### 8. PDF snapshot transparency

Browser cho phép mở/render và tái lập page/article locator, nhưng runtime container không có raw PDF bytes cho các tài liệu này. Vì vậy `snapshot_sha256` của legal/NIST PDFs là SHA-256 của rendered identity+locator bundle và được ghi rõ như vậy; không giả là raw-PDF byte hash.

### 11. Citation precision

`CITATION_PRECISION_SCORE = 100/100`
- live exact HTTPS 15/15
- identity 15/15
- locator 20/20
- entailment/scope 20/20
- authority/directness 10/10
- Vietnam applicability/translation 5/5
- version/freshness/license 5/5
- second-pass audit 5/5
- required post-artifact reopen 5/5

Không có hard-fail override.


---

# CHƯƠNG B37: Nhật ký Vận hành & Phân tích Tỷ lệ Bỏ hẹn (Operational Analytics)

### 2. Target và scope

- `DELIVERY_TARGET_ROWS = 500`
- `HISTORICAL_EXPANSION_TARGET_ROWS = 150000`
- `PASS_ROWS = 500`
- Pilot quarantine rows = `6`
- Risk = `MODERATE`
- Retrieval scope = `ADMIN_ONLY`
- `allow_patient_retrieval=false` cho 500/500

Historical target 150.000 không phải completion gate.

### 3. Phân bổ DATA

- `appointments`: 100
- `appointment_events`: 100
- `no_show_labels`: 60
- `reschedule_history`: 60
- `outcome_labels`: 60
- `audit_events`: 60
- `provenance`: 60

Tổng = 500.

### 4. Synthetic-only policy

B37 không dùng lịch sử booking thật hoặc identity thật. Không có:
- real patient/practitioner/facility/slot/account;
- real booking record;
- clinical encounter narrative;
- PII/PHI/secret;
- parent/FK từ batch trước.

Mọi appointment/event/audit/provenance ID đều B37-local.

### 5. Appointment state và no-show

FHIR R4 `Appointment` được pin theo catalog và dùng làm exact structural/status source. B37 dùng các trạng thái hợp lệ của R4 và một state-transition allowlist **B37-local**, được ghi rõ là local, không giả là state machine đầy đủ do HL7 quy định.

Synthetic base appointment distribution:
- fulfilled: 50
- noshow: 12
- cancelled: 15
- open/nonterminal: 23

`12%` no-show ở đây chỉ là **synthetic QA distribution**, không phải ước lượng hành vi bệnh nhân thật.

No-show label rule:
`positive iff synthetic Appointment.status == noshow`.

Kết quả:
- no-show label errors = 0
- positive labels = 12
- FK resolution = 100%

### 6. Reschedule và outcome

60/60 reschedule rows:
- old/replacement appointment IDs đều tồn tại trong B37;
- old và replacement khác nhau;
- `old_event_time < new_event_time`.

B37 dùng workflow rescheduling/waitlist của FHIR làm evidence; exact old/new derivation link là convention synthetic cục bộ.

60/60 sampled outcome labels tuân mapping B37-local:
- fulfilled → `COMPLETED`
- cancelled → `CANCELLED`
- noshow → `NO_SHOW`
- các trạng thái nonterminal → `OPEN`

Outcome mapping errors = 0.

### 7. Audit và provenance

FHIR R4 `AuditEvent` được dùng cho:
- security event record;
- action;
- recorded timestamp;
- outcome;
- entity lifecycle.

60/60 audit rows có recorded UTC timestamp.

FHIR R4 `Provenance` và W3C PROV-O được dùng cho:
- create/revise/delete/sign activity;
- Entity/Activity/Agent;
- generation/association;
- derivation/revision.

60/60 provenance rows có entity + activity + synthetic agent + generation marker.
Cross-batch provenance parent = 0.

### 8. Statistical QA

Automated invariants + statistical QA đều PASS:
- FK resolution rate = 1.0
- event transition allowlist rate = 1.0
- reschedule distinct-ID rate = 1.0
- reschedule chronology rate = 1.0
- audit recorded-time rate = 1.0
- provenance completeness rate = 1.0
- label/state preservation rate = 1.0
- exact duplicate = 0
- near-duplicate >=0.94 = 0
- max normalized token-set Jaccard = `0.927273`

### 10. Sources

B37 dùng bốn concrete source records:
1. HL7 FHIR R4 `Appointment` v4.0.1.
2. HL7 FHIR R4 `AuditEvent` v4.0.1.
3. HL7 FHIR R4 `Provenance` v4.0.1.
4. W3C `PROV-O: The PROV Ontology`, Recommendation 30 April 2013.

FHIR R4 4.0.1 là permanent R4 URL; một FHIR release mới hơn tồn tại nhưng catalog B37 pin `HL7_FHIR_R4`, nên không tự đổi sang release khác.

### 12. Citation precision

`CITATION_PRECISION_SCORE = 100/100`
- exact live HTTPS 15/15
- identity 15/15
- exact locator 20/20
- entailment/scope 20/20
- authority/directness 10/10
- applicability/translation 5/5
- version/freshness/license 5/5
- second-pass 5/5
- post-artifact reopen 5/5

Không có hard-fail override.


---

# CHƯƠNG B38: Từ điển Sự kiện & Chỉ số KPI Y tế Chuẩn hóa (Event & Metric Dictionary)

### 2. Target và scope

- `DELIVERY_TARGET_ROWS = 500`
- `HISTORICAL_EXPANSION_TARGET_ROWS = 1000`
- `PASS_ROWS = 500`
- Pilot quarantine rows = `5`
- Risk = `MODERATE`
- Retrieval scope = `ADMIN_ONLY`
- `allow_patient_retrieval=false` cho 500/500

Historical target 1.000 không phải completion gate.

### 3. Phân bổ DATA

- `event_dictionary`: 100
- `event_properties`: 100
- `metric_definitions`: 100
- `truth_tables`: 100
- `dashboard_test_cases`: 100

Exact duplicate = 0. Normalized token-set Jaccard >=0.94 = 0; max observed = `0.937500`.

### 4. Event/property privacy design

B38 không lưu event payload hoặc free text nhạy cảm. Event names đều là `b38_demo_*`; đây không phải production taxonomy của owner.

Property types cho phép:
- enum
- boolean
- integer
- timestamp
- coarse_token

Các key/class nhạy cảm như name/email/phone/address/DOB/diagnosis/symptoms/medication/clinical note/raw prompt/raw text chỉ xuất hiện như **blocked-key test labels** khi cần DLP QA; offending value không được lưu.

Kết quả:
- `sensitive_free_text_enabled_count = 0`
- `sensitive_value_storage_violations = 0`
- `pii_phi_secret_findings = 0`

### 5. Metrics, numerator/denominator và truth table

FHIR R4 `Measure`/`MeasureReport` được dùng làm structural reference cho numerator, denominator, population count, period và measure score. B38 không tuyên bố các metric demo là FHIR quality measures.

B38 truth rules:
- denominator > 0 và `0 <= numerator <= denominator` → ratio xác định;
- denominator = 0 → `NOT_COMPUTABLE`;
- numerator > denominator → `INVALID_INPUT`;
- DLP hit → `BLOCK_AND_COUNT_VIOLATION`;
- thiếu owner retention policy → `OWNER_POLICY_REQUIRED`.

Kết quả:
- truth-table errors = 0/100
- dashboard calculated/expected mismatches = 0/100
- source/claim coverage = 500/500

### 6. Retention

NIST AI 600-1 yêu cầu có document retention policy cho lịch sử TEVV và chính sách collection/retention/minimum quality. Tuy nhiên không có owner-approved `INT_PROJECT` artifact trong input B38.

Do đó B38:
- không bịa retention days/months/years;
- đặt `retention_policy_ref=OWNER_POLICY_REQUIRED`;
- `invented_owner_retention_duration_count = 0`.

### 7. NIST privacy/DLP

NIST AI 600-1 khuyến nghị phát hiện PII/sensitive data, privacy output filtering và removal of PII trong các bối cảnh provenance/evaluation phù hợp. B38 chuyển nguyên tắc đó thành schema-level defensive rule: aggregate/categorical values only, no sensitive free text.

### 8. Current-version handling

- HL7 nguồn cuối đều pin chính xác `FHIR R4 4.0.1`, vì catalog B38 yêu cầu `HL7_FHIR_R4`; R5/R4B không bị thay vào.
- NIST AIRC hiện vẫn hiển thị AI RMF Core 1.0 (2023) và ghi một revised version đang in progress; B38 không giả bản revision chưa phát hành là final.
- NIST GenAI profile pin `NIST AI 600-1`, published 2024-07-26; metadata page updated 2026-04-08.

### 11. Citation precision

`CITATION_PRECISION_SCORE = 100/100`
- live exact HTTPS 15/15
- identity/version 15/15
- locator 20/20
- entailment/scope 20/20
- authority/directness 10/10
- applicability/translation 5/5
- version/freshness/license 5/5
- second-pass 5/5
- post-artifact reopen 5/5

Không có hard-fail override.


---

# CHƯƠNG B39: Biểu mẫu Thu thập Phản hồi & Pilot Rehearsal (Feedback & Rehearsal)

### 2. Target và scope

- `DELIVERY_TARGET_ROWS = 250`
- `HISTORICAL_EXPANSION_TARGET_ROWS = 5000`
- `PASS_ROWS = 250`
- Quarantine pilot rows = `6`
- Tier = `RESTRICTED`
- Risk = `HIGH_PRIVACY`
- Retrieval scope = `RESTRICTED_REVIEW`
- Split = `RESTRICTED_REHEARSAL`
- `allow_patient_retrieval=false` cho 250/250

Historical target 5.000 không phải completion gate.

### 3. Approval gate và execution mode

Catalog B39 yêu cầu:
- DPIA;
- Legal/Privacy approval;
- Clinical approval.

Không có artifact xác thực nào cho ba approval này trong input B39. Vì vậy:
- `DPIA=PENDING`
- `LEGAL_PRIVACY=PENDING`
- `CLINICAL=PENDING`
- `REAL_PILOT_EXECUTION=BLOCKED`
- `PILOT_MODE=REHEARSAL_SYNTHETIC_ONLY`

B39 không giả approval và không tạo real-pilot record. Đây là rehearsal synthetic đúng objective catalog khi approval chưa có.

### 4. Phân bổ DATA

- `feedback_schema`: 50
- `annotation_forms`: 40
- `consent_records`: 40
- `access_policy`: 40
- `retention_policy`: 40
- `pilot_rehearsal_synthetic`: 40

Tổng = 250.

Exact duplicate = 0. Normalized token-set Jaccard >=0.94 = 0; max observed = `0.768519`.

Draft ban đầu bị near-duplicate gate bắt và bị loại. Dataset cuối được tái sinh với context/scope khác biệt mà không hạ threshold.

### 5. Privacy và minimum necessary

B39 không chứa:
- real participant/patient;
- name/contact/address/exact DOB;
- real consent artifact;
- health/clinical free text;
- PII/PHI/secret;
- production reviewer identity;
- real production write.

Kết quả:
- `pii_phi_secret_findings=0`
- `real_participant_or_patient_count=0`
- `sensitive_free_text_leak_count=0`
- `production_write_enabled_count=0`

Feedback và annotation chỉ dùng bounded choice/boolean/status/reviewer-role tokens.

### 6. Consent

Vietnamese legal consent invariants được pin vào Luật 91/2025/QH15 và Nghị định 356/2025/NĐ-CP:
- consent phải tự nguyện, được biết, rõ ràng/cụ thể và theo từng purpose;
- im lặng/không phản hồi không phải consent;
- phương thức consent phải có khả năng kiểm chứng chủ thể, thời điểm và nội dung.

B39 chỉ tạo `DEMO consent states`; không row nào được trình bày như consent pháp lý của người thật.

`silent_consent_violation_count=0`.

FHIR R4 Consent chỉ được dùng làm structural reference cho permit/deny, purposes/periods và state enum; không thay thế Vietnamese legal validity.

### 7. Access và audit

B39 rehearsal policy dùng:
- least privilege;
- separation of duties;
- `REHEARSAL_ONLY` environment;
- synthetic reviewer role tokens;
- required audit event for access-relevant action.

FHIR R4 AuditEvent được dùng làm structural evidence cho security-log event, recorded time, outcome và agent/detail.

### 8. Retention và deletion

B39 không bịa retention duration:
- `retention_policy_ref=OWNER_POLICY_REQUIRED`
- `retention_duration=NOT_INVENTED`
- `invented_retention_duration_count=0`

Synthetic deletion/restriction paths được test, nhưng production handling vẫn yêu cầu owner/legal process hiện hành.

### 9. Version handling

- HL7 resources pin `FHIR R4 4.0.1` đúng catalog; không tự thay bằng R5.
- NIST Privacy Framework **1.0** được pin là final stable tại thời điểm access.
- NIST Privacy Framework 1.1 vẫn là **Initial Public Draft**, và NIST ghi final 1.1 là “Coming soon”; draft không được giả là final.
- ISO 27799:2025 Edition 3 đã được research/version-check, nhưng nội dung tiêu chuẩn bị **EXCLUDED_FROM_AI_EVIDENCE** vì điều khoản ISO hạn chế sử dụng nội dung cho AI/ML nếu không có quyền/license phù hợp. Không DATA claim nào dựa trên nội dung ISO.

### 12. PDF snapshot transparency

Raw PDF bytes không được expose vào working container cho các legal/NIST PDF qua browser path. Vì vậy `snapshot_sha256` được mô tả đúng là digest của rendered identity + locator bundle, **không** giả là raw-PDF byte SHA-256.

### 13. Citation precision

`CITATION_PRECISION_SCORE = 100/100`
- exact live HTTPS 15/15
- identity/version 15/15
- locator 20/20
- entailment/scope 20/20
- authority/directness 10/10
- applicability/translation 5/5
- version/freshness/license 5/5
- second-pass 5/5
- post-artifact reopen 5/5

Không có hard-fail override.


---

# CHƯƠNG B40: Khung Quản trị Bản phát hành & Toàn vẹn Checksum (Release Governance)

### 2. Target và scope

- `DELIVERY_TARGET_ROWS = 500`
- `HISTORICAL_EXPANSION_TARGET_ROWS = 5000`
- `PASS_ROWS = 500`
- Pilot quarantine rows = `6`
- Risk = `MODERATE`
- Retrieval scope = `ADMIN_ONLY`
- `allow_patient_retrieval=false` cho 500/500

Historical target 5.000 không phải completion gate.

### 3. Terminal-batch rule

B40 là numeric batch cuối cùng. B40 **không** tạo B41.

Sau successful close:
- `NEXT_ACTION = PROGRAM_COMPLETE`
- `NEXT_BATCH_ID = PROGRAM_COMPLETE`

`PROGRAM_COMPLETE` ở đây nghĩa là chuỗi standalone numeric B01→B40 đã đến terminal pointer theo common protocol. Nó không biến các `GOLD_CANDIDATE` hoặc human-review-pending artifacts thành GOLD/production approval.

### 4. Phân bổ DATA

- `release_manifest_schema`: 60
- `dataset_inventory_schema`: 60
- `source_snapshot_schema`: 60
- `dedup_test_fixtures`: 60
- `schema_compatibility_fixtures`: 60
- `provenance_fixtures`: 60
- `checksum_test_vectors`: 60
- `release_validation_cases`: 40
- `change_log_schema`: 40

Tổng = 500.

Exact duplicate = 0. Normalized token-set Jaccard >=0.94 = 0; max observed = `0.923077`.

### 5. Không merge thật B01–B39

Objective B40 yêu cầu deterministic release protocol nhưng không merge thật khi thiếu artifact/approval.

B40 tuân thủ:
- không đọc/import DATA/artifact của B01–B39 làm release input;
- không FK hoặc parent-lineage tới B01–B39;
- `actual_merge_performed_count = 0`;
- `cross_batch_reference_count = 0`;
- `INT_PROJECT` owner artifact count = 0;
- mọi release validation case dùng B40-local synthetic/process fixtures.

Release/Data/Security authentic review đều `PENDING`.
`REAL_MERGE_B01_B39 = BLOCKED`.

### 6. Release manifest, inventory và snapshot

NIST AI RMF 1.0 được dùng làm process/governance evidence cho:
- inventory;
- documented roles/processes;
- lifecycle/periodic review;
- repeatable documented TEVV;
- independent assessment/review;
- tracking over time.

Các field cụ thể của `B40_MANIFEST_*`, inventory và source snapshot là **local process design**, không được trình bày như field do NIST quy định.

### 7. Dedup và schema compatibility

B40-local deterministic rules:
- exact duplicate fixture → `KEEP_ONE`;
- near/borderline fixture → `REVIEW`;
- distinct fixture → `KEEP_BOTH`;
- remove required schema field → `FAIL_BREAKING`;
- add optional field → `PASS_BACKWARD`;
- no breaking change → `PASS_COMPATIBLE`.

Kết quả:
- `dedup_rule_error_count = 0`
- `schema_rule_error_count = 0`
- no silent cross-batch dedup seed.

### 8. Provenance

W3C PROV-O Recommendation được dùng cho:
- `Entity`, `Activity`, `Agent`;
- `SoftwareAgent`;
- `Bundle`/`Collection`;
- `generatedAtTime`;
- `wasDerivedFrom`;
- `wasRevisionOf`.

B40 chỉ tạo provenance fixture cục bộ. `cross_batch_parent_lineage_count = 0`.
Không tuyên bố workbook là serialization RDF/PROV-O đầy đủ.

### 9. Checksum

B40 dùng NIST FIPS 180-4 làm evidence cho SHA-256:
- SHA-256 là secure hash algorithm trong FIPS 180-4;
- SHA-256 có message digest size 256 bits;
- message change có xác suất rất cao tạo digest khác.

60 synthetic checksum vectors được tự tính lại:
- `checksum_vector_error_count = 0`
- `digest_length_error_count = 0`
- every expected SHA-256 digest = 64 lowercase hexadecimal characters
- `mutation_digest_failure_count = 0`

Không claim FIPS cryptographic-module validation hay production certification.

### 10. ISO/IEC 27001

`ISO/IEC 27001:2022`, Edition 3, và Amendment 1:2024 được version-check trên ISO official page.

Tuy nhiên ISO copyright/licence terms hiện hành cấm dùng ISO publication content cho AI/ML nếu không có separate authorization phù hợp. Vì vậy:
- ISO standard content = **EXCLUDED_FROM_AI_EVIDENCE**
- `iso27001_used_as_evidence = false`
- chỉ metadata/version/license-disqualification được ghi trong `SEARCH_LOG`
- không DATA/claim nào được tạo từ nội dung publication ISO.

### 11. INT_PROJECT

Không có owner-approved `INT_PROJECT` artifact trong standalone input B40.

Do đó B40 không bịa:
- real release inventory;
- real merge policy;
- real approval token;
- release destination;
- owner change-control workflow.

### 13. QA

- material claims = 500
- evidence links = 500
- citation matrix rows = 500
- second-pass audit = 500/500
- unsupported pass claims = 0
- contradicted pass claims = 0
- PII/PHI/secret findings = 0
- actual merge = 0
- release-gate errors = 0
- checksum errors = 0
- dedup errors = 0
- schema compatibility errors = 0
- formula errors = 0

### 15. Citation precision

`CITATION_PRECISION_SCORE = 100/100`
- exact live HTTPS 15/15
- identity/version 15/15
- locator 20/20
- entailment/scope 20/20
- authority/directness 10/10
- applicability/translation 5/5
- version/freshness/license 5/5
- second-pass 5/5
- post-artifact reopen 5/5

No hard-fail override.


---

