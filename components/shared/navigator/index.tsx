"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { NavigatorProps } from "./types";
import UserBadge from "./UserBadge";
import NavItem from "./NavItem";

/**
 * Navigator
 *
 * Top-bar 右端に配置するドロワー型ナビゲーター。
 *
 * 使用例:
 * ```tsx
 * <Navigator
 *   isLoggedIn={true}
 *   isOnline={true}
 *   username="taro"
 *   locale="ja"
 *   onLocaleChange={(l) => router.push(pathname, { locale: l })}
 * />
 * ```
 */
export default function Navigator({
  isLoggedIn,
  isOnline = false,
  username,
  locale,
  onLocaleChange,
}: NavigatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // ルート変化でドロワーを閉じる
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // ドロワー外クリックで閉じる
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

  // Escape キーで閉じる
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
    // relative により、ドロワーが top-bar 直下に絶対配置される
    <div ref={containerRef} className="relative flex items-center gap-3">
      {/* ① 認証ステータス（インライン表示） */}
      <UserBadge
        isLoggedIn={isLoggedIn}
        isOnline={isOnline}
        username={username}
      />

      {/* ② 言語切替（インライン表示） */}
      <button
        onClick={() => onLocaleChange(locale === "en" ? "ja" : "en")}
        className="text-xs font-medium text-gray-400 hover:text-white transition-colors px-1"
        aria-label="言語を切り替える"
      >
        {locale === "en" ? "EN" : "JP"}
      </button>

      {/* ハンバーガーボタン */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="メニューを開く"
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

      {/* ドロワー */}
      <div
        role="menu"
        aria-label="ナビゲーションメニュー"
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
        {/* ③ User Guide */}
        <NavItem label="User Guide" href="/guide" onClose={close} />

        {/* ④ FAQ */}
        <NavItem label="FAQ" href="/faq" onClose={close} />

        {/* ⑤ Feedback */}
        <NavItem label="Feedback" href="/feedback" onClose={close} />

        {/* ログイン時のみ表示 ---------------------------------- */}
        {isLoggedIn && (
          <>
            <div className="my-1 border-t border-white/10" />

            {/* ⑥ Theme */}
            <NavItem
              label="Theme"
              onClose={close}
              onClick={() => {
                // TODO: テーマ切替ロジックを実装
                // 例: setTheme(theme === "dark" ? "light" : "dark")
              }}
            />

            {/* ⑦ Public Settings */}
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
