"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createAppointment } from "@/lib/api/appointments";
import type { Appointment, CheckoutContext, PatientSnapshot } from "@/lib/api/contracts";

export function BookingCheckout({
  context,
  sessionId,
  onCompleted,
  onCancel,
}: {
  context: CheckoutContext;
  sessionId: string;
  onCompleted: (appointment: Appointment) => void;
  onCancel: () => void;
}) {
  const [patient, setPatient] = useState<PatientSnapshot>(context.patient);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [updateProfile, setUpdateProfile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const date = new Intl.DateTimeFormat("vi-VN", { dateStyle: "full", timeStyle: "short" }).format(
    new Date(context.selection.slotStart),
  );

  async function submit() {
    if (!context.holdToken || !patient.fullName.trim() || !patient.phoneNumber.trim()) {
      setError("Vui lòng kiểm tra họ tên, số điện thoại và thời hạn giữ lịch.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      onCompleted(await createAppointment({
        slotId: context.selection.slotId,
        holdToken: context.holdToken,
        patientSnapshot: patient,
        updateProfile,
        bookingReason: reason || "Đã thu thập đủ triệu chứng qua MedAgent AI.",
        patientNotes: notes,
        chatSessionId: sessionId,
        doctorId: context.selection.doctorId,
        doctorName: context.selection.doctorName,
        specialtyId: context.selection.specialtyId,
        specialtyName: context.selection.specialtyName,
        facilityName: context.selection.facilityName,
        facilityAddress: context.selection.facilityAddress,
        room: context.selection.room,
        slotStart: context.selection.slotStart,
        slotEnd: context.selection.slotEnd,
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể gửi yêu cầu đặt lịch.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="ml-0 sm:ml-12 rounded-card border border-primary-400 bg-surface p-4 sm:p-5 shadow-xs" aria-label="Rà soát lịch khám">
      <h3 className="text-h2 font-bold text-ink-900">Rà soát trước khi gửi lễ tân</h3>
      <div className="mt-3 rounded-xl bg-bg-muted p-4 text-body text-ink-900">
        <p><strong>{context.selection.specialtyName}</strong> · {context.selection.doctorName}</p>
        <p>{date} · {context.selection.room}</p>
        <p>{context.selection.facilityName}</p>
        {context.selection.facilityAddress && <p className="text-ink-500">{context.selection.facilityAddress}</p>}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-body font-medium">Họ tên người khám
          <input className="mt-1 w-full rounded-xl border border-line px-3 py-2" value={patient.fullName}
            onChange={(event) => setPatient({ ...patient, fullName: event.target.value })} />
        </label>
        <label className="text-body font-medium">Số điện thoại
          <input className="mt-1 w-full rounded-xl border border-line px-3 py-2" value={patient.phoneNumber}
            onChange={(event) => setPatient({ ...patient, phoneNumber: event.target.value })} />
        </label>
        <label className="text-body font-medium">Ngày sinh
          <input type="date" className="mt-1 w-full rounded-xl border border-line px-3 py-2" value={patient.dateOfBirth || ""}
            onChange={(event) => setPatient({ ...patient, dateOfBirth: event.target.value || null })} />
        </label>
        <label className="text-body font-medium">Giới tính
          <select className="mt-1 w-full rounded-xl border border-line px-3 py-2" value={patient.gender}
            onChange={(event) => setPatient({ ...patient, gender: event.target.value as PatientSnapshot["gender"] })}>
            <option value="UNKNOWN">Chưa khai báo</option><option value="MALE">Nam</option>
            <option value="FEMALE">Nữ</option><option value="OTHER">Khác</option>
          </select>
        </label>
      </div>
      <label className="mt-3 block text-body font-medium">Lý do khám
        <textarea className="mt-1 w-full rounded-xl border border-line px-3 py-2" value={reason}
          onChange={(event) => setReason(event.target.value)} />
      </label>
      <label className="mt-3 block text-body font-medium">Ghi chú thêm
        <textarea className="mt-1 w-full rounded-xl border border-line px-3 py-2" value={notes}
          onChange={(event) => setNotes(event.target.value)} />
      </label>
      <label className="mt-3 flex items-center gap-2 text-body text-ink-700">
        <input type="checkbox" checked={updateProfile} onChange={(event) => setUpdateProfile(event.target.checked)} />
        Cập nhật thông tin này vào hồ sơ tài khoản
      </label>
      {error && <p role="alert" className="mt-3 text-body text-danger">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={submit} disabled={submitting}>{submitting ? "Đang gửi..." : "Xác nhận và gửi lễ tân"}</Button>
        <Button variant="outline" onClick={onCancel} disabled={submitting}>Chọn lịch khác</Button>
      </div>
    </section>
  );
}
