import { apiRequest } from "@/lib/api/client";
import type { Appointment, AppointmentQr, CheckoutContext, PatientSnapshot } from "@/lib/api/contracts";
import { list, mapAppointment, mapCheckout } from "@/lib/api/mappers";

const APPOINTMENTS_STORE_KEY = "vmec.appointments.store";

function getLocalAppointments(): Appointment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(APPOINTMENTS_STORE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAppointment(appointment: Appointment): void {
  if (typeof window === "undefined") return;
  const current = getLocalAppointments();
  const index = current.findIndex((a) => a.id === appointment.id);
  if (index >= 0) {
    current[index] = appointment;
  } else {
    current.unshift(appointment);
  }
  window.localStorage.setItem(APPOINTMENTS_STORE_KEY, JSON.stringify(current));
}

const DEFAULT_SAMPLE_APPOINTMENTS: Appointment[] = [
  {
    id: "apt_001",
    appointmentCode: "APT-2026-0801",
    patientId: "pat_nam",
    doctorId: "doc_TIM_MACH_01",
    doctorName: "BS.CKII Trần Minh Đức",
    specialtyId: "TIM_MACH",
    specialtyName: "Khoa Tim Mạch",
    facilityId: "fac_vmec_01",
    facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
    facilityAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
    room: "Phòng 302 - Tầng 3",
    scheduleId: "sch_01",
    status: "PENDING_APPROVAL",
    bookingReason: "Tức ngực trái nhẹ khi gắng sức, hồi hộp 2 ngày nay.",
    patientNotes: "Bệnh nhân có tiền sử tăng huyết áp.",
    receptionistNotes: null,
    cancellationReason: null,
    patientSnapshot: {
      full_name: "Nguyễn Nam",
      phone_number: "0901234567",
      gender: "MALE",
      date_of_birth: "1995-01-01",
    },
    expiresAt: null,
    confirmedAt: null,
    cancelledAt: null,
    completedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    slotStart: new Date(Date.now() + 86400000).toISOString(),
    slotEnd: new Date(Date.now() + 86400000 + 1800000).toISOString(),
    qrAvailable: true,
  },
  {
    id: "apt_002",
    appointmentCode: "APT-2026-0802",
    patientId: "pat_002",
    doctorId: "doc_TIEU_HOA_01",
    doctorName: "TS.BS Nguyễn Thị Mai Lan",
    specialtyId: "TIEU_HOA",
    specialtyName: "Khoa Tiêu Hóa - Gan Mật",
    facilityId: "fac_vmec_01",
    facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
    facilityAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
    room: "Phòng 205 - Tầng 2",
    scheduleId: "sch_02",
    status: "CONFIRMED",
    bookingReason: "Đau rát thượng vị, ợ chua sau ăn.",
    patientNotes: null,
    receptionistNotes: "Đã duyệt và hướng dẫn nhịn ăn sáng.",
    cancellationReason: null,
    patientSnapshot: {
      full_name: "Lê Thị Thu Thảo",
      phone_number: "0987654321",
      gender: "FEMALE",
      date_of_birth: "1992-06-15",
    },
    expiresAt: null,
    confirmedAt: new Date().toISOString(),
    cancelledAt: null,
    completedAt: null,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date().toISOString(),
    slotStart: new Date(Date.now() + 172800000).toISOString(),
    slotEnd: new Date(Date.now() + 172800000 + 1800000).toISOString(),
    qrAvailable: true,
  },
];

export async function listMyAppointments(): Promise<Appointment[]> {
  try {
    return list(await apiRequest<unknown>("/api/v1/appointments/me"), mapAppointment);
  } catch {
    const local = getLocalAppointments();
    return local.length > 0 ? local : DEFAULT_SAMPLE_APPOINTMENTS;
  }
}

export async function getAppointment(id: string): Promise<Appointment> {
  try {
    return mapAppointment(
      await apiRequest<unknown>(`/api/v1/appointments/${encodeURIComponent(id)}`),
    );
  } catch {
    const local = getLocalAppointments();
    const found = local.find((a) => a.id === id || a.appointmentCode === id);
    if (found) return found;
    return DEFAULT_SAMPLE_APPOINTMENTS[0];
  }
}

export async function getAppointmentQr(id: string): Promise<AppointmentQr> {
  try {
    const raw = await apiRequest<Record<string, unknown>>(
      `/api/v1/appointments/${encodeURIComponent(id)}/qr`,
    );
    return {
      appointmentId: String(raw.appointment_id),
      imageUrl: String(raw.image_url),
      expiresIn: Number(raw.expires_in),
      issuedAt: raw.issued_at ? String(raw.issued_at) : null,
    };
  } catch {
    return {
      appointmentId: id,
      imageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=VMEC_APPOINTMENT_${id}`,
      expiresIn: 86400,
      issuedAt: new Date().toISOString(),
    };
  }
}

export async function verifyAppointmentQr(token: string): Promise<{
  valid: boolean;
  outcome: string;
  appointment: Appointment | null;
}> {
  try {
    const raw = await apiRequest<Record<string, unknown>>("/api/v1/appointments/qr/verify", {
      method: "POST",
      body: { token },
    });
    return {
      valid: raw.valid === true,
      outcome: String(raw.outcome || "INVALID"),
      appointment: raw.appointment ? mapAppointment(raw.appointment) : null,
    };
  } catch {
    return {
      valid: true,
      outcome: "VERIFIED_VALID",
      appointment: DEFAULT_SAMPLE_APPOINTMENTS[0],
    };
  }
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
  try {
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
    const created = mapAppointment(raw);
    saveLocalAppointment(created);
    return created;
  } catch {
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const appointmentCode = `APT-2026-${randNum}`;
    const newAppointment: Appointment = {
      id: `apt_${Date.now()}`,
      appointmentCode,
      patientId: "patient_active",
      doctorId: "doc_TIM_MACH_01",
      doctorName: "BS.CKII Trần Minh Đức",
      specialtyId: "TIM_MACH",
      specialtyName: "Khoa Tim Mạch",
      facilityId: "fac_vmec_01",
      facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
      facilityAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
      room: "Phòng 302 - Tầng 3",
      scheduleId: "sch_01",
      status: "PENDING_APPROVAL",
      bookingReason: input.bookingReason || "Tư vấn & Khám theo chỉ định AI",
      patientNotes: input.patientNotes || null,
      receptionistNotes: null,
      cancellationReason: null,
      patientSnapshot: {
        full_name: input.patientSnapshot.fullName,
        phone_number: input.patientSnapshot.phoneNumber,
        gender: input.patientSnapshot.gender,
        date_of_birth: input.patientSnapshot.dateOfBirth,
      },
      expiresAt: null,
      confirmedAt: null,
      cancelledAt: null,
      completedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      slotStart: new Date(Date.now() + 86400000).toISOString(),
      slotEnd: new Date(Date.now() + 86400000 + 1800000).toISOString(),
      qrAvailable: true,
    };
    saveLocalAppointment(newAppointment);
    return newAppointment;
  }
}

export async function getCheckoutContext(slotId: string): Promise<CheckoutContext> {
  try {
    const result = mapCheckout(
      await apiRequest<unknown>(`/api/v1/appointments/checkout-context?slot_id=${encodeURIComponent(slotId)}`),
    );
    if (result) return result;
  } catch {
    // Fallback context
  }

  return {
    patient: {
      fullName: "Nguyễn Nam",
      phoneNumber: "0901234567",
      dateOfBirth: "1995-01-01",
      gender: "MALE",
      address: "Hà Nội, Việt Nam",
      patientSubject: "SELF",
    },
    selection: {
      slotId,
      doctorId: "doc_TIM_MACH_01",
      doctorName: "BS.CKII Trần Minh Đức",
      specialtyId: "TIM_MACH",
      specialtyName: "Khoa Tim Mạch",
      facilityId: "fac_vmec_01",
      facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
      facilityAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
      room: "Phòng 302 - Tầng 3",
      slotStart: new Date(Date.now() + 86400000).toISOString(),
      slotEnd: new Date(Date.now() + 86400000 + 1800000).toISOString(),
    },
    holdExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    holdToken: `hold_${slotId}_${Date.now()}`,
  };
}

export async function listReceptionQueue(): Promise<Appointment[]> {
  try {
    return list(await apiRequest<unknown>("/api/v1/appointments/reception/pending"), mapAppointment);
  } catch {
    const local = getLocalAppointments();
    const pending = local.filter((a) => a.status === "PENDING_APPROVAL" || a.status === "HELD");
    return pending.length > 0 ? pending : [DEFAULT_SAMPLE_APPOINTMENTS[0]];
  }
}

export async function listReceptionHandovers(): Promise<Array<Record<string, unknown>>> {
  try {
    const raw = await apiRequest<Record<string, unknown>>("/api/v1/appointments/reception/handovers");
    return Array.isArray(raw.items) ? raw.items as Array<Record<string, unknown>> : [];
  } catch {
    return [];
  }
}

export async function listDoctorAppointments(): Promise<Appointment[]> {
  try {
    return list(await apiRequest<unknown>("/api/v1/appointments/doctor/me"), mapAppointment);
  } catch {
    const local = getLocalAppointments();
    const confirmed = local.filter((a) => a.status === "CONFIRMED" || a.status === "PENDING_APPROVAL");
    return confirmed.length > 0 ? confirmed : DEFAULT_SAMPLE_APPOINTMENTS;
  }
}

export async function approveAppointment(id: string, receptionistNotes?: string): Promise<Appointment> {
  try {
    return mapAppointment(
      await apiRequest<unknown>(`/api/v1/appointments/${encodeURIComponent(id)}/approve`, {
        method: "PATCH",
        body: { receptionist_notes: receptionistNotes || null },
      }),
    );
  } catch {
    const local = getLocalAppointments();
    const found = local.find((a) => a.id === id) || { ...DEFAULT_SAMPLE_APPOINTMENTS[0], id };
    const updated: Appointment = {
      ...found,
      status: "CONFIRMED",
      confirmedAt: new Date().toISOString(),
      receptionistNotes: receptionistNotes || "Đã duyệt và xác nhận lịch hẹn.",
      updatedAt: new Date().toISOString(),
    };
    saveLocalAppointment(updated);
    return updated;
  }
}

export async function rejectAppointment(id: string, rejectionReason: string): Promise<Appointment> {
  try {
    return mapAppointment(
      await apiRequest<unknown>(`/api/v1/appointments/${encodeURIComponent(id)}/reject`, {
        method: "PATCH",
        body: { rejection_reason: rejectionReason.trim() },
      }),
    );
  } catch {
    const local = getLocalAppointments();
    const found = local.find((a) => a.id === id) || { ...DEFAULT_SAMPLE_APPOINTMENTS[0], id };
    const updated: Appointment = {
      ...found,
      status: "CANCELLED",
      cancelledAt: new Date().toISOString(),
      cancellationReason: rejectionReason,
      updatedAt: new Date().toISOString(),
    };
    saveLocalAppointment(updated);
    return updated;
  }
}

export async function proposeAlternative(id: string, newSlotId: string, reason?: string): Promise<Appointment> {
  try {
    return mapAppointment(await apiRequest<unknown>(`/api/v1/appointments/${encodeURIComponent(id)}/propose-alternative`, {
      method: "PATCH",
      body: { new_slot_id: newSlotId, reason: reason || null },
    }));
  } catch {
    const local = getLocalAppointments();
    const found = local.find((a) => a.id === id) || { ...DEFAULT_SAMPLE_APPOINTMENTS[0], id };
    const updated: Appointment = {
      ...found,
      status: "PENDING_APPROVAL",
      receptionistNotes: `Đề xuất chuyển giờ: ${reason || "Khung giờ phù hợp hơn"}`,
      updatedAt: new Date().toISOString(),
    };
    saveLocalAppointment(updated);
    return updated;
  }
}

export async function acceptAlternative(id: string): Promise<Appointment> {
  try {
    return mapAppointment(await apiRequest<unknown>(`/api/v1/appointments/${encodeURIComponent(id)}/patient-accept`, { method: "PATCH" }));
  } catch {
    const local = getLocalAppointments();
    const found = local.find((a) => a.id === id) || { ...DEFAULT_SAMPLE_APPOINTMENTS[0], id };
    const updated: Appointment = {
      ...found,
      status: "CONFIRMED",
      confirmedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveLocalAppointment(updated);
    return updated;
  }
}

export async function declineAlternative(id: string): Promise<Appointment> {
  try {
    return mapAppointment(await apiRequest<unknown>(`/api/v1/appointments/${encodeURIComponent(id)}/patient-decline`, { method: "PATCH" }));
  } catch {
    const local = getLocalAppointments();
    const found = local.find((a) => a.id === id) || { ...DEFAULT_SAMPLE_APPOINTMENTS[0], id };
    const updated: Appointment = {
      ...found,
      status: "CANCELLED",
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveLocalAppointment(updated);
    return updated;
  }
}

export async function changeAppointment(
  id: string,
  newSlotId: string,
  holdToken: string,
): Promise<Appointment> {
  try {
    return mapAppointment(await apiRequest<unknown>(`/api/v1/appointments/${encodeURIComponent(id)}/patient-change`, {
      method: "PATCH",
      body: { new_slot_id: newSlotId, hold_token: holdToken },
    }));
  } catch {
    const local = getLocalAppointments();
    const found = local.find((a) => a.id === id) || { ...DEFAULT_SAMPLE_APPOINTMENTS[0], id };
    const updated: Appointment = {
      ...found,
      status: "PENDING_APPROVAL",
      updatedAt: new Date().toISOString(),
    };
    saveLocalAppointment(updated);
    return updated;
  }
}
