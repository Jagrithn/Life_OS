import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Empty, PageHeader } from "@/components/PageHeader";
import { todayISO, useRows, useTableMutations } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({ meta: [{ title: "Tasks — Daylight" }, { name: "description", content: "Capture and finish your tasks." }] }),
  component: Tasks,
});

const prioColor = { high: "bg-destructive/10 text-destructive", medium: "bg-accent text-accent-foreground", low: "bg-muted text-muted-foreground" };

function Tasks() {
  const { data: tasks = [] } = useRows("tasks");
  const { data: goals = [] } = useRows("goals");
  const { insert, update, remove } = useTableMutations("tasks");
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState("medium");
  const [goal, setGoal] = useState("none");
  const [filter, setFilter] = useState<"open" | "today" | "done">("open");
  const today = todayISO();

  const shown = tasks.filter((t) =>
    filter === "done" ? t.done : filter === "today" ? !t.done && t.due_date && t.due_date <= today : !t.done,
  );

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    insert.mutate({ title: title.trim(), due_date: due || null, priority, goal_id: goal === "none" ? null : goal });
    setTitle("");
    setDue("");
  }

  return (
    <>
      <PageHeader title="Tasks" subtitle={`${tasks.filter((t) => !t.done).length} open`} />
      <form onSubmit={add} className="mb-6 grid gap-2 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_auto_auto_auto_auto]">
        <Input placeholder="What needs doing?" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="sm:w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={goal} onValueChange={setGoal}>
          <SelectTrigger className="sm:w-36"><SelectValue placeholder="Goal" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No goal</SelectItem>
            {goals.map((g) => <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button type="submit">Add</Button>
      </form>
      <div className="mb-4 flex gap-2">
        {(["open", "today", "done"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
            {f === "open" ? "Open" : f === "today" ? "Due today" : "Done"}
          </Button>
        ))}
      </div>
      {shown.length === 0 ? <Empty>Nothing here. Enjoy the calm.</Empty> : (
        <ul className="space-y-2">
          {shown.map((t) => (
            <li key={t.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <Checkbox checked={t.done} onCheckedChange={(v) => update.mutate({ id: t.id, values: { done: !!v } })} />
              <div className="min-w-0 flex-1">
                <p className={t.done ? "text-muted-foreground line-through" : "font-medium"}>{t.title}</p>
                <p className="text-xs text-muted-foreground">
                  {t.due_date && <span className={!t.done && t.due_date < today ? "text-destructive" : ""}>Due {t.due_date}</span>}
                  {t.goal_id && <span> · {goals.find((g) => g.id === t.goal_id)?.title}</span>}
                </p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs ${prioColor[t.priority as keyof typeof prioColor]}`}>{t.priority}</span>
              <Button size="icon" variant="ghost" onClick={() => remove.mutate(t.id)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
