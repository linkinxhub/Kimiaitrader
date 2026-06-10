/**
 * PIN Security Service
 * Système de sécurité avancé pour l'accès Super Admin
 * - 3 tentatives max avant blocage
 - Notification d'intrusion configurée
 - Blocage temporaire avec décompte
 */

export interface SecuritySettings {
  alertEmail: string;
  alertPhone: string;
  maxAttempts: number;
  lockoutDurationMinutes: number;
  notificationsEnabled: boolean;
}

export interface IntrusionAlert {
  id: string;
  timestamp: string;
  pinAttempted: string;
  ipAddress: string;
  userAgent: string;
  resolved: boolean;
}

const SECURITY_SETTINGS_KEY = "xtrendai_security_settings";
const PIN_ATTEMPTS_KEY = "xtrendai_pin_attempts";
const INTRUSION_ALERTS_KEY = "xtrendai_intrusion_alerts";
const PIN_LOCKOUT_KEY = "xtrendai_pin_lockout";

const DEFAULT_SETTINGS: SecuritySettings = {
  alertEmail: "",
  alertPhone: "",
  maxAttempts: 3,
  lockoutDurationMinutes: 15,
  notificationsEnabled: true,
};

// ─── Get Security Settings ──────────────────────────────

export function getSecuritySettings(): SecuritySettings {
  try {
    const raw = localStorage.getItem(SECURITY_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSecuritySettings(settings: Partial<SecuritySettings>): void {
  const current = getSecuritySettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(SECURITY_SETTINGS_KEY, JSON.stringify(updated));
}

// ─── PIN Attempts Tracking ──────────────────────────────

export interface AttemptState {
  count: number;
  firstAttemptTime: string | null;
  isLocked: boolean;
  lockoutEndTime: string | null;
  remainingLockoutSeconds: number;
}

export function getAttemptState(): AttemptState {
  try {
    const raw = localStorage.getItem(PIN_ATTEMPTS_KEY);
    if (!raw) return createFreshState();
    const state = JSON.parse(raw);

    // Check if lockout has expired
    if (state.isLocked && state.lockoutEndTime) {
      const now = Date.now();
      const end = new Date(state.lockoutEndTime).getTime();
      if (now >= end) {
        // Lockout expired, reset
        resetAttempts();
        return createFreshState();
      }
      // Still locked, calculate remaining
      const remaining = Math.ceil((end - now) / 1000);
      return { ...state, remainingLockoutSeconds: remaining };
    }

    return state;
  } catch {
    return createFreshState();
  }
}

function createFreshState(): AttemptState {
  return {
    count: 0,
    firstAttemptTime: null,
    isLocked: false,
    lockoutEndTime: null,
    remainingLockoutSeconds: 0,
  };
}

export function recordFailedAttempt(pinAttempted: string): AttemptState {
  const settings = getSecuritySettings();
  const state = getAttemptState();

  if (state.isLocked) return state;

  const newCount = state.count + 1;

  // Check if max attempts reached
  if (newCount >= settings.maxAttempts) {
    const lockoutEnd = new Date();
    lockoutEnd.setMinutes(lockoutEnd.getMinutes() + settings.lockoutDurationMinutes);

    const newState: AttemptState = {
      count: newCount,
      firstAttemptTime: state.firstAttemptTime || new Date().toISOString(),
      isLocked: true,
      lockoutEndTime: lockoutEnd.toISOString(),
      remainingLockoutSeconds: settings.lockoutDurationMinutes * 60,
    };

    localStorage.setItem(PIN_ATTEMPTS_KEY, JSON.stringify(newState));

    // Record intrusion alert
    recordIntrusionAlert(pinAttempted);

    return newState;
  }

  const newState: AttemptState = {
    ...state,
    count: newCount,
    firstAttemptTime: state.firstAttemptTime || new Date().toISOString(),
  };

  localStorage.setItem(PIN_ATTEMPTS_KEY, JSON.stringify(newState));
  return newState;
}

export function recordSuccessfulAttempt(): void {
  // On success, clear failed attempts
  resetAttempts();
}

export function resetAttempts(): void {
  localStorage.removeItem(PIN_ATTEMPTS_KEY);
}

export function resetLockout(): void {
  resetAttempts();
}

// ─── Intrusion Alerts ───────────────────────────────────

export function recordIntrusionAlert(pinAttempted: string): IntrusionAlert {
  const settings = getSecuritySettings();
  const alerts = getIntrusionAlerts();

  const alert: IntrusionAlert = {
    id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    pinAttempted: pinAttempted,
    ipAddress: "client-side",
    userAgent: navigator.userAgent,
    resolved: false,
  };

  alerts.unshift(alert); // Add to beginning
  // Keep only last 50 alerts
  const trimmed = alerts.slice(0, 50);
  localStorage.setItem(INTRUSION_ALERTS_KEY, JSON.stringify(trimmed));

  // Show browser notification if enabled
  if (settings.notificationsEnabled && settings.alertEmail) {
    showBrowserNotification(alert);
  }

  return alert;
}

export function getIntrusionAlerts(): IntrusionAlert[] {
  try {
    const raw = localStorage.getItem(INTRUSION_ALERTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getUnresolvedAlerts(): IntrusionAlert[] {
  return getIntrusionAlerts().filter((a) => !a.resolved);
}

export function resolveAlert(alertId: string): boolean {
  const alerts = getIntrusionAlerts();
  const alert = alerts.find((a) => a.id === alertId);
  if (!alert) return false;
  alert.resolved = true;
  localStorage.setItem(INTRUSION_ALERTS_KEY, JSON.stringify(alerts));
  return true;
}

export function resolveAllAlerts(): void {
  const alerts = getIntrusionAlerts();
  alerts.forEach((a) => (a.resolved = true));
  localStorage.setItem(INTRUSION_ALERTS_KEY, JSON.stringify(alerts));
}

// ─── Browser Notification ───────────────────────────────

function showBrowserNotification(alert: IntrusionAlert): void {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("XTrendAI Pro - Alerte de sécurité", {
      body: `3 tentatives échouées détectées. L'accès Admin est bloqué.`,
      icon: "/favicon.ico",
      tag: alert.id,
      requireInteraction: true,
    });
  }
}

export function requestNotificationPermission(): void {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

// ─── Format time remaining ──────────────────────────────

export function formatLockoutTime(seconds: number): string {
  if (seconds <= 0) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}min ${secs}s`;
  }
  return `${secs}s`;
}
