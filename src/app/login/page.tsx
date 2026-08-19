import { CalendarCheck, ClipboardList, BellRing, ShieldCheck } from "lucide-react";
import { AuthTopBar } from "@/components/auth/AuthTopBar";
import { LoginForm } from "@/components/auth/LoginForm";
import { Footer } from "@/components/landing/Footer";

const benefits = [
  {
    icon: CalendarCheck,
    title: "Đặt lịch nhanh",
    desc: "Đặt lịch khám dễ dàng, chủ động chọn thời gian phù hợp.",
  },
  {
    icon: ClipboardList,
    title: "Theo dõi lộ trình khám",
    desc: "Quản lý lịch sử khám và lộ trình điều trị của bạn.",
  },
  {
    icon: BellRing,
    title: "Nhận kết quả & nhắc hẹn thông minh",
    desc: "Nhận kết quả nhanh chóng và nhắc hẹn đúng thời điểm.",
  },
  {
    icon: ShieldCheck,
    title: "Bảo mật dữ liệu y tế",
    desc: "Thông tin được bảo vệ và chỉ dùng cho quá trình khám chữa bệnh.",
  },
];

export default function LoginPage() {
  return (
    <div className="bg-bg">
      <AuthTopBar />

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1fr_420px] lg:items-start">
        <div>
          <p className="text-caption font-bold uppercase tracking-wide text-primary-700">
            Cổng bệnh nhân
          </p>
          <h1 className="mt-3 text-h1 font-bold text-primary-900">
            Chào mừng đến với <span className="text-primary-700">MedAgent AI</span>
          </h1>
          <p className="mt-4 max-w-lg text-body-lg text-ink-700">
            Trợ lý AI đồng hành cùng bạn trong hành trình khám chữa bệnh tại Bệnh
            viện Đa khoa Quốc tế.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="flex gap-3 rounded-card border border-line bg-surface p-4"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-200/50 text-primary-700">
                    <Icon size={18} />
                  </span>
                  <div>
                    <p className="font-bold text-ink-900">{b.title}</p>
                    <p className="mt-0.5 text-body text-ink-700">{b.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <LoginForm />
      </section>

      <Footer />
    </div>
  );
}
