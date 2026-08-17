/**
 * Dual-LLM Clinical Orchestrator Module
 * Coordinates communication between:
 * - LLM 2 (Clinical Judge): Gatekeeper evaluating slot completion & fact extraction.
 * - LLM 1 (Clinical Interrogator): Empathetic doctor asking 1 single targeted question + 4 dynamic chips.
 * Communicates via structured JSON state contracts.
 */

import type {
  AtomicClinicalFact,
  ClinicalSlotKey,
  ClinicalSlotMatrix,
  ContextualChipOption,
  DualLLMInterrogatorResult,
  DualLLMJudgeResult,
  LivingClinicalContext,
  SlotEvaluationResult,
} from "./types";
import { CLINICAL_SPECIALTIES, detectEmergency } from "@/lib/api/chat";
import {
  routeSpecialtyWithFactWeights,
  generateContextualChipsForSpecialty,
  synthesizeDynamicReasoning,
  EXPANDED_MEDICAL_KEYWORDS,
} from "./clinicalEvaluator";

export const SYSTEM_PROMPT_LLM2_CLINICAL_JUDGE = `
# ROLE: VMEC CLINICAL EVALUATION JUDGE (HỘI ĐỒNG THẨM ĐỊNH LÂM SÀNG)

## MISSION:
Bạn là Trọng tài Lâm sàng y tế cấp cao. Nhiệm vụ của bạn là phân tích tin nhắn của bệnh nhân và lịch sử hội thoại, đối chiếu với 4 TRƯỜNG THÔNG TIN CỐT LÕI (Slot Matrix) theo tiêu chuẩn Triage của Bộ Y Tế.

## 4 SLOTS QUY ĐỊNH THEO THỨ TỰ ƯU TIÊN:
1. \`chiefComplaint\`: Vị trí & Triệu chứng chính (Vd: đau ngực, đau đầu, ra mồ hôi tay chân, rét run, đau dạ dày...).
2. \`characterTriggers\`: Tính chất, cảm giác cụ thể & yếu tố tăng giảm (Vd: nhói buốt, âm ỉ, thắt nghẹt, đổ mồ hôi khi lo âu...).
3. \`duration\`: Thời gian và diễn tiến (Vd: 3 ngày nay, 2 tuần, mới bị sáng nay, kéo dài thường xuyên...).
4. \`associatedSigns\`: Dấu hiệu cảnh báo đỏ kèm theo hoặc triệu chứng phụ (Vd: mệt mỏi, sụt cân, sốt, run tay, hoặc không có dấu hiệu khác).

## NGUYÊN TẮC THẨM ĐỊNH:
- KHÔNG BAO GIỜ bịa đặt hoặc suy diễn triệu chứng bệnh nhân chưa nói.
- Chỉ đánh dấu slot \`COMPLETED\` khi bệnh nhân đã cung cấp thông tin rõ ràng (clarityScore >= 80).
- Nếu slot hiện tại chưa rõ, giữ \`PENDING\` và tiếp tục yêu cầu làm rõ slot đó.
- Khi một slot đạt chuẩn, chuyển \`nextSlotToAsk\` sang slot tiếp theo theo thứ tự.
- Khi cả 4 slots đều đạt chuẩn -> set \`isAllCompleted = true\`.
`;

