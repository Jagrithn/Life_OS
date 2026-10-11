import { describe, expect, it } from "vitest";

import { buildNotifications } from "@/lib/notifications";
import type { Row } from "@/lib/data";

const base = {
  tasks: [] as Row<"tasks">[],
  events: [] as Row<"events">[],
  assessments: [] as Row<"assessments">[],
  milestones: [] as Row<"milestones">[],
  goals: [] as Row<"goals">[],
  projects: [] as Row<"projects">[],
  habits: [] as Row<"habits">[],
  habitLogs: [] as Row<"habit_logs">[],
  reviews: [] as Row<"weekly_reviews">[],
};

const task = (over: Partial<Row<"tasks">>): Row<"tasks"> =>
  ({
    id: "t1",
    title: "Write report",
    done: false,
    due_date: null,
    priority: "medium",
    goal_id: null,
    milestone_id: null,
    project_id: null,
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
    user_id: "u1",
    ...over,
  }) as Row<"tasks">;

const event = (over: Partial<Row<"events">>): Row<"events"> =>
  ({
    id: "e1",
    title: "Standup",
    kind: "event",
    note: null,
    starts_at: "2026-10-07T10:00:00",
    ends_at: "2026-10-07T10:30:00",
    task_id: null,
    project_id: null,
    created_at: "2026-10-01T00:00:00Z",
    user_id: "u1",
    ...over,
  }) as Row<"events">;

const weekday = new Date("2026-10-07T10:00:00");
const weekend = new Date("2026-10-11T10:00:00");

describe("buildNotifications", () => {
  it("flags overdue tasks and ignores completed ones", () => {
    const result = buildNotifications({
      ...base,
      tasks: [
        task({ due_date: "2026-10-04" }),
        task({ id: "t2", done: true, due_date: "2026-10-04" }),
      ],
      now: weekday,
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ kind: "task", severity: "overdue", mod: "tasks" });
  });

  it("flags a task due today", () => {
    const result = buildNotifications({
      ...base,
      tasks: [task({ due_date: "2026-10-07" })],
      now: weekday,
    });
    expect(result[0]?.severity).toBe("today");
  });

  it("marks an in-progress event as happening now", () => {
    const result = buildNotifications({ ...base, events: [event({})], now: weekday });
    expect(result[0]).toMatchObject({ kind: "event", body: "Event • Happening now" });
  });

  it("suggests the weekly review on a weekend when missing", () => {
    const result = buildNotifications({ ...base, now: weekend });
    expect(result.some((n) => n.kind === "review")).toBe(true);
  });

  it("stays quiet about the review once it exists", () => {
    const result = buildNotifications({
      ...base,
      reviews: [{ week_start: "2026-10-05" } as Row<"weekly_reviews">],
      now: weekend,
    });
    expect(result.some((n) => n.kind === "review")).toBe(false);
  });
});
