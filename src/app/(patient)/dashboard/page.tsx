import Link from "next/link";
import {
  Bot,
  ClipboardList,
  History,
  Stethoscope,
  UserCog,
  Sparkles,
} from "lucide-react";
import { MedicalDisclaimer } from "@/components/layout/MedicalDisclaimer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const quickActions = [
  { icon: ClipboardList, label: "Hồ sơ Bệnh án", href: "/records" },
  { icon: History, label: "Lịch sử Đặt khám", href: "/bookings" },
  { icon: Stethoscope, label: "Danh mục Khoa", href: "/chat" },
  { icon: UserCog, label: "Tài khoản", href: "/profile" },
];

export default function PatientDashboardPage() {
  return (
    <div>
      <MedicalDisclaimer text="Thông tin do AI gợi ý chỉ mang tính tham khảo, vui lòng gặp bác sĩ để được tư vấn chính xác." />

      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <h1 className="text-h1 font-bold text-ink-900">Xin chào, Nguyễn Văn A</h1>
        <p className="mt-1 text-body-lg text-ink-700">
          Hôm nay MedAgent có thể giúp gì cho bạn?
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="flex flex-col justify-center rounded-card-lg bg-gradient-to-br from-primary-400 via-primary-400/70 to-primary-200/40 p-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/60 text-primary-900">
              <Bot size={22} />
            </span>
            <h2 className="mt-5 max-w-sm text-h2 font-bold text-primary-900">
              Tư vấn Chuyên khoa &amp; Đặt lịch khám với Trợ lý MedAgent
            </h2>
            <div className="mt-6">
              <Button href="/chat" variant="secondary" icon={<Sparkles size={16} />}>
                Bắt đầu Chat ngay
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex flex-col items-center justify-center gap-3 rounded-card border border-line bg-surface p-6 text-center hover:border-primary-400"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-200/50 text-primary-700">
                    <Icon size={20} />
                  </span>
                  <span className="font-semibold text-ink-900">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-6 rounded-card border border-line bg-surface p-6">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-h3 font-bold text-ink-900">
              Lịch hẹn sắp tới
            </h3>
            <Badge tone="warning">Chờ Lễ tân duyệt</Badge>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
            <div className="flex items-center gap-4">
              <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-primary-200" />
              <div>
                <p className="font-bold text-ink-900">BS. Nguyễn Văn A</p>
                <p className="text-body text-ink-700">Khoa Chấn thương Chỉnh hình</p>
                <p className="mt-0.5 text-caption text-ink-500">08:30 - Sáng mai</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button href="/bookings/1/directions" variant="outline" size="sm">
                Chi tiết
              </Button>
              <Link href="/bookings" className="font-semibold text-primary-700 hover:underline">
                Đổi lịch
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Link
        href="/chat"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary-700 text-white shadow-lg hover:bg-primary-900"
        aria-label="Mở trợ lý AI"
      >
        <Bot size={24} />
      </Link>
    </div>
  );
}
