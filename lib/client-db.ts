export type DbCollection = "calendar" | "library" | "history" | "drafts" | "versions" | "profiles" | "selectedProfile";

const prefix = "wechat-ops-db";

function keyFor(collection: DbCollection) {
  return `${prefix}:${collection}`;
}

export const clientDb = {
  async read<T>(collection: DbCollection, fallback: T): Promise<T> {
    if (typeof window === "undefined") return fallback;
    try {
      const response = await fetch(`/api/db?collection=${encodeURIComponent(collection)}`, {
        cache: "no-store"
      });
      if (response.ok) {
        const data = (await response.json()) as { found: boolean; value: T };
        if (data.found) return data.value ?? fallback;
      }
    } catch {
      // Keep localStorage as an offline fallback for embedded preview failures.
    }

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
    try {
      const response = await fetch("/api/db", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection, value })
      });
      if (response.ok) return;
    } catch {
      // Fall through to localStorage.
    }

    window.localStorage.setItem(keyFor(collection), JSON.stringify(value));
  }
};
