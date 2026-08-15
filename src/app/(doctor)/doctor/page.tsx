"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DoctorScheduleTimeline } from "@/components/doctor/DoctorScheduleTimeline";
import { listDoctorAppointments } from "@/lib/api/appointments";
import { createDoctorScheduleBlock, getDoctorScheduleBlocks, unblockDoctorScheduleBlock } from "@/lib/api/schedules";
import type { Appointment, ReceptionScheduleSlot } from "@/lib/api/contracts";
import { MOCK_DOCTOR_APPOINTMENTS, type DetailedAppointment } from "@/lib/mockData";
import {
  Activity,
  BrainCircuit,
  FileText,
  Heart,
  Stethoscope,
  User,
  X,
  CheckCircle2,
  Phone,
  MapPin,
  Calendar,
  ShieldAlert,
} from "lucide-react";

const REALTIME_REFRESH_MS = 15_000;

function clinicDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Bangkok",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function mergeAppointmentDetails(apiItems: Appointment[]): DetailedAppointment[] {
  return apiItems.map((apiItem, idx) => {
    const fallbackMock = MOCK_DOCTOR_APPOINTMENTS[idx % MOCK_DOCTOR_APPOINTMENTS.length];
    return {
      ...fallbackMock,
      ...apiItem,
      patientDetail: {
        ...fallbackMock.patientDetail,
        fullName: String(apiItem.patientSnapshot.full_name || fallbackMock.patientDetail.fullName),
        phoneNumber: String(apiItem.patientSnapshot.phone_number || fallbackMock.patientDetail.phoneNumber),
      },
    };
  });
}

