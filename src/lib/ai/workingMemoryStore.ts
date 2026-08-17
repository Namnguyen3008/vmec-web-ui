/**
 * Fast In-Memory Working Memory Scratchpad
 * Manages conversation state, active clinical slots, RAG matching,
 * provenance audit events, and psychology soothing cards.
 * Integrated with 2-Stage Gemini 3.1 & 3.5 Flash Lite Live API Inference.
 */

import type { LivingClinicalContext } from "./types";
import { createInitialSlots, evaluateClinicalMessage, evaluateClinicalMessageAsync } from "./clinicalEvaluator";
import { CLINICAL_SPECIALTIES, generateOffers } from "@/lib/api/chat";
import { generatePsychologicalSoothing } from "./psychologySpecialist";
import { recordClinicalEvent } from "./observabilityRecorder";
import { sanitizeUserPromptSync } from "./modelArmorClient";

const MEMORY_CACHE = new Map<string, LivingClinicalContext>();

export function getOrCreateLivingContext(sessionId: string): LivingClinicalContext {
  const existing = MEMORY_CACHE.get(sessionId);
  if (existing) return existing;

  const newContext: LivingClinicalContext = {
    sessionId,
    turnCount: 0,
    progressPercentage: 0,
    urgencyLevel: "ROUTINE",
    slots: createInitialSlots(),
    atomicFacts: [],
    activeCitations: [],
    suggestedChips: [],
    isEmergency: false,
    isCompleted: false,
    appointmentOffers: [],
  };

  MEMORY_CACHE.set(sessionId, newContext);
  return newContext;
}

