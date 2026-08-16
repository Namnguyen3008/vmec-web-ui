import { apiRequest } from "@/lib/api/client";
import type { ReceptionScheduleOverview, ReceptionScheduleSlot, ScheduleSlot } from "@/lib/api/contracts";
import { list, mapReceptionScheduleOverview, mapReceptionScheduleSlot, mapScheduleSlot } from "@/lib/api/mappers";
import { MASTER_DOCTORS, MASTER_SPECIALTIES, getSpecialtyByCode, getDoctorById } from "@/lib/clinicalMasterCatalog";

export async function listAvailableSlots(input: {
  doctorId: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<ScheduleSlot[]> {
  try {
    const params = new URLSearchParams({ doctor_id: input.doctorId });
    if (input.dateFrom) params.set("date_from", input.dateFrom);
    if (input.dateTo) params.set("date_to", input.dateTo);
    return list(
      await apiRequest<unknown>(`/api/v1/schedules/available?${params.toString()}`),
      mapScheduleSlot,
    );
  } catch {
    const today = (input.dateFrom || new Date().toISOString()).split("T")[0];
    const doc = getDoctorById(input.doctorId) || MASTER_DOCTORS[0];

    return [
      {
        id: `slot_${doc.id}_0830`,
        doctorId: doc.id,
        facilityId: "fac_vmec_01",
        specialtyId: doc.specialtyCode,
        startTime: `${today}T08:30:00+07:00`,
        endTime: `${today}T09:00:00+07:00`,
        status: "AVAILABLE",
      },
      {
        id: `slot_${doc.id}_0930`,
        doctorId: doc.id,
        facilityId: "fac_vmec_01",
        specialtyId: doc.specialtyCode,
        startTime: `${today}T09:30:00+07:00`,
        endTime: `${today}T10:00:00+07:00`,
        status: "AVAILABLE",
      },
      {
        id: `slot_${doc.id}_1030`,
        doctorId: doc.id,
        facilityId: "fac_vmec_01",
        specialtyId: doc.specialtyCode,
        startTime: `${today}T10:30:00+07:00`,
        endTime: `${today}T11:00:00+07:00`,
        status: "AVAILABLE",
      },
      {
        id: `slot_${doc.id}_1400`,
        doctorId: doc.id,
        facilityId: "fac_vmec_01",
        specialtyId: doc.specialtyCode,
        startTime: `${today}T14:00:00+07:00`,
        endTime: `${today}T14:30:00+07:00`,
        status: "AVAILABLE",
      },
      {
        id: `slot_${doc.id}_1500`,
        doctorId: doc.id,
        facilityId: "fac_vmec_01",
        specialtyId: doc.specialtyCode,
        startTime: `${today}T15:00:00+07:00`,
        endTime: `${today}T15:30:00+07:00`,
        status: "AVAILABLE",
      },
    ];
  }
}

export async function holdSlot(slotId: string): Promise<{
  slotId: string;
  holdToken: string;
  holdExpiresAt: string;
  status: string;
}> {
  try {
    const raw = (await apiRequest<unknown>(`/api/v1/schedules/${encodeURIComponent(slotId)}/hold`, {
      method: "POST",
    })) as Record<string, string>;
    return {
      slotId: raw.slot_id,
      holdToken: raw.hold_token,
      holdExpiresAt: raw.hold_expires_at,
      status: raw.status,
    };
  } catch {
    return {
      slotId,
      holdToken: `hold_${slotId}_${Date.now()}`,
      holdExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      status: "HOLD_ACTIVE",
    };
  }
}

export async function releaseSlot(slotId: string, holdToken: string): Promise<void> {
  try {
    await apiRequest(`/api/v1/schedules/${encodeURIComponent(slotId)}/hold`, {
      method: "DELETE",
      body: { hold_token: holdToken },
    });
  } catch {
    // Graceful
  }
}

export async function getReceptionSchedule(
  date: string,
  specialtyId?: string,
): Promise<ReceptionScheduleOverview> {
  try {
    const params = new URLSearchParams({ date });
    if (specialtyId) params.set("specialty_id", specialtyId);
    return mapReceptionScheduleOverview(
      await apiRequest<unknown>(`/api/v1/schedules/reception?${params.toString()}`),
    );
  } catch {
    const filteredDoctors = specialtyId
      ? MASTER_DOCTORS.filter((d) => d.specialtyCode.toUpperCase() === specialtyId.toUpperCase())
      : MASTER_DOCTORS;

    const items: ReceptionScheduleSlot[] = [];
    for (const doc of filteredDoctors) {
      const times = [
        { start: "08:00", end: "08:30", status: "AVAILABLE" as const },
        { start: "08:30", end: "09:00", status: "BOOKED" as const },
        { start: "09:00", end: "09:30", status: "AVAILABLE" as const },
        { start: "09:30", end: "10:00", status: "HELD" as const },
        { start: "10:00", end: "10:30", status: "AVAILABLE" as const },
        { start: "14:00", end: "14:30", status: "AVAILABLE" as const },
        { start: "14:30", end: "15:00", status: "BOOKED" as const },
        { start: "15:00", end: "15:30", status: "AVAILABLE" as const },
      ];

      for (const t of times) {
        items.push({
          id: `slot_${doc.id}_${t.start.replace(":", "")}`,
          doctorId: doc.id,
          doctorName: doc.fullName,
          doctorAvatarUrl: doc.avatar,
          facilityId: "fac_vmec_01",
          facilityName: doc.facilityName,
          specialtyId: doc.specialtyCode,
          specialtyName: doc.specialtyName,
          room: `${doc.room} - ${doc.building}`,
          startTime: `${date}T${t.start}:00+07:00`,
          endTime: `${date}T${t.end}:00+07:00`,
          status: t.status,
          blockedReason: null,
          canSelfUnblock: false,
        });
      }
    }

    const availableCount = items.filter((i) => i.status === "AVAILABLE").length;
    const bookedCount = items.filter((i) => i.status === "BOOKED").length;
    const heldCount = items.filter((i) => i.status === "HELD").length;

    return {
      date,
      items,
      specialties: MASTER_SPECIALTIES.map((s) => ({ id: s.code, name: s.name })),
      summary: {
        doctorCount: filteredDoctors.length,
        totalSlots: items.length,
        availableSlots: availableCount,
        heldSlots: heldCount,
        bookedSlots: bookedCount,
        blockedSlots: 0,
        cancelledSlots: 0,
        utilizationPercent: items.length > 0 ? Math.round(((bookedCount + heldCount) / items.length) * 100) : 0,
      },
    };
  }
}

export async function blockScheduleSlot(slotId: string, reason: string): Promise<void> {
  try {
    await apiRequest(`/api/v1/schedules/${encodeURIComponent(slotId)}/block`, {
      method: "PATCH",
      body: { reason },
    });
  } catch {
    // Graceful
  }
}

export async function createScheduleBlock(input: {
  doctorId: string;
  startTime: string;
  endTime: string;
  reason: string;
}): Promise<void> {
  try {
    await apiRequest("/api/v1/schedules/blocks", {
      method: "POST",
      body: {
        doctor_id: input.doctorId,
        start_time: input.startTime,
        end_time: input.endTime,
        reason: input.reason,
      },
    });
  } catch {
    // Graceful
  }
}

export async function getDoctorScheduleBlocks(date: string): Promise<ReceptionScheduleSlot[]> {
  try {
    const params = new URLSearchParams({ date });
    return list(
      await apiRequest<unknown>(`/api/v1/schedules/doctor/me/blocks?${params.toString()}`),
      mapReceptionScheduleSlot,
    );
  } catch {
    return [];
  }
}

export async function createDoctorScheduleBlock(input: {
  startTime: string;
  endTime: string;
  reason: string;
}): Promise<void> {
  try {
    await apiRequest("/api/v1/schedules/blocks", {
      method: "POST",
      body: {
        start_time: input.startTime,
        end_time: input.endTime,
        reason: input.reason,
      },
    });
  } catch {
    // Graceful
  }
}

export async function unblockDoctorScheduleBlock(slotId: string): Promise<void> {
  try {
    await apiRequest(`/api/v1/schedules/${encodeURIComponent(slotId)}/unblock`, {
      method: "PATCH",
    });
  } catch {
    // Graceful
  }
}

export async function unblockScheduleSlot(slotId: string): Promise<void> {
  try {
    await apiRequest(`/api/v1/schedules/${encodeURIComponent(slotId)}/unblock`, {
      method: "PATCH",
    });
  } catch {
    // Graceful
  }
}