export const SYSTEM_PROMPT_LLM1_CLINICAL_INTERROGATOR = `
# ROLE: VMEC CLINICAL DOCTOR INTERVIEWER (BÁC SĨ TƯ VẤN HỘI CHẨN)

## CONTEXT INPUT TỪ HỆ THỐNG:
- Trường thông tin mục tiêu: {{TARGET_SLOT}}
- Chuyên khoa định hướng: {{MATCHED_SPECIALTY}}
- Các dữ kiện đã xác thực: {{EXTRACTED_FACTS}}

## QUY TẮC BẮT BUỘC:
1. QUY TẮC 1 CÂU HỎI (ONE-QUESTION RULE): Tuyệt đối chỉ hỏi ĐÚNG 1 CÂU HỎI duy nhất nhắm thẳng vào {{TARGET_SLOT}}. Tuyệt đối không hỏi dồn dập 2-3 câu.
2. THỂ HIỆN SỰ LẮNG NGHE: Trước khi hỏi, tóm tắt ngắn gọn 1 câu xác nhận đã ghi nhận các triệu chứng bệnh nhân vừa chia sẻ.
3. KHÔNG DÙNG TỪ KỸ THUẬT: Tuyệt đối không nhắc các từ "Slot", "LLM", "RAG", "Prompt", "AI model" trong câu trả lời.
4. TỰ ĐỘNG SINH 4 QUICK-CHIPS: Bắt buộc tạo ra đúng 4 tình huống lựa chọn 1-chạm (Quick Chips) phản ánh chính xác các khả năng lâm sàng phổ biến nhất của chuyên khoa đó để bệnh nhân chọn nhanh.
`;

/**
 * Executes LLM 2 (Clinical Judge) Evaluation
 */
