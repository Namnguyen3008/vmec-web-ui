/**
 * Real Google OAuth 2.0 Protocol Engine for VMEC Healthcare
 * Handles direct redirection to https://accounts.google.com/o/oauth2/v2/auth
 * and processing of access_token / id_token on return.
 */

import { createSessionFromGoogleProfile } from "@/lib/auth/googleAuth";
import type { AuthResult } from "@/lib/api/contracts";

export function getGoogleOAuthUrl(): string {
  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

  const redirectUri =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : "https://vmec-healthcare-web.vercel.app/auth/callback";

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "token",
    scope: "openid email profile",
    include_granted_scopes: "true",
    state: "vmec_google_auth_state",
    prompt: "select_account",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function handleGoogleOAuthCallback(
  hash: string
): Promise<AuthResult | null> {
  if (!hash || !hash.includes("access_token=")) {
    return null;
  }

  // Parse hash params (#access_token=...&token_type=Bearer&expires_in=3599)
  const cleanHash = hash.startsWith("#") ? hash.substring(1) : hash;
  const params = new URLSearchParams(cleanHash);
  const accessToken = params.get("access_token");

  if (!accessToken) return null;

  // Gọi API chính thức của Google để lấy thông tin tài khoản thật
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error("Không thể tải thông tin tài khoản từ máy chủ Google.");
  }

  const googleProfile = await res.json();

  if (!googleProfile.email) {
    throw new Error("Tài khoản Google không trả về địa chỉ email.");
  }

  return createSessionFromGoogleProfile(
    googleProfile.email,
    googleProfile.name,
    googleProfile.picture,
    googleProfile.sub
  );
}
