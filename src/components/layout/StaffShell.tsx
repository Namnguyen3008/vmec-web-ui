"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Search,
  Mail,
  UserCircle,
  CalendarCheck,
  CalendarDays,
  Users,
  BarChart3,
  AlertTriangle,
  Plus,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { useCurrentSession } from "@/lib/auth/useCurrentSession";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { RoleSwitcherMenu } from "@/components/layout/RoleSwitcherMenu";

const navItems = [
  { label: "Phê duyệt (AI)", href: "/approvals", icon: CalendarCheck },
  { label: "Lịch trình Bác sĩ", href: "/schedule", icon: CalendarDays },
  { label: "Quản lý Bệnh nhân", href: "/patients", icon: Users },
  { label: "Báo cáo & Thống kê", href: null, icon: BarChart3 },
  { label: "Conflict Alerts", href: null, icon: AlertTriangle },
];

export function StaffShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const session = useCurrentSession();

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="flex w-72 shrink-0 flex-col justify-between border-r border-line bg-surface px-4 py-6">
        <div>
          <div className="px-2">
            <Logo subtitle="Cổng thông tin Nhân viên" />
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-xl bg-bg-muted px-3 py-3">
            <span className="h-10 w-10 overflow-hidden rounded-full bg-primary-200" />
            <div className="leading-tight">
              <p className="font-bold text-ink-900">{session?.fullName || "Lễ tân"}</p>
              <p className="text-caption text-ink-500">Lễ tân Điều phối</p>
            </div>
          </div>

          <nav className="mt-6 space-y-1">
            {navItems.map((item) => {
              const ItemIcon = item.icon;
              const active = item.href && pathname?.startsWith(item.href);
              const disabled = !item.href;
              const classes = `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-body font-medium ${
                active
                  ? "bg-primary-700 text-white"
                  : disabled
                    ? "cursor-not-allowed text-ink-500/50"
                    : "text-ink-700 hover:bg-bg-muted"
              }`;
              return item.href ? (
                <Link key={item.label} href={item.href} className={classes}>
                  <ItemIcon size={18} />
                  {item.label}
                </Link>
              ) : (
                <div key={item.label} className={classes}>
                  <ItemIcon size={18} />
                  {item.label}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3">
          <button className="flex w-full items-center justify-center gap-2 rounded-full bg-primary-900 px-4 py-3 text-body font-semibold text-white hover:bg-black">
            <Plus size={18} /> Thêm lịch hẹn mới
          </button>
          <div className="space-y-1 border-t border-line pt-3">
            <SidebarUtility icon={Settings} label="Cài đặt" />
            <SidebarUtility icon={HelpCircle} label="Trợ giúp" />
            <LogoutButton
              loginPath="/login"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-body text-danger hover:bg-danger-soft/40 disabled:opacity-60"
            >
              <LogOut size={17} /> Đăng xuất
            </LogoutButton>
          </div>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between gap-6 border-b border-line bg-surface px-8 py-4">
          <h1 className="text-h3 font-bold text-primary-900">{title}</h1>
          <div className="flex items-center gap-4 text-ink-700">
            <RoleSwitcherMenu />
            <NotificationBell />
            <Mail size={20} />
            <UserCircle size={24} />
          </div>
        </header>
        <main className="overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}

function SidebarUtility({
  icon: Icon,
  label,
  danger,
}: {
  icon: typeof Settings;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-body ${
        danger ? "text-danger hover:bg-danger-soft/40" : "text-ink-700 hover:bg-bg-muted"
      }`}
    >
      <Icon size={17} />
      {label}
    </button>
  );
}
