/**
 * Fast In-Memory Working Memory Scratchpad (<1ms)
 * Manages conversation state, active clinical slots, RAG matching,
 * provenance audit events, psychology soothing cards, and Dual-LLM Agent pipeline.
 */

import type { LivingClinicalContext } from "./types";
import { createInitialSlots } from "./clinicalEvaluator";
import { processDualAgentTurn } from "./dualAgentOrchestrator";
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

  // 0. AI Safety & Gateway Interceptor
  const armorResult = sanitizeUserPromptSync(userMessage);

  if (!armorResult.isSafe) {
    currentContext.suggestedChips = []; // Clear chips on security violations
    recordClinicalEvent(sessionId, {
      sessionId,
      turnNumber: currentContext.turnCount + 1,
      eventType: "PATIENT_MESSAGE_INGESTED",
      component: "ModelArmorShield",
      summary: `AI Security Guard: Đã phát hiện và chặn đứng truy vấn vi phạm an toàn (${armorResult.violations.map((v) => v.rule).join(", ")})`,
      payload: { rawText: userMessage, blocked: true, violations: armorResult.violations },
      provenanceCheck: { passed: false, allowedAsPatientFact: false },
    });

    return {
      context: currentContext,
      replyText:
        armorResult.safetyRefusalMessage ||
        "🛡️ **Thông Báo An Toàn & Bảo Mật:** MedAgent AI tuân thủ nghiêm ngặt quy định an toàn thông tin và bảo mật y tế của Bệnh viện. Vui lòng chỉ chia sẻ các triệu chứng sức khỏe để tôi có thể hỗ trợ bạn tốt nhất.",
    };
  }

  // Dual-Agent Orchestration: LLM 2 (Judge) -> LLM 1 (Interrogator)
  const evalResult = processDualAgentTurn(userMessage, currentContext);

  currentContext.turnCount += 1;
  currentContext.slots = evalResult.updatedSlots;
  currentContext.atomicFacts = evalResult.atomicFacts;
  currentContext.progressPercentage = evalResult.progressPercentage;
  currentContext.isEmergency = evalResult.isEmergency;
  currentContext.isCompleted = evalResult.isAllCompleted;

  // Record Ingestion Event
  recordClinicalEvent(sessionId, {
    sessionId,
    turnNumber: currentContext.turnCount,
    eventType: "PATIENT_MESSAGE_INGESTED",
    component: "FactExtractor",
    summary: `Tiếp nhận tin nhắn bệnh nhân: "${userMessage}"`,
    payload: { rawText: userMessage, currentProgress: evalResult.progressPercentage },
    provenanceCheck: {
      passed: true,
      allowedAsPatientFact: true,
    },
  });

  // Record LLM 2 Judge Decision & Slot Mutation Delta
  recordClinicalEvent(sessionId, {
    sessionId,
    turnNumber: currentContext.turnCount,
    eventType: "SLOT_STATE_DELTA",
    component: "ClinicalJudgeAgent",
    summary: `LLM 2 (Judge) thẩm định: ${evalResult.isAllCompleted ? "Đủ 4/4 slots (100%)" : `Tiến độ ${evalResult.progressPercentage}%`} | Chuyên khoa: ${evalResult.matchedSpecialtyName || "Đang phân loại"}`,
    payload: {
      slots: evalResult.updatedSlots,
      atomicFacts: evalResult.atomicFacts,
      progressPercentage: evalResult.progressPercentage,
      isAllCompleted: evalResult.isAllCompleted,
    },
    provenanceCheck: {
      passed: true,
      allowedAsPatientFact: true,
    },
  });

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

    recordClinicalEvent(sessionId, {
      sessionId,
      turnNumber: currentContext.turnCount,
      eventType: "SAFETY_RED_FLAG_TRIAGE",
      component: "SafetyTriageGate",
      summary: "Kích hoạt ngắt khẩn cấp Cấp cứu 115",
      payload: { urgencyLevel: "EMERGENCY_115" },
    });

    MEMORY_CACHE.set(sessionId, currentContext);
    return {
      context: currentContext,
      replyText: evalResult.nextQuestion,
    };
  }

  // 1. KHI CHƯA HOÀN TẤT ĐỦ 4 TRƯỜNG LÂM SÀNG
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

  // 2. KHI ĐÃ ĐỦ THÔNG TIN LÂM SÀNG (100% ĐẠT)
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

  // Kích hoạt LLM 3: Chuyên gia Tâm lý Y khoa (Psychology Specialist)
  currentContext.soothingPayload = generatePsychologicalSoothing({
    specialtyCode: matchedSpec.code,
    specialtyName: matchedSpec.name,
    doctorName: matchedSpec.doctor,
  });

  // Record Routing & RAG Search Event
  recordClinicalEvent(sessionId, {
    sessionId,
    turnNumber: currentContext.turnCount,
    eventType: "RAG_VECTOR_SEARCH_EXECUTED",
    component: "RAGVectorPipeline",
    summary: `Đối chiếu phác đồ BYT cho ${matchedSpec.name}`,
    payload: {
      matchedSpecialty: matchedSpec.name,
      doctor: matchedSpec.doctor,
      citations: matchedSpec.citations,
      reasoning: evalResult.dynamicClinicalReasoning,
    },
  });

  const primaryCitation = matchedSpec.citations[0];
  const symptomSummary = [
    currentContext.slots.chiefComplaint.value,
    currentContext.slots.characterTriggers.value,
    currentContext.slots.duration.value,
    currentContext.slots.associatedSigns.value,
  ]
    .filter(Boolean)
    .join(" — ");

  const replyText =
    `Dựa trên toàn bộ các triệu chứng lâm sàng bạn đã cung cấp (*${symptomSummary}*), tôi đã đối chiếu phác đồ chuyên khoa chuẩn của Bộ Y Tế:\n\n` +
    `🏥 **CHUYÊN KHOA ĐỀ XUẤT:** **${matchedSpec.name}**\n` +
    `👨‍⚕️ **BÁC SĨ PHỤ TRÁCH:** **${matchedSpec.doctor}** (${matchedSpec.room})\n` +
    `💡 **NHẬN ĐỊNH LÂM SÀNG SƠ BỘ:** ${evalResult.dynamicClinicalReasoning || matchedSpec.reasoning}\n` +
    (primaryCitation ? `📚 **PHÁC ĐỒ THAM CHIẾU:** *${primaryCitation.label} (${primaryCitation.documentId})*\n\n` : `\n`) +
    `👇 *Mời bạn chọn 1 trong 3 khung giờ khám khả dụng bên dưới để giữ chỗ gửi Lễ tân duyệt nhé:*`;

  MEMORY_CACHE.set(sessionId, currentContext);
  return { context: currentContext, replyText };
}

