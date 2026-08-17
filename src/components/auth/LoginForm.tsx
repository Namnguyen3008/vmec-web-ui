"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, CalendarClock, Loader2, Stethoscope, UserCheck, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api/client";
import { login } from "@/lib/api/auth";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { clearAuthSession } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/roles";

export function LoginForm({
  variant = "patient",
}: {
  variant?: "patient" | "staff";
}) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loggingRole, setLoggingRole] = useState<string | null>(null);

  async function performLogin(loginEmail: string, loginPass: string) {
    setError(null);
    const normalized = loginEmail.toLowerCase().trim();
    if (
      normalized.includes("doctor") ||
      normalized.includes("staff") ||
      normalized.includes("letan") ||
      normalized.includes("bacsi")
    ) {
      setError("🔒 Cổng truy cập Bác sĩ & Lễ tân hiện đang tạm khóa bảo trì. Vui lòng đăng nhập với vai trò Bệnh nhân.");
      setIsSubmitting(false);
      setLoggingRole(null);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login({ email: loginEmail, password: loginPass });
      if (result.profile.role === "ADMIN" || result.profile.role === "DOCTOR" || result.profile.role === "RECEPTIONIST") {
        clearAuthSession();
        setError("🔒 Cổng truy cập Bác sĩ & Lễ tân hiện đang tạm khóa bảo trì. Vui lòng sử dụng cổng Bệnh nhân.");
        setIsSubmitting(false);
        setLoggingRole(null);
        return;
      }
      // Điều hướng tuyệt đối để làm mới toàn bộ bộ nhớ và nạp chunk sạch sẽ
      window.location.href = homeForRole(result.profile.role);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Đăng nhập không thành công.");
      setIsSubmitting(false);
      setLoggingRole(null);
    }
  }

  async function handleSubmit() {
    await performLogin(email, password);
  }

  async function handleQuickLogin(targetRole: string, targetEmail: string, targetPass: string) {
    if (targetRole === "DOCTOR" || targetRole === "RECEPTIONIST") {
      setError("🔒 Phân hệ này hiện đang tạm thời khóa truy cập để bảo trì.");
      return;
    }
    setLoggingRole(targetRole);
    setEmail(targetEmail);
    setPassword(targetPass);
    await performLogin(targetEmail, targetPass);
  }

  return (
    <div className="w-full max-w-md rounded-card-lg border border-line bg-surface p-8 shadow-sm">
      <h2 className="text-h2 font-bold text-primary-900">Đăng nhập Hệ thống VMEC</h2>
      <p className="mt-1 text-body text-ink-700">
        Đăng nhập vào cổng dịch vụ y tế Bệnh viện Đa khoa Quốc tế.
      </p>

      {/* Quick 1-Click Role Login Buttons */}
      <div className="mt-5 rounded-2xl bg-teal-50/50 border border-teal-200 p-3.5">
        <p className="text-caption font-bold uppercase tracking-wider text-teal-950 mb-2.5 flex items-center justify-between">
          <span>⚡ Đăng nhập nhanh 1-Click:</span>
          <span className="text-[11px] font-normal text-teal-700">Tự động vào đúng phân hệ</span>
        </p>
        <div className="grid grid-cols-3 gap-2">
          {/* Bệnh nhân - Hoạt động bình thường */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleQuickLogin("PATIENT", "patient.demo@vmec.vn", "VmecHealthcare@2026!")}
            className="flex flex-col items-center justify-center rounded-xl border border-teal-300 bg-surface p-2.5 text-center text-xs font-semibold text-ink-900 transition hover:border-primary-500 hover:bg-primary-50 hover:shadow-xs active:scale-95 disabled:opacity-60"
          >
            {loggingRole === "PATIENT" ? (
              <Loader2 size={20} className="animate-spin text-teal-700 my-0.5" />
            ) : (
              <User size={20} className="text-teal-700 my-0.5" />
            )}
            <span className="mt-1 text-teal-950 font-bold">Bệnh nhân</span>
          </button>

          {/* Bác sĩ - Tạm khóa truy cập */}
          <div className="relative group">
            <button
              type="button"
              disabled={true}
              className="w-full flex flex-col items-center justify-center rounded-xl border border-slate-300 bg-slate-100/90 p-2.5 text-center text-xs font-semibold text-slate-400 cursor-not-allowed opacity-75"
              title="Phân hệ Bác sĩ tạm khóa truy cập"
            >
              <div className="relative">
                <Stethoscope size={20} className="text-slate-400 my-0.5" />
                <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-xs">
                  <Lock size={10} />
                </span>
              </div>
              <span className="mt-1 text-slate-600 font-bold flex items-center gap-1">
                Bác sĩ <Lock size={11} className="text-amber-600" />
              </span>
            </button>
          </div>

          {/* Lễ tân - Tạm khóa truy cập */}
          <div className="relative group">
            <button
              type="button"
              disabled={true}
              className="w-full flex flex-col items-center justify-center rounded-xl border border-slate-300 bg-slate-100/90 p-2.5 text-center text-xs font-semibold text-slate-400 cursor-not-allowed opacity-75"
              title="Phân hệ Lễ tân tạm khóa truy cập"
            >
              <div className="relative">
                <UserCheck size={20} className="text-slate-400 my-0.5" />
                <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-xs">
                  <Lock size={10} />
                </span>
              </div>
              <span className="mt-1 text-slate-600 font-bold flex items-center gap-1">
                Lễ tân <Lock size={11} className="text-amber-600" />
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="my-5 flex items-center gap-4 text-caption text-ink-500">
        <span className="h-px flex-1 bg-line" />
        hoặc nhập thông tin đăng nhập
        <span className="h-px flex-1 bg-line" />
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <div className="relative">
          <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            placeholder="Email (VD: doctor@vmec.vn, staff@vmec.vn...)"
            className="w-full rounded-xl border border-line bg-surface py-3.5 pl-11 pr-4 text-body outline-none focus:border-primary-400"
          />
        </div>

        <div className="relative">
          <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
            placeholder="Mật khẩu"
            className="w-full rounded-xl border border-line bg-surface py-3.5 pl-11 pr-11 text-body outline-none focus:border-primary-400"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-500"
            aria-label="Hiện/ẩn mật khẩu"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-body text-danger">
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          icon={isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Đang xử lý đăng nhập..." : "Đăng nhập"}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-4 text-caption text-ink-500">
        <span className="h-px flex-1 bg-line" />
        hoặc liên kết
        <span className="h-px flex-1 bg-line" />
      </div>

      <GoogleSignInButton
        text="signin_with"
        onError={(err) => setError(err.message)}
      />

      <p className="mt-4 text-center text-body text-ink-700">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="font-semibold text-primary-700 hover:underline">
          Tạo tài khoản
        </Link>
      </p>

      <p className="mt-2 flex items-center justify-center gap-1.5 text-caption text-ink-500 text-center">
        <CalendarClock size={14} className="shrink-0 text-teal-700" />
        Mật khẩu chung demo: <code className="font-mono font-semibold text-teal-900">VmecHealthcare@2026!</code>
      </p>
    </div>
  );
}
