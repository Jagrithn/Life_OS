import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";
import { ModulePicker } from "@/components/ModulePicker";
import { useProfile } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Daylight" },
      { name: "description", content: "Your profile, sections and data." },
    ],
  }),
  component: SettingsPage,
});

const tables = [
  "tasks",
  "goals",
  "habits",
  "habit_logs",
  "journal_entries",
  "transactions",
  "projects",
  "milestones",
  "events",
  "terms",
  "courses",
  "assessments",
  "books",
  "learning_logs",
  "weekly_reviews",
  "investments",
] as const;
const wipeOrder = [
  "habit_logs",
  "events",
  "tasks",
  "milestones",
  "projects",
  "habits",
  "journal_entries",
  "transactions",
  "goals",
  "assessments",
  "courses",
  "terms",
  "books",
  "learning_logs",
  "weekly_reviews",
  "investments",
] as const;

function SettingsPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const [name, setName] = useState("");
  const [hours, setHours] = useState("40");
  const [mods, setMods] = useState<string[]>([]);
  useEffect(() => {
    setName(profile?.display_name ?? "");
    setHours(String(profile?.weekly_available_hours ?? 40));
    setMods(profile?.enabled_modules ?? []);
  }, [profile]);

  async function save() {
    const h = Math.max(1, Math.min(168, parseInt(hours) || 40));
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name.trim(), weekly_available_hours: h, enabled_modules: mods })
      .eq("id", user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Saved");
  }

  async function exportData() {
    const out: Record<string, unknown> = {
      exported_at: new Date().toISOString(),
      email: user.email,
    };
    for (const t of tables) out[t] = (await (supabase.from(t) as any).select("*")).data;
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `daylight-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }

  async function wipe() {
    if (!confirm("Delete ALL your Daylight data? This cannot be undone.")) return;
    for (const t of wipeOrder) await (supabase.from(t) as any).delete().eq("user_id", user.id);
    qc.invalidateQueries();
    toast.success("All data deleted");
  }

  return (
    <>
      <PageHeader title="Settings" subtitle={user.email ?? ""} />
      <section className="mb-4 space-y-4 rounded-2xl border border-border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="dn">Display name</Label>
            <Input id="dn" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hrs">Hours available to plan per week</Label>
            <Input
              id="hrs"
              type="number"
              min={1}
              max={168}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Sections</Label>
          <p className="text-xs text-muted-foreground">Hidden sections keep their data.</p>
          <ModulePicker value={mods} onChange={setMods} />
        </div>
        <Button onClick={save}>Save settings</Button>
      </section>
      <section className="mb-4 rounded-2xl border border-border bg-card p-5">
        <p className="font-medium">Export your data</p>
        <p className="mb-3 text-sm text-muted-foreground">Download everything as a file.</p>
        <Button variant="outline" onClick={exportData}>
          Download export
        </Button>
      </section>
      <section className="rounded-2xl border border-destructive/30 bg-card p-5">
        <p className="font-medium text-destructive">Delete all data</p>
        <p className="mb-3 text-sm text-muted-foreground">
          Permanently removes everything you've added.
        </p>
        <Button variant="destructive" onClick={wipe}>
          Delete everything
        </Button>
      </section>
    </>
  );
}