export function updateLivingContextWithUserMessage(
  sessionId: string,
  userMessage: string
): { context: LivingClinicalContext; replyText: string } {
  const currentContext = getOrCreateLivingContext(sessionId);

  // 0. Safety Gateway
  const armorResult = sanitizeUserPromptSync(userMessage);
  if (!armorResult.isSafe) {
    recordClinicalEvent(sessionId, {
      sessionId,
      turnNumber: currentContext.turnCount + 1,
      eventType: "PATIENT_MESSAGE_INGESTED",
      component: "ModelArmorShield",
      summary: `Google Model Armor: Đã phát hiện và chặn đứng truy vấn vi phạm an toàn (${armorResult.violations.map((v) => v.rule).join(", ")})`,
      payload: { rawText: userMessage, blocked: true, violations: armorResult.violations },
      provenanceCheck: { passed: false, allowedAsPatientFact: false },
    });

    currentContext.suggestedChips = [
      {
        id: "sec_1",
        display: "Đau tức ngực trái khi gắng sức",
        fullText: "Tôi bị đau tức ngực trái khi leo cầu thang và hồi hộp",
        clinicalCategory: "CARDIAC",
      },
      {
        id: "sec_2",
        display: "Đau đầu nhói buốt dữ dội",
        fullText: "Tôi bị đau đầu nhói buốt dữ dội từng cơn",
        clinicalCategory: "NEURO",
      },
      {
        id: "sec_3",
        display: "Đau âm ỉ vùng thượng vị, ợ chua",
        fullText: "Tôi bị đau âm ỉ vùng thượng vị sau khi ăn kèm ợ chua",
        clinicalCategory: "GASTRO",
      },
      {
        id: "sec_4",
        display: "Đau nhức khớp gối, khó đi lại",
        fullText: "Tôi bị đau nhức khớp gối nhiều ngày nay đi lại khó khăn",
        clinicalCategory: "CO_XUONG_KHOP",
      },
    ];

    return {
      context: currentContext,
      replyText: armorResult.safetyRefusalMessage!,
    };
  }

  const evalResult = evaluateClinicalMessage(userMessage, currentContext);

  currentContext.turnCount += 1;
  currentContext.slots = evalResult.updatedSlots;
  currentContext.atomicFacts = evalResult.atomicFacts;
  currentContext.progressPercentage = evalResult.progressPercentage;
  currentContext.isEmergency = evalResult.isEmergency;
  currentContext.isCompleted = evalResult.isAllCompleted;

  // Record Events
  recordClinicalEvent(sessionId, {
    sessionId,
    turnNumber: currentContext.turnCount,
    eventType: "PATIENT_MESSAGE_INGESTED",
    component: "FactExtractor",
    summary: `Tiếp nhận tin nhắn bệnh nhân: "${userMessage}"`,
    payload: { rawText: userMessage, currentProgress: evalResult.progressPercentage },
    provenanceCheck: { passed: true, allowedAsPatientFact: true },
  });

  recordClinicalEvent(sessionId, {
    sessionId,
    turnNumber: currentContext.turnCount,
    eventType: "SLOT_STATE_DELTA",
    component: "FactExtractor",
    summary: `Cập nhật Slots & Atomic Facts (Tổng: ${evalResult.atomicFacts.length} facts)`,
    payload: { slots: evalResult.updatedSlots, atomicFacts: evalResult.atomicFacts },
    provenanceCheck: { passed: true, allowedAsPatientFact: true },
  });

  if (evalResult.judgeResult) {
    currentContext.lastJudgeResult = evalResult.judgeResult;
    recordClinicalEvent(sessionId, {
      sessionId,
      turnNumber: currentContext.turnCount,
      eventType: "SLOT_STATE_DELTA",
      component: "ClinicalJudgeLLM",
      summary: `Judge LLM Thẩm định [${evalResult.judgeResult.targetSlot}]: ${evalResult.judgeResult.verdict === "SATISFIED" ? "ĐẠT CHUẨN ✅" : "CHƯA ĐẠT ⚠️"} (Độ rõ: ${(evalResult.judgeResult.clarityScore * 100).toFixed(0)}%)`,
      payload: {
        targetSlot: evalResult.judgeResult.targetSlot,
        verdict: evalResult.judgeResult.verdict,
        clarityScore: evalResult.judgeResult.clarityScore,
        reasoning: evalResult.judgeResult.reasoning,
        extractedFact: evalResult.judgeResult.extractedFact,
      },
      provenanceCheck: { passed: evalResult.judgeResult.verdict === "SATISFIED", allowedAsPatientFact: true },
    });
  }

  if (evalResult.isEmergency) {
    currentContext.urgencyLevel = "EMERGENCY_115";
    currentContext.suggestedChips = [];
    currentContext.appointmentOffers = [];
    currentContext.activeCitations = [
      {
        sourceId: "BYT_EMERGENCY_2026",
        documentId: "TT-01/2026/TT-BYT",
        label: "Tiêu chuẩn phân loại Triage Cấp cứu CATT (Bộ Y Tế)",
        url: "https://kcb.vn",
        sectionTitle: "Mục Cấp cứu tối cấp: Báo động đỏ 115",
        confidence: 99,
        snippet: "Bệnh nhân có dấu hiệu nguy kịch cần chuyển ngay vào phòng Cấp cứu.",
      },
    ];

    MEMORY_CACHE.set(sessionId, currentContext);
    return { context: currentContext, replyText: evalResult.nextQuestion };
  }

  if (!evalResult.isAllCompleted) {
    currentContext.detectedSpecialtyCode = undefined;
    currentContext.detectedSpecialtyName = undefined;
    currentContext.assignedDoctorName = undefined;
    currentContext.assignedRoom = undefined;
    currentContext.activeCitations = [];
    currentContext.appointmentOffers = [];
    currentContext.soothingPayload = null;
    currentContext.suggestedChips = evalResult.suggestedChips;
    currentContext.currentQuestion = evalResult.nextQuestion;

    MEMORY_CACHE.set(sessionId, currentContext);
    return { context: currentContext, replyText: evalResult.nextQuestion };
  }

  // 100% Completed
  const matchedSpec =
    CLINICAL_SPECIALTIES.find((s) => s.code === evalResult.matchedSpecialtyCode) ||
    CLINICAL_SPECIALTIES[0];

  currentContext.urgencyLevel = "PRIORITY_LEVEL_2";
  currentContext.detectedSpecialtyCode = matchedSpec.code;
  currentContext.detectedSpecialtyName = matchedSpec.name;
  currentContext.assignedDoctorName = matchedSpec.doctor;
  currentContext.assignedRoom = matchedSpec.room;
  currentContext.activeCitations = matchedSpec.citations;
  currentContext.suggestedChips = [];
  currentContext.appointmentOffers = generateOffers(matchedSpec);
  currentContext.soothingPayload = generatePsychologicalSoothing({
    specialtyCode: matchedSpec.code,
    specialtyName: matchedSpec.name,
    doctorName: matchedSpec.doctor,
  });

  const primaryCitation = matchedSpec.citations[0];
  const soothingMsg = currentContext.soothingPayload?.comfortingMessage ||
    `Bạn hãy yên tâm nhé, các bác sĩ chuyên khoa ${matchedSpec.name} sẽ đồng hành và chăm sóc sức khỏe chu đáo nhất cho bạn.`;

  const replyText =
    `🌿 **LỜI NHẮN AN TÂM TỪ BÁC SĨ:**\n` +
    `*${soothingMsg}*\n\n` +
    `---\n\n` +
    `🏥 **CHUYÊN KHOA ĐỀ XUẤT:** **${matchedSpec.name}**\n` +
    `👨‍⚕️ **BÁC SĨ PHỤ TRÁCH:** **${matchedSpec.doctor}** (${matchedSpec.room})\n` +
    `💡 **NHẬN ĐỊNH LÂM SÀNG SƠ BỘ:** ${evalResult.dynamicClinicalReasoning || matchedSpec.reasoning}\n` +
    (primaryCitation ? `📚 **PHÁC ĐỒ THAM CHIẾU:** *${primaryCitation.label} (${primaryCitation.documentId})*\n\n` : `\n`) +
    `📋 **CHỈ DẪN CHUẨN BỊ TRƯỚC KHI ĐẾN KHÁM:**\n` +
    `• **Giấy tờ cần mang:** CCCD/VNeID, thẻ BHYT (nếu có) và sổ khám/đơn thuốc cũ đã từng sử dụng.\n` +
    `• **Thời gian có mặt:** Bạn nên đến trước giờ hẹn 10 - 15 phút tại Quầy Lễ tân để nhận phiếu số thứ tự ưu tiên.\n` +
    `• **Lưu ý ăn uống:** Nên nhịn ăn sáng nếu cần làm xét nghiệm máu hoặc siêu âm ổ bụng (vẫn được uống nước lọc).\n\n` +
    `👇 *Mời bạn chọn 1 trong 3 khung giờ khám khả dụng bên dưới để giữ chỗ gửi Lễ tân duyệt nhé:*`;

  MEMORY_CACHE.set(sessionId, currentContext);
  return { context: currentContext, replyText };
}

