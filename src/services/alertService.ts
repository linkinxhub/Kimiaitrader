// ─── Legacy Price Alert Types (for PriceAlerts.tsx compatibility) ──

export interface PriceAlert {
  id: string;
  asset: string;
  condition: 'ABOVE' | 'BELOW' | 'EQUALS';
  targetPrice: number;
  message?: string;
  active: boolean;
  triggered?: boolean;
  triggeredAt?: string;
  createdAt: string;
}

const PRICE_ALERTS_KEY = 'xtrendai_price_alerts';
const PRICE_ALERTS_HISTORY_KEY = 'xtrendai_price_alerts_history';

function loadPriceAlerts(): PriceAlert[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(PRICE_ALERTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function savePriceAlerts(alerts: PriceAlert[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PRICE_ALERTS_KEY, JSON.stringify(alerts));
}

export function saveAlert(alert: Omit<PriceAlert, 'id' | 'createdAt'>): PriceAlert {
  const newAlert: PriceAlert = {
    ...alert,
    id: `pa-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    createdAt: new Date().toISOString(),
  };
  const alerts = loadPriceAlerts();
  alerts.push(newAlert);
  savePriceAlerts(alerts);
  return newAlert;
}

export function toggleAlert(id: string): boolean {
  const alerts = loadPriceAlerts().map(a => {
    if (a.id === id) return { ...a, active: !a.active };
    return a;
  });
  savePriceAlerts(alerts);
  return alerts.find(a => a.id === id)?.active ?? false;
}

export function clearTriggeredHistory() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PRICE_ALERTS_HISTORY_KEY);
}

export function checkAlerts(prices: Record<string, number>): PriceAlert[] {
  const alerts = loadPriceAlerts().filter(a => a.active && !a.triggered);
  const triggered: PriceAlert[] = [];
  const updated = alerts.map(a => {
    const price = prices[a.asset];
    if (!price) return a;
    let hit = false;
    if (a.condition === 'ABOVE' && price >= a.targetPrice) hit = true;
    if (a.condition === 'BELOW' && price <= a.targetPrice) hit = true;
    if (a.condition === 'EQUALS' && Math.abs(price - a.targetPrice) < 0.01) hit = true;
    if (hit) {
      const triggeredAlert = { ...a, triggered: true, triggeredAt: new Date().toISOString() };
      triggered.push(triggeredAlert);
      // Also create a priority notification
      createAlert(
        `Alerte Prix — ${a.asset}`,
        `Le prix de ${a.asset} a atteint ${price.toFixed(2)} (${a.condition} ${a.targetPrice.toFixed(2)}).`,
        'high',
        'price',
        { asset: a.asset, price, target: a.targetPrice, condition: a.condition }
      );
      return triggeredAlert;
    }
    return a;
  });
  savePriceAlerts(updated);
  return triggered;
}

// ─── Alert Service — Sound + Priority Notifications ─────
// Gère les alertes avec sons, priorités, et notifications desktop

export type AlertPriority = 'critical' | 'high' | 'medium' | 'low';
export type SoundType = 'pulse' | 'sweep' | 'ding' | 'chime' | 'none';

// ─── Alert Navigation ─────────────────────────────────────
// Each alert carries a route so clicking it navigates to the relevant module

export interface AlertRoute {
  path: string;           // e.g. "/signals", "/dashboard", "/scanner"
  asset?: string;         // e.g. "XAU/USD" — target page can scroll/focus
  signalId?: string;      // specific signal identifier
  tab?: string;           // sub-tab to activate
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  priority: AlertPriority;
  category: 'signal' | 'price' | 'system' | 'scanner' | 'trade';
  createdAt: number;
  read: boolean;
  soundPlayed: boolean;
  route?: AlertRoute;     // where to go when user clicks the alert
  actionLabel?: string;   // e.g. "Voir le signal", "Voir le scanner"
  metadata?: Record<string, any>;
}

interface AlertCallbacks {
  onNewAlert?: (alert: Alert) => void;
  onAlertRead?: (id: string) => void;
  onAlertsCleared?: () => void;
}

const STORAGE_KEY = 'xtrendai_alerts';
const SETTINGS_KEY = 'xtrendai_alert_settings';

// Priority config: colors, icons, sound frequency
export const priorityConfig: Record<AlertPriority, {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: string;
  soundFreq: number;
  soundDuration: number;
  soundType: 'pulse' | 'sweep' | 'ding' | 'chime';
  vibrate: number[];
}> = {
  critical: {
    label: 'CRITIQUE',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: '🔴',
    soundFreq: 880,
    soundDuration: 0.3,
    soundType: 'pulse',
    vibrate: [200, 100, 200, 100, 300],
  },
  high: {
    label: 'HAUTE',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    icon: '🟠',
    soundFreq: 660,
    soundDuration: 0.25,
    soundType: 'sweep',
    vibrate: [150, 50, 150],
  },
  medium: {
    label: 'MOYENNE',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: '🟡',
    soundFreq: 523,
    soundDuration: 0.2,
    soundType: 'ding',
    vibrate: [100, 50],
  },
  low: {
    label: 'BASSE',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: '🔵',
    soundFreq: 440,
    soundDuration: 0.15,
    soundType: 'chime',
    vibrate: [80],
  },
};

// Category icons mapping
export const categoryIcons: Record<string, string> = {
  signal: '📡',
  price: '💰',
  system: '⚙️',
  scanner: '🔍',
  trade: '💹',
};

export const categoryLabels: Record<string, string> = {
  signal: 'Signal',
  price: 'Prix',
  system: 'Système',
  scanner: 'Scanner',
  trade: 'Trade',
};

let callbacks: AlertCallbacks = {};
let audioContext: AudioContext | null = null;

// ─── Deduplication cache — prevent alert spam ───────────
// Key: "title|priority", Value: timestamp
const dedupCache = new Map<string, number>();
const DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function isDuplicate(title: string, priority: AlertPriority): boolean {
  const key = `${title}|${priority}`;
  const lastSent = dedupCache.get(key);
  const now = Date.now();
  if (lastSent && (now - lastSent) < DEDUP_WINDOW_MS) {
    return true; // Duplicate within window
  }
  dedupCache.set(key, now);
  // Clean old entries periodically
  if (dedupCache.size > 200) {
    const cutoff = now - DEDUP_WINDOW_MS;
    for (const [k, v] of dedupCache.entries()) {
      if (v < cutoff) dedupCache.delete(k);
    }
  }
  return false;
}

// Global listener to unlock AudioContext on first user interaction
// Browsers require user gesture before audio can play
let audioUnlocked = false;
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume().then(() => { audioUnlocked = true; });
    }
    audioUnlocked = true;
  };
  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  // Attempt to resume if suspended
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

// Sound generation using Web Audio API — respects user settings
function playPrioritySound(priority: AlertPriority) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const settings = getAlertSettings();
  if (!settings.soundEnabled) return;

  // Check Do Not Disturb
  if (isDoNotDisturbActive(settings)) return;

  const soundType = settings.soundsByPriority[priority];
  if (soundType === 'none') return;

  const config = priorityConfig[priority];
  const now = ctx.currentTime;
  const volume = settings.soundVolume;

  try {
    if (soundType === 'pulse') {
      // Critical: urgent pulse
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(config.soundFreq, now + i * 0.15);
        osc.frequency.exponentialRampToValueAtTime(config.soundFreq * 0.5, now + i * 0.15 + 0.1);
        gain.gain.setValueAtTime(0.15 * volume, now + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.1);
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.1);
      }
    } else if (soundType === 'sweep') {
      // High: frequency sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(config.soundFreq * 0.7, now);
      osc.frequency.exponentialRampToValueAtTime(config.soundFreq, now + config.soundDuration);
      gain.gain.setValueAtTime(0.12 * volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + config.soundDuration);
      osc.start(now);
      osc.stop(now + config.soundDuration);
    } else if (soundType === 'ding') {
      // Medium: clean ding
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(config.soundFreq, now);
      gain.gain.setValueAtTime(0.1 * volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + config.soundDuration);
      osc.start(now);
      osc.stop(now + config.soundDuration);
    } else {
      // Low/chime: gentle chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(config.soundFreq, now);
      gain.gain.setValueAtTime(0.08 * volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + config.soundDuration * 2);
      osc.start(now);
      osc.stop(now + config.soundDuration * 2);
    }
  } catch {
    // Silently fail if audio can't play
  }
}

// Do Not Disturb check
function isDoNotDisturbActive(settings: AlertSettings): boolean {
  if (!settings.doNotDisturb) return false;
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = settings.doNotDisturbStart.split(':').map(Number);
  const [endH, endM] = settings.doNotDisturbEnd.split(':').map(Number);
  const start = startH * 60 + startM;
  const end = endH * 60 + endM;
  if (start <= end) {
    return current >= start && current <= end;
  }
  // Overnight range (e.g. 22:00 - 08:00)
  return current >= start || current <= end;
}

// Export test sound function
export function playTestSound(priority: AlertPriority) {
  playPrioritySound(priority);
}

// Vibration — respects user settings
function vibrate(priority: AlertPriority) {
  const settings = getAlertSettings();
  if (!settings.vibrationEnabled) return;
  if (isDoNotDisturbActive(settings)) return;
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(priorityConfig[priority].vibrate);
    } catch {
      // Silently fail
    }
  }
}

// Desktop notification — respects user settings
async function sendDesktopNotification(alert: Alert) {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window)) return;

  const settings = getAlertSettings();
  if (!settings.desktopNotifications) return;
  if (isDoNotDisturbActive(settings)) return;

  // Check category filter
  if (!settings.categories.includes(alert.category)) return;

  // Check minimum priority
  const priorityOrder: AlertPriority[] = ['low', 'medium', 'high', 'critical'];
  if (priorityOrder.indexOf(alert.priority) < priorityOrder.indexOf(settings.minPriority)) return;

  if (Notification.permission === 'granted') {
    new Notification(`XTrendAI — ${priorityConfig[alert.priority].label}`, {
      body: `${categoryLabels[alert.category]}: ${alert.title}`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: alert.id,
      requireInteraction: alert.priority === 'critical' || alert.priority === 'high',
    });
  } else if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}

// Settings
export interface AlertSettings {
  soundEnabled: boolean;
  soundVolume: number; // 0.0 - 1.0
  soundsByPriority: Record<AlertPriority, SoundType>;
  desktopNotifications: boolean;
  minPriority: AlertPriority;
  categories: string[];
  doNotDisturb: boolean;
  doNotDisturbStart: string; // "22:00"
  doNotDisturbEnd: string; // "08:00"
  vibrationEnabled: boolean;
  toastEnabled: boolean;
  autoMarkRead: boolean;
  autoMarkReadDelay: number; // seconds
}

function getDefaultSettings(): AlertSettings {
  return {
    soundEnabled: true,
    soundVolume: 0.5,
    soundsByPriority: {
      critical: 'pulse',
      high: 'sweep',
      medium: 'ding',
      low: 'chime',
    },
    desktopNotifications: true,
    minPriority: 'low',
    categories: ['signal', 'price', 'system', 'scanner', 'trade'],
    doNotDisturb: false,
    doNotDisturbStart: '22:00',
    doNotDisturbEnd: '08:00',
    vibrationEnabled: true,
    toastEnabled: true,
    autoMarkRead: false,
    autoMarkReadDelay: 30,
  };
}

export function getAlertSettings(): AlertSettings {
  if (typeof window === 'undefined') return getDefaultSettings();
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? { ...getDefaultSettings(), ...JSON.parse(stored) } : getDefaultSettings();
  } catch {
    return getDefaultSettings();
  }
}

export function saveAlertSettings(settings: AlertSettings) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ─── CRUD Operations ──────────────────────────────────────

function loadAlerts(): Alert[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveAlerts(alerts: Alert[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts.slice(0, 500))); // Keep last 500
}

export function subscribeToAlerts(cb: AlertCallbacks) {
  callbacks = { ...callbacks, ...cb };
  return () => { callbacks = {}; };
}

// Legacy getAlerts for PriceAlerts.tsx compatibility
export function getAlerts(): PriceAlert[] {
  return loadPriceAlerts();
}

// New priority alert system
export function getPriorityAlerts(): Alert[] {
  return loadAlerts();
}

export function getUnreadCount(): number {
  return loadAlerts().filter(a => !a.read).length;
}

export function getUnreadByPriority(): Record<AlertPriority, number> {
  const alerts = loadAlerts().filter(a => !a.read);
  return {
    critical: alerts.filter(a => a.priority === 'critical').length,
    high: alerts.filter(a => a.priority === 'high').length,
    medium: alerts.filter(a => a.priority === 'medium').length,
    low: alerts.filter(a => a.priority === 'low').length,
  };
}

// Priority score for sorting
type PriorityScore = { critical: number; high: number; medium: number; low: number };
const priorityScore: PriorityScore = { critical: 4, high: 3, medium: 2, low: 1 };

export function getSortedAlerts(): Alert[] {
  return loadAlerts().sort((a, b) => {
    // Sort by priority first (critical first), then by date (newest first)
    const prioDiff = priorityScore[b.priority] - priorityScore[a.priority];
    if (prioDiff !== 0) return prioDiff;
    return b.createdAt - a.createdAt;
  });
}

// ─── Create Alert ─────────────────────────────────────────

// ─── Route resolver by category ─────────────────────────
// Maps category + metadata → the best page to show context

function resolveRoute(category: Alert['category'], metadata?: Record<string, any>): AlertRoute | undefined {
  if (!metadata) return undefined;
  const asset = metadata.asset as string | undefined;

  switch (category) {
    case 'signal':
      return {
        path: '/signals',
        asset,
        signalId: metadata.signalId as string | undefined,
      };
    case 'price':
      return {
        path: '/dashboard',
        asset,
      };
    case 'scanner':
      return {
        path: '/radar-opportunities',
        asset,
      };
    case 'trade':
      return {
        path: '/history',
        asset,
      };
    case 'system':
      return {
        path: '/settings',
      };
    default:
      return undefined;
  }
}

// ─── Action label resolver ──────────────────────────────

function resolveActionLabel(category: Alert['category'], metadata?: Record<string, any>): string | undefined {
  const asset = metadata?.asset as string | undefined;
  switch (category) {
    case 'signal':   return asset ? `Voir ${asset}` : 'Voir les signaux';
    case 'price':    return asset ? `Voir ${asset}` : 'Voir le marché';
    case 'scanner':  return 'Voir le radar';
    case 'trade':    return 'Voir le journal';
    case 'system':   return 'Paramètres';
    default:         return 'Voir';
  }
}

// ─── SessionStorage bridge for cross-page context ───────

export function storeAlertContext(route: AlertRoute) {
  try {
    sessionStorage.setItem('__ALERT_NAV__', JSON.stringify(route));
  } catch { /* ignore */ }
}

export function consumeAlertContext(): AlertRoute | null {
  try {
    const raw = sessionStorage.getItem('__ALERT_NAV__');
    if (raw) {
      sessionStorage.removeItem('__ALERT_NAV__');
      return JSON.parse(raw);
    }
  } catch { /* ignore */ }
  return null;
}

// ─── Main createAlert ───────────────────────────────────

export function createAlert(
  title: string,
  message: string,
  priority: AlertPriority,
  category: Alert['category'],
  metadata?: Record<string, any>,
  explicitRoute?: AlertRoute,
  explicitActionLabel?: string
): Alert {
  const settings = getAlertSettings();

  // Check Do Not Disturb
  if (isDoNotDisturbActive(settings)) {
    // Still save alert but don't play sound/vibrate/notify
    const silentAlert: Alert = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title: `[DND] ${title}`,
      message,
      priority,
      category,
      createdAt: Date.now(),
      read: false,
      soundPlayed: true,
      metadata,
    };
    const alerts = loadAlerts();
    alerts.unshift(silentAlert);
    saveAlerts(alerts);
    callbacks.onNewAlert?.(silentAlert);
    return silentAlert;
  }

  // Check minimum priority
  const priorityOrder: AlertPriority[] = ['low', 'medium', 'high', 'critical'];
  if (priorityOrder.indexOf(priority) < priorityOrder.indexOf(settings.minPriority)) {
    return null as any;
  }

  // Check category filter
  if (!settings.categories.includes(category)) {
    return null as any;
  }

  // Deduplication check
  if (isDuplicate(title, priority)) {
    return null as any;
  }

  const route = explicitRoute ?? resolveRoute(category, metadata);
  const actionLabel = explicitActionLabel ?? resolveActionLabel(category, metadata);

  const alert: Alert = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title,
    message,
    priority,
    category,
    createdAt: Date.now(),
    read: false,
    soundPlayed: false,
    route,
    actionLabel,
    metadata,
  };

  const alerts = loadAlerts();
  alerts.unshift(alert);
  saveAlerts(alerts);

  // Play sound
  playPrioritySound(priority);

  // Vibrate
  vibrate(priority);

  // Desktop notification
  sendDesktopNotification(alert);

  // Notify subscribers
  callbacks.onNewAlert?.(alert);

  // Auto mark as read after delay
  if (settings.autoMarkRead && settings.autoMarkReadDelay > 0) {
    setTimeout(() => {
      markAlertAsRead(alert.id);
    }, settings.autoMarkReadDelay * 1000);
  }

  return alert;
}

// ─── Batch create multiple alerts ─────────────────────────

export function createAlerts(batch: Omit<Alert, 'id' | 'createdAt' | 'read' | 'soundPlayed'>[]) {
  return batch.map(a => createAlert(a.title, a.message, a.priority, a.category, a.metadata, a.route, a.actionLabel));
}

// ─── Read / Delete ────────────────────────────────────────

export function markAlertAsRead(id: string) {
  const alerts = loadAlerts().map(a => a.id === id ? { ...a, read: true } : a);
  saveAlerts(alerts);
  callbacks.onAlertRead?.(id);
}

export function markAllAsRead() {
  const alerts = loadAlerts().map(a => ({ ...a, read: true }));
  saveAlerts(alerts);
  callbacks.onAlertsCleared?.();
}

export function deleteAlert(id: string) {
  const alerts = loadAlerts().filter(a => a.id !== id);
  saveAlerts(alerts);
}

export function clearAllAlerts() {
  saveAlerts([]);
  callbacks.onAlertsCleared?.();
}

// ─── Pre-defined alert creators ───────────────────────────

export function alertSignalGenerated(asset: string, direction: string, confidence: number) {
  const priority: AlertPriority = confidence >= 85 ? 'critical' : confidence >= 70 ? 'high' : 'medium';
  return createAlert(
    `Signal ${direction} — ${asset}`,
    `Un signal ${direction} a été généré sur ${asset} avec ${confidence}% de confiance IA.`,
    priority,
    'signal',
    { asset, direction, confidence }
  );
}

export function alertPriceTarget(asset: string, price: number, target: number, condition: string) {
  return createAlert(
    `Alerte Prix — ${asset}`,
    `Le prix de ${asset} a atteint ${price.toFixed(2)} (${condition} ${target.toFixed(2)}).`,
    'high',
    'price',
    { asset, price, target, condition }
  );
}

export function alertScannerOpportunity(type: string, asset: string, strength: number) {
  const priority: AlertPriority = strength >= 80 ? 'high' : strength >= 60 ? 'medium' : 'low';
  return createAlert(
    `Opportunité ${type} — ${asset}`,
    `Le scanner a détecté une opportunité ${type} sur ${asset} (force: ${strength}%).`,
    priority,
    'scanner',
    { type, asset, strength }
  );
}

export function alertSystem(title: string, message: string, priority: AlertPriority = 'medium') {
  return createAlert(title, message, priority, 'system');
}

export function alertTradeExecuted(asset: string, pnl: number) {
  const priority: AlertPriority = pnl >= 0 ? 'high' : 'critical';
  return createAlert(
    pnl >= 0 ? `Profit — ${asset}` : `Perte — ${asset}`,
    `Trade sur ${asset} clôturé. P&L: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}€.`,
    priority,
    'trade',
    { asset, pnl }
  );
}

// ─── Get triggered alerts history ───────────────────────

export function getTriggeredHistory(): Alert[] {
  return loadAlerts().filter(a => a.category === 'price' || a.category === 'scanner');
}

// ─── Request notification permission ──────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;

  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  return result === 'granted';
}

// ─── Demo data generator ──────────────────────────────────

export function generateDemoAlerts() {
  const alerts = loadAlerts();
  if (alerts.length > 0) return; // Don't overwrite existing

  const demoAlerts: Alert[] = [
    {
      id: 'demo-1',
      title: 'Signal ACHAT — XAU/USD',
      message: 'Un signal ACHAT a été généré sur XAU/USD avec 91% de confiance IA. Entry: 4,468.50, SL: 4,452.00, TP1: 4,485.00',
      priority: 'critical',
      category: 'signal',
      createdAt: Date.now() - 120000,
      read: false,
      soundPlayed: true,
      route: { path: '/signals', asset: 'XAU/USD' },
      actionLabel: 'Voir XAU/USD',
      metadata: { asset: 'XAU/USD', direction: 'ACHAT', confidence: 91 },
    },
    {
      id: 'demo-2',
      title: 'Alerte Prix — BTC/USD',
      message: 'Le prix de BTC/USD a atteint 104,250.00 (au-dessus de 104,000.00).',
      priority: 'high',
      category: 'price',
      createdAt: Date.now() - 300000,
      read: false,
      soundPlayed: true,
      route: { path: '/dashboard', asset: 'BTC/USD' },
      actionLabel: 'Voir BTC/USD',
      metadata: { asset: 'BTC/USD', price: 104250, target: 104000 },
    },
    {
      id: 'demo-3',
      title: 'Opportunité Breakout — EUR/USD',
      message: 'Le scanner a détecté une opportunité Breakout sur EUR/USD (force: 78%).',
      priority: 'high',
      category: 'scanner',
      createdAt: Date.now() - 600000,
      read: false,
      soundPlayed: true,
      route: { path: '/radar-opportunities', asset: 'EUR/USD' },
      actionLabel: 'Voir le radar',
      metadata: { type: 'Breakout', asset: 'EUR/USD', strength: 78 },
    },
    {
      id: 'demo-4',
      title: 'Signal VENTE — ETH/USD',
      message: 'Un signal VENTE a été généré sur ETH/USD avec 72% de confiance IA.',
      priority: 'medium',
      category: 'signal',
      createdAt: Date.now() - 900000,
      read: true,
      soundPlayed: true,
      route: { path: '/signals', asset: 'ETH/USD' },
      actionLabel: 'Voir ETH/USD',
      metadata: { asset: 'ETH/USD', direction: 'VENTE', confidence: 72 },
    },
    {
      id: 'demo-5',
      title: 'Mise à jour système',
      message: 'XTrendAI Pro v2.4 est disponible avec de nouvelles fonctionnalités.',
      priority: 'low',
      category: 'system',
      createdAt: Date.now() - 1800000,
      read: true,
      soundPlayed: true,
      route: { path: '/settings' },
      actionLabel: 'Paramètres',
    },
  ];

  saveAlerts(demoAlerts);
}
