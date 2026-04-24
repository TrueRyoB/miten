"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { NavigatorProps } from "./types";
import UserBadge from "./UserBadge";
import NavItem from "./NavItem";

export default function Navigator({
  onLocaleChange,
}: NavigatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();


  //TODO: get input info by itself
  const [isLoggedIn] = useState(false);
  const [isOnline] = useState(false);
  const [username] = useState("");
  const locale = (useParams() as { locale: Locale }).locale;

  // close drawer when pathname changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // close drawer when clicking outside
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

  // close on escape key
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
    // relative by containerRef, the drawer is absolutely positioned under the top-bar
    <div ref={containerRef} className="relative flex items-center gap-3">
      {/* ① authentication status (inline display) */}
      <UserBadge
        isLoggedIn={isLoggedIn}
        isOnline={isOnline}
        username={username}
      />

      {/* ② language switch (inline display) */}
      <button
        onClick={() => onLocaleChange(locale === "en" ? "ja" : "en")}
        className="text-xs font-medium text-gray-400 hover:text-white transition-colors px-1"
        aria-label="Switch language"
      >
        {locale === "en" ? "EN" : "JP"}
      </button>

      {/* hamburger button */}
      <button
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

      {/* drawer */}
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
        {/* ③ user guide */}
        <NavItem label="User Guide" href="/guide" onClose={close} />

        {/* ④ faq */}
        <NavItem label="FAQ" href="/faq" onClose={close} />

        {/* ⑤ feedback */}
        <NavItem label="Feedback" href="/feedback" onClose={close} />

        {/* only show when logged in ---------------------------------- */}
        {isLoggedIn && (
          <>  
            <div className="my-1 border-t border-white/10" />

            {/* ⑥ theme */}
            <NavItem
              label="Theme"
              onClose={close}
              onClick={() => {
                // TODO: implement theme switch logic
                // example: setTheme(theme === "dark" ? "light" : "dark")
              }}
            />

            {/* ⑦ public settings */}
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
