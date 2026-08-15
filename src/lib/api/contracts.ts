export type UserRole = "PATIENT" | "RECEPTIONIST" | "DOCTOR" | "ADMIN";

export type Gender = "MALE" | "FEMALE" | "OTHER" | "UNKNOWN";

export interface Profile {
  id: string;
  role: UserRole;
  fullName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  gender: Gender;
  address: string | null;
  status: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface AuthResult {
  token: AuthToken;
  profile: Profile;
}

export interface RegistrationResult {
  token: AuthToken | null;
  profile: Profile | null;
  requiresEmailConfirmation: boolean;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  fullName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: Gender;
}

export interface ChatSession {
  id: string;
  patientId: string;
  status: "ACTIVE" | "COMPLETED";
  language: string;
  channel: string;
  title: string | null;
  emergencyFlag: boolean;
  emergencyReasonCodes: string[];
  startedAt: string;
  lastMessageAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string | null;
  senderType: "PATIENT" | "AI";
  messageType: string;
  content: string;
  sanitizedContent: string;
  routingStrategy: string;
  intentCode: string | null;
  citations: Array<{
    sourceId: string | null;
    documentId: string | null;
    label: string;
    url: string | null;
    sectionTitle: string | null;
  }>;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface EmergencyResult {
  detected: boolean;
  urgency: "ROUTINE" | "EMERGENCY" | string;
  reasonCodes: string[];
  actionMessage: string | null;
}

export type ChatActionType =
  | "CONFIRM_TRIAGE"
  | "ACCEPT_APPOINTMENT"
  | "CHANGE_APPOINTMENT"
  | "DECLINE_APPOINTMENT";

export interface AppointmentOffer {
  offerId: string;
  slotId: string;
  specialtyId: string;
  specialtyName: string;
  doctorId: string;
  doctorName: string;
  doctorAvatarUrl: string | null;
  facilityId: string | null;
  facilityName: string;
  facilityAddress: string | null;
  room: string;
  slotStart: string;
  slotEnd: string;
  isMock: boolean;
  expiresAt: string;
}

export interface CheckoutSelection {
  slotId: string;
  doctorId: string;
  doctorName: string;
  specialtyId: string;
  specialtyName: string;
  facilityId: string | null;
  facilityName: string;
  facilityAddress: string | null;
  room: string;
  slotStart: string;
  slotEnd: string;
}

export interface PatientSnapshot {
  fullName: string;
  phoneNumber: string;
  dateOfBirth: string | null;
  gender: Gender;
  address: string | null;
  patientSubject: "SELF" | "RELATIVE";
  relationship?: string | null;
  age?: string | null;
}

export interface CheckoutContext {
  patient: PatientSnapshot;
  selection: CheckoutSelection;
  holdExpiresAt: string;
  holdToken?: string;
}

export interface WorkflowActionResult {
  replyText: string;
  workflowState: string | null;
  availableActions: ChatActionType[];
  appointmentOffer: AppointmentOffer | null;
  appointmentOffers: AppointmentOffer[];
  checkout: CheckoutContext | null;
}

export interface SendMessageResult {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  emergency: EmergencyResult;
  workflowState: string | null;
  missingFields: string[];
  availableActions: ChatActionType[];
  appointmentOffer: AppointmentOffer | null;
  appointmentOffers: AppointmentOffer[];
}

export type AppointmentStatus =
  | "DRAFT"
  | "PENDING_RECEPTIONIST_APPROVAL"
  | "PENDING_PATIENT_CONFIRMATION"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW"
  | "EXPIRED";

export interface Appointment {
  id: string;
  appointmentCode: string | null;
  patientId: string;
  doctorId: string;
  facilityId: string | null;
  specialtyId: string | null;
  scheduleId: string;
  status: AppointmentStatus;
  bookingReason: string | null;
  patientNotes: string | null;
  receptionistNotes: string | null;
  cancellationReason: string | null;
  patientSnapshot: Record<string, unknown>;
  expiresAt: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  doctorName: string | null;
  specialtyName: string | null;
  facilityName: string | null;
  facilityAddress: string | null;
  room: string | null;
  slotStart: string | null;
  slotEnd: string | null;
  qrAvailable?: boolean;
}

export interface ProfileUpdateInput {
  fullName: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: Gender;
  address: string;
}

export interface AppointmentQr {
  appointmentId: string;
  imageUrl: string;
  expiresIn: number;
  issuedAt: string | null;
}

export interface ScheduleSlot {
  id: string;
  doctorId: string;
  facilityId: string | null;
  specialtyId: string | null;
  startTime: string;
  endTime: string;
  status: string;
}

export type ScheduleStatus = "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED" | "CANCELLED";

export interface ReceptionScheduleSlot {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorAvatarUrl: string | null;
  facilityId: string | null;
  facilityName: string | null;
  specialtyId: string | null;
  specialtyName: string | null;
  room: string | null;
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
  blockedReason: string | null;
  canSelfUnblock: boolean;
}

export interface ReceptionScheduleOverview {
  date: string;
  items: ReceptionScheduleSlot[];
  specialties: Array<{ id: string; name: string }>;
  summary: {
    doctorCount: number;
    totalSlots: number;
    availableSlots: number;
    heldSlots: number;
    bookedSlots: number;
    blockedSlots: number;
    cancelledSlots: number;
    utilizationPercent: number;
  };
}

export interface DoctorOption {
  id: string;
  fullName: string;
  room: string | null;
  facilityName: string | null;
  specialtyName: string;
  isPrimarySpecialty: boolean;
}

export interface NotificationItem {
  id: string;
  appointmentId: string | null;
  type: string;
  title: string;
  content: string;
  readAt: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
}
