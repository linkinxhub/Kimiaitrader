import type { PackPrices, PlatformSettings } from "@/types";
import { readStorage, writeStorage } from "@/lib/utils";

const SETTINGS_KEY = "xtrendai_platform_settings";
export const SETTINGS_EVENT = "xtrendai-settings-updated";

const monthlyPrices: PackPrices = {
  free: 0,
  pro: 79,
  expert: 199,
  institutional: 499,
};

const yearlyPrices: PackPrices = {
  free: 0,
  pro: 790,
  expert: 1990,
  institutional: 4990,
};

const DEFAULT_SETTINGS: PlatformSettings = {
  platformName: "XTrendAI Pro",
  slogan: "Plateforme de trading IA live, claire, rapide et pilotable",
  maintenanceMode: false,
  allowNewRegistrations: true,
  realTimeSignals: true,
  globalDemoMode: false,
  contactEmail: "support@xtrendai.com",
  contactPhone: "+33 1 84 80 44 12",
  contactWhatsApp: "+33 6 44 80 22 18",
  enable2FA: false,
  enableOTP: false,
  limitLoginAttempts: true,
  detectSuspiciousIP: true,
  packPrices: monthlyPrices,
  packPricesYearly: yearlyPrices,
  heroBadge: "Live trading workspace",
  heroTitle: "Une salle de marche IA plus nette, plus fluide, et connectee a des donnees reelles.",
  heroDescription:
    "XTrendAI Pro centralise signaux, actifs live, suivi XAU/USD, journal, alertes et controle business dans une seule interface statique mais vraiment exploitable.",
  primaryCtaLabel: "Commencer maintenant",
  secondaryCtaLabel: "Voir la plateforme",
  finalCtaTitle: "Passez d'une lecture du marche a un process d'execution repetable.",
  finalCtaDescription:
    "Commencez gratuitement, activez les packs live quand vous etes pret, puis harmonisez le discours public et les prix depuis l'admin panel.",
  controlPanelLabel: "Control room",
  liveStatusLabel: "LIVE DATA",
  heroMetrics: [
    { label: "Sources live", value: "4 APIs", note: "crypto, forex, gold" },
    { label: "Signaux IA", value: "Temps reel", note: "fallback inclus" },
    { label: "Pack Pro", value: "79 EUR", note: "acces live" },
  ],
};

function dispatchSettingsEvent(settings: PlatformSettings) {
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: settings }));
}

export function getDefaultPlatformSettings() {
  return DEFAULT_SETTINGS;
}

export function getPlatformSettings() {
  return readStorage<PlatformSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
}

export function updatePlatformSettings(partial: Partial<PlatformSettings>) {
  const next = { ...getPlatformSettings(), ...partial };
  writeStorage(SETTINGS_KEY, next);
  dispatchSettingsEvent(next);
  return next;
}

export function resetPlatformSettings() {
  writeStorage(SETTINGS_KEY, DEFAULT_SETTINGS);
  dispatchSettingsEvent(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export function updatePackPrices(packPrices: PackPrices, packPricesYearly: PackPrices) {
  return updatePlatformSettings({ packPrices, packPricesYearly });
}
