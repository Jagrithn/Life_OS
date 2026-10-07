import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Empty, PageHeader } from "@/components/PageHeader";
import { useRows, useTableMutations } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({ meta: [{ title: "Goals — Daylight" }, { name: "description", content: "Long-term goals and the tasks that feed them." }] }),
  component: Goals,
});

function Goals() {
  const { data: goals = [] } = useRows("goals");
  const { data: tasks = [] } = useRows("tasks");
  const { insert, update, remove } = useTableMutations("goals");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  return (
    <>
      <PageHeader title="Goals" subtitle="Where you're headed." />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          insert.mutate({ title: title.trim(), description: description.trim() || null, target_date: date || null });
          setTitle(""); setDescription(""); setDate("");
        }}
        className="mb-6 grid gap-2 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_auto_auto]"
      >
        <Input placeholder="Goal" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input placeholder="Why it matters (optional)" maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} />
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Button type="submit">Add</Button>
      </form>
      {goals.length === 0 ? <Empty>Set one goal that would make this year great.</Empty> : (
        <div className="grid gap-3 sm:grid-cols-2">
          {goals.map((g) => {
            const linked = tasks.filter((t) => t.goal_id === g.id);
            const done = linked.filter((t) => t.done).length;
            return (
              <div key={g.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-heading font-semibold">{g.title}</p>
                    {g.description && <p className="text-sm text-muted-foreground">{g.description}</p>}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => remove.mutate(g.id)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Slider
                    defaultValue={[g.progress]}
                    max={100}
                    step={5}
                    onValueCommit={(v) => update.mutate({ id: g.id, values: { progress: v[0] ?? 0 } })}
                  />
                  <span className="w-10 text-right text-sm font-medium">{g.progress}%</span>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {linked.length ? `${done}/${linked.length} linked tasks done` : "No linked tasks yet"}
                  {g.target_date && ` · by ${g.target_date}`}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
