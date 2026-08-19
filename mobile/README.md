# Mobile — MedAgent AI

Expo (React Native, TypeScript, Expo Router) — bản mobile, gọi cùng backend Flask với
`frontend/`. Giao diện dựng từ Figma (`c2sN13nHkKK8O1YdW5xvhk`, page "Bản mobile").

## Yêu cầu

- Node.js 20+ và npm
- Backend đang chạy ở `backend/` (mặc định cổng 5000)
- Expo Go app (iOS/Android) để chạy trên máy thật, hoặc simulator/emulator

## Cài đặt & chạy

```bash
cd mobile
npm install
npm start
```

Quét mã QR bằng Expo Go, hoặc:

```bash
npm run android
npm run ios     # cần macOS
```

## Cấu hình API

Base URL đọc từ biến môi trường `EXPO_PUBLIC_API_URL` (file `.env`, mặc định
`http://localhost:5000`). Lưu ý `localhost` chỉ đúng khi chạy trên iOS
Simulator; với các mục tiêu khác cần đổi giá trị này trong `.env`:

- **Android Emulator**: dùng `http://10.0.2.2:5000`
- **Thiết bị thật (Expo Go)**: dùng IP LAN của máy chạy backend, ví dụ
  `http://192.168.1.10:5000`

## Cấu trúc

```
mobile/
├── app/                    # màn hình (Expo Router, file-based routing)
│   ├── _layout.tsx         # Stack + AuthProvider
│   ├── index.tsx           # placeholder sau đăng nhập
│   ├── login.tsx
│   └── register.tsx
├── src/
│   ├── components/
│   │   ├── icons/           # MascotIcon, GoogleIcon (SVG port từ Figma)
│   │   └── ui/               # Button, TextField, Checkbox
│   ├── lib/
│   │   ├── api/client.ts     # apiFetch + ApiError, cùng envelope {data}/{error} với backend
│   │   └── auth/              # types, auth-service, AuthContext (SecureStore)
│   └── theme/colors.ts       # design token trích từ Figma
├── assets/auth/              # ảnh mascot tải từ Figma (không hotlink URL tạm)
├── app.json
└── .env                      # EXPO_PUBLIC_API_URL (không commit giá trị thật)
```

## Đã implement

- Đăng nhập (`app/login.tsx`) và Đăng ký (`app/register.tsx`), gọi
  `/api/v1/auth/{login,register}` giống `frontend/src/lib/auth`.
- Trang chủ (`app/index.tsx`, Figma node 46:945) — lời chào, lịch hẹn sắp tới
  (dữ liệu tĩnh minh hoạ), truy cập nhanh, chatbot FAB (→ `/assistant`), bottom
  nav (component dùng chung `src/components/layout/BottomNavBar.tsx`). Đích
  điều hướng "Danh mục Khoa" → `/departments`, "Hồ sơ Bệnh án" → `/records`;
  các đích còn lại (chi tiết lịch hẹn, lịch sử đặt khám, tài khoản, thông báo)
  để TODO vì màn tương ứng chưa có.
- Hồ sơ bệnh án (`app/records.tsx`, Figma node 46:446) — thẻ thông tin cá
  nhân (tên + giới tính lấy từ `profile` thật; mã bệnh nhân suy ra từ
  `profile.id`; nhóm máu/chiều cao/cân nặng để "Chưa cập nhật" vì backend
  chưa có các trường này — không bịa số liệu y tế), card "Mục đích khám hiện
  tại" và danh sách lịch sử khám đều là dữ liệu tĩnh minh hoạ (chưa có API
  triage/lịch sử). Dùng chung `BottomNavBar` với tab "Hồ sơ" active.
- Danh mục Khoa (`app/departments.tsx`, Figma node 75:2) — danh sách 7 chuyên
  khoa tĩnh. 4/7 icon dùng `lucide-react-native` (Brain, Baby, Bone,
  HeartPulse — khớp glyph); 3 icon còn lại (Nha khoa, Y cổ truyền, Tiêu hóa -
  Gan mật) không có icon lucide nào khớp nên tự viết component SVG từ path
  gốc Figma (`src/components/icons/{Dental,TraditionalMedicine,
  GastroHepatology}Icon.tsx`). Bấm vào từng khoa để TODO vì chưa có màn danh
  sách bác sĩ theo khoa.
- Trợ lý AI (`app/assistant.tsx`, Figma node 46:638) — giao diện chat với hội
  thoại mẫu tĩnh và card "Thông tin đặt lịch" (chọn ngày/giờ là UI cục bộ).
  Gửi tin nhắn chỉ echo lại cục bộ; xác nhận đặt lịch và các gợi ý nhanh để
  TODO vì chưa có API chat/đặt lịch qua trợ lý AI.
- QR Check-in (`app/qr-checkin.tsx`, Figma node 46:731) — mã QR thật (tạo
  bằng `react-native-qrcode-svg`, encode `profile.id` + nonce) thay cho ảnh
  QR tĩnh trong thiết kế; "Làm mới mã QR" đổi nonce để có mã mới. Card thông
  tin bệnh nhân lấy từ `profile`. Hiện **chưa có route nào điều hướng tới màn
  này** (Trang chủ chưa có điểm liên kết tới QR check-in trong Figma) — vào
  bằng cách gõ thẳng URL `/qr-checkin` lúc dev.
- Hướng dẫn di chuyển (`app/directions.tsx`, Figma node 46:343) — card thông
  tin điểm đến, sơ đồ tầng (ảnh minh hoạ tải về `assets/directions/floor-map.jpg`
  + marker vị trí vẽ đè), timeline 4 bước di chuyển. Toàn bộ là dữ liệu tĩnh
  minh hoạ (chưa có API sơ đồ/chỉ đường thật). Figma đánh dấu đây là màn
  "task-focused" (thay cho BottomNavBar cố định) nên **không có
  `BottomNavBar`**, và cũng **chưa có route nào điều hướng tới màn này**
  (tương tự `/qr-checkin`) — vào bằng cách gõ thẳng URL `/directions` lúc dev.
- Còn lại trong Figma: Khai báo thông tin sức khỏe (46:248) chưa được
  implement.
