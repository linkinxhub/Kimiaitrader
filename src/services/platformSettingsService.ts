/**
 * Platform Settings Service
 * Persiste les paramètres de la plateforme dans localStorage
 * pour qu'ils soient modifiables depuis l'Admin Panel
 */

export interface PlatformSettings {
  // General
  platformName: string;
  slogan: string;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  realTimeSignals: boolean;
  globalDemoMode: boolean;
  // Contact
  contactEmail: string;
  contactPhone: string;
  contactWhatsapp: string;
  // Security
  enable2FA: boolean;
  enableOTP: boolean;
  limitLoginAttempts: boolean;
  detectSuspiciousIP: boolean;
  // Packs pricing
  packPrices: {
    free: number;
    pro: number;
    expert: number;
    institutional: number;
  };
  packPricesYearly: {
    pro: number;
    expert: number;
    institutional: number;
  };
}

const SETTINGS_KEY = 'xtrendai_platform_settings';

const DEFAULT_SETTINGS: PlatformSettings = {
  platformName: 'XTrendAI Pro',
  slogan: "Dominez les Marchés avec l'IA",
  maintenanceMode: false,
  allowNewRegistrations: true,
  realTimeSignals: true,
  globalDemoMode: false,
  contactEmail: 'contact@xtrendai-pro.com',
  contactPhone: '+33 1 23 45 67 89',
  contactWhatsapp: '+33 6 12 34 56 78',
  enable2FA: true,
  enableOTP: false,
  limitLoginAttempts: true,
  detectSuspiciousIP: true,
  packPrices: {
    free: 0,
    pro: 79,
    expert: 199,
    institutional: 499,
  },
  packPricesYearly: {
    pro: 790,
    expert: 1990,
    institutional: 4990,
  },
};

// ─── Get Settings ───────────────────────────────────────

export function getPlatformSettings(): PlatformSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    // Merge with defaults to ensure all keys exist
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

// ─── Save Settings ──────────────────────────────────────

export function savePlatformSettings(settings: Partial<PlatformSettings>): PlatformSettings {
  const current = getPlatformSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  // Dispatch event for cross-tab sync
  window.dispatchEvent(new CustomEvent('xtrendai-settings-changed', { detail: updated }));
  return updated;
}

// ─── Reset to defaults ──────────────────────────────────

export function resetPlatformSettings(): PlatformSettings {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
  return { ...DEFAULT_SETTINGS };
}

// ─── Subscribe to changes ───────────────────────────────

export function subscribeToSettings(callback: (settings: PlatformSettings) => void): () => void {
  const handler = (e: CustomEvent<PlatformSettings>) => callback(e.detail);
  window.addEventListener('xtrendai-settings-changed' as any, handler as any);
  return () => window.removeEventListener('xtrendai-settings-changed' as any, handler as any);
}
