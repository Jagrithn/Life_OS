import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Flame, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Empty, PageHeader } from "@/components/PageHeader";
import { todayISO, useRows, useTableMutations, type Row } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/habits")({
  head: () => ({ meta: [{ title: "Habits — Daylight" }, { name: "description", content: "Build streaks, one day at a time." }] }),
  component: Habits,
});

function lastDays(n: number) {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10));
  }
  return out;
}

export function streak(habitId: string, logs: Row<"habit_logs">[]) {
  const set = new Set(logs.filter((l) => l.habit_id === habitId).map((l) => l.log_date));
  const days = lastDays(366).reverse();
  let s = 0;
  for (let i = 0; i < days.length; i++) {
    if (set.has(days[i])) s++;
    else if (i === 0) continue;
    else break;
  }
  return s;
}

function Habits() {
  const { data: habits = [] } = useRows("habits");
  const { data: logs = [] } = useRows("habit_logs");
  const h = useTableMutations("habits");
  const l = useTableMutations("habit_logs");
  const [name, setName] = useState("");
  const days = lastDays(7);
  const today = todayISO();

  function toggle(habitId: string, date: string) {
    const existing = logs.find((x) => x.habit_id === habitId && x.log_date === date);
    if (existing) l.remove.mutate(existing.id);
    else l.insert.mutate({ habit_id: habitId, log_date: date });
  }

  return (
    <>
      <PageHeader title="Habits" subtitle="Tap a day to check it off." />
      <form
        onSubmit={(e) => { e.preventDefault(); if (name.trim()) { h.insert.mutate({ name: name.trim() }); setName(""); } }}
        className="mb-6 flex gap-2 rounded-xl border border-border bg-card p-4"
      >
        <Input placeholder="New habit, e.g. Read 20 minutes" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit">Add</Button>
      </form>
      {habits.length === 0 ? <Empty>No habits yet. Start with something small.</Empty> : (
        <div className="space-y-3">
          {habits.map((habit) => (
            <div key={habit.id} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-medium">{habit.name}</p>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-sm text-primary"><Flame className="h-4 w-4" />{streak(habit.id, logs)}</span>
                  <Button size="icon" variant="ghost" onClick={() => h.remove.mutate(habit.id)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {days.map((d) => {
                  const done = logs.some((x) => x.habit_id === habit.id && x.log_date === d);
                  return (
                    <button
                      key={d}
                      onClick={() => toggle(habit.id, d)}
                      className={`flex flex-col items-center rounded-lg border py-2 text-xs transition ${done ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"} ${d === today ? "ring-2 ring-ring/40" : ""}`}
                    >
                      {new Date(d + "T00:00").toLocaleDateString("en-IN", { weekday: "short" })}
                      {done ? <Check className="mt-1 h-4 w-4" /> : <span className="mt-1 h-4">{d.slice(8)}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
