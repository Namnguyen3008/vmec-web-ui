/**
 * Google OAuth2 / Google Sign-In Integration for VMEC Web UI
 * Supports Google Identity Services & OAuth2 Popup / Redirect Flow
 */

import { saveAuthSession } from "@/lib/auth/session";
import type { AuthResult } from "@/lib/api/contracts";

export interface GoogleUserProfile {
  email: string;
  name: string;
  picture?: string;
  sub?: string;
}

/**
 * Handle Google OAuth2 Sign-In
 * - If Google Client ID is configured: triggers Google GIS OAuth flow.
 * - In demo/dev mode: simulates seamless Google Sign-In with authenticated patient session.
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Nếu có Google Client ID và chạy trên browser có window.google
  if (typeof window !== "undefined" && googleClientId && (window as any).google?.accounts?.oauth2) {
    return new Promise((resolve, reject) => {
      try {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: "email profile openid",
          callback: async (response: any) => {
            if (response.error) {
              reject(new Error(response.error_description || "Google Sign-In bị hủy."));
              return;
            }

            try {
              // Fetch Google userinfo
              const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${response.access_token}` },
              });
              const googleUser = await userInfoRes.json();
              const authResult = buildGoogleAuthResult(googleUser.email, googleUser.name, googleUser.picture);
              saveAuthSession(authResult);
              resolve(authResult);
            } catch (err) {
              reject(err);
            }
          },
        });
        client.requestAccessToken();
      } catch (err) {
        reject(err);
      }
    });
  }

  // Chế độ mô phỏng Google OAuth nhanh cho Demo/Dev
  await new Promise((resolve) => setTimeout(resolve, 800)); // Simulating popup

  const demoGoogleEmail = "namnguyen3008@gmail.com";
  const demoGoogleName = "Nguyễn Văn Nam (Google Account)";
  const demoGoogleAvatar = "https://lh3.googleusercontent.com/a/default-user=s96-c";

  const authResult = buildGoogleAuthResult(demoGoogleEmail, demoGoogleName, demoGoogleAvatar);
  saveAuthSession(authResult);
  return authResult;
}

function buildGoogleAuthResult(email: string, name: string, avatar?: string): AuthResult {
  return {
    token: {
      accessToken: `google_oauth_jwt_${Date.now()}`,
      refreshToken: `google_oauth_refresh_${Date.now()}`,
      expiresIn: 86400,
      tokenType: "Bearer",
    },
    profile: {
      id: `google_user_${Date.now()}`,
      role: "PATIENT",
      fullName: name || "Người dùng Google",
      phoneNumber: "0901234567",
      avatarUrl: avatar || null,
      dateOfBirth: "1995-01-01",
      gender: "MALE",
      address: "Việt Nam",
      status: "ACTIVE",
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}
