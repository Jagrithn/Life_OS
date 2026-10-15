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

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
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
    req.onsuccess = () => {
      const db = req.result;
      // Close and drop the cache when another tab upgrades the schema.
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    req.onerror = () => {
      dbPromise = null;
      reject(req.error ?? new Error("Failed to open the local database"));
    };
  });
  return dbPromise;
}

/**
 * Runs a synchronous operation against one object store while its transaction
 * is still alive. The action MUST issue its request(s) synchronously: awaiting
 * anything first lets the transaction auto-commit, and any later access throws
 * `TransactionInactiveError`. The returned promise settles once the transaction
 * finishes (reads resolve with the request's result).
 */
function withStore<T = void>(
  table: TableName,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest | void,
): Promise<T> {
  if (dbUnavailable()) return Promise.resolve(undefined as unknown as T);
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        let result: unknown;
        let settled = false;
        const txn = db.transaction(table, mode);
        const store = txn.objectStore(table);
        txn.oncomplete = () => {
          if (settled) return;
          settled = true;
          resolve(result as T);
        };
        txn.onerror = () => {
          if (settled) return;
          settled = true;
          reject(txn.error ?? new Error("IndexedDB transaction failed"));
        };
        txn.onabort = () => {
          if (settled) return;
          settled = true;
          reject(txn.error ?? new Error("IndexedDB transaction aborted"));
        };
        try {
          const req = action(store);
          if (req) req.onsuccess = () => (result = req.result);
        } catch (error) {
          settled = true;
          try {
            txn.abort();
          } catch {
            /* transaction already finished */
          }
          reject(error);
        }
      }),
  );
}

export function getAll<T extends AnyRow>(table: TableName): Promise<T[]> {
  return withStore<T[]>(table, "readonly", (store) => store.getAll());
}

export async function put<T extends AnyRow>(table: TableName, row: T): Promise<void> {
  await withStore(table, "readwrite", (store) => store.put(row));
}

export async function putMany<T extends AnyRow>(table: TableName, rows: T[]): Promise<void> {
  if (rows.length === 0) return;
  await withStore(table, "readwrite", (store) => {
    for (const row of rows) store.put(row);
  });
}

export async function del(table: TableName, id: string): Promise<void> {
  await withStore(table, "readwrite", (store) => store.delete(id));
}

export async function clear(table: TableName): Promise<void> {
  await withStore(table, "readwrite", (store) => store.clear());
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
