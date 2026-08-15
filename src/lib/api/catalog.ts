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

const DEFAULT_DOCTORS: DoctorOption[] = [
  {
    id: "doc_01",
    fullName: "BS.CKII Trần Minh Đức",
    room: "Phòng 302 - Tòa A",
    facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
    specialtyName: "Khoa Tim Mạch",
    isPrimarySpecialty: true,
  },
  {
    id: "doc_02",
    fullName: "TS.BS Nguyễn Thị Mai Lan",
    room: "Phòng 205 - Tòa B",
    facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
    specialtyName: "Khoa Tiêu Hóa - Gan Mật",
    isPrimarySpecialty: true,
  },
  {
    id: "doc_03",
    fullName: "ThS.BS Lê Thu Trang",
    room: "Phòng 108 - Tòa Nhi",
    facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
    specialtyName: "Khoa Nhi",
    isPrimarySpecialty: true,
  },
  {
    id: "doc_04",
    fullName: "PGS.TS Hoàng Văn Bách",
    room: "Phòng 401 - Tòa A",
    facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
    specialtyName: "Khoa Thần Kinh",
    isPrimarySpecialty: true,
  },
];

export async function getRecommendations(specialtyId: string): Promise<CheckoutSelection[]> {
  try {
    const raw = await apiRequest<Record<string, unknown>>(
      `/api/v1/catalog/recommendations?specialty_id=${encodeURIComponent(specialtyId)}&limit=4`,
    );
    const primary = raw.primary ? [mapSelection(raw.primary)] : [];
    const alternatives = Array.isArray(raw.alternatives) ? raw.alternatives.map(mapSelection) : [];
    return [...primary, ...alternatives];
  } catch {
    const today = new Date(Date.now() + 86400000).toISOString();
    return [
      {
        slotId: `slot_${specialtyId}_alt_01`,
        doctorId: "doc_01",
        doctorName: "BS.CKII Trần Minh Đức",
        specialtyId,
        specialtyName: "Khoa Tim Mạch",
        facilityId: "fac_01",
        facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
        facilityAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
        room: "Phòng 302",
        slotStart: today,
        slotEnd: new Date(Date.now() + 86400000 + 1800000).toISOString(),
      },
      {
        slotId: `slot_${specialtyId}_alt_02`,
        doctorId: "doc_02",
        doctorName: "TS.BS Nguyễn Thị Mai Lan",
        specialtyId,
        specialtyName: "Khoa Tiêu Hóa",
        facilityId: "fac_01",
        facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
        facilityAddress: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
        room: "Phòng 205",
        slotStart: today,
        slotEnd: new Date(Date.now() + 86400000 + 1800000).toISOString(),
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
