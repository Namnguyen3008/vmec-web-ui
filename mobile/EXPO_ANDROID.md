# Chạy mobile trên Android bằng Expo

Hướng dẫn chạy app `mobile/` (Expo Router, SDK 54) trên Android — qua
**Expo Go** (điện thoại thật, không cần cài Android Studio) hoặc
**Android Emulator** (cần Android Studio).

## Yêu cầu

- Node.js 20+ và npm
- App **Expo Go** cài từ Google Play trên điện thoại Android
  - ⚠️ Expo Go trên Play Store hiện chỉ hỗ trợ **Expo SDK 54**. Dự án này
    đã ghim đúng SDK 54 (`mobile/package.json`) — không nâng cấp `expo`
    lên bản mới hơn nếu không đã thống nhất trước.
- Backend đang chạy (mặc định cổng 5000), xem `mobile/README.md`

## Chạy qua Expo Go (điện thoại thật)

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
2. Mở app **Expo Go** trên điện thoại Android → chọn **Scan QR code** →
   quét mã QR trong terminal.
3. Đợi bundle JS tải xong, app sẽ hiện trên điện thoại.

Yêu cầu điện thoại và máy tính **cùng một mạng Wi-Fi**. Nếu không thấy
nhau (mạng công ty/trường có AP/client isolation, VPN, firewall), dùng
chế độ tunnel:

```bash
npx expo start --tunnel
```

Lần đầu dùng `--tunnel`, Expo có thể yêu cầu cài thêm gói `@expo/ngrok` —
đồng ý cài khi được hỏi.

## Chạy trên Android Emulator (cần Android Studio)

1. Cài [Android Studio](https://developer.android.com/studio), tạo sẵn
   một AVD (Android Virtual Device) qua Device Manager và khởi động nó.
2. Chạy:

   ```bash
   cd mobile
   npm install
   npm run android
   ```

   Expo sẽ tự cài Expo Go vào emulator (nếu chưa có) và mở app.

   Hoặc: đang chạy `npm start` sẵn → nhấn phím `a` trong terminal để mở
   trên emulator đang bật.

## Cấu hình API URL

Base URL đọc từ `EXPO_PUBLIC_API_URL` trong `mobile/.env`. Giá trị cần
đổi tùy theo nơi chạy app — **khác với iOS Simulator**, `localhost`
**không** dùng được cho cả emulator lẫn thiết bị thật trên Android:

- **Android Emulator**: dùng `http://10.0.2.2:5000` (địa chỉ đặc biệt
  emulator dùng để trỏ về máy host)
- **Thiết bị Android thật (Expo Go)**: dùng IP LAN của máy chạy backend,
  ví dụ `http://192.168.1.10:5000` (lấy bằng `ipconfig` trên Windows,
  tìm `IPv4 Address` của adapter Wi-Fi đang dùng)

Sau khi đổi `.env`, restart `npm start`.

## Sự cố thường gặp

- **"There was a problem running the requested app" / không kết nối
  được tới Metro**: thường do điện thoại và máy tính không cùng mạng
  hoặc mạng có client isolation (phổ biến ở Wi-Fi trường/công ty) — dùng
  `npx expo start --tunnel`. Kiểm tra thêm Windows Firewall có chặn
  Node.js không (`netsh advfirewall firewall show rule name=all`).
- **App mở nhưng không gọi được API**: kiểm tra lại `EXPO_PUBLIC_API_URL`
  đúng theo mục tiêu (emulator dùng `10.0.2.2`, thiết bị thật dùng IP
  LAN, không phải `localhost`), và backend có lắng nghe `0.0.0.0` thay
  vì chỉ `127.0.0.1`.
- **Emulator chạy chậm/không có Google Play**: chọn AVD dùng system
  image có Google Play (cần cho một số thư viện), và bật tính năng ảo
  hóa phần cứng (Hyper-V/HAXM) trong BIOS nếu Android Studio báo thiếu.
- **`npm run android` báo không tìm thấy `adb`/thiết bị**: đảm bảo
  emulator đã khởi động trước, hoặc thiết bị thật đã bật **USB
  debugging** và kết nối qua cáp USB (trường hợp không dùng Expo Go mà
  build dev client).
