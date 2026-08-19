"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, MapPin, Stethoscope } from "lucide-react";
import { AppointmentQrCard } from "@/components/bookings/AppointmentQrCard";
import { MedicalDisclaimer } from "@/components/layout/MedicalDisclaimer";
import { Badge } from "@/components/ui/Badge";
import { getAppointment } from "@/lib/api/appointments";
import type { Appointment } from "@/lib/api/contracts";

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getAppointment(params.id)
      .then((item) => { if (!cancelled) setAppointment(item); })
      .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "Không thể tải lịch hẹn."); });
    return () => { cancelled = true; };
  }, [params.id]);

  return (
    <div>
      <MedicalDisclaimer text="Thông tin lịch khám và mã QR xác thực của bạn." />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <Link href="/bookings" className="inline-flex items-center gap-2 text-body font-semibold text-primary-700">
          <ArrowLeft size={18} /> Quay lại danh sách lịch hẹn
        </Link>
        {error && <p role="alert" className="mt-6 rounded-xl bg-danger-soft px-4 py-3 text-danger">{error}</p>}
        {!appointment && !error && <p className="mt-6 text-ink-700">Đang tải chi tiết lịch hẹn...</p>}
        {appointment && (
          <div className="mt-6 grid gap-6 md:grid-cols-[1fr_340px]">
            <section className="rounded-card border border-line bg-surface p-6 shadow-2xs">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-caption font-semibold uppercase tracking-wide text-primary-700">Mã hẹn</p>
                  <h1 className="mt-1 text-h1 font-bold text-ink-900">{appointment.appointmentCode}</h1>
                </div>
                <Badge tone={appointment.status === "CONFIRMED" ? "success" : "neutral"}>
                  {appointment.status === "CONFIRMED" ? "Đã xác nhận" : appointment.status}
                </Badge>
              </div>
              <dl className="mt-7 space-y-5 text-body text-ink-700">
                <div className="flex gap-3"><Stethoscope className="mt-0.5 shrink-0 text-primary-700" size={20} /><div><dt className="font-semibold text-ink-900">Bác sĩ và chuyên khoa</dt><dd>{appointment.doctorName || "Chưa cập nhật"} · {appointment.specialtyName || "Chưa cập nhật"}</dd></div></div>
                <div className="flex gap-3"><CalendarDays className="mt-0.5 shrink-0 text-primary-700" size={20} /><div><dt className="font-semibold text-ink-900">Thời gian</dt><dd>{appointment.slotStart ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "full", timeStyle: "short" }).format(new Date(appointment.slotStart)) : "Chưa cập nhật"}{appointment.room ? ` · Phòng ${appointment.room}` : ""}</dd></div></div>
                <div className="flex gap-3"><MapPin className="mt-0.5 shrink-0 text-primary-700" size={20} /><div><dt className="font-semibold text-ink-900">Cơ sở khám</dt><dd>{appointment.facilityName || "Chưa cập nhật"}</dd><dd className="text-caption text-ink-500">{appointment.facilityAddress}</dd></div></div>
              </dl>
            </section>
            <div>
              {appointment.status === "CONFIRMED" && appointment.qrAvailable ? (
                <AppointmentQrCard appointmentId={appointment.id} appointmentCode={appointment.appointmentCode} />
              ) : (
                <section className="rounded-card border border-line bg-surface p-5 text-body text-ink-700">
                  Mã QR sẽ xuất hiện sau khi lịch khám được xác nhận.
                </section>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
