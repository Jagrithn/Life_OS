import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Empty, PageHeader } from "@/components/PageHeader";
import { inr, todayISO, useRows, useTableMutations } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/finance")({
  head: () => ({ meta: [{ title: "Money — Daylight" }, { name: "description", content: "Track income and spending in INR." }] }),
  component: Finance,
});

const categories = ["Food", "Transport", "Rent", "Bills", "Shopping", "Health", "Education", "Fun", "Salary", "Other"];

function Finance() {
  const { data: txns = [] } = useRows("transactions");
  const { insert, remove } = useTableMutations("transactions");
  const [kind, setKind] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());

  const month = todayISO().slice(0, 7);
  const thisMonth = txns.filter((t) => t.txn_date.startsWith(month));
  const income = thisMonth.filter((t) => t.kind === "income").reduce((s, t) => s + Number(t.amount), 0);
  const spent = thisMonth.filter((t) => t.kind === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const byCat = Object.entries(
    thisMonth.filter((t) => t.kind === "expense").reduce<Record<string, number>>((a, t) => ((a[t.category] = (a[t.category] ?? 0) + Number(t.amount)), a), {}),
  ).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <PageHeader title="Money" subtitle="This month at a glance" />
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[["Income", income], ["Spent", spent], ["Left", income - spent]].map(([l, v]) => (
          <div key={l as string} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className="font-heading text-lg font-bold sm:text-2xl">{inr(v as number)}</p>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const n = parseFloat(amount);
          if (!(n > 0)) return;
          insert.mutate({ kind, amount: n, category, note: note.trim() || null, txn_date: date });
          setAmount("");
          setNote("");
        }}
        className="mb-6 grid gap-2 rounded-xl border border-border bg-card p-4 sm:grid-cols-[auto_auto_auto_1fr_auto_auto]"
      >
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="sm:w-28"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="expense">Expense</SelectItem><SelectItem value="income">Income</SelectItem></SelectContent>
        </Select>
        <Input type="number" min="0" step="0.01" placeholder="₹ Amount" className="sm:w-32" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-32"><SelectValue /></SelectTrigger>
          <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Input placeholder="Note (optional)" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Button type="submit">Add</Button>
      </form>
      {byCat.length > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <p className="mb-3 text-sm font-medium">Spending by category</p>
          <div className="space-y-2">
            {byCat.map(([c, v]) => (
              <div key={c}>
                <div className="flex justify-between text-sm"><span>{c}</span><span>{inr(v)}</span></div>
                <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${(v / spent) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}
      {txns.length === 0 ? <Empty>No transactions yet.</Empty> : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {txns.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{t.category}{t.note && <span className="font-normal text-muted-foreground"> · {t.note}</span>}</p>
                <p className="text-xs text-muted-foreground">{t.txn_date}</p>
              </div>
              <span className={t.kind === "income" ? "font-semibold text-primary" : "font-semibold"}>{t.kind === "income" ? "+" : "−"}{inr(Number(t.amount))}</span>
              <Button size="icon" variant="ghost" onClick={() => remove.mutate(t.id)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
