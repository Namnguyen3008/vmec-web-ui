import { Badge } from "@/components/ui/Badge";

const tabs = ["Tất cả", "Đã check-in", "Đang khám", "Đã hoàn thành", "Ca Cấp cứu"];

export type PatientRow = {
  id: string;
  initial: string;
  name: string;
  code: string;
  phone: string;
  reason: string;
  department: string;
  status: { label: string; tone: "warning" | "neutral" | "danger" };
  emergency?: boolean;
};

export function PatientFilterTabs({ active }: { active: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`rounded-full px-4 py-2 text-body font-semibold ${
            tab === active
              ? tab === "Ca Cấp cứu"
                ? "bg-danger text-white"
                : "bg-primary-700 text-white"
              : tab === "Ca Cấp cứu"
                ? "bg-danger-soft text-danger"
                : "bg-bg-soft text-ink-700"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

export function PatientTable({
  rows,
  selectedId,
  onSelect,
}: {
  rows: PatientRow[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="grid grid-cols-[1.4fr_1.8fr_1fr_0.8fr] border-b border-line bg-bg-muted px-6 py-3 text-body font-semibold text-ink-500">
        <span>Bệnh nhân</span>
        <span>Triệu chứng / Khoa</span>
        <span>Trạng thái</span>
        <span>Thao tác</span>
      </div>
      {rows.map((r) => (
        <button
          key={r.id}
          onClick={() => onSelect(r.id)}
          className={`grid w-full grid-cols-[1.4fr_1.8fr_1fr_0.8fr] items-start gap-2 border-b border-line px-6 py-4 text-left last:border-b-0 ${
            r.emergency ? "bg-danger-soft/20" : selectedId === r.id ? "bg-primary-100/20" : "hover:bg-bg-muted"
          }`}
        >
          <span className="flex items-center gap-3">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold ${
                r.emergency ? "bg-danger-soft text-danger" : "bg-primary-200/60 text-primary-900"
              }`}
            >
              {r.initial}
            </span>
            <span>
              <span className={`block font-bold ${r.emergency ? "text-danger" : "text-ink-900"}`}>
                {r.name}
              </span>
              <span className="block text-caption text-ink-500">
                {r.code} • {r.phone}
              </span>
            </span>
          </span>
          <span className="text-body text-ink-900">
            {r.reason}
            <span className={`block ${r.emergency ? "font-semibold text-danger" : "text-ink-700"}`}>
              {r.department}
            </span>
          </span>
          <span>
            <Badge tone={r.status.tone}>{r.status.label}</Badge>
          </span>
          <span className="font-semibold text-primary-700">Xem chi tiết</span>
        </button>
      ))}
    </div>
  );
}
