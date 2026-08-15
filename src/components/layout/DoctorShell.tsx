"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Settings, ClipboardList, BarChart3, History, HelpCircle, LogOut, Clock3 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { useCurrentSession } from "@/lib/auth/useCurrentSession";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const sidebarItems = [
  { label: "Lịch khám bệnh nhân", icon: ClipboardList },
  { label: "Phân tích AI", icon: BarChart3 },
  { label: "Lịch sử", icon: History },
];

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const firstTick = window.setTimeout(() => setNow(new Date()), 0);
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => {
      window.clearTimeout(firstTick);
      window.clearInterval(timer);
    };
  }, []);

  const time = now
    ? new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Asia/Bangkok",
      }).format(now)
    : "--:--:--";
  const date = now
    ? new Intl.DateTimeFormat("vi-VN", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Bangkok",
      }).format(now)
    : "Đang đồng bộ";

  return (
    <div className="flex items-center gap-2 rounded-xl border border-line bg-bg/60 px-3 py-2" aria-label={`Thời gian hiện tại ${time}`}>
      <Clock3 size={17} className="text-primary-700" />
      <div className="leading-tight">
        <p className="font-mono text-body font-bold tabular-nums text-ink-900">{time}</p>
        <p className="hidden text-[11px] capitalize text-ink-500 md:block">{date}</p>
      </div>
    </div>
  );
}

export function DoctorShell({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(0);
  const [onDuty, setOnDuty] = useState(true);
  const session = useCurrentSession();

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex items-center justify-between border-b border-line bg-surface px-6 py-3">
        <Logo size="sm" />
        <div className="flex items-center gap-5">
          <LiveClock />
          <label className="flex items-center gap-2 text-body font-medium text-ink-700">
            Đang làm việc
            <button
              onClick={() => setOnDuty((v) => !v)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                onDuty ? "bg-primary-700" : "bg-line-strong"
              }`}
              aria-pressed={onDuty}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  onDuty ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </label>
          <div className="text-right leading-tight">
            <p className="font-bold text-ink-900">{session?.fullName || "Bác sĩ"}</p>
            <p className="text-caption text-ink-500">Tài khoản bác sĩ</p>
          </div>
          <NotificationBell />
          <Settings size={20} className="text-ink-700" />
          <span className="h-9 w-9 overflow-hidden rounded-full bg-primary-200" />
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="flex w-64 shrink-0 flex-col justify-between border-r border-line bg-surface px-4 py-6">
          <nav className="space-y-1">
            {sidebarItems.map((item, i) => {
              const ItemIcon = item.icon;
              const isActive = i === active;
              return (
                <button
                  key={item.label}
                  onClick={() => setActive(i)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-body font-medium ${
                    isActive
                      ? "bg-primary-200/50 text-primary-900"
                      : "text-ink-700 hover:bg-bg-muted"
                  }`}
                >
                  <ItemIcon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="space-y-1 border-t border-line pt-4">
            <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-body text-ink-700 hover:bg-bg-muted">
              <HelpCircle size={18} /> Support
            </button>
            <LogoutButton
              loginPath="/login"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-body text-danger hover:bg-danger-soft/40 disabled:opacity-60"
            >
              <LogOut size={18} /> Đăng xuất
            </LogoutButton>
          </div>
        </aside>

        <main className="flex-1 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}
