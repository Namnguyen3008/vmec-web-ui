import { apiRequest } from "@/lib/api/client";
import type { NotificationItem } from "@/lib/api/contracts";
import { getAuthSession } from "@/lib/auth/session";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://vmec-api.onrender.com").replace(/\/$/, "");

function mapItem(raw: Record<string, unknown>): NotificationItem {
  return {
    id: String(raw.id),
    appointmentId: raw.appointment_id ? String(raw.appointment_id) : null,
    type: String(raw.type),
    title: String(raw.title),
    content: String(raw.content),
    readAt: raw.read_at ? String(raw.read_at) : null,
    createdAt: String(raw.created_at),
    metadata: typeof raw.metadata === "object" && raw.metadata !== null
      ? raw.metadata as Record<string, unknown>
      : {},
  };
}

export async function listNotifications(): Promise<{ items: NotificationItem[]; unreadCount: number }> {
  const raw = await apiRequest<Record<string, unknown>>("/api/v1/notifications");
  return {
    items: Array.isArray(raw.items) ? raw.items.map((item) => mapItem(item as Record<string, unknown>)) : [],
    unreadCount: Number(raw.unread_count || 0),
  };
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiRequest("/api/v1/notifications/read-all", { method: "PATCH" });
}

export async function streamNotifications(
  onNotification: (item: NotificationItem) => void,
  signal: AbortSignal,
): Promise<void> {
  const session = getAuthSession();
  const headers: Record<string, string> = { Accept: "text/event-stream" };
  if (session?.accessToken) headers.Authorization = `Bearer ${session.accessToken}`;
  else if (process.env.NEXT_PUBLIC_DEV_USER_ID) {
    headers["X-Dev-User-Id"] = process.env.NEXT_PUBLIC_DEV_USER_ID;
    headers["X-Dev-Role"] = process.env.NEXT_PUBLIC_DEV_USER_ROLE || "PATIENT";
  }
  const response = await fetch(`${API_BASE}/api/v1/notifications/stream`, { headers, signal });
  if (!response.ok || !response.body) throw new Error("Không thể mở luồng thông báo.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (!signal.aborted) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";
    for (const event of events) {
      const data = event.split("\n").find((line) => line.startsWith("data: "));
      if (data) onNotification(mapItem(JSON.parse(data.slice(6))));
    }
  }
}
