import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { CrudList } from "@/components/CrudList";
import { fmtDate, todayISO, useRows, type Row } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/learning")({
  head: () => ({ meta: [{ title: "Reading & Learning — Daylight" }, { name: "description", content: "Your book list with takeaways and a learning log." }] }),
  component: Learning,
});

const statusLabel: Record<string, string> = { want: "Want to read", reading: "Reading", finished: "Finished" };

function Learning() {
  const { data: logs = [] } = useRows("learning_logs");
  const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const bySkill = Object.entries(logs.filter((l) => l.log_date >= since).reduce<Record<string, number>>((a, l) => ((a[l.skill] = (a[l.skill] ?? 0) + l.minutes), a), {})).sort((a, b) => b[1] - a[1]);
  return (
    <>
      <PageHeader title="Reading & Learning" subtitle="Short typed takeaways only — no uploads." />
      {bySkill.length > 0 && (
        <div className="mb-8 rounded-2xl border border-border bg-card p-5">
          <p className="mb-3 font-heading font-semibold">Practice in the last 30 days</p>
          <div className="space-y-2">
            {bySkill.map(([s, m]) => (
              <div key={s}>
                <div className="flex justify-between text-sm"><span>{s}</span><span>{(m / 60).toFixed(1)}h</span></div>
                <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${(m / bySkill[0]![1]) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}
      <CrudList table="books" title="Books" noun="book" defaults={{ status: "want" }}
        emptyTitle="Your shelf is empty" emptyText="Add books you want to read, are reading or finished, with a few takeaways in your own words."
        fields={[
          { name: "title", label: "Title", required: true, max: 150 },
          { name: "author", label: "Author", max: 100 },
          { name: "status", label: "Status", type: "select", options: Object.entries(statusLabel).map(([value, label]) => ({ value, label })) },
          { name: "takeaways", label: "Takeaways", type: "textarea", max: 2000 },
        ]}
        render={(b: Row<"books">) => (
          <div>
            <div className="flex items-center justify-between gap-2"><p className="font-medium">{b.title}{b.author && <span className="font-normal text-muted-foreground"> · {b.author}</span>}</p><span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{statusLabel[b.status]}</span></div>
            {b.takeaways && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{b.takeaways}</p>}
          </div>
        )} />
      <CrudList table="learning_logs" title="Learning log" noun="session" defaults={{ log_date: todayISO(), minutes: 30 }}
        emptyTitle="No sessions logged" emptyText="Log time spent on skills, courses, lessons or practice."
        fields={[
          { name: "skill", label: "Skill or course", required: true, max: 80 },
          { name: "minutes", label: "Minutes", type: "number", required: true },
          { name: "log_date", label: "Date", type: "date", required: true },
          { name: "note", label: "What you learned", type: "textarea", max: 500 },
        ]}
        render={(l: Row<"learning_logs">) => (
          <div className="flex justify-between gap-3"><div><p className="font-medium">{l.skill}</p>{l.note && <p className="line-clamp-1 text-sm text-muted-foreground">{l.note}</p>}</div><span className="text-xs text-muted-foreground">{l.minutes} min · {fmtDate(l.log_date)}</span></div>
        )} />
    </>
  );
}
