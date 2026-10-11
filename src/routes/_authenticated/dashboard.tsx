import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, CheckSquare, Flame, Target, Wallet, BookOpen } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { addDays, fmtDate, fmtTime, inr, todayISO, toISO, useProfile, useRows, useTableMutations } from "@/lib/data";
import { streak } from "./habits";
import { goalProgress } from "./goals";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Today — Daylight" }, { name: "description", content: "Your day at a glance." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: profile } = useProfile();
  const { data: tasks = [] } = useRows("tasks");
  const { data: habits = [] } = useRows("habits");
  const { data: logs = [] } = useRows("habit_logs");
  const { data: entries = [] } = useRows("journal_entries");
  const { data: txns = [] } = useRows("transactions");
  const { data: goals = [] } = useRows("goals");
  const { data: events = [] } = useRows("events");
  const { data: milestones = [] } = useRows("milestones");
  const { data: projects = [] } = useRows("projects");
  const { data: assessments = [] } = useRows("assessments");
  const taskM = useTableMutations("tasks");
  const logM = useTableMutations("habit_logs");
  const today = todayISO();
  const week = addDays(today, 7);
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const due = tasks.filter((t) => !t.done && t.due_date && t.due_date <= today).sort((a, b) => a.due_date!.localeCompare(b.due_date!));
  const todayEvents = events.filter((e) => toISO(new Date(e.starts_at)) === today);
  const upcoming = [
    ...tasks.filter((t) => !t.done && t.due_date && t.due_date > today && t.due_date <= week).map((t) => ({ id: t.id, d: t.due_date!, l: t.title, k: "Task" })),
    ...milestones.filter((m) => !m.done && m.due_date && m.due_date > today && m.due_date <= week).map((m) => ({ id: m.id, d: m.due_date!, l: m.title, k: "Milestone" })),
    ...projects.filter((p) => p.deadline && p.status !== "done" && p.deadline > today && p.deadline <= week).map((p) => ({ id: p.id, d: p.deadline!, l: p.title, k: "Deadline" })),
    ...assessments.filter((a) => !a.done && a.due_date && a.due_date > today && a.due_date <= week).map((a) => ({ id: a.id, d: a.due_date!, l: a.title, k: a.kind === "exam" ? "Exam" : "Assignment" })),
    ...events.filter((e) => { const d = toISO(new Date(e.starts_at)); return d > today && d <= week; }).map((e) => ({ id: e.id, d: toISO(new Date(e.starts_at)), l: e.title, k: fmtTime(e.starts_at) })),
    ...goals.filter((g) => g.target_date && g.target_date >= today && g.target_date <= addDays(today, 30)).map((g) => ({ id: g.id, d: g.target_date!, l: g.title, k: "Goal target" })),
  ].sort((a, b) => a.d.localeCompare(b.d));
  const spent = txns.filter((t) => t.kind === "expense" && t.txn_date.startsWith(today.slice(0, 7))).reduce((s, t) => s + Number(t.amount), 0);
  const wroteToday = entries.some((e) => e.entry_date === today);
  const checked = habits.filter((h) => logs.some((l) => l.habit_id === h.id && l.log_date === today)).length;

  return (
    <>
      <p className="text-sm font-medium text-primary">{fmtDate(today, { weekday: "long", day: "numeric", month: "long" })}</p>
      <h1 className="mb-8 font-heading text-3xl font-bold tracking-tight">{greet}{profile?.display_name ? `, ${profile.display_name}` : ""}.</h1>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Panel title="Today's priorities" icon={CheckSquare} to="/tasks" meta={`${due.length} due`}>
            {due.length === 0 && todayEvents.length === 0 ? <p className="text-sm text-muted-foreground">Nothing due today. Pick one task that would make tomorrow easier.</p> : (
              <ul className="divide-y divide-border">
                {todayEvents.map((e) => <li key={e.id} className="flex items-center gap-3 py-2 text-sm"><span className="w-20 text-xs text-muted-foreground">{fmtTime(e.starts_at)}</span><span className="font-medium">{e.title}</span></li>)}
                {due.slice(0, 8).map((t) => (
                  <li key={t.id} className="flex items-center gap-3 py-2">
                    <Checkbox aria-label={`Complete ${t.title}`} onCheckedChange={() => taskM.update.mutate({ id: t.id, values: { done: true } })} />
                    <span className="text-sm">{t.title}</span>
                    {t.due_date! < today && <span className="ml-auto rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">Overdue</span>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Habit check-ins" icon={Flame} to="/habits" meta={habits.length ? `${checked}/${habits.length} done` : undefined}>
            {habits.length === 0 ? <p className="text-sm text-muted-foreground">Add a habit to start a streak.</p> : (
              <div className="flex flex-wrap gap-2">
                {habits.map((h) => {
                  const log = logs.find((l) => l.habit_id === h.id && l.log_date === today);
                  return (
                    <button key={h.id} aria-pressed={!!log}
                      onClick={() => (log ? logM.remove.mutate(log.id) : logM.insert.mutate({ habit_id: h.id, log_date: today }))}
                      className={`rounded-full border px-3 py-1.5 text-sm transition active:scale-95 ${log ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"}`}>
                      {log ? "✓ " : ""}{h.name} · {streak(h.id, logs)}d
                    </button>
                  );
                })}
              </div>
            )}
          </Panel>
          <Panel title="Goal progress" icon={Target} to="/goals">
            {goals.length === 0 ? <p className="text-sm text-muted-foreground">No goals yet — set one to give your tasks direction.</p> : goals.slice(0, 4).map((g) => {
              const pct = goalProgress(g, tasks, projects, milestones);
              return (
                <div key={g.id} className="py-1.5">
                  <div className="flex justify-between text-sm"><span>{g.title}</span><span className="font-medium">{pct}%</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Coming up" icon={CalendarDays} to="/calendar" meta="next 7 days">
            {upcoming.length === 0 ? <p className="text-sm text-muted-foreground">A clear week ahead.</p> : (
              <ul className="space-y-2">
                {upcoming.slice(0, 8).map((u) => (
                  <li key={u.k + u.id} className="flex items-baseline gap-3 text-sm">
                    <span className="w-14 shrink-0 text-xs font-semibold text-primary">{fmtDate(u.d, { weekday: "short", day: "numeric" })}</span>
                    <span className="min-w-0 flex-1 truncate">{u.l}</span>
                    <span className="text-xs text-muted-foreground">{u.k}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/finance" className="rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40">
              <Wallet className="mb-2 h-4 w-4 text-primary" />
              <p className="font-heading text-xl font-bold">{inr(spent)}</p>
              <p className="text-xs text-muted-foreground">spent this month</p>
            </Link>
            <Link to="/journal" className="rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40">
              <BookOpen className="mb-2 h-4 w-4 text-primary" />
              <p className="font-heading text-xl font-bold">{wroteToday ? "Written ✓" : "Not yet"}</p>
              <p className="text-xs text-muted-foreground">journal today</p>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function Panel({ title, icon: Icon, to, meta, children }: { title: string; icon: typeof Flame; to: "/tasks" | "/habits" | "/goals" | "/calendar"; meta?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-heading font-semibold"><Icon className="h-4 w-4 text-primary" />{title}{meta && <span className="text-xs font-normal text-muted-foreground">· {meta}</span>}</h2>
        <Link to={to} className="text-xs font-medium text-primary hover:underline">Open →</Link>
      </div>
      {children}
    </section>
  );
}
