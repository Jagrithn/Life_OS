import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Empty, PageHeader } from "@/components/PageHeader";
import { EditDialog, useEditor, type Field } from "@/components/EditDialog";
import { useRows, useTableMutations, type Row } from "@/lib/data";

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

/** Maps legacy horizons onto the new scale: short -> 1m, long -> 1y. */
function toHorizon(value: string | null | undefined): Horizon {
  if (value === "short") return "1m";
  if (value === "long") return "1y";
  return HORIZONS.includes(value as Horizon) ? (value as Horizon) : "1m";
}

/** Ordered biggest-first. */
const byHorizon = (a: Row<"goals">, b: Row<"goals">) =>
  HORIZON_ORDER[toHorizon(a.horizon)] - HORIZON_ORDER[toHorizon(b.horizon)];

type GoalNode = Row<"goals"> & { children: GoalNode[] };

function buildTree(goals: Row<"goals">[]): GoalNode[] {
  const nodes = new Map<string, GoalNode>();
  for (const g of goals) nodes.set(g.id, { ...g, children: [] });
  const roots: GoalNode[] = [];
  for (const node of nodes.values()) {
    if (node.parent_id && nodes.has(node.parent_id)) nodes.get(node.parent_id)!.children.push(node);
    else roots.push(node);
  }
  for (const node of nodes.values()) node.children.sort(byHorizon);
  roots.sort(byHorizon);
  return roots;
}

function hasChildren(node: GoalNode): boolean {
  return node.children.length > 0;
}

function collectExpandable(nodes: GoalNode[], into: Set<string>) {
  for (const n of nodes) {
    if (hasChildren(n)) {
      into.add(n.id);
      collectExpandable(n.children, into);
    }
  }
}

/** Progress: manual value, auto from linked work, or the average of children. */
export function goalProgress(
  goal: Row<"goals">,
  tasks: Row<"tasks">[],
  projects: Row<"projects">[],
  milestones: Row<"milestones">[],
  allGoals: Row<"goals">[],
  seen = new Set<string>(),
): number {
  if (goal.progress_mode === "manual") return goal.progress ?? 0;
  if (seen.has(goal.id)) return goal.progress ?? 0;

  if (goal.progress_mode === "cascade") {
    const children = allGoals.filter((c) => c.parent_id === goal.id);
    if (children.length === 0) return goal.progress ?? 0;
    const next = new Set(seen).add(goal.id);
    const total = children.reduce(
      (sum, c) => sum + goalProgress(c, tasks, projects, milestones, allGoals, next),
      0,
    );
    return Math.round(total / children.length);
  }

  const projectIds = new Set(projects.filter((p) => p.goal_id === goal.id).map((p) => p.id));
  const items = [
    ...tasks
      .filter((t) => t.goal_id === goal.id || (t.project_id && projectIds.has(t.project_id)))
      .map((t) => t.done),
    ...milestones.filter((m) => projectIds.has(m.project_id)).map((m) => m.done),
  ];
  return items.length ? Math.round((items.filter(Boolean).length / items.length) * 100) : 0;
}

