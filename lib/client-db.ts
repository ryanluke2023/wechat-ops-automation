export type DbCollection = "calendar" | "library" | "history" | "drafts" | "versions";

const prefix = "wechat-ops-db";

function keyFor(collection: DbCollection) {
  return `${prefix}:${collection}`;
}

export const clientDb = {
  async read<T>(collection: DbCollection, fallback: T): Promise<T> {
    if (typeof window === "undefined") return fallback;
    const raw = window.localStorage.getItem(keyFor(collection));
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  async write<T>(collection: DbCollection, value: T) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(keyFor(collection), JSON.stringify(value));
  }
};
