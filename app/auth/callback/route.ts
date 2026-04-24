import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/** App profile table keyed by `auth.users.id` (adjust name to match your schema). */
const PROFILE_TABLE = "users" as const;

function sanitizeNextPath(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
}

function redirectToLogin(
  request: NextRequest,
  message: string,
  next: string
): NextResponse {
  const login = new URL("/login", request.url);
  login.searchParams.set("error", message);
  if (next !== "/") login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}

function redirectAfterSignIn(
  request: NextRequest,
  origin: string,
  next: string
): NextResponse {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocal = process.env.NODE_ENV === "development";

  if (isLocal) {
    return NextResponse.redirect(`${origin}${next}`);
  }
  if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`);
  }
  return NextResponse.redirect(`${origin}${next}`);
}

/**
 * Ensure a row exists in the public profile table for this auth user.
 * Requires RLS policies for `authenticated` (see supabase/migrations/*_users_profile_rls.sql).
 */
async function ensureProfileRow(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
): Promise<{ ok: true } | { ok: false; code: string }> {
  const { error } = await supabase.from(PROFILE_TABLE).upsert(
    { id: userId },
    { onConflict: "id", ignoreDuplicates: true }
  );

  if (error) {
    console.error("[auth/callback] profile upsert: ", error.code, error.message);
    return { ok: false, code: "profile_sync_failed" };
  }
  return { ok: true };
}

/**
 * OAuth / PKCE callback — add **this** URL in Supabase → Auth → URL Configuration
 * (e.g. http://localhost:3000/auth/callback).
 *
 * Google’s Authorized redirect URI must be Supabase’s host:
 * `https://<project-ref>.supabase.co/auth/v1/callback`
 *
 * @see https://supabase.com/docs/guides/auth/social-login/auth-google
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = sanitizeNextPath(searchParams.get("next"));

  const oauthError = searchParams.get("error");
  const oauthDesc =
    searchParams.get("error_description") ?? searchParams.get("error_code");

  if (oauthError) {
    const msg = [oauthError, oauthDesc].filter(Boolean).join(": ");
    return redirectToLogin(request, msg, next);
  }

  const code = searchParams.get("code");
  if (!code) {
    return redirectToLogin(request, "missing_code", next);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
    code
  );

  if (exchangeError) {
    return redirectToLogin(request, exchangeError.message, next);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return redirectToLogin(request, "session_invalid", next);
  }

  const profile = await ensureProfileRow(supabase, user.id);
  if (!profile.ok) {
    return redirectToLogin(request, profile.code, next);
  }

  return redirectAfterSignIn(request, origin, next);
}
