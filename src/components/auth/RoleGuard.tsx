"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/lib/api/contracts";
import { me } from "@/lib/api/auth";
import { clearAuthSession, getAuthSession } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/roles";

export function RoleGuard({
  allowedRoles,
  loginPath,
  children,
}: {
  allowedRoles: readonly UserRole[];
  loginPath: "/login" | "/login";
  children: ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const rolesKey = allowedRoles.join(",");

  useEffect(() => {
    let active = true;

    async function verifySession() {
      const session = getAuthSession();
      if (!session) {
        router.replace(loginPath);
        return;
      }

      // Kiểm tra role có quyền truy cập trang này hay không
      if (!allowedRoles.includes(session.role)) {
        router.replace(homeForRole(session.role));
        return;
      }

      // Đối với phiên Demo / Google / Cục bộ, cho phép truy cập ngay lập tức
      if (
        session.accessToken.startsWith("demo_") ||
        session.accessToken.startsWith("google_") ||
        session.userId.startsWith("demo_") ||
        session.userId.startsWith("google_")
      ) {
        if (active) setAuthorized(true);
        return;
      }

      try {
        const profile = await me();
        if (profile.status !== "ACTIVE") {
          clearAuthSession();
          router.replace(loginPath);
          return;
        }
        if (!allowedRoles.includes(profile.role)) {
          router.replace(homeForRole(profile.role));
          return;
        }
        if (active) setAuthorized(true);
      } catch {
        // Nếu API backend bận hoặc timeout nhưng session còn hạn thì vẫn giữ quyền đăng nhập
        if (session.expiresAt > Date.now()) {
          if (active) setAuthorized(true);
        } else {
          clearAuthSession();
          router.replace(loginPath);
        }
      }
    }

    void verifySession();
    return () => {
      active = false;
    };
  }, [allowedRoles, loginPath, rolesKey, router]);

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-body text-ink-700">
        Đang xác minh phiên đăng nhập...
      </div>
    );
  }

  return children;
}
