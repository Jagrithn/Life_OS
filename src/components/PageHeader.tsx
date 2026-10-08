import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Empty({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-secondary/40 px-6 py-10 text-center">
      {title && <p className="font-heading font-semibold">{title}</p>}
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{children}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Section({ title, count, action, children, className = "" }: { title: string; count?: number; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`mb-8 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
          {count !== undefined && <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-foreground">{count}</span>}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