function goalFields(parentOptions: { value: string; label: string }[]): Field[] {
  return [
    { name: "title", label: "Goal", required: true, max: 120 },
    { name: "description", label: "Why it matters", type: "textarea", max: 500 },
    {
      name: "horizon",
      label: "Horizon",
      type: "select",
      options: HORIZONS.map((h) => ({ value: h, label: HORIZON_LABELS[h] })),
    },
    {
      name: "parent_id",
      label: "Parent goal",
      type: "select",
      nullable: true,
      options: parentOptions,
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
}

function Goals() {
  const { data: goals = [] } = useRows("goals");
  const { data: tasks = [] } = useRows("tasks");
  const { data: projects = [] } = useRows("projects");
  const { data: milestones = [] } = useRows("milestones");
  const { insert, update, remove } = useTableMutations("goals");
  const ed = useEditor<Row<"goals">>();

  const tree = useMemo(() => buildTree(goals), [goals]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const seeded = useRef(false);

  // Expand whatever already has children on first load so the tree isn't a wall
  // of collapsed rows on the first visit.
  useEffect(() => {
    if (seeded.current || tree.length === 0) return;
    seeded.current = true;
    const ids = new Set<string>();
    collectExpandable(tree, ids);
    setExpanded(ids);
  }, [tree]);

  const fields = useMemo(
    () =>
      goalFields(
        // A goal can't be its own parent (or a descendant's).
        goals.filter((g) => g.id !== ed.item?.id).map((g) => ({ value: g.id, label: g.title })),
      ),
    [goals, ed.item],
  );

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setProgress(id: string, value: number) {
    update.mutate({ id, values: { progress: value } });
  }

  return (
    <>
      <PageHeader title="Goals" subtitle="Where you're headed — and what gets you there.">
        <Button onClick={() => ed.openNew({ horizon: "1m", progress_mode: "manual" })}>
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
        <ul className="space-y-3">
          {tree.map((node) => (
            <GoalRow
              key={node.id}
              node={node}
              goals={goals}
              tasks={tasks}
              projects={projects}
              milestones={milestones}
              expanded={expanded}
              onToggle={toggle}
              onEdit={(g) => ed.openEdit(g)}
              onProgress={setProgress}
            />
          ))}
        </ul>
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

function GoalRow({
  node,
  goals,
  tasks,
  projects,
  milestones,
  expanded,
  onToggle,
  onEdit,
  onProgress,
}: {
  node: GoalNode;
  goals: Row<"goals">[];
  tasks: Row<"tasks">[];
  projects: Row<"projects">[];
  milestones: Row<"milestones">[];
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onEdit: (goal: Row<"goals">) => void;
  onProgress: (id: string, value: number) => void;
}) {
  const open = expanded.has(node.id);
  const nested = hasChildren(node);
  const pct = goalProgress(node, tasks, projects, milestones, goals);
  const linkedTasks = tasks.filter((t) => t.goal_id === node.id);
  const linkedProjects = projects.filter((p) => p.goal_id === node.id);
  const horizon = toHorizon(node.horizon);

  return (
    <li>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
        {nested ? (
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            aria-label={open ? "Collapse children" : "Expand children"}
            aria-expanded={open}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="h-7 w-7 shrink-0" />
        )}
        <button type="button" onClick={() => onEdit(node)} className="min-w-0 flex-1 text-left">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-heading text-lg font-semibold">{node.title}</span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
              {HORIZON_LABELS[horizon]}
            </span>
          </span>
          {node.description && (
            <span className="mt-1 block text-sm text-muted-foreground">{node.description}</span>
          )}
          <span className="mt-1 block text-xs text-muted-foreground">
            {node.progress_mode === "auto"
              ? "Auto"
              : node.progress_mode === "cascade"
                ? "From children"
                : "Manual"}
            {" · "}
            {linkedProjects.length} project{linkedProjects.length === 1 ? "" : "s"} ·{" "}
            {linkedTasks.filter((t) => t.done).length}/{linkedTasks.length} tasks
            {node.target_date && ` · target ${node.target_date}`}
          </span>
        </button>
        <div className="flex min-w-40 flex-1 items-center gap-3">
          {node.progress_mode === "manual" ? (
            <Slider
              aria-label={`Progress for ${node.title}`}
              defaultValue={[node.progress ?? 0]}
              max={100}
              step={5}
              onValueCommit={(v) => onProgress(node.id, v[0] ?? 0)}
            />
          ) : (
            <div className="h-2 flex-1 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
          <span className="w-12 shrink-0 text-right text-sm font-semibold">{pct}%</span>
        </div>
      </div>
      {nested && open && (
        <ul className="mt-2 space-y-2 border-l border-border pl-4 ml-4">
          {node.children.map((child: GoalNode) => (
            <GoalRow
              key={child.id}
              node={child}
              goals={goals}
              tasks={tasks}
              projects={projects}
              milestones={milestones}
              expanded={expanded}
              onToggle={onToggle}
              onEdit={onEdit}
              onProgress={onProgress}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
