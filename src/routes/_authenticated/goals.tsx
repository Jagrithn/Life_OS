import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Empty, PageHeader, Section } from "@/components/PageHeader";
import { EditDialog, useEditor, type Field } from "@/components/EditDialog";
import { fmtDate, useRows, useTableMutations, type Row } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({ meta: [{ title: "Goals — Daylight" }, { name: "description", content: "Short- and long-term goals linked to projects and tasks." }] }),
  component: Goals,
});

const fields: Field[] = [
  { name: "title", label: "Goal", required: true, max: 120 },
  { name: "description", label: "Why it matters", type: "textarea", max: 500 },
  { name: "horizon", label: "Horizon", type: "select", options: [{ value: "short", label: "Short-term (weeks to months)" }, { value: "long", label: "Long-term (a year or more)" }] },
  { name: "target_date", label: "Target date", type: "date" },
  { name: "progress_mode", label: "Progress", type: "select", options: [{ value: "manual", label: "I set it manually" }, { value: "auto", label: "Automatic from linked tasks & milestones" }] },
];

/** Progress for a goal: manual value, or % of linked tasks + milestones done. */
export function goalProgress(g: Row<"goals">, tasks: Row<"tasks">[], projects: Row<"projects">[], milestones: Row<"milestones">[]) {
  if (g.progress_mode !== "auto") return g.progress;
  const projIds = new Set(projects.filter((p) => p.goal_id === g.id).map((p) => p.id));
  const items = [
    ...tasks.filter((t) => t.goal_id === g.id || (t.project_id && projIds.has(t.project_id))).map((t) => t.done),
    ...milestones.filter((m) => projIds.has(m.project_id)).map((m) => m.done),
  ];
  return items.length ? Math.round((items.filter(Boolean).length / items.length) * 100) : 0;
}

function Goals() {
  const { data: goals = [] } = useRows("goals");
  const { data: tasks = [] } = useRows("tasks");
  const { data: projects = [] } = useRows("projects");
  const { data: milestones = [] } = useRows("milestones");
  const { insert, update, remove } = useTableMutations("goals");
  const ed = useEditor<Row<"goals">>();

  const card = (g: Row<"goals">) => {
    const linked = tasks.filter((t) => t.goal_id === g.id);
    const projs = projects.filter((p) => p.goal_id === g.id);
    const pct = goalProgress(g, tasks, projects, milestones);
    return (
      <div key={g.id} className="rounded-2xl border border-border bg-card p-5">
        <button className="block w-full text-left" onClick={() => ed.openEdit(g)}>
          <p className="font-heading text-lg font-semibold">{g.title}</p>
          {g.description && <p className="mt-1 text-sm text-muted-foreground">{g.description}</p>}
        </button>
        <div className="mt-4 flex items-center gap-3">
          {g.progress_mode === "auto" ? (
            <div className="h-2 flex-1 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} /></div>
          ) : (
            <Slider aria-label="Progress" defaultValue={[g.progress]} max={100} step={5} onValueCommit={(v) => update.mutate({ id: g.id, values: { progress: v[0] ?? 0 } })} />
          )}
          <span className="w-12 text-right text-sm font-semibold">{pct}%</span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {g.progress_mode === "auto" ? "Auto" : "Manual"} · {projs.length} project{projs.length === 1 ? "" : "s"} · {linked.filter((t) => t.done).length}/{linked.length} tasks
          {g.target_date && ` · by ${fmtDate(g.target_date, { day: "numeric", month: "short", year: "numeric" })}`}
        </p>
        {(projs.length > 0 || linked.length > 0) && (
          <ul className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
            {projs.map((p) => <li key={p.id}>▸ {p.title} <span className="text-xs text-muted-foreground">({p.status})</span></li>)}
            {linked.slice(0, 5).map((t) => <li key={t.id} className={t.done ? "text-muted-foreground line-through" : ""}>• {t.title}</li>)}
          </ul>
        )}
      </div>
    );
  };

  const short = goals.filter((g) => g.horizon === "short");
  const long = goals.filter((g) => g.horizon !== "short");
  return (
    <>
      <PageHeader title="Goals" subtitle="Where you're headed — and what gets you there.">
        <Button onClick={() => ed.openNew({ horizon: "short", progress_mode: "manual" })}><Plus className="h-4 w-4" /> New goal</Button>
      </PageHeader>
      {goals.length === 0 ? (
        <Empty title="No goals yet" action={<Button onClick={() => ed.openNew()}>Set a goal</Button>}>
          Goals describe outcomes you care about. Link projects and tasks to them so daily work adds up — progress can update automatically.
        </Empty>
      ) : (
        <>
          {short.length > 0 && <Section title="Short-term" count={short.length}><div className="grid gap-4 md:grid-cols-2">{short.map(card)}</div></Section>}
          {long.length > 0 && <Section title="Long-term" count={long.length}><div className="grid gap-4 md:grid-cols-2">{long.map(card)}</div></Section>}
        </>
      )}
      <EditDialog
        open={ed.open}
        onOpenChange={ed.setOpen}
        title={ed.item ? "Edit goal" : "New goal"}
        fields={fields}
        initial={ed.item ?? ed.preset}
        onSave={(v) => (ed.item ? update.mutate({ id: ed.item.id, values: v }) : insert.mutate(v as any))}
        onDelete={ed.item ? () => remove.mutate(ed.item!.id) : undefined}
      />
    </>
  );
}