export async function updateLivingContextWithUserMessageAsync(
  sessionId: string,
  userMessage: string
): Promise<{ context: LivingClinicalContext; replyText: string }> {
  const currentContext = getOrCreateLivingContext(sessionId);

  // 0. Safety Gateway
  const armorResult = sanitizeUserPromptSync(userMessage);
  if (!armorResult.isSafe) {
    return updateLivingContextWithUserMessage(sessionId, userMessage);
  }

  // 1. Live 2-Stage Gemini API Execution
  const evalResult = await evaluateClinicalMessageAsync(userMessage, currentContext);

  currentContext.turnCount += 1;
  currentContext.slots = evalResult.updatedSlots;
  currentContext.atomicFacts = evalResult.atomicFacts;
  currentContext.progressPercentage = evalResult.progressPercentage;
  currentContext.isEmergency = evalResult.isEmergency;
  currentContext.isCompleted = evalResult.isAllCompleted;

  if (evalResult.judgeResult) {
    currentContext.lastJudgeResult = evalResult.judgeResult;
    recordClinicalEvent(sessionId, {
      sessionId,
      turnNumber: currentContext.turnCount,
      eventType: "SLOT_STATE_DELTA",
      component: "ClinicalJudgeLLM",
      summary: `Judge LLM Thẩm định [${evalResult.judgeResult.targetSlot}]: ${evalResult.judgeResult.verdict === "SATISFIED" ? "ĐẠT CHUẨN ✅" : "CHƯA ĐẠT ⚠️"} (Độ rõ: ${(evalResult.judgeResult.clarityScore * 100).toFixed(0)}%)`,
      payload: {
        targetSlot: evalResult.judgeResult.targetSlot,
        verdict: evalResult.judgeResult.verdict,
        clarityScore: evalResult.judgeResult.clarityScore,
        reasoning: evalResult.judgeResult.reasoning,
        extractedFact: evalResult.judgeResult.extractedFact,
      },
      provenanceCheck: {
        passed: evalResult.judgeResult.verdict === "SATISFIED",
        allowedAsPatientFact: true,
      },
    });
  }

  if (evalResult.isEmergency) {
    return updateLivingContextWithUserMessage(sessionId, userMessage);
  }

  if (!evalResult.isAllCompleted) {
    currentContext.detectedSpecialtyCode = undefined;
    currentContext.detectedSpecialtyName = undefined;
    currentContext.assignedDoctorName = undefined;
    currentContext.assignedRoom = undefined;
    currentContext.activeCitations = [];
    currentContext.appointmentOffers = [];
    currentContext.soothingPayload = null;
    currentContext.suggestedChips = evalResult.suggestedChips;
    currentContext.currentQuestion = evalResult.nextQuestion;

    MEMORY_CACHE.set(sessionId, currentContext);
    return {
      context: currentContext,
      replyText: evalResult.nextQuestion,
    };
  }

  const matchedSpec =
    CLINICAL_SPECIALTIES.find((s) => s.code === evalResult.matchedSpecialtyCode) ||
    CLINICAL_SPECIALTIES[0];

  currentContext.urgencyLevel = "PRIORITY_LEVEL_2";
  currentContext.detectedSpecialtyCode = matchedSpec.code;
  currentContext.detectedSpecialtyName = matchedSpec.name;
  currentContext.assignedDoctorName = matchedSpec.doctor;
  currentContext.assignedRoom = matchedSpec.room;
  currentContext.activeCitations = matchedSpec.citations;
  currentContext.suggestedChips = [];
  currentContext.appointmentOffers = generateOffers(matchedSpec);
  currentContext.soothingPayload = generatePsychologicalSoothing({
    specialtyCode: matchedSpec.code,
    specialtyName: matchedSpec.name,
    doctorName: matchedSpec.doctor,
  });

  const primaryCitation = matchedSpec.citations[0];
  const soothingMsg = currentContext.soothingPayload?.comfortingMessage ||
    `Bạn hãy yên tâm nhé, các bác sĩ chuyên khoa ${matchedSpec.name} sẽ đồng hành và chăm sóc sức khỏe chu đáo nhất cho bạn.`;

  const replyText =
    `🌿 **LỜI NHẮN AN TÂM TỪ BÁC SĨ:**\n` +
    `*${soothingMsg}*\n\n` +
    `---\n\n` +
    `🏥 **CHUYÊN KHOA ĐỀ XUẤT:** **${matchedSpec.name}**\n` +
    `👨‍⚕️ **BÁC SĨ PHỤ TRÁCH:** **${matchedSpec.doctor}** (${matchedSpec.room})\n` +
    `💡 **NHẬN ĐỊNH LÂM SÀNG SƠ BỘ:** ${evalResult.dynamicClinicalReasoning || matchedSpec.reasoning}\n` +
    (primaryCitation ? `📚 **PHÁC ĐỒ THAM CHIẾU:** *${primaryCitation.label} (${primaryCitation.documentId})*\n\n` : `\n`) +
    `📋 **CHỈ DẪN CHUẨN BỊ TRƯỚC KHI ĐẾN KHÁM:**\n` +
    `• **Giấy tờ cần mang:** CCCD/VNeID, thẻ BHYT (nếu có) và sổ khám/đơn thuốc cũ đã từng sử dụng.\n` +
    `• **Thời gian có mặt:** Bạn nên đến trước giờ hẹn 10 - 15 phút tại Quầy Lễ tân để nhận phiếu số thứ tự ưu tiên.\n` +
    `• **Lưu ý ăn uống:** Nên nhịn ăn sáng nếu cần làm xét nghiệm máu hoặc siêu âm ổ bụng (vẫn được uống nước lọc).\n\n` +
    `👇 *Mời bạn chọn 1 trong 3 khung giờ khám khả dụng bên dưới để giữ chỗ gửi Lễ tân duyệt nhé:*`;

  MEMORY_CACHE.set(sessionId, currentContext);
  return { context: currentContext, replyText };
}

