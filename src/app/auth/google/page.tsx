"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSessionFromGoogleProfile } from "@/lib/auth/googleAuth";
import { Eye, EyeOff, Shield, User, Globe, ChevronDown } from "lucide-react";

export default function GoogleAuthPage() {
  const router = useRouter();
  const [step, setStep] = useState<"EMAIL" | "PASSWORD">("EMAIL");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = emailInput.trim();
    if (!cleanEmail) {
      setErrorMsg("Hãy nhập email hoặc số điện thoại");
      return;
    }
    if (!cleanEmail.includes("@")) {
      setErrorMsg("Không tìm thấy Tài khoản Google của bạn");
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep("PASSWORD");
    }, 400);
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      try {
        const cleanEmail = emailInput.trim();
        const userName = cleanEmail.split("@")[0];
        createSessionFromGoogleProfile(cleanEmail, userName);
        router.replace("/dashboard");
      } catch {
        setErrorMsg("Đã xảy ra sự cố khi đăng nhập. Vui lòng thử lại.");
        setIsLoading(false);
      }
    }, 500);
  }

  return (
    <div className="min-h-screen bg-[#f0f4f9] flex flex-col justify-between p-4 sm:p-6 md:p-10 font-sans text-[#1f1f1f] antialiased">
      {/* Top spacer */}
      <div className="hidden sm:block" />

      {/* Main Centered Google Sign-In Card (GSI v3 Material You Layout) */}
      <div className="mx-auto w-full max-w-[1040px] rounded-[28px] bg-white border border-[#e0e3e7] p-8 sm:p-10 md:p-12 shadow-sm animate-in fade-in zoom-in-95 duration-200">
        {/* Google Bar Header */}
        <div className="flex items-center gap-2.5 pb-6">
          <GoogleLogo size={22} />
          <span className="text-sm font-medium text-[#444746]">Đăng nhập bằng Google</span>
        </div>

        {/* 2-Column Desktop Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-start pt-2">
          {/* Left Column: Brand & Title */}
          <div className="space-y-4">
            {/* App Icon Box */}
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0b57d0] text-white shadow-sm">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-normal text-[#1f1f1f] tracking-tight">
                {step === "EMAIL" ? "Đăng nhập" : "Chào mừng"}
              </h1>
              <p className="mt-2 text-base text-[#444746]">
                Tiếp tục tới <span className="font-semibold text-primary-800">VMEC Healthcare</span>
              </p>
            </div>

            {step === "PASSWORD" && (
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c4c7c5] py-1.5 px-3.5 text-sm text-[#1f1f1f] bg-[#f8fafd]">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#d3e3fd] text-[#041e49]">
                  <User size={13} />
                </span>
                <span className="font-medium">{emailInput}</span>
              </div>
            )}
          </div>

          {/* Right Column: Interaction Form */}
          <div>
            {step === "EMAIL" && (
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      autoFocus
                      value={emailInput}
                      onChange={(e) => {
                        setEmailInput(e.target.value);
                        setErrorMsg(null);
                      }}
                      placeholder="Email hoặc số điện thoại"
                      className={`w-full rounded-md border ${
                        errorMsg ? "border-[#b3261e] focus:border-[#b3261e]" : "border-[#747775] focus:border-[#0b57d0]"
                      } bg-white py-4 px-3.5 text-base text-[#1f1f1f] outline-none transition-colors focus:ring-2 ${
                        errorMsg ? "focus:ring-[#f9dedc]" : "focus:ring-[#d3e3fd]"
                      }`}
                    />
                  </div>

                  {errorMsg && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-[#b3261e]">
                      <span>⚠</span> {errorMsg}
                    </p>
                  )}

                  <div className="mt-2.5">
                    <button
                      type="button"
                      onClick={() => setEmailInput("namnguyen3008@gmail.com")}
                      className="text-sm font-medium text-[#0b57d0] hover:text-[#0842a0] hover:underline"
                    >
                      Bạn quên địa chỉ email?
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[#444746] leading-relaxed">
                  Trước khi sử dụng VMEC Healthcare, bạn có thể xem{" "}
                  <Link href="#" className="text-[#0b57d0] font-medium hover:underline">
                    Chính sách quyền riêng tư
                  </Link>{" "}
                  và{" "}
                  <Link href="#" className="text-[#0b57d0] font-medium hover:underline">
                    Điều khoản dịch vụ
                  </Link>{" "}
                  của ứng dụng này.
                </p>

                <div className="flex items-center justify-end gap-3 pt-6">
                  <Link
                    href="/register"
                    className="text-sm font-medium text-[#0b57d0] hover:text-[#0842a0] hover:bg-[#e8f0fe] py-2.5 px-4 rounded-full transition-colors"
                  >
                    Tạo tài khoản
                  </Link>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="rounded-full bg-[#0b57d0] py-2.5 px-7 text-sm font-medium text-white shadow-xs hover:bg-[#0842a0] transition-colors disabled:opacity-50"
                  >
                    {isLoading ? "Đang kiểm tra..." : "Tiếp theo"}
                  </button>
                </div>
              </form>
            )}

            {step === "PASSWORD" && (
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoFocus
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        setErrorMsg(null);
                      }}
                      placeholder="Nhập mật khẩu của bạn"
                      className={`w-full rounded-md border ${
                        errorMsg ? "border-[#b3261e] focus:border-[#b3261e]" : "border-[#747775] focus:border-[#0b57d0]"
                      } bg-white py-4 pl-3.5 pr-11 text-base text-[#1f1f1f] outline-none transition-colors focus:ring-2 ${
                        errorMsg ? "focus:ring-[#f9dedc]" : "focus:ring-[#d3e3fd]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#444746] hover:text-[#1f1f1f]"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  {errorMsg && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-[#b3261e]">
                      <span>⚠</span> {errorMsg}
                    </p>
                  )}

                  <label className="mt-3.5 flex items-center gap-2.5 text-sm text-[#1f1f1f] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      className="h-4 w-4 rounded border-[#747775] text-[#0b57d0] focus:ring-[#0b57d0]"
                    />
                    <span>Hiện mật khẩu</span>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-6">
                  <button
                    type="button"
                    onClick={() => setStep("EMAIL")}
                    className="text-sm font-medium text-[#0b57d0] hover:text-[#0842a0] hover:bg-[#e8f0fe] py-2 px-3 rounded-full transition-colors"
                  >
                    Đổi tài khoản
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="rounded-full bg-[#0b57d0] py-2.5 px-7 text-sm font-medium text-white shadow-xs hover:bg-[#0842a0] transition-colors disabled:opacity-50"
                  >
                    {isLoading ? "Đang xác thực..." : "Tiếp theo"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer bar matching Google style */}
      <div className="mx-auto w-full max-w-[1040px] flex flex-wrap items-center justify-between gap-4 text-xs text-[#444746] pt-4 px-2">
        <div className="flex items-center gap-1.5 cursor-pointer hover:text-[#1f1f1f]">
          <span>Tiếng Việt</span>
          <ChevronDown size={14} />
        </div>
        <div className="flex items-center gap-6">
          <Link href="#" className="hover:text-[#1f1f1f]">Trợ giúp</Link>
          <Link href="#" className="hover:text-[#1f1f1f]">Quyền riêng tư</Link>
          <Link href="#" className="hover:text-[#1f1f1f]">Điều khoản</Link>
        </div>
      </div>
    </div>
  );
}

function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#4285F4"
        d="M45.1 24.5c0-1.6-.1-3.1-.4-4.6H24v9h11.8c-.5 2.7-2.1 5-4.4 6.6v5.5h7.1c4.2-3.9 6.6-9.6 6.6-16.5z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.8 28.3c-.4-1.3-.7-2.7-.7-4.3s.3-3 .7-4.3v-5.7H4.5C3 16.9 2.2 20.3 2.2 24s.8 7.1 2.3 10l7.3-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.7c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.2 29.9 2 24 2 15.4 2 8.1 7 4.5 14l7.3 5.7c1.7-5.2 6.5-9 12.2-9z"
      />
    </svg>
  );
}
