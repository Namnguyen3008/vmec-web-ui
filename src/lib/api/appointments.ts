import { apiRequest } from "@/lib/api/client";
import type { Appointment, AppointmentQr, CheckoutContext, PatientSnapshot } from "@/lib/api/contracts";
import { list, mapAppointment, mapCheckout } from "@/lib/api/mappers";

export async function listMyAppointments(): Promise<Appointment[]> {
  return list(await apiRequest<unknown>("/api/v1/appointments/me"), mapAppointment);
}

export async function getAppointment(id: string): Promise<Appointment> {
  return mapAppointment(
    await apiRequest<unknown>(`/api/v1/appointments/${encodeURIComponent(id)}`),
  );
}

export async function getAppointmentQr(id: string): Promise<AppointmentQr> {
  const raw = await apiRequest<Record<string, unknown>>(
    `/api/v1/appointments/${encodeURIComponent(id)}/qr`,
  );
  return {
    appointmentId: String(raw.appointment_id),
    imageUrl: String(raw.image_url),
    expiresIn: Number(raw.expires_in),
    issuedAt: raw.issued_at ? String(raw.issued_at) : null,
  };
}

export async function verifyAppointmentQr(token: string): Promise<{
  valid: boolean;
  outcome: string;
  appointment: Appointment | null;
}> {
  const raw = await apiRequest<Record<string, unknown>>("/api/v1/appointments/qr/verify", {
    method: "POST",
    body: { token },
  });
  return {
    valid: raw.valid === true,
    outcome: String(raw.outcome || "INVALID"),
    appointment: raw.appointment ? mapAppointment(raw.appointment) : null,
  };
}

export async function createAppointment(input: {
  slotId: string;
  holdToken: string;
  bookingReason?: string;
  patientNotes?: string;
  patientSnapshot: PatientSnapshot;
  updateProfile?: boolean;
  chatSessionId?: string;
}): Promise<Appointment> {
  const raw = await apiRequest<unknown>("/api/v1/appointments", {
    method: "POST",
    body: {
      slot_id: input.slotId,
      hold_token: input.holdToken,
      patient_snapshot: {
        full_name: input.patientSnapshot.fullName,
        phone_number: input.patientSnapshot.phoneNumber,
        date_of_birth: input.patientSnapshot.dateOfBirth,
        gender: input.patientSnapshot.gender,
        address: input.patientSnapshot.address,
        patient_subject: input.patientSnapshot.patientSubject,
        relationship: input.patientSnapshot.relationship || null,
        age: input.patientSnapshot.age || null,
      },
      update_profile: input.updateProfile || false,
      chat_session_id: input.chatSessionId || null,
      booking_reason: input.bookingReason || null,
      patient_notes: input.patientNotes || null,
    },
  });
  return mapAppointment(raw);
}

export async function getCheckoutContext(slotId: string): Promise<CheckoutContext> {
  const result = mapCheckout(
    await apiRequest<unknown>(`/api/v1/appointments/checkout-context?slot_id=${encodeURIComponent(slotId)}`),
  );
  if (!result) throw new TypeError("Checkout context không hợp lệ.");
  return result;
}

export async function listReceptionQueue(): Promise<Appointment[]> {
  return list(await apiRequest<unknown>("/api/v1/appointments/reception/pending"), mapAppointment);
}

export async function listReceptionHandovers(): Promise<Array<Record<string, unknown>>> {
  const raw = await apiRequest<Record<string, unknown>>("/api/v1/appointments/reception/handovers");
  return Array.isArray(raw.items) ? raw.items as Array<Record<string, unknown>> : [];
}

export async function listDoctorAppointments(): Promise<Appointment[]> {
  return list(await apiRequest<unknown>("/api/v1/appointments/doctor/me"), mapAppointment);
}

export async function approveAppointment(id: string, receptionistNotes?: string): Promise<Appointment> {
  return mapAppointment(
    await apiRequest<unknown>(`/api/v1/appointments/${encodeURIComponent(id)}/approve`, {
      method: "PATCH",
      body: { receptionist_notes: receptionistNotes || null },
    }),
  );
}

export async function rejectAppointment(id: string, rejectionReason: string): Promise<Appointment> {
  return mapAppointment(
    await apiRequest<unknown>(`/api/v1/appointments/${encodeURIComponent(id)}/reject`, {
      method: "PATCH",
      body: { rejection_reason: rejectionReason.trim() },
    }),
  );
}

export async function proposeAlternative(id: string, newSlotId: string, reason?: string): Promise<Appointment> {
  return mapAppointment(await apiRequest<unknown>(`/api/v1/appointments/${encodeURIComponent(id)}/propose-alternative`, {
    method: "PATCH",
    body: { new_slot_id: newSlotId, reason: reason || null },
  }));
}

export async function acceptAlternative(id: string): Promise<Appointment> {
  return mapAppointment(await apiRequest<unknown>(`/api/v1/appointments/${encodeURIComponent(id)}/patient-accept`, { method: "PATCH" }));
}

export async function declineAlternative(id: string): Promise<Appointment> {
  return mapAppointment(await apiRequest<unknown>(`/api/v1/appointments/${encodeURIComponent(id)}/patient-decline`, { method: "PATCH" }));
}

export async function changeAppointment(
  id: string,
  newSlotId: string,
  holdToken: string,
): Promise<Appointment> {
  return mapAppointment(await apiRequest<unknown>(`/api/v1/appointments/${encodeURIComponent(id)}/patient-change`, {
    method: "PATCH",
    body: { new_slot_id: newSlotId, hold_token: holdToken },
  }));
}
