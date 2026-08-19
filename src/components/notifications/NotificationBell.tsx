"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { NotificationItem } from "@/lib/api/contracts";
import { listNotifications, markAllNotificationsRead, streamNotifications } from "@/lib/api/notifications";

export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void listNotifications().then((result) => {
      setItems(result.items);
      setUnread(result.unreadCount);
    }).catch(() => undefined);
    void (async () => {
      while (!controller.signal.aborted) {
        try {
          await streamNotifications((item) => {
            setItems((current) => [item, ...current.filter((entry) => entry.id !== item.id)].slice(0, 30));
            setUnread((current) => current + 1);
            if (item.type === "APPOINTMENT_CONFIRMED") {
              window.dispatchEvent(new CustomEvent("p208:appointment-confirmed", { detail: item }));
            }
            if (item.appointmentId) {
              window.dispatchEvent(new CustomEvent("p208:schedule-change", { detail: item }));
            }
          }, controller.signal);
        } catch {
          if (!controller.signal.aborted) await new Promise((resolve) => window.setTimeout(resolve, 3000));
        }
      }
    })();
    return () => controller.abort();
  }, []);

  async function readAll() {
    await markAllNotificationsRead();
    setUnread(0);
    setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
  }

  return (
    <div className="relative">
      <button aria-label={`Thông báo, ${unread} chưa đọc`} onClick={() => setOpen((value) => !value)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-700 hover:bg-bg-muted">
        <Bell size={19} />
        {unread > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-danger px-1 text-center text-[11px] font-bold text-white">{unread > 99 ? "99+" : unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-bold text-ink-900">Thông báo</p>
            <button onClick={readAll} className="text-caption font-semibold text-primary-700">Đánh dấu đã đọc</button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && <p className="p-5 text-body text-ink-500">Chưa có thông báo.</p>}
            {items.map((item) => (
              <Link
                key={item.id}
                href={typeof item.metadata.target === "string" ? item.metadata.target : "#"}
                onClick={() => setOpen(false)}
                className={`block border-b border-line px-4 py-3 hover:bg-bg-muted ${item.readAt ? "bg-surface" : "bg-primary-200/20"}`}
              >
                <p className="text-body font-bold text-ink-900">{item.title}</p>
                <p className="mt-1 text-caption text-ink-700">{item.content}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
