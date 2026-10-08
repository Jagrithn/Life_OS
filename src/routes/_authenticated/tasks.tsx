import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDown, ArrowUp, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, PageHeader, Section } from "@/components/PageHeader";
import { EditDialog, useEditor, type Field } from "@/components/EditDialog";
import { addDays, fmtDate, todayISO, useRows, useTableMutations, type Row } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({ meta: [{ title: "Tasks — Daylight" }, { name: "description", content: "Capture, plan and finish your tasks." }] }),
  component: Tasks,
});

export const prio = {
  high: { label: "High", icon: ArrowUp, cls: "bg-destructive/10 text-destructive" },
  medium: { label: "Medium", icon: Minus, cls: "bg-accent text-accent-foreground" },
  low: { label: "Low", icon: ArrowDown, cls: "bg-muted text-muted-foreground" },
} as const;

export function taskFields(goals: Row<"goals">[], projects: Row<"projects">[]): Field[] {
  return [
    { name: "title", label: "Task", required: true, max: 200 },
    { name: "due_date", label: "Due date", type: "date" },
    { name: "priority", label: "Priority", type: "select", options: [{ value: "medium", label: "Medium" }, { value: "high", label: "High" }, { value: "low", label: "Low" }] },
    { name: "goal_id", label: "Goal", type: "select", nullable: true, options: goals.map((g) => ({ value: g.id, label: g.title })) },
    { name: "project_id", label: "Project", type: "select", nullable: true, options: projects.map((p) => ({ value: p.id, label: p.title })) },
  ];
}

function Tasks() {
  const { data: tasks = [] } = useRows("tasks");
  const { data: goals = [] } = useRows("goals");
  const { data: projects = [] } = useRows("projects");
  const { insert, update } = useTableMutations("tasks");
  const m = useTableMutations("tasks");
  const ed = useEditor<Row<"tasks">>();
  const [title, setTitle] = useState("");
  const [showDone, setShowDone] = useState(false);
  const today = todayISO();
  const week = addDays(today, 7);

  const open = tasks.filter((t) => !t.done);
  const groups: [string, Row<"tasks">[]][] = [
    ["Overdue", open.filter((t) => t.due_date && t.due_date < today)],
    ["Today", open.filter((t) => t.due_date === today)],
    ["Next 7 days", open.filter((t) => t.due_date && t.due_date > today && t.due_date <= week)],
    ["Later", open.filter((t) => t.due_date && t.due_date > week)],
    ["No date", open.filter((t) => !t.due_date)],
  ];
  const done = tasks.filter((t) => t.done);

  function Item({ t }: { t: Row<"tasks"> }) {
    const p = prio[t.priority as keyof typeof prio] ?? prio.medium;
    const goal = goals.find((g) => g.id === t.goal_id);
    const proj = projects.find((x) => x.id === t.project_id);
    return (
      <li className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/50">
        <Checkbox aria-label={`Complete ${t.title}`} checked={t.done} onCheckedChange={(v) => update.mutate({ id: t.id, values: { done: !!v } })} />
        <button className="min-w-0 flex-1 text-left focus-visible:outline-none" onClick={() => ed.openEdit(t)}>
          <p className={t.done ? "text-muted-foreground line-through" : "font-medium"}>{t.title}</p>
          <p className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
            {t.due_date && <span className={!t.done && t.due_date < today ? "font-medium text-destructive" : ""}>{t.due_date < today && !t.done ? "Overdue · " : ""}{fmtDate(t.due_date, { weekday: "short", day: "numeric", month: "short" })}</span>}
            {goal && <span>◎ {goal.title}</span>}
            {proj && <span>▸ {proj.title}</span>}
          </p>
        </button>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${p.cls}`}><p.icon className="h-3 w-3" />{p.label}</span>
      </li>
    );
  }

  return (
    <>
      <PageHeader title="Tasks" subtitle={`${open.length} open · ${groups[0]![1].length} overdue`}>
        <Button onClick={() => ed.openNew()}><Plus className="h-4 w-4" /> New task</Button>
      </PageHeader>
      <form
        onSubmit={(e) => { e.preventDefault(); if (title.trim()) { insert.mutate({ title: title.trim() }); setTitle(""); } }}
        className="mb-8 flex gap-2"
      >
        <Input placeholder="Quick add — type a task and press Enter" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 bg-card" />
        <Button type="submit" variant="secondary" className="h-11">Add</Button>
      </form>
      {open.length === 0 ? (
        <Empty title="Your task list is clear" action={<Button onClick={() => ed.openNew()}>Add a task</Button>}>
          Tasks are the small actions that move your days, projects and goals forward. Add one with a due date to see it on Home and your calendar.
        </Empty>
      ) : groups.filter(([, l]) => l.length).map(([name, list]) => (
        <Section key={name} title={name} count={list.length}>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">{list.map((t) => <Item key={t.id} t={t} />)}</ul>
        </Section>
      ))}
      {done.length > 0 && (
        <Section title="Completed" count={done.length} action={<Button size="sm" variant="ghost" onClick={() => setShowDone(!showDone)}>{showDone ? "Hide" : "Show"}</Button>}>
          {showDone && <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">{done.map((t) => <Item key={t.id} t={t} />)}</ul>}
        </Section>
      )}
      <EditDialog
        open={ed.open}
        onOpenChange={ed.setOpen}
        title={ed.item ? "Edit task" : "New task"}
        fields={taskFields(goals, projects)}
        initial={ed.item}
        onSave={(v) => (ed.item ? m.update.mutate({ id: ed.item.id, values: v }) : m.insert.mutate(v as any))}
        onDelete={ed.item ? () => m.remove.mutate(ed.item!.id) : undefined}
      />
    </>
  );
}
