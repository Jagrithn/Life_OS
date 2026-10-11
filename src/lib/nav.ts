import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  ClipboardCheck,
  Flame,
  FolderKanban,
  GraduationCap,
  Home,
  Library,
  Target,
  Wallet,
} from "lucide-react";

export const navItems = [
  { to: "/dashboard", label: "Home", icon: Home, mod: null },
  { to: "/tasks", label: "Tasks", icon: CheckSquare, mod: "tasks" },
  { to: "/calendar", label: "Calendar", icon: CalendarDays, mod: "calendar" },
  { to: "/projects", label: "Projects", icon: FolderKanban, mod: "projects" },
  { to: "/goals", label: "Goals", icon: Target, mod: "goals" },
  { to: "/habits", label: "Habits", icon: Flame, mod: "habits" },
  { to: "/journal", label: "Journal", icon: BookOpen, mod: "journal" },
  { to: "/finance", label: "Money", icon: Wallet, mod: "money" },
  { to: "/academics", label: "Academics", icon: GraduationCap, mod: "academics" },
  { to: "/learning", label: "Learning", icon: Library, mod: "learning" },
  { to: "/review", label: "Weekly review", icon: ClipboardCheck, mod: "review" },
] as const;

export type NavItem = (typeof navItems)[number];

export function visibleNav(enabled: string[]): NavItem[] {
  return navItems.filter((n) => !n.mod || enabled.includes(n.mod));
}
