import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Empty, PageHeader, Section } from "@/components/PageHeader";
import { EditDialog, useEditor } from "@/components/EditDialog";
import { fmtDate, todayISO, useRows, useTableMutations, type Row } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/journal")({
  head: () => ({ meta: [{ title: "Journal — Daylight" }, { name: "description", content: "A private place to reflect." }] }),
  component: Journal,
});

export const moods = ["😞", "😕", "😐", "🙂", "😄"];
const moodNames = ["Low", "Meh", "Okay", "Good", "Great"];

function Journal() {
  const { data: entries = [] } = useRows("journal_entries");
  const { insert, update, remove } = useTableMutations("journal_entries");
  const ed = useEditor<Row<"journal_entries">>();
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<number | null>(null);

  const byMonth = entries.reduce<Record<string, Row<"journal_entries">[]>>((a, e) => {
    const k = fmtDate(e.entry_date, { month: "long", year: "numeric" });
    (a[k] ??= []).push(e);
    return a;
  }, {});

  return (
    <>
      <PageHeader title="Journal" subtitle="Private. Only you can read this." />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!content.trim()) return;
          insert.mutate({ content: content.trim(), mood, entry_date: todayISO() });
          setContent("");
          setMood(null);
        }}
        className="mb-10 space-y-3 rounded-2xl border border-border bg-card p-5"
      >
        <p className="font-heading font-semibold">{fmtDate(todayISO(), { weekday: "long", day: "numeric", month: "long" })}</p>
        <div className="flex flex-wrap items-center gap-1" role="radiogroup" aria-label="Mood">
          <span className="mr-2 text-sm text-muted-foreground">Mood</span>
          {moods.map((m, i) => (
            <button type="button" role="radio" aria-checked={mood === i + 1} aria-label={moodNames[i]} key={m} onClick={() => setMood(i + 1)} className={`rounded-lg px-2 py-1 text-xl transition ${mood === i + 1 ? "bg-accent ring-2 ring-primary" : "opacity-60 hover:opacity-100"}`}>{m}</button>
          ))}
        </div>
        <Textarea rows={5} maxLength={2000} placeholder="How was today? What went well, what did you learn?" value={content} onChange={(e) => setContent(e.target.value)} className="resize-none border-0 bg-secondary/50 text-base focus-visible:ring-1" />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{content.length}/2000</span>
          <Button type="submit">Save entry</Button>
        </div>
      </form>
      {entries.length === 0 ? (
        <Empty title="Nothing written yet">Your journal is a private space for short daily reflections. One honest sentence is enough to start.</Empty>
      ) : Object.entries(byMonth).map(([month, list]) => (
        <Section key={month} title={month} count={list.length}>
          <div className="space-y-3">
            {list.map((e) => (
              <button key={e.id} onClick={() => ed.openEdit(e)} className="block w-full rounded-2xl border border-border bg-card p-5 text-left transition hover:border-primary/40">
                <p className="mb-1 text-sm font-medium text-muted-foreground">
                  {e.mood ? `${moods[e.mood - 1]} ${moodNames[e.mood - 1]} · ` : ""}
                  {fmtDate(e.entry_date, { weekday: "long", day: "numeric", month: "short" })}
                </p>
                <p className="line-clamp-4 whitespace-pre-wrap">{e.content}</p>
              </button>
            ))}
          </div>
        </Section>
      ))}
      <EditDialog
        open={ed.open}
        onOpenChange={ed.setOpen}
        title="Edit entry"
        fields={[
          { name: "entry_date", label: "Date", type: "date", required: true },
          { name: "mood", label: "Mood", type: "select", nullable: true, options: moods.map((m, i) => ({ value: String(i + 1), label: `${m} ${moodNames[i]}` })) },
          { name: "content", label: "Entry", type: "textarea", required: true, max: 2000 },
        ]}
        initial={ed.item}
        onSave={(v) => ed.item && update.mutate({ id: ed.item.id, values: { ...v, mood: v.mood ? Number(v.mood) : null } })}
        onDelete={ed.item ? () => remove.mutate(ed.item!.id) : undefined}
      />
    </>
  );
}
