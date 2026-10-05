import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckSquare, Flame, BookOpen, Wallet, Target, LayoutDashboard, Sun } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Daylight Life OS — Your calm daily operating system" },
      {
        name: "description",
        content:
          "Daylight Life OS brings your tasks, habits, journal, finances, and goals into one calm, private space.",
      },
      { property: "og:title", content: "Daylight Life OS — Your calm daily operating system" },
      {
        property: "og:description",
        content:
          "Daylight Life OS brings your tasks, habits, journal, finances, and goals into one calm, private space.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const modules = [
  {
    icon: LayoutDashboard,
    name: "Dashboard",
    blurb: "Today at a glance — tasks, habits, and a gentle journal prompt.",
  },
  {
    icon: CheckSquare,
    name: "Tasks",
    blurb: "Capture, prioritize, and complete what matters, with due dates.",
  },
  {
    icon: Flame,
    name: "Habits",
    blurb: "Build daily rituals and watch your streaks grow.",
  },
  {
    icon: BookOpen,
    name: "Journal",
    blurb: "Private, dated entries. Short text, fully yours.",
  },
  {
    icon: Wallet,
    name: "Finance",
    blurb: "A simple income and expense log in INR.",
  },
  {
    icon: Target,
    name: "Goals",
    blurb: "Long-term goals linked to the tasks and habits that feed them.",
  },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sun className="h-5 w-5" />
          </span>
          <span className="font-heading text-lg font-bold tracking-tight">Daylight</span>
        </div>
        <Link
          to="/dashboard"
          className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Open Daylight
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-20 text-center sm:pt-24">
        <p className="mb-4 inline-block rounded-full bg-accent px-4 py-1 text-sm font-medium text-accent-foreground">
          A calm operating system for your life
        </p>
        <h1 className="font-heading text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Everything that matters,
          <span className="text-primary"> in one quiet place.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Tasks, habits, journal, money, and goals — private by default, simple on
          purpose, and designed to stay out of your way.
        </p>
      </section>

      {/* Modules */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <div
              key={m.name}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <m.icon className="h-5 w-5" />
              </span>
              <h2 className="font-heading text-lg font-bold">{m.name}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{m.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        Daylight Life OS — private by design.
      </footer>
    </div>
  );
}
