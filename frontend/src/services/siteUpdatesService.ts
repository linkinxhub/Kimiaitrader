import type { SiteUpdate } from "@/types";
import { DEFAULT_UPDATES } from "@/lib/constants";
import { createId, nowIso, readStorage, writeStorage } from "@/lib/utils";

const SITE_UPDATES_KEY = "xtrendai_site_updates";

export function getSiteUpdates() {
  return readStorage<SiteUpdate[]>(SITE_UPDATES_KEY, DEFAULT_UPDATES);
}

export function createSiteUpdate(payload: Omit<SiteUpdate, "id" | "publishedAt">) {
  const next: SiteUpdate = {
    id: createId("update"),
    publishedAt: nowIso(),
    ...payload,
  };

  writeStorage(SITE_UPDATES_KEY, [next, ...getSiteUpdates()]);
  return next;
}

export function updateSiteUpdate(id: string, payload: Partial<SiteUpdate>) {
  const updates = getSiteUpdates().map((update) => (update.id === id ? { ...update, ...payload } : update));
  writeStorage(SITE_UPDATES_KEY, updates);
  return updates.find((update) => update.id === id) ?? null;
}

export function deleteSiteUpdate(id: string) {
  const updates = getSiteUpdates().filter((update) => update.id !== id);
  writeStorage(SITE_UPDATES_KEY, updates);
}
