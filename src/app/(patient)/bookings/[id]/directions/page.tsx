"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MapPin, PhoneCall, Navigation, Footprints, ArrowLeft, Building2, Stethoscope, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getAppointment, getDetailedAppointmentById } from "@/lib/api/appointments";
import type { DetailedAppointment } from "@/lib/mockData";
import type { Appointment } from "@/lib/api/contracts";

function getDynamicSteps(room: string | null) {
  const roomStr = room || "Phòng khám Chuyên khoa";
  if (roomStr.includes("Tòa nhà A") || roomStr.includes("Tòa A")) {
    return [
      "Từ Cổng chính 123 Nguyễn Trãi, di chuyển vào Sảnh Trung Tâm Tòa Nhà A.",
      "Đi thang máy A1/A2 hoặc thang cuốn lên tầng tương ứng với số phòng.",
      `Tìm biển chỉ dẫn hành lang khu khám chuyên khoa.`,
      `${roomStr} nằm ở sảnh chờ có biển bảng điện tử hiển thị số thứ tự.`,
    ];
  }
  if (roomStr.includes("Tòa nhà B") || roomStr.includes("Tòa B")) {
    return [
      "Từ Sảnh A, đi qua Hành lang nối thông tầng sang Tòa Nhà B (Khu Khám Nội & Tiêu Hóa).",
      "Sử dụng Thang máy B1 lên tầng ghi trên phiếu khám.",
      "Xuất trình mã QR tại quầy tiếp đón phụ tầng để lấy số ưu tiên.",
      `${roomStr} nằm ngay đối diện khu vực lấy mẫu cận lâm sàng.`,
    ];
  }
  if (roomStr.includes("Tòa nhà C") || roomStr.includes("Tòa C")) {
    return [
      "Di chuyển theo đường nội bộ có mái che sang Tòa Nhà C (Khu Khám Chuyên Khoa Lẻ).",
      "Tiến vào sảnh Tòa C và theo dõi bảng chỉ dẫn các khoa Mắt, TMH, RHM, Da Liễu.",
      `${roomStr} có nhân viên điều phối trực tiếp hướng dẫn vào phòng khám.`,
    ];
  }
  return [
    "Di chuyển từ Cổng chính đến Sảnh Tiếp đón trung tâm.",
    "Đi thang máy lên tầng tương ứng theo chỉ dẫn của Lễ tân.",
    `Đến khu vực sảnh chờ phòng ${roomStr}.`,
    "Ngồi chờ màn hình điện tử gọi số thứ tự vào khám.",
  ];
}

