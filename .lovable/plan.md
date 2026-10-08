# Daylight — Phase 2+ plan: edit everywhere, polish, and extend

## What exists today
- Sign-in (email/password, confirmation on), password reset, private data per user.
- Sidebar (desktop) + bottom tabs (mobile): Home, Tasks, Habits, Journal, Money, Goals, Settings, Sign out.
- Tables: profiles, tasks, goals, habits, habit_logs, journal_entries, transactions — all private to the owner.
- Pages can add, complete, toggle and delete — but **tasks, habits, goals, journal entries and transactions cannot be edited** after creation (goal progress slider is the only edit).
- Habits show only the last 7 days; Money has monthly totals and category bars; empty states are one-liners.

## What stays the same
Name, sky-blue on white theme, fonts, sign-in and account security, every current page address, all existing data and tables. No column is removed or renamed. All database changes below only **add** things.

## Phase 1 — Editing + design polish (existing screens)
- **Edit everywhere:** one shared edit dialog pattern. Click a task, habit, goal, journal entry or transaction to open it, change any field, Save or Delete (delete asks to confirm).
- Design system: refined spacing scale, softer card surfaces, section headers with counts, consistent icon sizes, visible focus rings, subtle motion (dialog open, task complete check, progress fill) with reduced-motion respected.
- Better empty states: what the section is for + one clear action button.
- **Home:** "Today" column (overdue + due today, habit check-ins) and "Coming up" column (next 7 days of due dates and goal target dates), compact goal progress.
- **Tasks:** grouped by Overdue / Today / Upcoming / No date, priority shown with label + icon (not color alone), goal chip, inline quick-add.
- **Habits:** 7-day check-ins kept; add a 12-week consistency heatmap per habit with "X of last 30 days" text.
- **Goals:** short-term vs long-term label, linked tasks listed under each goal.
- **Journal:** cleaner writing area, entries grouped by month, click to read/edit.
- **Money:** clearer month summary (income, spent, saved) with month switcher.

## Phase 2 — Projects, Calendar, Time blocks
- **Projects page:** status (planning / active / on hold / done), desired outcome, life area, deadline, milestones, linked tasks, "Break this deadline into steps" helper that creates dated milestones/tasks working backwards.
- **Calendar page:** month, week and day views showing events, task due dates, milestones, exams and time blocks; add/edit events; busy-week warning when planned hours exceed available hours.
- **Time blocks:** reserve time for a task or project in week/day view; planned vs available hours bar per week; drag-free editing via dialog.

## Phase 3 — Goal to daily action links
Goals → projects → milestones → tasks. Goal progress can be manual (current) or automatic from milestone/task completion (user chooses per goal). Goal page shows its projects; project page shows parent goal.

## Phase 4 — Optional modules
- **Onboarding/module picker** (also in Settings): choose Academics, Work projects, Wellbeing (habits/journal), Learning, Money. Unchosen modules are hidden from navigation, never deleted.
- **Academics:** terms, courses, assignments and exams (exams/assignments appear on Calendar).
- **Reading & Learning:** book list (want / reading / finished) with short typed takeaways; learning log (skill, minutes, short note).
- **Weekly Review:** guided form — wins, obstacles, progress, next week's top 3 — with auto summary of tasks done, hours blocked per project/area, habits kept. Past reviews listed.

## Phase 5 — Charts and mobile refinement
Only shown once enough real data exists, otherwise a no-data message. Each has labels, date range, legend, tooltip and a one-line text summary:
- Weekly planned vs available time; hours by project/life area.
- Habit heatmap (from Phase 1).
- Goal/project progress by milestones.
- Monthly spending and savings trend (6 months).
- Investments: manually entered contributions vs current value, clearly marked "manual entries, not advice or live prices".
Mobile: a "More" tab for extra modules, compact chart summaries, larger tap targets.

## Database changes (all additive, safe)
- profiles: add `enabled_modules` (list), `weekly_available_hours`.
- goals: add `horizon` (short/long, default long), `progress_mode` (manual/auto, default manual). Existing goals keep current progress.
- tasks: add nullable `project_id`, `milestone_id`.
- New private tables (owner-only access, same pattern as today): projects, milestones, events, time_blocks, terms, courses, assessments, books, learning_logs, weekly_reviews, investments.
- No deletions, renames or changes to existing rows; sign-in untouched.

## Technical notes
- Reuse `useRows`/`useTableMutations` (extended to new tables); one generic `EditDialog` built on the existing dialog/form components.
- Charts via recharts (already part of the UI kit); dates via existing helpers.
- New pages under the existing signed-in area with their own titles.
- Each phase ships separately and is checked by signing in and running the main flow before moving on.

## Decision for you
Should the module picker appear once after sign-in for existing accounts too (all current modules pre-selected), or only for new accounts? Default proposed: show once to everyone, everything pre-selected.
