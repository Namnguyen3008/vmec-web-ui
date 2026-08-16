"use client";

import { useEffect, useState, useMemo } from "react";
import { PatientFilterTabs, PatientTable, type PatientRow } from "@/components/staff/PatientTable";
import { PatientDetailPanel, type PatientDetail } from "@/components/staff/PatientDetailPanel";
import { getLocalAppointments } from "@/lib/api/appointments";
import type { DetailedAppointment } from "@/lib/mockData";

export function PatientManagementView() {
  const [appointments, setAppointments] = useState<DetailedAppointment[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("Tất cả");

  const loadData = () => {
    const list = getLocalAppointments();
    setAppointments(list);
    if (list.length > 0 && !selectedId) {
      setSelectedId(list[0].id);
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

  const rows: PatientRow[] = useMemo(() => {
    return appointments.map((apt) => {
      const isEmergency = apt.patientDetail.aiAssessment?.urgencyLevel === "EMERGENCY";
      const isCompleted = apt.status === "COMPLETED";
      const isConfirmed = apt.status === "CONFIRMED";

      let statusLabel = "Chờ duyệt";
      let tone: "neutral" | "warning" | "success" | "danger" = "warning";

      if (isEmergency) {
        statusLabel = "Cấp cứu";
        tone = "danger";
      } else if (isCompleted) {
        statusLabel = "Đã khám";
        tone = "success";
      } else if (isConfirmed) {
        statusLabel = "Đang khám";
        tone = "neutral";
      }

      return {
        id: apt.id,
        initial: apt.patientDetail.fullName.charAt(0),
        name: apt.patientDetail.fullName,
        code: apt.patientDetail.medicalCode || `#APT-${apt.id.slice(-4)}`,
        phone: apt.patientDetail.phoneNumber,
        reason: apt.bookingReason || "Tư vấn triệu chứng lâm sàng",
        department: `${apt.specialtyName} · ${apt.room || "P.Khám"}`,
        status: { label: statusLabel, tone },
        emergency: isEmergency,
      };
    });
  }, [appointments]);

  const selectedAppointment = appointments.find((a) => a.id === selectedId) || appointments[0];

  const detail: PatientDetail | undefined = useMemo(() => {
    if (!selectedAppointment) return undefined;
    const detail = selectedAppointment.patientDetail;
    const genderText = detail.gender === "MALE" ? "Nam" : detail.gender === "FEMALE" ? "Nữ" : "Khác";

    return {
      name: detail.fullName,
      meta: `${genderText}, ${detail.age || 40} Tuổi • ${detail.medicalCode}`,
      phone: detail.phoneNumber,
      aiSummary: detail.aiAssessment?.reasoning || selectedAppointment.bookingReason || "Đã thu thập triệu chứng lâm sàng qua MedAgent AI.",
      history: [
        {
          date: new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(new Date(selectedAppointment.createdAt)),
          label: selectedAppointment.specialtyName || "Khám chuyên khoa",
          note: detail.clinicalNote || "Đang tiếp nhận thăm khám lâm sàng",
        },
      ],
    };
  }, [selectedAppointment]);

  return (
    <>
      <PatientFilterTabs active={activeFilter} />

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px]">
        <PatientTable
          rows={rows}
          selectedId={selectedId || rows[0]?.id || ""}
          onSelect={setSelectedId}
        />
        {detail ? (
          <PatientDetailPanel patient={detail} />
        ) : (
          <div className="rounded-card border border-line bg-surface p-6 text-center text-ink-500">
            Chưa có thông tin chi tiết bệnh nhân.
          </div>
        )}
      </div>
    </>
  );
}
