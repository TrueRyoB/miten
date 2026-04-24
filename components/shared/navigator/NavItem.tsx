import Link from "next/link";
import { NavItemProps } from "./types";

/**
 * ドロワー内の個別メニュー行
 * - href が渡された場合: Next.js Link でページ遷移
 * - onClick が渡された場合: ボタンとして動作（テーマ切替など）
 * - いずれもクリック後にドロワーを閉じる
 */
export default function NavItem({ label, href, onClick, onClose }: NavItemProps) {
  const baseClass =
    "w-full flex items-center px-4 py-2.5 text-sm text-gray-200 " +
    "hover:bg-white/10 transition-colors text-left";

  const handleClick = () => {
    onClick?.();
    onClose();
  };

  if (href) {
    return (
      <Link href={href} onClick={onClose} className={baseClass} role="menuitem">
        {label}
      </Link>
    );
  }

  return (
    <button onClick={handleClick} className={baseClass} role="menuitem">
      {label}
    </button>
  );
}
