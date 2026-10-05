import {
  LayoutDashboard,
  Gamepad2,
  Trophy,
  Megaphone,
  Settings,
  ScrollText,
  Gavel,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  hideForJudge?: boolean;
  superadminOnly?: boolean;
}

export const adminNavItems: AdminNavItem[] = [
  { href: "/admin", label: "Дашборд", icon: LayoutDashboard, hideForJudge: true },
  { href: "/admin/games", label: "Игры", icon: Gamepad2, hideForJudge: true },
  { href: "/admin/tournaments", label: "Турниры", icon: Trophy, hideForJudge: true },
  { href: "/admin/appeals", label: "Апелляции и споры", icon: Gavel },
  { href: "/admin/announcements", label: "Объявления", icon: Megaphone, hideForJudge: true },
  { href: "/admin/staff", label: "Персонал", icon: Users, superadminOnly: true },
  { href: "/admin/settings", label: "Настройки", icon: Settings, superadminOnly: true },
  { href: "/admin/audit-log", label: "Журнал действий", icon: ScrollText, superadminOnly: true },
];

export function filterNavItems(items: AdminNavItem[], isSuperadmin: boolean, isJudge: boolean) {
  return items
    .filter((item) => !item.superadminOnly || isSuperadmin)
    .filter((item) => !isJudge || !item.hideForJudge);
}
