import { apiFetch } from "@/lib/api/client";
import type { AuthResponse, Profile, RegistrationResponse, TokenResponse } from "./types";

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
  redirect_to?: string;
}

export function login(email: string, password: string) {
  return apiFetch<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(payload: RegisterPayload) {
  return apiFetch<RegistrationResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function refresh(refreshToken: string) {
  return apiFetch<TokenResponse>("/api/v1/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export function fetchMe(accessToken: string) {
  return apiFetch<Profile>("/api/v1/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function logout(accessToken: string) {
  return apiFetch<{ message: string }>("/api/v1/auth/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export interface UpdateProfilePayload {
  full_name: string;
  phone_number?: string | null;
  date_of_birth?: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | "UNKNOWN";
  address?: string | null;
}

export function updateProfile(accessToken: string, payload: UpdateProfilePayload) {
  return apiFetch<Profile>("/api/v1/auth/me", {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  });
}
