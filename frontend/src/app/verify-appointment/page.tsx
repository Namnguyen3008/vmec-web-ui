"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { verifyAppointmentQr } from "@/lib/api/appointments";
import type { Appointment } from "@/lib/api/contracts";

function VerificationContent() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [valid, setValid] = useState<boolean | null>(token ? null : false);
  const [message, setMessage] = useState(
    token ? "Đang xác thực mã QR..." : "Mã QR không chứa token xác thực.",
  );

  useEffect(() => {
    if (!token) {
      return;
    }
    let cancelled = false;
    void verifyAppointmentQr(token)
      .then((result) => {
        if (cancelled) return;
        setValid(result.valid);
        setAppointment(result.appointment);
        setMessage(result.valid ? "Lịch hẹn hợp lệ" : "Mã QR không hợp lệ hoặc đã bị thu hồi");
      })
      .catch((cause) => {
        if (cancelled) return;
        setValid(false);
        setMessage(cause instanceof Error ? cause.message : "Không thể xác thực mã QR.");
      });
    return () => { cancelled = true; };
  }, [token]);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-6 py-12">
      <section className="w-full rounded-card border border-line bg-surface p-7 text-center shadow-card">
        <ShieldCheck size={42} className="mx-auto text-primary-700" />
        <h1 className="mt-4 text-h2 font-bold text-ink-900">Xác thực lịch khám</h1>
        <div className="mt-6">
          {valid === null ? <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-700" /> : valid ? <CheckCircle2 size={48} className="mx-auto text-success" /> : <XCircle size={48} className="mx-auto text-danger" />}
          <p className="mt-3 font-semibold text-ink-900">{message}</p>
        </div>
        {valid && appointment && (
          <dl className="mt-6 space-y-3 rounded-xl bg-bg-muted p-4 text-left text-body">
            <div><dt className="text-caption text-ink-500">Mã hẹn</dt><dd className="font-bold text-ink-900">{appointment.appointmentCode}</dd></div>
            <div><dt className="text-caption text-ink-500">Bệnh nhân</dt><dd className="font-semibold text-ink-900">{String((appointment.patientSnapshot as Record<string, unknown>).fullName || (appointment.patientSnapshot as Record<string, unknown>).full_name || "Chưa cập nhật")}</dd></div>
            <div><dt className="text-caption text-ink-500">Thời gian</dt><dd className="text-ink-900">{appointment.slotStart ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(appointment.slotStart)) : "Chưa cập nhật"}</dd></div>
          </dl>
        )}
        <p className="mt-5 text-caption text-ink-500">Chỉ tài khoản nhân viên được phép thực hiện xác thực.</p>
      </section>
    </main>
  );
}

export default function VerifyAppointmentPage() {
  return <Suspense fallback={null}><VerificationContent /></Suspense>;
}
