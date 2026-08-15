"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api/client";
import { login } from "@/lib/api/auth";
import { signInWithGoogle } from "@/lib/auth/googleAuth";
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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleGoogleLogin() {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      router.replace(homeForRole(result.profile.role));
    } catch (cause: any) {
      setError(cause?.message || "Đăng nhập với Google không thành công.");
    } finally {
      setIsGoogleLoading(false);
    }
  }

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await login({ email, password });
      if (result.profile.role === "ADMIN") {
        clearAuthSession();
        setError("Cổng quản trị chưa được triển khai. Vui lòng dùng tài khoản bệnh nhân, bác sĩ hoặc lễ tân.");
        return;
      }
      router.replace(homeForRole(result.profile.role));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Đăng nhập không thành công.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-card-lg border border-line bg-surface p-8 shadow-sm">
      <h2 className="text-h2 font-bold text-primary-900">Đăng nhập</h2>
      <p className="mt-1 text-body text-ink-700">
        Chào mừng bạn trở lại! Vui lòng đăng nhập để tiếp tục.
      </p>

      <form
        className="mt-6 space-y-4"
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
            placeholder="Email"
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

        <div className="text-right">
          <Link href="#" className="text-body font-semibold text-primary-700 hover:underline">
            Quên mật khẩu?
          </Link>
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
          icon={<ArrowRight size={18} />}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4 text-caption text-ink-500">
        <span className="h-px flex-1 bg-line" />
        Tài khoản mẫu đăng nhập nhanh
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => {
            setEmail("namnguyen3008@vmec.vn");
            setPassword("VmecHealthcare@2026!");
          }}
          className="flex flex-col items-center justify-center rounded-xl border border-line bg-surface p-2.5 text-center text-xs font-semibold text-ink-900 transition-colors hover:border-primary-500 hover:bg-primary-50"
        >
          <span className="text-base">👤</span>
          <span className="mt-1 text-primary-900">Bệnh nhân</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setEmail("doctor@vmec.vn");
            setPassword("VmecHealthcare@2026!");
          }}
          className="flex flex-col items-center justify-center rounded-xl border border-line bg-surface p-2.5 text-center text-xs font-semibold text-ink-900 transition-colors hover:border-primary-500 hover:bg-primary-50"
        >
          <span className="text-base">👨‍⚕️</span>
          <span className="mt-1 text-primary-900">Bác sĩ</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setEmail("staff@vmec.vn");
            setPassword("VmecHealthcare@2026!");
          }}
          className="flex flex-col items-center justify-center rounded-xl border border-line bg-surface p-2.5 text-center text-xs font-semibold text-ink-900 transition-colors hover:border-primary-500 hover:bg-primary-50"
        >
          <span className="text-base">👩‍💼</span>
          <span className="mt-1 text-primary-900">Lễ tân</span>
        </button>
      </div>

      <div className="my-6 flex items-center gap-4 text-caption text-ink-500">
        <span className="h-px flex-1 bg-line" />
        Hoặc
        <span className="h-px flex-1 bg-line" />
      </div>

      <button
        type="button"
        onClick={() => void handleGoogleLogin()}
        disabled={isGoogleLoading || isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-line py-3.5 text-body font-semibold text-ink-900 transition-colors hover:bg-bg-muted disabled:opacity-50"
      >
        <GoogleIcon />
        {isGoogleLoading ? "Đang kết nối Google..." : "Đăng nhập với Google"}
      </button>

      <p className="mt-4 text-center text-body text-ink-700">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="font-semibold text-primary-700 hover:underline">
          Tạo tài khoản
        </Link>
      </p>

      <p className="mt-2 flex items-center gap-1.5 text-caption text-ink-500">
        <CalendarClock size={14} className="shrink-0" />
        Mật khẩu mẫu chung: <code className="font-mono text-primary-700">VmecHealthcare@2026!</code>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.6H24v9h11.8c-.5 2.7-2.1 5-4.4 6.6v5.5h7.1c4.2-3.9 6.6-9.6 6.6-16.5z" />
      <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.8 28.3c-.4-1.3-.7-2.7-.7-4.3s.3-3 .7-4.3v-5.7H4.5C3 16.9 2.2 20.3 2.2 24s.8 7.1 2.3 10l7.3-5.7z" />
      <path fill="#EA4335" d="M24 10.7c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.2 29.9 2 24 2 15.4 2 8.1 7 4.5 14l7.3 5.7c1.7-5.2 6.5-9 12.2-9z" />
    </svg>
  );
}
