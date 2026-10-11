import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { EditDialog, useEditor, type Field } from "@/components/EditDialog";
import {
  addDays,
  fmtDate,
  fmtTime,
  hoursBetween,
  todayISO,
  toISO,
  useProfile,
  useRows,
  useTableMutations,
  weekStart,
  type Row,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Daylight" },
      {
        name: "description",
        content: "Month, week and day planning with events, deadlines and focus blocks.",
      },
    ],
  }),
  component: CalendarPage,
});

const KINDS = [
  ["event", "Event"],
  ["appointment", "Appointment"],
  ["focus", "Focus block"],
  ["exam", "Exam"],
  ["deadline", "Deadline"],
] as const;
const kindLabel = (k: string) => KINDS.find(([v]) => v === k)?.[1] ?? k;

type Item = {
  id: string;
  date: string;
  label: string;
  tag: string;
  time?: string;
  event?: Row<"events">;
};

function CalendarPage() {
  const { data: events = [] } = useRows("events");
  const { data: tasks = [] } = useRows("tasks");
  const { data: milestones = [] } = useRows("milestones");
  const { data: assessments = [] } = useRows("assessments");
  const { data: projects = [] } = useRows("projects");
  const { data: profile } = useProfile();
  const m = useTableMutations("events");
  const ed = useEditor<Row<"events">>();
  const [view, setView] = useState<"month" | "week" | "day">("week");
  const [cursor, setCursor] = useState(todayISO());
  const today = todayISO();
  const available = profile?.weekly_available_hours ?? 40;

  const items: Item[] = [
    ...events.map((e) => ({
      id: e.id,
      date: toISO(new Date(e.starts_at)),
      label: e.title,
      tag: kindLabel(e.kind),
      time: `${fmtTime(e.starts_at)}–${fmtTime(e.ends_at)}`,
      event: e,
    })),
    ...tasks
      .filter((t) => t.due_date && !t.done)
      .map((t) => ({ id: t.id, date: t.due_date!, label: t.title, tag: "Task due" })),
    ...milestones
      .filter((x) => x.due_date && !x.done)
      .map((x) => ({ id: x.id, date: x.due_date!, label: x.title, tag: "Milestone" })),
    ...projects
      .filter((p) => p.deadline && p.status !== "done")
      .map((p) => ({ id: p.id, date: p.deadline!, label: p.title, tag: "Project deadline" })),
    ...assessments
      .filter((a) => a.due_date && !a.done)
      .map((a) => ({
        id: a.id,
        date: a.due_date!,
        label: a.title,
        tag: a.kind === "exam" ? "Exam" : "Assignment",
      })),
  ];
  const on = (d: string) =>
    items.filter((i) => i.date === d).sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
  const plannedHours = (ws: string) =>
    events
      .filter((e) => {
        const d = toISO(new Date(e.starts_at));
        return d >= ws && d < addDays(ws, 7);
      })
      .reduce((s, e) => s + hoursBetween(e.starts_at, e.ends_at), 0);

  const fields: Field[] = [
    { name: "title", label: "Title", required: true, max: 120 },
    {
      name: "kind",
      label: "Type",
      type: "select",
      options: KINDS.map(([v, l]) => ({ value: v, label: l })),
    },
    { name: "starts_at", label: "Starts", type: "datetime", required: true },
    { name: "ends_at", label: "Ends", type: "datetime", required: true },
    {
      name: "project_id",
      label: "For project",
      type: "select",
      nullable: true,
      options: projects.map((p) => ({ value: p.id, label: p.title })),
    },
    {
      name: "task_id",
      label: "For task",
      type: "select",
      nullable: true,
      options: tasks.filter((t) => !t.done).map((t) => ({ value: t.id, label: t.title })),
    },
    { name: "note", label: "Note", max: 300 },
  ];
  const newAt = (date: string, kind = "event") => {
    const s = new Date(date + "T09:00");
    ed.openNew({
      kind,
      starts_at: s.toISOString(),
      ends_at: new Date(s.getTime() + 3600000).toISOString(),
    });
  };

  const step = view === "month" ? 30 : view === "week" ? 7 : 1;
  const move = (n: number) => {
    if (view === "month") {
      const d = new Date(cursor + "T00:00");
      d.setMonth(d.getMonth() + n, 1);
      setCursor(toISO(d));
    } else setCursor(addDays(cursor, n * step));
  };

  const ItemRow = ({ i }: { i: Item }) => (
    <button
      disabled={!i.event}
      onClick={() => i.event && ed.openEdit(i.event)}
      className={`block w-full rounded-lg border-l-4 px-2 py-1 text-left text-xs ${i.event ? (i.event.kind === "focus" ? "border-primary bg-primary/10 hover:bg-primary/15" : "border-foreground/40 bg-secondary hover:bg-accent") : "border-destructive/60 bg-card"}`}
    >
      <span className="block truncate font-medium">{i.label}</span>
      <span className="text-muted-foreground">
        {i.tag}
        {i.time && ` · ${i.time}`}
      </span>
    </button>
  );

  const ws = weekStart(cursor);
  const WeekLoad = ({ start }: { start: string }) => {
    const h = plannedHours(start);
    const over = h > available;
    return (
      <div
        className={`mb-6 rounded-2xl border p-4 ${over ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"}`}
      >
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {over && <AlertTriangle className="mr-1 inline h-4 w-4 text-destructive" />}Planned{" "}
            {h.toFixed(1)}h of {available}h available this week
          </span>
          <span className="text-xs text-muted-foreground">Change available hours in Settings</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-muted">
          <div
            className={`h-2 rounded-full transition-all ${over ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${Math.min(100, (h / available) * 100)}%` }}
          />
        </div>
        {over && (
          <p className="mt-2 text-xs text-destructive">
            Overplanned by {(h - available).toFixed(1)}h — consider moving or shortening a block.
          </p>
        )}
      </div>
    );
  };

  let body: React.ReactNode;
  if (view === "day") {
    const list = on(cursor);
    body = (
      <div className="space-y-2">
        {list.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nothing planned. Reserve a focus block for something important.
          </p>
        ) : (
          list.map((i) => <ItemRow key={i.id} i={i} />)
        )}
        <Button variant="outline" onClick={() => newAt(cursor, "focus")}>
          <Plus className="h-4 w-4" /> Add focus block
        </Button>
      </div>
    );
  } else if (view === "week") {
    body = (
      <>
        <WeekLoad start={ws} />
        <div className="grid gap-2 md:grid-cols-7">
          {Array.from({ length: 7 }, (_, k) => addDays(ws, k)).map((d) => (
            <div
              key={d}
              className={`min-h-32 rounded-2xl border bg-card p-2 ${d === today ? "border-primary" : "border-border"}`}
            >
              <button
                onClick={() => {
                  setCursor(d);
                  setView("day");
                }}
                className="mb-2 block text-left text-xs font-semibold"
              >
                {fmtDate(d, { weekday: "short" })}{" "}
                <span className={d === today ? "text-primary" : "text-muted-foreground"}>
                  {d.slice(8)}
                </span>
              </button>
              <div className="space-y-1">
                {on(d).map((i) => (
                  <ItemRow key={i.id} i={i} />
                ))}
              </div>
              <button
                onClick={() => newAt(d)}
                aria-label={`Add on ${fmtDate(d)}`}
                className="mt-1 w-full rounded-md py-1 text-xs text-muted-foreground hover:bg-secondary"
              >
                + Add
              </button>
            </div>
          ))}
        </div>
      </>
    );
  } else {
    const first = cursor.slice(0, 8) + "01";
    const start = weekStart(first);
    const weeks = Array.from({ length: 6 }, (_, w) => addDays(start, w * 7)).filter(
      (w, i) => i < 5 || w.slice(0, 7) === first.slice(0, 7),
    );
    body = (
      <div className="overflow-x-auto">
        <div className="grid min-w-[640px] grid-cols-[repeat(7,1fr)_70px] gap-1 text-xs">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Hours"].map((d) => (
            <div key={d} className="px-1 py-1 font-semibold text-muted-foreground">
              {d}
            </div>
          ))}
          {weeks.map((w) => {
            const h = plannedHours(w);
            return [
              ...Array.from({ length: 7 }, (_, k) => addDays(w, k)).map((d) => {
                const list = on(d);
                return (
                  <button
                    key={d}
                    onClick={() => {
                      setCursor(d);
                      setView("day");
                    }}
                    className={`min-h-20 rounded-lg border p-1 text-left align-top ${d.slice(0, 7) !== first.slice(0, 7) ? "opacity-40" : ""} ${d === today ? "border-primary" : "border-border"} bg-card hover:bg-secondary/60`}
                  >
                    <span className="font-semibold">{Number(d.slice(8))}</span>
                    {list.slice(0, 2).map((i) => (
                      <span key={i.id} className="mt-0.5 block truncate">
                        {i.event?.kind === "focus" ? "▣ " : "• "}
                        {i.label}
                      </span>
                    ))}
                    {list.length > 2 && (
                      <span className="text-muted-foreground">+{list.length - 2} more</span>
                    )}
                  </button>
                );
              }),
              <div
                key={w + "h"}
                className={`flex items-center justify-center rounded-lg text-xs font-medium ${h > available ? "bg-destructive/10 text-destructive" : "text-muted-foreground"}`}
              >
                {h > available && "⚠ "}
                {h.toFixed(0)}h
              </div>,
            ];
          })}
        </div>
      </div>
    );
  }

  const title =
    view === "month"
      ? fmtDate(cursor, { month: "long", year: "numeric" })
      : view === "week"
        ? `Week of ${fmtDate(ws, { day: "numeric", month: "long" })}`
        : fmtDate(cursor, { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <PageHeader title="Calendar" subtitle="Events, deadlines and focus blocks in one place.">
        <Button onClick={() => newAt(cursor === today ? today : cursor)}>
          <Plus className="h-4 w-4" /> New event
        </Button>
      </PageHeader>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-border bg-card p-0.5" role="tablist">
          {(["month", "week", "day"] as const).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1.5 text-sm capitalize ${view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {v}
            </button>
          ))}
        </div>
        <Button size="icon" variant="outline" aria-label="Previous" onClick={() => move(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => setCursor(today)}>
          Today
        </Button>
        <Button size="icon" variant="outline" aria-label="Next" onClick={() => move(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <p className="ml-2 font-heading font-semibold">{title}</p>
      </div>
      {body}
      <EditDialog
        open={ed.open}
        onOpenChange={ed.setOpen}
        title={ed.item ? "Edit event" : "New event"}
        fields={fields}
        initial={ed.item ?? ed.preset}
        onSave={(v) => {
          if (v["ends_at"] <= v["starts_at"])
            v["ends_at"] = new Date(new Date(v["starts_at"]).getTime() + 3600000).toISOString();
          if (ed.item) m.update.mutate({ id: ed.item.id, values: v });
          else m.insert.mutate(v as any);
        }}
        onDelete={ed.item ? () => m.remove.mutate(ed.item!.id) : undefined}
      />
    </>
  );
}
