# Daylight — Life OS

A calm, private "operating system for your life": tasks, habits, journal, money,
goals, projects, calendar, academics, learning and a weekly review, all in one
place. Every user's data is isolated with Postgres row-level security.

## Features

- **Home dashboard** — today's priorities, habit check-ins, goal progress, the coming week.
- **Tasks** — quick-add, due dates, priorities, grouped by Overdue / Today / Next 7 days / Later.
- **Habits** — daily check-ins, streaks and a 12-week heatmap.
- **Journal** — private dated entries with moods, grouped by month.
- **Money** — income/expense log in INR, category breakdown, 6-month trend, manual investments.
- **Goals** — short/long-term, manual or automatic progress from linked projects/tasks/milestones.
- **Projects** — status, desired outcome, milestones, linked tasks and a "break the deadline into steps" helper.
- **Calendar** — month/week/day views for events, deadlines and focus blocks, with a busy-week warning.
- **Academics** — terms, courses, assignments and exams (also shown on the calendar).
- **Reading & learning** — book list with takeaways and a practice log.
- **Weekly review** — guided prompts plus an automatic summary of the week.
- **Settings** — display name, available hours, section picker, data export and delete-all.

Modules are opt-in: the section picker on first sign-in (and in Settings) hides
sections you don't use without ever deleting data.

## Tech stack

- [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router) and React 19
- [Vite](https://vite.dev) + [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- [Supabase](https://supabase.com) for authentication and Postgres (with RLS)
- TypeScript throughout; Vitest for tests

## Getting started

Requires Node.js 20+ and npm.

```sh
git clone https://github.com/Jagrithn/Life_OS.git
cd Life_OS
npm install
cp .env.example .env   # then fill in your Supabase project values
npm run dev
```

The dev server runs on <http://localhost:5173> by default.

### Environment

Create a Supabase project and copy the values from **Project Settings → API**
into `.env` (see `.env.example` for the full list). The `VITE_`-prefixed
variables are exposed to the browser at build time; the service-role key is
server-only and must never be committed.

### Database

Schema lives in `supabase/migrations/`. Apply the migrations to your Supabase
project (for example with `supabase db push`, or by running the SQL in the
SQL editor). Row-level security is enabled on every table so each user only
ever sees their own rows.

## Scripts

| Command             | Description                  |
| ------------------- | ---------------------------- |
| `npm run dev`       | Start the dev server         |
| `npm run build`     | Production build             |
| `npm run preview`   | Preview the production build |
| `npm run lint`      | ESLint                       |
| `npm run typecheck` | TypeScript type check        |
| `npm run test`      | Run tests once               |
| `npm run format`    | Format with Prettier         |
