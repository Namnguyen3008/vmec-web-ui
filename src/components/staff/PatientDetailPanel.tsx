import { Sparkles, History, MoveRight, MessageSquareText, CalendarX } from "lucide-react";

export type PatientDetail = {
  name: string;
  meta: string;
  phone: string;
  aiSummary: string;
  history: { date: string; label: string; note: string }[];
};

export function PatientDetailPanel({ patient }: { patient: PatientDetail }) {
  return (
    <div className="rounded-card border border-line bg-surface p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-200/60 font-bold text-primary-900">
          {patient.name.charAt(0)}
        </span>
        <div>
          <p className="text-h3 font-bold text-ink-900">{patient.name}</p>
          <p className="text-body text-ink-500">{patient.meta}</p>
          <p className="text-body text-ink-500">{patient.phone}</p>
        </div>
      </div>

      <div className="mt-5 flex gap-2 rounded-xl bg-primary-100/30 p-4">
        <Sparkles size={16} className="mt-0.5 shrink-0 text-primary-700" />
        <div>
          <p className="font-bold text-primary-900">AI TÓM TẮT TRIỆU CHỨNG</p>
          <p className="mt-1 text-body text-ink-900">{patient.aiSummary}</p>
        </div>
      </div>

      <p className="mt-5 flex items-center gap-2 text-caption font-bold tracking-wide text-ink-500">
        <History size={14} /> LỊCH SỬ KHÁM GẦN ĐÂY
      </p>
      <ul className="mt-3 space-y-3">
        {patient.history.map((h) => (
          <li key={h.date} className="flex gap-3 text-body">
            <History size={14} className="mt-1 shrink-0 text-ink-500" />
            <div>
              <p className="font-semibold text-ink-900">
                {h.date} - {h.label}
              </p>
              <p className="text-ink-500">{h.note}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 space-y-2.5">
        <button className="flex w-full items-center justify-center gap-2 rounded-full bg-primary-900 px-4 py-3 text-body font-semibold text-white hover:bg-black">
          <MoveRight size={16} /> Chuyển phòng khám
        </button>
        <button className="flex w-full items-center justify-center gap-2 rounded-full border border-line py-3 text-body font-semibold text-ink-900 hover:bg-bg-muted">
          <MessageSquareText size={16} /> Gửi SMS nhắc lịch
        </button>
        <button className="flex w-full items-center justify-center gap-2 rounded-full border border-danger-soft py-3 text-body font-semibold text-danger hover:bg-danger-soft/30">
          <CalendarX size={16} /> Hủy / Dời lịch
        </button>
      </div>
    </div>
  );
}
