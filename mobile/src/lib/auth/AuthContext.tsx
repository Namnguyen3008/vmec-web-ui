import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AppState } from "react-native";
import * as authService from "./auth-service";
import type { AuthResponse, Profile, TokenResponse } from "./types";

const STORAGE_KEY = "medagent.auth";
const REFRESH_MARGIN_MS = 60_000; // làm mới access token 60s trước khi hết hạn
const MIN_REFRESH_DELAY_MS = 5_000; // chặn vòng lặp refresh dồn dập nếu expires_in quá ngắn

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
}

type Status = "loading" | "authenticated" | "unauthenticated";

export type RegisterResult =
  | { requiresEmailConfirmation: true }
  | { requiresEmailConfirmation: false; profile: Profile };

interface AuthContextValue {
  status: Status;
  profile: Profile | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<Profile>;
  loginWithTokens: (token: TokenResponse) => Promise<Profile>;
  register: (payload: authService.RegisterPayload) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  updateProfile: (payload: authService.UpdateProfilePayload) => Promise<Profile>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function computeExpiresAt(expiresInSeconds: number): number {
  return Date.now() + expiresInSeconds * 1000;
}

function tokenResponseToStored(token: TokenResponse): StoredTokens {
  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: computeExpiresAt(token.expires_in),
  };
}

async function readStoredTokens(): Promise<StoredTokens | null> {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredTokens;
  } catch {
    return null;
  }
}

async function writeStoredTokens(tokens: StoredTokens | null) {
  if (tokens) {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(tokens));
  } else {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // refs để timer/dedup không bị stale closure và không kéo theo re-render
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshInFlightRef = useRef<Promise<boolean> | null>(null);

  function clearScheduledRefresh() {
    if (refreshTimerRef.current !== null) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }

  async function signOutLocally() {
    clearScheduledRefresh();
    await writeStoredTokens(null);
    setAccessToken(null);
    setProfile(null);
    setStatus("unauthenticated");
  }

  function scheduleRefresh(tokens: StoredTokens) {
    clearScheduledRefresh();
    const delay = Math.max(tokens.expiresAt - Date.now() - REFRESH_MARGIN_MS, MIN_REFRESH_DELAY_MS);
    refreshTimerRef.current = setTimeout(() => {
      void performRefresh(tokens.refreshToken);
    }, delay);
  }

  // Làm mới access token bằng refresh_token. Dedup: nhiều lời gọi chồng nhau
  // (timer + app quay lại foreground + hydrate lúc mount) chỉ tạo một request thật.
  function performRefresh(refreshToken: string): Promise<boolean> {
    if (refreshInFlightRef.current) return refreshInFlightRef.current;

    const task = authService
      .refresh(refreshToken)
      .then(async (token) => {
        const stored = tokenResponseToStored(token);
        await writeStoredTokens(stored);
        setAccessToken(stored.accessToken);
        scheduleRefresh(stored);
        return true;
      })
      .catch(async () => {
        // refresh_token hết hạn/không hợp lệ — buộc đăng nhập lại
        await signOutLocally();
        return false;
      })
      .finally(() => {
        refreshInFlightRef.current = null;
      });

    refreshInFlightRef.current = task;
    return task;
  }

  async function applyAuth(res: AuthResponse): Promise<Profile> {
    const stored = tokenResponseToStored(res.token);
    await writeStoredTokens(stored);
    setAccessToken(stored.accessToken);
    setProfile(res.profile);
    setStatus("authenticated");
    scheduleRefresh(stored);
    return res.profile;
  }

  // Hydrate lúc mount: nếu token đã lưu còn hạn thì xác thực qua /me; nếu gần/đã
  // hết hạn thì refresh trước rồi mới xác thực — tránh mất phiên chỉ vì mở lại
  // app sau khi access token (thường ~1h) đã hết hạn.
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const stored = await readStoredTokens();
      if (!stored) {
        if (!cancelled) setStatus("unauthenticated");
        return;
      }

      let tokens = stored;
      if (tokens.expiresAt <= Date.now() + REFRESH_MARGIN_MS) {
        const ok = await performRefresh(tokens.refreshToken);
        if (cancelled) return;
        if (!ok) return; // performRefresh đã tự signOutLocally
        const refreshed = await readStoredTokens();
        if (!refreshed) return;
        tokens = refreshed;
      }
      try {
        const me = await authService.fetchMe(tokens.accessToken);
        if (cancelled) return;
        setProfile(me);
        setAccessToken(tokens.accessToken);
        setStatus("authenticated");
        scheduleRefresh(tokens);
      } catch {
        if (!cancelled) await signOutLocally();
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
      clearScheduledRefresh();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Khi app quay lại foreground, setTimeout có thể đã bị treo (OS suspend tiến
  // trình) khiến refresh theo lịch không chạy đúng giờ — kiểm tra lại và refresh
  // ngay nếu cần.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      void (async () => {
        const stored = await readStoredTokens();
        if (!stored) return;
        if (stored.expiresAt <= Date.now() + REFRESH_MARGIN_MS) {
          void performRefresh(stored.refreshToken);
        }
      })();
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string) => applyAuth(await authService.login(email, password)),
    // applyAuth chỉ đụng vào refs + setState setters (đều ổn định qua các lần render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Dùng cho luồng xác nhận email: Supabase trả token trực tiếp qua deep link,
  // không đi qua login() bằng email/password.
  const loginWithTokens = useCallback(async (token: TokenResponse): Promise<Profile> => {
    const profile = await authService.fetchMe(token.access_token);
    return applyAuth({ token, profile });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const register = useCallback(
    async (payload: authService.RegisterPayload): Promise<RegisterResult> => {
      const res = await authService.register(payload);
      if (res.requires_email_confirmation || !res.token || !res.profile) {
        return { requiresEmailConfirmation: true };
      }
      const profile = await applyAuth({ token: res.token, profile: res.profile });
      return { requiresEmailConfirmation: false, profile };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const logout = useCallback(async () => {
    if (accessToken) {
      await authService.logout(accessToken).catch(() => {});
    }
    await signOutLocally();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const updateProfile = useCallback(
    async (payload: authService.UpdateProfilePayload) => {
      if (!accessToken) throw new Error("Chưa đăng nhập.");
      const updated = await authService.updateProfile(accessToken, payload);
      setProfile(updated);
      return updated;
    },
    [accessToken],
  );

  return (
    <AuthContext.Provider
      value={{ status, profile, accessToken, login, loginWithTokens, register, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth phải được dùng bên trong AuthProvider.");
  }
  return ctx;
}
