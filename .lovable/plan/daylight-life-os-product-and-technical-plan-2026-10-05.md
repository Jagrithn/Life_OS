# Daylight — Life OS: Product and Technical Plan

The look and feel follows your Daylight prototype: soft green-on-cream palette, Manrope headings, DM Sans body text, left sidebar on desktop, and a bottom tab bar on phones.

## 1. Scope and phases

**Release 1 (core loop, private accounts)**
- Accounts: email/password and Google sign-in, password reset, and a private workspace for each person.
- Onboarding: choose life areas and modules, currency, week start day, and time zone.
- Home dashboard: today's priorities, upcoming 7 days, active projects, habits for today, and goal progress.
- Tasks: quick capture, due date, priority, life area, and optional link to a project or goal.
- Projects: outcome, status, milestones, due date, and tasks. Progress is calculated from completed tasks.
- Goals: long-term and short-term goals, milestones, progress, and linked projects and tasks.
- Calendar: month and day views showing events, focus blocks, task due dates, and milestones. Overloaded days and weeks are flagged.
- Habits: daily, weekly, or a set number of times per week. Check-ins and a simple history grid.
- Settings: module toggles, profile, JSON/CSV export, and account deletion.

**Release 2**
- Journal: daily reflections and a guided weekly review.
- Money: expenses, savings, budgets, and investments in the user's chosen currency. Manual entry only, with no advice.
- Reading and learning: book shelf with status and takeaways, plus a learning log.
- Deadline breakdown: turn a deadline into earlier steps, with suggested dates spread back from the due date.

**Release 3**
- Academics module: terms, courses, assignments, and exams that feed into tasks and the calendar.
- Optional sharing: read-only share of a single project or goal with chosen people.
- Import from the prototype's JSON backup.

**Later (not in the first release)**
- Reminders and notifications, calendar sync, AI planning, native-app packaging, and paid plans.

Text limits apply everywhere. Journal entries are capped at 5,000 characters. Takeaways and learning entries are capped at 1,000 characters. There are no file uploads anywhere.

## 2. Main screens and key journeys
Screens: Sign in, Onboarding, Home, Calendar (month/day), Tasks, Projects (list and detail), Goals (list and detail), Habits, Journal, Money, Reading and Learning, Academics, and Settings.

Key journeys:
1. Sign up, pick modules, and land on a Home page filled with suggestions.
2. Capture a task in 2 seconds from anywhere using a keyboard shortcut or the + button.
3. Create a project, add milestones, break a deadline into steps, and see the steps on the calendar.
4. Plan a week, get an overload warning, and drag or reschedule tasks.
5. Do the evening routine: check off habits and write a journal reflection. On Sunday, complete a weekly review.
6. Export all data, or permanently delete the account.

## 3. Database outline

```text
profiles (1:1 user) -- settings: modules[], currency, timezone, week_start
life_areas  (user)            
goals       (user, parent_goal?, horizon long/short, life_area?)
projects    (user, goal?, status, outcome, due_date, life_area?)
milestones  (user, project? | goal?, due_date, done)
tasks       (user, project?, goal?, milestone?, course?, due, priority, life_area?, status)
events      (user, kind: event|appointment|exam|submission|focus, start, end, project?, course?)
habits      (user, schedule) -> habit_checkins (habit, date)
journal_entries (user, date, kind daily|weekly, body)
books (user, status) -> book_takeaways (book, text)
learning_entries (user, topic, kind lesson|skill|course|practice, text, minutes)
money_accounts (user, kind savings|investment|cash)
transactions (user, account?, category, amount, date, type expense|income|transfer)
budgets (user, category, month, limit)
terms -> courses -> (assignments = tasks, exams = events)
shares (owner, item_type, item_id, grantee, permission)   [Release 3]
```

Every table includes `user_id`. Links between rows can only point to rows owned by the same user.

## 4. Privacy, access, export, deletion
- Row-level security on every table: a person can only read or write rows where `user_id` is their own. The rules live in the database, so a bug in the app cannot leak data.
- Journal and money data are never included in sharing, even after sharing is added.
- Sharing (Release 3) works item by item, is read-only by default, and can be revoked at any time.
- Export: a single JSON file of everything, plus CSV files for money and tasks.
- Deletion: requires typing a confirmation. All rows are removed through cascading deletes, along with the login.
- Automated privacy tests run two test users and confirm neither can see the other's data before launch.

## 5. Free tier and costs
- **Lovable:** the free plan has daily message credits. Building this will likely need a paid plan, which costs about $25/month.
- **Lovable Cloud** (the database and logins) has free monthly usage, then charges by use. Text-only data is very light: roughly thousands of active users fit before costs become meaningful. Usage is shown in Cloud settings.
- If you specifically want your own Supabase account instead: its free tier allows 500 MB of storage and 50k monthly users, and pauses after 1 week of no activity. It has no automatic backups; the Pro plan costs $25/month and includes daily backups.
- **Backups:** code is synced to a private GitHub repo (free). User data relies on platform backups plus each user's own export.
- **Possible costs:** a custom domain (about $10–15/year), a custom email sender for reset emails at scale, and paid tiers as usage grows.

## 6. Build order (one reviewable slice at a time)
1. App shell, design system, and responsive navigation.
2. Accounts, profiles, onboarding, and module toggles, with privacy rules and tests.
3. Tasks and quick capture.
4. Projects and milestones.
5. Goals with linked progress.
6. Calendar, events, focus blocks, and overload detection.
7. Home dashboard that combines the above.
8. Habits.
9. Settings: export and deletion. **Release 1 review.**
10. Journal and weekly review. 11. Money. 12. Reading and learning. 13. Deadline breakdown.
14. Academics. 15. Sharing. 16. Prototype import.

## 7. Questions before coding
1. Use Lovable Cloud (recommended: no setup, same technology underneath) or your own Supabase account?
2. Sign-in methods: is email plus Google enough?
3. Should Release 1 include Journal instead of waiting for Release 2?
4. Weekly overload rule: should it count task hours plus focus hours over a limit the user sets (default 40 hours/week)?
5. Do you need multiple currencies per user, or one chosen currency only?
6. Should the app work offline, or is online-only fine for Release 1?

## Technical details
- TanStack Start with React and Tailwind, plus the Lovable Cloud database and logins.
- Server functions require the signed-in user, and row-level security is applied on top as a second layer.
- Each module is its own route under a signed-in area. Hidden modules are removed from navigation but their data is kept.
- Dates are stored in UTC and shown in the user's time zone.
- GitHub is connected by you from Project Settings.
