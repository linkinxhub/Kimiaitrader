import { useEffect, useState } from "react";
import type { SiteUpdate } from "@/types";
import { getSiteUpdates, SITE_UPDATES_EVENT } from "@/services/siteUpdatesService";

export function useSiteUpdates() {
  const [updates, setUpdates] = useState<SiteUpdate[]>(() => getSiteUpdates());

  useEffect(() => {
    const sync = () => setUpdates(getSiteUpdates());
    const onCustomUpdate = () => sync();

    window.addEventListener(SITE_UPDATES_EVENT, onCustomUpdate);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SITE_UPDATES_EVENT, onCustomUpdate);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return updates;
}
