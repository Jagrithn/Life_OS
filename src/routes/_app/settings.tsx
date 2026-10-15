import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";
import { ModulePicker } from "@/components/ModulePicker";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useProfile, updateRow, exportAllData, importAllData, wipeAllData } from "@/lib/data";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Ordo" },
      { name: "description", content: "Your profile, appearance, sections and data." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const [name, setName] = useState("");
  const [hours, setHours] = useState("40");
  const [mods, setMods] = useState<string[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);
  useEffect(() => {
    setName(profile?.display_name ?? "");
    setHours(String(profile?.weekly_available_hours ?? 40));
    setMods(profile?.enabled_modules ?? []);
  }, [profile]);

  async function save() {
    const h = Math.max(1, Math.min(168, parseInt(hours) || 40));
    await updateRow("profiles", "local-user", {
      display_name: name.trim(),
      weekly_available_hours: h,
      enabled_modules: mods,
    });
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Saved");
  }

  async function handleExport() {
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ordo-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }

  async function handleImport() {
    if (!importFile) return;
    try {
      const data = JSON.parse(await importFile.text());
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("That file isn't an Ordo export.");
      }
      await importAllData(data);
      qc.invalidateQueries();
      toast.success("Imported successfully");
      setImportFile(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read that file");
    }
  }

  async function wipe() {
    if (!confirm("Delete ALL your Ordo data? This cannot be undone.")) return;
    await wipeAllData();
    qc.invalidateQueries();
    toast.success("All data deleted");
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Your profile, appearance, sections and data." />
      <section className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5">
        <div>
          <p className="font-medium">Appearance</p>
          <p className="text-sm text-muted-foreground">Light, dark, or follow your system.</p>
        </div>
        <ThemeToggle />
      </section>
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
        <p className="mb-3 text-sm text-muted-foreground">Download everything as a JSON file.</p>
        <Button variant="outline" onClick={handleExport}>
          Download export
        </Button>
      </section>
      <section className="mb-4 rounded-2xl border border-border bg-card p-5">
        <p className="font-medium">Import data</p>
        <p className="mb-3 text-sm text-muted-foreground">
          Restore from a previously exported JSON file.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".json"
            className="sr-only"
            id="import-file"
            onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
          />
          <label htmlFor="import-file" className="cursor-pointer">
            <Button variant="outline">Choose file</Button>
          </label>
          {importFile && (
            <>
              <span className="text-sm text-muted-foreground">{importFile.name}</span>
              <Button onClick={handleImport}>Import</Button>
            </>
          )}
        </div>
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
