import { CalendarCheck, ClipboardList, BellRing } from "lucide-react";
import { AuthTopBar } from "@/components/auth/AuthTopBar";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Footer } from "@/components/landing/Footer";

const benefits = [
  { icon: CalendarCheck, text: "Đặt lịch khám với hơn 50 chuyên khoa chỉ trong vài bước." },
  { icon: ClipboardList, text: "Lưu trữ toàn bộ hồ sơ bệnh án và lịch sử khám tại một nơi." },
  { icon: BellRing, text: "Nhắc lịch tự động và tư vấn chuyên khoa từ Trợ lý AI 24/7." },
];

export default function RegisterPage() {
  return (
    <div className="bg-bg">
      <AuthTopBar />

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1fr_420px] lg:items-start">
        <div>
          <p className="text-caption font-bold uppercase tracking-wide text-primary-700">
            Cổng bệnh nhân
          </p>
          <h1 className="mt-3 text-h1 font-bold text-primary-900">
            Tạo tài khoản <span className="text-primary-700">MedAgent AI</span>
          </h1>
          <p className="mt-4 max-w-lg text-body-lg text-ink-700">
            Chỉ mất một phút để bắt đầu hành trình chăm sóc sức khỏe cùng Trợ lý AI
            của Bệnh viện Đa khoa Quốc tế.
          </p>

          <ul className="mt-8 space-y-4">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <li key={b.text} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-200/50 text-primary-700">
                    <Icon size={16} />
                  </span>
                  <p className="text-body-lg text-ink-700">{b.text}</p>
                </li>
              );
            })}
          </ul>
        </div>

        <RegisterForm />
      </section>

      <Footer />
    </div>
  );
}