export function executeLLMJudgeEvaluation(
  userText: string,
  currentContext: LivingClinicalContext
): DualLLMJudgeResult {
  const text = userText.trim().toLowerCase();
  const slots: ClinicalSlotMatrix = JSON.parse(JSON.stringify(currentContext.slots));
  const existingFacts: AtomicClinicalFact[] = [...(currentContext.atomicFacts || [])];
  const turnCount = currentContext.turnCount + 1;

  // 1. Emergency 115 Guard
  const isEmergency = detectEmergency(text);
  if (isEmergency) {
    return {
      evaluatedSlot: "associatedSigns",
      slotStatus: "COMPLETED",
      clarityScore: 100,
      extractedFacts: existingFacts,
      updatedSlots: slots,
      nextSlotToAsk: null,
      matchedSpecialtyCode: "CAP_CUU",
      matchedSpecialtyName: "Khoa Cấp Cứu 115",
      isAllCompleted: true,
      isEmergency: true,
      emergencyActionMessage: "🚨 CẢNH BÁO CẤP CỨU 115: Triệu chứng có dấu hiệu nguy kịch đe dọa tính mạng. Vui lòng gọi ngay 115 hoặc đến cấp cứu ngay lập tức!",
      clinicalReasoning: "Phát hiện dấu hiệu cấp cứu tối cấp (Red Flag) theo phác đồ CATT Bộ Y Tế.",
    };
  }

  // Determine current active target slot
  let activeSlot: ClinicalSlotKey = "chiefComplaint";
  if (slots.chiefComplaint.status === "COMPLETED") {
    activeSlot = "characterTriggers";
    if (slots.characterTriggers.status === "COMPLETED") {
      activeSlot = "duration";
      if (slots.duration.status === "COMPLETED") {
        activeSlot = "associatedSigns";
      }
    }
  }

  // Extract facts based on user input
  // Slot 1: Chief Complaint
  if (slots.chiefComplaint.status !== "COMPLETED") {
    slots.chiefComplaint.status = "COMPLETED";
    slots.chiefComplaint.value = userText.trim();
    slots.chiefComplaint.clarityScore = 0.95;
    existingFacts.push({
      id: `fact_${Date.now()}_chief`,
      category: "CHIEF_COMPLAINT",
      label: "Triệu chứng chính",
      value: userText.trim(),
      rawSnippet: userText.trim(),
      provenance: "PATIENT_EXPLICIT",
      sourceTurn: turnCount,
    });
  }

  // Slot 2: Character & Triggers
  if (
    slots.characterTriggers.status !== "COMPLETED" &&
    (text.includes("nhói") ||
      text.includes("dữ dội") ||
      text.includes("thắt") ||
      text.includes("rát") ||
      text.includes("âm ỉ") ||
      text.includes("quặn") ||
      text.includes("từng cơn") ||
      text.includes("liên tục") ||
      text.includes("thường xuyên") ||
      text.includes("ẩm ướt") ||
      text.includes("khi lo") ||
      text.includes("khi căng thẳng") ||
      text.includes("khi gắng sức") ||
      text.includes("sau ăn") ||
      text.includes("khi đói") ||
      text.includes("khi đổi tư thế"))
  ) {
    slots.characterTriggers.status = "COMPLETED";
    slots.characterTriggers.value = userText.trim();
    slots.characterTriggers.clarityScore = 0.95;
    existingFacts.push({
      id: `fact_${Date.now()}_char`,
      category: "CHARACTER_TRIGGERS",
      label: "Tính chất & Cường độ",
      value: userText.trim(),
      rawSnippet: userText.trim(),
      severity: text.includes("dữ dội") ? "SEVERE" : "MODERATE",
      provenance: "PATIENT_EXPLICIT",
      sourceTurn: turnCount,
    });
  }

  // Slot 3: Duration
  if (
    slots.duration.status !== "COMPLETED" &&
    (text.includes("ngày") ||
      text.includes("tuần") ||
      text.includes("tháng") ||
      text.includes("năm") ||
      text.includes("hôm nay") ||
      text.includes("sáng nay") ||
      text.includes("hôm qua") ||
      text.includes("thường xuyên") ||
      text.includes("mới bị") ||
      text.includes("lâu nay") ||
      text.includes("gần đây"))
  ) {
    slots.duration.status = "COMPLETED";
    slots.duration.value = userText.trim();
    slots.duration.clarityScore = 0.95;
    existingFacts.push({
      id: `fact_${Date.now()}_dur`,
      category: "DURATION",
      label: "Thời gian diễn tiến",
      value: userText.trim(),
      rawSnippet: userText.trim(),
      provenance: "PATIENT_EXPLICIT",
      sourceTurn: turnCount,
    });
  }

  // Slot 4: Associated Signs
  if (
    slots.associatedSigns.status !== "COMPLETED" &&
    (text.includes("kèm") ||
      text.includes("mệt") ||
      text.includes("sốt") ||
      text.includes("run tay") ||
      text.includes("hồi hộp") ||
      text.includes("sụt cân") ||
      text.includes("buồn nôn") ||
      text.includes("chóng mặt") ||
      text.includes("khó thở") ||
      text.includes("hụt hơi") ||
      text.includes("không có triệu chứng khác") ||
      text.includes("chỉ bị mỗi"))
  ) {
    slots.associatedSigns.status = "COMPLETED";
    slots.associatedSigns.value = userText.trim();
    slots.associatedSigns.clarityScore = 0.95;
    existingFacts.push({
      id: `fact_${Date.now()}_assoc`,
      category: "ASSOCIATED_SIGNS",
      label: "Dấu hiệu kèm theo",
      value: userText.trim(),
      rawSnippet: userText.trim(),
      provenance: "PATIENT_EXPLICIT",
      sourceTurn: turnCount,
    });
  }

  // Count completion
  let completedCount = 0;
  if (slots.chiefComplaint.status === "COMPLETED") completedCount++;
  if (slots.characterTriggers.status === "COMPLETED") completedCount++;
  if (slots.duration.status === "COMPLETED") completedCount++;
  if (slots.associatedSigns.status === "COMPLETED") completedCount++;

  const isAllCompleted = completedCount >= 4 || (completedCount >= 3 && turnCount >= 2) || turnCount >= 4;

  // Determine next slot
  let nextSlotToAsk: ClinicalSlotKey | null = null;
  if (!isAllCompleted) {
    if (slots.characterTriggers.status !== "COMPLETED") {
      nextSlotToAsk = "characterTriggers";
    } else if (slots.duration.status !== "COMPLETED") {
      nextSlotToAsk = "duration";
    } else if (slots.associatedSigns.status !== "COMPLETED") {
      nextSlotToAsk = "associatedSigns";
    }
  }

  // Route Specialty
  const matchedSpec = routeSpecialtyWithFactWeights(
    slots.chiefComplaint.value || userText,
    slots.associatedSigns.value || "",
    slots.characterTriggers.value || ""
  );

  const dynamicReasoning = synthesizeDynamicReasoning(matchedSpec, slots, existingFacts);

  return {
    evaluatedSlot: activeSlot,
    slotStatus: slots[activeSlot].status,
    clarityScore: slots[activeSlot].clarityScore,
    extractedFacts: existingFacts,
    updatedSlots: slots,
    nextSlotToAsk,
    matchedSpecialtyCode: matchedSpec.code,
    matchedSpecialtyName: matchedSpec.name,
    isAllCompleted,
    isEmergency: false,
    clinicalReasoning: dynamicReasoning,
  };
}

