"use client";

import { getGoogleOAuthUrl } from "@/lib/auth/googleOAuthFlow";
import type { AuthResult } from "@/lib/api/contracts";

interface GoogleSignInButtonProps {
  onSuccess?: (auth: AuthResult) => void;
  onError?: (err: Error) => void;
  text?: "signin_with" | "signup_with" | "continue_with";
}

export function GoogleSignInButton({
  text = "signin_with",
}: GoogleSignInButtonProps) {
  const buttonLabel =
    text === "signup_with"
      ? "Đăng ký bằng Google"
      : text === "continue_with"
      ? "Tiếp tục bằng Google"
      : "Đăng nhập bằng Google";

  function handleClick() {
    // Chuyển hướng trực tiếp 100% lên máy chủ chính thức của Google: accounts.google.com
    window.location.href = getGoogleOAuthUrl();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-3 rounded-full border border-line bg-surface py-3 px-4 text-body font-semibold text-ink-900 shadow-2xs transition-all hover:bg-bg-muted hover:border-ink-300 hover:shadow-xs active:scale-[0.99]"
    >
      <GoogleLogo />
      <span>{buttonLabel}</span>
    </button>
  );
}

function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#4285F4"
        d="M45.1 24.5c0-1.6-.1-3.1-.4-4.6H24v9h11.8c-.5 2.7-2.1 5-4.4 6.6v5.5h7.1c4.2-3.9 6.6-9.6 6.6-16.5z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.8 28.3c-.4-1.3-.7-2.7-.7-4.3s.3-3 .7-4.3v-5.7H4.5C3 16.9 2.2 20.3 2.2 24s.8 7.1 2.3 10l7.3-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.7c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.2 29.9 2 24 2 15.4 2 8.1 7 4.5 14l7.3 5.7c1.7-5.2 6.5-9 12.2-9z"
      />
    </svg>
  );
}
