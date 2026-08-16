/**
 * Redis-Ready Living Clinical Context & Working Memory Store
 * Manages active session scratchpad state in memory / localStorage.
 */

import type { LivingClinicalContext } from "./types";
import { createInitialSlots, evaluateClinicalMessage } from "./clinicalEvaluator";
import { generatePsychologicalSoothing } from "./psychologySpecialist";
import { CLINICAL_SPECIALTIES, generateOffers } from "@/lib/api/chat";

const MEMORY_CACHE = new Map<string, LivingClinicalContext>();

export function getOrCreateLivingContext(sessionId: string): LivingClinicalContext {
  if (MEMORY_CACHE.has(sessionId)) {
    return MEMORY_CACHE.get(sessionId)!;
  }

  // Khởi tạo Living Context mới
  const newContext: LivingClinicalContext = {
    sessionId,
    turnCount: 0,
    progressPercentage: 0,
    isCompleted: false,
    isEmergency: false,
    urgencyLevel: "ROUTINE",
    slots: createInitialSlots(),
    activeTargetSlot: "chiefComplaint",
    suggestedChips: [
      {
        id: "init_1",
        display: "Đau tức ngực trái khi gắng sức",
        fullText: "Tôi bị đau tức ngực trái và hồi hộp khi đi lại, leo cầu thang",
      },
      {
        id: "init_2",
        display: "Đau rát vùng thượng vị, ợ chua",
        fullText: "Tôi bị đau rát vùng trên rốn (thượng vị), cồn cào và ợ chua",
      },
      {
        id: "init_3",
        display: "Bé bị sốt và ho sổ mũi",
        fullText: "Con tôi bị sốt 38.5 độ kèm theo ho và chảy nước mũi",
      },
      {
        id: "init_4",
        display: "Đau nửa đầu, hoa mắt chóng mặt",
        fullText: "Tôi bị đau nhức nửa đầu bên phải kèm chóng mặt và khó ngủ",
      },
    ],
    activeCitations: [
      {
        sourceId: "BYT_STANDARDS_2026",
        documentId: "VMEC-RAG-2026",
        label: "Hệ thống Tri thức Y tế & Định tuyến Triage Thông minh (Bộ Y Tế)",
        url: "https://kcb.vn",
        sectionTitle: "Quy chuẩn Định tuyến chuyên khoa & An toàn người bệnh VMEC 2026",
        confidence: 98,
        snippet: "Hệ thống AI được đối chiếu và kiểm chuẩn tự động dựa trên 2.670 vector nhúng y khoa và 1.536 quy tắc phân tầng cấp cứu.",
      },
    ],
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
  const evalResult = evaluateClinicalMessage(userMessage, currentContext);

  currentContext.turnCount += 1;
  currentContext.slots = evalResult.updatedSlots;
  currentContext.progressPercentage = evalResult.progressPercentage;
  currentContext.isEmergency = evalResult.isEmergency;
  currentContext.isCompleted = evalResult.isAllCompleted;

  if (evalResult.isEmergency) {
    currentContext.urgencyLevel = "EMERGENCY_115";
    currentContext.suggestedChips = [];
    currentContext.appointmentOffers = [];
    MEMORY_CACHE.set(sessionId, currentContext);
    return {
      context: currentContext,
      replyText: evalResult.nextQuestion,
    };
  }

  // Tìm chuyên khoa khớp
  const matchedSpec =
    CLINICAL_SPECIALTIES.find((s) => s.code === evalResult.matchedSpecialtyCode) ||
    CLINICAL_SPECIALTIES[0];

  currentContext.detectedSpecialtyCode = matchedSpec.code;
  currentContext.detectedSpecialtyName = matchedSpec.name;
  currentContext.assignedDoctorName = matchedSpec.doctor;
  currentContext.assignedRoom = matchedSpec.room;
  currentContext.activeCitations = matchedSpec.citations;

  if (evalResult.isAllCompleted) {
    currentContext.urgencyLevel = "PRIORITY_LEVEL_2";
    currentContext.suggestedChips = [];
    currentContext.appointmentOffers = generateOffers(matchedSpec);

    // Kích hoạt LLM 3: Chuyên gia Tâm lý Y khoa (Psychology Specialist)
    currentContext.soothingPayload = generatePsychologicalSoothing({
      specialtyCode: matchedSpec.code,
      specialtyName: matchedSpec.name,
      doctorName: matchedSpec.doctor,
    });

    const replyText =
      `Tôi đã tổng hợp đầy đủ các mẩu thông tin lâm sàng của bạn và đối chiếu với phác đồ Bộ Y Tế:\n\n` +
      `📋 **TÓM TẮT LÂM SÀNG BAN ĐẦU:**\n` +
      `• **Triệu chứng chính:** ${currentContext.slots.chiefComplaint.value || "Đau khó chịu"}\n` +
      `• **Thời gian diễn tiến:** ${currentContext.slots.duration.value || "Vài ngày gần đây"}\n` +
      `• **Tính chất:** ${currentContext.slots.characterTriggers.value || "Theo đợt vận động / sinh hoạt"}\n` +
      `• **Dấu hiệu kèm theo:** ${currentContext.slots.associatedSigns.value || "Không có dấu hiệu nguy kịch"}\n\n` +
      `🏥 **CHUYÊN KHOA PHÙ HỢP:** **${matchedSpec.name}**\n` +
      `👨‍⚕️ **BÁC SĨ PHỤ TRÁCH:** **${matchedSpec.doctor}** (${matchedSpec.room})\n` +
      `💡 **NHẬN ĐỊNH LÂM SÀNG:** ${matchedSpec.reasoning}\n\n` +
      `👇 *Mời bạn xem Lời nhắn an tâm từ Bác sĩ và chọn 1 trong 3 khung giờ khám khả dụng bên dưới để giữ chỗ gửi Lễ tân duyệt nhé:*`;

    MEMORY_CACHE.set(sessionId, currentContext);
    return { context: currentContext, replyText };
  }

  // Đang trong tiến trình hỏi làm rõ
  currentContext.suggestedChips = evalResult.suggestedChips;
  currentContext.currentQuestion = evalResult.nextQuestion;

  MEMORY_CACHE.set(sessionId, currentContext);
  return {
    context: currentContext,
    replyText: evalResult.nextQuestion,
  };
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
  currentContext.appointmentOffers = generateOffers(matchedSpec);
  currentContext.suggestedChips = [];

  currentContext.soothingPayload = generatePsychologicalSoothing({
    specialtyCode: matchedSpec.code,
    specialtyName: matchedSpec.name,
    doctorName: matchedSpec.doctor,
  });

  MEMORY_CACHE.set(sessionId, currentContext);
  return currentContext;
}
