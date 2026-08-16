"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bot,
  ClipboardList,
  History,
  Stethoscope,
  UserCog,
  Sparkles,
  Calendar,
  Clock,
  ChevronRight,
  MapPin,
  QrCode,
} from "lucide-react";
import { MedicalDisclaimer } from "@/components/layout/MedicalDisclaimer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useCurrentSession } from "@/lib/auth/useCurrentSession";
import { getLocalAppointments } from "@/lib/api/appointments";
import type { DetailedAppointment } from "@/lib/mockData";

const quickActions = [
  { icon: ClipboardList, label: "Hồ sơ Bệnh án", href: "/records" },
  { icon: History, label: "Lịch sử Đặt khám", href: "/bookings" },
  { icon: Stethoscope, label: "Tư vấn Khám AI", href: "/chat" },
  { icon: UserCog, label: "Tài khoản", href: "/profile" },
];

export default function PatientDashboardPage() {
  const session = useCurrentSession();
  const displayName = session?.fullName || "Nguyễn Nam";
  const [upcomingAppointment, setUpcomingAppointment] = useState<DetailedAppointment | null>(null);

  useEffect(() => {
    const list = getLocalAppointments();
    const active = list.find((a) => a.status === "CONFIRMED" || a.status === "PENDING_RECEPTIONIST_APPROVAL") || list[0] || null;
    setUpcomingAppointment(active);

    const handleUpdate = () => {
      const updated = getLocalAppointments();
      const nextActive = updated.find((a) => a.status === "CONFIRMED" || a.status === "PENDING_RECEPTIONIST_APPROVAL") || updated[0] || null;
      setUpcomingAppointment(nextActive);
    };

    window.addEventListener("focus", handleUpdate);
    window.addEventListener("p208:schedule-change", handleUpdate);
    window.addEventListener("vmec:appointments-change", handleUpdate);

    return () => {
      window.removeEventListener("focus", handleUpdate);
      window.removeEventListener("p208:schedule-change", handleUpdate);
      window.removeEventListener("vmec:appointments-change", handleUpdate);
    };
  }, []);

  return (
    <div>
      <MedicalDisclaimer text="Thông tin do AI gợi ý chỉ mang tính tham khảo, vui lòng gặp bác sĩ để được tư vấn chính xác." />

      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <h1 className="text-h1 font-bold text-ink-900">Xin chào, {displayName}</h1>
        <p className="mt-1 text-body-lg text-ink-700">
          Hôm nay MedAgent có thể giúp gì cho bạn?
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="flex flex-col justify-center rounded-card-lg bg-gradient-to-br from-primary-700 via-primary-800 to-teal-900 text-white p-8 shadow-sm">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-teal-200">
              <Bot size={24} />
            </span>
            <h2 className="mt-5 max-w-sm text-h2 font-bold text-white leading-tight">
              Tư vấn Chuyên khoa &amp; Đặt lịch khám với Trợ lý MedAgent
            </h2>
            <p className="mt-2 text-body text-teal-100 max-w-md">
              Hệ thống AI Triage chuẩn Y tế đối chiếu 17 chuyên khoa và hỗ trợ đặt hẹn phòng khám nhanh chóng.
            </p>
            <div className="mt-6">
              <Button href="/chat" variant="secondary" icon={<Sparkles size={16} />}>
                Bắt đầu Chat ngay
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex flex-col items-center justify-center gap-3 rounded-card border border-line bg-surface p-6 text-center hover:border-primary-400 hover:shadow-xs transition"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-800">
                    <Icon size={20} />
                  </span>
                  <span className="font-semibold text-ink-900">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Dynamic Upcoming Appointment Card */}
        <div className="mt-6 rounded-card border border-line bg-surface p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-h3 font-bold text-ink-900">
              <Calendar size={20} className="text-primary-700" /> Lịch hẹn gần nhất
            </h3>
            {upcomingAppointment && (
              <Badge tone={upcomingAppointment.status === "COMPLETED" ? "success" : upcomingAppointment.status === "CONFIRMED" ? "success" : "warning"}>
                {upcomingAppointment.status === "COMPLETED" ? "Đã hoàn thành" : upcomingAppointment.status === "CONFIRMED" ? "Đã xác nhận" : "Chờ Lễ tân duyệt"}
              </Badge>
            )}
          </div>

          {upcomingAppointment ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-800 font-bold text-xl">
                  {upcomingAppointment.doctorName ? upcomingAppointment.doctorName.charAt(upcomingAppointment.doctorName.lastIndexOf(" ") + 1) : "BS"}
                </div>
                <div>
                  <p className="font-bold text-ink-900 text-body-lg">{upcomingAppointment.doctorName || "Bác sĩ Chuyên khoa"}</p>
                  <p className="text-body text-ink-700">{upcomingAppointment.specialtyName} · {upcomingAppointment.room}</p>
                  <p className="mt-0.5 text-caption text-ink-500 flex items-center gap-1.5">
                    <Clock size={13} /> {upcomingAppointment.slotStart ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "full", timeStyle: "short" }).format(new Date(upcomingAppointment.slotStart)) : "Theo lịch hẹn"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button href={`/bookings/${upcomingAppointment.id}/directions`} variant="outline" size="sm">
                  <MapPin size={14} className="mr-1" /> Chỉ dẫn đường
                </Button>
                <Button href={`/bookings/${upcomingAppointment.id}`} variant="outline" size="sm">
                  <QrCode size={14} className="mr-1" /> Mã QR
                </Button>
                <Button href="/records" variant="primary" size="sm">
                  Hồ sơ bệnh án
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 border-t border-line pt-4 text-center py-6">
              <p className="text-ink-600">Bạn chưa có lịch hẹn khám nào.</p>
              <Button href="/chat" variant="outline" size="sm" className="mt-3">
                Đặt lịch khám ngay
              </Button>
            </div>
          )}
        </div>
      </div>

      <Link
        href="/chat"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary-700 text-white shadow-lg hover:bg-primary-900 transition-all hover:scale-105"
        aria-label="Mở trợ lý AI"
      >
        <Bot size={24} />
      </Link>
    </div>
  );
}
