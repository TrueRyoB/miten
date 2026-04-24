export type Locale = "en" | "ja";

export interface NavigatorProps {
  onLocaleChange: (locale: Locale) => void;
}

export interface NavItemProps {
  label: string;
  href?: string;
  onClick?: () => void;
  /** ドロワー内でクリック後に自動クローズするためのコールバック */
  onClose: () => void;
}

export interface UserBadgeProps {
  isLoggedIn: boolean;
  isOnline?: boolean;
  username?: string;
}
