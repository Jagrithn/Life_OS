# Daylight Life OS — Release 1 Plan

A calm, green-on-cream life-organization app (#2d755a on #f5f6f2, Manrope headings, DM Sans body) matching your prototype, backed by your own Supabase project with email/password sign-in only.

## Prerequisite (you do this)

Connect your Supabase account: **Project Settings → Connectors → Supabase** → sign in → pick or create a project (free tier is fine). Nothing below can run until this is linked.

## What gets built

### 1. Foundation
- App shell: sidebar navigation, top bar, green-on-cream theme tokens
- Sign-in / sign-up page (email + password only) and sign-out
- Private workspaces: every user's data is fully isolated (row-level security)

### 2. Database (your Supabase)
- `profiles` — display name, auto-created on signup
- Tables for each module below, all scoped to the signed-in user

### 3. Modules (Release 1)
- **Dashboard** — today at a glance: tasks, habits, journal prompt, quick stats
- **Tasks** — create, prioritize, complete, due dates
- **Habits** — daily habit tracking with streaks
- **Journal** — dated entries, short text only, private
- **Finance** — simple income/expense log in INR only
- **Goals** — long-term goals linked to tasks/habits

### 4. Polish
- Empty states, loading states, mobile-friendly layout
- Page titles and descriptions for sharing/SEO

## Explicitly out of scope (per your decisions)
- No file uploads — short text only
- No bank, calendar, or AI integrations in R1
- No social login (Google/Apple) — email/password only
- No multi-currency — INR only

## Technical details
- TanStack Start + React 19, Tailwind v4 theme tokens in `src/styles.css`
- Supabase: `profiles` table + per-module tables, RLS policies scoped to `auth.uid()`, signup trigger for profile creation
- Protected pages under `_authenticated/` layout; public landing page at `/`
- Server functions via `createServerFn` with `requireSupabaseAuth`; no Edge Functions

## Order of work
1. You connect Supabase
2. Theme + app shell + auth
3. Database schema + security policies
4. Modules one at a time: Tasks → Habits → Journal → Finance → Goals → Dashboard
