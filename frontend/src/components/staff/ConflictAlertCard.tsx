import { TriangleAlert, Clock } from "lucide-react";

export function ConflictAlertCard() {
  return (
    <div className="rounded-card border border-warning/30 bg-warning/10 p-5">
      <p className="flex items-center gap-2 font-bold text-accent-orange-strong">
        <TriangleAlert size={18} /> Cảnh báo Xung đột
      </p>
      <p className="mt-3 text-body text-ink-900">
        Phát hiện trùng lịch <span className="font-semibold text-accent-orange-strong">BS. Nguyễn</span>{" "}
        lúc 10:00. (Bác sĩ bận hội chẩn đột xuất).
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-surface px-4 py-3 text-body font-medium text-ink-900">
        <Clock size={16} className="text-primary-700" />
        AI Đề xuất giải pháp: <span className="font-bold">Dời sang 11:45 cùng ngày</span>
      </div>

      <button className="mt-4 w-full rounded-full bg-warning px-4 py-3 text-body font-bold text-white hover:opacity-90">
        Áp dụng đề xuất AI
      </button>
      <a href="#" className="mt-3 block text-center text-body font-semibold text-ink-700 hover:underline">
        Xem chi tiết lịch trình
      </a>
    </div>
  );
}
