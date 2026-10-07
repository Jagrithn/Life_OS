import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
export type TableName = "tasks" | "goals" | "habits" | "habit_logs" | "journal_entries" | "transactions";
export type Row<T extends TableName> = Tables[T]["Row"];

const orderBy: Record<TableName, { col: string; asc: boolean }> = {
  tasks: { col: "created_at", asc: false },
  goals: { col: "created_at", asc: false },
  habits: { col: "created_at", asc: true },
  habit_logs: { col: "log_date", asc: false },
  journal_entries: { col: "entry_date", asc: false },
  transactions: { col: "txn_date", asc: false },
};

export function useRows<T extends TableName>(table: T) {
  return useQuery({
    queryKey: [table],
    queryFn: async () => {
      const o = orderBy[table];
      const { data, error } = await supabase.from(table).select("*").order(o.col, { ascending: o.asc });
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
    mutationFn: async (values: Tables[T]["Insert"]) => {
      const { error } = await supabase.from(table).insert(values as never);
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

export const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
