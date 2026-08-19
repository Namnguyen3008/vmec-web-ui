"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/api/auth";

export function LogoutButton({
  loginPath,
  className,
  children,
}: {
  loginPath: "/login" | "/login";
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          await logout();
        } catch {
          // logout() luôn xóa session local trong finally; vẫn điều hướng khi backend mất kết nối.
        } finally {
          router.replace(loginPath);
          router.refresh();
        }
      }}
    >
      {pending ? "Đang đăng xuất..." : children}
    </button>
  );
}
