import { createFileRoute } from "@tanstack/react-router";
import { Plus, ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Empty, PageHeader, Section } from "@/components/PageHeader";
import { EditDialog, useEditor, type Field } from "@/components/EditDialog";
import { fmtDate, useRows, useTableMutations, type Row } from "@/lib/data";

export const Route = createFileRoute("/_app/goals")({
  head: () => ({
    meta: [
      { title: "Goals — Ordo" },
      { name: "description", content: "Multi-horizon nested goals with cascading progress." },
    ],
  }),
  component: Goals,
});

const HORIZONS = ["5y", "1y", "6m", "3m", "1m", "1w"] as const;
type Horizon = (typeof HORIZONS)[number];

const HORIZON_LABELS: Record<Horizon, string> = {
  "5y": "5 years",
  "1y": "1 year",
  "6m": "6 months",
  "3m": "3 months",
  "1m": "1 month",
  "1w": "1 week",
};

const HORIZON_ORDER: Record<Horizon, number> = {
  "5y": 0,
  "1y": 1,
  "6m": 2,
  "3m": 3,
  "1m": 4,
  "1w": 5,
};

function getGoalHorizonOptions() {
  return HORIZONS.map((h) => ({ value: h, label: HORIZON_LABELS[h] }));
}

function migrateHorizon(h: string): Horizon {
  if (h === "short") return "1m";
  if (h === "long") return "1y";
  return (HORIZONS.includes(h as Horizon) ? h : "1m") as Horizon;
}

const fields: Field[] = [
  { name: "title", label: "Goal", required: true, max: 120 },
  { name: "description", label: "Why it matters", type: "textarea", max: 500 },
  {
    name: "horizon",
    label: "Horizon",
    type: "select",
    options: getGoalHorizonOptions(),
  },
  {
    name: "parent_id",
    label: "Parent goal",
    type: "select",
    nullable: true,
    options: [],
  },
  { name: "target_date", label: "Target date", type: "date" },
  {
    name: "progress_mode",
    label: "Progress",
    type: "select",
    options: [
      { value: "manual", label: "I set it manually" },
      { value: "auto", label: "Automatic from linked tasks & milestones" },
      { value: "cascade", label: "Cascade from children" },
    ],
  },
];

/** Progress for a goal: manual value, % of linked tasks/milestones, or cascaded from children. */
export function goalProgress(
  g: Row<"goals">,
  tasks: Row<"tasks">[],
  projects: Row<"projects">[],
  milestones: Row<"milestones">[],
  allGoals: Row<"goals">[],
): number {
  if (g.progress_mode === "manual") return g.progress ?? 0;

  if (g.progress_mode === "cascade") {
    const children = allGoals.filter((c) => c.parent_id === g.id);
    if (children.length === 0) return g.progress ?? 0;
    const sum = children.reduce(
      (acc: number, c: Row<"goals">) =>
        acc + goalProgress(c, tasks, projects, milestones, allGoals),
      0,
    );
    return Math.round(sum / children.length);
  }

  const projIds = new Set(projects.filter((p) => p.goal_id === g.id).map((p) => p.id));
  const items = [
    ...tasks
      .filter((t) => t.goal_id === g.id || (t.project_id && projIds.has(t.project_id)))
      .map((t) => t.done),
    ...milestones.filter((m) => projIds.has(m.project_id)).map((m) => m.done),
  ];
  return items.length ? Math.round((items.filter(Boolean).length / items.length) * 100) : 0;
}

function buildTree(goals: Row<"goals">[]): Row<"goals">[] {
  const byId = new Map(goals.map((g) => [g.id, { ...g, children: [] as Row<"goals">[] }]));
  const roots: Row<"goals">[] = [];
  for (const g of byId.values()) {
    if (g.parent_id && byId.has(g.parent_id)) {
      byId.get(g.parent_id)!.children.push(g);
    } else {
      roots.push(g);
    }
  }
  for (const g of byId.values()) {
    g.children.sort(
      (a: Row<"goals">, b: Row<"goals">) =>
        HORIZON_ORDER[migrateHorizon(a.horizon)] - HORIZON_ORDER[migrateHorizon(b.horizon)],
    );
  }
  roots.sort(
    (a: Row<"goals">, b: Row<"goals">) =>
      HORIZON_ORDER[migrateHorizon(a.horizon)] - HORIZON_ORDER[migrateHorizon(b.horizon)],
  );
  return roots;
}

