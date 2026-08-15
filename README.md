# Frontend — MedAgent AI (Y tế X)

Next.js 16 (App Router, TypeScript, Tailwind CSS v4) — giao diện dựng lại từ Figma
(`c2sN13nHkKK8O1YdW5xvhk`) cho 3 khu vực: bệnh nhân, bác sĩ, lễ tân/điều phối, cùng
các trang công khai (trang chủ, đăng nhập, đăng ký).

## Yêu cầu

- Node.js 20+ và npm

## Cài đặt & chạy

```bash
cd frontend
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Các lệnh khác

```bash
npm run build   # build production (kiểm tra type + lint tự động qua Next.js)
npm run start   # chạy bản build production
npm run lint    # ESLint
npx tsc --noEmit  # type-check riêng, không build
```

## Cấu trúc route

| Route | Vai trò | Mô tả |
|---|---|---|
| `/` | công khai | Trang chủ giới thiệu |
| `/login`, `/register` | bệnh nhân | Đăng nhập / đăng ký cổng bệnh nhân |
| `/staff-login` | nhân viên | Đăng nhập dành cho bác sĩ / lễ tân |
| `/dashboard` | bệnh nhân | Trang chủ sau đăng nhập |
| `/chat` | bệnh nhân | Hội thoại với AI Agent: làm rõ → gợi ý chuyên khoa → chọn lịch → xác nhận |
| `/bookings`, `/bookings/[id]/directions` | bệnh nhân | Lịch sử đặt khám & hướng dẫn di chuyển đến phòng khám |
| `/records` | bệnh nhân | Hồ sơ bệnh án (placeholder) |
| `/profile` | bệnh nhân | Xem và cập nhật thông tin cá nhân thật qua `GET/PUT /api/v1/auth/me` |
| `/doctor` | bác sĩ | Dashboard lâm sàng: hàng đợi khám + phân tích AI |
| `/approvals` | lễ tân/điều phối | KPI + hàng chờ duyệt lịch do AI khởi tạo (HITL) |
| `/schedule` | lễ tân/điều phối | Lịch trình bác sĩ theo khung giờ |
| `/patients` | lễ tân/điều phối | Quản lý & hồ sơ bệnh nhân trong ngày |

`(patient)`, `(doctor)`, `(staff)` trong `src/app/` là route groups — không ảnh
hưởng URL, chỉ dùng để tách layout/nav riêng cho từng khu vực.

## Cấu trúc thư mục chính

```
src/
  app/                  routes (App Router)
  components/
    auth/                LoginForm, RegisterForm, AuthTopBar
    chat/                UI hội thoại (ChatBubbles, ProgressTracker, SpecialtyCard...)
    doctor/              QueueTimeline, ClinicalAIPanel
    staff/               KpiCard, ApprovalCard, ScheduleGrid, PatientTable...
    landing/             NavBar, Footer cho trang công khai
    layout/              PatientHeader, DoctorShell, StaffShell, MedicalDisclaimer
    ui/                  Button, Badge, Card, Logo (design system dùng chung)
  lib/
    api/                 HTTP client, contract, mapper và API theo miền
    auth/session.ts      Phiên đăng nhập trong sessionStorage
  app/globals.css        design tokens (@theme) trích xuất từ Figma
```

## Cấu hình API

Sao chép `.env.example` thành `.env.local` và cấu hình URL backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Khi backend local chạy `AUTH_MODE=dev_anonymous`, có thể thêm
`NEXT_PUBLIC_DEV_USER_ID` và `NEXT_PUBLIC_DEV_USER_ROLE`. Không dùng các biến dev
identity này ở production.

HTTP client chung tự gắn Bearer/dev identity, `X-Request-Id`, timeout, bóc envelope
`{ data }`, chuẩn hóa lỗi và map response `snake_case` sang model `camelCase`.

## Luồng đăng nhập theo vai trò

- `PATIENT` đăng nhập tại `/login` và được chuyển tới `/dashboard`.
- `DOCTOR` đăng nhập tại `/staff-login` và được chuyển tới `/doctor`.
- `RECEPTIONIST` đăng nhập tại `/staff-login` và được chuyển tới `/approvals`.

Các route nghiệp vụ gọi `/api/v1/auth/me` trước khi render để xác minh profile và role thật từ backend.
HTTP client tự refresh token khi gần hết hạn hoặc thử lại một lần sau lỗi 401. Nút đăng xuất gọi backend,
sau đó luôn xóa session trong tab. Role `ADMIN` có trong mô hình dữ liệu nhưng chưa có cổng frontend riêng.

## Ghi chú quan trọng

- **Design system**: màu sắc/typography/bo góc lấy từ Figma qua REST API, khai báo
  qua `@theme` trong `src/app/globals.css` (`figma/DESIGN.md` ghi lại bảng token).
  Ưu tiên dùng token có sẵn (`text-primary-700`, `text-h2`, `rounded-card`...) thay
  vì hex/px tùy ý.
- **Dữ liệu**: login/register, chat REST, checkout đặt lịch, hàng chờ duyệt của lễ tân,
  danh sách lịch hẹn bệnh nhân và lịch `CONFIRMED` của bác sĩ đã nối API thật. Chuông
  thông báo dùng danh sách chưa đọc kết hợp SSE. Dashboard tổng quan, lịch điều phối
  và quản lý bệnh nhân vẫn còn dữ liệu mẫu cho tới khi backend có hợp đồng tương ứng.
- **Ảnh minh họa**: khối "floor map" ở `/bookings/[id]/directions` và hero landing
  là placeholder CSS/SVG, cần thay bằng asset thật (sơ đồ tầng, ảnh minh họa) trước
  khi deploy.
- **Tham chiếu Figma**: ảnh chụp từng màn hình lưu ở `figma/{public,patient,doctor,staff}/`.
