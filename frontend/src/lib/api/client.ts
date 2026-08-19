import type { AuthToken } from "@/lib/api/contracts";
import {
  clearAuthSession,
  getAuthSession,
  shouldRefreshSession,
  updateAuthToken,
} from "@/lib/auth/session";

const DEFAULT_TIMEOUT_MS = 15_000;
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "https://vmec-api.onrender.com").replace(
  /\/$/,
  "",
);

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
  timeoutMs?: number;
};

type InternalRequestOptions = RequestOptions & {
  retryAfterRefresh?: boolean;
};

interface ErrorPayload {
  code?: unknown;
  message?: unknown;
  request_id?: unknown;
  details?: unknown;
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly requestId: string | null,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requestId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function authHeaders(): Record<string, string> {
  const session = getAuthSession();
  if (session?.accessToken) {
    return { Authorization: `Bearer ${session.accessToken}` };
  }

  const devUserId = process.env.NEXT_PUBLIC_DEV_USER_ID;
  if (!devUserId) return {};

  return {
    "X-Dev-User-Id": devUserId,
    "X-Dev-Role": process.env.NEXT_PUBLIC_DEV_USER_ROLE || "PATIENT",
  };
}

let refreshPromise: Promise<AuthToken> | null = null;

function mapRefreshToken(value: unknown): AuthToken {
  if (!isRecord(value)) throw new TypeError("Refresh response không hợp lệ.");
  const accessToken = value.access_token;
  const refreshToken = value.refresh_token;
  const expiresIn = value.expires_in;
  const tokenType = value.token_type;
  if (
    typeof accessToken !== "string" ||
    typeof refreshToken !== "string" ||
    typeof expiresIn !== "number" ||
    typeof tokenType !== "string"
  ) {
    throw new TypeError("Refresh response thiếu token bắt buộc.");
  }
  return { accessToken, refreshToken, expiresIn, tokenType };
}

async function refreshAccessToken(): Promise<AuthToken> {
  if (refreshPromise) return refreshPromise;

  const session = getAuthSession();
  if (!session?.refreshToken) {
    clearAuthSession();
    throw new ApiError("AUTH_REQUIRED", "Phiên đăng nhập không còn hợp lệ.", 401, null);
  }

  refreshPromise = apiRequest<unknown>("/api/v1/auth/refresh", {
    method: "POST",
    auth: false,
    body: { refresh_token: session.refreshToken },
    retryAfterRefresh: false,
  })
    .then((raw) => {
      const token = mapRefreshToken(raw);
      updateAuthToken(token);
      return token;
    })
    .catch((error) => {
      clearAuthSession();
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

function apiFailure(payload: unknown, status: number, fallbackRequestId: string | null): ApiError {
  const envelope = isRecord(payload) && isRecord(payload.error) ? payload.error : {};
  const error = envelope as ErrorPayload;
  return new ApiError(
    typeof error.code === "string" ? error.code : "HTTP_ERROR",
    typeof error.message === "string"
      ? error.message
      : "Không thể xử lý yêu cầu. Vui lòng thử lại.",
    status,
    typeof error.request_id === "string" ? error.request_id : fallbackRequestId,
    error.details,
  );
}

export async function apiRequest<T>(path: string, options: InternalRequestOptions = {}): Promise<T> {
  const {
    auth = true,
    body,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retryAfterRefresh = true,
    ...requestInit
  } = options;

  const session = auth ? getAuthSession() : null;
  if (session && shouldRefreshSession(session) && path !== "/api/v1/auth/refresh") {
    await refreshAccessToken();
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  const externalSignal = requestInit.signal;
  const abortFromExternal = () => controller.abort();
  externalSignal?.addEventListener("abort", abortFromExternal, { once: true });

  const headers = new Headers(requestInit.headers);
  headers.set("Accept", "application/json");
  headers.set("X-Request-Id", requestId());
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (auth) {
    Object.entries(authHeaders()).forEach(([key, value]) => headers.set(key, value));
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...requestInit,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const payload: unknown = await response.json().catch(() => null);
    const responseRequestId = response.headers.get("X-Request-Id");

    if (!response.ok) {
      const failure = apiFailure(payload, response.status, responseRequestId);
      if (
        auth &&
        retryAfterRefresh &&
        response.status === 401 &&
        getAuthSession()?.refreshToken
      ) {
        await refreshAccessToken();
        return apiRequest<T>(path, { ...options, retryAfterRefresh: false });
      }
      throw failure;
    }
    if (!isRecord(payload) || !("data" in payload)) {
      throw new ApiError(
        "INVALID_RESPONSE",
        "Phản hồi từ máy chủ không đúng định dạng.",
        response.status,
        responseRequestId,
      );
    }
    return payload.data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted) {
      throw new ApiError("REQUEST_TIMEOUT", "Yêu cầu đã quá thời gian chờ.", 0, null);
    }
    throw new ApiError("NETWORK_ERROR", "Không thể kết nối đến máy chủ.", 0, null);
  } finally {
    window.clearTimeout(timeout);
    externalSignal?.removeEventListener("abort", abortFromExternal);
  }
}
