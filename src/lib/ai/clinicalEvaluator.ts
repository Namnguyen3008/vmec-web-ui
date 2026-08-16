/**
 * LLM 2: Clinical Evaluator & Slot Judge Module
 * Evaluates patient feedback with clinical reflection, ambiguity scoring,
 * progress calculation, and dynamic contextual Quick-Reply Chips.
 */

import type {
  ClinicalSlotMatrix,
  ContextualChipOption,
  LivingClinicalContext,
  SlotEvaluationResult,
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

const MEDICAL_KEYWORDS = [
  "ngực", "tim", "bụng", "dạ dày", "đầu", "họng", "sốt", "khớp", "da", "mắt",
  "cháu", "bé", "ho", "thở", "ợ", "chóng mặt", "buồn nôn", "mệt", "đau",
  "nhức", "rát", "sưng", "ngứa", "tiêu chảy", "huyết áp", "khó ngủ"
];

function isPureGreeting(text: string): boolean {
  const lower = text.toLowerCase().trim();
  const greetingPhrases = [
    "xin chào", "chào bạn", "chào bác sĩ", "chào", "hello", "hi", "hey",
    "xin chao", "chao ban", "chao bac si", "bạn ơi", "alo", "chào em", "chào anh"
  ];

  const hasGreeting = greetingPhrases.some((g) => lower === g || lower.startsWith(g + " ") || lower.startsWith(g + ","));
  const hasMedical = MEDICAL_KEYWORDS.some((kw) => lower.includes(kw));

  return hasGreeting && !hasMedical;
}

/**
 * Tạo lời đánh giá phản hồi của người bệnh (Clinical Feedback Evaluation & Reflection)
 * Kết hợp dữ liệu lâm sàng sâu từ luồng RAG cũ (Chuyên khoa, Bác sĩ, Phác đồ BYT)
 */
function generateClinicalFeedbackEvaluation(
  slots: ClinicalSlotMatrix,
  matchedSpec: typeof CLINICAL_SPECIALTIES[0],
  userText: string
): string {
  const parts: string[] = [];

  if (slots.chiefComplaint.value) {
    parts.push(`triệu chứng **${slots.chiefComplaint.value}**`);
  }
  if (slots.characterTriggers.value) {
    parts.push(`tính chất **${slots.characterTriggers.value}**`);
  }
  if (slots.duration.value) {
    parts.push(`thời gian **${slots.duration.value}**`);
  }
  if (slots.associatedSigns.value) {
    parts.push(`dấu hiệu **${slots.associatedSigns.value}**`);
  }

  const summary = parts.length > 0 ? parts.join(", ") : `thông tin "${userText}"`;
  const primaryCitation = matchedSpec.citations[0];

  return (
    `🔍 **ĐÁNH GIÁ LÂM SÀNG TỪ HỆ THỐNG RAG BỘ Y TẾ:**\n` +
    `• **Thông tin tiếp nhận:** Tôi đã ghi nhận ${summary}.\n` +
    `• **Định tuyến sơ bộ:** **${matchedSpec.name}** — Bác sĩ phụ trách: **${matchedSpec.doctor}** (${matchedSpec.room}).\n` +
    `• **Căn cứ chuyên môn:** ${matchedSpec.reasoning}\n` +
    (primaryCitation ? `• **Phác đồ đối chiếu:** *${primaryCitation.label} (${primaryCitation.documentId})*\n\n` : `\n`)
  );
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

  // 1. XỬ LÝ CHÀO HỎI THUẦN TÚY (Greeting Guard)
  if (isPureGreeting(text)) {
    return {
      updatedSlots: slots,
      progressPercentage: 0,
      isAllCompleted: false,
      isEmergency: false,
      nextQuestion: "Chào bạn! Tôi là **AI Trợ lý Khám bệnh Thông minh**. Bạn đang cảm thấy khó chịu ở vị trí nào trong cơ thể (như đau ngực, đau dạ dày, đau đầu, sốt,...) hoặc cần khám vấn đề sức khỏe gì?",
      suggestedChips: [
        {
          id: "g_1",
          display: "Đau tức ngực trái khi gắng sức",
          fullText: "Tôi bị đau tức ngực trái khi leo cầu thang và hồi hộp",
          clinicalCategory: "CARDIAC",
        },
        {
          id: "g_2",
          display: "Đau rát dạ dày, ợ chua",
          fullText: "Tôi bị đau rát thượng vị (trên rốn) và ợ chua nhiều",
          clinicalCategory: "GASTRO",
        },
        {
          id: "g_3",
          display: "Đau nhức đầu, chóng mặt",
          fullText: "Tôi bị đau nhức nửa đầu bên phải kèm chóng mặt",
          clinicalCategory: "NEURO",
        },
        {
          id: "g_4",
          display: "Bé bị sốt và ho sổ mũi",
          fullText: "Con tôi bị sốt 38.5 độ kèm theo ho và chảy nước mũi",
          clinicalCategory: "PEDIATRIC",
        },
      ],
    };
  }

  // 2. Kiểm tra Cấp cứu 115 độc lập (TriAgent Circuit Breaker)
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

  // 3. Nhận diện Chuyên khoa phù hợp nhất
  const matchedSpec = matchSpecialty(text) || CLINICAL_SPECIALTIES[0];

  // 4. Phân tích bóc tách các trường lâm sàng (Slot Extractor)
  // --- Slot 1: Chief Complaint ---
  if (slots.chiefComplaint.status !== "COMPLETED") {
    const hasMedical = MEDICAL_KEYWORDS.some((kw) => text.includes(kw));
    if (hasMedical) {
      slots.chiefComplaint.status = "COMPLETED";
      slots.chiefComplaint.value = userText.trim();
      slots.chiefComplaint.clarityScore = 0.95;
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

  // 5. Tính toán phần trăm tiến độ
  let completedCount = 0;
  if (slots.chiefComplaint.status === "COMPLETED") completedCount++;
  if (slots.duration.status === "COMPLETED") completedCount++;
  if (slots.characterTriggers.status === "COMPLETED") completedCount++;
  if (slots.associatedSigns.status === "COMPLETED") completedCount++;

  // Quy tắc dừng: Đủ 4 slot HOẶC đã qua 3 lượt hỏi có triệu chứng rõ ràng
  const isAllCompleted = completedCount >= 4 || (completedCount >= 3 && turnCount >= 2) || turnCount >= 4;
  const progressPercentage = isAllCompleted ? 100 : Math.min(75, completedCount * 25);

  // Lời đánh giá phản hồi của người bệnh
  const evaluationHeader = generateClinicalFeedbackEvaluation(slots, matchedSpec, userText);

  // 6. Xác định câu hỏi và 3-4 Quick-Chips ngữ cảnh tiếp theo
  let questionBody = "";
  let suggestedChips: ContextualChipOption[] = [];

  if (isAllCompleted) {
    questionBody = `Tôi đã nắm bắt đầy đủ toàn bộ diễn biến triệu chứng của bạn. Đang đối chiếu phác đồ Bộ Y Tế và chuẩn bị kết luận chuyên khoa...`;
    suggestedChips = [];
  } else if (slots.characterTriggers.status !== "COMPLETED") {
    // Hỏi về tính chất & hoàn cảnh xuất hiện
    if (matchedSpec.code === "TIM_MACH") {
      questionBody = "❓ **CÂU HỎI LÀM RÕ:**\nCơn đau ngực của bạn có cảm giác như thế nào và xuất hiện nhiều nhất khi nào?";
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
      questionBody = "❓ **CÂU HỎI LÀM RÕ:**\nCơn đau ở vùng bụng/dạ dày của bạn xuất hiện vào thời điểm nào và có cảm giác ra sao?";
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
      questionBody = "❓ **CÂU HỎI LÀM RÕ:**\nTriệu chứng khó chịu này có cảm giác cụ thể như thế nào và tăng lên khi nào?";
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
    questionBody = "❓ **CÂU HỎI LÀM RÕ:**\nTình trạng này đã kéo dài bao lâu rồi, và bạn có kèm theo triệu chứng nào khác không?";
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

  const nextQuestion = isAllCompleted ? questionBody : `${evaluationHeader}${questionBody}`;

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
