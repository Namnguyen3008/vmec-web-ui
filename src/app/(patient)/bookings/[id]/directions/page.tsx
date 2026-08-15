import { MapPin, PhoneCall, Navigation, Footprints } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

const steps = [
  "Di chuyển từ Cổng chính đến Sảnh A.",
  "Đi thang máy lên Tầng 3.",
  "Rẽ trái tại hành lang khu C.",
  "Phòng khám 302 nằm ở cuối hành lang bên phải.",
];

export default async function BookingDirectionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-line bg-surface p-6">
        <div className="flex items-center gap-4">
          <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-primary-200" />
          <div>
            <p className="flex items-center gap-2 font-bold text-ink-900">
              BN: Nguyễn Văn A
              <span className="rounded-full bg-bg-soft px-2 py-0.5 text-caption font-semibold text-ink-700">
                #PT-{8940 + Number(id)}
              </span>
            </p>
            <p className="text-body text-ink-700">
              Khám chuyên khoa: Chấn thương Chỉnh hình | BS. Nguyễn Văn B
            </p>
          </div>
        </div>
        <Badge tone="primary">Ngày khám: Hôm nay</Badge>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-card border border-line bg-surface p-6">
          <h1 className="text-h2 font-bold text-primary-900">
            Hướng dẫn di chuyển đến Phòng khám
          </h1>

          <div className="mt-5 flex items-start gap-3 rounded-xl bg-bg-muted p-5">
            <MapPin size={20} className="mt-0.5 shrink-0 text-primary-700" />
            <div>
              <p className="font-bold text-ink-900">Thông tin điểm đến</p>
              <p className="text-body text-ink-700">
                Phòng khám số 302 | Khoa Chấn thương Chỉnh hình | BS. Nguyễn Văn B
              </p>
            </div>
          </div>

          <div className="relative mt-5 flex aspect-[16/10] items-center justify-center overflow-hidden rounded-xl border border-dashed border-line-strong bg-[linear-gradient(0deg,transparent_24%,var(--color-line)_25%,var(--color-line)_26%,transparent_27%,transparent_74%,var(--color-line)_75%,var(--color-line)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,var(--color-line)_25%,var(--color-line)_26%,transparent_27%,transparent_74%,var(--color-line)_75%,var(--color-line)_76%,transparent_77%,transparent)] bg-[length:12.5%_12.5%]">
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface/90 px-6 py-4 shadow">
              <span className="flex items-center gap-2 rounded-full bg-primary-900 px-4 py-2 text-body font-bold text-white">
                <Navigation size={16} /> Phòng khám 302
              </span>
              <span className="text-caption text-ink-500">Sơ đồ Tầng 3 - Khu C</span>
            </div>
          </div>

          <h2 className="mt-6 flex items-center gap-2 text-h3 font-bold text-ink-900">
            <Footprints size={20} /> Các bước di chuyển
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {steps.map((step, i) => (
              <div key={step} className="flex items-start gap-3 rounded-xl border border-line p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bg-soft text-caption font-bold text-ink-900">
                  {i + 1}
                </span>
                <p className="text-body text-ink-900">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <h3 className="text-h3 font-bold text-primary-900">Hỗ trợ Nhanh</h3>

          <SupportCard
            icon={<Navigation size={18} />}
            title="Sơ đồ chỉ đường"
            desc="Tìm đường đi trong Bệnh viện"
          />
          <SupportCard
            icon={<PhoneCall size={18} />}
            title="Gọi hỗ trợ Lễ tân"
            desc="Khi cần trợ giúp khẩn cấp"
            danger
          />
          <SupportCard
            icon={<Footprints size={18} />}
            title="Gọi hỗ trợ dẫn đường"
            desc="Nhân viên sẽ đến hỗ trợ bạn"
          />
        </aside>
      </div>
    </div>
  );
}

function SupportCard({
  icon,
  title,
  desc,
  danger,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  danger?: boolean;
}) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-card border p-4 text-left ${
        danger
          ? "border-danger-soft bg-danger-soft/30 text-danger"
          : "border-line bg-surface text-ink-900 hover:bg-bg-muted"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          danger ? "bg-white text-danger" : "bg-primary-200/50 text-primary-700"
        }`}
      >
        {icon}
      </span>
      <span>
        <span className="block font-bold">{title}</span>
        <span className={`block text-caption ${danger ? "text-danger/80" : "text-ink-500"}`}>
          {desc}
        </span>
      </span>
    </button>
  );
}
