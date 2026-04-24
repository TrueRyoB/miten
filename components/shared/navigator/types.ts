export type Locale = "en" | "ja";

export interface NavigatorProps {
  /** If omitted, locale is driven by `?locale=en|ja` and updated via the router. */
  onLocaleChange?: (locale: Locale) => void;
}

export interface NavItemProps {
  label: string;
  href?: string;
  onClick?: () => void;
  onClose: () => void;
}

export interface UserBadgeProps {
  isLoggedIn: boolean;
  isOnline?: boolean;
  username?: string;
}
