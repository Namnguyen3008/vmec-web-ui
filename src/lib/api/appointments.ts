import { apiRequest } from "@/lib/api/client";
import type { Appointment, AppointmentQr, CheckoutContext, PatientSnapshot } from "@/lib/api/contracts";
import { list, mapAppointment, mapCheckout } from "@/lib/api/mappers";
import { MOCK_DOCTOR_APPOINTMENTS, type DetailedAppointment, type DetailedPatientSnapshot } from "@/lib/mockData";
import { MASTER_SPECIALTIES, getDoctorById, getSpecialtyByCode } from "@/lib/clinicalMasterCatalog";

const APPOINTMENTS_STORE_KEY = "vmec.appointments.store";

export function getLocalAppointments(): DetailedAppointment[] {
  if (typeof window === "undefined") return MOCK_DOCTOR_APPOINTMENTS;
  try {
    const raw = window.localStorage.getItem(APPOINTMENTS_STORE_KEY);
    if (!raw) {
      window.localStorage.setItem(APPOINTMENTS_STORE_KEY, JSON.stringify(MOCK_DOCTOR_APPOINTMENTS));
      return MOCK_DOCTOR_APPOINTMENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : MOCK_DOCTOR_APPOINTMENTS;
  } catch {
    return MOCK_DOCTOR_APPOINTMENTS;
  }
}

export function saveLocalAppointment(appointment: Appointment | DetailedAppointment): void {
  if (typeof window === "undefined") return;
  const current = getLocalAppointments();
  const index = current.findIndex((a) => a.id === appointment.id);

  let detailedToSave: DetailedAppointment;
  if ("patientDetail" in appointment && appointment.patientDetail) {
    detailedToSave = appointment as DetailedAppointment;
  } else {
    // Enhance standard appointment with detail snapshot
    const existing = index >= 0 ? current[index] : undefined;
    const snap = (appointment.patientSnapshot || {}) as Record<string, unknown>;
    const fullName = String(snap.fullName || snap.full_name || "Bệnh nhân");
    const phoneNumber = String(snap.phoneNumber || snap.phone_number || "0900000000");
    const dob = (snap.dateOfBirth || snap.date_of_birth || null) as string | null;
    const gender = (snap.gender || "UNKNOWN") as "MALE" | "FEMALE" | "OTHER" | "UNKNOWN";
    const address = (snap.address || "Hà Nội") as string | null;
    const subj = (snap.patientSubject || snap.patient_subject || "SELF") as "SELF" | "RELATIVE";

    detailedToSave = {
      ...appointment,
      patientDetail: existing?.patientDetail || {
        fullName,
        phoneNumber,
        dateOfBirth: dob,
        gender,
        address,
        patientSubject: subj,
        medicalCode: `BN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        bloodType: "O+",
        allergies: [],
        medicalHistory: [],
        vitalSigns: {
          bloodPressure: "120/80",
          heartRate: 75,
          temperature: 36.6,
          spO2: 99,
          weight: 60,
        },
        aiAssessment: {
          preliminaryDiagnosis: appointment.specialtyName || "Khám chuyên khoa",
          urgencyLevel: "ROUTINE",
          confidenceScore: 90,
          reasoning: appointment.bookingReason || "Bệnh nhân đặt khám qua trợ lý AI.",
        },
      },
    };
  }

  if (index >= 0) {
    current[index] = detailedToSave;
  } else {
    current.unshift(detailedToSave);
  }

  window.localStorage.setItem(APPOINTMENTS_STORE_KEY, JSON.stringify(current));
  window.dispatchEvent(new CustomEvent("p208:schedule-change"));
  window.dispatchEvent(new CustomEvent("vmec:appointments-change"));
}

export async function listMyAppointments(): Promise<Appointment[]> {
  try {
    return list(await apiRequest<unknown>("/api/v1/appointments/me"), mapAppointment);
  } catch {
    return getLocalAppointments();
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
    return local[0];
  }
}

export async function getDetailedAppointmentById(id: string): Promise<DetailedAppointment | undefined> {
  const local = getLocalAppointments();
  return local.find((a) => a.id === id || a.appointmentCode === id);
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
    const local = getLocalAppointments();
    return {
      valid: true,
      outcome: "VERIFIED_VALID",
      appointment: local[0] || null,
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
        booking_reason: input.bookingReason || null,
        patient_notes: input.patientNotes || null,
        patient_snapshot: {
          full_name: input.patientSnapshot.fullName,
          phone_number: input.patientSnapshot.phoneNumber,
          date_of_birth: input.patientSnapshot.dateOfBirth || null,
          gender: input.patientSnapshot.gender || "UNKNOWN",
          address: input.patientSnapshot.address || null,
          patient_subject: input.patientSnapshot.patientSubject || "SELF",
          relationship: input.patientSnapshot.relationship || null,
        },
        update_profile: Boolean(input.updateProfile),
        chat_session_id: input.chatSessionId || null,
      },
    });
    const mapped = mapAppointment(raw);
    saveLocalAppointment(mapped);
    return mapped;
  } catch {
    // Determine doctor and specialty from slotId
    let specialtyCode = "NOI_TONG_QUAT";
    for (const spec of MASTER_SPECIALTIES) {
      if (input.slotId.toUpperCase().includes(spec.code.toUpperCase())) {
        specialtyCode = spec.code;
        break;
      }
    }
    const spec = getSpecialtyByCode(specialtyCode) || MASTER_SPECIALTIES[0];
    const doc = spec.doctors[0];

    const newApt: DetailedAppointment = {
      id: `apt_${Date.now()}`,
      appointmentCode: `APT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: "pat_me",
      doctorId: doc.id,
      doctorName: doc.fullName,
      specialtyId: spec.code,
      specialtyName: spec.name,
      facilityId: "fac_vmec_01",
      facilityName: spec.facilityName,
      facilityAddress: spec.facilityAddress,
      room: `${spec.room} - ${spec.building}`,
      scheduleId: input.slotId,
      status: "PENDING_RECEPTIONIST_APPROVAL",
      bookingReason: input.bookingReason || "Tư vấn và khám triệu chứng lâm sàng qua MedAgent AI.",
      patientNotes: input.patientNotes || null,
      receptionistNotes: null,
      cancellationReason: null,
      patientSnapshot: input.patientSnapshot as unknown as Record<string, unknown>,
      expiresAt: null,
      confirmedAt: null,
      cancelledAt: null,
      completedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      slotStart: new Date(Date.now() + 86400000).toISOString(),
      slotEnd: new Date(Date.now() + 86400000 + 1800000).toISOString(),
      qrAvailable: true,
      patientDetail: {
        fullName: input.patientSnapshot.fullName,
        phoneNumber: input.patientSnapshot.phoneNumber,
        dateOfBirth: input.patientSnapshot.dateOfBirth || "1995-01-01",
        gender: input.patientSnapshot.gender || "MALE",
        address: input.patientSnapshot.address || "Hà Nội",
        patientSubject: input.patientSnapshot.patientSubject || "SELF",
        medicalCode: `BN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        bloodType: "O+",
        allergies: [],
        medicalHistory: [],
        vitalSigns: {
          bloodPressure: "120/80",
          heartRate: 76,
          temperature: 36.6,
          spO2: 99,
          weight: 62,
        },
        aiAssessment: {
          preliminaryDiagnosis: `${spec.name} - Phân tích AI Triage`,
          urgencyLevel: "ROUTINE",
          confidenceScore: 92,
          reasoning: input.bookingReason || "Đã thu thập đủ triệu chứng qua MedAgent AI.",
        },
      },
    };
    saveLocalAppointment(newApt);
    return newApt;
  }
}

export async function getCheckoutContext(slotId: string): Promise<CheckoutContext> {
  let specialtyCode = "TIM_MACH";
  for (const spec of MASTER_SPECIALTIES) {
    if (slotId.toUpperCase().includes(spec.code.toUpperCase())) {
      specialtyCode = spec.code;
      break;
    }
  }
  const spec = getSpecialtyByCode(specialtyCode) || MASTER_SPECIALTIES[0];
  const doc = spec.doctors[0];

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
      doctorId: doc.id,
      doctorName: doc.fullName,
      specialtyId: spec.code,
      specialtyName: spec.name,
      facilityId: "fac_vmec_01",
      facilityName: spec.facilityName,
      facilityAddress: spec.facilityAddress,
      room: `${spec.room} - ${spec.building}`,
      slotStart: new Date(Date.now() + 86400000).toISOString(),
      slotEnd: new Date(Date.now() + 86400000 + 1800000).toISOString(),
    },
    holdExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    holdToken: `hold_${slotId}_${Date.now()}`,
  };
}

export async function listReceptionQueue(): Promise<DetailedAppointment[]> {
  try {
    const raw = await apiRequest<unknown>("/api/v1/appointments/reception/pending");
    return list(raw, mapAppointment) as DetailedAppointment[];
  } catch {
    const local = getLocalAppointments();
    return local.filter(
      (a) => a.status === "PENDING_RECEPTIONIST_APPROVAL" || a.status === "PENDING_PATIENT_CONFIRMATION"
    );
  }
}

export async function listReceptionHandovers(): Promise<Array<Record<string, unknown>>> {
  try {
    const raw = await apiRequest<Record<string, unknown>>("/api/v1/appointments/reception/handovers");
    return Array.isArray(raw.items) ? (raw.items as Array<Record<string, unknown>>) : [];
  } catch {
    return [];
  }
}

export async function listDoctorAppointments(doctorId?: string): Promise<DetailedAppointment[]> {
  try {
    const raw = await apiRequest<unknown>("/api/v1/appointments/doctor/me");
    return list(raw, mapAppointment) as DetailedAppointment[];
  } catch {
    const local = getLocalAppointments();
    if (doctorId && doctorId !== "all") {
      return local.filter(
        (a) => (a.doctorId === doctorId || (a.specialtyId || "").toLowerCase() === doctorId.toLowerCase()) && a.status !== "CANCELLED"
      );
    }
    return local.filter((a) => a.status !== "CANCELLED");
  }
}

export async function approveAppointment(id: string, receptionistNotes?: string): Promise<DetailedAppointment> {
  try {
    const mapped = mapAppointment(
      await apiRequest<unknown>(`/api/v1/appointments/${encodeURIComponent(id)}/approve`, {
        method: "PATCH",
        body: { receptionist_notes: receptionistNotes || null },
      }),
    ) as DetailedAppointment;
    saveLocalAppointment(mapped);
    return mapped;
  } catch {
    const local = getLocalAppointments();
    const found = local.find((a) => a.id === id) || local[0];
    const updated: DetailedAppointment = {
      ...found,
      status: "CONFIRMED",
      confirmedAt: new Date().toISOString(),
      receptionistNotes: receptionistNotes || "Đã duyệt và xác nhận lịch hẹn.",
      updatedAt: new Date().toISOString(),
      qrAvailable: true,
    };
    saveLocalAppointment(updated);
    return updated;
  }
}

export async function rejectAppointment(id: string, rejectionReason: string): Promise<DetailedAppointment> {
  try {
    const mapped = mapAppointment(
      await apiRequest<unknown>(`/api/v1/appointments/${encodeURIComponent(id)}/reject`, {
        method: "PATCH",
        body: { rejection_reason: rejectionReason.trim() },
      }),
    ) as DetailedAppointment;
    saveLocalAppointment(mapped);
    return mapped;
  } catch {
    const local = getLocalAppointments();
    const found = local.find((a) => a.id === id) || local[0];
    const updated: DetailedAppointment = {
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

export async function proposeAlternative(id: string, newSlotId: string, reason?: string): Promise<DetailedAppointment> {
  try {
    const mapped = mapAppointment(
      await apiRequest<unknown>(`/api/v1/appointments/${encodeURIComponent(id)}/propose-alternative`, {
        method: "PATCH",
        body: { new_slot_id: newSlotId, reason: reason || null },
      }),
    ) as DetailedAppointment;
    saveLocalAppointment(mapped);
    return mapped;
  } catch {
    const local = getLocalAppointments();
    const found = local.find((a) => a.id === id) || local[0];
    const updated: DetailedAppointment = {
      ...found,
      status: "PENDING_PATIENT_CONFIRMATION",
      receptionistNotes: `Đề xuất chuyển giờ: ${reason || "Khung giờ phù hợp hơn"}`,
      updatedAt: new Date().toISOString(),
    };
    saveLocalAppointment(updated);
    return updated;
  }
}

export async function startConsultation(id: string): Promise<DetailedAppointment> {
  const local = getLocalAppointments();
  const found = local.find((a) => a.id === id) || local[0];
  const updated: DetailedAppointment = {
    ...found,
    status: "CONFIRMED",
    updatedAt: new Date().toISOString(),
  };
  saveLocalAppointment(updated);
  return updated;
}

export async function completeConsultation(
  id: string,
  clinicalNote: string,
  prescriptions?: DetailedPatientSnapshot["prescriptions"],
  diagnosticOrders?: DetailedPatientSnapshot["diagnosticOrders"]
): Promise<DetailedAppointment> {
  const local = getLocalAppointments();
  const found = local.find((a) => a.id === id) || local[0];
  const updated: DetailedAppointment = {
    ...found,
    status: "COMPLETED",
    completedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    patientDetail: {
      ...found.patientDetail,
      clinicalNote,
      prescriptions: prescriptions || found.patientDetail.prescriptions,
      diagnosticOrders: diagnosticOrders || found.patientDetail.diagnosticOrders,
    },
  };
  saveLocalAppointment(updated);
  return updated;
}

export async function acceptAlternative(id: string): Promise<DetailedAppointment> {
  const local = getLocalAppointments();
  const found = local.find((a) => a.id === id) || local[0];
  const updated: DetailedAppointment = {
    ...found,
    status: "CONFIRMED",
    confirmedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    qrAvailable: true,
  };
  saveLocalAppointment(updated);
  return updated;
}

export async function declineAlternative(id: string): Promise<DetailedAppointment> {
  const local = getLocalAppointments();
  const found = local.find((a) => a.id === id) || local[0];
  const updated: DetailedAppointment = {
    ...found,
    status: "CANCELLED",
    cancelledAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveLocalAppointment(updated);
  return updated;
}

export async function changeAppointment(
  id: string,
  newSlotId: string,
  holdToken: string,
): Promise<DetailedAppointment> {
  const local = getLocalAppointments();
  const found = local.find((a) => a.id === id) || local[0];
  const updated: DetailedAppointment = {
    ...found,
    status: "PENDING_RECEPTIONIST_APPROVAL",
    updatedAt: new Date().toISOString(),
  };
  saveLocalAppointment(updated);
  return updated;
}
