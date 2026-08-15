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
        const devUserId = process.env.NEXT_PUBLIC_DEV_USER_ID;
        const devRole = process.env.NEXT_PUBLIC_DEV_USER_ROLE as UserRole | undefined;
        const validDevRole = devRole && ["PATIENT", "RECEPTIONIST", "DOCTOR"].includes(devRole);
        if (process.env.NODE_ENV !== "production" && devUserId && validDevRole) {
          if (allowedRoles.includes(devRole)) {
            if (active) setAuthorized(true);
          } else {
            router.replace(homeForRole(devRole));
          }
          return;
        }
        router.replace(loginPath);
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
        clearAuthSession();
        router.replace(loginPath);
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
