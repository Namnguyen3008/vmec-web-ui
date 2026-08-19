import { Badge } from "@/components/ui/Badge";

const queue = [
  {
    time: "08:30",
    name: "Trần Văn B.",
    meta: "Nam, 45 tuổi • Khám lần đầu",
    status: { label: "Bệnh nhân đang khám", tone: "warning" as const },
    active: true,
  },
  {
    time: "09:15",
    name: "Lê Thị M.",
    meta: "Nữ, 62 tuổi • Tái khám",
    status: { label: "Sắp tới", tone: "neutral" as const },
    active: false,
  },
];

export function QueueTimeline() {
  return (
    <div>
      <h2 className="text-h3 font-bold text-ink-900">Danh sách khám</h2>
      <ol className="relative mt-4 space-y-4 border-l-2 border-line pl-6">
        {queue.map((item) => (
          <li key={item.name} className="relative">
            <span
              className={`absolute -left-[29px] top-5 h-3 w-3 rounded-full ${
                item.active ? "border-4 border-primary-700 bg-surface" : "bg-line-strong"
              }`}
            />
            <div className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-body font-semibold text-ink-500">{item.time}</span>
                <Badge tone={item.status.tone}>{item.status.label}</Badge>
              </div>
              <p className="mt-2 font-bold text-ink-900">{item.name}</p>
              <p className="text-body text-ink-700">{item.meta}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
