/**
 * Tách phần danh sách khung giờ khám ra khỏi nội dung tư vấn của AI.
 *
 * Backend trả `assistant_message.content` gồm cả phần tư vấn y tế lẫn danh sách
 * khung giờ dạng bullet, ví dụ:
 *
 *   "Da đầu có nhiều vảy nhờn ... bạn nên được bác sĩ thăm khám trực tiếp.
 *
 *    Bạn có thể khám vào các khung giờ sau:
 *
 *    • BS. Lê Văn Đạt (Khoa Da liễu) — 08:00, 11/08/2026
 *      Bệnh viện Đa khoa Quốc tế Vinmec Smart City | Sẽ được thông báo
 *
 *    *Các khung giờ được chọn là những lịch trống sớm nhất ..."
 *
 * Danh sách khung giờ được FE render bằng component `DoctorSlotSelector`
 * (dữ liệu cấu trúc từ API), nên phần text này không hiển thị lại trong bubble
 * chat để tránh trùng lặp thông tin.
 */

const OFFER_HEADER_PATTERN = /Bạn có thể (?:khám vào các )?khung giờ sau/i;
const OFFER_BULLET_PATTERN = /^[•\-*]\s*BS\./i;

export interface SplitChatContent {
  /** Phần tư vấn y tế hiển thị trong bubble chat */
  advice: string;
  /** Phần danh sách khung giờ đã tách ra (null nếu không có) */
  offerSection: string | null;
}

/** Tách phần danh sách khung giờ ra khỏi nội dung AI. */
export function splitOfferSection(content: string): SplitChatContent {
  const lines = content.split(/\r?\n/);
  let cutIndex = lines.findIndex((line) => OFFER_HEADER_PATTERN.test(line.trim()));

  if (cutIndex === -1) {
    const bulletIndex = lines.findIndex((line) => OFFER_BULLET_PATTERN.test(line.trim()));
    if (bulletIndex >= 0) {
      // Không có dòng tiêu đề: cắt từ dòng bullet. Nếu dòng không trống ngay phía
      // trên kết thúc bằng ":" (tiêu đề dạng khác), cắt luôn dòng tiêu đề đó.
      cutIndex = bulletIndex;
      let prev = cutIndex - 1;
      while (prev >= 0 && lines[prev].trim() === "") prev -= 1;
      if (prev >= 0 && lines[prev].trim().endsWith(":")) cutIndex = prev;
    }
  }

  if (cutIndex === -1) {
    return { advice: content.trim(), offerSection: null };
  }

  return {
    advice: lines.slice(0, cutIndex).join("\n").trim(),
    offerSection: lines.slice(cutIndex).join("\n").trim(),
  };
}

/** Kiểm tra nhanh nội dung AI có chứa phần danh sách khung giờ hay không. */
export function containsOfferSection(content: string): boolean {
  if (OFFER_HEADER_PATTERN.test(content)) return true;
  return content.split(/\r?\n/).some((line) => OFFER_BULLET_PATTERN.test(line.trim()));
}
