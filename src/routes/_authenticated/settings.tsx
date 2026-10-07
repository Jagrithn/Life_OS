import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Daylight" }, { name: "description", content: "Your profile and data." }] }),
  component: SettingsPage,
});

const tables = ["tasks", "goals", "habits", "habit_logs", "journal_entries", "transactions"] as const;

function SettingsPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle()).data,
  });
  const [name, setName] = useState("");
  useEffect(() => setName(profile?.display_name ?? ""), [profile]);

  async function save() {
    const { error } = await supabase.from("profiles").upsert({ id: user.id, display_name: name.trim() });
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Saved");
  }

  async function exportData() {
    const out: Record<string, unknown> = { exported_at: new Date().toISOString(), email: user.email };
    for (const t of tables) out[t] = (await supabase.from(t).select("*")).data;
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `daylight-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }

  async function wipe() {
    if (!confirm("Delete ALL your tasks, habits, journal, money and goals? This cannot be undone.")) return;
    for (const t of ["habit_logs", "tasks", "habits", "journal_entries", "transactions", "goals"] as const) {
      await supabase.from(t).delete().eq("user_id", user.id);
    }
    qc.invalidateQueries();
    toast.success("All data deleted");
  }

  return (
    <>
      <PageHeader title="Settings" subtitle={user.email ?? ""} />
      <section className="mb-4 space-y-3 rounded-xl border border-border bg-card p-5">
        <Label htmlFor="dn">Display name</Label>
        <div className="flex gap-2">
          <Input id="dn" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={save}>Save</Button>
        </div>
      </section>
      <section className="mb-4 rounded-xl border border-border bg-card p-5">
        <p className="font-medium">Export your data</p>
        <p className="mb-3 text-sm text-muted-foreground">Download everything as a file.</p>
        <Button variant="outline" onClick={exportData}>Download export</Button>
      </section>
      <section className="rounded-xl border border-destructive/30 bg-card p-5">
        <p className="font-medium text-destructive">Delete all data</p>
        <p className="mb-3 text-sm text-muted-foreground">Permanently removes everything you've added.</p>
        <Button variant="destructive" onClick={wipe}>Delete everything</Button>
      </section>
    </>
  );
}
