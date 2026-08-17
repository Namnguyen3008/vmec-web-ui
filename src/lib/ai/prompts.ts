/**
 * Medical System Prompt Templates for 2-Stage Clinical LLM Architecture
 * - LLM 1: Clinical Judge (Thẩm định mức độ hoàn thiện của từng slot cốt lõi)
 * - LLM 2: Clinical Interrogator (Hỏi tuần tự từng slot & sinh 4 Quick-Chips bám sát ngữ cảnh)
 */

import type { ClinicalSlotMatrix, SlotKey, ContextualChipOption } from "./types";

export const SLOT_METADATA: Record<SlotKey, { label: string; order: number; description: string; passCriteria: string }> = {
  chiefComplaint: {
    order: 1,
    label: "Vị trí & Triệu chứng chính",
    description: "Vị trí tổn thương, cơ quan khó chịu hoặc triệu chứng nguyên phát bệnh nhân gặp phải.",
    passCriteria: "Bệnh nhân đã nêu rõ ít nhất một cơ quan/vùng cơ thể hoặc triệu chứng cụ thể (ví dụ: đau đầu, tức ngực, đau bụng, ra mồ hôi tay chân, sốt, ngứa da,...).",
  },
  characterTriggers: {
    order: 2,
    label: "Tính chất & Cường độ cơn đau",
    description: "Cảm giác đau (nhói, buốt, âm ỉ, thắt nghẹt, nóng rát, quặn,...) và yếu tố tăng/giảm (khi gắng sức, khi ăn, khi lo âu, khi nằm,...).",
    passCriteria: "Bệnh nhân đã mô tả được tính chất khó chịu hoặc thời điểm khởi phát / tăng giảm của triệu chứng.",
  },
  duration: {
    order: 3,
    label: "Thời gian & Diễn tiến",
    description: "Thời gian triệu chứng xuất hiện (vài giờ, vài ngày, vài tuần, kéo dài liên tục hay theo cơn).",
    passCriteria: "Bệnh nhân đã cung cấp mốc thời gian (ví dụ: 3 ngày nay, từ sáng nay, hơn 2 tuần, thường xuyên quanh năm,...).",
  },
  associatedSigns: {
    order: 4,
    label: "Dấu hiệu kèm theo & Cảnh báo đỏ",
    description: "Các triệu chứng phụ trợ (sốt, nôn, chóng mặt, sụt cân, run tay, khó thở, ho,...) hoặc xác nhận không có triệu chứng khác.",
    passCriteria: "Bệnh nhân đã nêu ít nhất một dấu hiệu kèm theo hoặc xác nhận rõ 'không có dấu hiệu nào khác'.",
  },
};

export const CLINICAL_JUDGE_SYSTEM_PROMPT = `
BẠN LÀ MỘT BÁC SĨ THẨM ĐỊNH LÂM SÀNG TRƯỞNG (CLINICAL JUDGE LLM) CỦA BỆNH VIỆN ĐA KHOA QUỐC TẾ VMEC.

NHIỆM VỤ CỦA BẠN:
Thẩm định nghiêm ngặt câu trả lời của bệnh nhân đối với thông tin cốt lõi mục tiêu (Target Slot) đang được thẩm định.
Chỉ khi câu trả lời của bệnh nhân ĐẠT yêu cầu y khoa rõ ràng, bạn mới đưa ra kết luận "SATISFIED".
Nếu câu trả lời quá mơ hồ, lạc đề, hoặc chưa cung cấp đủ thông tin cho Target Slot, bạn PHẢI đưa ra kết luận "UNSATISFIED".

DANH SÁCH 4 THÔNG TIN CỐT LÕI THEO TIÊU CHUẨN BỘ Y TẾ:
1. chiefComplaint (Vị trí & Triệu chứng chính): Xác định rõ vùng khó chịu hoặc triệu chứng chính.
2. characterTriggers (Tính chất & Cường độ): Cảm giác đau/khó chịu và hoàn cảnh xuất hiện.
3. duration (Thời gian & Diễn tiến): Kéo dài bao lâu, liên tục hay từng cơn.
4. associatedSigns (Dấu hiệu kèm theo & Cảnh báo đỏ): Các triệu chứng phụ trợ hoặc xác nhận không có triệu chứng khác.

QUY TẮC ĐÁNH GIÁ:
- Nếu Target Slot là chiefComplaint: Bất kỳ mô tả bệnh lý/triệu chứng cụ thể nào (như "đau đầu", "đau ngực", "ra mồ hôi tay chân", "rét run", "ho", "sốt") đều ĐẠT (SATISFIED).
- Nếu Target Slot là characterTriggers: Cần mô tả cảm giác (nhói, buốt, tức, rát, âm ỉ, mệt, bồn chồn) hoặc điều kiện (khi lo lắng, khi leo cầu thang, sau ăn,...).
- Nếu Target Slot là duration: Cần có mốc thời gian (mới bị, 3 ngày, 2 tuần, thường xuyên, lâu nay,...).
- Nếu Target Slot là associatedSigns: Cần có triệu chứng kèm theo hoặc câu phủ định rõ ràng.

ĐỊNH DẠNG TRẢ VỀ BẮT BUỘC (CHỈ TRẢ VỀ JSON HỢP LỆ, KHÔNG KÈM TEXT NGOÀI):
{
  "targetSlot": "chiefComplaint" | "characterTriggers" | "duration" | "associatedSigns",
  "verdict": "SATISFIED" | "UNSATISFIED",
  "clarityScore": number (0.0 đến 1.0),
  "extractedFact": string (tóm tắt ngắn gọn thông tin bóc tách được),
  "reasoning": string (lý giải ngắn gọn bằng tiếng Việt vì sao đạt hoặc chưa đạt),
  "clarificationPrompt": string (câu hỏi đào sâu nếu UNSATISFIED)
}
`.trim();

