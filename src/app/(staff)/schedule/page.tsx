"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarDays, LockKeyhole, RefreshCw, Stethoscope, TrendingUp, X } from "lucide-react";
import { StaffShell } from "@/components/layout/StaffShell";
import { ScheduleGrid } from "@/components/staff/ScheduleGrid";
import { Button } from "@/components/ui/Button";
import type { DoctorOption, ReceptionScheduleOverview, ReceptionScheduleSlot } from "@/lib/api/contracts";
import { ApiError } from "@/lib/api/client";
import { listDoctors } from "@/lib/api/catalog";
import { createScheduleBlock, getReceptionSchedule, unblockScheduleSlot } from "@/lib/api/schedules";
import { calculateVisibleScheduleSummary } from "@/lib/scheduleTimeline";

function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(new Date(`${value}T12:00:00+07:00`));
}

function slotLabel(slot: ReceptionScheduleSlot) {
  const formatter = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Bangkok",
  });
  return `${slot.doctorName} · ${formatter.format(new Date(slot.startTime))}–${formatter.format(new Date(slot.endTime))}`;
}

function defaultBlockTimes(selectedDate: string) {
  if (selectedDate !== localDateValue()) return { start: "08:00", end: "08:30" };
  const now = new Date();
  now.setMinutes(Math.ceil((now.getMinutes() + 1) / 30) * 30, 0, 0);
  if (now.getMinutes() === 60) now.setHours(now.getHours() + 1, 0, 0, 0);
  const start = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  now.setMinutes(now.getMinutes() + 30);
  const end = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return { start, end };
}

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(localDateValue);
  const [specialtyId, setSpecialtyId] = useState("");
  const [overview, setOverview] = useState<ReceptionScheduleOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<ReceptionScheduleSlot | null>(null);
  const [createBlockOpen, setCreateBlockOpen] = useState(false);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [blockDate, setBlockDate] = useState(localDateValue);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("08:30");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOverview(await getReceptionSchedule(selectedDate, specialtyId || undefined));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không thể tải lịch bác sĩ.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, specialtyId]);

  useEffect(() => {
    let active = true;
    getReceptionSchedule(selectedDate, specialtyId || undefined)
      .then((result) => {
        if (!active) return;
        setOverview(result);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(caught instanceof ApiError ? caught.message : "Không thể tải lịch bác sĩ.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedDate, specialtyId]);

  useEffect(() => {
    let active = true;
    listDoctors()
      .then((items) => {
        if (!active) return;
        setDoctors(items);
        setDoctorId((current) => current || items[0]?.id || "");
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof ApiError ? caught.message : "Không thể tải danh sách bác sĩ.");
      });
    return () => {
      active = false;
    };
  }, []);

  function openSlot(slot: ReceptionScheduleSlot) {
    setActiveSlot(slot);
    setNotice(null);
  }

  function openCreateBlock() {
    const defaults = defaultBlockTimes(selectedDate);
    setBlockDate(selectedDate);
    setStartTime(defaults.start);
    setEndTime(defaults.end);
    setReason("");
    setNotice(null);
    setCreateBlockOpen(true);
  }

  async function submitSlotChange() {
    if (!activeSlot) return;
    setSaving(true);
    setNotice(null);
    try {
      await unblockScheduleSlot(activeSlot.id);
      setActiveSlot(null);
      await loadSchedule();
    } catch (caught) {
      setNotice(caught instanceof ApiError ? caught.message : "Không thể cập nhật khung giờ.");
    } finally {
      setSaving(false);
    }
  }


  async function submitCreateBlock() {
    if (!blockDate || !doctorId || !startTime || !endTime || !reason.trim()) {
      setNotice("Vui lòng chọn ngày, bác sĩ, khung giờ và nhập lý do khóa.");
      return;
    }
    if (blockDate < localDateValue()) {
      setNotice("Không thể khóa lịch cho ngày đã qua.");
      return;
    }
    if (endTime <= startTime) {
      setNotice("Giờ kết thúc phải sau giờ bắt đầu.");
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      await createScheduleBlock({
        doctorId,
        startTime: `${blockDate}T${startTime}:00+07:00`,
        endTime: `${blockDate}T${endTime}:00+07:00`,
        reason: reason.trim(),
      });
      setCreateBlockOpen(false);
      if (blockDate === selectedDate) {
        await loadSchedule();
      } else {
        setSpecialtyId("");
        setLoading(true);
        setSelectedDate(blockDate);
      }
    } catch (caught) {
      setNotice(caught instanceof ApiError ? caught.message : "Không thể khóa khung giờ.");
    } finally {
      setSaving(false);
    }
  }

  const summary = useMemo(
    () => calculateVisibleScheduleSummary(overview?.items || []),
    [overview],
  );

  return (
    <StaffShell title="Điều phối Lâm sàng">
      <div className="px-4 py-6 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-h1 font-bold text-ink-900">Lịch trình Bác sĩ</h1>
            <p className="mt-1 text-body-lg text-ink-700">
              Theo dõi lịch khám thực tế; các khoảng không có lịch được hiểu là đang trống.
            </p>
          </div>
          <p className="capitalize text-body text-ink-500">{dateLabel(selectedDate)}</p>
        </div>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <label className="flex min-w-56 items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-body font-medium text-ink-700">
              <CalendarDays size={16} className="text-primary-700" />
              <span className="sr-only">Chọn ngày</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => {
                  setLoading(true);
                  setSelectedDate(event.target.value);
                }}
                className="w-full bg-transparent outline-none"
              />
            </label>
            <label className="flex min-w-56 items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-body font-medium text-ink-700">
              <Stethoscope size={16} className="text-primary-700" />
              <span className="sr-only">Lọc chuyên khoa</span>
              <select
                value={specialtyId}
                onChange={(event) => {
                  setLoading(true);
                  setSpecialtyId(event.target.value);
                }}
                className="w-full bg-transparent outline-none"
              >
                <option value="">Tất cả chuyên khoa</option>
                {overview?.specialties.map((specialty) => (
                  <option key={specialty.id} value={specialty.id}>{specialty.name}</option>
                ))}
              </select>
            </label>
          </div>
          <Button onClick={openCreateBlock}>
            <LockKeyhole size={16} /> Khóa khung giờ đột xuất
          </Button>
        </div>

        {error && (
          <div role="alert" className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-body text-danger">
            <span className="flex items-center gap-2"><AlertCircle size={17} /> {error}</span>
            <button type="button" onClick={() => void loadSchedule()} className="font-bold underline">Thử lại</button>
          </div>
        )}

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          {loading ? (
            <div className="flex min-h-80 items-center justify-center rounded-card border border-line bg-surface text-ink-500">
              <RefreshCw size={20} className="mr-2 animate-spin" /> Đang tải lịch bác sĩ...
            </div>
          ) : (
            <ScheduleGrid slots={overview?.items || []} onSelectSlot={openSlot} />
          )}

          <aside className="h-fit rounded-card border border-line bg-surface p-5">
            <p className="flex items-center gap-2 font-bold text-ink-900">
              <TrendingUp size={18} className="text-primary-700" /> Tổng quan ca trực
            </p>
            <p className="mt-4 text-body text-ink-700">Mức sử dụng khung giờ</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-soft">
                <div className="h-2 rounded-full bg-primary-700 transition-all" style={{ width: `${summary?.utilizationPercent || 0}%` }} />
              </div>
              <span className="font-bold text-ink-900">{summary?.utilizationPercent || 0}%</span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <SummaryItem value={summary.doctorCount} label="Bác sĩ có lịch" />
              <SummaryItem value={summary.bookedSlots} label="Lịch đã xác nhận" />
              <SummaryItem value={summary.heldSlots} label="Đang giữ chỗ" />
              <SummaryItem value={summary.blockedSlots} label="Đã khóa" />
            </div>
            <div className="mt-5 space-y-2 border-t border-line pt-4 text-caption text-ink-500">
              <Legend tone="bg-white border border-dashed border-line-strong" label="Trống – được suy ra, không lưu DB" />
              <Legend tone="bg-primary-100" label="Đã đặt" />
              <Legend tone="bg-amber-100" label="Đang được giữ" />
              <Legend tone="bg-danger-soft" label="Đã khóa – bấm để mở lại" />
            </div>
          </aside>
        </div>
      </div>

      {activeSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4" role="dialog" aria-modal="true" aria-labelledby="schedule-dialog-title">
          <div className="w-full max-w-lg rounded-card bg-surface p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="schedule-dialog-title" className="text-h3 font-bold text-ink-900">
                  Mở lại khung giờ
                </h2>
                <p className="mt-1 text-body text-ink-500">{slotLabel(activeSlot)}</p>
              </div>
              <button type="button" aria-label="Đóng" onClick={() => setActiveSlot(null)} className="rounded-full p-1 text-ink-500 hover:bg-bg-muted">
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 rounded-xl bg-bg-muted p-4 text-body text-ink-700">
              <p className="font-semibold">Lý do đang ghi nhận</p>
              <p className="mt-1">{activeSlot.blockedReason || "Không có lý do."}</p>
            </div>

            {notice && <p role="alert" className="mt-3 text-body text-danger">{notice}</p>}
            <div className="mt-6 flex justify-end gap-3 border-t border-line pt-4">
              <Button variant="outline" disabled={saving} onClick={() => setActiveSlot(null)}>Hủy</Button>
              <Button disabled={saving} onClick={() => void submitSlotChange()}>
                {saving ? "Đang cập nhật..." : "Mở lại khung giờ"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {createBlockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4" role="dialog" aria-modal="true" aria-labelledby="create-block-dialog-title">
          <div className="w-full max-w-lg rounded-card bg-surface p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="create-block-dialog-title" className="text-h3 font-bold text-ink-900">Khóa khung giờ đột xuất</h2>
                <p className="mt-1 text-body text-ink-500">Chọn ngày và khoảng thời gian bác sĩ không nhận lịch.</p>
              </div>
              <button type="button" aria-label="Đóng" onClick={() => setCreateBlockOpen(false)} className="rounded-full p-1 text-ink-500 hover:bg-bg-muted">
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-body font-semibold text-ink-700">
                Ngày khóa <span className="text-danger">*</span>
                <input
                  type="date"
                  min={localDateValue()}
                  value={blockDate}
                  onChange={(event) => {
                    const nextDate = event.target.value;
                    const defaults = defaultBlockTimes(nextDate);
                    setBlockDate(nextDate);
                    setStartTime(defaults.start);
                    setEndTime(defaults.end);
                  }}
                  className="mt-2 w-full rounded-xl border border-line px-3 py-2 font-normal outline-none focus:border-primary-500"
                />
                {blockDate && <span className="mt-1 block text-caption font-normal capitalize text-ink-500">{dateLabel(blockDate)}</span>}
              </label>
              <label className="block text-body font-semibold text-ink-700">
                Bác sĩ <span className="text-danger">*</span>
                <select value={doctorId} onChange={(event) => setDoctorId(event.target.value)} className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2 font-normal outline-none focus:border-primary-500">
                  <option value="">Chọn bác sĩ</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.fullName} · {doctor.specialtyName}{doctor.room ? ` · Phòng ${doctor.room}` : ""}
                    </option>
                  ))}
                </select>
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
                Lý do khóa <span className="text-danger">*</span>
                <textarea autoFocus rows={4} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ví dụ: Bác sĩ hội chẩn khẩn hoặc nghỉ đột xuất..." className="mt-2 w-full rounded-xl border border-line px-3 py-2 font-normal outline-none focus:border-primary-500" />
                <span className="mt-1 block text-right text-caption font-normal text-ink-500">{reason.length}/500</span>
              </label>
            </div>

            {notice && <p role="alert" className="mt-3 text-body text-danger">{notice}</p>}
            <div className="mt-6 flex justify-end gap-3 border-t border-line pt-4">
              <Button variant="outline" disabled={saving} onClick={() => setCreateBlockOpen(false)}>Hủy</Button>
              <Button disabled={saving || !blockDate || !doctorId || !reason.trim()} onClick={() => void submitCreateBlock()}>
                {saving ? "Đang khóa..." : "Xác nhận khóa"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </StaffShell>
  );
}

function SummaryItem({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-bg-muted p-4">
      <p className="text-h2 font-bold text-ink-900">{value}</p>
      <p className="text-caption text-ink-500">{label}</p>
    </div>
  );
}

function Legend({ tone, label }: { tone: string; label: string }) {
  return <p className="flex items-center gap-2"><span className={`h-3 w-3 rounded ${tone}`} /> {label}</p>;
}
