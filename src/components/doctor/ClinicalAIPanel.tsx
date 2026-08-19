import { Activity, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

const vitals = [
  { label: "Huyết áp", value: "120/80", unit: "mmHg" },
  { label: "Thân nhiệt", value: "36.8", unit: "°C" },
];

const biometrics = [
  { label: "Chiều cao", value: "173", unit: "cm" },
  { label: "Cân nặng", value: "65", unit: "kg" },
];

const differentials = [
  { label: "Thoái hóa khớp gối sớm", confidence: 80 },
  { label: "Tổn thương sụn chêm", confidence: 45 },
];

export function ClinicalAIPanel({ waitingCount }: { waitingCount: number }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-h3 font-bold text-ink-900">Phân tích lâm sàng AI</h2>
        <Badge tone="primary">Tổng số bệnh nhân đang chờ: {waitingCount}</Badge>
      </div>

      <div className="mt-4 flex gap-3 rounded-2xl bg-primary-100/30 p-5">
        <Activity size={20} className="mt-0.5 shrink-0 text-primary-700" />
        <div>
          <p className="text-caption font-bold tracking-wide text-primary-900">
            TRIỆU CHỨNG LÂM SÀNG
          </p>
          <p className="mt-1 text-body-lg text-ink-900">
            &ldquo;Đau khớp gối T khi leo cầu thang 3 ngày nay, cảm giác lục cục khi
            vận động. Không sưng đỏ.&rdquo;
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <VitalsCard title="Ghi chú tiếp nhận" items={vitals} />
        <VitalsCard title="Sinh hiệu cơ bản" items={biometrics} />
      </div>

      <div className="mt-4 rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <p className="font-bold text-ink-900">Chẩn đoán phân biệt gợi ý (AI)</p>
          <a href="#" className="text-body font-semibold text-primary-700 hover:underline">
            Xem chi tiết
          </a>
        </div>
        <div className="mt-4 space-y-4">
          {differentials.map((d, i) => (
            <div key={d.label}>
              <p className="flex items-center gap-2 text-body font-medium text-ink-900">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-bg-soft text-caption font-bold">
                  {i + 1}
                </span>
                {d.label}
              </p>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-bg-soft">
                <div
                  className="h-1.5 rounded-full bg-primary-700"
                  style={{ width: `${d.confidence}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VitalsCard({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: string; unit: string }[];
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="flex items-center gap-2 font-bold text-ink-900">
        <ClipboardList size={17} className="text-accent-orange-strong" />
        {title}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl bg-bg-muted p-3">
            <p className="text-caption text-ink-500">{item.label}</p>
            <p className="font-bold text-ink-900">
              {item.value} <span className="text-caption font-normal text-ink-500">{item.unit}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
