import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BookOpen, CalendarDays, CheckSquare, ClipboardCheck, FolderKanban, GraduationCap, Flame, Home, Library, LogOut, Menu, Settings, Sun, Target, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ModulePicker } from "@/components/ModulePicker";
import { useProfile } from "@/lib/data";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AppShell,
});

const nav = [
  { to: "/dashboard", label: "Home", icon: Home, mod: null },
  { to: "/tasks", label: "Tasks", icon: CheckSquare, mod: "tasks" },
  { to: "/calendar", label: "Calendar", icon: CalendarDays, mod: "calendar" },
  { to: "/projects", label: "Projects", icon: FolderKanban, mod: "projects" },
  { to: "/goals", label: "Goals", icon: Target, mod: "goals" },
  { to: "/habits", label: "Habits", icon: Flame, mod: "habits" },
  { to: "/journal", label: "Journal", icon: BookOpen, mod: "journal" },
  { to: "/finance", label: "Money", icon: Wallet, mod: "money" },
  { to: "/academics", label: "Academics", icon: GraduationCap, mod: "academics" },
  { to: "/learning", label: "Learning", icon: Library, mod: "learning" },
  { to: "/review", label: "Weekly review", icon: ClipboardCheck, mod: "review" },
] as const;

function AppShell() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = Route.useRouteContext();
  const { data: profile } = useProfile();
  const [more, setMore] = useState(false);
  const [mods, setMods] = useState<string[]>([]);
  const enabled = profile?.enabled_modules ?? nav.map((n) => n.mod).filter(Boolean);
  const items = nav.filter((n) => !n.mod || enabled.includes(n.mod));
  const needsSetup = !!profile && !profile.onboarded;
  useEffect(() => { if (profile) setMods(profile.enabled_modules); }, [profile]);

  async function finishSetup() {
    const { error } = await supabase.from("profiles").update({ enabled_modules: mods, onboarded: true }).eq("id", user.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["profile"] });
  }
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  const linkCls = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const tabs = items.slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-card p-4 md:flex">
        <Link to="/dashboard" className="mb-8 flex items-center gap-2 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Sun className="h-5 w-5" /></span>
          <span className="font-heading text-lg font-bold">Daylight</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
          {items.map((n) => (
            <Link key={n.to} to={n.to} className={linkCls} activeProps={{ className: "bg-accent text-accent-foreground" }}>
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <Link to="/settings" className={linkCls} activeProps={{ className: "bg-accent text-accent-foreground" }}><Settings className="h-4 w-4" /> Settings</Link>
        <button onClick={signOut} className={linkCls}><LogOut className="h-4 w-4" /> Sign out</button>
      </aside>

      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <span className="flex items-center gap-2 font-heading font-bold"><Sun className="h-5 w-5 text-primary" /> Daylight</span>
        <Link to="/settings" aria-label="Settings"><Settings className="h-5 w-5 text-muted-foreground" /></Link>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 animate-in fade-in duration-300 md:ml-60 md:px-10 md:pb-12 md:pt-10">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-border bg-card md:hidden">
        {tabs.map((n) => (
          <Link key={n.to} to={n.to} className="flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground" activeProps={{ className: "text-primary" }}>
            <n.icon className="h-5 w-5" /> {n.label}
          </Link>
        ))}
        <button onClick={() => setMore(true)} className="flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground"><Menu className="h-5 w-5" /> More</button>
      </nav>
      <Sheet open={more} onOpenChange={setMore}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader><SheetTitle>All sections</SheetTitle></SheetHeader>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {items.slice(4).map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setMore(false)} className="flex flex-col items-center gap-1 rounded-xl border border-border p-3 text-xs"><n.icon className="h-5 w-5 text-primary" />{n.label}</Link>
            ))}
            <button onClick={signOut} className="flex flex-col items-center gap-1 rounded-xl border border-border p-3 text-xs"><LogOut className="h-5 w-5" />Sign out</button>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={needsSetup}>
        <DialogContent className="sm:max-w-xl" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Make Daylight yours</DialogTitle>
            <DialogDescription>Pick the sections you want. You can change this any time in Settings — hiding a section never deletes its data.</DialogDescription>
          </DialogHeader>
          <ModulePicker value={mods} onChange={setMods} />
          <Button onClick={finishSetup} className="w-full">Continue</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
