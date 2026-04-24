"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function Spinner() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      className="animate-spin text-neutral-500"
      aria-hidden="true"
    >
      <circle
        cx="9"
        cy="9"
        r="7"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2"
      />
      <path
        d="M16 9a7 7 0 0 0-7-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function safeNextPath(next: string | null) {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/";
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");
  const nextAfterAuth = safeNextPath(searchParams.get("next"));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        router.replace(nextAfterAuth);
      }
    });
  }, [router, nextAfterAuth]);

  const signInWithGoogle = useCallback(async () => {
    setBusy(true);
    const supabase = createClient();
    const origin = window.location.origin;
    const next = safeNextPath(searchParams.get("next"));
    const callback = new URL("/auth/callback", origin);
    callback.searchParams.set("next", next);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callback.toString(),
      },
    });
    setBusy(false);
    if (error) {
      console.error(error);
      router.replace(`/login?error=${encodeURIComponent(error.message)}`);
    }
  }, [router, searchParams]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-xl font-semibold text-center">Sign in</h1>
      {oauthError ? (
        <p className="text-sm text-red-600 text-center max-w-md" role="alert">
          {oauthError}
        </p>
      ) : null}
      <p className="text-sm text-neutral-600 text-center max-w-sm">
        Use Google to continue. You start the flow explicitly so a bad callback
        does not spin in a loop.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void signInWithGoogle()}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 shadow-sm hover:bg-neutral-50 disabled:opacity-60"
      >
        {busy ? <Spinner /> : null}
        {busy ? "Opening Google…" : "Continue with Google"}
      </button>
    </main>
  );
}
