"use client";

import type { ReactNode } from "react";
import { AuthSessionProvider } from "@/hooks/auth-session-context";

export default function AppProviders({ children }: { children: ReactNode }) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
}
