import { apiRequest } from "@/lib/api/client";
import type { CheckoutSelection, DoctorOption } from "@/lib/api/contracts";
import {
  HOSPITAL_DOCTORS,
  HOSPITAL_SPECIALTIES,
  getHospitalSpecialtyByCode,
} from "@/lib/api/hospitalDirectory";

function mapSelection(value: unknown): CheckoutSelection {
  const raw = value as Record<string, unknown>;
  return {
    slotId: String(raw.slot_id),
    doctorId: String(raw.doctor_id),
    doctorName: String(raw.doctor_name),
    specialtyId: String(raw.specialty_id),
    specialtyName: String(raw.specialty_name),
    facilityId: raw.facility_id ? String(raw.facility_id) : null,
    facilityName: String(raw.facility_name),
    facilityAddress: raw.facility_address ? String(raw.facility_address) : null,
    room: String(raw.room),
    slotStart: String(raw.slot_start),
    slotEnd: String(raw.slot_end),
  };
}

const DEFAULT_DOCTORS: DoctorOption[] = HOSPITAL_DOCTORS.map((doc) => ({
  id: doc.id,
  fullName: `${doc.fullName} (${doc.title})`,
  room: `${doc.room} - ${doc.building}`,
  facilityName: doc.facilityName,
  specialtyName: doc.specialtyName,
  isPrimarySpecialty: true,
}));

export async function getRecommendations(specialtyId: string): Promise<CheckoutSelection[]> {
  try {
    const raw = await apiRequest<Record<string, unknown>>(
      `/api/v1/catalog/recommendations?specialty_id=${encodeURIComponent(specialtyId)}&limit=4`,
    );
    const primary = raw.primary ? [mapSelection(raw.primary)] : [];
    const alternatives = Array.isArray(raw.alternatives) ? raw.alternatives.map(mapSelection) : [];
    return [...primary, ...alternatives];
  } catch {
    const spec = getHospitalSpecialtyByCode(specialtyId) || HOSPITAL_SPECIALTIES[0];
    const doc = spec.doctors[0] || HOSPITAL_DOCTORS[0];

    const today = new Date(Date.now() + 86400000);
    const tomorrowSlot1 = new Date(today);
    tomorrowSlot1.setHours(8, 30, 0, 0);

    const tomorrowSlot2 = new Date(today);
    tomorrowSlot2.setHours(14, 0, 0, 0);

    return [
      {
        slotId: `slot_${spec.code}_rec_01`,
        doctorId: doc.id,
        doctorName: doc.fullName,
        specialtyId: spec.code,
        specialtyName: spec.name,
        facilityId: "fac_vmec_01",
        facilityName: spec.facilityName,
        facilityAddress: spec.facilityAddress,
        room: `${spec.room} - ${spec.building}`,
        slotStart: tomorrowSlot1.toISOString(),
        slotEnd: new Date(tomorrowSlot1.getTime() + 1800000).toISOString(),
      },
      {
        slotId: `slot_${spec.code}_rec_02`,
        doctorId: doc.id,
        doctorName: doc.fullName,
        specialtyId: spec.code,
        specialtyName: spec.name,
        facilityId: "fac_vmec_01",
        facilityName: spec.facilityName,
        facilityAddress: spec.facilityAddress,
        room: `${spec.room} - ${spec.building}`,
        slotStart: tomorrowSlot2.toISOString(),
        slotEnd: new Date(tomorrowSlot2.getTime() + 1800000).toISOString(),
      },
    ];
  }
}

export async function listDoctors(): Promise<DoctorOption[]> {
  try {
    const response = await apiRequest<unknown>("/api/v1/catalog/doctors");
    const rawItems = (response as { items?: unknown[] }).items || [];
    const byDoctor = new Map<string, DoctorOption>();
    for (const value of rawItems) {
      const raw = value as Record<string, unknown>;
      const doctor: DoctorOption = {
        id: String(raw.id),
        fullName: String(raw.full_name),
        room: raw.room ? String(raw.room) : null,
        facilityName: raw.facility_name ? String(raw.facility_name) : null,
        specialtyName: String(raw.specialty_name),
        isPrimarySpecialty: Boolean(raw.is_primary_specialty),
      };
      const existing = byDoctor.get(doctor.id);
      if (!existing || doctor.isPrimarySpecialty) byDoctor.set(doctor.id, doctor);
    }
    const result = [...byDoctor.values()].sort((left, right) => left.fullName.localeCompare(right.fullName, "vi"));
    return result.length > 0 ? result : DEFAULT_DOCTORS;
  } catch {
    return DEFAULT_DOCTORS;
  }
}
