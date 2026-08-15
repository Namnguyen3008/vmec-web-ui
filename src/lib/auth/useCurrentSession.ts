"use client";

import { useEffect, useState } from "react";
import {
  AUTH_SESSION_CHANGED_EVENT,
  getAuthSession,
  type StoredAuthSession,
} from "@/lib/auth/session";

export function useCurrentSession(): StoredAuthSession | null {
  const [session, setSession] = useState<StoredAuthSession | null>(null);

  useEffect(() => {
    const sync = () => setSession(getAuthSession());
    sync();
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return session;
}
