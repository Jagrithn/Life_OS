# Agent notes — Ordo

## Commands

- `npm run dev` — dev server
- `npm run build` — production build (Vite + Nitro)
- `npm run lint` / `npm run typecheck` / `npm run test` — must pass before committing

## Conventions

- TanStack Start file-based routes live in `src/routes/`. Signed-in pages are
  under `src/routes/_authenticated/`; the route file is the page.
- Data access goes through `src/lib/data.ts` (`useRows`, `useTableMutations`,
  helpers, formatters). Prefer these over ad-hoc Supabase calls.
- UI primitives are shadcn/ui components in `src/components/ui/`. Reuse them.
- Supabase clients live in `src/integrations/supabase/`. The browser client
  (`client.ts`) is RLS-scoped; `client.server.ts` bypasses RLS and must only be
  imported from `*.server.ts` modules.
- Formatting is enforced by Prettier (`npm run format`); run it before committing.

## Database

- Schema changes go in `supabase/migrations/` as new, additive SQL files. Every
  new table gets grants, RLS enabled, and an owner-only policy following the
  existing pattern. Never edit an already-applied migration.
