# Ordo — Life OS

A calm, private "operating system for your life": tasks, habits, journal, money,
goals, projects, calendar, academics, learning and a weekly review, all in one
place — with reminders that keep you on top of it. Designed in a strict
monochrome system with a light/dark theme.

**Everything runs locally in your browser.** There is no account, no server-side
database, and no network call to read or write your data — IndexedDB on your
device is the source of truth. Export a JSON backup any time from Settings.

## Features

- **Command palette** — press ⌘K / Ctrl K anywhere to jump between sections or create a task.
- **Reminders** — a notifications bell for overdue and upcoming tasks, events, exams, milestones, goal targets, project deadlines, habit check-ins and the weekly review, plus optional browser notifications.
- **Home dashboard** — today's priorities, habit check-ins, goal progress, the coming week.
- **Tasks** — quick-add, due dates, priorities, grouped by Overdue / Today / Next 7 days / Later.
- **Habits** — daily check-ins, streaks and a 12-week heatmap.
- **Journal** — private dated entries with moods, grouped by month.
- **Money** — income/expense log in INR, category breakdown, 6-month trend, manual investments.
- **Goals** — multi-horizon (5y → 1w), nested under a parent goal, with manual, automatic, or cascading progress.
- **Projects** — status, desired outcome, milestones, linked tasks and a "break the deadline into steps" helper.
- **Calendar** — month/week/day views for events, deadlines and focus blocks, with a busy-week warning.
- **Academics** — terms, courses, assignments and exams (also shown on the calendar).
- **Reading & learning** — book list with takeaways and a practice log.
- **Weekly review** — guided prompts plus an automatic summary of the week.
- **Appearance** — light, dark or system theme with a FOUC-free switch.
- **Settings** — display name, available hours, section picker, export/import your data, and delete-everything.

Modules are opt-in: the section picker on first run (and in Settings) hides
sections you don't use without ever deleting data.

### Reminders

Reminders are derived from your existing data — nothing extra to configure. The
bell in the sidebar (and the mobile header) shows anything overdue or due soon
and respects the sections you've enabled. Open the bell and choose **Enable
browser notifications** to get desktop notifications even when the tab is in the
background; you can dismiss individual reminders or mark them all read, and
dismissals are remembered locally.

### Your data

- Stored in IndexedDB (`ordo` database, schema v1) on this device only.
- **Export** from Settings → _Export your data_ (`ordo-export-YYYY-MM-DD.json`).
- **Import** from Settings → _Import data_ to restore that file (merges by `id`).
- **Delete everything** in Settings permanently clears the database.
- Clearing the browser's site data (or using a private window) discards it — keep
  an export if you care about it.

## Tech stack

- [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router) and React 19
- [Vite](https://vite.dev) + [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- TanStack Query over a local IndexedDB store (`src/lib/local-db.ts` + `src/lib/store.ts`)
- TypeScript throughout; Vitest for tests

## Getting started

Requires Node.js 20+ and npm. No environment variables or database setup.

```sh
git clone https://github.com/Jagrithn/Life_OS.git
cd Life_OS
npm install
npm run dev
```

The dev server runs on <http://localhost:5173> by default.

## Deploy to Cloudflare (free)

The app builds for **Cloudflare Workers** (free tier: 100k requests/day) and is a
**PWA** — installable with an Add-to-Home-Screen icon and badges. It is a fully
static Worker: no secrets, no database, no environment variables.

```sh
npm run build       # emits the worker into dist/
npm run deploy      # builds + deploys with wrangler
```

The worker is configured in the committed [`wrangler.json`](./wrangler.json):
worker name `life-os`, entry `dist/server/index.mjs` and static assets bound to
`dist/public`.

### Cloudflare Workers Builds (GitHub-connected)

If you deploy from GitHub instead of your machine, the Build settings for the
worker must be:

| Setting        | Value                 |
| -------------- | --------------------- |
| Root directory | `/` (empty)           |
| Branch         | `main`                |
| Build command  | `npm run build`       |
| Deploy command | `npx wrangler deploy` |

`npm run build` writes to `dist/` — **not** `.output/`. If the deploy command is
ever pointed at `--config .output/server/wrangler.json` it will fail with
`ENOENT` and the previously deployed version stays live, which is easy to mistake
for a code problem. Check the build log first.

Add your own domain any time on the Cloudflare dashboard — no code changes needed.

## Scripts

| Command             | Description                  |
| ------------------- | ---------------------------- |
| `npm run dev`       | Start the dev server         |
| `npm run build`     | Production build             |
| `npm run deploy`    | Build + deploy with wrangler |
| `npm run lint`      | ESLint                       |
| `npm run typecheck` | TypeScript type check        |
| `npm run test`      | Run tests once               |
| `npm run format`    | Format with Prettier         |
