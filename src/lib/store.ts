import { useSyncExternalStore } from "react";
import {
  del,
  put,
  getAll,
  putMany,
  clear,
  exportAll,
  importAll,
  wipeAll,
  type AnyRow,
  type TableName,
} from "./local-db";

const SCHEMA_VERSION = 1;
const SCHEMA_KEY = "ordo:schema";

const TABLES: TableName[] = [
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

type Tables = Map<TableName, Map<string, AnyRow>>;
type Listener = () => void;

const tables: Tables = new Map();
const listeners = new Set<Listener>();

// Bumped on every change. useSyncExternalStore compares the snapshot with
// Object.is, so returning the (stable) `tables` map would never re-render.
let version = 0;

function emit() {
  version += 1;
  for (const l of listeners) l();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Stable read accessors for useSyncExternalStore — same value on every call.
const getSnapshot = () => version;
const getServerSnapshot = () => version;

export function useStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function ensureTable(table: TableName) {
  let map = tables.get(table);
  if (!map) {
    map = new Map();
    tables.set(table, map);
  }
  return map;
}

export function selectAll(table: TableName): AnyRow[] {
  return Array.from(ensureTable(table).values());
}

function nowISO() {
  return new Date().toISOString();
}

function genId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function insertRow(
  table: TableName,
  values: Record<string, unknown> & { id?: string },
): Promise<AnyRow> {
  const now = nowISO();
  const row: AnyRow = {
    ...values,
    id: (values.id as string) ?? genId(),
    created_at: (values["created_at"] as string) ?? now,
    updated_at: now,
  } as AnyRow;
  await put(table, row);
  ensureTable(table).set(row.id, row);
  emit();
  return row;
}

export async function updateRow(
  table: TableName,
  id: string,
  values: Record<string, unknown>,
): Promise<void> {
  const existing = ensureTable(table).get(id);
  if (!existing) throw new Error(`Row ${id} not found in ${table}`);
  const row: AnyRow = { ...existing, ...values, id, updated_at: nowISO() };
  await put(table, row);
  ensureTable(table).set(id, row);
  emit();
}

export async function deleteRow(table: TableName, id: string): Promise<void> {
  await del(table, id);
  ensureTable(table).delete(id);
  emit();
}

export async function loadAll(): Promise<void> {
  for (const t of TABLES) {
    const rows = await getAll<AnyRow>(t);
    const map = new Map<string, AnyRow>();
    for (const r of rows) map.set(r.id, r);
    tables.set(t, map);
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
  for (const map of tables.values()) map.clear();
  emit();
}

async function migrate(oldVersion: number): Promise<void> {
  if (oldVersion === 0) return; // fresh install, nothing to migrate
}

export async function initStore(): Promise<void> {
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem(SCHEMA_KEY);
    const currentVersion = stored ? parseInt(stored, 10) : 0;
    if (currentVersion < SCHEMA_VERSION) {
      await migrate(currentVersion);
      localStorage.setItem(SCHEMA_KEY, String(SCHEMA_VERSION));
    }
  }
  await loadAll();
}

/** Subscribes to the store and returns every row of a table in insertion order. */
export function useTable(table: TableName): AnyRow[] {
  useStore();
  return selectAll(table);
}

export function createMutations(table: TableName) {
  return {
    insert: (values: Record<string, unknown> & { id?: string }) => insertRow(table, values),
    update: (id: string, values: Record<string, unknown>) => updateRow(table, id, values),
    remove: (id: string) => deleteRow(table, id),
  };
}
