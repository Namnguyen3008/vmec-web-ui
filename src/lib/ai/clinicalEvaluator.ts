/**
 * LLM 2: Clinical Evaluator & Slot Judge Module
 * Evaluates ambiguity of clinical slots, calculates progress %,
 * and dynamically generates 3-4 contextual Quick-Reply Chips.
 */

import type {
  ClinicalSlotMatrix,
  ContextualChipOption,
  LivingClinicalContext,
  SlotEvaluationResult,
  TriageUrgencyLevel,
} from "./types";
import { CLINICAL_SPECIALTIES, detectEmergency, matchSpecialty } from "@/lib/api/chat";

/**
 * Initial empty clinical slot matrix
 */
export function createInitialSlots(): ClinicalSlotMatrix {
  return {
    chiefComplaint: {
      status: "PENDING",
      label: "Vị trí & Triệu chứng chính",
      clarityScore: 0,
    },
    duration: {
      status: "PENDING",
      label: "Thời gian & Diễn tiến",
      clarityScore: 0,
    },
    characterTriggers: {
      status: "PENDING",
      label: "Tính chất & Cường độ đau",
      clarityScore: 0,
    },
    associatedSigns: {
      status: "PENDING",
      label: "Dấu hiệu kèm theo & Cảnh báo",
      clarityScore: 0,
    },
  };
}

/**
 * Main Evaluation Function (LLM-as-a-Judge Clinical Slot Evaluator)
 */
