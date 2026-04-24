import { Suspense } from "react";
import LoginForm from "./login-form";

function LoginFallback() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
      <p className="text-sm text-neutral-500">Loading…</p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
