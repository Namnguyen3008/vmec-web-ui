"use client";

import { useEffect, useState } from "react";
import { QrCode, RefreshCw } from "lucide-react";
import { getAppointmentQr } from "@/lib/api/appointments";

export function AppointmentQrCard({ appointmentId, appointmentCode }: {
  appointmentId: string;
  appointmentCode?: string | null;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setImageUrl((await getAppointmentQr(appointmentId)).imageUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải mã QR.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void getAppointmentQr(appointmentId)
      .then((result) => { if (!cancelled) setImageUrl(result.imageUrl); })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Không thể tải mã QR.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [appointmentId]);

  return (
    <section className="rounded-card border border-primary-300 bg-primary-50 p-5 text-center shadow-2xs">
      <div className="mb-3 flex items-center justify-center gap-2 font-bold text-ink-900">
        <QrCode size={20} className="text-primary-700" /> Mã QR xác thực lịch khám
      </div>
      <p className="mb-4 text-caption text-ink-700">
        {appointmentCode || "Lịch hẹn đã xác nhận"} · Xuất trình mã này khi làm thủ tục.
      </p>
      {loading && <div className="mx-auto h-56 w-56 animate-pulse rounded-xl bg-bg-muted" />}
      {!loading && imageUrl && (
        // Signed Supabase URL có hostname theo từng môi trường nên không thể khai báo remotePatterns cố định.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={`Mã QR xác thực ${appointmentCode || "lịch hẹn"}`}
          width={224}
          height={224}
          className="mx-auto rounded-xl border border-line bg-white p-2"
        />
      )}
      {error && <p role="alert" className="text-body text-danger">{error}</p>}
      {!loading && (
        <button type="button" onClick={() => void load()}
          className="mx-auto mt-4 inline-flex items-center gap-2 text-caption font-semibold text-primary-700">
          <RefreshCw size={14} /> Tải lại mã QR
        </button>
      )}
      <p className="mt-3 text-caption text-ink-500">Đường dẫn ảnh hết hạn nhanh; không chia sẻ mã QR cho người khác.</p>
    </section>
  );
}
