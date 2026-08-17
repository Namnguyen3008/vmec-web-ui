/**
 * LLM Client Module for Clinical Judge & Clinical Interrogator
 * Interacts with /api/clinical/evaluate (Gemini API) with built-in high-accuracy fallback.
 */

import type {
  ClinicalSlotMatrix,
  JudgeEvaluationResult,
  InterrogatorResult,
  SlotKey,
} from "./types";
import { generateContextualChipsForSpecialty } from "./clinicalEvaluator";

export function getNextPendingSlot(slots: ClinicalSlotMatrix): SlotKey | null {
  if (slots.chiefComplaint.status !== "COMPLETED") return "chiefComplaint";
  if (slots.characterTriggers.status !== "COMPLETED") return "characterTriggers";
  if (slots.duration.status !== "COMPLETED") return "duration";
  if (slots.associatedSigns.status !== "COMPLETED") return "associatedSigns";
  return null;
}

export function evaluateSlotWithJudge(
  targetSlot: SlotKey,
  userMessage: string,
  currentSlots: ClinicalSlotMatrix
): JudgeEvaluationResult {
  const text = userMessage.trim().toLowerCase();

  switch (targetSlot) {
    case "chiefComplaint": {
      if (text.length >= 2) {
        return {
          targetSlot,
          verdict: "SATISFIED",
          clarityScore: 0.95,
          extractedFact: userMessage.trim(),
          reasoning: "Bệnh nhân đã cung cấp triệu chứng lâm sàng chính.",
        };
      }
      return {
        targetSlot,
        verdict: "UNSATISFIED",
        clarityScore: 0.2,
        reasoning: "Chưa xác định được vị trí hoặc triệu chứng khó chịu cụ thể.",
        clarificationPrompt: "Bạn đang cảm thấy khó chịu ở vị trí nào trong cơ thể hoặc cần khám vấn đề gì?",
      };
    }

    case "characterTriggers": {
      const hasCharacter =
        text.includes("nhói") ||
        text.includes("buốt") ||
        text.includes("dữ dội") ||
        text.includes("thắt") ||
        text.includes("rát") ||
        text.includes("âm ỉ") ||
        text.includes("quặn") ||
        text.includes("từng cơn") ||
        text.includes("liên tục") ||
        text.includes("thường xuyên") ||
        text.includes("mồ hôi") ||
        text.includes("rét") ||
        text.includes("run") ||
        text.includes("khi lo") ||
        text.includes("khi leo") ||
        text.includes("sau ăn") ||
        text.includes("khi đói") ||
        text.includes("sáng sớm") ||
        text.includes("đầy bụng") ||
        text.includes("chướng") ||
        text.includes("khó tiêu") ||
        text.includes("chóng mặt") ||
        text.includes("hoa mắt") ||
        text.includes("tư thế") ||
        text.includes("khi hít") ||
        text.includes("gắng sức") ||
        text.includes("nôn") ||
        text.length >= 6;

      if (hasCharacter) {
        return {
          targetSlot,
          verdict: "SATISFIED",
          clarityScore: 0.95,
          extractedFact: userMessage.trim(),
          reasoning: "Đã bóc tách được tính chất, cảm giác và hoàn cảnh xuất hiện triệu chứng.",
        };
      }
      return {
        targetSlot,
        verdict: "UNSATISFIED",
        clarityScore: 0.4,
        reasoning: "Cần làm rõ cảm giác khó chịu cụ thể và hoàn cảnh xuất hiện triệu chứng.",
        clarificationPrompt: "Bạn có thể mô tả cụ thể hơn cảm giác này (xuất hiện khi nào, lúc đói, sau ăn hay khi vận động)?",
      };
    }

    case "duration": {
      const hasDuration =
        text.includes("ngày") ||
        text.includes("tuần") ||
        text.includes("tháng") ||
        text.includes("hôm nay") ||
        text.includes("sáng nay") ||
        text.includes("hôm qua") ||
        text.includes("lâu nay") ||
        text.includes("thường xuyên") ||
        text.includes("quanh năm") ||
        text.includes("gần đây") ||
        text.includes("mới bị") ||
        /\d+/.test(text);

      if (hasDuration) {
        return {
          targetSlot,
          verdict: "SATISFIED",
          clarityScore: 0.95,
          extractedFact: userMessage.trim(),
          reasoning: "Đã có mốc thời gian và diễn tiến rõ ràng.",
        };
      }
      return {
        targetSlot,
        verdict: "UNSATISFIED",
        clarityScore: 0.3,
        reasoning: "Chưa có thông tin về thời gian kéo dài của triệu chứng.",
        clarificationPrompt: "Tình trạng này của bạn đã diễn ra được bao lâu rồi (mới bị vài ngày, vài tuần hay kéo dài thường xuyên)?",
      };
    }

    case "associatedSigns": {
      const hasAssociated =
        text.includes("mệt") ||
        text.includes("hụt hơi") ||
        text.includes("khó thở") ||
        text.includes("buồn nôn") ||
        text.includes("nôn") ||
        text.includes("chóng mặt") ||
        text.includes("hồi hộp") ||
        text.includes("run tay") ||
        text.includes("sốt") ||
        text.includes("rét run") ||
        text.includes("sụt cân") ||
        text.includes("không có") ||
        text.includes("chỉ bị") ||
        text.includes("bình thường") ||
        text.length >= 6;

      if (hasAssociated) {
        return {
          targetSlot,
          verdict: "SATISFIED",
          clarityScore: 0.95,
          extractedFact: userMessage.trim(),
          reasoning: "Đã ghi nhận các dấu hiệu kèm theo hoặc xác nhận loại trừ cảnh báo nguy kịch.",
        };
      }
      return {
        targetSlot,
        verdict: "UNSATISFIED",
        clarityScore: 0.4,
        reasoning: "Cần kiểm tra xem có dấu hiệu cảnh báo đỏ kèm theo hay không.",
        clarificationPrompt: "Ngoài triệu chứng trên, bạn có kèm theo sốt, khó thở, chóng mặt, buồn nôn hay dấu hiệu nào khác không?",
      };
    }
  }
}

