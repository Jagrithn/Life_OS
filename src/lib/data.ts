import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createMutations,
  initStore,
  exportData,
  importData,
  wipeData,
  selectAll,
  insertRow,
  updateRow,
} from "./store";

export { insertRow, updateRow, initStore, selectAll };

type Tables = {
  tasks: any;
  goals: any;
  habits: any;
  habit_logs: any;
  journal_entries: any;
  transactions: any;
  projects: any;
  milestones: any;
  events: any;
  terms: any;
  courses: any;
  assessments: any;
  books: any;
  learning_logs: any;
  weekly_reviews: any;
  investments: any;
  profiles: any;
  settings: any;
};

export type TableName =
  | "tasks"
  | "goals"
  | "habits"
  | "habit_logs"
  | "journal_entries"
  | "transactions"
  | "projects"
  | "milestones"
  | "events"
  | "terms"
  | "courses"
  | "assessments"
  | "books"
  | "learning_logs"
  | "weekly_reviews"
  | "investments"
  | "profiles"
  | "settings";

export type Row<T extends TableName> = Tables[T];

const orderBy: Partial<Record<TableName, { col: string; asc: boolean }>> = {
  habits: { col: "created_at", asc: true },
  habit_logs: { col: "log_date", asc: false },
  journal_entries: { col: "entry_date", asc: false },
  transactions: { col: "txn_date", asc: false },
  events: { col: "starts_at", asc: true },
  milestones: { col: "due_date", asc: true },
  assessments: { col: "due_date", asc: true },
  learning_logs: { col: "log_date", asc: false },
  weekly_reviews: { col: "week_start", asc: false },
  investments: { col: "as_of", asc: false },
};

let storeInitialized = false;

async function ensureStore() {
  if (!storeInitialized) {
    await initStore();
    storeInitialized = true;
  }
}

function sortRows<T extends TableName>(table: T, rows: Row<T>[]): Row<T>[] {
  const o = orderBy[table] ?? { col: "created_at", asc: false };
  return [...rows].sort((a, b) => {
    const av = a[o.col];
    const bv = b[o.col];
    if (av === bv) return 0;
    const cmp = String(av).localeCompare(String(bv));
    return o.asc ? cmp : -cmp;
  });
}

export function useRows<T extends TableName>(table: T) {
  return useQuery({
    queryKey: [table],
    queryFn: async () => {
      await ensureStore();
      const rows = selectAll(table);
      return sortRows(table, rows as Row<T>[]);
    },
    initialData: [],
  });
}

export function useTableMutations<T extends TableName>(table: T) {
  const qc = useQueryClient();
  const onSuccess = () => qc.invalidateQueries({ queryKey: [table] });
  const onError = (e: Error) => toast.error(e.message);
  const mut = createMutations(table);
  return {
    insert: useMutation({
      mutationFn: async (values: any | any[]) => {
        if (Array.isArray(values)) {
          for (const v of values) await mut.insert(v);
        } else {
          await mut.insert(values);
        }
      },
      onSuccess,
      onError,
    }),
    update: useMutation({
      mutationFn: async ({ id, values }: { id: string; values: any }) => {
        await mut.update(id, values);
      },
      onSuccess,
      onError,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        await mut.remove(id);
      },
      onSuccess,
      onError,
    }),
  };
}

export type Profile = Row<"profiles">;
export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      await ensureStore();
      const profiles = selectAll("profiles");
      return (profiles[0] as Profile) ?? null;
    },
    initialData: null,
  });
}

export const MODULES = [
  { key: "tasks", label: "Tasks", desc: "Everyday to-dos" },
  { key: "habits", label: "Habits", desc: "Daily streaks" },
  { key: "journal", label: "Journal", desc: "Private reflections" },
  { key: "goals", label: "Goals", desc: "Where you're headed" },
  { key: "projects", label: "Projects", desc: "Work and personal projects" },
  { key: "calendar", label: "Calendar", desc: "Events and time blocks" },
  { key: "money", label: "Money", desc: "Income, spending, investments" },
  { key: "academics", label: "Academics", desc: "Terms, courses, exams" },
  { key: "learning", label: "Reading & learning", desc: "Books and skills" },
  { key: "review", label: "Weekly review", desc: "Reflect and plan" },
] as const;

export const toISO = (d: Date) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
export const todayISO = () => toISO(new Date());
export const addDays = (iso: string, n: number) => {
  const d = new Date(iso + "T00:00");
  d.setDate(d.getDate() + n);
  return toISO(d);
};
export const weekStart = (iso: string) => {
  const d = new Date(iso + "T00:00");
  const day = (d.getDay() + 6) % 7;
  return addDays(iso, -day);
};
export const fmtDate = (
  iso: string,
  opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" },
) => new Date(iso.length === 10 ? iso + "T00:00" : iso).toLocaleDateString("en-IN", opts);
export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
export const hoursBetween = (a: string, b: string) =>
  Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 3600000);

export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export async function exportAllData() {
  await ensureStore();
  return exportData();
}

export async function importAllData(data: Record<string, unknown[]>) {
  await ensureStore();
  await importData(data);
}

export async function wipeAllData() {
  await ensureStore();
  await wipeData();
}
