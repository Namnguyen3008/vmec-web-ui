"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Next.js global error caught:", error);
    const isChunkError =
      error?.name === "ChunkLoadError" ||
      error?.message?.includes("Loading chunk") ||
      error?.message?.includes("Failed to fetch dynamically imported module") ||
      error?.message?.includes("Cannot find module");

    if (isChunkError) {
      window.location.reload();
    }
  }, [error]);

  return (
    <html lang="vi">
      <body className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 py-12 text-center font-sans">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 mb-4">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Đã cập nhật hệ thống VMEC</h2>
          <p className="mt-2 text-sm text-gray-600">
            Hệ thống đã phát hành bản cập nhật mới. Vui lòng bấm Tải lại để nạp phiên bản mới nhất.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-800 px-4 py-3 font-semibold text-white hover:bg-teal-900 transition"
            >
              <RefreshCw size={18} /> Tải lại trang (F5)
            </button>
            <a
              href="/"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-100 transition"
            >
              <Home size={18} /> Về Trang chủ
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
