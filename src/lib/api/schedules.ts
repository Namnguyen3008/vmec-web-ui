import { apiRequest } from "@/lib/api/client";
import type { ReceptionScheduleOverview, ReceptionScheduleSlot, ScheduleSlot } from "@/lib/api/contracts";
import { list, mapReceptionScheduleOverview, mapReceptionScheduleSlot, mapScheduleSlot } from "@/lib/api/mappers";

export async function listAvailableSlots(input: {
  doctorId: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<ScheduleSlot[]> {
  const params = new URLSearchParams({ doctor_id: input.doctorId });
  if (input.dateFrom) params.set("date_from", input.dateFrom);
  if (input.dateTo) params.set("date_to", input.dateTo);
  return list(
    await apiRequest<unknown>(`/api/v1/schedules/available?${params.toString()}`),
    mapScheduleSlot,
  );
}

export async function holdSlot(slotId: string): Promise<{
  slotId: string;
  holdToken: string;
  holdExpiresAt: string;
  status: string;
}> {
  const raw = (await apiRequest<unknown>(`/api/v1/schedules/${encodeURIComponent(slotId)}/hold`, {
    method: "POST",
  })) as Record<string, string>;
  return {
    slotId: raw.slot_id,
    holdToken: raw.hold_token,
    holdExpiresAt: raw.hold_expires_at,
    status: raw.status,
  };
}

export async function releaseSlot(slotId: string, holdToken: string): Promise<void> {
  await apiRequest(`/api/v1/schedules/${encodeURIComponent(slotId)}/hold`, {
    method: "DELETE",
    body: { hold_token: holdToken },
  });
}

export async function getReceptionSchedule(
  date: string,
  specialtyId?: string,
): Promise<ReceptionScheduleOverview> {
  const params = new URLSearchParams({ date });
  if (specialtyId) params.set("specialty_id", specialtyId);
  return mapReceptionScheduleOverview(
    await apiRequest<unknown>(`/api/v1/schedules/reception?${params.toString()}`),
  );
}

export async function blockScheduleSlot(slotId: string, reason: string): Promise<void> {
  await apiRequest(`/api/v1/schedules/${encodeURIComponent(slotId)}/block`, {
    method: "PATCH",
    body: { reason },
  });
}

export async function createScheduleBlock(input: {
  doctorId: string;
  startTime: string;
  endTime: string;
  reason: string;
}): Promise<void> {
  await apiRequest("/api/v1/schedules/blocks", {
    method: "POST",
    body: {
      doctor_id: input.doctorId,
      start_time: input.startTime,
      end_time: input.endTime,
      reason: input.reason,
    },
  });
}

export async function getDoctorScheduleBlocks(date: string): Promise<ReceptionScheduleSlot[]> {
  const params = new URLSearchParams({ date });
  return list(
    await apiRequest<unknown>(`/api/v1/schedules/doctor/me/blocks?${params.toString()}`),
    mapReceptionScheduleSlot,
  );
}

export async function createDoctorScheduleBlock(input: {
  startTime: string;
  endTime: string;
  reason: string;
}): Promise<void> {
  await apiRequest("/api/v1/schedules/blocks", {
    method: "POST",
    body: {
      start_time: input.startTime,
      end_time: input.endTime,
      reason: input.reason,
    },
  });
}

export async function unblockDoctorScheduleBlock(slotId: string): Promise<void> {
  await apiRequest(`/api/v1/schedules/${encodeURIComponent(slotId)}/unblock`, {
    method: "PATCH",
  });
}

export async function unblockScheduleSlot(slotId: string): Promise<void> {
  await apiRequest(`/api/v1/schedules/${encodeURIComponent(slotId)}/unblock`, {
    method: "PATCH",
  });
}

