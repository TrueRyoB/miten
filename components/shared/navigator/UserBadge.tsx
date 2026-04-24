import Link from "next/link";
import { UserBadgeProps } from "./types";

/**
 * - when logged out: "Login" link
 * - when logged in + online: green dot + username
 * - when logged in + offline: gray dot + username
 */
export default function UserBadge({
  isLoggedIn,
  isOnline = false,
  username,
}: UserBadgeProps) {
  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        className="text-sm font-medium text-blue-500 hover:text-blue-400 transition-colors"
      >
        Login
      </Link>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-sm text-gray-300">
      {/* online/offline indicator */}
      <span
        className={[
          "inline-block w-2 h-2 rounded-full flex-shrink-0",
          isOnline ? "bg-green-400" : "bg-gray-500",
        ].join(" ")}
        aria-label={isOnline ? "online" : "offline"}
      />
      <span className="max-w-[120px] truncate">{username?.trim() || "user"}</span>
    </span>
  );
}