export function forceCompleteLivingContext(sessionId: string): LivingClinicalContext {
  const currentContext = getOrCreateLivingContext(sessionId);
  currentContext.progressPercentage = 100;
  currentContext.isCompleted = true;

  const matchedSpec =
    CLINICAL_SPECIALTIES.find((s) => s.code === currentContext.detectedSpecialtyCode) ||
    CLINICAL_SPECIALTIES[0];

  currentContext.detectedSpecialtyCode = matchedSpec.code;
  currentContext.detectedSpecialtyName = matchedSpec.name;
  currentContext.assignedDoctorName = matchedSpec.doctor;
  currentContext.assignedRoom = matchedSpec.room;
  currentContext.activeCitations = matchedSpec.citations;
  currentContext.suggestedChips = [];
  currentContext.appointmentOffers = generateOffers(matchedSpec);
  currentContext.soothingPayload = generatePsychologicalSoothing({
    specialtyCode: matchedSpec.code,
    specialtyName: matchedSpec.name,
    doctorName: matchedSpec.doctor,
  });

  MEMORY_CACHE.set(sessionId, currentContext);
  return currentContext;
}

export function resetLivingContext(sessionId: string): LivingClinicalContext {
  const cleanContext: LivingClinicalContext = {
    sessionId,
    turnCount: 0,
    progressPercentage: 0,
    urgencyLevel: "ROUTINE",
    slots: createInitialSlots(),
    atomicFacts: [],
    activeCitations: [],
    suggestedChips: [],
    isEmergency: false,
    isCompleted: false,
    appointmentOffers: [],
  };
  MEMORY_CACHE.set(sessionId, cleanContext);
  return cleanContext;
}