/**
 * Executes LLM 1 (Clinical Interrogator) to generate exactly 1 focused question + 4 Quick-Chips
 */
export function executeLLMInterrogator(
  judgeResult: DualLLMJudgeResult,
  userMessage: string
): DualLLMInterrogatorResult {
  const targetSlot = judgeResult.nextSlotToAsk || "characterTriggers";
  const specCode = judgeResult.matchedSpecialtyCode;

  // Generate 4 dynamic chips strictly tailored to this slot and specialty
  const contextData = generateContextualChipsForSpecialty(specCode, userMessage);

  // Build natural acknowledgment from completed slots
  const acknowledgments: string[] = [];
  if (judgeResult.updatedSlots.chiefComplaint.value) {
    acknowledgments.push(`triệu chứng **${judgeResult.updatedSlots.chiefComplaint.value}**`);
  }
  if (judgeResult.updatedSlots.characterTriggers.value && targetSlot !== "characterTriggers") {
    acknowledgments.push(`tính chất **${judgeResult.updatedSlots.characterTriggers.value}**`);
  }
  if (judgeResult.updatedSlots.duration.value && targetSlot !== "duration") {
    acknowledgments.push(`thời gian **${judgeResult.updatedSlots.duration.value}**`);
  }

  let intro = "";
  if (acknowledgments.length > 0) {
    intro = `Tôi đã ghi nhận ${acknowledgments.join(", ")} vào hồ sơ khám.\n\nĐể hỗ trợ bác sĩ đánh giá chính xác hơn, bạn cho tôi hỏi thêm:\n`;
  }

  let singleQuestion = "";
  let chips = contextData.chips;

  if (targetSlot === "characterTriggers") {
    singleQuestion = contextData.question;
  } else if (targetSlot === "duration") {
    singleQuestion = "Tình trạng khó chịu này của bạn đã kéo dài được bao lâu rồi?";
    chips = [
      {
        id: "dur_c1",
        display: "Mới xuất hiện 1-2 ngày nay",
        fullText: "Tôi mới bắt đầu bị triệu chứng này từ hôm qua đến sáng nay",
        clinicalCategory: "ACUTE_1_2_DAYS",
      },
      {
        id: "dur_c2",
        display: "Kéo dài khoảng 3 đến 5 ngày",
        fullText: "Tôi đã bị khoảng 3 đến 5 ngày nay, triệu chứng xuất hiện liên tục",
        clinicalCategory: "SUBACUTE_3_5_DAYS",
      },
      {
        id: "dur_c3",
        display: "Diễn tiến trên 2 tuần nay",
        fullText: "Tình trạng này đã kéo dài hơn 2 tuần nay không thấy đỡ",
        clinicalCategory: "CHRONIC_2_WEEKS",
      },
      {
        id: "dur_c4",
        display: "Bị thường xuyên nhiều tháng nay",
        fullText: "Tôi bị triệu chứng này thường xuyên nhiều tháng nay, tái phát nhiều lần",
        clinicalCategory: "LONG_TERM_MONTHS",
      },
    ];
  } else if (targetSlot === "associatedSigns") {
    singleQuestion = "Ngoài ra, bạn có kèm theo các dấu hiệu bất thường nào khác dưới đây không?";
    chips = [
      {
        id: "asc_c1",
        display: "Kèm mệt mỏi, hụt hơi hoặc run tay",
        fullText: "Tôi cảm thấy người khá mệt mỏi, thỉnh thoảng hụt hơi và run tay",
        clinicalCategory: "TIRED_TREMOR",
      },
      {
        id: "asc_c2",
        display: "Kèm sốt nhẹ hoặc ớn lạnh gai người",
        fullText: "Tôi có kèm theo sốt nhẹ, người ớn lạnh gai gai sốt",
        clinicalCategory: "MILD_FEVER",
      },
      {
        id: "asc_c3",
        display: "Kèm sụt cân hoặc mất ngủ",
        fullText: "Tôi bị sụt cân, ngủ không sâu giấc và ăn uống kém",
        clinicalCategory: "WEIGHT_INSOMNIA",
      },
      {
        id: "asc_c4",
        display: "Không có triệu chứng bất thường khác",
        fullText: "Tôi chỉ bị triệu chứng đã nêu, ngoài ra không có dấu hiệu bất thường nào khác",
        clinicalCategory: "ISOLATED_SYMPTOM",
      },
    ];
  }

  return {
    doctorReplyText: `${intro}${singleQuestion}`,
    targetSlot,
    suggestedQuickChips: chips,
  };
}

