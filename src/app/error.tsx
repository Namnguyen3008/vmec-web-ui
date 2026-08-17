"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Next.js runtime error caught:", error);
    // Tự động reload nếu gặp lỗi ChunkLoadError do phiên bản mới được deploy
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 py-12 text-center">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 mb-4">
          <AlertTriangle size={28} />
        </div>
        <h2 className="text-h2 font-bold text-ink-900">Đã cập nhật hệ thống</h2>
        <p className="mt-2 text-body text-ink-700">
          Máy chủ đã phát hành phiên bản mới. Vui lòng bấm Tải lại để đồng bộ giao diện và dữ liệu mới nhất.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 py-3 font-semibold text-white hover:bg-primary-800 transition shadow-xs"
          >
            <RefreshCw size={18} /> Tải lại trang (F5)
          </button>
          <a
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 font-semibold text-ink-700 hover:bg-bg-muted transition"
          >
            <Home size={18} /> Về Trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}