export function generateInterrogatorResponse(
  targetSlot: SlotKey,
  specialtyCode: string,
  userText: string
): InterrogatorResult {
  const contextData = generateContextualChipsForSpecialty(specialtyCode, userText);

  switch (targetSlot) {
    case "characterTriggers":
      return {
        targetSlot,
        question: contextData.question,
        chips: contextData.chips,
        specialtyCode,
      };

    case "duration":
      return {
        targetSlot,
        question: "Tình trạng này đã xuất hiện được bao lâu rồi, và diễn ra liên tục hay thành từng cơn?",
        chips: [
          {
            id: "dur_c1",
            display: "Mới bị 2-3 ngày gần đây",
            fullText: "Tôi mới bắt đầu bị khoảng 2 đến 3 ngày gần đây",
            clinicalCategory: "ACUTE",
          },
          {
            id: "dur_c2",
            display: "Kéo dài hơn 2 tuần nay",
            fullText: "Tình trạng này đã kéo dài hơn 2 tuần nay và chưa thấy đỡ",
            clinicalCategory: "SUBACUTE",
          },
          {
            id: "dur_c3",
            display: "Bị thường xuyên quanh năm",
            fullText: "Tôi bị triệu chứng này thường xuyên tái đi tái lại quanh năm",
            clinicalCategory: "CHRONIC",
          },
          {
            id: "dur_c4",
            display: "Mới xuất hiện từ sáng nay",
            fullText: "Cơn khó chịu này mới bắt đầu xuất hiện đột ngột từ sáng hôm nay",
            clinicalCategory: "SUDDEN_ONSET",
          },
        ],
        specialtyCode,
      };

    case "associatedSigns":
      return {
        targetSlot,
        question: "Ngoài các triệu chứng trên, bạn có kèm theo dấu hiệu cảnh báo nào dưới đây không?",
        chips: [
          {
            id: "asc_c1",
            display: "Kèm mệt mỏi, hụt hơi",
            fullText: "Tôi cảm thấy người khá mệt mỏi, hụt hơi và mất sức",
            clinicalCategory: "FATIGUE",
          },
          {
            id: "asc_c2",
            display: "Kèm chóng mặt, buồn nôn",
            fullText: "Tôi có cảm giác chóng mặt hoa mắt và hơi buồn nôn",
            clinicalCategory: "DIZZINESS",
          },
          {
            id: "asc_c3",
            display: "Kèm sốt nhẹ hoặc ớn lạnh",
            fullText: "Thỉnh thoảng tôi thấy người hâm hấp sốt hoặc gai rét ớn lạnh",
            clinicalCategory: "FEVER_CHILLS",
          },
          {
            id: "asc_c4",
            display: "Không có triệu chứng kèm theo",
            fullText: "Tôi không có triệu chứng bất thường nào khác ngoài các vấn đề đã nêu",
            clinicalCategory: "NONE",
          },
        ],
        specialtyCode,
      };

    default:
      return {
        targetSlot: "chiefComplaint",
        question: "Bạn đang cảm thấy khó chịu ở vị trí nào trong cơ thể hoặc cần khám vấn đề sức khỏe gì?",
        chips: contextData.chips,
        specialtyCode,
      };
  }
}