export default function DoctorDashboardPage() {
  const [items, setItems] = useState<DetailedAppointment[]>(MOCK_DOCTOR_APPOINTMENTS);
  const [scheduleAppointments, setScheduleAppointments] = useState<Appointment[]>([]);
  const [doctorBlocks, setDoctorBlocks] = useState<ReceptionScheduleSlot[]>([]);
  const [timelineDate, setTimelineDate] = useState(clinicDateKey);
  const [error, setError] = useState<string | null>(null);
  const [blockError, setBlockError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<DetailedAppointment | null>(null);
  const [doctorNoteInput, setDoctorNoteInput] = useState<string>("");
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    let refreshing = false;

    const refresh = () => {
      if (refreshing || document.visibilityState === "hidden") return;
      refreshing = true;
      void Promise.allSettled([
        listDoctorAppointments(),
        getDoctorScheduleBlocks(timelineDate),
      ]).then(([appointmentsResult, blocksResult]) => {
        if (!active) return;
        refreshing = false;
        if (appointmentsResult.status === "fulfilled") {
          setScheduleAppointments(appointmentsResult.value);
          setItems(appointmentsResult.value.length ? mergeAppointmentDetails(appointmentsResult.value) : MOCK_DOCTOR_APPOINTMENTS);
          setError(null);
        } else {
          setError("Không thể đồng bộ lịch khám đã xác nhận. Hệ thống sẽ tự thử lại.");
        }
        if (blocksResult.status === "fulfilled") {
          setDoctorBlocks(blocksResult.value);
          setBlockError(null);
        } else {
          setBlockError("Không thể đồng bộ các khoảng thời gian đã khóa. Hệ thống sẽ tự thử lại.");
        }
      });
    };

    const initialRefresh = window.setTimeout(refresh, 0);
    const interval = window.setInterval(refresh, REALTIME_REFRESH_MS);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("p208:schedule-change", refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      active = false;
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("p208:schedule-change", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [timelineDate]);

  const openDetailModal = (item: DetailedAppointment) => {
    setSelectedPatient(item);
    setDoctorNoteInput(item.patientDetail.clinicalNote || "");
    setSaveSuccess(false);
  };

  const handleSaveNote = () => {
    if (!selectedPatient) return;
    const updatedItems = items.map((item) => {
      if (item.id === selectedPatient.id) {
        return {
          ...item,
          patientDetail: {
            ...item.patientDetail,
            clinicalNote: doctorNoteInput,
          },
        };
      }
      return item;
    });
    setItems(updatedItems);
    setSelectedPatient({
      ...selectedPatient,
      patientDetail: {
        ...selectedPatient.patientDetail,
        clinicalNote: doctorNoteInput,
      },
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold text-ink-900">Lịch khám đã xác nhận</h1>
          <p className="mt-1 text-body-lg text-ink-700">
            Danh sách bệnh nhân đã hoàn tất xác nhận lịch khám. Xem chi tiết hồ sơ bệnh án &amp; sinh hiệu bên dưới.
          </p>
        </div>
        <Badge tone="success">{items.length} bệnh nhân</Badge>
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl bg-danger-soft p-3 text-danger">{error}</p>}
      {blockError && <p role="alert" className="mt-4 rounded-xl bg-danger-soft p-3 text-danger">{blockError}</p>}

      <DoctorScheduleTimeline
        appointments={scheduleAppointments}
        blocks={doctorBlocks}
        selectedDate={timelineDate}
        onDateChange={setTimelineDate}
        onCreateBlock={async (input) => {
          await createDoctorScheduleBlock(input);
          const date = input.startTime.slice(0, 10);
          setDoctorBlocks(await getDoctorScheduleBlocks(date));
        }}
        onUnblockBlock={async (slotId, date) => {
          await unblockDoctorScheduleBlock(slotId);
          setDoctorBlocks(await getDoctorScheduleBlocks(date));
        }}
        onSelectAppointment={(appointment) => {
          const detail = items.find((item) => item.id === appointment.id);
          if (detail) openDetailModal(detail);
        }}
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {items.length === 0 && (
          <p className="rounded-card border border-line bg-surface p-6 text-ink-500">
            Chưa có lịch khám đã xác nhận.
          </p>
        )}
        {items.map((item) => {
          const detail = item.patientDetail;
          return (
            <article
              key={item.id}
              className="flex flex-col justify-between rounded-card border border-line bg-surface p-5 shadow-xs transition-shadow hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold text-lg">
                      {detail.fullName.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-body-lg font-bold text-ink-900">{detail.fullName}</h3>
                      <p className="text-caption text-ink-500">
                        Mã BN: <span className="font-semibold text-ink-700">{detail.medicalCode}</span> · {detail.age} tuổi ({detail.gender === "MALE" ? "Nam" : "Nữ"})
                      </p>
                    </div>
                  </div>
                  <Badge tone="success">Đã xác nhận</Badge>
                </div>

                {item.slotStart && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary-50/50 px-3 py-2 text-body font-semibold text-primary-900">
                    <Calendar size={16} className="text-primary-700 shrink-0" />
                    <span>
                      {new Intl.DateTimeFormat("vi-VN", { dateStyle: "full", timeStyle: "short" }).format(new Date(item.slotStart))}
                    </span>
                  </div>
                )}

                <div className="mt-3 text-body text-ink-700">
                  <span className="font-semibold">{item.specialtyName}</span> · {item.room}
                </div>

                {item.bookingReason && (
                  <div className="mt-3 rounded-xl bg-bg-muted p-3 text-body text-ink-800">
                    <strong className="text-ink-900">Lý do khám:</strong> {item.bookingReason}
                  </div>
                )}

                {/* Quick preview of Vital Signs */}
                {detail.vitalSigns && (
                  <div className="mt-3 flex flex-wrap gap-2 text-caption">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-surface border border-line px-2.5 py-1 text-ink-700">
                      <Heart size={13} className="text-danger shrink-0" /> HA: <strong className="text-ink-900">{detail.vitalSigns.bloodPressure}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-surface border border-line px-2.5 py-1 text-ink-700">
                      <Activity size={13} className="text-primary-600 shrink-0" /> Tim: <strong className="text-ink-900">{detail.vitalSigns.heartRate} bpm</strong>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-surface border border-line px-2.5 py-1 text-ink-700">
                      SpO2: <strong className="text-ink-900">{detail.vitalSigns.spO2}%</strong>
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-5 border-t border-line pt-4 flex items-center justify-between">
                <span className="text-caption text-ink-500 flex items-center gap-1">
                  <Phone size={13} /> {detail.phoneNumber}
                </span>
                <Button size="sm" variant="outline" onClick={() => openDetailModal(item)}>
                  <FileText size={15} className="mr-1" /> Xem hồ sơ chi tiết
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      {/* PATIENT DETAIL MODAL */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-card border border-line bg-surface shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold text-xl">
                  <Stethoscope size={22} />
                </div>
                <div>
                  <h2 className="text-h2 font-bold text-ink-900">Hồ sơ chi tiết bệnh nhân</h2>
                  <p className="text-caption text-ink-500">Mã cuộc hẹn: {selectedPatient.appointmentCode}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="rounded-full p-2 text-ink-500 hover:bg-bg-muted hover:text-ink-900"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Patient Basic Info Card */}
              <section className="rounded-xl border border-line bg-bg-soft/40 p-4">
                <h3 className="font-bold text-ink-900 flex items-center gap-2 text-body-lg">
                  <User size={18} className="text-primary-700" /> Thông tin hành chính
                </h3>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-body">
                  <div>
                    <span className="text-caption text-ink-500 block">Họ và tên</span>
                    <strong className="text-ink-900">{selectedPatient.patientDetail.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-caption text-ink-500 block">Mã bệnh nhân</span>
                    <strong className="text-ink-900">{selectedPatient.patientDetail.medicalCode}</strong>
                  </div>
                  <div>
                    <span className="text-caption text-ink-500 block">Tuổi / Giới tính</span>
                    <strong className="text-ink-900">
                      {selectedPatient.patientDetail.age} tuổi ({selectedPatient.patientDetail.gender === "MALE" ? "Nam" : "Nữ"})
                    </strong>
                  </div>
                  <div>
                    <span className="text-caption text-ink-500 block">Số điện thoại</span>
                    <strong className="text-ink-900">{selectedPatient.patientDetail.phoneNumber}</strong>
                  </div>
                  <div>
                    <span className="text-caption text-ink-500 block">Nhóm máu</span>
                    <strong className="text-ink-900">{selectedPatient.patientDetail.bloodType || "Chưa ghi nhận"}</strong>
                  </div>
                  <div>
                    <span className="text-caption text-ink-500 block">Đối tượng đăng ký</span>
                    <strong className="text-ink-900">
                      {selectedPatient.patientDetail.patientSubject === "SELF" ? "Bản thân" : `Thân nhân (${selectedPatient.patientDetail.relationship || "N/A"})`}
                    </strong>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <span className="text-caption text-ink-500 block flex items-center gap-1">
                      <MapPin size={12} /> Địa chỉ liên hệ
                    </span>
                    <span className="text-ink-900">{selectedPatient.patientDetail.address || "Chưa cập nhật"}</span>
                  </div>
                </div>
              </section>

              {/* Vital Signs Grid */}
              {selectedPatient.patientDetail.vitalSigns && (
                <section>
                  <h3 className="font-bold text-ink-900 flex items-center gap-2 text-body-lg">
                    <Activity size={18} className="text-danger" /> Sinh hiệu lâm sàng ban đầu
                  </h3>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="rounded-xl border border-line bg-surface p-3 text-center">
                      <span className="text-caption text-ink-500 block">Huyết áp</span>
                      <strong className="text-body-lg text-ink-900">{selectedPatient.patientDetail.vitalSigns.bloodPressure}</strong>
                      <span className="text-caption text-ink-400 block">mmHg</span>
                    </div>
                    <div className="rounded-xl border border-line bg-surface p-3 text-center">
                      <span className="text-caption text-ink-500 block">Nhịp tim</span>
                      <strong className="text-body-lg text-ink-900">{selectedPatient.patientDetail.vitalSigns.heartRate}</strong>
                      <span className="text-caption text-ink-400 block">bpm</span>
                    </div>
                    <div className="rounded-xl border border-line bg-surface p-3 text-center">
                      <span className="text-caption text-ink-500 block">Thân nhiệt</span>
                      <strong className="text-body-lg text-ink-900">{selectedPatient.patientDetail.vitalSigns.temperature}</strong>
                      <span className="text-caption text-ink-400 block">°C</span>
                    </div>
                    <div className="rounded-xl border border-line bg-surface p-3 text-center">
                      <span className="text-caption text-ink-500 block">SpO2</span>
                      <strong className="text-body-lg text-ink-900">{selectedPatient.patientDetail.vitalSigns.spO2}</strong>
                      <span className="text-caption text-ink-400 block">%</span>
                    </div>
                    <div className="rounded-xl border border-line bg-surface p-3 text-center">
                      <span className="text-caption text-ink-500 block">Cân nặng</span>
                      <strong className="text-body-lg text-ink-900">{selectedPatient.patientDetail.vitalSigns.weight}</strong>
                      <span className="text-caption text-ink-400 block">kg</span>
                    </div>
                  </div>
                </section>
              )}

              {/* Medical History & Allergies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <section className="rounded-xl border border-line bg-surface p-4">
                  <h3 className="font-bold text-ink-900 flex items-center gap-2 text-body">
                    <ShieldAlert size={16} className="text-warning" /> Tiền sử dị ứng
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedPatient.patientDetail.allergies?.map((allergy, i) => (
                      <span key={i} className="rounded-lg bg-warning-soft px-2.5 py-1 text-caption font-semibold text-warning">
                        {allergy}
                      </span>
                    )) || <span className="text-caption text-ink-500">Không ghi nhận</span>}
                  </div>
                </section>

                <section className="rounded-xl border border-line bg-surface p-4">
                  <h3 className="font-bold text-ink-900 flex items-center gap-2 text-body">
                    <FileText size={16} className="text-primary-700" /> Bệnh lý nền
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedPatient.patientDetail.medicalHistory?.map((history, i) => (
                      <span key={i} className="rounded-lg bg-bg-muted px-2.5 py-1 text-caption text-ink-800">
                        {history}
                      </span>
                    )) || <span className="text-caption text-ink-500">Không ghi nhận</span>}
                  </div>
                </section>
              </div>

              {/* AI Assessment & Triage */}
              {selectedPatient.patientDetail.aiAssessment && (
                <section className="rounded-xl border border-primary-200 bg-primary-50/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-bold text-ink-900 flex items-center gap-2 text-body-lg">
                      <BrainCircuit size={18} className="text-primary-700" /> Đánh giá ban đầu từ AI &amp; Lễ tân
                    </h3>
                  </div>
                  <div className="mt-3 space-y-2 text-body text-ink-800">
                    <p>
                      <strong>Chẩn đoán sơ bộ AI:</strong> {selectedPatient.patientDetail.aiAssessment.preliminaryDiagnosis}
                    </p>
                    <p className="text-caption text-ink-700">
                      <strong>Lý giải AI:</strong> {selectedPatient.patientDetail.aiAssessment.reasoning}
                    </p>
                    {selectedPatient.patientDetail.receptionistNote && (
                      <p className="mt-2 rounded-lg bg-surface border border-line p-2.5 text-caption text-ink-700">
                        <strong>Ghi chú điều phối Lễ tân:</strong> {selectedPatient.patientDetail.receptionistNote}
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* Doctor Clinical Notes Form */}
              <section className="rounded-xl border border-line bg-surface p-4">
                <h3 className="font-bold text-ink-900 flex items-center gap-2 text-body-lg">
                  <Stethoscope size={18} className="text-primary-700" /> Ghi chú khám &amp; Chỉ định Bác sĩ
                </h3>
                <textarea
                  rows={4}
                  className="mt-3 w-full rounded-xl border border-line p-3 text-body text-ink-900 focus:border-primary-500 focus:outline-none"
                  placeholder="Nhập ghi chú lâm sàng, chỉ định xét nghiệm hoặc hướng điều trị cho bệnh nhân..."
                  value={doctorNoteInput}
                  onChange={(e) => setDoctorNoteInput(e.target.value)}
                />
                <div className="mt-3 flex items-center justify-between">
                  {saveSuccess ? (
                    <span className="flex items-center gap-1.5 text-caption font-semibold text-success">
                      <CheckCircle2 size={16} /> Đã lưu ghi chú thành công!
                    </span>
                  ) : (
                    <span className="text-caption text-ink-500">Ghi chú lưu trực tiếp vào hồ sơ phiên khám mockup.</span>
                  )}
                  <Button size="sm" onClick={handleSaveNote}>
                    Lưu ghi chú
                  </Button>
                </div>
              </section>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-line bg-bg-soft/50 p-4 text-right">
              <Button variant="outline" onClick={() => setSelectedPatient(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
