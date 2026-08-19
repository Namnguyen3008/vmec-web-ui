# Design tokens — MedAgent AI (từ Figma `c2sN13nHkKK8O1YdW5xvhk`)

Trích xuất bằng Figma REST API (fills/strokes/typography) từ các frame chính: landing, login, chat, dashboard điều phối.

## Màu sắc

| Token | Hex | Dùng cho |
|---|---|---|
| `primary-900` | `#003240` | Heading lớn, nền footer, nền sidebar tối |
| `primary-700` | `#27657b` | Nút chính, link, trạng thái active, viền nhấn |
| `primary-400` | `#629cb3` | Icon nền nhạt, nút phụ, accent nhạt |
| `accent-cyan` | `#baeaff` / `#c4eaea` | Nền banner thông tin, badge nhạt |
| `accent-orange` | `#d28054` (nền nhạt `#914c24`/`#501e00` chữ) | Card AI Insight, cảnh báo phụ |
| `warning` | `#ff8f00` | Badge cảnh báo |
| `danger` | `#ba1a1a` | Cấp cứu, lỗi, badge khẩn cấp |
| `text-primary` | `#181c1c` | Chữ chính |
| `text-secondary` | `#3d4949` | Chữ phụ / mô tả |
| `text-muted` | `#6d7979` | Placeholder, label phụ |
| `border` | `#dfe3e3` | Viền input/card |
| `border-strong` | `#bdc9c9` | Viền đậm hơn (bảng, chia cột) |
| `surface` | `#ffffff` | Nền card |
| `bg` | `#f6fafa` | Nền trang |
| `bg-muted` | `#f0f4f4` / `#e5e9e8` | Nền phụ, hover |

## Typography

Font: **Inter** (400/500/600/700).

| Cỡ chữ | Dùng cho |
|---|---|
| 48 (bold/800) | Hero heading lớn |
| 30 (semibold) | H1 trang |
| 24 (semibold) | H2 section |
| 20 (bold) | H3 card |
| 16 (semibold/bold) | Tên mục, label quan trọng |
| 14 (regular/medium) | Body text |
| 12 (regular/semibold) | Caption, badge, label nhỏ |

## Bo góc

- `9999px` — pill: badge, nút chính
- `24px` — card lớn (hero image, panel nổi bật)
- `16px` — card trung
- `12px` — card nhỏ / input
- `8px` — input, button nhỏ

## Nguồn ảnh tham chiếu

- `public/` — trang chủ công khai + login standalone
- `patient/` — cổng bệnh nhân: login, dashboard, chat AI, hướng dẫn di chuyển
- `doctor/` — dashboard lâm sàng bác sĩ (3 phần: header / body / action bar dưới)
- `staff/` — cổng lễ tân/điều phối: duyệt AI, lịch trình bác sĩ, quản lý bệnh nhân