function GoalNode({
  goal,
  allGoals,
  tasks,
  projects,
  milestones,
  depth = 0,
  onToggle,
  onEdit,
  onDelete,
  expanded,
}: {
  goal: Row<"goals"> & { children?: Row<"goals">[] };
  allGoals: Row<"goals">[];
  tasks: Row<"tasks">[];
  projects: Row<"projects">[];
  milestones: Row<"milestones">[];
  depth: number;
  onToggle: (id: string) => void;
  onEdit: (g: Row<"goals">) => void;
  onDelete: (id: string) => void;
  expanded: Set<string>;
}) {
  const isExpanded = expanded.has(goal.id);
  const hasChildren = goal.children && goal.children.length > 0;
  const pct = goalProgress(goal, tasks, projects, milestones, allGoals);
  const horizon = migrateHorizon(goal.horizon);
  const linked = tasks.filter((t) => t.goal_id === goal.id);
  const projs = projects.filter((p) => p.goal_id === goal.id);

  return (
    <div className={hasChildren ? "" : "ml-8"}>
      <div
        className={`flex items-center gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary/30 ${depth > 0 ? "ml-6 border-l-2 border-border/50 pl-4" : ""}`}
        style={{ borderLeftColor: depth > 0 ? "hsl(var(--border))" : undefined }}
      >
        {hasChildren && (
          <button
            onClick={() => onToggle(goal.id)}
            className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label={isExpanded ? "Collapse" : "Expand"}
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}
        {!hasChildren && <span className="h-7 w-7" />}
        <button className="flex-1 text-left" onClick={() => onEdit(goal)}>
          <div className="flex items-center gap-2">
            <span className="font-heading text-lg font-semibold">{goal.title}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {HORIZON_LABELS[horizon]}
            </span>
          </div>
          {goal.description && (
            <p className="mt-1 text-sm text-muted-foreground">{goal.description}</p>
          )}
        </button>
        <div className="flex items-center gap-3">
          {goal.progress_mode === "auto" || goal.progress_mode === "cascade" ? (
            <div className="h-2 flex-1 max-w-48 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          ) : (
            <Slider
              aria-label="Progress"
              defaultValue={[goal.progress ?? 0]}
              max={100}
              step={5}
              onValueCommit={(v) => onEdit({ ...goal, progress: v[0] ?? 0 })}
            />
          )}
          <span className="w-12 text-right text-sm font-semibold">{pct}%</span>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className="mt-2 space-y-2">
          {goal.children!.map((c: Row<"goals">) => (
            <GoalNode
              key={c.id}
              goal={c}
              allGoals={allGoals}
              tasks={tasks}
              projects={projects}
              milestones={milestones}
              depth={depth + 1}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              expanded={expanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Goals() {
  const { data: goals = [] } = useRows("goals");
  const { data: tasks = [] } = useRows("tasks");
  const { data: projects = [] } = useRows("projects");
  const { data: milestones = [] } = useRows("milestones");
  const { insert, update, remove } = useTableMutations("goals");
  const ed = useEditor<Row<"goals">>();
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(HORIZONS.slice(0, 2).map((h) => h)),
  );

  const tree = buildTree(goals);

  const goalOptions = [
    { value: "none", label: "None" },
    ...goals.map((g) => ({ value: g.id, label: g.title })),
  ];
  const parentField = fields.find((f) => f.name === "parent_id");
  if (parentField) parentField.options = goalOptions;

  function handleToggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const horizonOrder = (g: Row<"goals">) => HORIZON_ORDER[migrateHorizon(g.horizon)];
  const sortedGoals = [...goals].sort((a, b) => horizonOrder(a) - horizonOrder(b));

  return (
    <>
      <PageHeader title="Goals" subtitle="Where you're headed — and what gets you there.">
        <Button
          onClick={() => ed.openNew({ horizon: "1m", progress_mode: "manual", parent_id: null })}
        >
          <Plus className="h-4 w-4" /> New goal
        </Button>
      </PageHeader>
      {goals.length === 0 ? (
        <Empty
          title="No goals yet"
          action={<Button onClick={() => ed.openNew()}>Set a goal</Button>}
        >
          Goals describe outcomes you care about. Nest them across horizons (5y → 1w), link projects
          and tasks, and let progress cascade up automatically.
        </Empty>
      ) : (
        <div className="space-y-6">
          {tree.map((root) => (
            <GoalNode
              key={root.id}
              goal={root}
              allGoals={goals}
              tasks={tasks}
              projects={projects}
              milestones={milestones}
              depth={0}
              onToggle={handleToggle}
              onEdit={(g) => ed.openEdit(g)}
              onDelete={(id) => remove.mutate(id)}
              expanded={expanded}
            />
          ))}
        </div>
      )}
      <EditDialog
        open={ed.open}
        onOpenChange={ed.setOpen}
        title={ed.item ? "Edit goal" : "New goal"}
        fields={fields}
        initial={ed.item ?? ed.preset}
        onSave={(v) =>
          ed.item ? update.mutate({ id: ed.item.id, values: v }) : insert.mutate(v as any)
        }
        onDelete={ed.item ? () => remove.mutate(ed.item!.id) : undefined}
      />
    </>
  );
}
