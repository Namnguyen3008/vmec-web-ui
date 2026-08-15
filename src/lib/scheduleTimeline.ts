import type { ReceptionScheduleSlot, ScheduleStatus } from "@/lib/api/contracts";

export const CLINIC_DAY_START_MINUTE = 8 * 60;
export const CLINIC_DAY_END_MINUTE = 18 * 60;

const SCHEDULE_EVENT_STATUSES = new Set<ScheduleStatus>(["HELD", "BOOKED", "BLOCKED"]);

export function isScheduleEvent(slot: ReceptionScheduleSlot) {
  return SCHEDULE_EVENT_STATUSES.has(slot.status);
}

export function minutesInClinicTimezone(value: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Bangkok",
  }).formatToParts(new Date(value));
  const hour = Number(parts.find((part) => part.type === "hour")?.value || 0) % 24;
  const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);
  return hour * 60 + minute;
}

export function slotMinuteRange(slot: ReceptionScheduleSlot) {
  const start = minutesInClinicTimezone(slot.startTime);
  let end = minutesInClinicTimezone(slot.endTime);
  if (end <= start) end += 1440;
  return { start, end };
}

export function mergeRanges(ranges: Array<{ start: number; end: number }>) {
  const merged: Array<{ start: number; end: number }> = [];
  for (const range of [...ranges].sort((left, right) => left.start - right.start)) {
    const previous = merged.at(-1);
    if (previous && range.start <= previous.end) previous.end = Math.max(previous.end, range.end);
    else merged.push({ ...range });
  }
  return merged;
}

export function freeRanges(
  slots: ReceptionScheduleSlot[],
  timelineStart: number,
  timelineEnd: number,
) {
  const occupied = mergeRanges(
    slots.map(slotMinuteRange).map((range) => ({
      start: Math.max(range.start, timelineStart),
      end: Math.min(range.end, timelineEnd),
    })).filter((range) => range.end > range.start),
  );
  const free: Array<{ start: number; end: number }> = [];
  let cursor = timelineStart;
  for (const range of occupied) {
    if (range.start > cursor) free.push({ start: cursor, end: range.start });
    cursor = Math.max(cursor, range.end);
  }
  if (cursor < timelineEnd) free.push({ start: cursor, end: timelineEnd });
  return free;
}

export function calculateVisibleScheduleSummary(slots: ReceptionScheduleSlot[]) {
  const events = slots.filter(isScheduleEvent);
  const doctorGroups = events.reduce((groups, slot) => {
    const current = groups.get(slot.doctorId) || [];
    current.push(slot);
    groups.set(slot.doctorId, current);
    return groups;
  }, new Map<string, ReceptionScheduleSlot[]>());
  let occupiedMinutes = 0;
  for (const doctorSlots of doctorGroups.values()) {
    occupiedMinutes += mergeRanges(
      doctorSlots.map(slotMinuteRange).map((range) => ({
        start: Math.max(range.start, CLINIC_DAY_START_MINUTE),
        end: Math.min(range.end, CLINIC_DAY_END_MINUTE),
      })).filter((range) => range.end > range.start),
    ).reduce((total, range) => total + range.end - range.start, 0);
  }
  const capacityMinutes = doctorGroups.size * (CLINIC_DAY_END_MINUTE - CLINIC_DAY_START_MINUTE);
  return {
    doctorCount: doctorGroups.size,
    bookedSlots: events.filter((slot) => slot.status === "BOOKED").length,
    heldSlots: events.filter((slot) => slot.status === "HELD").length,
    blockedSlots: events.filter((slot) => slot.status === "BLOCKED").length,
    utilizationPercent: capacityMinutes ? Math.round(occupiedMinutes * 100 / capacityMinutes) : 0,
  };
}
