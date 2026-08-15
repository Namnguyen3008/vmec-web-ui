import { MessageCircle, CalendarPlus, Bot, CalendarClock, FolderLock, ShieldPlus } from "lucide-react";
import { NavBar } from "@/components/landing/NavBar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/Button";

const services = [
  {
    icon: Bot,
    title: "Trợ lý Y tế AI",
    desc: "Tư vấn sức khỏe ban đầu, giải đáp thắc mắc y khoa cơ bản và hướng dẫn sơ cứu nhanh chóng.",
    cta: "Trải nghiệm ngay",
    href: "/chat",
  },
  {
    icon: CalendarClock,
    title: "Đặt lịch thông minh",
    desc: "Gợi ý bác sĩ phù hợp dựa trên triệu chứng, sắp xếp thời gian khám tối ưu cho lịch trình của bạn.",
    cta: "Đặt lịch ngay",
    href: "/chat",
  },
  {
    icon: FolderLock,
    title: "Quản lý hồ sơ",
    desc: "Lưu trữ tập trung kết quả khám, đơn thuốc và lịch sử bệnh án. Truy cập an toàn mọi lúc mọi nơi.",
    cta: "Xem hồ sơ",
    href: "/records",
  },
];

export default function LandingPage() {
  return (
    <div className="bg-bg">
      <NavBar />

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-200/50 px-4 py-1.5 text-caption font-bold uppercase tracking-wide text-primary-900">
            <ShieldPlus size={14} /> Trợ lý y tế AI
          </span>
          <h1 className="mt-5 text-display font-bold text-primary-900">
            Chào mừng đến với <span className="text-primary-700">MedAgent AI</span>
          </h1>
          <p className="mt-5 max-w-lg text-body-lg text-ink-700">
            Trợ lý AI đồng hành cùng bạn trong hành trình khám chữa bệnh tại Bệnh
            viện Đa khoa Quốc tế. Tối ưu hóa trải nghiệm y tế với công nghệ tiên
            tiến.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button href="/chat" size="lg" icon={<MessageCircle size={18} />}>
              Trò chuyện với Trợ lý AI
            </Button>
            <Button href="/login" variant="outline" size="lg" icon={<CalendarPlus size={18} />}>
              Đặt lịch khám ngay
            </Button>
          </div>
          <div className="mt-10 flex gap-10 border-t border-line pt-6">
            <Stat value="24/7" label="Hỗ trợ liên tục" />
            <Stat value="99%" label="Độ chính xác" />
          </div>
        </div>

        <div className="relative aspect-square overflow-hidden rounded-card-lg bg-gradient-to-br from-primary-900 via-primary-700 to-primary-400">
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-32 w-32 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur">
              <ShieldPlus size={56} className="text-white" />
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="border-t border-line bg-surface py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-h1 font-bold text-primary-900">Dịch vụ Thông minh</h2>
              <p className="mt-2 max-w-xl text-body-lg text-ink-700">
                Khám phá hệ sinh thái các tính năng hỗ trợ sức khỏe toàn diện được
                cung cấp bởi MedAgent AI.
              </p>
            </div>
            <a href="#services" className="font-semibold text-primary-700 hover:underline">
              Xem tất cả dịch vụ →
            </a>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {services.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  className="flex flex-col rounded-card border border-line bg-surface p-6"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-200/50 text-primary-700">
                    <Icon size={22} />
                  </span>
                  <h3 className="mt-4 text-h3 font-bold text-ink-900">{s.title}</h3>
                  <p className="mt-2 flex-1 text-body text-ink-700">{s.desc}</p>
                  <a
                    href={s.href}
                    className="mt-4 font-semibold text-primary-700 hover:underline"
                  >
                    {s.cta} →
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-h2 font-bold text-primary-900">{value}</p>
      <p className="text-body text-ink-500">{label}</p>
    </div>
  );
}
