import type {
  Appointment,
  AppointmentOffer,
  CheckoutContext,
  AuthResult,
  ChatActionType,
  ChatMessage,
  ChatSession,
  EmergencyResult,
  Profile,
  RegistrationResult,
  ReceptionScheduleOverview,
  ReceptionScheduleSlot,
  ScheduleSlot,
  SendMessageResult,
  WorkflowActionResult,
  UserRole,
} from "@/lib/api/contracts";

type Raw = Record<string, unknown>;

function record(value: unknown, field = "data"): Raw {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError(`API field '${field}' phải là object.`);
  }
  return value as Raw;
}

function string(value: unknown, field: string): string {
  if (typeof value !== "string") throw new TypeError(`API field '${field}' phải là string.`);
  return value;
}

function nullableString(value: unknown, field: string): string | null {
  return value === null || value === undefined ? null : string(value, field);
}

function boolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") throw new TypeError(`API field '${field}' phải là boolean.`);
  return value;
}

function number(value: unknown, field: string): number {
  if (typeof value !== "number") throw new TypeError(`API field '${field}' phải là number.`);
  return value;
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function userRole(value: unknown, field: string): UserRole {
  const role = string(value, field);
  if (!["PATIENT", "RECEPTIONIST", "DOCTOR", "ADMIN"].includes(role)) {
    throw new TypeError(`API field '${field}' chứa role không hợp lệ.`);
  }
  return role as UserRole;
}

export function mapProfile(value: unknown): Profile {
  const raw = record(value, "profile");
  return {
    id: string(raw.id, "profile.id"),
    role: userRole(raw.role, "profile.role"),
    fullName: string(raw.full_name, "profile.full_name"),
    phoneNumber: nullableString(raw.phone_number, "profile.phone_number"),
    avatarUrl: nullableString(raw.avatar_url, "profile.avatar_url"),
    dateOfBirth: nullableString(raw.date_of_birth, "profile.date_of_birth"),
    gender: string(raw.gender, "profile.gender") as Profile["gender"],
    address: nullableString(raw.address, "profile.address"),
    status: string(raw.status, "profile.status"),
    isVerified: boolean(raw.is_verified, "profile.is_verified"),
    createdAt: string(raw.created_at, "profile.created_at"),
    updatedAt: string(raw.updated_at, "profile.updated_at"),
  };
}

export function mapAuthResult(value: unknown): AuthResult {
  const raw = record(value);
  const token = record(raw.token, "token");
  return {
    token: {
      accessToken: string(token.access_token, "token.access_token"),
      refreshToken: string(token.refresh_token, "token.refresh_token"),
      expiresIn: number(token.expires_in, "token.expires_in"),
      tokenType: string(token.token_type, "token.token_type"),
    },
    profile: mapProfile(raw.profile),
  };
}

export function mapRegistrationResult(value: unknown): RegistrationResult {
  const raw = record(value);
  const requiresEmailConfirmation = boolean(
    raw.requires_email_confirmation,
    "requires_email_confirmation",
  );

  if (requiresEmailConfirmation) {
    return { token: null, profile: null, requiresEmailConfirmation: true };
  }

  const auth = mapAuthResult(raw);
  return { ...auth, requiresEmailConfirmation: false };
}

export function mapChatSession(value: unknown): ChatSession {
  const raw = record(value, "chat_session");
  return {
    id: string(raw.id, "chat_session.id"),
    patientId: string(raw.patient_id, "chat_session.patient_id"),
    status: string(raw.status, "chat_session.status") as ChatSession["status"],
    language: string(raw.language, "chat_session.language"),
    channel: string(raw.channel, "chat_session.channel"),
    title: nullableString(raw.title, "chat_session.title"),
    emergencyFlag: boolean(raw.emergency_flag, "chat_session.emergency_flag"),
    emergencyReasonCodes: strings(raw.emergency_reason_codes),
    startedAt: string(raw.started_at, "chat_session.started_at"),
    lastMessageAt: nullableString(raw.last_message_at, "chat_session.last_message_at"),
    completedAt: nullableString(raw.completed_at, "chat_session.completed_at"),
    createdAt: string(raw.created_at, "chat_session.created_at"),
    updatedAt: string(raw.updated_at, "chat_session.updated_at"),
  };
}

export function mapChatMessage(value: unknown): ChatMessage {
  const raw = record(value, "chat_message");
  const citations = Array.isArray(raw.citations) ? raw.citations : [];
  return {
    id: string(raw.id, "chat_message.id"),
    sessionId: string(raw.session_id, "chat_message.session_id"),
    senderId: nullableString(raw.sender_id, "chat_message.sender_id"),
    senderType: string(raw.sender_type, "chat_message.sender_type") as ChatMessage["senderType"],
    messageType: typeof raw.message_type === "string" ? raw.message_type : "TEXT",
    content: string(raw.content, "chat_message.content"),
    sanitizedContent: string(raw.sanitized_content, "chat_message.sanitized_content"),
    routingStrategy: string(raw.routing_strategy, "chat_message.routing_strategy"),
    intentCode: nullableString(raw.intent_code, "chat_message.intent_code"),
    citations: citations.map((item) => {
      const citation = record(item, "citation");
      return {
        sourceId: nullableString(citation.source_id, "citation.source_id"),
        documentId: nullableString(citation.document_id, "citation.document_id"),
        label: string(citation.label, "citation.label"),
        url: nullableString(citation.url, "citation.url"),
        sectionTitle: nullableString(citation.section_title, "citation.section_title"),
      };
    }),
    metadata: typeof raw.metadata === "object" && raw.metadata !== null
      ? raw.metadata as Record<string, unknown>
      : {},
    createdAt: string(raw.created_at, "chat_message.created_at"),
  };
}

function mapEmergency(value: unknown): EmergencyResult {
  const raw = record(value, "emergency");
  return {
    detected: boolean(raw.detected, "emergency.detected"),
    urgency: string(raw.urgency, "emergency.urgency"),
    reasonCodes: strings(raw.reason_codes),
    actionMessage: nullableString(raw.action_message, "emergency.action_message"),
  };
}

export function mapAppointmentOffer(value: unknown): AppointmentOffer | null {
  if (value === null || value === undefined) return null;
  const raw = record(value, "appointment_offer");
  return {
    offerId: string(raw.offer_id, "appointment_offer.offer_id"),
    slotId: typeof raw.slot_id === "string"
      ? raw.slot_id
      : string(raw.offer_id, "appointment_offer.offer_id"),
    specialtyId: string(raw.specialty_id, "appointment_offer.specialty_id"),
    specialtyName: string(raw.specialty_name, "appointment_offer.specialty_name"),
    doctorId: string(raw.doctor_id, "appointment_offer.doctor_id"),
    doctorName: string(raw.doctor_name, "appointment_offer.doctor_name"),
    doctorAvatarUrl: nullableString(raw.doctor_avatar_url, "appointment_offer.doctor_avatar_url"),
    facilityId: nullableString(raw.facility_id, "appointment_offer.facility_id"),
    facilityName: string(raw.facility_name, "appointment_offer.facility_name"),
    facilityAddress: nullableString(raw.facility_address, "appointment_offer.facility_address"),
    room: string(raw.room, "appointment_offer.room"),
    slotStart: string(raw.slot_start, "appointment_offer.slot_start"),
    slotEnd: string(raw.slot_end, "appointment_offer.slot_end"),
    isMock: raw.is_mock === undefined ? false : boolean(raw.is_mock, "appointment_offer.is_mock"),
    expiresAt: string(raw.expires_at, "appointment_offer.expires_at"),
  };
}

export function mapSendMessageResult(value: unknown): SendMessageResult {
  const raw = record(value);
  return {
    userMessage: mapChatMessage(raw.user_message),
    assistantMessage: mapChatMessage(raw.assistant_message),
    emergency: mapEmergency(raw.emergency),
    workflowState: nullableString(raw.workflow_state, "workflow_state"),
    missingFields: strings(raw.missing_fields),
    availableActions: strings(raw.available_actions) as ChatActionType[],
    appointmentOffer: mapAppointmentOffer(raw.appointment_offer),
    appointmentOffers: Array.isArray(raw.appointment_offers)
      ? raw.appointment_offers.map(mapAppointmentOffer).filter((item): item is AppointmentOffer => item !== null)
      : [],
  };
}

export function mapCheckout(value: unknown): CheckoutContext | null {
  if (value === null || value === undefined) return null;
  const raw = record(value, "checkout");
  const selectionRaw = record(raw.selection, "checkout.selection");
  const patientRaw = raw.patient ? record(raw.patient, "checkout.patient") : {};
  return {
    patient: {
      fullName: typeof patientRaw.full_name === "string" ? patientRaw.full_name : "",
      phoneNumber: typeof patientRaw.phone_number === "string" ? patientRaw.phone_number : "",
      dateOfBirth: nullableString(patientRaw.date_of_birth, "checkout.patient.date_of_birth"),
      gender: (typeof patientRaw.gender === "string" ? patientRaw.gender : "UNKNOWN") as Profile["gender"],
      address: nullableString(patientRaw.address, "checkout.patient.address"),
      patientSubject: (typeof patientRaw.patient_subject === "string" ? patientRaw.patient_subject : "SELF") as "SELF" | "RELATIVE",
    },
    selection: {
      slotId: string(selectionRaw.slot_id, "checkout.selection.slot_id"),
      doctorId: string(selectionRaw.doctor_id, "checkout.selection.doctor_id"),
      doctorName: string(selectionRaw.doctor_name, "checkout.selection.doctor_name"),
      specialtyId: string(selectionRaw.specialty_id, "checkout.selection.specialty_id"),
      specialtyName: string(selectionRaw.specialty_name, "checkout.selection.specialty_name"),
      facilityId: nullableString(selectionRaw.facility_id, "checkout.selection.facility_id"),
      facilityName: string(selectionRaw.facility_name, "checkout.selection.facility_name"),
      facilityAddress: nullableString(selectionRaw.facility_address, "checkout.selection.facility_address"),
      room: string(selectionRaw.room, "checkout.selection.room"),
      slotStart: string(selectionRaw.slot_start, "checkout.selection.slot_start"),
      slotEnd: string(selectionRaw.slot_end, "checkout.selection.slot_end"),
    },
    holdExpiresAt: string(raw.hold_expires_at, "checkout.hold_expires_at"),
    holdToken: typeof raw.hold_token === "string" ? raw.hold_token : undefined,
  };
}

export function mapWorkflowActionResult(value: unknown): WorkflowActionResult {
  const raw = record(value, "workflow_action");
  return {
    replyText: string(raw.reply_text, "workflow_action.reply_text"),
    workflowState: nullableString(raw.workflow_state, "workflow_action.workflow_state"),
    availableActions: strings(raw.available_actions) as ChatActionType[],
    appointmentOffer: mapAppointmentOffer(raw.appointment_offer),
    appointmentOffers: Array.isArray(raw.appointment_offers)
      ? raw.appointment_offers.map(mapAppointmentOffer).filter((item): item is AppointmentOffer => item !== null)
      : [],
    checkout: mapCheckout(raw.checkout),
  };
}

export function mapAppointment(value: unknown): Appointment {
  const raw = record(value, "appointment");
  return {
    id: string(raw.id, "appointment.id"),
    appointmentCode: nullableString(raw.appointment_code, "appointment.appointment_code"),
    patientId: string(raw.patient_id, "appointment.patient_id"),
    doctorId: string(raw.doctor_id, "appointment.doctor_id"),
    facilityId: nullableString(raw.facility_id, "appointment.facility_id"),
    specialtyId: nullableString(raw.specialty_id, "appointment.specialty_id"),
    scheduleId: string(raw.schedule_id, "appointment.schedule_id"),
    status: string(raw.status, "appointment.status") as Appointment["status"],
    bookingReason: nullableString(raw.booking_reason, "appointment.booking_reason"),
    patientNotes: nullableString(raw.patient_notes, "appointment.patient_notes"),
    receptionistNotes: nullableString(raw.receptionist_notes, "appointment.receptionist_notes"),
    cancellationReason: nullableString(raw.cancellation_reason, "appointment.cancellation_reason"),
    patientSnapshot: typeof raw.patient_snapshot === "object" && raw.patient_snapshot !== null
      ? raw.patient_snapshot as Record<string, unknown>
      : {},
    expiresAt: nullableString(raw.expires_at, "appointment.expires_at"),
    confirmedAt: nullableString(raw.confirmed_at, "appointment.confirmed_at"),
    cancelledAt: nullableString(raw.cancelled_at, "appointment.cancelled_at"),
    completedAt: nullableString(raw.completed_at, "appointment.completed_at"),
    createdAt: string(raw.created_at, "appointment.created_at"),
    updatedAt: string(raw.updated_at, "appointment.updated_at"),
    doctorName: nullableString(raw.doctor_name, "appointment.doctor_name"),
    specialtyName: nullableString(raw.specialty_name, "appointment.specialty_name"),
    facilityName: nullableString(raw.facility_name, "appointment.facility_name"),
    facilityAddress: nullableString(raw.facility_address, "appointment.facility_address"),
    room: nullableString(raw.room, "appointment.room"),
    slotStart: nullableString(raw.slot_start, "appointment.slot_start"),
    slotEnd: nullableString(raw.slot_end, "appointment.slot_end"),
    qrAvailable: raw.qr_available === undefined ? false : boolean(raw.qr_available, "appointment.qr_available"),
  };
}

export function mapScheduleSlot(value: unknown): ScheduleSlot {
  const raw = record(value, "slot");
  return {
    id: string(raw.id, "slot.id"),
    doctorId: string(raw.doctor_id, "slot.doctor_id"),
    facilityId: nullableString(raw.facility_id, "slot.facility_id"),
    specialtyId: nullableString(raw.specialty_id, "slot.specialty_id"),
    startTime: string(raw.start_time, "slot.start_time"),
    endTime: string(raw.end_time, "slot.end_time"),
    status: string(raw.status, "slot.status"),
  };
}

export function mapReceptionScheduleSlot(value: unknown): ReceptionScheduleSlot {
  const raw = record(value, "receptionScheduleSlot");
  const status = string(raw.status, "receptionScheduleSlot.status");
  if (!["AVAILABLE", "HELD", "BOOKED", "BLOCKED", "CANCELLED"].includes(status)) {
    throw new TypeError("API field 'receptionScheduleSlot.status' không hợp lệ.");
  }
  return {
    id: string(raw.id, "receptionScheduleSlot.id"),
    doctorId: string(raw.doctor_id, "receptionScheduleSlot.doctor_id"),
    doctorName: string(raw.doctor_name, "receptionScheduleSlot.doctor_name"),
    doctorAvatarUrl: nullableString(raw.doctor_avatar_url, "receptionScheduleSlot.doctor_avatar_url"),
    facilityId: nullableString(raw.facility_id, "receptionScheduleSlot.facility_id"),
    facilityName: nullableString(raw.facility_name, "receptionScheduleSlot.facility_name"),
    specialtyId: nullableString(raw.specialty_id, "receptionScheduleSlot.specialty_id"),
    specialtyName: nullableString(raw.specialty_name, "receptionScheduleSlot.specialty_name"),
    room: nullableString(raw.room, "receptionScheduleSlot.room"),
    startTime: string(raw.start_time, "receptionScheduleSlot.start_time"),
    endTime: string(raw.end_time, "receptionScheduleSlot.end_time"),
    status: status as ReceptionScheduleSlot["status"],
    blockedReason: nullableString(raw.blocked_reason, "receptionScheduleSlot.blocked_reason"),
    canSelfUnblock: raw.can_self_unblock === undefined
      ? false
      : boolean(raw.can_self_unblock, "receptionScheduleSlot.can_self_unblock"),
  };
}

export function mapReceptionScheduleOverview(value: unknown): ReceptionScheduleOverview {
  const raw = record(value, "receptionScheduleOverview");
  const summary = record(raw.summary, "receptionScheduleOverview.summary");
  const specialties = Array.isArray(raw.specialties)
    ? raw.specialties.map((value) => {
        const specialty = record(value, "receptionScheduleOverview.specialty");
        return {
          id: string(specialty.id, "receptionScheduleOverview.specialty.id"),
          name: string(specialty.name, "receptionScheduleOverview.specialty.name"),
        };
      })
    : [];
  return {
    date: string(raw.date, "receptionScheduleOverview.date"),
    items: Array.isArray(raw.items) ? raw.items.map(mapReceptionScheduleSlot) : [],
    specialties,
    summary: {
      doctorCount: number(summary.doctor_count, "summary.doctor_count"),
      totalSlots: number(summary.total_slots, "summary.total_slots"),
      availableSlots: number(summary.available_slots, "summary.available_slots"),
      heldSlots: number(summary.held_slots, "summary.held_slots"),
      bookedSlots: number(summary.booked_slots, "summary.booked_slots"),
      blockedSlots: number(summary.blocked_slots, "summary.blocked_slots"),
      cancelledSlots: number(summary.cancelled_slots, "summary.cancelled_slots"),
      utilizationPercent: number(summary.utilization_percent, "summary.utilization_percent"),
    },
  };
}

export function list<T>(value: unknown, mapper: (item: unknown) => T): T[] {
  const raw = record(value, "list");
  return Array.isArray(raw.items) ? raw.items.map(mapper) : [];
}