export const CLINICAL_INTERROGATOR_SYSTEM_PROMPT = `
BẠN LÀ BÁC SĨ TRỢ LÝ KHÁM BỆNH AI (CLINICAL INTERROGATOR LLM) CỦA BỆNH VIỆN ĐA KHOA QUỐC TẾ VMEC.

NHIỆM VỤ CỦA BẠN:
1. Ghi nhận ngắn gọn, đồng cảm những thông tin bệnh nhân đã cung cấp (Active Facts).
2. ĐẶT DUY NHẤT 01 CÂU HỎI LÂM SÀNG TẬP TRUNG CHÍNH XÁC VÀO THÔNG TIN CỐT LÕI MỤC TIÊU TIẾP THEO (Target Slot).
3. Tuyệt đối không hỏi gộp nhiều câu cùng lúc.
4. Sinh kèm đúng 04 gợi ý Quick-Chips (Lựa chọn 1-chạm) bám sát 100% chuyên khoa và triệu chứng người dùng đang gặp phải, giúp bệnh nhân chọn nhanh mà không cần gõ bàn phím.

ĐỊNH DẠNG TRẢ VỀ BẮT BUỘC (CHỈ TRẢ VỀ JSON HỢP LỆ, KHÔNG KÈM TEXT NGOÀI):
{
  "acknowledgment": string (lời ghi nhận êm dịu, đồng cảm của bác sĩ đối với thông tin vừa nhận),
  "question": string (câu hỏi lâm sàng duy nhất cho Target Slot),
  "chips": [
    {
      "id": "c1",
      "display": string (tiêu đề ngắn gọn hiển thị trên nút),
      "fullText": string (câu mô tả hoàn chỉnh khi người dùng bấm chọn),
      "clinicalCategory": string (phân loại y khoa)
    },
    ... (đủ đúng 4 chips)
  ]
}
`.trim();

export function buildJudgeUserPrompt(
  targetSlot: SlotKey,
  userMessage: string,
  currentSlots: ClinicalSlotMatrix
): string {
  const meta = SLOT_METADATA[targetSlot];
  return `
[THẨM ĐỊNH LÂM SÀNG CHO SLOT MỤC TIÊU: ${targetSlot.toUpperCase()} - ${meta.label}]
- Mô tả slot: ${meta.description}
- Tiêu chí đạt chuẩn: ${meta.passCriteria}

[TRẠNG THÁI HIỆN TẠI CỦA 4 SLOTS]:
- Chief Complaint: ${currentSlots.chiefComplaint.value || "(Chưa có)"} [${currentSlots.chiefComplaint.status}]
- Character & Triggers: ${currentSlots.characterTriggers.value || "(Chưa có)"} [${currentSlots.characterTriggers.status}]
- Duration: ${currentSlots.duration.value || "(Chưa có)"} [${currentSlots.duration.status}]
- Associated Signs: ${currentSlots.associatedSigns.value || "(Chưa có)"} [${currentSlots.associatedSigns.status}]

[TIN NHẮN MỚI NHẤT CỦA BỆNH NHÂN]:
"${userMessage}"

Hãy thẩm định xem tin nhắn trên có đáp ứng đầy đủ yêu cầu cho "${meta.label}" (${targetSlot}) hay không. Trả về đúng định dạng JSON.
`.trim();
}

export function buildInterrogatorUserPrompt(
  targetSlot: SlotKey,
  specialtyCode: string,
  specialtyName: string,
  currentSlots: ClinicalSlotMatrix,
  lastExtractedFact?: string
): string {
  const meta = SLOT_METADATA[targetSlot];
  return `
[YÊU CẦU HỎI ĐỊNH HƯỚNG CHO SLOT: ${targetSlot.toUpperCase()} - ${meta.label}]
- Chuyên khoa định tuyến hiện tại: ${specialtyName} (${specialtyCode})
- Thông tin vừa bóc tách: ${lastExtractedFact || "Triệu chứng từ bệnh nhân"}

[TIẾN ĐỘ 4 THÔNG TIN CỐT LÕI]:
1. Chief Complaint: ${currentSlots.chiefComplaint.value || "(ĐANG CHỜ)"}
2. Character & Triggers: ${currentSlots.characterTriggers.value || "(ĐANG CHỜ)"}
3. Duration: ${currentSlots.duration.value || "(ĐANG CHỜ)"}
4. Associated Signs: ${currentSlots.associatedSigns.value || "(ĐANG CHỜ)"}

Hãy đặt duy nhất 1 câu hỏi lâm sàng để hỏi về ${meta.label} cho chuyên khoa ${specialtyName}, kèm 4 gợi ý Quick-Chips 1-chạm bám sát thực tế. Trả về đúng định dạng JSON.
`.trim();
}
