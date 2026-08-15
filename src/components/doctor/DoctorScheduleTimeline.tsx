"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, LockKeyhole, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Appointment, ReceptionScheduleSlot } from "@/lib/api/contracts";

const CLINIC_TIME_ZONE = "Asia/Bangkok";
const DEFAULT_START_MINUTE = 8 * 60;
const DEFAULT_END_MINUTE = 18 * 60;
const LANE_HEIGHT = 64;

function dateKey(value: Date | string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(typeof value === "string" ? new Date(value) : value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function shiftDate(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function minuteOfDay(value: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: CLINIC_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(value));
  const hour = Number(parts.find((part) => part.type === "hour")?.value || 0) % 24;
  const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);
  return hour * 60 + minute;
}

function minuteLabel(value: number) {
  const normalized = ((value % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

function patientName(appointment: Appointment) {
  const snapshot = appointment.patientSnapshot;
  const name = snapshot.full_name ?? snapshot.fullName;
  return typeof name === "string" && name.trim() ? name : "Bệnh nhân";
}

type TimelineEvent =
  | { id: string; kind: "appointment"; startTime: string; endTime: string; appointment: Appointment }
  | { id: string; kind: "block"; startTime: string; endTime: string; block: ReceptionScheduleSlot };

function positionEvents(events: TimelineEvent[]) {
  const laneEnds: number[] = [];
  const positioned = events
    .sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime())
    .map((event) => {
      const start = minuteOfDay(event.startTime);
      let end = minuteOfDay(event.endTime);
      if (end <= start) end += 1440;
      let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start);
      if (lane < 0) {
        lane = laneEnds.length;
        laneEnds.push(end);
      } else {
        laneEnds[lane] = end;
      }
      return { event, start, end, lane };
    });
  return { positioned, laneCount: Math.max(laneEnds.length, 1) };
}

export function DoctorScheduleTimeline({
  appointments,
  blocks,
  selectedDate,
  onSelectAppointment,
  onDateChange,
  onCreateBlock,
  onUnblockBlock,
}: {
  appointments: Appointment[];
  blocks: ReceptionScheduleSlot[];
  selectedDate: string;
  onSelectAppointment: (appointment: Appointment) => void;
  onDateChange: (date: string) => void;
  onCreateBlock: (input: { startTime: string; endTime: string; reason: string }) => Promise<void>;
  onUnblockBlock: (slotId: string, date: string) => Promise<void>;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [blockDate, setBlockDate] = useState(selectedDate);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("08:30");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<ReceptionScheduleSlot | null>(null);
  const [unblocking, setUnblocking] = useState(false);
  const [unblockError, setUnblockError] = useState<string | null>(null);
  const [liveNow, setLiveNow] = useState<Date | null>(null);

  useEffect(() => {
    const firstTick = window.setTimeout(() => setLiveNow(new Date()), 0);
    const timer = window.setInterval(() => setLiveNow(new Date()), 15_000);
    return () => {
      window.clearTimeout(firstTick);
      window.clearInterval(timer);
    };
  }, []);
  const appointmentsForDay = useMemo(
    () => appointments.filter((item) => item.slotStart && dateKey(item.slotStart) === selectedDate),
    [appointments, selectedDate],
  );
  const blocksForDay = useMemo(
    () => blocks.filter((item) => dateKey(item.startTime) === selectedDate),
    [blocks, selectedDate],
  );
  const timelineEvents: TimelineEvent[] = [
    ...appointmentsForDay
      .filter((item): item is Appointment & { slotStart: string; slotEnd: string } => Boolean(item.slotStart && item.slotEnd))
      .map((appointment) => ({
        id: appointment.id,
        kind: "appointment" as const,
        startTime: appointment.slotStart,
        endTime: appointment.slotEnd,
        appointment,
      })),
    ...blocksForDay.map((block) => ({
      id: block.id,
      kind: "block" as const,
      startTime: block.startTime,
      endTime: block.endTime,
      block,
    })),
  ];
  const { positioned, laneCount } = positionEvents(timelineEvents);
  const timelineStart = Math.min(
    DEFAULT_START_MINUTE,
    positioned.length ? Math.floor(Math.min(...positioned.map((item) => item.start)) / 60) * 60 : DEFAULT_START_MINUTE,
  );
  const timelineEnd = Math.max(
    DEFAULT_END_MINUTE,
    positioned.length ? Math.ceil(Math.max(...positioned.map((item) => item.end)) / 60) * 60 : DEFAULT_END_MINUTE,
  );
  const duration = timelineEnd - timelineStart;
  const hourTicks = Array.from({ length: Math.floor(duration / 60) + 1 }, (_, index) => timelineStart + index * 60);
  const rowHeight = Math.max(116, laneCount * LANE_HEIGHT + 28);
  const today = dateKey(liveNow || new Date());
  const nowMinute = liveNow ? minuteOfDay(liveNow.toISOString()) : -1;
  const showNow = liveNow !== null && selectedDate === today && nowMinute >= timelineStart && nowMinute <= timelineEnd;
  const dayLabel = new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "full",
    timeZone: CLINIC_TIME_ZONE,
  }).format(new Date(`${selectedDate}T00:00:00+07:00`));

  function selectDate(nextDate: string) {
    onDateChange(nextDate);
  }

  function openBlockDialog() {
    setBlockDate(selectedDate < today ? today : selectedDate);
    setStartTime("08:00");
    setEndTime("08:30");
    setReason("");
    setFormError(null);
    setDialogOpen(true);
  }

  async function submitBlock() {
    if (!blockDate || !startTime || !endTime || !reason.trim()) {
      setFormError("Vui lòng chọn ngày, khung giờ và nhập lý do khóa.");
      return;
    }
    if (blockDate < today) {
      setFormError("Không thể khóa lịch cho ngày đã qua.");
      return;
    }
    if (endTime <= startTime) {
      setFormError("Giờ kết thúc phải sau giờ bắt đầu.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await onCreateBlock({
        startTime: `${blockDate}T${startTime}:00+07:00`,
        endTime: `${blockDate}T${endTime}:00+07:00`,
        reason: reason.trim(),
      });
      setDialogOpen(false);
      if (blockDate !== selectedDate) selectDate(blockDate);
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Không thể khóa khung giờ.");
    } finally {
      setSaving(false);
    }
  }

  async function submitUnblock() {
    if (!selectedBlock) return;
    setUnblocking(true);
    setUnblockError(null);
    try {
      await onUnblockBlock(selectedBlock.id, selectedDate);
      setSelectedBlock(null);
    } catch (caught) {
      setUnblockError(caught instanceof Error ? caught.message : "Không thể bỏ chặn khung giờ.");
    } finally {
      setUnblocking(false);
    }
  }

  return (
    <section className="mt-6 overflow-hidden rounded-card border border-line bg-surface shadow-xs">
      <div className="flex flex-col gap-4 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays size={20} className="text-primary-700" />
            <h2 className="text-h3 font-bold text-ink-900">Lịch trình bác sĩ</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-2.5 py-1 text-[11px] font-bold text-primary-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary-600" /> Trực tiếp
            </span>
          </div>
          <p className="mt-1 text-caption capitalize text-ink-500">
            {dayLabel} · {appointmentsForDay.length} ca đã xác nhận · {blocksForDay.length} khoảng đã khóa
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={openBlockDialog}>
            <LockKeyhole size={16} /> Chặn thời gian
          </Button>
          <button
            type="button"
            onClick={() => selectDate(shiftDate(selectedDate, -1))}
            className="rounded-lg border border-line p-2 text-ink-700 hover:bg-bg-muted"
            aria-label="Xem ngày trước"
          >
            <ChevronLeft size={18} />
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => selectDate(event.target.value)}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-body font-semibold text-ink-800"
            aria-label="Chọn ngày xem lịch"
          />
          <button
            type="button"
            onClick={() => selectDate(shiftDate(selectedDate, 1))}
            className="rounded-lg border border-line p-2 text-ink-700 hover:bg-bg-muted"
            aria-label="Xem ngày sau"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="relative h-12 border-b border-line bg-bg/40">
            {hourTicks.map((minute, index) => {
              const left = ((minute - timelineStart) / duration) * 100;
              const alignment = index === 0 ? "translate-x-0" : index === hourTicks.length - 1 ? "-translate-x-full" : "-translate-x-1/2";
              return (
                <span key={minute} className={`absolute top-4 text-caption font-semibold text-ink-500 ${alignment}`} style={{ left: `${left}%` }}>
                  {minuteLabel(minute)}
                </span>
              );
            })}
          </div>
          <div
            className="relative bg-bg/20"
            style={{
              minHeight: rowHeight,
              backgroundImage: "linear-gradient(to right, transparent calc(100% - 1px), #dfe3e3 calc(100% - 1px))",
              backgroundSize: `${6000 / duration}% 100%`,
            }}
          >
            {showNow && (
              <div className="absolute bottom-0 top-0 z-20 w-px bg-danger" style={{ left: `${((nowMinute - timelineStart) / duration) * 100}%` }}>
                <span className="absolute -left-1 top-0 h-2.5 w-2.5 rounded-full bg-danger" />
              </div>
            )}

            {positioned.map(({ event, start, end, lane }) => {
              const left = ((Math.max(start, timelineStart) - timelineStart) / duration) * 100;
              const width = Math.max(((Math.min(end, timelineEnd) - Math.max(start, timelineStart)) / duration) * 100, 2);
              if (event.kind === "block") {
                const blockContent = (
                  <>
                    <LockKeyhole size={14} className="shrink-0" />
                    <span className="min-w-0 truncate">
                      <span className="block truncate font-bold">Không nhận bệnh nhân</span>
                      <span className="block truncate opacity-80">{minuteLabel(start)}–{minuteLabel(end)} · {event.block.blockedReason || "Đã khóa"}</span>
                    </span>
                  </>
                );
                if (event.block.canSelfUnblock) {
                  return (
                    <button
                      key={`block-${event.id}`}
                      type="button"
                      onClick={() => {
                        setSelectedBlock(event.block);
                        setUnblockError(null);
                      }}
                      className="absolute z-10 flex h-12 min-w-0 items-center gap-2 overflow-hidden rounded-lg border border-danger/25 bg-danger-soft px-3 text-left text-caption text-danger shadow-sm transition hover:border-danger/60 focus:outline-none focus:ring-2 focus:ring-danger"
                      style={{ left: `${left}%`, top: 14 + lane * LANE_HEIGHT, width: `${width}%` }}
                      title={`${minuteLabel(start)}–${minuteLabel(end)} · Bấm để bỏ chặn`}
                    >
                      {blockContent}
                    </button>
                  );
                }
                return (
                  <div
                    key={`block-${event.id}`}
                    className="absolute z-10 flex h-12 min-w-0 items-center gap-2 overflow-hidden rounded-lg border border-danger/25 bg-danger-soft px-3 text-left text-caption text-danger shadow-sm"
                    style={{ left: `${left}%`, top: 14 + lane * LANE_HEIGHT, width: `${width}%` }}
                    title={`${minuteLabel(start)}–${minuteLabel(end)} · ${event.block.blockedReason || "Không nhận bệnh nhân"}`}
                  >
                    {blockContent}
                  </div>
                );
              }
              const appointment = event.appointment;
              return (
                <button
                  key={`appointment-${event.id}`}
                  type="button"
                  onClick={() => onSelectAppointment(appointment)}
                  className="absolute z-10 flex h-12 min-w-0 items-center gap-2 overflow-hidden rounded-lg border border-primary-400/50 bg-primary-100 px-3 text-left text-caption text-primary-900 shadow-sm transition hover:border-primary-600 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  style={{ left: `${left}%`, top: 14 + lane * LANE_HEIGHT, width: `${width}%` }}
                  title={`${minuteLabel(start)}–${minuteLabel(end)} · ${patientName(appointment)}`}
                >
                  <Clock3 size={14} className="shrink-0" />
                  <span className="min-w-0 truncate">
                    <span className="block truncate font-bold">{patientName(appointment)}</span>
                    <span className="block truncate opacity-75">{minuteLabel(start)}–{minuteLabel(end)}{appointment.room ? ` · ${appointment.room}` : ""}</span>
                  </span>
                </button>
              );
            })}

            {!positioned.length && (
              <div className="absolute inset-0 flex items-center justify-center px-5 text-center">
                <div className="rounded-xl border border-dashed border-line-strong bg-white/85 px-5 py-3">
                  <p className="font-semibold text-ink-700">Không có ca khám đã xác nhận trong ngày này</p>
                  <p className="mt-1 text-caption text-ink-500">Chọn ngày khác để xem lịch trình.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4" role="dialog" aria-modal="true" aria-labelledby="doctor-block-dialog-title">
          <div className="w-full max-w-lg rounded-card bg-surface p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="doctor-block-dialog-title" className="text-h3 font-bold text-ink-900">Chặn thời gian nhận bệnh nhân</h3>
                <p className="mt-1 text-body text-ink-500">Khoảng này sẽ không còn được đề xuất hoặc giữ chỗ cho bệnh nhân.</p>
              </div>
              <button type="button" aria-label="Đóng" onClick={() => setDialogOpen(false)} className="rounded-full p-1 text-ink-500 hover:bg-bg-muted">
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-body font-semibold text-ink-700">
                Ngày khóa <span className="text-danger">*</span>
                <input type="date" min={today} value={blockDate} onChange={(event) => setBlockDate(event.target.value)} className="mt-2 w-full rounded-xl border border-line px-3 py-2 font-normal outline-none focus:border-primary-500" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-body font-semibold text-ink-700">
                  Từ giờ <span className="text-danger">*</span>
                  <input type="time" min="08:00" max="17:30" step="1800" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="mt-2 w-full rounded-xl border border-line px-3 py-2 font-normal outline-none focus:border-primary-500" />
                </label>
                <label className="block text-body font-semibold text-ink-700">
                  Đến giờ <span className="text-danger">*</span>
                  <input type="time" min="08:30" max="18:00" step="1800" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="mt-2 w-full rounded-xl border border-line px-3 py-2 font-normal outline-none focus:border-primary-500" />
                </label>
              </div>
              <label className="block text-body font-semibold text-ink-700">
                Lý do <span className="text-danger">*</span>
                <textarea autoFocus rows={4} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ví dụ: Hội chẩn, họp chuyên môn hoặc nghỉ đột xuất..." className="mt-2 w-full rounded-xl border border-line px-3 py-2 font-normal outline-none focus:border-primary-500" />
                <span className="mt-1 block text-right text-caption font-normal text-ink-500">{reason.length}/500</span>
              </label>
            </div>

            {formError && <p role="alert" className="mt-3 text-body text-danger">{formError}</p>}
            <div className="mt-6 flex justify-end gap-3 border-t border-line pt-4">
              <Button variant="outline" disabled={saving} onClick={() => setDialogOpen(false)}>Hủy</Button>
              <Button disabled={saving || !reason.trim()} onClick={() => void submitBlock()}>
                {saving ? "Đang khóa..." : "Xác nhận khóa"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4" role="dialog" aria-modal="true" aria-labelledby="doctor-unblock-dialog-title">
          <div className="w-full max-w-md rounded-card bg-surface p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="doctor-unblock-dialog-title" className="text-h3 font-bold text-ink-900">Bỏ chặn thời gian</h3>
                <p className="mt-1 text-body text-ink-500">Sau khi mở lại, khoảng này có thể được đề xuất cho bệnh nhân.</p>
              </div>
              <button type="button" aria-label="Đóng" disabled={unblocking} onClick={() => setSelectedBlock(null)} className="rounded-full p-1 text-ink-500 hover:bg-bg-muted disabled:opacity-50">
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 rounded-xl bg-danger-soft p-4 text-body text-ink-700">
              <p className="font-semibold text-ink-900">
                {minuteLabel(minuteOfDay(selectedBlock.startTime))}–{minuteLabel(minuteOfDay(selectedBlock.endTime))}
              </p>
              <p className="mt-1">{selectedBlock.blockedReason || "Không có lý do."}</p>
            </div>

            {unblockError && <p role="alert" className="mt-3 text-body text-danger">{unblockError}</p>}
            <div className="mt-6 flex justify-end gap-3 border-t border-line pt-4">
              <Button variant="outline" disabled={unblocking} onClick={() => setSelectedBlock(null)}>Giữ nguyên</Button>
              <Button disabled={unblocking} onClick={() => void submitUnblock()}>
                {unblocking ? "Đang mở lại..." : "Xác nhận bỏ chặn"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
