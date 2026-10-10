import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Flag, ListChecks, Pencil, Plus, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empty, PageHeader, Section } from "@/components/PageHeader";
import { EditDialog, useEditor, type Field } from "@/components/EditDialog";
import { addDays, fmtDate, todayISO, useRows, useTableMutations, type Row } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({ meta: [{ title: "Projects — Daylight" }, { name: "description", content: "Projects with outcomes, milestones and linked tasks." }] }),
  component: Projects,
});

export const AREAS = ["work", "study", "health", "personal", "family", "finance", "creative"];
const STATUSES = [["planning", "Planning"], ["active", "Active"], ["on_hold", "On hold"], ["done", "Done"]] as const;

/** Spread N steps evenly between today and a deadline (last step = deadline). */
export function breakdownDates(steps: number, deadline: string, today: string) {
  const span = Math.max(0, Math.round((new Date(deadline + "T00:00").getTime() - new Date(today + "T00:00").getTime()) / 86400000));
  return Array.from({ length: steps }, (_, i) => addDays(today, Math.round((span * (i + 1)) / steps)));
}

function Projects() {
  const { data: projects = [] } = useRows("projects");
  const { data: goals = [] } = useRows("goals");
  const { data: milestones = [] } = useRows("milestones");
  const { data: tasks = [] } = useRows("tasks");
  const pm = useTableMutations("projects");
  const mm = useTableMutations("milestones");
  const tm = useTableMutations("tasks");
  const ed = useEditor<Row<"projects">>();
  const med = useEditor<Row<"milestones">>();
  const [bd, setBd] = useState<Row<"projects"> | null>(null);
  const [steps, setSteps] = useState("");
  const [bdDeadline, setBdDeadline] = useState("");
  const [asTasks, setAsTasks] = useState(false);
  const today = todayISO();

  const fields: Field[] = [
    { name: "title", label: "Project", required: true, max: 120 },
    { name: "outcome", label: "Desired outcome", type: "textarea", max: 500, placeholder: "What does done look like?" },
    { name: "status", label: "Status", type: "select", options: STATUSES.map(([v, l]) => ({ value: v, label: l })) },
    { name: "area", label: "Life area", type: "select", options: AREAS.map((a) => ({ value: a, label: a[0]!.toUpperCase() + a.slice(1) })) },
    { name: "deadline", label: "Deadline", type: "date" },
    { name: "goal_id", label: "Goal it serves", type: "select", nullable: true, options: goals.map((g) => ({ value: g.id, label: g.title })) },
  ];

  function runBreakdown() {
    if (!bd) return;
    const list = steps.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 20);
    const dl = bdDeadline || bd.deadline;
    if (!list.length || !dl) return;
    const dates = breakdownDates(list.length, dl, today);
    if (asTasks) tm.insert.mutate(list.map((title, i) => ({ title: title.slice(0, 200), due_date: dates[i], project_id: bd.id, goal_id: bd.goal_id })) as any);
    else mm.insert.mutate(list.map((title, i) => ({ title: title.slice(0, 120), due_date: dates[i], project_id: bd.id })) as any);
    setBd(null);
    setSteps("");
  }

  const groups = STATUSES.map(([s, l]) => [l, projects.filter((p) => p.status === s)] as const).filter(([, l]) => l.length);

  return (
    <>
      <PageHeader title="Projects" subtitle="Outcomes broken into milestones and tasks.">
        <Button onClick={() => ed.openNew({ status: "active", area: "personal" })}><Plus className="h-4 w-4" /> New project</Button>
      </PageHeader>
      {projects.length === 0 ? (
        <Empty title="No projects yet" action={<Button onClick={() => ed.openNew({ status: "active", area: "personal" })}>Start a project</Button>}>
          A project is anything with an outcome and a deadline — a submission, a launch, a move. Add milestones, or let Daylight break the deadline into earlier steps.
        </Empty>
      ) : groups.map(([label, list]) => (
        <Section key={label} title={label} count={list.length}>
          <div className="grid gap-4 lg:grid-cols-2">
            {list.map((p) => {
              const ms = milestones.filter((m) => m.project_id === p.id);
              const ts = tasks.filter((t) => t.project_id === p.id);
              const all = [...ms.map((m) => m.done), ...ts.map((t) => t.done)];
              const pct = all.length ? Math.round((all.filter(Boolean).length / all.length) * 100) : 0;
              const goal = goals.find((g) => g.id === p.goal_id);
              const late = p.deadline && p.deadline < today && p.status !== "done";
              return (
                <div key={p.id} className="flex flex-col rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">{p.area}{goal && ` · ◎ ${goal.title}`}</p>
                      <p className="font-heading text-lg font-semibold">{p.title}</p>
                      {p.outcome && <p className="mt-1 text-sm text-muted-foreground">{p.outcome}</p>}
                    </div>
                    <Button size="icon" variant="ghost" aria-label={`Edit ${p.title}`} onClick={() => ed.openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-2 flex-1 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} /></div>
                    <span className="text-sm font-semibold">{pct}%</span>
                  </div>
                  <p className={`mt-2 text-xs ${late ? "font-medium text-destructive" : "text-muted-foreground"}`}>
                    {p.deadline ? `${late ? "Past deadline · " : "Due "}${fmtDate(p.deadline, { day: "numeric", month: "short", year: "numeric" })}` : "No deadline"} · {ts.filter((t) => !t.done).length} open tasks
                  </p>
                  <ul className="mt-3 space-y-1 border-t border-border pt-3">
                    {ms.map((m) => (
                      <li key={m.id} className="flex items-center gap-2 text-sm">
                        <Checkbox aria-label={`Milestone ${m.title} done`} checked={m.done} onCheckedChange={(v) => mm.update.mutate({ id: m.id, values: { done: !!v } })} />
                        <button className={`flex-1 text-left ${m.done ? "text-muted-foreground line-through" : ""}`} onClick={() => med.openEdit(m)}><Flag className="mr-1 inline h-3 w-3 text-primary" />{m.title}</button>
                        {m.due_date && <span className="text-xs text-muted-foreground">{fmtDate(m.due_date)}</span>}
                      </li>
                    ))}
                    {ts.filter((t) => !t.done).slice(0, 4).map((t) => (
                      <li key={t.id} className="flex items-center gap-2 text-sm">
                        <Checkbox aria-label={`Complete ${t.title}`} checked={false} onCheckedChange={() => tm.update.mutate({ id: t.id, values: { done: true } })} />
                        <span className="flex-1">{t.title}</span>
                        {t.due_date && <span className="text-xs text-muted-foreground">{fmtDate(t.due_date)}</span>}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    <Button size="sm" variant="outline" onClick={() => med.openNew({ project_id: p.id })}><Flag className="h-4 w-4" /> Milestone</Button>
                    <Button size="sm" variant="outline" onClick={() => tm.insert.mutate({ title: "New task", project_id: p.id, goal_id: p.goal_id })}><ListChecks className="h-4 w-4" /> Task</Button>
                    <Button size="sm" variant="secondary" onClick={() => { setBd(p); setBdDeadline(p.deadline ?? ""); }}><Wand2 className="h-4 w-4" /> Break down deadline</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      ))}

      <EditDialog open={ed.open} onOpenChange={ed.setOpen} title={ed.item ? "Edit project" : "New project"} fields={fields} initial={ed.item ?? ed.preset}
        onSave={(v) => (ed.item ? pm.update.mutate({ id: ed.item.id, values: v }) : pm.insert.mutate(v as any))}
        onDelete={ed.item ? () => pm.remove.mutate(ed.item!.id) : undefined} />
      <EditDialog open={med.open} onOpenChange={med.setOpen} title={med.item ? "Edit milestone" : "New milestone"}
        fields={[{ name: "title", label: "Milestone", required: true, max: 120 }, { name: "due_date", label: "Due date", type: "date" }]}
        initial={med.item}
        onSave={(v) => (med.item ? mm.update.mutate({ id: med.item.id, values: v }) : mm.insert.mutate({ ...v, project_id: med.preset?.project_id } as any))}
        onDelete={med.item ? () => mm.remove.mutate(med.item!.id) : undefined} />

      <Dialog open={!!bd} onOpenChange={(o) => !o && setBd(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Break “{bd?.title}” into steps</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="bd-dl">Final deadline</Label><Input id="bd-dl" type="date" value={bdDeadline} onChange={(e) => setBdDeadline(e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label htmlFor="bd-steps">Steps, one per line (in order)</Label>
              <Textarea id="bd-steps" rows={6} value={steps} onChange={(e) => setSteps(e.target.value)} placeholder={"Research\nOutline\nFirst draft\nReview\nSubmit"} />
            </div>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={asTasks} onCheckedChange={(v) => setAsTasks(!!v)} /> Create as tasks instead of milestones</label>
            {bdDeadline && steps.trim() && (
              <p className="text-xs text-muted-foreground">Dates: {breakdownDates(steps.split("\n").filter((s) => s.trim()).length, bdDeadline, today).map((d) => fmtDate(d)).join(" → ")}</p>
            )}
          </div>
          <DialogFooter><Button onClick={runBreakdown} disabled={!bdDeadline || !steps.trim()}>Create steps</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
