"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthSession } from "@/hooks/auth-session-context";
import { useOnlineStatus } from "@/hooks/use-online";
import type { Locale, NavigatorProps } from "./types";
import UserBadge from "./UserBadge";
import NavItem from "./NavItem";

function localeFromSearch(searchParams: URLSearchParams): Locale {
  return (searchParams.get("locale") ?? "en") as Locale;
}

export default function Navigator({ onLocaleChange }: NavigatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const locale = useMemo(
    () => localeFromSearch(searchParams),
    [searchParams]
  );

  const { isLoggedIn, displayName } = useAuthSession();
  const isOnline = useOnlineStatus();

  function applyLocale(next: Locale) {
    if (onLocaleChange) {
      onLocaleChange(next);
      return;
    }
    const q = new URLSearchParams(searchParams.toString());
    q.set("locale", next);
    const qs = q.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const close = () => setIsOpen(false);

  return (
    <div ref={containerRef} className="relative flex items-center gap-3">
      <UserBadge
        isLoggedIn={isLoggedIn}
        isOnline={isOnline}
        username={displayName}
      />

      <button
        type="button"
        onClick={() => applyLocale(locale === "en" ? "ja" : "en")}
        className="text-xs font-medium text-gray-400 hover:text-white transition-colors px-1"
        aria-label="Switch language"
      >
        {locale === "en" ? "EN" : "JP"}
      </button>

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="p-1.5 rounded hover:bg-white/10 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
        >
          <path d="M3 12h18" />
          <path d="M3 6h18" />
          <path d="M3 18h18" />
        </svg>
      </button>

      <div
        role="menu"
        aria-label="Navigation menu"
        className={[
          "absolute right-0 top-[calc(100%+8px)] z-50 w-48",
          "bg-gray-900 border border-white/10 rounded-lg shadow-xl",
          "flex flex-col py-1 overflow-hidden",
          "transition-all duration-150 origin-top-right",
          isOpen
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none",
        ].join(" ")}
      >
        <NavItem label="User Guide" href="/guide" onClose={close} />
        <NavItem label="FAQ" href="/faq" onClose={close} />
        <NavItem label="Feedback" href="/feedback" onClose={close} />

        {isLoggedIn && (
          <>
            <div className="my-1 border-t border-white/10" />

            <NavItem
              label="Theme"
              onClose={close}
              onClick={() => {
                // TODO: theme switch
              }}
            />

            <NavItem
              label="Public Settings"
              href="/settings/public"
              onClose={close}
            />
          </>
        )}
      </div>
    </div>
  );
}
