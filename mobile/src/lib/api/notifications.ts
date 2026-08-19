import { apiFetch } from "@/lib/api/client";

export interface AppNotification {
  id: string;
  user_id: string;
  appointment_id: string | null;
  channel: string;
  type: string;
  title: string;
  content: string;
  status: string;
  metadata: Record<string, unknown> | null;
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
}

function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

export function listNotifications(accessToken: string, unreadOnly = false) {
  return apiFetch<{ items: AppNotification[]; total: number; unread_count: number }>(
    `/api/v1/notifications?unread_only=${unreadOnly}`,
    { headers: authHeaders(accessToken) },
  );
}

export function markNotificationRead(accessToken: string, notificationId: string) {
  return apiFetch<{ id: string; read: boolean }>(`/api/v1/notifications/${notificationId}/read`, {
    method: "PATCH",
    headers: authHeaders(accessToken),
  });
}

export function markAllNotificationsRead(accessToken: string) {
  return apiFetch<{ updated: number }>("/api/v1/notifications/read-all", {
    method: "PATCH",
    headers: authHeaders(accessToken),
  });
}
