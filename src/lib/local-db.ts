const DB_NAME = "ordo";
const DB_VERSION = 1;

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

export interface RowBase {
  id: string;
  created_at: string;
  updated_at: string;
}

export type AnyRow = RowBase & Record<string, unknown>;

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

function isTable(value: string): value is TableName {
  return (TABLES as string[]).includes(value);
}

// IndexedDB only exists in a secure browser context. Any helper reached on the
// server (e.g. a stray import during SSR) degrades to empty results instead of
// throwing a ReferenceError and taking the page down.
function dbUnavailable(): boolean {
  return typeof indexedDB === "undefined";
}

function tx<T>(
  storeNames: string | string[],
  mode: IDBTransactionMode,
  fn: (stores: Map<string, IDBObjectStore>) => T,
): Promise<T> {
  if (dbUnavailable()) return Promise.resolve(undefined as unknown as T);
  return openDB().then((db) => {
    const names = Array.isArray(storeNames) ? storeNames : [storeNames];
    return new Promise<T>((resolve, reject) => {
      const txn = db.transaction(names, mode);
      const stores = new Map<string, IDBObjectStore>();
      for (const name of names) stores.set(name, txn.objectStore(name));
      txn.oncomplete = () => resolve(fn(stores));
      txn.onerror = () => reject(txn.error);
      txn.onabort = () => reject(txn.error);
    });
  });
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of TABLES) {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: "id" });
          store.createIndex("user_id", "user_id", { unique: false });
          store.createIndex("created_at", "created_at", { unique: false });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getAll<T extends AnyRow>(table: TableName): Promise<T[]> {
  return tx(table, "readonly", (stores) => {
    const store = stores.get(table)!;
    return new Promise<T[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function put<T extends AnyRow>(table: TableName, row: T): Promise<void> {
  return tx(table, "readwrite", (stores) => {
    const store = stores.get(table)!;
    return new Promise<void>((resolve, reject) => {
      const req = store.put(row);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });
}

export async function putMany<T extends AnyRow>(table: TableName, rows: T[]): Promise<void> {
  if (rows.length === 0) return;
  return tx(table, "readwrite", (stores) => {
    const store = stores.get(table)!;
    for (const row of rows) store.put(row);
  });
}

export async function del(table: TableName, id: string): Promise<void> {
  return tx(table, "readwrite", (stores) => {
    const store = stores.get(table)!;
    return new Promise<void>((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });
}

export async function clear(table: TableName): Promise<void> {
  return tx(table, "readwrite", (stores) => {
    const store = stores.get(table)!;
    return new Promise<void>((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });
}

function genImportId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Fills in required bookkeeping fields so a hand-edited or legacy export still works. */
function normalize(row: unknown): AnyRow {
  const source = (row ?? {}) as Record<string, unknown>;
  const now = new Date().toISOString();
  return {
    ...source,
    id: String(source["id"] ?? genImportId()),
    created_at: String(source["created_at"] ?? now),
    updated_at: String(source["updated_at"] ?? now),
  } as AnyRow;
}

export async function exportAll(): Promise<Record<string, unknown[]>> {
  const out: Record<string, unknown[]> = {};
  for (const t of TABLES) out[t] = await getAll(t);
  return out;
}

export async function importAll(data: Record<string, unknown[]>): Promise<void> {
  for (const [table, rows] of Object.entries(data)) {
    if (!isTable(table) || !Array.isArray(rows) || rows.length === 0) continue;
    await putMany(table, rows.map(normalize));
  }
}

export async function wipeAll(): Promise<void> {
  for (const t of TABLES) await clear(t);
}