export default function BookingDirectionsPage() {
  const params = useParams<{ id: string }>();
  const [appointment, setAppointment] = useState<DetailedAppointment | Appointment | null>(null);

  useEffect(() => {
    let active = true;
    if (!params?.id) return;

    void getDetailedAppointmentById(params.id).then((detailed) => {
      if (!active) return;
      if (detailed) {
        setAppointment(detailed);
      } else {
        void getAppointment(params.id).then((basic) => {
          if (active) setAppointment(basic);
        });
      }
    });

    return () => {
      active = false;
    };
  }, [params?.id]);

  const room = appointment?.room || "Phòng 101 - Tòa nhà A";
  const steps = getDynamicSteps(room);
  const patientName =
    ("patientDetail" in (appointment || {}) && (appointment as DetailedAppointment).patientDetail?.fullName) ||
    String(appointment?.patientSnapshot?.full_name || appointment?.patientSnapshot?.fullName || "Nguyễn Nam");
  const medicalCode =
    ("patientDetail" in (appointment || {}) && (appointment as DetailedAppointment).patientDetail?.medicalCode) ||
    appointment?.appointmentCode ||
    `#PT-${params?.id || "001"}`;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      {/* Back button */}
      <Link href="/records" className="inline-flex items-center gap-2 text-body font-semibold text-primary-700 hover:underline">
        <ArrowLeft size={18} /> Quay lại Sổ khám bệnh
      </Link>

      {/* Appointment Summary Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-800 font-bold text-lg">
            <Building2 size={22} />
          </div>
          <div>
            <p className="flex items-center gap-2 font-bold text-ink-900 text-body-lg">
              BN: {patientName}
              <span className="rounded-md bg-bg-soft px-2 py-0.5 text-caption font-semibold text-teal-800 border border-teal-200">
                {medicalCode}
              </span>
            </p>
            <p className="text-body text-ink-700 mt-0.5">
              {appointment?.specialtyName || "Khám chuyên khoa"} · Bác sĩ phụ trách: <strong>{appointment?.doctorName || "BS. Chuyên khoa"}</strong>
            </p>
          </div>
        </div>
        <Badge tone="success">Phòng khám đã xác nhận</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main Directions Panel */}
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-6">
          <h1 className="text-h2 font-bold text-ink-900">
            Chỉ dẫn Lộ trình Di chuyển trong Bệnh viện VMEC
          </h1>

          <div className="flex items-start gap-3 rounded-xl bg-teal-50/60 border border-teal-200 p-4">
            <MapPin size={22} className="mt-0.5 shrink-0 text-teal-700" />
            <div>
              <p className="font-bold text-teal-950">Điểm đến khám bệnh:</p>
              <p className="text-body text-teal-900 font-medium mt-0.5">
                {room} · {appointment?.specialtyName || "Khoa khám bệnh"}
              </p>
              <p className="text-caption text-teal-800 mt-0.5">
                Địa chỉ: Bệnh viện Đa khoa Quốc tế VMEC — 123 Nguyễn Trãi, Thanh Xuân, Hà Nội
              </p>
            </div>
          </div>

          {/* Interactive Hospital Floor Map Visualization */}
          <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden rounded-2xl border border-line bg-bg-soft shadow-inner">
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface px-8 py-5 shadow-lg border border-line">
              <span className="flex items-center gap-2 rounded-xl bg-primary-900 px-4 py-2 text-body font-bold text-white shadow-xs">
                <Navigation size={18} className="text-teal-300" /> {room}
              </span>
              <span className="text-caption text-ink-600 font-medium">Bản đồ Định vị Phòng khám Trong nhà VMEC Indoor Map</span>
            </div>
          </div>

          {/* Step-by-Step Guidance */}
          <div>
            <h2 className="flex items-center gap-2 text-h3 font-bold text-ink-900 mb-3">
              <Footprints size={20} className="text-primary-700" /> Các bước di chuyển chi tiết
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-line p-3.5 bg-bg-soft/40">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-caption font-bold text-primary-800">
                    {i + 1}
                  </span>
                  <p className="text-body text-ink-900">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Assistance Sidebar */}
        <aside className="space-y-4">
          <h3 className="text-h3 font-bold text-ink-900">Hỗ trợ Nhanh tại Viện</h3>

          <div className="rounded-xl border border-line bg-surface p-4 space-y-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-800 flex items-center justify-center">
                <PhoneCall size={20} />
              </div>
              <div>
                <p className="font-bold text-ink-900">Tổng đài Điều phối</p>
                <p className="text-caption text-ink-500">1900 6868 (Phím 1)</p>
              </div>
            </div>
            <p className="text-caption text-ink-700">Khi cần lễ tân hỗ trợ xe lăn hoặc dẫn đường trực tiếp.</p>
          </div>

          <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 space-y-2">
            <div className="flex items-center gap-2 text-teal-950 font-bold text-body">
              <CheckCircle2 size={16} className="text-teal-700" /> Lưu ý khi đến khám
            </div>
            <ul className="text-caption text-teal-900 space-y-1 list-disc list-inside">
              <li>Mang theo CCCD/VNeID và thẻ BHYT (nếu có).</li>
              <li>Có mặt trước giờ hẹn 10-15 phút để làm thủ tục tiếp đón.</li>
              <li>Nhịn ăn sáng nếu có chỉ định xét nghiệm máu hoặc nội soi dạ dày.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
