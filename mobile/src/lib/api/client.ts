import Constants from "expo-constants";

const BACKEND_PORT = 5000;

// Android emulator cần 10.0.2.2, iOS simulator cần localhost, thiết bị thật cần
// IP LAN của máy dev — ba giá trị khác nhau cho cùng một máy dev tùy nơi chạy.
// Metro đã biết chính xác host nào thiết bị/simulator dùng để tải bundle (hostUri),
// nên suy ra API host từ đó thay vì hard-code — không cần đổi .env mỗi lần đổi target.
// EXPO_PUBLIC_API_URL vẫn override được khi cần (staging, build production không qua Metro).
function resolveApiBase(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(":")[0];
  if (host) return `http://${host}:${BACKEND_PORT}`;

  return `http://localhost:${BACKEND_PORT}`;
}

const API_BASE = resolveApiBase();

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError("NETWORK_ERROR", "Không thể kết nối tới máy chủ. Vui lòng thử lại.", 0);
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      body?.error?.code ?? "UNKNOWN_ERROR",
      body?.error?.message ?? "Đã xảy ra lỗi không xác định.",
      res.status,
    );
  }

  return body?.data as T;
}
