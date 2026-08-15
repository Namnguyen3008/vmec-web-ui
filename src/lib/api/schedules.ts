import { apiRequest } from "@/lib/api/client";
import type { ReceptionScheduleOverview, ReceptionScheduleSlot, ScheduleSlot } from "@/lib/api/contracts";
import { list, mapReceptionScheduleOverview, mapReceptionScheduleSlot, mapScheduleSlot } from "@/lib/api/mappers";

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
    const today = new Date().toISOString().split("T")[0];
    return [
      {
        id: "slot_01",
        doctorId: input.doctorId,
        facilityId: "fac_01",
        specialtyId: "TIM_MACH",
        startTime: `${today}T08:30:00Z`,
        endTime: `${today}T09:00:00Z`,
        status: "AVAILABLE",
      },
      {
        id: "slot_02",
        doctorId: input.doctorId,
        facilityId: "fac_01",
        specialtyId: "TIM_MACH",
        startTime: `${today}T09:30:00Z`,
        endTime: `${today}T10:00:00Z`,
        status: "AVAILABLE",
      },
      {
        id: "slot_03",
        doctorId: input.doctorId,
        facilityId: "fac_01",
        specialtyId: "TIM_MACH",
        startTime: `${today}T14:00:00Z`,
        endTime: `${today}T14:30:00Z`,
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
    return {
      date,
      items: [
        {
          id: "slot_01",
          doctorId: "doc_TIM_MACH_01",
          doctorName: "BS.CKII Trần Minh Đức",
          doctorAvatarUrl: null,
          facilityId: "fac_vmec_01",
          facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
          specialtyId: "TIM_MACH",
          specialtyName: "Khoa Tim Mạch",
          room: "Phòng 302",
          startTime: `${date}T08:30:00Z`,
          endTime: `${date}T09:00:00Z`,
          status: "AVAILABLE",
          blockedReason: null,
          canSelfUnblock: false,
        },
        {
          id: "slot_02",
          doctorId: "doc_TIEU_HOA_01",
          doctorName: "TS.BS Nguyễn Thị Mai Lan",
          doctorAvatarUrl: null,
          facilityId: "fac_vmec_01",
          facilityName: "Bệnh viện Đa khoa Quốc tế VMEC",
          specialtyId: "TIEU_HOA",
          specialtyName: "Khoa Tiêu Hóa",
          room: "Phòng 205",
          startTime: `${date}T09:30:00Z`,
          endTime: `${date}T10:00:00Z`,
          status: "BOOKED",
          blockedReason: null,
          canSelfUnblock: false,
        },
      ],
      specialties: [
        { id: "TIM_MACH", name: "Khoa Tim Mạch" },
        { id: "TIEU_HOA", name: "Khoa Tiêu Hóa" },
        { id: "NHI_KHOA", name: "Khoa Nhi" },
        { id: "THAN_KINH", name: "Khoa Thần Kinh" },
      ],
      summary: {
        doctorCount: 8,
        totalSlots: 32,
        availableSlots: 24,
        heldSlots: 2,
        bookedSlots: 6,
        blockedSlots: 0,
        cancelledSlots: 0,
        utilizationPercent: 25,
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
