"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { register } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

const fields = [
  { name: "fullName", label: "Họ và tên", type: "text", icon: User },
  { name: "email", label: "Email", type: "email", icon: Mail },
  { name: "phone", label: "Số điện thoại", type: "tel", icon: Phone },
];

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await register({
        fullName: form.fullName,
        email: form.email,
        phoneNumber: form.phone,
        password: form.password,
      });
      if (result.requiresEmailConfirmation) {
        setConfirmationEmail(form.email.trim());
      } else {
        router.replace("/dashboard");
      }
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Không thể tạo tài khoản.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-card-lg border border-line bg-surface p-8 shadow-sm">
      <h2 className="text-h2 font-bold text-primary-900">Tạo tài khoản</h2>
      <p className="mt-1 text-body text-ink-700">
        Đăng ký để bắt đầu sử dụng MedAgent AI cho việc khám chữa bệnh.
      </p>

      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        {fields.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.name} className="relative">
              <Icon size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-500" />
              <input
                type={f.type}
                name={f.name}
                value={form[f.name as "fullName" | "email" | "phone"]}
                onChange={(event) =>
                  setForm((current) => ({ ...current, [f.name]: event.target.value }))
                }
                required={f.name !== "phone"}
                autoComplete={
                  f.name === "fullName" ? "name" : f.name === "email" ? "email" : "tel"
                }
                placeholder={f.label}
                className="w-full rounded-xl border border-line bg-surface py-3.5 pl-11 pr-4 text-body outline-none focus:border-primary-400"
              />
            </div>
          );
        })}

        <div className="relative">
          <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            required
            minLength={8}
            autoComplete="new-password"
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

        <label className="flex items-start gap-2 text-body text-ink-700">
          <input
            type="checkbox"
            className="mt-1"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            required
          />
          Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật dữ liệu y tế.
        </label>

        {error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-body text-danger">
            {error}
          </p>
        )}

        {confirmationEmail && (
          <p role="status" className="rounded-xl bg-primary-50 px-4 py-3 text-body text-primary-800">
            Đăng ký thành công. Vui lòng kiểm tra email {confirmationEmail} để xác nhận tài khoản,
            sau đó đăng nhập.
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          icon={<ArrowRight size={18} />}
          disabled={isSubmitting || !accepted}
        >
          {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4 text-caption text-ink-500">
        <span className="h-px flex-1 bg-line" />
        Hoặc
        <span className="h-px flex-1 bg-line" />
      </div>

      <button
        type="button"
        onClick={async () => {
          try {
            const { signInWithGoogle } = await import("@/lib/auth/googleAuth");
            await signInWithGoogle();
            router.replace("/dashboard");
          } catch (e: any) {
            setError(e?.message || "Đăng ký với Google thất bại.");
          }
        }}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-line py-3.5 text-body font-semibold text-ink-900 transition-colors hover:bg-bg-muted"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
          <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.6H24v9h11.8c-.5 2.7-2.1 5-4.4 6.6v5.5h7.1c4.2-3.9 6.6-9.6 6.6-16.5z" />
          <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41 15.4 46 24 46z" />
          <path fill="#FBBC05" d="M11.8 28.3c-.4-1.3-.7-2.7-.7-4.3s.3-3 .7-4.3v-5.7H4.5C3 16.9 2.2 20.3 2.2 24s.8 7.1 2.3 10l7.3-5.7z" />
          <path fill="#EA4335" d="M24 10.7c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.2 29.9 2 24 2 15.4 2 8.1 7 4.5 14l7.3 5.7c1.7-5.2 6.5-9 12.2-9z" />
        </svg>
        Đăng ký nhanh với Google
      </button>

      <p className="mt-4 text-center text-body text-ink-700">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-semibold text-primary-700 hover:underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
