# Agent notes — Ordo

## Commands

- `npm run dev` — dev server
- `npm run build` — production build (Vite + Nitro)
- `npm run lint` / `npm run typecheck` / `npm run test` — must pass before committing
- `npm run deploy` — build + `wrangler deploy` (uses the committed `wrangler.json`)

## Architecture

- TanStack Start file-based routes live in `src/routes/`. The app shell is the
  layout route `src/routes/_app/route.tsx`; pages live under `src/routes/_app/`,
  and the route file is the page.
- Data access goes through `src/lib/data.ts` (`useRows`, `useTableMutations`,
  `useProfile`, helpers, formatters). Prefer these over touching the store
  directly.
- Storage is **local-first**: `src/lib/local-db.ts` is a zero-dependency IndexedDB
  wrapper (database `ordo`, schema v1) and `src/lib/store.ts` holds rows in memory
  and publishes changes through `useSyncExternalStore`. There is no Supabase,
  no auth, and no env vars — never reintroduce one.
- `src/lib/store.ts` and `src/lib/local-db.ts` must stay importable on the server:
  every entry point guards on `typeof indexedDB` / `typeof localStorage`, because
  throwing here takes the whole page down with a 500.
- UI primitives are shadcn/ui components in `src/components/ui/`. Reuse them.
- Formatting is enforced by Prettier (`npm run format`); run it before committing.

## Gotchas

- `npm run build` emits the worker into `dist/` (not `.output/`). A deploy command
  pointing at `.output/server/wrangler.json` fails silently in Cloudflare Workers
  Builds and leaves the previous version live — check the build log first.
- Goals are recursive: a row's `parent_id` may point at another goal, and
  `progress_mode: "cascade"` derives progress from children rather than from
  linked tasks. `horizon` is one of `5y|1y|6m|3m|1m|1w`; `toHorizon()` in
  `src/routes/_app/goals.tsx` maps the legacy `short`/`long` values.
