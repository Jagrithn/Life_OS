import { useEffect, useMemo, useState } from "react";
import { useRows, type Row, addDays, toISO, weekStart } from "@/lib/data";

export type NotifSeverity = "overdue" | "today" | "soon";
export type NotifKind =
  "task" | "event" | "assessment" | "milestone" | "goal" | "project" | "habit" | "review";

export interface AppNotification {
  id: string;
  kind: NotifKind;
  mod: string;
  title: string;
  body: string;
  severity: NotifSeverity;
  at: string;
  to: string;
}

const DAY = 86_400_000;
const DISMISSED_KEY = "ordo:dismissed-notifications";
const NOTIFIED_KEY = "ordo:browser-notified";
const MAX_BROWSER_PER_RUN = 5;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function bucketFor(dateISO: string, now: Date): { severity: NotifSeverity; label: string } | null {
  const due = startOfDay(new Date(dateISO + "T00:00"));
  const days = Math.round((due.getTime() - startOfDay(now).getTime()) / DAY);
  if (days < 0) {
    const n = Math.abs(days);
    return {
      severity: "overdue",
      label: n === 1 ? "Overdue since yesterday" : `Overdue by ${n} days`,
    };
  }
  if (days === 0) return { severity: "today", label: "Due today" };
  if (days === 1) return { severity: "soon", label: "Due tomorrow" };
  if (days <= 3) return { severity: "soon", label: `Due in ${days} days` };
  return null;
}

interface Bundle {
  tasks: Row<"tasks">[];
  events: Row<"events">[];
  assessments: Row<"assessments">[];
  milestones: Row<"milestones">[];
  goals: Row<"goals">[];
  projects: Row<"projects">[];
  habits: Row<"habits">[];
  habitLogs: Row<"habit_logs">[];
  reviews: Row<"weekly_reviews">[];
  now: Date;
}

export function buildNotifications({
  tasks,
  events,
  assessments,
  milestones,
  goals,
  projects,
  habits,
  habitLogs,
  reviews,
  now,
}: Bundle): AppNotification[] {
  const out: AppNotification[] = [];
  const today = toISO(now);

  for (const t of tasks) {
    if (t.done || !t.due_date) continue;
    const b = bucketFor(t.due_date, now);
    if (!b) continue;
    out.push({
      id: `task:${t.id}:${t.due_date}`,
      kind: "task",
      mod: "tasks",
      title: t.title,
      body: `Task • ${b.label}`,
      severity: b.severity,
      at: t.due_date,
      to: "/tasks",
    });
  }

  for (const e of events) {
    const start = new Date(e.starts_at).getTime();
    const end = new Date(e.ends_at).getTime();
    const t = now.getTime();
    let severity: NotifSeverity | null = null;
    let body = "";
    if (t >= start && t <= end) {
      severity = "today";
      body = "Happening now";
    } else if (start > t && start - t <= 2 * 3600_000) {
      severity = "soon";
      body = `Starts in ${Math.max(1, Math.round((start - t) / 60_000))} min`;
    } else if (e.starts_at.slice(0, 10) === today) {
      severity = "today";
      body = "Today";
    }
    if (!severity) continue;
    out.push({
      id: `event:${e.id}:${e.starts_at}`,
      kind: "event",
      mod: "calendar",
      title: e.title,
      body: `Event • ${body}`,
      severity,
      at: e.starts_at,
      to: "/calendar",
    });
  }

  for (const a of assessments) {
    if (a.done || !a.due_date) continue;
    const b = bucketFor(a.due_date, now);
    if (!b) continue;
    out.push({
      id: `assessment:${a.id}:${a.due_date}`,
      kind: "assessment",
      mod: "academics",
      title: a.title,
      body: `${a.kind} • ${b.label}`,
      severity: b.severity,
      at: a.due_date,
      to: "/academics",
    });
  }

  for (const m of milestones) {
    if (m.done || !m.due_date) continue;
    const b = bucketFor(m.due_date, now);
    if (!b) continue;
    out.push({
      id: `milestone:${m.id}:${m.due_date}`,
      kind: "milestone",
      mod: "projects",
      title: m.title,
      body: `Milestone • ${b.label}`,
      severity: b.severity,
      at: m.due_date,
      to: "/projects",
    });
  }

  for (const g of goals) {
    if (!g.target_date) continue;
    const b = bucketFor(g.target_date, now);
    if (!b) continue;
    out.push({
      id: `goal:${g.id}:${g.target_date}`,
      kind: "goal",
      mod: "goals",
      title: g.title,
      body: `Goal target • ${b.label}`,
      severity: b.severity,
      at: g.target_date,
      to: "/goals",
    });
  }

  for (const p of projects) {
    if (!p.deadline || ["done", "completed", "archived"].includes(p.status)) continue;
    const b = bucketFor(p.deadline, now);
    if (!b) continue;
    out.push({
      id: `project:${p.id}:${p.deadline}`,
      kind: "project",
      mod: "projects",
      title: p.title,
      body: `Project deadline • ${b.label}`,
      severity: b.severity,
      at: p.deadline,
      to: "/projects",
    });
  }

  if (habits.length > 0 && now.getHours() >= 12) {
    const checkedIds = new Set(
      habitLogs.filter((l) => l.log_date === today).map((l) => l.habit_id),
    );
    const pending = habits.filter((h) => !checkedIds.has(h.id));
    if (pending.length > 0) {
      out.push({
        id: `habit:today:${today}`,
        kind: "habit",
        mod: "habits",
        title: "Habit check-in",
        body:
          pending.length === habits.length
            ? "No habits checked in yet today"
            : `${pending.length} habit${pending.length === 1 ? "" : "s"} still to check in`,
        severity: "today",
        at: today,
        to: "/habits",
      });
    }
  }

  const ws = weekStart(today);
  const weekday = new Date(today + "T00:00").getDay();
  if ((weekday === 0 || weekday === 6) && !reviews.some((r) => r.week_start === ws)) {
    out.push({
      id: `review:${ws}`,
      kind: "review",
      mod: "review",
      title: "Weekly review",
      body: "Take ten minutes to reflect and plan the week ahead",
      severity: "soon",
      at: addDays(ws, 6),
      to: "/review",
    });
  }

  const rank: Record<NotifSeverity, number> = { overdue: 0, today: 1, soon: 2 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity] || a.at.localeCompare(b.at));
}

