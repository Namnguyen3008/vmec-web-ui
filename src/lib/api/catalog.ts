import { apiRequest } from "@/lib/api/client";
import type { CheckoutSelection, DoctorOption } from "@/lib/api/contracts";

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

export async function getRecommendations(specialtyId: string): Promise<CheckoutSelection[]> {
  const raw = await apiRequest<Record<string, unknown>>(
    `/api/v1/catalog/recommendations?specialty_id=${encodeURIComponent(specialtyId)}&limit=4`,
  );
  const primary = raw.primary ? [mapSelection(raw.primary)] : [];
  const alternatives = Array.isArray(raw.alternatives) ? raw.alternatives.map(mapSelection) : [];
  return [...primary, ...alternatives];
}

export async function listDoctors(): Promise<DoctorOption[]> {
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
  return [...byDoctor.values()].sort((left, right) => left.fullName.localeCompare(right.fullName, "vi"));
}
