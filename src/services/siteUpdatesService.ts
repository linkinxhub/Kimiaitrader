import type { SiteUpdate } from "@/types";
import { DEFAULT_UPDATES } from "@/lib/constants";
import { createId, nowIso, readStorage, writeStorage } from "@/lib/utils";

const SITE_UPDATES_KEY = "xtrendai_site_updates";
export const SITE_UPDATES_EVENT = "xtrendai-site-updates-updated";

function dispatchUpdatesEvent(updates: SiteUpdate[]) {
  window.dispatchEvent(new CustomEvent(SITE_UPDATES_EVENT, { detail: updates }));
}

export function getSiteUpdates() {
  return readStorage<SiteUpdate[]>(SITE_UPDATES_KEY, DEFAULT_UPDATES);
}

export function createSiteUpdate(payload: Omit<SiteUpdate, "id" | "publishedAt">) {
  const next: SiteUpdate = {
    id: createId("update"),
    publishedAt: nowIso(),
    ...payload,
  };

  const updates = [next, ...getSiteUpdates()];
  writeStorage(SITE_UPDATES_KEY, updates);
  dispatchUpdatesEvent(updates);
  return next;
}

export function updateSiteUpdate(id: string, payload: Partial<SiteUpdate>) {
  const updates = getSiteUpdates().map((update) => (update.id === id ? { ...update, ...payload } : update));
  writeStorage(SITE_UPDATES_KEY, updates);
  dispatchUpdatesEvent(updates);
  return updates.find((update) => update.id === id) ?? null;
}

export function deleteSiteUpdate(id: string) {
  const updates = getSiteUpdates().filter((update) => update.id !== id);
  writeStorage(SITE_UPDATES_KEY, updates);
  dispatchUpdatesEvent(updates);
}
