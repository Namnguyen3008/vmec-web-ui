"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MedicalDisclaimer } from "@/components/layout/MedicalDisclaimer";
import { Badge } from "@/components/ui/Badge";
import { acceptAlternative, changeAppointment, declineAlternative, listMyAppointments } from "@/lib/api/appointments";
import { getRecommendations } from "@/lib/api/catalog";
import { holdSlot } from "@/lib/api/schedules";
import { Button } from "@/components/ui/Button";
import type { Appointment, AppointmentStatus, CheckoutSelection } from "@/lib/api/contracts";

const statusLabels: Record<AppointmentStatus, string> = {
  DRAFT: "Bản nháp",
  PENDING_RECEPTIONIST_APPROVAL: "Chờ lễ tân duyệt",
  PENDING_PATIENT_CONFIRMATION: "Chờ bệnh nhân xác nhận",
  CONFIRMED: "Đã xác nhận",
  REJECTED: "Bị từ chối",
  CANCELLED: "Đã hủy",
  COMPLETED: "Đã hoàn thành",
  NO_SHOW: "Không đến khám",
  EXPIRED: "Đã hết hạn",
};

function statusTone(status: AppointmentStatus): "warning" | "success" | "danger" | "neutral" {
  if (status.startsWith("PENDING")) return "warning";
  if (status === "CONFIRMED" || status === "COMPLETED") return "success";
  if (["REJECTED", "CANCELLED", "EXPIRED", "NO_SHOW"].includes(status)) return "danger";
  return "neutral";
}

export default function BookingsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<Record<string, CheckoutSelection[]>>({});
  const [busyAppointmentId, setBusyAppointmentId] = useState<string | null>(null);

  useEffect(() => {
    void listMyAppointments()
      .then((data) => {
        setAppointments(data || []);
      })
      .catch((cause) => {
        setError(cause instanceof Error ? cause.message : "Không thể tải lịch hẹn.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function handleAlternative(id: string, accept: boolean) {
    setError(null);
    try {
      const updated = accept ? await acceptAlternative(id) : await declineAlternative(id);
      setAppointments((current) => current.map((item) => item.id === id ? updated : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể xử lý phương án.");
    }
  }

  async function loadAlternatives(appointment: Appointment) {
    if (!appointment.specialtyId) return;
    setBusyAppointmentId(appointment.id);
    setError(null);
    try {
      const choices = await getRecommendations(appointment.specialtyId);
      const availableChoices = choices.filter((choice) => choice.slotId !== appointment.scheduleId);
      setAlternatives((current) => ({
        ...current,
        [appointment.id]: availableChoices,
      }));
      if (availableChoices.length === 0) setError("Hiện chưa có lịch thay thế phù hợp.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải lịch thay thế.");
    } finally {
      setBusyAppointmentId(null);
    }
  }

  async function chooseAlternative(appointmentId: string, slotId: string) {
    setBusyAppointmentId(appointmentId);
    setError(null);
    try {
      const hold = await holdSlot(slotId);
      const updated = await changeAppointment(appointmentId, slotId, hold.holdToken);
      setAppointments((current) => current.map((item) => item.id === appointmentId ? updated : item));
      setAlternatives((current) => ({ ...current, [appointmentId]: [] }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể đổi lịch.");
    } finally {
      setBusyAppointmentId(null);
    }
  }

  return (
    <div>
      <MedicalDisclaimer text="Danh sách lịch khám đã đặt qua Trợ lý MedAgent AI." />

      <div className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="text-h1 font-bold text-ink-900">Lịch sử Đặt khám</h1>
        <p className="mt-1 text-body-lg text-ink-700">Theo dõi trạng thái các lịch hẹn của bạn.</p>

        {isLoading && <p className="mt-6 text-body text-ink-700">Đang tải lịch hẹn...</p>}
        {error && (
          <p role="alert" className="mt-6 rounded-xl bg-danger-soft px-4 py-3 text-body text-danger">
            {error}
          </p>
        )}
        {!isLoading && !error && appointments.length === 0 && (
          <p className="mt-6 rounded-card border border-line bg-surface p-6 text-ink-700">
            Bạn chưa có lịch hẹn nào.
          </p>
        )}

        <div className="mt-6 space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              role="link"
              tabIndex={0}
              onClick={() => router.push(`/bookings/${appointment.id}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") router.push(`/bookings/${appointment.id}`);
              }}
              className="flex cursor-pointer flex-wrap items-center justify-between gap-4 rounded-card border border-line bg-surface p-5 transition hover:border-primary-400 hover:shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <div>
                <p className="font-bold text-ink-900">
                  {appointment.appointmentCode || `Lịch hẹn ${appointment.id.slice(0, 8)}`}
                </p>
                <p className="text-body text-ink-700">
                  {appointment.specialtyName || "Chuyên khoa"} · {appointment.doctorName || "Bác sĩ"}
                </p>
                {appointment.slotStart && (
                  <p className="text-body text-ink-700">
                    {new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(appointment.slotStart))}
                    {appointment.room ? ` · ${appointment.room}` : ""}
                  </p>
                )}
                {appointment.facilityName && <p className="text-caption text-ink-500">{appointment.facilityName}</p>}
                <p className="mt-0.5 text-caption text-ink-500">
                  Tạo lúc {new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(appointment.createdAt))}
                </p>
              </div>
              <Badge tone={statusTone(appointment.status)}>
                {statusLabels[appointment.status] || appointment.status}
              </Badge>
              {appointment.status === "PENDING_PATIENT_CONFIRMATION" && (
                <div onClick={(event) => event.stopPropagation()} className="flex w-full flex-wrap gap-2 border-t border-line pt-3">
                  <Button size="sm" onClick={() => handleAlternative(appointment.id, true)}>Đồng ý phương án mới</Button>
                  <Button size="sm" variant="outline" onClick={() => handleAlternative(appointment.id, false)}>Từ chối</Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busyAppointmentId === appointment.id}
                    onClick={() => loadAlternatives(appointment)}
                  >
                    {busyAppointmentId === appointment.id ? "Đang tải..." : "Chọn lịch khác"}
                  </Button>
                </div>
              )}
              {(alternatives[appointment.id]?.length || 0) > 0 && (
                <div onClick={(event) => event.stopPropagation()} className="grid w-full gap-2 border-t border-line pt-3 sm:grid-cols-2">
                  {alternatives[appointment.id].map((choice) => (
                    <div key={choice.slotId} className="rounded-xl border border-line p-3 text-body text-ink-700">
                      <p className="font-semibold text-ink-900">{choice.doctorName}</p>
                      <p>{new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(choice.slotStart))}</p>
                      <p className="text-caption">{choice.facilityName} · {choice.room}</p>
                      <Button
                        className="mt-2"
                        size="sm"
                        variant="outline"
                        disabled={busyAppointmentId === appointment.id}
                        onClick={() => chooseAlternative(appointment.id, choice.slotId)}
                      >
                        Chọn phương án này
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
