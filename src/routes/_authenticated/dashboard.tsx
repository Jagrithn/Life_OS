import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, CheckSquare, Flame, Target, Wallet } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { inr, todayISO, useRows, useTableMutations } from "@/lib/data";
import { streak } from "./habits";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Today — Daylight" }, { name: "description", content: "Your day at a glance." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle()).data,
  });
  const { data: tasks = [] } = useRows("tasks");
  const { data: habits = [] } = useRows("habits");
  const { data: logs = [] } = useRows("habit_logs");
  const { data: entries = [] } = useRows("journal_entries");
  const { data: txns = [] } = useRows("transactions");
  const { data: goals = [] } = useRows("goals");
  const taskM = useTableMutations("tasks");
  const logM = useTableMutations("habit_logs");
  const today = todayISO();
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const due = tasks.filter((t) => !t.done && t.due_date && t.due_date <= today).slice(0, 6);
  const spent = txns.filter((t) => t.kind === "expense" && t.txn_date.startsWith(today.slice(0, 7))).reduce((s, t) => s + Number(t.amount), 0);
  const wroteToday = entries.some((e) => e.entry_date === today);

  return (
    <>
      <h1 className="font-heading text-2xl font-bold sm:text-3xl">{greet}{profile?.display_name ? `, ${profile.display_name}` : ""}.</h1>
      <p className="mb-8 text-muted-foreground">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Due today" icon={CheckSquare} to="/tasks">
          {due.length === 0 ? <p className="text-sm text-muted-foreground">Nothing due. Nice.</p> : due.map((t) => (
            <label key={t.id} className="flex items-center gap-3 py-1.5">
              <Checkbox onCheckedChange={() => taskM.update.mutate({ id: t.id, values: { done: true } })} />
              <span className="text-sm">{t.title}</span>
              {t.due_date! < today && <span className="ml-auto text-xs text-destructive">overdue</span>}
            </label>
          ))}
        </Card>

        <Card title="Habits today" icon={Flame} to="/habits">
          {habits.length === 0 ? <p className="text-sm text-muted-foreground">Add a habit to start a streak.</p> : (
            <div className="flex flex-wrap gap-2">
              {habits.map((h) => {
                const log = logs.find((l) => l.habit_id === h.id && l.log_date === today);
                return (
                  <button
                    key={h.id}
                    onClick={() => (log ? logM.remove.mutate(log.id) : logM.insert.mutate({ habit_id: h.id, log_date: today }))}
                    className={`rounded-full border px-3 py-1.5 text-sm ${log ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"}`}
                  >
                    {h.name} · {streak(h.id, logs)}🔥
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Journal" icon={BookOpen} to="/journal">
          <p className="text-sm text-muted-foreground">{wroteToday ? "You've written today. ✓" : "You haven't written today yet."}</p>
          {entries[0] && <p className="mt-2 line-clamp-2 text-sm">{entries[0].content}</p>}
        </Card>

        <Card title="Money this month" icon={Wallet} to="/finance">
          <p className="font-heading text-2xl font-bold">{inr(spent)}</p>
          <p className="text-sm text-muted-foreground">spent so far</p>
        </Card>

        <Card title="Goals" icon={Target} to="/goals" wide>
          {goals.length === 0 ? <p className="text-sm text-muted-foreground">No goals yet.</p> : goals.slice(0, 4).map((g) => (
            <div key={g.id} className="py-1.5">
              <div className="flex justify-between text-sm"><span>{g.title}</span><span>{g.progress}%</span></div>
              <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${g.progress}%` }} /></div>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}

function Card({ title, icon: Icon, to, wide, children }: { title: string; icon: typeof Flame; to: "/tasks" | "/habits" | "/journal" | "/finance" | "/goals"; wide?: boolean; children: React.ReactNode }) {
  return (
    <section className={`rounded-2xl border border-border bg-card p-5 ${wide ? "lg:col-span-2" : ""}`}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-heading font-semibold"><Icon className="h-4 w-4 text-primary" />{title}</h2>
        <Link to={to} className="text-xs text-primary hover:underline">Open</Link>
      </div>
      {children}
    </section>
  );
}
