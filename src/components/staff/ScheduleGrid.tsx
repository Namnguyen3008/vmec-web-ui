"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarX2, Clock3, LockKeyhole } from "lucide-react";
import type { ReceptionScheduleSlot, ScheduleStatus } from "@/lib/api/contracts";
import {
  CLINIC_DAY_END_MINUTE,
  CLINIC_DAY_START_MINUTE,
  freeRanges,
  isScheduleEvent,
  minutesInClinicTimezone,
  slotMinuteRange,
} from "@/lib/scheduleTimeline";

const SLOT_LANE_HEIGHT = 52;
const DOCTOR_COLUMN_WIDTH = 240;
const BASE_TIMELINE_WIDTH = 800;
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.15;

const statusContent: Record<ScheduleStatus, { label: string; classes: string }> = {
  AVAILABLE: {
    label: "Trống",
    classes: "border border-dashed border-line-strong bg-white text-ink-700 hover:border-primary-600 hover:bg-primary-100/30",
  },
  HELD: {
    label: "Đang giữ",
    classes: "border border-warning/40 bg-amber-50 text-amber-800",
  },
  BOOKED: {
    label: "Đã đặt",
    classes: "border border-primary-400/40 bg-primary-100 text-primary-900",
  },
  BLOCKED: {
    label: "Đã khóa",
    classes: "border border-danger/20 bg-danger-soft text-danger hover:border-danger/50",
  },
  CANCELLED: {
    label: "Đã hủy",
    classes: "border border-line bg-bg-muted text-ink-500 line-through",
  },
};

