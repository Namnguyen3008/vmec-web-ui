"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle, LogOut, Phone } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { useCurrentSession } from "@/lib/auth/useCurrentSession";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { RoleSwitcherMenu } from "@/components/layout/RoleSwitcherMenu";

const navItems = [
  { label: "Trang chủ", href: "/dashboard" },
  { label: "Trợ lý", href: "/chat" },
  { label: "Lịch hẹn", href: "/bookings" },
  { label: "Hồ sơ", href: "/records" },
  { label: "Cá nhân", href: "/profile" },
];

export function PatientHeader() {
  const pathname = usePathname();
  const session = useCurrentSession();

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-6 py-3">
        <Link href="/dashboard">
          <Logo size="sm" />
        </Link>

        <nav className="hidden items-center gap-7 text-body font-medium text-ink-700 lg:flex">
          {navItems.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "border-b-2 border-primary-700 pb-1 font-semibold text-primary-900"
                    : "pb-1 hover:text-primary-700"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <RoleSwitcherMenu />
          <Link
            href="tel:115"
            className="hidden items-center gap-1.5 rounded-full bg-danger px-4 py-2 text-caption font-bold text-white sm:flex"
          >
            <Phone size={14} /> CẤP CỨU 115
          </Link>
          <NotificationBell />
          <IconButton icon={<HelpCircle size={18} />} />
          <span className="hidden max-w-40 truncate text-body font-semibold text-ink-900 sm:block">
            {session?.fullName || "Bệnh nhân"}
          </span>
          <LogoutButton
            loginPath="/login"
            className="flex h-9 w-9 items-center justify-center rounded-full text-danger hover:bg-danger-soft/40 disabled:opacity-60"
          >
            <LogOut size={18} aria-label="Đăng xuất" />
          </LogoutButton>
        </div>
      </div>
    </header>
  );
}

function IconButton({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700 hover:bg-bg-muted">
      {icon}
    </button>
  );
}
