import { useEffect, useState } from "react";
import type { PlatformSettings } from "@/types";
import { getPlatformSettings, SETTINGS_EVENT } from "@/services/platformSettingsService";

export function usePlatformSettings() {
  const [settings, setSettings] = useState<PlatformSettings>(() => getPlatformSettings());

  useEffect(() => {
    const sync = () => setSettings(getPlatformSettings());
    const onCustomUpdate = () => sync();

    window.addEventListener(SETTINGS_EVENT, onCustomUpdate);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SETTINGS_EVENT, onCustomUpdate);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return settings;
}
