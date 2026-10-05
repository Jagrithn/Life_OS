import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Empty, PageHeader } from "@/components/PageHeader";
import { todayISO, useRows, useTableMutations } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/journal")({
  head: () => ({ meta: [{ title: "Journal — Daylight" }, { name: "description", content: "A private place to reflect." }] }),
  component: Journal,
});

export const moods = ["😞", "😕", "😐", "🙂", "😄"];

function Journal() {
  const { data: entries = [] } = useRows("journal_entries");
  const { insert, remove } = useTableMutations("journal_entries");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<number | null>(null);

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
        className="mb-6 space-y-3 rounded-xl border border-border bg-card p-4"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Mood</span>
          {moods.map((m, i) => (
            <button type="button" key={m} onClick={() => setMood(i + 1)} className={`rounded-lg px-2 py-1 text-xl ${mood === i + 1 ? "bg-accent ring-2 ring-primary" : "opacity-60 hover:opacity-100"}`}>{m}</button>
          ))}
        </div>
        <Textarea rows={4} maxLength={2000} placeholder="How was today? What did you learn?" value={content} onChange={(e) => setContent(e.target.value)} />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{content.length}/2000</span>
          <Button type="submit">Save entry</Button>
        </div>
      </form>
      {entries.length === 0 ? <Empty>Your first entry is one sentence away.</Empty> : (
        <div className="space-y-3">
          {entries.map((e) => (
            <article key={e.id} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  {e.mood ? moods[e.mood - 1] + " " : ""}
                  {new Date(e.entry_date + "T00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
                </p>
                <Button size="icon" variant="ghost" onClick={() => remove.mutate(e.id)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
              </div>
              <p className="whitespace-pre-wrap">{e.content}</p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
