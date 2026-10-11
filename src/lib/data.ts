import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
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
  | "investments";
export type Row<T extends TableName> = Tables[T]["Row"];

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

export function useRows<T extends TableName>(table: T) {
  return useQuery({
    queryKey: [table],
    queryFn: async () => {
      const o = orderBy[table] ?? { col: "created_at", asc: false };
      const { data, error } = await (supabase.from(table) as any)
        .select("*")
        .order(o.col, { ascending: o.asc });
      if (error) throw error;
      return data as unknown as Row<T>[];
    },
  });
}

export function useTableMutations<T extends TableName>(table: T) {
  const qc = useQueryClient();
  const onSuccess = () => qc.invalidateQueries({ queryKey: [table] });
  const onError = (e: Error) => toast.error(e.message);
  const insert = useMutation({
    mutationFn: async (values: Tables[T]["Insert"] | Tables[T]["Insert"][]) => {
      const { error } = await (supabase.from(table) as any).insert(values);
      if (error) throw error;
    },
    onSuccess,
    onError,
  });
  const update = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Tables[T]["Update"] }) => {
      const { error } = await (supabase.from(table) as any).update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess,
    onError,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from(table) as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess,
    onError,
  });
  return { insert, update, remove };
}

export type Profile = Tables["profiles"]["Row"];
export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      return (await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle())
        .data as Profile | null;
    },
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
