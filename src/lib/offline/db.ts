const DB_NAME = "almoayed-offline-v1";
const DB_VERSION = 1;

export const OFFLINE_STORES = {
  quizPackages: "quizPackages",
  inProgress: "inProgress",
  pendingSubmissions: "pendingSubmissions",
  meta: "meta",
} as const;

type StoreName = (typeof OFFLINE_STORES)[keyof typeof OFFLINE_STORES];

let dbPromise: Promise<IDBDatabase> | null = null;

function openOfflineDbInternal(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(OFFLINE_STORES.quizPackages)) {
        db.createObjectStore(OFFLINE_STORES.quizPackages, { keyPath: "quizId" });
      }
      if (!db.objectStoreNames.contains(OFFLINE_STORES.inProgress)) {
        db.createObjectStore(OFFLINE_STORES.inProgress, { keyPath: "quizId" });
      }
      if (!db.objectStoreNames.contains(OFFLINE_STORES.pendingSubmissions)) {
        db.createObjectStore(OFFLINE_STORES.pendingSubmissions, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(OFFLINE_STORES.meta)) {
        db.createObjectStore(OFFLINE_STORES.meta);
      }
    };

    request.onsuccess = () => resolve(request.result);
  });
}

export function openOfflineDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = openOfflineDbInternal();
  }
  return dbPromise;
}

export async function idbGet<T>(storeName: StoreName, key: IDBValidKey): Promise<T | undefined> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as T | undefined);
  });
}

export async function idbGetAll<T>(storeName: StoreName): Promise<T[]> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve((request.result as T[]) ?? []);
  });
}

export async function idbPut<T>(storeName: StoreName, value: T): Promise<void> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.put(value);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function idbDelete(storeName: StoreName, key: IDBValidKey): Promise<void> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.delete(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function idbGetMeta<T>(key: string): Promise<T | undefined> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_STORES.meta, "readonly");
    const store = tx.objectStore(OFFLINE_STORES.meta);
    const request = store.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as T | undefined);
  });
}

export async function idbSetMeta<T>(key: string, value: T): Promise<void> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_STORES.meta, "readwrite");
    const store = tx.objectStore(OFFLINE_STORES.meta);
    const request = store.put(value, key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
