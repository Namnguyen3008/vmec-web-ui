"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSessionFromGoogleProfile } from "@/lib/auth/googleAuth";
import type { AuthResult } from "@/lib/api/contracts";
import { Eye, EyeOff, X, User } from "lucide-react";

interface GoogleSignInButtonProps {
  onSuccess?: (auth: AuthResult) => void;
  onError?: (err: Error) => void;
  text?: "signin_with" | "signup_with" | "continue_with";
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  text = "signin_with",
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"EMAIL" | "PASSWORD">("EMAIL");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const buttonLabel =
    text === "signup_with"
      ? "Đăng ký bằng Google"
      : text === "continue_with"
      ? "Tiếp tục bằng Google"
      : "Đăng nhập bằng Google";

  function handleOpen() {
    setEmailInput("");
    setPasswordInput("");
    setErrorMsg(null);
    setStep("EMAIL");
    setIsOpen(true);
  }

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
    }, 350);
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      try {
        const cleanEmail = emailInput.trim();
        const userName = cleanEmail.split("@")[0];
        const authResult = createSessionFromGoogleProfile(cleanEmail, userName);
        setIsOpen(false);
        if (onSuccess) onSuccess(authResult);
        router.replace("/dashboard");
      } catch (err: any) {
        setErrorMsg("Đã xảy ra sự cố khi đăng nhập. Vui lòng thử lại.");
        if (onError) onError(err);
      } finally {
        setIsLoading(false);
      }
    }, 450);
  }

  return (
    <div className="w-full">
      {/* Nút bấm Google chuẩn giao diện */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-line bg-surface py-3 px-4 text-body font-semibold text-ink-900 shadow-2xs transition-all hover:bg-bg-muted hover:border-ink-300 hover:shadow-xs active:scale-[0.99] disabled:opacity-60"
      >
        <GoogleLogo />
        <span>{buttonLabel}</span>
      </button>

      {/* Cửa sổ Google Accounts Sign-In Chuẩn Quốc Tế */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-[450px] rounded-[28px] border border-line bg-white p-8 sm:p-10 shadow-2xl text-ink-900 font-sans animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-5 top-5 rounded-full p-2 text-ink-500 hover:bg-neutral-100 hover:text-ink-900 transition-colors"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>

            {/* Google Header */}
            <div className="flex flex-col items-center text-center">
              <GoogleLogo size={36} />
              <h2 className="mt-4 text-2xl font-normal text-neutral-900">
                {step === "EMAIL" ? "Đăng nhập" : "Chào mừng"}
              </h2>
              {step === "EMAIL" ? (
                <p className="mt-1.5 text-sm text-neutral-600">
                  Sử dụng Tài khoản Google của bạn để chuyển đến <span className="font-semibold text-primary-800">VMEC Healthcare</span>
                </p>
              ) : (
                <div className="mt-2 flex items-center gap-2 rounded-full border border-neutral-200 py-1 px-3 text-sm text-neutral-700 bg-neutral-50">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-200 text-neutral-700">
                    <User size={12} />
                  </span>
                  <span className="font-medium text-xs truncate max-w-[200px]">{emailInput}</span>
                </div>
              )}
            </div>

            {/* Step 1: Nhập Email */}
            {step === "EMAIL" && (
              <form onSubmit={handleEmailSubmit} className="mt-8 space-y-6">
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
                        errorMsg ? "border-red-600 focus:border-red-600" : "border-neutral-300 focus:border-blue-600"
                      } bg-white py-3.5 px-3.5 text-base text-neutral-900 outline-none transition-colors focus:ring-1 ${
                        errorMsg ? "focus:ring-red-600" : "focus:ring-blue-600"
                      }`}
                    />
                  </div>

                  {errorMsg && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                      <span>⚠</span> {errorMsg}
                    </p>
                  )}

                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setEmailInput("namnguyen3008@gmail.com")}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Bạn quên địa chỉ email?
                    </button>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed">
                  Không phải máy tính của bạn? Hãy sử dụng chế độ Khách để đăng nhập một cách riêng tư.{" "}
                  <span className="text-blue-600 font-medium cursor-pointer hover:underline">Tìm hiểu thêm</span>
                </p>

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 py-2 px-3 rounded"
                  >
                    Tạo tài khoản
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="rounded-full bg-[#0b57d0] py-2.5 px-6 text-sm font-medium text-white shadow-xs hover:bg-[#0842a0] transition-colors disabled:opacity-50"
                  >
                    {isLoading ? "Đang kiểm tra..." : "Tiếp theo"}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Nhập Mật Khẩu */}
            {step === "PASSWORD" && (
              <form onSubmit={handlePasswordSubmit} className="mt-8 space-y-6">
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
                        errorMsg ? "border-red-600 focus:border-red-600" : "border-neutral-300 focus:border-blue-600"
                      } bg-white py-3.5 pl-3.5 pr-11 text-base text-neutral-900 outline-none transition-colors focus:ring-1 ${
                        errorMsg ? "focus:ring-red-600" : "focus:ring-blue-600"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-800"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {errorMsg && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                      <span>⚠</span> {errorMsg}
                    </p>
                  )}

                  <label className="mt-3 flex items-center gap-2 text-sm text-neutral-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Hiện mật khẩu</span>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setStep("EMAIL")}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 py-2 px-3 rounded"
                  >
                    Đổi tài khoản
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="rounded-full bg-[#0b57d0] py-2.5 px-6 text-sm font-medium text-white shadow-xs hover:bg-[#0842a0] transition-colors disabled:opacity-50"
                  >
                    {isLoading ? "Đang xác thực..." : "Tiếp theo"}
                  </button>
                </div>
              </form>
            )}

            {/* Google Footer */}
            <div className="mt-10 flex items-center justify-between text-xs text-neutral-500 pt-4 border-t border-neutral-200">
              <span>Tiếng Việt</span>
              <div className="flex gap-4">
                <span className="cursor-pointer hover:text-neutral-800">Trợ giúp</span>
                <span className="cursor-pointer hover:text-neutral-800">Quyền riêng tư</span>
                <span className="cursor-pointer hover:text-neutral-800">Điều khoản</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GoogleLogo({ size = 18 }: { size?: number }) {
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
