"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { handleGoogleOAuthCallback } from "@/lib/auth/googleOAuthFlow";
import { ShieldCheck, AlertCircle } from "lucide-react";

export default function GoogleAuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function processAuth() {
      try {
        const hash = window.location.hash;
        if (!hash) {
          setError("Không tìm thấy mã xác thực từ Google.");
          return;
        }

        const authResult = await handleGoogleOAuthCallback(hash);
        if (authResult) {
          router.replace("/dashboard");
        } else {
          setError("Xác thực Google không thành công hoặc phiên đăng nhập đã hết hạn.");
        }
      } catch (err: any) {
        setError(err.message || "Lỗi xử lý xác thực từ Google.");
      }
    }

    void processAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f0f4f9] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white border border-[#e0e3e7] p-8 text-center shadow-lg">
        {!error ? (
          <div className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-700 animate-pulse">
              <ShieldCheck size={28} />
            </div>
            <h2 className="text-xl font-bold text-ink-900">Đang xác thực với Google...</h2>
            <p className="text-sm text-ink-500">
              Vui lòng chờ trong giây lát, hệ thống đang đồng bộ hồ sơ y tế an toàn.
            </p>
            <div className="mx-auto h-1.5 w-32 overflow-hidden rounded-full bg-neutral-100">
              <div className="h-full w-full animate-progress bg-primary-700 rounded-full" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertCircle size={28} />
            </div>
            <h2 className="text-xl font-bold text-red-600">Lỗi xác thực</h2>
            <p className="text-sm text-ink-700">{error}</p>
            <button
              type="button"
              onClick={() => router.replace("/login")}
              className="mt-4 rounded-xl bg-primary-700 py-2.5 px-6 text-sm font-semibold text-white hover:bg-primary-800"
            >
              Quay lại Đăng nhập
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