export function forceCompleteLivingContext(sessionId: string): LivingClinicalContext {
  const currentContext = getOrCreateLivingContext(sessionId);
  currentContext.progressPercentage = 100;
  currentContext.isCompleted = true;

  // Điền nốt các slot còn thiếu nếu người dùng bấm cưỡng chế hoàn thành
  if (currentContext.slots.chiefComplaint.status !== "COMPLETED") {
    currentContext.slots.chiefComplaint.status = "COMPLETED";
    currentContext.slots.chiefComplaint.value = "Khám sức khỏe & Tư vấn lâm sàng";
    currentContext.slots.chiefComplaint.clarityScore = 0.8;
  }
  if (currentContext.slots.characterTriggers.status !== "COMPLETED") {
    currentContext.slots.characterTriggers.status = "COMPLETED";
    currentContext.slots.characterTriggers.value = "Khó chịu mức độ vừa";
    currentContext.slots.characterTriggers.clarityScore = 0.8;
  }
  if (currentContext.slots.duration.status !== "COMPLETED") {
    currentContext.slots.duration.status = "COMPLETED";
    currentContext.slots.duration.value = "Gần đây";
    currentContext.slots.duration.clarityScore = 0.8;
  }
  if (currentContext.slots.associatedSigns.status !== "COMPLETED") {
    currentContext.slots.associatedSigns.status = "COMPLETED";
    currentContext.slots.associatedSigns.value = "Không có dấu hiệu nguy kịch";
    currentContext.slots.associatedSigns.clarityScore = 0.8;
  }

  const spec = CLINICAL_SPECIALTIES[0];
  currentContext.detectedSpecialtyCode = spec.code;
  currentContext.detectedSpecialtyName = spec.name;
  currentContext.assignedDoctorName = spec.doctor;
  currentContext.assignedRoom = spec.room;
  currentContext.activeCitations = spec.citations;
  currentContext.suggestedChips = [];
  currentContext.appointmentOffers = generateOffers(spec);
  currentContext.soothingPayload = generatePsychologicalSoothing({
    specialtyCode: spec.code,
    specialtyName: spec.name,
    doctorName: spec.doctor,
  });

  MEMORY_CACHE.set(sessionId, currentContext);
  return currentContext;
}