export function evaluateClinicalMessage(
  userText: string,
  currentContext: LivingClinicalContext
): SlotEvaluationResult {
  const text = userText.trim().toLowerCase();
  const slots: ClinicalSlotMatrix = { ...currentContext.slots };
  const turnCount = currentContext.turnCount + 1;

  // 1. Kiểm tra Cấp cứu 115 độc lập (TriAgent Circuit Breaker)
  const isEmergency = detectEmergency(text);
  if (isEmergency) {
    return {
      updatedSlots: slots,
      progressPercentage: 100,
      isAllCompleted: true,
      isEmergency: true,
      nextQuestion: "🚨 **CẢNH BÁO CẤP CỨU 115**: Bệnh nhân có dấu hiệu nguy kịch đe dọa tính mạng. Vui lòng gọi 115 hoặc đến phòng Cấp cứu gần nhất ngay lập tức!",
      suggestedChips: [],
    };
  }

  // 2. Nhận diện Chuyên khoa phù hợp nhất
  const matchedSpec = matchSpecialty(text) || CLINICAL_SPECIALTIES[0];

  // 3. Phân tích bóc tách các trường lâm sàng (Slot Extractor)
  // --- Slot 1: Chief Complaint ---
  if (slots.chiefComplaint.status !== "COMPLETED") {
    if (
      text.includes("ngực") ||
      text.includes("tim") ||
      text.includes("bụng") ||
      text.includes("dạ dày") ||
      text.includes("đầu") ||
      text.includes("họng") ||
      text.includes("sốt") ||
      text.includes("khớp") ||
      text.includes("da") ||
      text.includes("mắt") ||
      text.includes("cháu") ||
      text.includes("bé")
    ) {
      slots.chiefComplaint.status = "COMPLETED";
      slots.chiefComplaint.value = userText.trim();
      slots.chiefComplaint.clarityScore = 0.95;
    } else {
      slots.chiefComplaint.status = "IN_PROGRESS";
      slots.chiefComplaint.value = userText.trim();
      slots.chiefComplaint.clarityScore = 0.6;
    }
  }

  // --- Slot 2: Duration ---
  if (slots.duration.status !== "COMPLETED") {
    if (
      text.includes("ngày") ||
      text.includes("tuần") ||
      text.includes("tháng") ||
      text.includes("hôm nay") ||
      text.includes("sáng nay") ||
      text.includes("tối qua") ||
      text.includes("lâu rồi") ||
      text.includes("vừa bị") ||
      text.includes("mới bị")
    ) {
      slots.duration.status = "COMPLETED";
      slots.duration.value = extractDurationText(userText);
      slots.duration.clarityScore = 0.9;
    }
  }

  // --- Slot 3: Character & Triggers ---
  if (slots.characterTriggers.status !== "COMPLETED") {
    if (
      text.includes("thắt") ||
      text.includes("nhói") ||
      text.includes("rát") ||
      text.includes("âm ỉ") ||
      text.includes("quặn") ||
      text.includes("nóng") ||
      text.includes("khi leo") ||
      text.includes("khi gắng sức") ||
      text.includes("khi đói") ||
      text.includes("sau ăn") ||
      text.includes("nửa đêm")
    ) {
      slots.characterTriggers.status = "COMPLETED";
      slots.characterTriggers.value = extractCharacterText(userText);
      slots.characterTriggers.clarityScore = 0.92;
    }
  }

  // --- Slot 4: Associated Signs ---
  if (slots.associatedSigns.status !== "COMPLETED") {
    if (
      text.includes("khó thở") ||
      text.includes("ợ chua") ||
      text.includes("buồn nôn") ||
      text.includes("sốt") ||
      text.includes("mệt") ||
      text.includes("chóng mặt") ||
      text.includes("hồi hộp") ||
      text.includes("không có triệu chứng khác") ||
      text.includes("chỉ bị") ||
      text.includes("không sốt")
    ) {
      slots.associatedSigns.status = "COMPLETED";
      slots.associatedSigns.value = userText.trim();
      slots.associatedSigns.clarityScore = 0.95;
    }
  }

  // 4. Tính toán phần trăm tiến độ
  let completedCount = 0;
  if (slots.chiefComplaint.status === "COMPLETED") completedCount++;
  if (slots.duration.status === "COMPLETED") completedCount++;
  if (slots.characterTriggers.status === "COMPLETED") completedCount++;
  if (slots.associatedSigns.status === "COMPLETED") completedCount++;

  // Giới hạn cứng: Nếu đã qua 3 lượt hoặc đã hoàn tất cả 4 slot -> Hoàn thành 100%
  const isAllCompleted = completedCount >= 4 || turnCount >= 3 || (completedCount >= 3 && turnCount >= 2);
  const progressPercentage = isAllCompleted ? 100 : Math.max(25, completedCount * 25);

  // 5. Xác định câu hỏi và 3-4 Quick-Chips ngữ cảnh tiếp theo
  let nextQuestion = "";
  let suggestedChips: ContextualChipOption[] = [];

  if (isAllCompleted) {
    nextQuestion = `Tôi đã nắm bắt đầy đủ toàn bộ diễn biến triệu chứng của bạn. Đang đối chiếu phác đồ Bộ Y Tế và chuẩn bị kết luận chuyên khoa...`;
    suggestedChips = [];
  } else if (slots.characterTriggers.status !== "COMPLETED") {
    // Hỏi về tính chất & hoàn cảnh xuất hiện
    if (matchedSpec.code === "TIM_MACH") {
      nextQuestion = "Cơn đau ngực của bạn có cảm giác như thế nào và xuất hiện nhiều nhất khi nào?";
      suggestedChips = [
        {
          id: "tm_c1",
          display: "Đau thắt, đè nặng khi gắng sức",
          fullText: "Tôi bị đau thắt nghẹt, đè nặng như có vật chèn lên ngực khi leo cầu thang hoặc vận động mạnh",
          clinicalCategory: "CARDIAC_ISCHEMIC",
        },
        {
          id: "tm_c2",
          display: "Đau nhói khi hít sâu",
          fullText: "Cơn đau nhói buốt như kim châm khi tôi hít thở sâu hoặc ho",
          clinicalCategory: "PLEURITIC",
        },
        {
          id: "tm_c3",
          display: "Đau rát sau xương ức",
          fullText: "Tôi cảm giác nóng rát lan từ bụng trên lên sau xương ức",
          clinicalCategory: "GERD",
        },
        {
          id: "tm_c4",
          display: "Tức nhẹ do căng thẳng",
          fullText: "Tôi chỉ cảm thấy hồi hộp tức ngực nhẹ khi làm việc căng thẳng, stress",
          clinicalCategory: "AUTONOMIC",
        },
      ];
    } else if (matchedSpec.code === "TIEU_HOA") {
      nextQuestion = "Cơn đau ở vùng bụng/dạ dày của bạn xuất hiện vào thời điểm nào và có cảm giác ra sao?";
      suggestedChips = [
        {
          id: "th_c1",
          display: "Đau rát thượng vị khi đói / no",
          fullText: "Tôi bị đau rát vùng trên rốn (thượng vị) rõ rệt nhất lúc đói bụng hoặc ngay sau khi ăn no",
          clinicalCategory: "GASTRIC_ULCER",
        },
        {
          id: "th_c2",
          display: "Đau quặn từng cơn quanh rốn",
          fullText: "Cơn đau bụng quặn thắt từng cơn quanh rốn kèm đầy bụng khó tiêu",
          clinicalCategory: "BOWEL_SPASM",
        },
        {
          id: "th_c3",
          display: "Đau âm ỉ mạn sườn phải",
          fullText: "Tôi bị đau tức âm ỉ vùng hạ sườn bên phải liên tục",
          clinicalCategory: "HEPATOBILIARY",
        },
        {
          id: "th_c4",
          display: "Đau râm ran kèm ợ chua",
          fullText: "Đau cồn cào râm ran kèm cảm giác ợ chua nóng rát cổ họng",
          clinicalCategory: "GERD",
        },
      ];
    } else {
      nextQuestion = "Triệu chứng khó chịu này có cảm giác cụ thể như thế nào và tăng lên khi nào?";
      suggestedChips = [
        {
          id: "gen_c1",
          display: "Đau nhức âm ỉ liên tục",
          fullText: "Tôi bị đau nhức âm ỉ kéo dài liên tục cả ngày",
          clinicalCategory: "CHRONIC_MILD",
        },
        {
          id: "gen_c2",
          display: "Đau nhói từng cơn đột ngột",
          fullText: "Thỉnh thoảng đau nhói buốt dữ dội từng cơn rồi giảm dần",
          clinicalCategory: "ACUTE_PAROXYSMAL",
        },
        {
          id: "gen_c3",
          display: "Đau tăng khi vận động",
          fullText: "Cơn đau tăng rõ rệt khi tôi cử động hoặc làm việc nặng",
          clinicalCategory: "MECHANICAL",
        },
        {
          id: "gen_c4",
          display: "Khó chịu nhẹ, chưa rõ vị trí",
          fullText: "Tôi chỉ cảm thấy bứt rứt khó chịu nhẹ trong người",
          clinicalCategory: "UNSPECIFIED",
        },
      ];
    }
  } else if (slots.duration.status !== "COMPLETED" || slots.associatedSigns.status !== "COMPLETED") {
    // Hỏi về thời gian & dấu hiệu kèm theo
    nextQuestion = "Tình trạng này đã kéo dài bao lâu rồi, và bạn có kèm theo triệu chứng nào khác không?";
    suggestedChips = [
      {
        id: "dur_c1",
        display: "Bị 3-5 ngày nay, kèm mệt mỏi",
        fullText: "Tôi đã bị khoảng 3 đến 5 ngày nay, người cảm thấy khá mệt mỏi và hụt hơi",
        clinicalCategory: "SUBACUTE",
      },
      {
        id: "dur_c2",
        display: "Kéo dài trên 2 tuần nay",
        fullText: "Tình trạng này đã kéo dài âm ỉ hơn 2 tuần nay không thấy đỡ",
        clinicalCategory: "CHRONIC",
      },
      {
        id: "dur_c3",
        display: "Mới bị từ hôm qua / sáng nay",
        fullText: "Tôi mới bắt đầu xuất hiện triệu chứng này từ hôm qua đến sáng nay",
        clinicalCategory: "ACUTE",
      },
      {
        id: "dur_c4",
        display: "Không có triệu chứng khác",
        fullText: "Tôi chỉ bị triệu chứng này đơn thuần, ngoài ra không sốt hay buồn nôn",
        clinicalCategory: "ISOLATED",
      },
    ];
  }

  return {
    updatedSlots: slots,
    progressPercentage,
    isAllCompleted,
    isEmergency: false,
    nextQuestion,
    suggestedChips,
    matchedSpecialtyCode: matchedSpec.code,
    matchedSpecialtyName: matchedSpec.name,
  };
}

function extractDurationText(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("tuần")) return "Kéo dài nhiều tuần";
  if (lower.includes("tháng")) return "Diễn tiến nhiều tháng";
  if (lower.includes("ngày")) return "Khoảng vài ngày gần đây";
  if (lower.includes("sáng nay") || lower.includes("hôm nay")) return "Mới xuất hiện trong ngày";
  return text.trim();
}

function extractCharacterText(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("thắt") || lower.includes("đè nặng")) return "Đau thắt, đè nặng khi gắng sức";
  if (lower.includes("rát") || lower.includes("bỏng")) return "Đau nóng rát liên quan bữa ăn";
  if (lower.includes("nhói")) return "Đau nhói buốt từng cơn";
  if (lower.includes("quặn")) return "Đau quặn từng cơn";
  if (lower.includes("âm ỉ")) return "Đau âm ỉ liên tục";
  return text.trim();
}
