import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Flame, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Empty, PageHeader } from "@/components/PageHeader";
import { EditDialog, useEditor } from "@/components/EditDialog";
import { fmtDate, todayISO, toISO, useRows, useTableMutations, type Row } from "@/lib/data";

export const Route = createFileRoute("/_app/habits")({
  head: () => ({
    meta: [
      { title: "Habits — Ordo" },
      { name: "description", content: "Build streaks and see your consistency over time." },
    ],
  }),
  component: Habits,
});

export function lastDays(n: number) {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(toISO(d));
  }
  return out;
}

export function streak(habitId: string, logs: Row<"habit_logs">[]) {
  const set = new Set(logs.filter((l) => l.habit_id === habitId).map((l) => l.log_date));
  const days = lastDays(366).reverse();
  let s = 0;
  for (let i = 0; i < days.length; i++) {
    if (set.has(days[i]!)) s++;
    else if (i === 0) continue;
    else break;
  }
  return s;
}

function Heatmap({ habitId, logs }: { habitId: string; logs: Row<"habit_logs">[] }) {
  const set = new Set(logs.filter((l) => l.habit_id === habitId).map((l) => l.log_date));
  // 12 weeks, aligned so the last column ends today
  const days = lastDays(84);
  const last30 = lastDays(30).filter((d) => set.has(d)).length;
  return (
    <div>
      <div
        className="grid grid-flow-col grid-rows-7 gap-[3px]"
        role="img"
        aria-label={`Done ${last30} of the last 30 days`}
      >
        {days.map((d) => (
          <div
            key={d}
            title={`${fmtDate(d)} — ${set.has(d) ? "done" : "not done"}`}
            className={`h-3 w-3 rounded-[3px] ${set.has(d) ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Last 12 weeks ·{" "}
        <span className="font-medium text-foreground">{last30} of the last 30 days</span>
      </p>
    </div>
  );
}

function Habits() {
  const { data: habits = [] } = useRows("habits");
  const { data: logs = [] } = useRows("habit_logs");
  const h = useTableMutations("habits");
  const l = useTableMutations("habit_logs");
  const ed = useEditor<Row<"habits">>();
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
      <PageHeader
        title="Habits"
        subtitle="Tap a day to check it off. Consistency beats intensity."
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) {
            h.insert.mutate({ name: name.trim() });
            setName("");
          }
        }}
        className="mb-8 flex gap-2"
      >
        <Input
          placeholder="New habit, e.g. Read 20 minutes"
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 bg-card"
        />
        <Button type="submit" className="h-11">
          Add habit
        </Button>
      </form>
      {habits.length === 0 ? (
        <Empty title="No habits yet">
          Habits are small things you want to do regularly. Start with one that takes under five
          minutes — you'll see a streak and a 12‑week history here.
        </Empty>
      ) : (
        <div className="space-y-4">
          {habits.map((habit) => (
            <div key={habit.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-heading font-semibold">{habit.name}</p>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-sm font-medium text-primary">
                    <Flame className="h-4 w-4" />
                    {streak(habit.id, logs)} day streak
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => ed.openEdit(habit)}
                    aria-label={`Edit ${habit.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
                <div className="grid grid-cols-7 gap-2">
                  {days.map((d) => {
                    const done = logs.some((x) => x.habit_id === habit.id && x.log_date === d);
                    return (
                      <button
                        key={d}
                        aria-pressed={done}
                        aria-label={`${fmtDate(d, { weekday: "long", day: "numeric", month: "short" })}: ${done ? "done" : "not done"}`}
                        onClick={() => toggle(habit.id, d)}
                        className={`flex flex-col items-center rounded-xl border py-2 text-xs transition active:scale-95 ${done ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"} ${d === today ? "ring-2 ring-ring/40" : ""}`}
                      >
                        {fmtDate(d, { weekday: "short" })}
                        {done ? (
                          <Check className="mt-1 h-4 w-4" />
                        ) : (
                          <span className="mt-1 h-4">{d.slice(8)}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <Heatmap habitId={habit.id} logs={logs} />
              </div>
            </div>
          ))}
        </div>
      )}
      <EditDialog
        open={ed.open}
        onOpenChange={ed.setOpen}
        title="Edit habit"
        fields={[{ name: "name", label: "Habit", required: true, max: 80 }]}
        initial={ed.item}
        onSave={(v) => ed.item && h.update.mutate({ id: ed.item.id, values: v })}
        onDelete={ed.item ? () => h.remove.mutate(ed.item!.id) : undefined}
      />
    </>
  );
}
