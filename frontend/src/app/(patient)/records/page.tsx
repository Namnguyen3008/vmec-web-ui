"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getLocalAppointments } from "@/lib/api/appointments";
import type { DetailedAppointment } from "@/lib/mockData";
import {
  FileText,
  Calendar,
  Stethoscope,
  Activity,
  Heart,
  Pill,
  ClipboardList,
  MapPin,
  QrCode,
  CheckCircle2,
  Clock,
  ShieldCheck,
  User,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

export default function RecordsPage() {
  const [appointments, setAppointments] = useState<DetailedAppointment[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<DetailedAppointment | null>(null);

  const loadData = () => {
    const list = getLocalAppointments();
    setAppointments(list);
    if (list.length > 0 && !selectedRecord) {
      setSelectedRecord(list[0]);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener("focus", handleUpdate);
    window.addEventListener("p208:schedule-change", handleUpdate);
    window.addEventListener("vmec:appointments-change", handleUpdate);

    return () => {
      window.removeEventListener("focus", handleUpdate);
      window.removeEventListener("p208:schedule-change", handleUpdate);
      window.removeEventListener("vmec:appointments-change", handleUpdate);
    };
  }, []);

  const completedRecords = appointments.filter((a) => a.status === "COMPLETED");
  const activeRecords = appointments.filter((a) => a.status === "CONFIRMED" || a.status === "PENDING_RECEPTIONIST_APPROVAL");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-line shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-800 font-bold">
              <FileText size={24} />
            </div>
            <div>
              <h1 className="text-h2 font-bold text-ink-900">Sổ Khám Bệnh &amp; Hồ Sơ Sức Khỏe Điện Tử</h1>
              <p className="text-caption text-ink-600">
                Toàn bộ lịch sử khám, chẩn đoán bác sĩ, kết quả cận lâm sàng và đơn thuốc điều trị chuẩn VMEC
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/chat">
            <Button variant="primary" size="sm">
              <Stethoscope size={15} className="mr-1.5" /> Đặt hẹn khám mới qua AI
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: List of Visit Records */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-body-lg font-bold text-ink-900 flex items-center gap-2">
              <Calendar size={18} className="text-primary-700" /> Danh sách đợt khám ({appointments.length})
            </h2>
            <span className="text-caption text-ink-500 font-medium">Chọn để xem chi tiết</span>
          </div>

          <div className="space-y-3">
            {appointments.length === 0 ? (
              <div className="rounded-2xl border border-line bg-surface p-8 text-center text-ink-500">
                Chưa có hồ sơ khám bệnh nào.
              </div>
            ) : (
              appointments.map((apt) => {
                const isSelected = selectedRecord?.id === apt.id;
                const isCompleted = apt.status === "COMPLETED";
                const isPending = apt.status === "PENDING_RECEPTIONIST_APPROVAL";

                return (
                  <div
                    key={apt.id}
                    onClick={() => setSelectedRecord(apt)}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all bg-surface shadow-xs hover:shadow-md ${
                      isSelected
                        ? "border-teal-600 ring-2 ring-teal-500/20 bg-teal-50/20"
                        : "border-line hover:border-teal-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-body-lg font-bold text-ink-900">{apt.specialtyName}</h3>
                        </div>
                        <p className="text-caption text-ink-600 mt-0.5">
                          {apt.doctorName} · {apt.room}
                        </p>
                      </div>
                      <Badge tone={isCompleted ? "success" : isPending ? "warning" : "primary"}>
                        {isCompleted ? "Đã khám xong" : isPending ? "Chờ duyệt" : "Đã xác nhận"}
                      </Badge>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-line/60 flex items-center justify-between text-caption text-ink-500">
                      <span className="flex items-center gap-1 font-medium text-ink-700">
                        <Clock size={13} /> Mã: {apt.appointmentCode}
                      </span>
                      <span className="flex items-center gap-1 text-teal-700 font-semibold">
                        Chi tiết <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed EMR Record View */}
        <div className="lg:col-span-7">
          {selectedRecord ? (
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-6">
              {/* Record Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-h2 font-bold text-ink-900">{selectedRecord.specialtyName}</h2>
                    <Badge tone={selectedRecord.status === "COMPLETED" ? "success" : "primary"}>
                      {selectedRecord.status === "COMPLETED" ? "Hồ sơ hoàn tất" : "Đang xử lý"}
                    </Badge>
                  </div>
                  <p className="text-caption text-ink-500 mt-1">
                    Bác sĩ phụ trách: <strong className="text-ink-800">{selectedRecord.doctorName}</strong> · Phòng: {selectedRecord.room}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/bookings/${selectedRecord.id}/directions`}>
                    <Button variant="outline" size="sm">
                      <MapPin size={14} className="mr-1" /> Chỉ dẫn đường
                    </Button>
                  </Link>
                  <Link href={`/bookings/${selectedRecord.id}`}>
                    <Button variant="outline" size="sm">
                      <QrCode size={14} className="mr-1" /> Mã QR thẻ khám
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Patient Snapshot & Vital Signs */}
              <div className="rounded-xl border border-line bg-bg-soft/40 p-4 space-y-3">
                <h3 className="font-bold text-ink-900 flex items-center gap-2 text-body">
                  <Activity size={16} className="text-danger" /> Sinh hiệu &amp; Thông tin lâm sàng
                </h3>
                {selectedRecord.patientDetail?.vitalSigns && selectedRecord.patientDetail.vitalSigns.bloodPressure ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                    <div className="rounded-lg bg-surface border border-line p-2">
                      <span className="text-caption text-ink-500 block">Huyết áp</span>
                      <strong className="text-body font-bold text-ink-900">{selectedRecord.patientDetail.vitalSigns.bloodPressure} mmHg</strong>
                    </div>
                    <div className="rounded-lg bg-surface border border-line p-2">
                      <span className="text-caption text-ink-500 block">Nhịp tim</span>
                      <strong className="text-body font-bold text-ink-900">{selectedRecord.patientDetail.vitalSigns.heartRate} bpm</strong>
                    </div>
                    <div className="rounded-lg bg-surface border border-line p-2">
                      <span className="text-caption text-ink-500 block">Thân nhiệt</span>
                      <strong className="text-body font-bold text-ink-900">{selectedRecord.patientDetail.vitalSigns.temperature} °C</strong>
                    </div>
                    <div className="rounded-lg bg-surface border border-line p-2">
                      <span className="text-caption text-ink-500 block">SpO2</span>
                      <strong className="text-body font-bold text-ink-900">{selectedRecord.patientDetail.vitalSigns.spO2} %</strong>
                    </div>
                  </div>
                ) : (
                  <p className="text-caption text-ink-500 italic">Chưa đo chỉ số sinh hiệu (Sẽ được điều dưỡng / bác sĩ đo trực tiếp khi vào phòng khám).</p>
                )}
              </div>

              {/* AI Triage Rationale & Chief Complaint */}
              <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 space-y-2">
                <h3 className="font-bold text-teal-950 flex items-center gap-2 text-body">
                  <ShieldCheck size={16} className="text-teal-700" /> Tóm tắt Lâm sàng Ban đầu
                </h3>
                <p className="text-body text-ink-800">
                  <strong>Lý do khám:</strong> {selectedRecord.bookingReason}
                </p>
                {selectedRecord.patientDetail?.aiAssessment && (
                  <p className="text-caption text-teal-900">
                    <strong>Định hướng chuyên khoa:</strong> {selectedRecord.patientDetail.aiAssessment.reasoning}
                  </p>
                )}
              </div>

              {/* Doctor's Clinical Findings */}
              <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
                <h3 className="font-bold text-ink-900 flex items-center gap-2 text-body">
                  <Stethoscope size={16} className="text-primary-700" /> Kết luận Khám &amp; Lời dặn Bác sĩ
                </h3>
                <div className="rounded-lg bg-bg-soft p-3.5 text-body text-ink-800">
                  {selectedRecord.patientDetail?.clinicalNote || "Bác sĩ chưa nhập kết luận lâm sàng (đang trong quá trình thăm khám)."}
                </div>
              </div>

              {/* Diagnostic Orders & Results */}
              {selectedRecord.patientDetail?.diagnosticOrders && selectedRecord.patientDetail.diagnosticOrders.length > 0 && (
                <div className="rounded-xl border border-line bg-surface p-4 space-y-3">
                  <h3 className="font-bold text-ink-900 flex items-center gap-2 text-body">
                    <ClipboardList size={16} className="text-primary-700" /> Chỉ định Cận lâm sàng &amp; Kết quả
                  </h3>
                  <div className="space-y-2">
                    {selectedRecord.patientDetail.diagnosticOrders.map((test, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-bg-soft rounded-lg border border-line text-body">
                        <div>
                          <strong className="text-ink-900 block">{test.testName}</strong>
                          <span className="text-caption text-ink-500">{test.department} · {test.resultSummary || "Đã có chỉ định"}</span>
                        </div>
                        <Badge tone={test.status === "COMPLETED" ? "success" : "warning"}>
                          {test.status === "COMPLETED" ? "Có kết quả" : "Đã chỉ định"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prescriptions / Đơn thuốc */}
              {selectedRecord.patientDetail?.prescriptions && selectedRecord.patientDetail.prescriptions.length > 0 && (
                <div className="rounded-xl border border-line bg-surface p-4 space-y-3">
                  <h3 className="font-bold text-ink-900 flex items-center gap-2 text-body">
                    <Pill size={16} className="text-teal-700" /> Đơn thuốc điều trị ngoại trú
                  </h3>
                  <div className="space-y-2">
                    {selectedRecord.patientDetail.prescriptions.map((med, i) => (
                      <div key={i} className="p-3 bg-teal-50/30 rounded-lg border border-teal-100 text-body flex items-center justify-between">
                        <div>
                          <strong className="text-teal-950">{med.medicineName}</strong>
                          <span className="text-caption text-teal-800 ml-2 font-semibold">({med.quantity})</span>
                          <p className="text-caption text-ink-600 mt-0.5">{med.dosage} · {med.usage}</p>
                        </div>
                        <Badge tone="success">Theo đơn</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-line bg-surface p-12 text-center text-ink-500">
              Chọn một hồ sơ bệnh án bên trái để xem chi tiết.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