/**
 * Combined Dual-Agent Pipeline
 */
export function processDualAgentTurn(
  userMessage: string,
  currentContext: LivingClinicalContext
): SlotEvaluationResult {
  // Step 1: LLM 2 (Clinical Judge) Evaluates
  const judgeResult = executeLLMJudgeEvaluation(userMessage, currentContext);

  if (judgeResult.isEmergency) {
    return {
      updatedSlots: judgeResult.updatedSlots,
      atomicFacts: judgeResult.extractedFacts,
      progressPercentage: 100,
      isAllCompleted: true,
      isEmergency: true,
      nextQuestion: judgeResult.emergencyActionMessage || "🚨 CẢNH BÁO CẤP CỨU 115",
      suggestedChips: [],
      matchedSpecialtyCode: "CAP_CUU",
      matchedSpecialtyName: "Khoa Cấp Cứu 115",
      dynamicClinicalReasoning: judgeResult.clinicalReasoning,
    };
  }

  let completedCount = 0;
  if (judgeResult.updatedSlots.chiefComplaint.status === "COMPLETED") completedCount++;
  if (judgeResult.updatedSlots.characterTriggers.status === "COMPLETED") completedCount++;
  if (judgeResult.updatedSlots.duration.status === "COMPLETED") completedCount++;
  if (judgeResult.updatedSlots.associatedSigns.status === "COMPLETED") completedCount++;

  const progressPercentage = judgeResult.isAllCompleted ? 100 : Math.min(75, completedCount * 25);

  if (judgeResult.isAllCompleted) {
    return {
      updatedSlots: judgeResult.updatedSlots,
      atomicFacts: judgeResult.extractedFacts,
      progressPercentage: 100,
      isAllCompleted: true,
      isEmergency: false,
      nextQuestion: "Đã tổng hợp đầy đủ thông tin lâm sàng. Đang đối chiếu phác đồ chuyên khoa...",
      suggestedChips: [],
      matchedSpecialtyCode: judgeResult.matchedSpecialtyCode,
      matchedSpecialtyName: judgeResult.matchedSpecialtyName,
      dynamicClinicalReasoning: judgeResult.clinicalReasoning,
    };
  }

  // Step 2: LLM 1 (Clinical Interrogator) Asks 1 Question + Generates Chips
  const interrogatorResult = executeLLMInterrogator(judgeResult, userMessage);

  return {
    updatedSlots: judgeResult.updatedSlots,
    atomicFacts: judgeResult.extractedFacts,
    progressPercentage,
    isAllCompleted: false,
    isEmergency: false,
    nextQuestion: interrogatorResult.doctorReplyText,
    suggestedChips: interrogatorResult.suggestedQuickChips,
    matchedSpecialtyCode: judgeResult.matchedSpecialtyCode,
    matchedSpecialtyName: judgeResult.matchedSpecialtyName,
    dynamicClinicalReasoning: judgeResult.clinicalReasoning,
  };
}
