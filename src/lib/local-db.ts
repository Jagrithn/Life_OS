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

interface OpenDBOptions {
  onUpgrade?: (db: IDBDatabase, oldVersion: number, newVersion: number) => void;
}

function openDB(opts: OpenDBOptions = {}): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      const oldVersion = e.oldVersion;
      const newVersion = e.newVersion;
      for (const name of [
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
      ]) {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: "id" });
          store.createIndex("user_id", "user_id", { unique: false });
          store.createIndex("created_at", "created_at", { unique: false });
        }
      }
      if (opts.onUpgrade) opts.onUpgrade(db, oldVersion, newVersion ?? 0);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  storeNames: string | string[],
  mode: IDBTransactionMode,
  fn: (stores: Map<string, IDBObjectStore>) => T,
): Promise<T> {
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

export async function getById<T extends AnyRow>(
  table: TableName,
  id: string,
): Promise<T | undefined> {
  return tx(table, "readonly", (stores) => {
    const store = stores.get(table)!;
    return new Promise<T | undefined>((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function getByIndex<T extends AnyRow>(
  table: TableName,
  indexName: string,
  value: string,
): Promise<T[]> {
  return tx(table, "readonly", (stores) => {
    const store = stores.get(table)!;
    return new Promise<T[]>((resolve, reject) => {
      const req = store.index(indexName).getAll(value);
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

export async function delByIndex(
  table: TableName,
  indexName: string,
  value: string,
): Promise<number> {
  return tx(table, "readwrite", (stores) => {
    const store = stores.get(table)!;
    return new Promise<number>((resolve, reject) => {
      const index = store.index(indexName);
      let count = 0;
      const req = index.openCursor(IDBKeyRange.only(value));
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result;
        if (cursor) {
          count++;
          cursor.delete();
          cursor.continue();
        } else {
          resolve(count);
        }
      };
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

export async function exportAll(): Promise<Record<string, unknown[]>> {
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
  const out: Record<string, unknown[]> = {};
  for (const t of tables) {
    out[t] = await getAll(t);
  }
  return out;
}

export async function importAll(data: Record<string, unknown[]>): Promise<void> {
  for (const [table, rows] of Object.entries(data)) {
    if (rows.length > 0) {
      await putMany(table as TableName, rows as AnyRow[]);
    }
  }
}

export async function wipeAll(): Promise<void> {
  const tables: TableName[] = [
    "habit_logs",
    "events",
    "tasks",
    "milestones",
    "projects",
    "habits",
    "journal_entries",
    "transactions",
    "goals",
    "assessments",
    "courses",
    "terms",
    "books",
    "learning_logs",
    "weekly_reviews",
    "investments",
    "profiles",
    "settings",
  ];
  for (const t of tables) await clear(t);
}
