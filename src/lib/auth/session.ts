import type { AuthResult, AuthToken, Profile, UserRole } from "@/lib/api/contracts";

const SESSION_KEY = "p208.auth.session";
export const AUTH_SESSION_CHANGED_EVENT = "p208:auth-session-changed";
const REFRESH_SKEW_MS = 30_000;

export interface StoredAuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
  role: UserRole;
  fullName: string;
}

export function getAuthSession(): StoredAuthSession | null {
  if (typeof window === "undefined") return null;

  const raw =
    window.sessionStorage.getItem(SESSION_KEY) ||
    window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const value = JSON.parse(raw) as Partial<StoredAuthSession>;
    const validRoles: UserRole[] = ["PATIENT", "RECEPTIONIST", "DOCTOR", "ADMIN"];
    if (
      typeof value.accessToken !== "string" ||
      typeof value.userId !== "string" ||
      !validRoles.includes(value.role as UserRole)
    ) {
      clearAuthSession();
      return null;
    }
    return {
      accessToken: value.accessToken,
      refreshToken: value.refreshToken || value.accessToken,
      expiresAt: typeof value.expiresAt === "number" ? value.expiresAt : Date.now() + 86400000,
      userId: value.userId,
      role: value.role as UserRole,
      fullName: value.fullName || "Người dùng",
    };
  } catch {
    clearAuthSession();
    return null;
  }
}

export function saveAuthSession(result: AuthResult): StoredAuthSession {
  const session: StoredAuthSession = {
    accessToken: result.token.accessToken,
    refreshToken: result.token.refreshToken,
    expiresAt: Date.now() + result.token.expiresIn * 1000,
    userId: result.profile.id,
    role: result.profile.role,
    fullName: result.profile.fullName,
  };
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  notifySessionChanged();
  return session;
}

export function updateAuthToken(token: AuthToken): StoredAuthSession | null {
  const current = getAuthSession();
  if (!current) return null;

  const session: StoredAuthSession = {
    ...current,
    accessToken: token.accessToken,
    refreshToken: token.refreshToken || current.refreshToken,
    expiresAt: Date.now() + token.expiresIn * 1000,
  };
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  notifySessionChanged();
  return session;
}

export function updateAuthProfile(profile: Profile): StoredAuthSession | null {
  const current = getAuthSession();
  if (!current) return null;

  const session: StoredAuthSession = {
    ...current,
    userId: profile.id,
    role: profile.role,
    fullName: profile.fullName,
  };
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  notifySessionChanged();
  return session;
}

export function shouldRefreshSession(session: StoredAuthSession): boolean {
  return session.expiresAt <= Date.now() + REFRESH_SKEW_MS;
}

export function clearAuthSession(): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(SESSION_KEY);
    window.localStorage.removeItem(SESSION_KEY);
    notifySessionChanged();
  }
}

function notifySessionChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
  }
}
