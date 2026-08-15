import { apiRequest } from "@/lib/api/client";
import type { ChatActionType, ChatMessage, ChatSession, SendMessageResult, WorkflowActionResult } from "@/lib/api/contracts";
import { list, mapChatMessage, mapChatSession, mapSendMessageResult, mapWorkflowActionResult } from "@/lib/api/mappers";

export async function createChatSession(title?: string): Promise<ChatSession> {
  const raw = await apiRequest<unknown>("/api/v1/chat/sessions", {
    method: "POST",
    body: { language: "vi", channel: "web", ...(title ? { title } : {}) },
  });
  return mapChatSession(raw);
}

export async function listChatSessions(limit = 20): Promise<ChatSession[]> {
  const raw = await apiRequest<unknown>(`/api/v1/chat/sessions?limit=${limit}`);
  return list(raw, mapChatSession);
}

export async function listChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const raw = await apiRequest<unknown>(`/api/v1/chat/sessions/${encodeURIComponent(sessionId)}/messages`);
  return list(raw, mapChatMessage);
}

export async function sendChatMessage(sessionId: string, content: string): Promise<SendMessageResult> {
  const raw = await apiRequest<unknown>(`/api/v1/chat/sessions/${encodeURIComponent(sessionId)}/messages`, {
    method: "POST",
    timeoutMs: 45_000,
    body: { content: content.trim() },
  });
  return mapSendMessageResult(raw);
}

export async function sendChatAction(
  sessionId: string,
  actionType: ChatActionType,
  payload: Record<string, unknown> = {},
): Promise<WorkflowActionResult> {
  return mapWorkflowActionResult(await apiRequest(`/api/v1/chat/sessions/${encodeURIComponent(sessionId)}/actions`, {
    method: "POST",
    body: { action_type: actionType, payload },
  }));
}

export async function closeChatSession(sessionId: string): Promise<ChatSession> {
  return mapChatSession(
    await apiRequest<unknown>(`/api/v1/chat/sessions/${encodeURIComponent(sessionId)}/close`, {
      method: "PATCH",
    }),
  );
}
