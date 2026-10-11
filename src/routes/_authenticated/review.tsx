import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Section } from "@/components/PageHeader";
import { addDays, fmtDate, hoursBetween, todayISO, toISO, useRows, useTableMutations, weekStart } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/review")({
  head: () => ({ meta: [{ title: "Weekly Review — Daylight" }, { name: "description", content: "Reflect on wins, obstacles and next week's priorities." }] }),
  component: Review,
});

const prompts = [
  ["wins", "Wins", "What went well? What are you proud of?"],
  ["obstacles", "Obstacles", "What got in the way?"],
  ["progress", "Progress", "Where did you move closer to your goals?"],
  ["priorities", "Next week's priorities", "Top 3 things that matter most"],
] as const;

function Review() {
  const [ws, setWs] = useState(weekStart(todayISO()));
  const we = addDays(ws, 7);
  const { data: reviews = [] } = useRows("weekly_reviews");
  const { data: tasks = [] } = useRows("tasks");
  const { data: events = [] } = useRows("events");
  const { data: projects = [] } = useRows("projects");
  const { data: logs = [] } = useRows("habit_logs");
  const { data: habits = [] } = useRows("habits");
  const { data: goals = [] } = useRows("goals");
  const m = useTableMutations("weekly_reviews");
  const existing = reviews.find((r) => r.week_start === ws);
  const [vals, setVals] = useState<Record<string, string>>({});
  useEffect(() => setVals({ wins: existing?.wins ?? "", obstacles: existing?.obstacles ?? "", progress: existing?.progress ?? "", priorities: existing?.priorities ?? "" }), [existing?.id, ws]); // eslint-disable-line react-hooks/exhaustive-deps

  const inWeek = (iso: string) => iso >= ws && iso < we;
  const doneTasks = tasks.filter((t) => t.done && inWeek(t.updated_at.slice(0, 10)));
  const weekEvents = events.filter((e) => inWeek(toISO(new Date(e.starts_at))));
  const hours = weekEvents.reduce((s, e) => s + hoursBetween(e.starts_at, e.ends_at), 0);
  const byProject = Object.entries(weekEvents.reduce<Record<string, number>>((a, e) => {
    const p = projects.find((x) => x.id === e.project_id);
    const k = p ? `${p.title} (${p.area})` : "Not linked to a project";
    a[k] = (a[k] ?? 0) + hoursBetween(e.starts_at, e.ends_at);
    return a;
  }, {})).sort((a, b) => b[1] - a[1]);
  const goalTasks = doneTasks.filter((t) => t.goal_id).length;
  const checkins = logs.filter((l) => inWeek(l.log_date)).length;

  function save() {
    const v = Object.fromEntries(Object.entries(vals).map(([k, x]) => [k, x.trim() || null]));
    existing ? m.update.mutate({ id: existing.id, values: v }) : m.insert.mutate({ week_start: ws, ...v } as any);
  }

  return (
    <>
      <PageHeader title="Weekly Review" subtitle="Ten quiet minutes to look back and plan ahead." />
      <div className="mb-6 flex items-center gap-2">
        <Button size="icon" variant="outline" aria-label="Previous week" onClick={() => setWs(addDays(ws, -7))}><ChevronLeft className="h-4 w-4" /></Button>
        <p className="min-w-48 text-center font-heading font-semibold">{fmtDate(ws)} – {fmtDate(addDays(ws, 6))}</p>
        <Button size="icon" variant="outline" aria-label="Next week" onClick={() => setWs(addDays(ws, 7))}><ChevronRight className="h-4 w-4" /></Button>
      </div>
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["Tasks done", doneTasks.length], ["…toward a goal", goalTasks], ["Hours planned", hours.toFixed(1)], ["Habit check-ins", `${checkins}/${habits.length * 7}`]].map(([l, v]) => (
          <div key={l} className="rounded-2xl border border-border bg-card p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">{l}</p><p className="font-heading text-2xl font-bold">{v}</p></div>
        ))}
      </div>
      {byProject.length > 0 && (
        <Section title="Where your scheduled time went">
          <div className="space-y-2 rounded-2xl border border-border bg-card p-5">
            {byProject.map(([k, h]) => (
              <div key={k}><div className="flex justify-between text-sm"><span>{k}</span><span>{h.toFixed(1)}h · {Math.round((h / hours) * 100)}%</span></div>
                <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${(h / hours) * 100}%` }} /></div></div>
            ))}
            {goals.length > 0 && <p className="pt-2 text-xs text-muted-foreground">{goalTasks} of {doneTasks.length} completed tasks were linked to one of your {goals.length} goals.</p>}
          </div>
        </Section>
      )}
      <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
        {prompts.map(([k, l, ph]) => (
          <div key={k} className="space-y-1.5">
            <Label htmlFor={k}>{l}</Label>
            <Textarea id={k} rows={3} maxLength={1000} placeholder={ph} value={vals[k] ?? ""} onChange={(e) => setVals({ ...vals, [k]: e.target.value })} />
          </div>
        ))}
        <div className="flex justify-end"><Button onClick={save}>{existing ? "Update review" : "Save review"}</Button></div>
      </div>
      {reviews.length > 0 && (
        <Section title="Past reviews" count={reviews.length} className="mt-8">
          <div className="flex flex-wrap gap-2">{reviews.map((r) => <Button key={r.id} size="sm" variant={r.week_start === ws ? "default" : "outline"} onClick={() => setWs(r.week_start)}>Week of {fmtDate(r.week_start)}</Button>)}</div>
        </Section>
      )}
    </>
  );
}
