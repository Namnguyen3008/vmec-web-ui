import { apiFetch } from "@/lib/api/client";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED"
  | "PATIENT_DECLINED"
  | string;

export interface Appointment {
  id: string;
  appointment_code: string | null;
  patient_id: string;
  doctor_id: string;
  facility_id: string | null;
  specialty_id: string | null;
  schedule_id: string;
  status: AppointmentStatus;
  booking_reason: string | null;
  patient_notes: string | null;
  receptionist_notes: string | null;
  cancellation_reason: string | null;
  patient_snapshot: Record<string, unknown> | null;
  expires_at: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  doctor_name: string | null;
  specialty_name: string | null;
  facility_name: string | null;
  facility_address: string | null;
  room: string | null;
  slot_start: string | null;
  slot_end: string | null;
  qr_available: boolean;
}

export interface PatientSnapshot {
  full_name: string;
  phone_number: string;
  date_of_birth?: string | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | "UNKNOWN";
  address?: string | null;
  patient_subject?: "SELF" | "RELATIVE";
  relationship?: string | null;
  age?: string | null;
}

export interface CreateAppointmentPayload {
  slot_id: string;
  hold_token: string;
  patient_snapshot: PatientSnapshot;
  update_profile?: boolean;
  booking_reason?: string | null;
  patient_notes?: string | null;
  chat_session_id?: string | null;
}

export interface AppointmentQr {
  appointment_id: string;
  image_url: string;
  expires_in: number;
  issued_at: string | null;
}

function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

export function listMyAppointments(accessToken: string) {
  return apiFetch<{ items: Appointment[]; total: number }>("/api/v1/appointments/me", {
    headers: authHeaders(accessToken),
  });
}

export function getAppointment(accessToken: string, appointmentId: string) {
  return apiFetch<Appointment>(`/api/v1/appointments/${appointmentId}`, {
    headers: authHeaders(accessToken),
  });
}

export function getAppointmentQr(accessToken: string, appointmentId: string) {
  return apiFetch<AppointmentQr>(`/api/v1/appointments/${appointmentId}/qr`, {
    headers: authHeaders(accessToken),
  });
}

export function createAppointment(accessToken: string, payload: CreateAppointmentPayload) {
  return apiFetch<Appointment>("/api/v1/appointments", {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(payload),
  });
}
