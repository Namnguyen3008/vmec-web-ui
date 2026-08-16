import Link from "next/link";
import {
  MessageCircle,
  CalendarPlus,
  Bot,
  CalendarClock,
  FolderLock,
  ShieldPlus,
  Heart,
  BrainCircuit,
  Stethoscope,
  Activity,
  ArrowRight,
  ShieldCheck,
  Award,
  Users,
} from "lucide-react";
import { NavBar } from "@/components/landing/NavBar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/Button";
import { MASTER_SPECIALTIES } from "@/lib/clinicalMasterCatalog";

const services = [
  {
    icon: Bot,
    title: "Trợ lý Y tế AI",
    desc: "Tư vấn sức khỏe ban đầu, giải đáp thắc mắc y khoa cơ bản và hướng dẫn sơ cứu nhanh chóng theo phác đồ Bộ Y Tế.",
    cta: "Trải nghiệm ngay",
    href: "/chat",
  },
  {
    icon: CalendarClock,
    title: "Đặt lịch thông minh",
    desc: "Gợi ý bác sĩ phù hợp dựa trên 17 chuyên khoa lâm sàng chuẩn, sắp xếp thời gian khám tối ưu cho lịch trình của bạn.",
    cta: "Đặt lịch ngay",
    href: "/chat",
  },
  {
    icon: FolderLock,
    title: "Quản lý hồ sơ EMR",
    desc: "Lưu trữ tập trung kết quả khám, đơn thuốc và lịch sử bệnh án điện tử. Truy cập an toàn mọi lúc mọi nơi.",
    cta: "Xem hồ sơ",
    href: "/records",
  },
];

export default function LandingPage() {
  return (
    <div className="bg-bg">
      <NavBar />

      {/* Hero Section */}
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-caption font-bold uppercase tracking-wide text-primary-900 border border-primary-200">
            <ShieldPlus size={14} className="text-teal-700" /> Hệ Thống Y Tế Thông Minh VMEC
          </span>
          <h1 className="mt-5 text-display font-bold text-primary-900 leading-tight">
            Chào mừng đến với <span className="text-teal-700">MedAgent AI</span>
          </h1>
          <p className="mt-5 max-w-lg text-body-lg text-ink-700">
            Trợ lý AI đồng hành cùng bạn trong hành trình khám chữa bệnh tại Bệnh
            viện Đa khoa Quốc tế VMEC. Định tuyến 17 chuyên khoa, kết nối liên thông Lễ tân, Bác sĩ và Hồ sơ bệnh án điện tử.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button href="/chat" size="lg" icon={<MessageCircle size={18} />}>
              Trò chuyện với Trợ lý AI
            </Button>
            <Button href="/login" variant="outline" size="lg" icon={<CalendarPlus size={18} />}>
              Cổng Đăng Nhập
            </Button>
          </div>
          <div className="mt-10 flex gap-10 border-t border-line pt-6">
            <Stat value="17" label="Chuyên khoa chuẩn BYT" />
            <Stat value="24/7" label="Hỗ trợ liên tục" />
            <Stat value="99.2%" label="Độ chuẩn xác Triage" />
          </div>
        </div>

        <div className="relative aspect-square overflow-hidden rounded-card-lg bg-gradient-to-br from-primary-900 via-primary-700 to-teal-800 p-8 flex flex-col justify-between text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <Activity size={26} className="text-teal-200" />
            </div>
            <span className="rounded-full bg-teal-500/30 px-3.5 py-1 text-caption font-semibold border border-teal-300/40">
              Live Health Agent
            </span>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-md border border-white/20">
              <p className="text-caption text-teal-200 font-semibold uppercase">Chuẩn đoán Lâm sàng AI</p>
              <p className="text-body font-bold mt-1 text-white">Định tuyến chính xác phòng khám và bác sĩ chuyên khoa</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-md border border-white/20">
              <p className="text-caption text-teal-200 font-semibold uppercase">Đồng bộ EMR 4 bước</p>
              <p className="text-body font-bold mt-1 text-white">Patient Chat → Lễ tân duyệt → Bác sĩ khám → Sổ bệnh án</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-caption text-teal-200">
            <span>Bệnh viện Đa khoa Quốc tế VMEC</span>
            <span>123 Nguyễn Trãi, Hà Nội</span>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="border-t border-line bg-surface py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-h1 font-bold text-primary-900">Dịch vụ Y tế Thông minh</h2>
              <p className="mt-2 max-w-xl text-body-lg text-ink-700">
                Khám phá hệ sinh thái các tính năng hỗ trợ sức khỏe toàn diện được
                cung cấp bởi MedAgent AI.
              </p>
            </div>
            <Link href="/chat" className="font-semibold text-teal-700 hover:underline flex items-center gap-1">
              Trải nghiệm Trợ lý AI ngay <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {services.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  className="flex flex-col rounded-card border border-line bg-surface p-6 shadow-2xs hover:shadow-md transition"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-800">
                    <Icon size={22} />
                  </span>
                  <h3 className="mt-4 text-h3 font-bold text-ink-900">{s.title}</h3>
                  <p className="mt-2 flex-1 text-body text-ink-700">{s.desc}</p>
                  <Link
                    href={s.href}
                    className="mt-4 font-semibold text-teal-700 hover:underline inline-flex items-center gap-1"
                  >
                    {s.cta} →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 17 Specialties Grid */}
      <section className="border-t border-line bg-bg-soft py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-caption font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-3 py-1 rounded-full">
              Đội ngũ Chuyên khoa VMEC
            </span>
            <h2 className="mt-3 text-h1 font-bold text-primary-900">
              17 Chuyên Khoa Lâm Sàng Chuẩn Hóa
            </h2>
            <p className="mt-2 text-body text-ink-700">
              Hệ thống phòng khám chuyên gia trang bị trang thiết bị hiện đại, tiếp nhận trực tiếp từ hệ thống điều phối AI.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {MASTER_SPECIALTIES.map((spec) => (
              <div
                key={spec.code}
                className="bg-surface p-4 rounded-xl border border-line shadow-2xs hover:border-teal-400 hover:shadow-xs transition flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-bold text-ink-900 text-body">{spec.name}</h4>
                  <p className="text-caption text-ink-600 mt-0.5">{spec.doctors[0]?.fullName || "Bác sĩ Chuyên khoa"}</p>
                  <p className="text-caption text-ink-500 mt-0.5">{spec.room} - {spec.building}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-line/60 flex items-center justify-between text-caption">
                  <span className="font-semibold text-teal-800">{(spec.doctors[0]?.consultationFee || 350000).toLocaleString("vi-VN")} đ</span>
                  <Link href="/chat" className="text-primary-700 font-semibold hover:underline">
                    Đặt khám →
                  </Link>
                </div>
              </div>
            ))}
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
