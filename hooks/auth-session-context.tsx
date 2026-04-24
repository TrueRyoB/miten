"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { extractPrettyName } from "@/utils/data-to-ui";

export type AuthSessionContextValue = {
  session: Session | null;
  user: User | null;
  isLoggedIn: boolean;
  /**
   * Label for UI: DB username → cached last login → JWT metadata → email.
   * Cache is non-authoritative and only used for clarity while session/profile hydrates.
   */
  displayName: string;
  isPending: boolean;
  refreshSession: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

const DISPLAY_CACHE_KEY = "miten-auth-display-v1";

type DisplayCache = {
  userId: string;
  displayName: string;
};

function readDisplayCache(): DisplayCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DISPLAY_CACHE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Partial<DisplayCache>;
    if (
      o &&
      typeof o.userId === "string" &&
      typeof o.displayName === "string" &&
      o.displayName.trim()
    ) {
      return { userId: o.userId, displayName: o.displayName.trim() };
    } 
  } catch (error) {
    console.error("Error reading display cache", error);
  }
  return null;
}

function writeDisplayCache(entry: DisplayCache): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DISPLAY_CACHE_KEY, JSON.stringify(entry));
  } catch {
    console.error("Error writing display cache");
  }
}

function clearDisplayCache(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DISPLAY_CACHE_KEY);
  } catch {
    console.error("Error clearing display cache");
  }
}

function sessionDisplayFallback(user: User): string {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  for (const key of ["full_name", "name", "user_name", "preferred_username"]) {
    const v = meta?.[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  const email = user.email;
  return (email) ? extractPrettyName(email) : "User";
}

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [dbUsername, setDbUsername] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [displayCache, setDisplayCache] = useState<DisplayCache | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    setDisplayCache(readDisplayCache());
  }, []);

  useEffect(() => {
    let cancelled = false;

    void supabase.auth.getSession().then(({ data: { session: initial } }) => {
      if (!cancelled) {
        setSession(initial ?? null);
        setIsPending(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      setIsPending(false);
      if (event === "SIGNED_OUT" || !next) {
        setDbUsername(null);
        clearDisplayCache();
        setDisplayCache(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const user = session?.user ?? null;

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    void (async () => {
      const { data, error } = await supabase
        .from("users")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();

      if (!isMounted || error) return;
      if (data?.username && typeof data.username === "string") {
        setDbUsername(data.username.trim());
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [user?.id, supabase]);

  const displayName = useMemo(() => {
    if (!user) {
      return "";
    }

    if (dbUsername) {
      return dbUsername;
    }

    if (
      displayCache &&
      displayCache.userId === user.id &&
      displayCache.displayName
    ) {
      return displayCache.displayName;
    }

    return sessionDisplayFallback(user);
  }, [user, dbUsername, displayCache]);

  useEffect(() => {
    if (!user?.id || !displayName) return;
    const entry = { userId: user.id, displayName };
    writeDisplayCache(entry);
    setDisplayCache(entry);
  }, [user?.id, displayName]);

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      setDbUsername(null);
    }
  }, [isPending, session?.user]);

  const refreshSession = useCallback(async () => {
    const {
      data: { session: next },
    } = await supabase.auth.getSession();
    setSession(next ?? null);
  }, [supabase]);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      session,
      user,
      isLoggedIn: !!user,
      displayName,
      isPending,
      refreshSession,
    }),
    [session, user, displayName, isPending, refreshSession]
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession(): AuthSessionContextValue {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) {
    throw new Error("useAuthSession must be used within AuthSessionProvider");
  }
  return ctx;
}