function loadIds(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as string[];
    // One-time migration from the pre-rename "Daylight" keys.
    const legacyKey = key.replace(/^ordo:/, "daylight:");
    const legacy = window.localStorage.getItem(legacyKey);
    if (legacy) {
      window.localStorage.setItem(key, legacy);
      window.localStorage.removeItem(legacyKey);
      return JSON.parse(legacy) as string[];
    }
    return [];
  } catch {
    return [];
  }
}

function saveIds(key: string, ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(ids.slice(-500)));
  } catch {
    /* ignore quota / privacy errors */
  }
}

export function browserPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function requestBrowserPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.requestPermission();
}

function showBrowserNotifications(items: AppNotification[]) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  const shown = new Set(loadIds(NOTIFIED_KEY));
  const fresh = items
    .filter((n) => n.severity !== "soon" && !shown.has(n.id))
    .slice(0, MAX_BROWSER_PER_RUN);
  if (fresh.length === 0) return;
  for (const n of fresh) {
    try {
      new Notification(`${n.title}`, { body: n.body, tag: n.id });
    } catch {
      /* browser refused; stop trying this round */
      break;
    }
    shown.add(n.id);
  }
  saveIds(NOTIFIED_KEY, Array.from(shown));
}

export function useReminders(enabled: string[]) {
  const { data: tasks = [] } = useRows("tasks");
  const { data: events = [] } = useRows("events");
  const { data: assessments = [] } = useRows("assessments");
  const { data: milestones = [] } = useRows("milestones");
  const { data: goals = [] } = useRows("goals");
  const { data: projects = [] } = useRows("projects");
  const { data: habits = [] } = useRows("habits");
  const { data: habitLogs = [] } = useRows("habit_logs");
  const { data: reviews = [] } = useRows("weekly_reviews");

  const [dismissed, setDismissed] = useState<string[]>(() => loadIds(DISMISSED_KEY));
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const all = useMemo(
    () =>
      buildNotifications({
        tasks,
        events,
        assessments,
        milestones,
        goals,
        projects,
        habits,
        habitLogs,
        reviews,
        now,
      }),
    [tasks, events, assessments, milestones, goals, projects, habits, habitLogs, reviews, now],
  );

  const visible = useMemo(
    () => all.filter((n) => enabled.includes(n.mod) && !dismissed.includes(n.id)),
    [all, enabled, dismissed],
  );

  useEffect(() => {
    showBrowserNotifications(visible);
  }, [visible]);

  function dismiss(id: string) {
    setDismissed((prev) => {
      const next = Array.from(new Set([...prev, id]));
      saveIds(DISMISSED_KEY, next);
      return next;
    });
  }

  function dismissAll() {
    setDismissed((prev) => {
      const next = Array.from(new Set([...prev, ...visible.map((n) => n.id)]));
      saveIds(DISMISSED_KEY, next);
      return next;
    });
  }

  return { notifications: visible, count: visible.length, dismiss, dismissAll };
}

export type Reminders = ReturnType<typeof useReminders>;
