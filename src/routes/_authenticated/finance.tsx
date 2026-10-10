import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Empty, PageHeader, Section } from "@/components/PageHeader";
import { EditDialog, useEditor, type Field } from "@/components/EditDialog";
import { CrudList } from "@/components/CrudList";
import { fmtDate, inr, todayISO, useRows, useTableMutations, type Row } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/finance")({
  head: () => ({ meta: [{ title: "Money — Daylight" }, { name: "description", content: "Track income, spending and savings in INR." }] }),
  component: Finance,
});

const categories = ["Food", "Transport", "Rent", "Bills", "Shopping", "Health", "Education", "Fun", "Salary", "Other"];
const fields: Field[] = [
  { name: "kind", label: "Type", type: "select", options: [{ value: "expense", label: "Expense" }, { value: "income", label: "Income" }] },
  { name: "amount", label: "Amount (₹)", type: "number", required: true },
  { name: "category", label: "Category", type: "select", options: categories.map((c) => ({ value: c, label: c })) },
  { name: "note", label: "Note", max: 200 },
  { name: "txn_date", label: "Date", type: "date", required: true },
];

const shiftMonth = (ym: string, n: number) => {
  const d = new Date(ym + "-01T00:00");
  d.setMonth(d.getMonth() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

function Finance() {
  const { data: txns = [] } = useRows("transactions");
  const { insert, update, remove } = useTableMutations("transactions");
  const ed = useEditor<Row<"transactions">>();
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const sum = (list: Row<"transactions">[], k: string) => list.filter((t) => t.kind === k).reduce((s, t) => s + Number(t.amount), 0);

  const thisMonth = txns.filter((t) => t.txn_date.startsWith(month));
  const income = sum(thisMonth, "income");
  const spent = sum(thisMonth, "expense");
  const byCat = Object.entries(
    thisMonth.filter((t) => t.kind === "expense").reduce<Record<string, number>>((a, t) => ((a[t.category] = (a[t.category] ?? 0) + Number(t.amount)), a), {}),
  ).sort((a, b) => b[1] - a[1]);

  const trend = Array.from({ length: 6 }, (_, i) => {
    const m = shiftMonth(todayISO().slice(0, 7), i - 5);
    const l = txns.filter((t) => t.txn_date.startsWith(m));
    const inc = sum(l, "income"), exp = sum(l, "expense");
    return { month: fmtDate(m + "-01", { month: "short" }), Income: inc, Spent: exp, Saved: Math.max(0, inc - exp), has: l.length > 0 };
  });
  const monthsWithData = trend.filter((t) => t.has).length;
  const monthLabel = fmtDate(month + "-01", { month: "long", year: "numeric" });

  return (
    <>
      <PageHeader title="Money" subtitle="Manual tracking in ₹. Nothing here is financial advice.">
        <Button onClick={() => ed.openNew({ kind: "expense", category: "Food", txn_date: todayISO() })}><Plus className="h-4 w-4" /> Add entry</Button>
      </PageHeader>

      <div className="mb-4 flex items-center gap-2">
        <Button size="icon" variant="outline" aria-label="Previous month" onClick={() => setMonth(shiftMonth(month, -1))}><ChevronLeft className="h-4 w-4" /></Button>
        <p className="min-w-40 text-center font-heading font-semibold">{monthLabel}</p>
        <Button size="icon" variant="outline" aria-label="Next month" onClick={() => setMonth(shiftMonth(month, 1))}><ChevronRight className="h-4 w-4" /></Button>
      </div>
      <div className="mb-8 grid grid-cols-3 gap-3">
        {([["Income", income, ""], ["Spent", spent, ""], [income - spent >= 0 ? "Saved" : "Overspent", Math.abs(income - spent), income - spent < 0 ? "text-destructive" : "text-primary"]] as const).map(([l, v, c]) => (
          <div key={l} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{l}</p>
            <p className={`font-heading text-lg font-bold sm:text-2xl ${c}`}>{inr(v)}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="mb-1 font-heading font-semibold">Last 6 months</p>
          {monthsWithData < 2 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Add entries in at least two months to see your spending and savings trend.</p>
          ) : (
            <>
              <p className="mb-3 text-xs text-muted-foreground">Average monthly spend {inr(trend.reduce((s, t) => s + t.Spent, 0) / monthsWithData)} across months with entries.</p>
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" fontSize={12} stroke="var(--muted-foreground)" />
                    <YAxis fontSize={11} stroke="var(--muted-foreground)" tickFormatter={(v) => `₹${v / 1000}k`} width={45} />
                    <Tooltip formatter={(v: number) => inr(v)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Spent" fill="var(--muted-foreground)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Saved" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="mb-3 font-heading font-semibold">Where it went · {monthLabel}</p>
          {byCat.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No spending recorded this month.</p> : (
            <div className="space-y-2.5">
              {byCat.map(([c, v]) => (
                <div key={c}>
                  <div className="flex justify-between text-sm"><span>{c}</span><span>{inr(v)} · {Math.round((v / spent) * 100)}%</span></div>
                  <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${(v / spent) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Section title={`Entries · ${monthLabel}`} count={thisMonth.length}>
        {thisMonth.length === 0 ? (
          <Empty title="No entries this month" action={<Button onClick={() => ed.openNew({ kind: "expense", category: "Food", txn_date: todayISO() })}>Add an entry</Button>}>Record income and expenses by hand to see where your money goes each month.</Empty>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {thisMonth.map((t) => (
              <li key={t.id}>
                <button onClick={() => ed.openEdit(t)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{t.category}{t.note && <span className="font-normal text-muted-foreground"> · {t.note}</span>}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(t.txn_date, { weekday: "short", day: "numeric", month: "short" })}</p>
                  </div>
                  <span className={t.kind === "income" ? "font-semibold text-primary" : "font-semibold"}>{t.kind === "income" ? "+ " : "− "}{inr(Number(t.amount))}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <CrudList
        table="investments"
        title="Investments (manual)"
        noun="investment"
        emptyTitle="No investments recorded"
        emptyText="Optionally note what you've put in and what it's worth now. Values are typed by you — not live market data and not a recommendation."
        defaults={{ as_of: todayISO() }}
        fields={[
          { name: "name", label: "Name", required: true, max: 80 },
          { name: "contributed", label: "Total contributed (₹)", type: "number", required: true },
          { name: "current_value", label: "Current value (₹)", type: "number", required: true },
          { name: "as_of", label: "Value as of", type: "date", required: true },
        ]}
        render={(r: Row<"investments">) => {
          const diff = Number(r.current_value) - Number(r.contributed);
          return (
            <div className="flex items-center justify-between gap-3">
              <div><p className="font-medium">{r.name}</p><p className="text-xs text-muted-foreground">Put in {inr(Number(r.contributed))} · as of {fmtDate(r.as_of)}</p></div>
              <div className="text-right"><p className="font-semibold">{inr(Number(r.current_value))}</p><p className={`text-xs ${diff < 0 ? "text-destructive" : "text-primary"}`}>{diff >= 0 ? "▲ +" : "▼ "}{inr(diff)}</p></div>
            </div>
          );
        }}
      />

      <EditDialog
        open={ed.open}
        onOpenChange={ed.setOpen}
        title={ed.item ? "Edit entry" : "New entry"}
        fields={fields}
        initial={ed.item ?? ed.preset}
        onSave={(v) => (ed.item ? update.mutate({ id: ed.item.id, values: v }) : insert.mutate(v as any))}
        onDelete={ed.item ? () => remove.mutate(ed.item!.id) : undefined}
      />
    </>
  );
}
