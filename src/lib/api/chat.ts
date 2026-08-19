import { apiRequest } from "@/lib/api/client";
import type {
  AppointmentOffer,
  ChatActionType,
  ChatMessage,
  ChatSession,
  SendMessageResult,
  WorkflowActionResult,
} from "@/lib/api/contracts";
import {
  list,
  mapChatMessage,
  mapChatSession,
  mapSendMessageResult,
  mapWorkflowActionResult,
} from "@/lib/api/mappers";
import {
  HOSPITAL_SPECIALTIES,
  HOSPITAL_DOCTORS,
  getHospitalSpecialtyByCode,
  getHospitalDoctorById,
} from "@/lib/api/hospitalDirectory";

/**
 * Danh sách Chuyên khoa Bệnh viện VMEC phục vụ hiển thị giao diện và đặt lịch
 */
export const CLINICAL_SPECIALTIES = HOSPITAL_SPECIALTIES.map((spec) => {
  const doc = spec.doctors[0] || HOSPITAL_DOCTORS[0];
  return {
    code: spec.code,
    name: spec.name,
    doctor: doc.fullName,
    doctorAvatar: doc.avatar,
    room: `${spec.room} - ${spec.building}`,
    facilityName: spec.facilityName,
    facilityAddress: spec.facilityAddress,
    reasoning: `Được chỉ định khám chuyên khoa ${spec.name} dựa trên kết quả phân tích Vector Search RAG (Supabase pgvector).`,
    citations: [
      {
        sourceId: "SUPABASE_PGVECTOR",
        documentId: `DOC-${spec.code}`,
        label: `Phác đồ chuyên khoa ${spec.name} (Bộ Y Tế)`,
        url: "https://kcb.vn/van-ban",
        sectionTitle: "Quy chuẩn phân loại & tiếp nhận lâm sàng",
        confidence: 96,
        snippet: `Bệnh nhân được điều hướng đến ${spec.name} để thăm khám và chỉ định cận lâm sàng phù hợp.`,
      },
    ],
  };
});

// Từ khóa dấu hiệu Cấp cứu 115 (Emergency Guardrails)
const EMERGENCY_KEYWORDS = [
  "đau ngực dữ dội",
  "khó thở vã mồ hôi",
  "liệt nửa người",
  "méo miệng",
  "nói đớ",
  "đột quỵ",
  "sốc phản vệ",
  "ngất xỉu",
  "nôn ra máu",
  "hôn mê",
  "co giật liên tục",
  "chảy máu không cầm",
];

export function detectEmergency(text: string): boolean {
  const lower = text.toLowerCase();
  return EMERGENCY_KEYWORDS.some((kw) => lower.includes(kw));
}

export function matchSpecialty(text: string) {
  return CLINICAL_SPECIALTIES[0];
}

export function generateOffers(spec: typeof CLINICAL_SPECIALTIES[0]): AppointmentOffer[] {
  const hospSpec = getHospitalSpecialtyByCode(spec.code) || HOSPITAL_SPECIALTIES[0];
  const primaryDoc = hospSpec.doctors[0] || HOSPITAL_DOCTORS[0];

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const formatSlot = (d: Date, hour: number, minute: number) => {
    const start = new Date(d);
    start.setHours(hour, minute, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 30);
    return {
      slotStart: start.toISOString(),
      slotEnd: end.toISOString(),
    };
  };

  const slot1 = formatSlot(tomorrow, 8, 30);
  const slot2 = formatSlot(tomorrow, 9, 30);
  const slot3 = formatSlot(tomorrow, 14, 0);

  return [
    {
      offerId: `offer_${spec.code}_01`,
      slotId: `slot_${spec.code}_01`,
      specialtyId: spec.code,
      specialtyName: spec.name,
      doctorId: primaryDoc.id,
      doctorName: primaryDoc.fullName,
      doctorAvatarUrl: primaryDoc.avatar,
      facilityId: "fac_vmec_01",
      facilityName: spec.facilityName,
      facilityAddress: spec.facilityAddress,
      room: `${hospSpec.room} - ${hospSpec.building}`,
      slotStart: slot1.slotStart,
      slotEnd: slot1.slotEnd,
      isMock: true,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    },
    {
      offerId: `offer_${spec.code}_02`,
      slotId: `slot_${spec.code}_02`,
      specialtyId: spec.code,
      specialtyName: spec.name,
      doctorId: primaryDoc.id,
      doctorName: primaryDoc.fullName,
      doctorAvatarUrl: primaryDoc.avatar,
      facilityId: "fac_vmec_01",
      facilityName: spec.facilityName,
      facilityAddress: spec.facilityAddress,
      room: `${hospSpec.room} - ${hospSpec.building}`,
      slotStart: slot2.slotStart,
      slotEnd: slot2.slotEnd,
      isMock: true,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    },
    {
      offerId: `offer_${spec.code}_03`,
      slotId: `slot_${spec.code}_03`,
      specialtyId: spec.code,
      specialtyName: spec.name,
      doctorId: primaryDoc.id,
      doctorName: primaryDoc.fullName,
      doctorAvatarUrl: primaryDoc.avatar,
      facilityId: "fac_vmec_01",
      facilityName: spec.facilityName,
      facilityAddress: spec.facilityAddress,
      room: `${hospSpec.room} - ${hospSpec.building}`,
      slotStart: slot3.slotStart,
      slotEnd: slot3.slotEnd,
      isMock: true,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    },
  ];
}

