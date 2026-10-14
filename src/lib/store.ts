import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { AnyRow, TableName } from "./local-db";
import {
  getAll,
  getById,
  getByIndex,
  put,
  putMany,
  del,
  delByIndex,
  clear,
  exportAll,
  importAll,
  wipeAll,
} from "./local-db";

const SCHEMA_VERSION = 1;
const SCHEMA_KEY = "ordo:schema";

export type Row<T extends TableName> = AnyRow & { table: T };

interface StoreState {
  tables: Map<TableName, Map<string, AnyRow>>;
  listeners: Set<() => void>;
}

const state: StoreState = {
  tables: new Map(),
  listeners: new Set(),
};

function emit() {
  for (const l of state.listeners) l();
}

function subscribe(fn: () => void) {
  state.listeners.add(fn);
  return () => state.listeners.delete(fn);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return state;
}

export function useStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function ensureTable(table: TableName) {
  if (!state.tables.has(table)) state.tables.set(table, new Map());
  return state.tables.get(table)!;
}

export function selectAll<T extends TableName>(table: T): AnyRow[] {
  const rows = ensureTable(table).values();
  return Array.from(rows);
}

export function selectById<T extends TableName>(table: T, id: string): AnyRow | undefined {
  return ensureTable(table).get(id);
}

export function selectByUserId<T extends TableName>(table: T, userId: string): AnyRow[] {
  return selectAll(table).filter((r) => r["user_id"] === userId);
}

function nowISO() {
  return new Date().toISOString();
}

function genId() {
  return crypto.randomUUID();
}

export async function insertRow<T extends TableName>(
  table: T,
  values: Omit<AnyRow, "id" | "created_at" | "updated_at"> & Partial<Pick<AnyRow, "id">>,
): Promise<AnyRow> {
  const row: AnyRow = {
    id: values.id ?? genId(),
    created_at: nowISO(),
    updated_at: nowISO(),
    ...values,
  } as AnyRow;
  await put(table, row);
  ensureTable(table).set(row.id, row);
  emit();
  return row;
}

export async function updateRow<T extends TableName>(
  table: T,
  id: string,
  values: Partial<AnyRow>,
): Promise<void> {
  const existing = ensureTable(table).get(id);
  if (!existing) throw new Error(`Row ${id} not found in ${table}`);
  const row = { ...existing, ...values, updated_at: nowISO() };
  await put(table, row);
  ensureTable(table).set(id, row);
  emit();
}

export async function deleteRow(table: TableName, id: string): Promise<void> {
  await del(table, id);
  ensureTable(table).delete(id);
  emit();
}

export async function deleteByUserId(table: TableName, userId: string): Promise<number> {
  let count = 0;
  const toDelete: string[] = [];
  for (const [id, row] of ensureTable(table)) {
    if (row["user_id"] === userId) toDelete.push(id);
  }
  for (const id of toDelete) {
    await del(table, id);
    ensureTable(table).delete(id);
    count++;
  }
  if (count > 0) emit();
  return count;
}

export async function loadAll(): Promise<void> {
  const tables: TableName[] = [
    "tasks",
    "goals",
    "habits",
    "habit_logs",
    "journal_entries",
    "transactions",
    "projects",
    "milestones",
    "events",
    "terms",
    "courses",
    "assessments",
    "books",
    "learning_logs",
    "weekly_reviews",
    "investments",
    "profiles",
    "settings",
  ];
  for (const t of tables) {
    const rows = await getAll<AnyRow>(t);
    const map = new Map<string, AnyRow>();
    for (const r of rows) map.set(r.id, r);
    state.tables.set(t, map);
  }
  emit();
}

export async function exportData(): Promise<Record<string, unknown[]>> {
  return exportAll();
}

export async function importData(data: Record<string, unknown[]>): Promise<void> {
  await importAll(data);
  await loadAll();
}

export async function wipeData(): Promise<void> {
  await wipeAll();
  for (const t of state.tables.keys()) state.tables.get(t)!.clear();
  emit();
}

async function migrate(oldVersion: number): Promise<void> {
  if (oldVersion === 0) {
    // Fresh install - nothing to migrate
  }
}

export async function initStore(): Promise<void> {
  const stored = localStorage.getItem(SCHEMA_KEY);
  const currentVersion = stored ? parseInt(stored, 10) : 0;
  if (currentVersion < SCHEMA_VERSION) {
    await migrate(currentVersion);
    localStorage.setItem(SCHEMA_KEY, String(SCHEMA_VERSION));
  }
  await loadAll();
}

export function useTable<T extends TableName>(table: T) {
  const store = useStore();
  const rows = store.tables.get(table)?.values() ?? [];
  const [, forceUpdate] = useState({});
  const force = () => forceUpdate({});

  useEffect(() => {
    const unsub: () => void = subscribe(force);
    return unsub;
  }, []);

  return Array.from(rows) as AnyRow[];
}

export function useTableByUserId<T extends TableName>(table: T, userId: string | undefined) {
  const all = useTable(table);
  if (!userId) return [];
  return all.filter((r) => r["user_id"] === userId);
}

export function createMutations<T extends TableName>(table: T) {
  return {
    insert: async (
      values: Omit<AnyRow, "id" | "created_at" | "updated_at"> & Partial<Pick<AnyRow, "id">>,
    ) => insertRow(table, values),
    update: async (id: string, values: Partial<AnyRow>) => updateRow(table, id, values),
    remove: async (id: string) => deleteRow(table, id),
  };
}
