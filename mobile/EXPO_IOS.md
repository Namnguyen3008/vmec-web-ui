# Chạy mobile trên iOS bằng Expo

Hướng dẫn chạy app `mobile/` (Expo Router, SDK 54) trên iOS — chủ yếu qua
**Expo Go** (không cần máy Mac). Có thêm mục riêng cho **iOS Simulator**
(cần máy Mac + Xcode).

## Yêu cầu

- Node.js 20+ và npm
- Điện thoại iPhone + máy tính chạy `npm start` **cùng một mạng Wi-Fi**
- App **Expo Go** cài từ App Store trên iPhone
  - ⚠️ Expo Go trên App Store hiện chỉ hỗ trợ **Expo SDK 54**. Dự án này đã
    ghim đúng SDK 54 (`mobile/package.json`) — không nâng cấp `expo` lên
    bản mới hơn nếu không đã thống nhất trước, vì app sẽ không mở được
    trong Expo Go.
- Backend đang chạy (mặc định cổng 5000), xem `mobile/README.md`

## Chạy qua Expo Go (khuyên dùng, không cần Mac)

```bash
cd mobile
npm install
npm start
```

Nếu `npm install` báo lỗi `ERESOLVE` (xung đột peer dependency giữa
`react@19.1.0` và `react-dom` mà `expo-router` kéo theo cho phần web), chạy:

```bash
npm install --legacy-peer-deps
```

1. Terminal hiện mã QR.
2. Trên iPhone: mở app **Camera** (không phải Expo Go), quét mã QR →
   chọn thông báo mở bằng Expo Go.
3. Đợi bundle JS tải xong, app sẽ hiện trên điện thoại.

### Nếu máy tính và điện thoại không cùng thấy nhau (mạng công ty/VPN/firewall)

Dùng chế độ tunnel:

```bash
npx expo start --tunnel
```

Lần đầu dùng `--tunnel`, Expo có thể yêu cầu cài thêm gói `@expo/ngrok` —
đồng ý cài khi được hỏi.

## Cấu hình API URL cho thiết bị thật

Base URL đọc từ `EXPO_PUBLIC_API_URL` trong `mobile/.env`. Với Expo Go chạy
trên iPhone thật, `localhost` **không** trỏ tới máy tính — phải dùng IP LAN
của máy chạy backend, ví dụ:

```
EXPO_PUBLIC_API_URL=http://192.168.1.10:5000
```

Lấy IP LAN: Windows → `ipconfig` (tìm `IPv4 Address`). Sau khi đổi `.env`,
restart `npm start`.

## Chạy trên iOS Simulator (cần máy Mac + Xcode)

Chỉ khả dụng nếu bạn đang trên macOS đã cài Xcode:

```bash
cd mobile
npm install
npm run ios
```

Với Simulator, `EXPO_PUBLIC_API_URL=http://localhost:8000` vẫn dùng được
bình thường (khác với thiết bị thật).

## Sự cố thường gặp

- **Expo Go báo "Project is incompatible with this version of Expo Go"**:
  Expo Go trên máy đang khác SDK 54 — gỡ cài lại Expo Go từ App Store để
  lấy đúng bản mới nhất hỗ trợ SDK 54, đừng nâng SDK của dự án.
- **App mở nhưng không gọi được API**: kiểm tra lại `EXPO_PUBLIC_API_URL`
  có phải IP LAN (không phải `localhost`) và backend có đang lắng nghe
  `0.0.0.0` thay vì chỉ `127.0.0.1`.
- **Quét QR không phản ứng**: đảm bảo điện thoại và máy tính cùng mạng
  Wi-Fi, hoặc dùng `--tunnel` như trên.