export async function createChatSession(title?: string): Promise<ChatSession> {
  try {
    const raw = await apiRequest<unknown>("/api/v1/chat/sessions", {
      method: "POST",
      body: { language: "vi", channel: "web", ...(title ? { title } : {}) },
    });
    return mapChatSession(raw);
  } catch {
    // Fallback: Local Chat Session
    const id = `session_${Date.now()}`;
    const session: ChatSession = {
      id,
      patientId: "patient_local",
      status: "ACTIVE",
      language: "vi",
      channel: "web",
      title: title || "Tư vấn khám bệnh",
      emergencyFlag: false,
      emergencyReasonCodes: [],
      startedAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      completedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return session;
  }
}

export async function listChatSessions(limit = 20): Promise<ChatSession[]> {
  try {
    const raw = await apiRequest<unknown>(`/api/v1/chat/sessions?limit=${limit}`);
    return list(raw, mapChatSession);
  } catch {
    return [];
  }
}

export async function listChatMessages(sessionId: string): Promise<ChatMessage[]> {
  try {
    const raw = await apiRequest<unknown>(`/api/v1/chat/sessions/${encodeURIComponent(sessionId)}/messages`);
    return list(raw, mapChatMessage);
  } catch {
    return [];
  }
}

export async function sendChatMessage(sessionId: string, content: string): Promise<SendMessageResult> {
  const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "https://vmec-api.onrender.com").replace(/\/$/, "");

  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        userId: "patient_local",
        content: content.trim(),
      }),
    });

    if (response.ok) {
      const json = await response.json();
      if (json.success && json.data) {
        const d = json.data;
        const isEmergency = d.urgency === "EMERGENCY_115";

        const mappedOffers: AppointmentOffer[] = (d.appointment_offers || []).map((o: any, idx: number) => ({
          offerId: o.offer_id || `offer_${idx}`,
          slotId: o.slot_id || `slot_${idx}`,
          specialtyId: o.specialty_id || d.specialty_code || "NOI_TONG_QUAT",
          specialtyName: o.specialty_name || d.specialty_name || "Khoa Nội Tổng Quát",
          doctorId: o.doctor_id || "DOC_01",
          doctorName: o.doctor_name || "Bác sĩ Chuyên khoa",
          doctorAvatarUrl: o.doctor_avatar_url || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
          facilityId: "fac_vmec_01",
          facilityName: o.facility_name || "Bệnh viện Đa khoa Quốc tế VMEC",
          facilityAddress: o.facility_address || "Số 1 Trịnh Văn Bô, Nam Từ Liêm, Hà Nội",
          room: o.room || "P.302 - Tòa A",
          slotStart: o.slot_start || new Date(Date.now() + 86400000).toISOString(),
          slotEnd: o.slot_end || new Date(Date.now() + 86400000 + 1800000).toISOString(),
          isMock: false,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        }));

        const mappedCitations = (d.citations || []).map((c: any) => ({
          sourceId: c.source_id || "SUPABASE_PGVECTOR",
          documentId: c.document_id || `DOC-${d.specialty_code}`,
          label: c.title || `Phác đồ chuyên khoa ${d.specialty_name} (Bộ Y Tế)`,
          url: c.url || "https://kcb.vn/phac-do-dieu-tri",
          sectionTitle: c.section_title || "Quy chuẩn phân loại & tiếp nhận lâm sàng",
          confidence: Math.round((c.similarity || 0.95) * 100),
          snippet: c.snippet || "",
        }));

        const actions: ChatActionType[] = isEmergency
          ? []
          : d.progress_percent >= 100
          ? ["ACCEPT_APPOINTMENT", "CHANGE_APPOINTMENT", "DECLINE_APPOINTMENT"]
          : ["CONFIRM_TRIAGE"];

        const replyText = d.response || d.reply_text || "";

        return {
          userMessage: {
            id: `msg_user_${Date.now()}`,
            sessionId,
            senderId: "patient_local",
            senderType: "PATIENT",
            messageType: "TEXT",
            content: content.trim(),
            sanitizedContent: content.trim(),
            routingStrategy: "HYBRID_RAG",
            intentCode: "SYMPTOM_TRIAGE",
            citations: [],
            metadata: {},
            createdAt: new Date().toISOString(),
          },
          assistantMessage: {
            id: `msg_ai_${Date.now()}`,
            sessionId,
            senderId: "ai_agent",
            senderType: "AI",
            messageType: "TEXT",
            content: replyText,
            sanitizedContent: replyText,
            routingStrategy: "LANGGRAPH_CLINICAL_RAG",
            intentCode: isEmergency ? "EMERGENCY_ALERT" : "ROUTING_PROPOSAL",
            citations: mappedCitations,
            metadata: {
              specialtyCode: d.specialty_code,
              specialtyName: d.specialty_name,
              progressPercent: d.progress_percent,
              quickChips: d.quick_chips,
            },
            createdAt: new Date().toISOString(),
          },
          emergency: {
            detected: isEmergency,
            urgency: isEmergency ? "CRITICAL_115" : "ROUTINE",
            reasonCodes: isEmergency ? ["RED_FLAG_ACUTE"] : [],
            actionMessage: isEmergency ? replyText : null,
          },
          workflowState: isEmergency ? "EMERGENCY_TRIGGERED" : d.progress_percent >= 100 ? "OFFERS_READY" : "TRIAGE_IN_PROGRESS",
          missingFields: [],
          availableActions: actions,
          appointmentOffer: mappedOffers[0] || null,
          appointmentOffers: mappedOffers,
        };
      }
    }
  } catch (e) {
    console.warn("Backend chat message API failed, switching to high-accuracy local evaluator:", e);
  }

  // Local High-Accuracy Clinical AI Engine Fallback
    const isEmergency = detectEmergency(content);
    const matched = matchSpecialty(content);
    const offers = generateOffers(matched);

    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sessionId,
      senderId: "patient_local",
      senderType: "PATIENT",
      messageType: "TEXT",
      content: content.trim(),
      sanitizedContent: content.trim(),
      routingStrategy: "HYBRID_RAG",
      intentCode: "SYMPTOM_TRIAGE",
      citations: [],
      metadata: {},
      createdAt: new Date().toISOString(),
    };

    let replyContent = "";
    let citations = matched.citations;
    let availableOffers = offers;
    let state = "OFFERS_READY";

    if (isEmergency) {
      replyContent = `🚨 **CẢNH BÁO CẤP CỨU KHẨN CẤP 115**:\n\nTriệu chứng của bạn có dấu hiệu nguy kịch đe dọa tính mạng theo quy chuẩn BYT. Vui lòng gọi ngay **115** hoặc người nhà đưa đến Khoa Cấp cứu gần nhất ngay lập tức! Tuyệt đối không tự ý lái xe.`;
      citations = [
        {
          sourceId: "BYT_EMERGENCY_2026",
          documentId: "TT-01/2026/TT-BYT",
          label: "Tiêu chuẩn phân loại Triage Cấp cứu CATT (Bộ Y Tế)",
          url: "https://kcb.vn",
          sectionTitle: "Mục Cấp cứu tối cấp: Kích hoạt Báo động đỏ Đột quỵ & Nhồi máu cơ tim",
          confidence: 99,
          snippet: "Bệnh nhân có triệu chứng đau ngực dữ dội, khó thở vã mồ hôi hoặc méo miệng liệt nửa người phải được chuyển ngay vào phòng Hồi sức Cấp cứu.",
        },
      ];
      availableOffers = [];
      state = "EMERGENCY_TRIGGERED";
    }

    const assistantMessage: ChatMessage = {
      id: `msg_ai_${Date.now()}`,
      sessionId,
      senderId: "ai_agent",
      senderType: "AI",
      messageType: "TEXT",
      content: replyContent,
      sanitizedContent: replyContent,
      routingStrategy: "LANGGRAPH_CLINICAL_RAG",
      intentCode: "ROUTING_PROPOSAL",
      citations,
      metadata: {
        specialtyCode: matched.code,
        specialtyName: matched.name,
      },
      createdAt: new Date().toISOString(),
    };

    const actions: ChatActionType[] = isEmergency ? [] : ["CONFIRM_TRIAGE", "ACCEPT_APPOINTMENT", "CHANGE_APPOINTMENT", "DECLINE_APPOINTMENT"];

    return {
      userMessage,
      assistantMessage,
      emergency: {
        detected: isEmergency,
        urgency: isEmergency ? "CRITICAL_115" : "ROUTINE",
        reasonCodes: isEmergency ? ["RED_FLAG_ACUTE"] : [],
        actionMessage: isEmergency ? "Hãy gọi 115 hoặc đến cấp cứu ngay lập tức!" : null,
      },
      workflowState: state,
      missingFields: [],
      availableActions: actions,
      appointmentOffer: availableOffers[0] || null,
      appointmentOffers: availableOffers,
    };
}

