"use client";

import { useState } from "react";
import { User, Stethoscope, UserCheck, ChevronDown, Sparkles } from "lucide-react";
import { saveAuthSession, getAuthSession } from "@/lib/auth/session";
import type { UserRole } from "@/lib/api/contracts";

export function RoleSwitcherMenu() {
  const [open, setOpen] = useState(false);
  const session = getAuthSession();
  const currentRole: UserRole = session?.role || "PATIENT";

  const switchRole = (targetRole: UserRole) => {
    setOpen(false);

    if (targetRole === "DOCTOR") {
      saveAuthSession({
        token: { accessToken: `demo_doctor_${Date.now()}`, refreshToken: `demo_doctor_${Date.now()}`, expiresIn: 86400, tokenType: "Bearer" },
        profile: {
          id: "demo_user_doctor",
          role: "DOCTOR",
          fullName: "BS.CKII Nguyễn Quốc Bảo (Hội đồng Y khoa)",
          phoneNumber: "0901234567",
          avatarUrl: null,
          dateOfBirth: "1980-05-15",
          gender: "MALE",
          address: "Bệnh viện Đa khoa Quốc tế VMEC",
          status: "ACTIVE",
          isVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      window.location.href = "/doctor";
      return;
    }

    if (targetRole === "RECEPTIONIST") {
      saveAuthSession({
        token: { accessToken: `demo_staff_${Date.now()}`, refreshToken: `demo_staff_${Date.now()}`, expiresIn: 86400, tokenType: "Bearer" },
        profile: {
          id: "demo_user_receptionist",
          role: "RECEPTIONIST",
          fullName: "Lê Thị Thu Thảo (Điều phối Lễ tân)",
          phoneNumber: "0901234568",
          avatarUrl: null,
          dateOfBirth: "1994-08-20",
          gender: "FEMALE",
          address: "Quầy Tiếp đón & Phê duyệt VMEC",
          status: "ACTIVE",
          isVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      window.location.href = "/approvals";
      return;
    }

    // Default to PATIENT
    saveAuthSession({
      token: { accessToken: `demo_patient_${Date.now()}`, refreshToken: `demo_patient_${Date.now()}`, expiresIn: 86400, tokenType: "Bearer" },
      profile: {
        id: "demo_user_patient",
        role: "PATIENT",
        fullName: "Nguyễn Văn An (Bệnh nhân)",
        phoneNumber: "0901234567",
        avatarUrl: null,
        dateOfBirth: "1990-01-01",
        gender: "MALE",
        address: "Hà Nội, Việt Nam",
        status: "ACTIVE",
        isVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    window.location.href = "/dashboard";
  };

  const currentLabel =
    currentRole === "DOCTOR" ? "Bác sĩ" : currentRole === "RECEPTIONIST" ? "Lễ tân" : "Bệnh nhân";

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-xl border border-teal-300 bg-teal-50/70 px-3 py-1.5 text-xs font-bold text-teal-950 shadow-2xs hover:bg-teal-100 transition"
        title="Chuyển đổi vai trò trải nghiệm nhanh"
      >
        <Sparkles size={14} className="text-teal-700" />
        <span>Vai trò: <strong className="text-teal-900">{currentLabel}</strong></span>
        <ChevronDown size={14} className="text-teal-700" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-60 origin-top-right rounded-xl border border-line bg-surface p-2 shadow-lg">
            <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-500">
              Chuyển nhanh phân hệ:
            </p>
            <button
              onClick={() => switchRole("PATIENT")}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                currentRole === "PATIENT" ? "bg-teal-100 text-teal-950 font-bold" : "text-ink-800 hover:bg-bg-muted"
              }`}
            >
              <User size={16} className="text-teal-700" />
              <div className="text-left">
                <p>👤 Bệnh nhân</p>
                <p className="text-[10px] text-ink-500">Tư vấn AI &amp; Đặt khám</p>
              </div>
            </button>

            <button
              onClick={() => switchRole("DOCTOR")}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition mt-1 ${
                currentRole === "DOCTOR" ? "bg-teal-100 text-teal-950 font-bold" : "text-ink-800 hover:bg-bg-muted"
              }`}
            >
              <Stethoscope size={16} className="text-teal-700" />
              <div className="text-left">
                <p className="font-semibold">👨‍⚕️ Bác sĩ</p>
                <p className="text-[10px] text-ink-500">Bàn khám &amp; Hồ sơ EMR</p>
              </div>
            </button>

            <button
              onClick={() => switchRole("RECEPTIONIST")}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition mt-1 ${
                currentRole === "RECEPTIONIST" ? "bg-teal-100 text-teal-950 font-bold" : "text-ink-800 hover:bg-bg-muted"
              }`}
            >
              <UserCheck size={16} className="text-teal-700" />
              <div className="text-left">
                <p className="font-semibold">👩‍💼 Lễ tân</p>
                <p className="text-[10px] text-ink-500">Phê duyệt &amp; Điều phối</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
