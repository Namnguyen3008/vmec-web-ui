import { apiFetch } from "@/lib/api/client";

export type ChatSessionStatus = "ACTIVE" | "COMPLETED" | "HANDED_OVER" | string;

export interface ChatSession {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  status: ChatSessionStatus;
  language: string;
  channel: string;
  title: string | null;
  emergency_flag: boolean;
  started_at: string;
  last_message_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ChatSenderType = "PATIENT" | "AI" | "RECEPTIONIST";

export interface ChatMessageDoc {
  id: string;
  session_id: string;
  sender_id: string | null;
  sender_type: ChatSenderType;
  message_type: string;
  content: string;
  sanitized_content: string;
  intent_code: string | null;
  created_at: string;
}

export interface AppointmentOffer {
  offer_id: string;
  slot_id: string;
  specialty_id: string;
  specialty_name: string;
  doctor_id: string;
  doctor_name: string;
  doctor_avatar_url?: string | null;
  facility_id?: string | null;
  facility_name: string;
  facility_address?: string | null;
  room: string;
  slot_start: string;
  slot_end: string;
  is_mock: boolean;
  expires_at: string;
}

export type ChatActionType =
  | "CONFIRM_TRIAGE"
  | "ACCEPT_APPOINTMENT"
  | "CHANGE_APPOINTMENT"
  | "DECLINE_APPOINTMENT";

export interface CheckoutSelection {
  slot_id: string;
  doctor_id: string;
  doctor_name: string;
  specialty_id: string;
  specialty_name: string;
  facility_id?: string | null;
  facility_name: string;
  facility_address?: string | null;
  room: string;
  slot_start: string;
  slot_end: string;
}

export interface Checkout {
  slot_id: string;
  hold_token: string;
  hold_expires_at: string;
  selection: CheckoutSelection;
}

export interface SendMessageResult {
  user_message: ChatMessageDoc;
  assistant_message: ChatMessageDoc;
  emergency: { detected: boolean; reason_codes?: string[] };
  workflow_state?: string;
  missing_fields?: string[];
  available_actions?: ChatActionType[];
  appointment_offer?: AppointmentOffer | null;
}

export interface ChatActionResult {
  reply_text: string;
  workflow_state: string;
  triage_data?: Record<string, unknown>;
  missing_fields?: string[];
  available_actions?: ChatActionType[];
  appointment_offer?: AppointmentOffer | null;
  appointment_offers?: AppointmentOffer[];
  checkout?: Checkout;
}

function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

export function createSession(
  accessToken: string,
  payload: { language?: string; channel?: "web" | "mobile" | "other"; title?: string } = {},
) {
  return apiFetch<ChatSession>("/api/v1/chat/sessions", {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ channel: "mobile", ...payload }),
  });
}

export function listSessions(accessToken: string, limit = 20) {
  return apiFetch<{ items: ChatSession[]; next_before_id: string | null }>(
    `/api/v1/chat/sessions?limit=${limit}`,
    { headers: authHeaders(accessToken) },
  );
}

export function getSession(accessToken: string, sessionId: string) {
  return apiFetch<ChatSession>(`/api/v1/chat/sessions/${sessionId}`, {
    headers: authHeaders(accessToken),
  });
}

export function listMessages(accessToken: string, sessionId: string, limit = 50) {
  return apiFetch<{ items: ChatMessageDoc[]; next_before_id: string | null }>(
    `/api/v1/chat/sessions/${sessionId}/messages?limit=${limit}`,
    { headers: authHeaders(accessToken) },
  );
}

export function sendMessage(accessToken: string, sessionId: string, content: string) {
  return apiFetch<SendMessageResult>(`/api/v1/chat/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ content }),
  });
}

export function closeSession(accessToken: string, sessionId: string) {
  return apiFetch<ChatSession>(`/api/v1/chat/sessions/${sessionId}/close`, {
    method: "PATCH",
    headers: authHeaders(accessToken),
  });
}

export function chatAction(
  accessToken: string,
  sessionId: string,
  actionType: ChatActionType,
  payload: Record<string, unknown> = {},
) {
  return apiFetch<ChatActionResult>(`/api/v1/chat/sessions/${sessionId}/actions`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ action_type: actionType, payload }),
  });
}