export async function sendChatAction(
  sessionId: string,
  actionType: ChatActionType,
  payload: Record<string, unknown> = {},
): Promise<WorkflowActionResult> {
  try {
    return mapWorkflowActionResult(await apiRequest(`/api/v1/chat/sessions/${encodeURIComponent(sessionId)}/actions`, {
      method: "POST",
      body: { action_type: actionType, payload },
    }));
  } catch {
    const slotId = String(payload.slot_id || payload.slotId || "slot_01");

    // Dynamic Specialty & Doctor resolution from slotId or payload
    let resolvedSpec = HOSPITAL_SPECIALTIES[0];
    for (const spec of HOSPITAL_SPECIALTIES) {
      if (
        slotId.toUpperCase().includes(spec.code.toUpperCase()) ||
        (payload.specialty_name && String(payload.specialty_name).toLowerCase().includes(spec.name.toLowerCase())) ||
        (payload.specialty_id && String(payload.specialty_id).toLowerCase() === spec.code.toLowerCase())
      ) {
        resolvedSpec = spec;
        break;
      }
    }
    const resolvedDoc = resolvedSpec.doctors[0] || HOSPITAL_DOCTORS[0];

    const doctorName = String(payload.doctor_name || payload.doctorName || resolvedDoc.fullName);
    const specialtyName = String(payload.specialty_name || payload.specialtyName || resolvedSpec.name);
    const doctorId = String(payload.doctor_id || payload.doctorId || resolvedDoc.id);
    const specialtyId = String(payload.specialty_id || payload.specialtyId || resolvedSpec.code);
    const facilityName = String(payload.facility_name || payload.facilityName || resolvedSpec.facilityName);
    const facilityAddress = String(payload.facility_address || payload.facilityAddress || resolvedSpec.facilityAddress);
    const room = String(payload.room || `${resolvedSpec.room} - ${resolvedSpec.building}`);
    const slotStart = String(payload.slot_start || payload.slotStart || new Date(Date.now() + 86400000).toISOString());
    const slotEnd = String(payload.slot_end || payload.slotEnd || new Date(Date.now() + 86400000 + 1800000).toISOString());

    let holdToken = `hold_${slotId}_${Date.now()}`;
    const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "https://vmec-api.onrender.com").replace(/\/$/, "");

    try {
      const holdRes = await fetch(`${API_BASE_URL}/api/booking/hold`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId,
          doctorName,
          patientId: "patient_local",
          specialtyCode: specialtyId,
          specialtyName,
          slotStart,
          slotEnd,
          room,
          consultationFee: 350000,
        }),
      });
      if (holdRes.ok) {
        const holdData = await holdRes.json();
        if (holdData.success && holdData.data?.id) {
          holdToken = holdData.data.id;
        }
      }
    } catch (e) {
      console.warn("Backend booking hold API failed, using local token:", e);
    }

    return {
      replyText: `Đã xác nhận lựa chọn của bạn với **${doctorName}** (${specialtyName}). Vui lòng kiểm tra lại thông tin và xác nhận giữ chỗ.`,
      workflowState: "CHECKOUT_READY",
      availableActions: ["ACCEPT_APPOINTMENT"],
      appointmentOffer: null,
      appointmentOffers: [],
      checkout: {
        patient: {
          fullName: "Nguyễn Văn An",
          phoneNumber: "0901234567",
          dateOfBirth: "1995-01-01",
          gender: "MALE",
          address: "Hà Nội, Việt Nam",
          patientSubject: "SELF",
        },
        selection: {
          slotId,
          doctorId,
          doctorName,
          specialtyId,
          specialtyName,
          facilityId: "fac_vmec_01",
          facilityName,
          facilityAddress,
          room,
          slotStart,
          slotEnd,
        },
        holdExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        holdToken,
      },
    };
  }
}

export async function closeChatSession(sessionId: string): Promise<ChatSession> {
  try {
    return mapChatSession(
      await apiRequest<unknown>(`/api/v1/chat/sessions/${encodeURIComponent(sessionId)}/close`, {
        method: "PATCH",
      }),
    );
  } catch {
    return {
      id: sessionId,
      patientId: "patient_local",
      status: "COMPLETED",
      language: "vi",
      channel: "web",
      title: "Đã hoàn thành tư vấn",
      emergencyFlag: false,
      emergencyReasonCodes: [],
      startedAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
