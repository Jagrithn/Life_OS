import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, LogOut, Menu, Search, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ModulePicker } from "@/components/ModulePicker";
import { CommandPalette } from "@/components/CommandPalette";
import { NotificationBell } from "@/components/NotificationBell";
import { OrdoMark } from "@/components/OrdoMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useInstallPrompt } from "@/lib/pwa";
import { useProfile, insertRow, updateRow, type Profile } from "@/lib/data";
import { useReminders } from "@/lib/notifications";
import { navItems, visibleNav } from "@/lib/nav";

export const Route = createFileRoute("/_app")({
  ssr: false,
  beforeLoad: async () => {
    await import("@/lib/data").then(({ initStore }) => initStore());
    const profiles = await import("@/lib/store").then(({ selectAll }) => selectAll("profiles"));
    let profile = profiles[0];
    if (!profile) {
      profile = (await insertRow("profiles", {
        id: "local-user",
        display_name: "You",
        weekly_available_hours: 40,
        enabled_modules: navItems.map((n) => n.mod).filter(Boolean) as string[],
        onboarded: false,
      })) as Profile;
    }
    return { user: { id: "local-user", email: "local@ordo" }, profile };
  },
  component: AppShell,
});

function AppShell() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, profile: ctxProfile } = Route.useRouteContext();
  const { data: profile } = useProfile();
  const [more, setMore] = useState(false);
  const [cmdk, setCmdk] = useState(false);
  const [mods, setMods] = useState<string[]>([]);
  const effectiveProfile = profile ?? ctxProfile;
  const enabled: string[] =
    effectiveProfile?.enabled_modules ?? (navItems.map((n) => n.mod).filter(Boolean) as string[]);
  const items = visibleNav(enabled);
  const reminders = useReminders(enabled);
  const { canInstall, install } = useInstallPrompt();
  const needsSetup = !!effectiveProfile && !effectiveProfile.onboarded;
  useEffect(() => {
    if (effectiveProfile) setMods(effectiveProfile.enabled_modules ?? []);
  }, [effectiveProfile]);

  async function finishSetup() {
    await updateRow("profiles", "local-user", { enabled_modules: mods, onboarded: true });
    qc.invalidateQueries({ queryKey: ["profile"] });
  }
  const linkCls =
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const tabs = items.slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-card p-4 md:flex">
        <Link to="/dashboard" className="mb-8 flex items-center gap-2 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <OrdoMark className="h-5 w-5" />
          </span>
          <span className="font-heading text-lg font-bold tracking-tight">Ordo</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
          {items.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={linkCls}
              activeProps={{ className: "bg-accent text-accent-foreground" }}
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <button onClick={() => setCmdk(true)} className={linkCls} aria-label="Search (Command K)">
          <Search className="h-4 w-4" /> Search
          <kbd className="ml-auto rounded border border-border px-1.5 py-0.5 text-[10px] font-medium">
            ⌘K
          </kbd>
        </button>
        <NotificationBell reminders={reminders} />
        <div className="mb-1 mt-1 px-1">
          <ThemeToggle className="w-full justify-center" />
        </div>
        {canInstall && (
          <button onClick={install} className={linkCls} aria-label="Install app">
            <Download className="h-4 w-4" /> Install app
          </button>
        )}
        <Link
          to="/settings"
          className={linkCls}
          activeProps={{ className: "bg-accent text-accent-foreground" }}
        >
          <Settings className="h-4 w-4" /> Settings
        </Link>
      </aside>

      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <span className="flex items-center gap-2 font-heading font-bold">
          <OrdoMark className="h-5 w-5" /> Ordo
        </span>
        <div className="flex items-center gap-3">
          <button onClick={() => setCmdk(true)} aria-label="Search">
            <Search className="h-5 w-5 text-muted-foreground" />
          </button>
          <NotificationBell reminders={reminders} compact />
          <Link to="/settings" aria-label="Settings">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 animate-in fade-in duration-300 md:ml-60 md:px-10 md:pb-12 md:pt-10">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-border bg-card md:hidden">
        {tabs.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground"
            activeProps={{ className: "text-primary" }}
          >
            <n.icon className="h-5 w-5" /> {n.label}
          </Link>
        ))}
        <button
          onClick={() => setMore(true)}
          className="flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground"
        >
          <Menu className="h-5 w-5" /> More
        </button>
      </nav>
      <Sheet open={more} onOpenChange={setMore}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>All sections</SheetTitle>
          </SheetHeader>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {items.slice(4).map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setMore(false)}
                className="flex flex-col items-center gap-1 rounded-xl border border-border p-3 text-xs"
              >
                <n.icon className="h-5 w-5 text-primary" />
                {n.label}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <CommandPalette enabled={enabled} onSignOut={() => {}} open={cmdk} onOpenChange={setCmdk} />

      <Dialog open={needsSetup} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-xl" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Make Ordo yours</DialogTitle>
            <DialogDescription>
              Pick the sections you want. You can change this any time in Settings — hiding a
              section never deletes its data.
            </DialogDescription>
          </DialogHeader>
          <ModulePicker value={mods} onChange={setMods} />
          <Button onClick={finishSetup} className="w-full">
            Continue
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
