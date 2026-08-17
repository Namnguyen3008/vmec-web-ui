"use client";

import { useState } from "react";
import { User, Stethoscope, UserCheck, ChevronDown, Sparkles, Lock } from "lucide-react";
import { saveAuthSession, getAuthSession } from "@/lib/auth/session";
import type { UserRole } from "@/lib/api/contracts";

export function RoleSwitcherMenu() {
  const [open, setOpen] = useState(false);
  const session = getAuthSession();
  const currentRole: UserRole = session?.role || "PATIENT";

  const switchRole = (targetRole: UserRole) => {
    setOpen(false);
    if (targetRole === "DOCTOR" || targetRole === "RECEPTIONIST") {
      alert("🔒 Phân hệ này hiện đang tạm thời khóa truy cập để nâng cấp hệ thống.");
      return;
    }

    // Default to PATIENT
    saveAuthSession({
      token: { accessToken: `demo_patient_${Date.now()}`, refreshToken: `demo_patient_${Date.now()}`, expiresIn: 86400, tokenType: "Bearer" },
      profile: {
        id: "demo_user_patient",
        role: "PATIENT",
        fullName: "Nguyễn Nam (Bệnh nhân)",
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
              Phân hệ người dùng:
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
              disabled={true}
              onClick={() => switchRole("DOCTOR")}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-slate-400 bg-slate-50/80 cursor-not-allowed opacity-75 mt-1"
              title="Phân hệ Bác sĩ tạm thời khóa"
            >
              <div className="flex items-center gap-2.5">
                <Stethoscope size={16} className="text-slate-400" />
                <div className="text-left">
                  <p className="text-slate-600 font-semibold">👨‍⚕️ Bác sĩ</p>
                  <p className="text-[10px] text-slate-400">Bàn khám &amp; Hồ sơ EMR</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                <Lock size={10} /> Khóa
              </span>
            </button>

            <button
              disabled={true}
              onClick={() => switchRole("RECEPTIONIST")}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-slate-400 bg-slate-50/80 cursor-not-allowed opacity-75 mt-1"
              title="Phân hệ Lễ tân tạm thời khóa"
            >
              <div className="flex items-center gap-2.5">
                <UserCheck size={16} className="text-slate-400" />
                <div className="text-left">
                  <p className="text-slate-600 font-semibold">👩‍💼 Lễ tân</p>
                  <p className="text-[10px] text-slate-400">Phê duyệt &amp; Điều phối</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                <Lock size={10} /> Khóa
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