function minuteLabel(value: number) {
  const normalized = ((value % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

function timeRangeLabel(slot: ReceptionScheduleSlot) {
  return `${minuteLabel(minutesInClinicTimezone(slot.startTime))}–${minuteLabel(minutesInClinicTimezone(slot.endTime))}`;
}

type PositionedSlot = {
  slot: ReceptionScheduleSlot;
  lane: number;
  startMinute: number;
  endMinute: number;
};

function positionDoctorSlots(slots: ReceptionScheduleSlot[]) {
  const laneEnds: number[] = [];
  const positioned: PositionedSlot[] = [...slots]
    .sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime())
    .map((slot) => {
      const { start: startMinute, end: endMinute } = slotMinuteRange(slot);

      let lane = laneEnds.findIndex((laneEnd) => laneEnd <= startMinute);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(endMinute);
      } else {
        laneEnds[lane] = endMinute;
      }
      return { slot, lane, startMinute, endMinute };
    });
  return { positioned, laneCount: Math.max(laneEnds.length, 1) };
}

export function ScheduleGrid({
  slots,
  onSelectSlot,
}: {
  slots: ReceptionScheduleSlot[];
  onSelectSlot: (slot: ReceptionScheduleSlot) => void;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) {
        const rawDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
        const deltaMultiplier = event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 32
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? container.clientWidth
            : 1;
        const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
        const nextScrollLeft = Math.min(
          maxScrollLeft,
          Math.max(0, container.scrollLeft + rawDelta * deltaMultiplier),
        );

        if (nextScrollLeft !== container.scrollLeft) {
          event.preventDefault();
          container.scrollLeft = nextScrollLeft;
        }
        return;
      }

      event.preventDefault();

      const rect = container.getBoundingClientRect();
      const cursorX = event.clientX - rect.left;
      const oldTimelineWidth = Math.max(1, container.scrollWidth - DOCTOR_COLUMN_WIDTH);
      const timelinePoint = Math.max(
        0,
        container.scrollLeft + cursorX - DOCTOR_COLUMN_WIDTH,
      );

      setZoom((current) => {
        const direction = event.deltaY < 0 ? 1 : -1;
        const next = Math.min(
          MAX_ZOOM,
          Math.max(MIN_ZOOM, Number((current + direction * ZOOM_STEP).toFixed(2))),
        );
        if (next === current) return current;

        requestAnimationFrame(() => {
          const newTimelineWidth = Math.max(1, container.scrollWidth - DOCTOR_COLUMN_WIDTH);
          container.scrollLeft =
            timelinePoint * (newTimelineWidth / oldTimelineWidth) - cursorX + DOCTOR_COLUMN_WIDTH;
        });
        return next;
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  const scheduleEvents = slots.filter(isScheduleEvent);
  const slotRanges = scheduleEvents.map(slotMinuteRange);
  const timelineStart = Math.min(
    CLINIC_DAY_START_MINUTE,
    slotRanges.length
      ? Math.floor(Math.min(...slotRanges.map((range) => range.start)) / 60) * 60
      : CLINIC_DAY_START_MINUTE,
  );
  const timelineEnd = Math.max(
    CLINIC_DAY_END_MINUTE,
    slotRanges.length
      ? Math.ceil(Math.max(...slotRanges.map((range) => range.end)) / 60) * 60
      : CLINIC_DAY_END_MINUTE,
  );
  const timelineDuration = timelineEnd - timelineStart;
  const hourTicks = Array.from(
    { length: Math.floor(timelineDuration / 60) + 1 },
    (_, index) => timelineStart + index * 60,
  );
  const hourWidthPercent = 6000 / timelineDuration;

  const doctors = Array.from(
    scheduleEvents.reduce((groups, slot) => {
      const current = groups.get(slot.doctorId);
      if (current) current.slots.push(slot);
      else groups.set(slot.doctorId, { doctor: slot, slots: [slot] });
      return groups;
    }, new Map<string, { doctor: ReceptionScheduleSlot; slots: ReceptionScheduleSlot[] }>()).values(),
  ).sort((left, right) => {
    const leftStart = Math.min(...left.slots.map((slot) => new Date(slot.startTime).getTime()));
    const rightStart = Math.min(...right.slots.map((slot) => new Date(slot.startTime).getTime()));
    return leftStart - rightStart || left.doctor.doctorName.localeCompare(right.doctor.doctorName, "vi");
  });

  const timelineBackground = {
    backgroundImage: "linear-gradient(to right, transparent calc(100% - 1px), #dfe3e3 calc(100% - 1px))",
    backgroundSize: `${hourWidthPercent}% 100%`,
  };
  const timelineMinWidth = Math.round(BASE_TIMELINE_WIDTH * zoom);
  const gridColumns = `${DOCTOR_COLUMN_WIDTH}px minmax(${timelineMinWidth}px, 1fr)`;

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-bg/40 px-4 py-2 text-caption text-ink-500">
        <span>Lăn chuột để xem các khoảng giờ · Giữ Ctrl + lăn để thu phóng</span>
        <button
          type="button"
          onClick={() => setZoom(1)}
          className="shrink-0 rounded-lg border border-line bg-surface px-2.5 py-1 font-semibold text-ink-700 hover:bg-bg-muted"
          title="Đặt lại tỷ lệ timeline"
        >
          {Math.round(zoom * 100)}%
        </button>
      </div>
      <div ref={scrollContainerRef} className="overflow-x-auto overscroll-x-contain">
        <div style={{ minWidth: DOCTOR_COLUMN_WIDTH + timelineMinWidth }}>
        <div className="grid border-b border-line" style={{ gridTemplateColumns: gridColumns }}>
          <div className="sticky left-0 z-30 border-r border-line bg-surface px-4 py-4 text-body font-semibold text-ink-500">
            Bác sĩ / Chuyên khoa
          </div>
          <div className="relative h-14 bg-bg/40" style={timelineBackground}>
            {hourTicks.map((minute, index) => {
              const position = ((minute - timelineStart) / timelineDuration) * 100;
              const alignment = index === 0 ? "translate-x-0" : index === hourTicks.length - 1 ? "-translate-x-full" : "-translate-x-1/2";
              return (
                <span
                  key={minute}
                  className={`absolute top-4 text-caption font-semibold text-ink-500 ${alignment}`}
                  style={{ left: `${position}%` }}
                >
                  {minuteLabel(minute)}
                </span>
              );
            })}
          </div>
        </div>

        {doctors.map(({ doctor, slots: doctorSlots }) => {
          const { positioned, laneCount } = positionDoctorSlots(doctorSlots);
          const inferredFreeRanges = freeRanges(doctorSlots, timelineStart, timelineEnd);
          const rowHeight = Math.max(76, laneCount * SLOT_LANE_HEIGHT + 16);
          const specialties = Array.from(
            new Set(doctorSlots.map((slot) => slot.specialtyName).filter(Boolean)),
          ).join(", ");

          return (
            <div
              key={doctor.doctorId}
              className="grid border-b border-line last:border-b-0"
              style={{ gridTemplateColumns: gridColumns }}
            >
              <div
                className="sticky left-0 z-20 flex items-center gap-3 border-r border-line bg-surface px-4 py-3"
                style={{ minHeight: rowHeight }}
              >
                {doctor.doctorAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={doctor.doctorAvatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-200 font-bold text-primary-900">
                    {doctor.doctorName.trim().charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-bold text-ink-900">{doctor.doctorName}</p>
                  <p className="truncate text-caption text-ink-500">
                    {specialties || "Chưa gán chuyên khoa"}
                    {doctor.room ? ` · P.${doctor.room}` : ""}
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-500">{doctorSlots.length} khung giờ</p>
                </div>
              </div>

              <div className="relative bg-bg/20" style={{ ...timelineBackground, minHeight: rowHeight }}>
                {inferredFreeRanges.map((range) => {
                  const left = ((range.start - timelineStart) / timelineDuration) * 100;
                  const width = ((range.end - range.start) / timelineDuration) * 100;
                  return (
                    <div
                      key={`${range.start}-${range.end}`}
                      className="absolute bottom-2 top-2 flex items-center justify-center overflow-hidden rounded-lg border border-dashed border-line-strong bg-white/65 text-[11px] font-medium text-ink-500"
                      style={{ left: `${left}%`, width: `${width}%` }}
                      title={`${minuteLabel(range.start)}–${minuteLabel(range.end)} · Trống`}
                    >
                      {range.end - range.start >= 60 ? "Trống" : ""}
                    </div>
                  );
                })}
                {positioned.map(({ slot, lane, startMinute, endMinute }) => {
                  const clippedStart = Math.max(startMinute, timelineStart);
                  const clippedEnd = Math.min(endMinute, timelineEnd);
                  const left = ((clippedStart - timelineStart) / timelineDuration) * 100;
                  const width = Math.max(((clippedEnd - clippedStart) / timelineDuration) * 100, 1.25);
                  const content = statusContent[slot.status];
                  const actionable = slot.status === "AVAILABLE" || slot.status === "BLOCKED";
                  const rangeLabel = timeRangeLabel(slot);

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={!actionable}
                      onClick={() => onSelectSlot(slot)}
                      aria-label={`${slot.doctorName}, ${rangeLabel}, ${content.label}`}
                      title={slot.blockedReason ? `${rangeLabel} · ${slot.blockedReason}` : `${rangeLabel} · ${content.label}`}
                      className={`absolute z-10 flex h-11 min-w-0 items-center gap-1 overflow-hidden rounded-lg px-2 text-left text-[11px] font-bold shadow-sm transition ${content.classes} disabled:cursor-default`}
                      style={{
                        left: `${left}%`,
                        top: 8 + lane * SLOT_LANE_HEIGHT,
                        width: `${width}%`,
                      }}
                    >
                      {slot.status === "BLOCKED" ? <LockKeyhole size={12} className="shrink-0" /> : <Clock3 size={12} className="shrink-0" />}
                      <span className="min-w-0 truncate">
                        <span className="block truncate">{content.label}</span>
                        <span className="block truncate font-normal opacity-75">{rangeLabel}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {!doctors.length && (
          <div className="grid" style={{ gridTemplateColumns: gridColumns }}>
            <div className="sticky left-0 z-20 flex min-h-44 items-center gap-3 border-r border-line bg-surface px-4 py-4 text-body text-ink-500">
              <CalendarX2 size={22} className="text-primary-400" /> Chưa có bác sĩ có lịch
            </div>
            <div className="relative flex min-h-44 items-center justify-center bg-bg/20 px-6 text-center" style={timelineBackground}>
              <div className="rounded-xl border border-dashed border-line-strong bg-white/80 px-5 py-3">
                <p className="font-semibold text-ink-700">Timeline đang trống</p>
                <p className="mt-1 text-caption text-ink-500">
                  Khi có lịch khám, giữ chỗ hoặc khóa lịch, bác sĩ tương ứng sẽ xuất hiện tại đúng khung giờ.
                </p>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
