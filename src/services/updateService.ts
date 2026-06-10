/**
 * Update Service
 * Système de gestion des mises à jour Admin → Site Vitrine
 * Persistance via localStorage, diffusion temps réel via events
 */

export interface PlatformUpdate {
  id: string;
  title: string;
  description: string;
  category: 'feature' | 'improvement' | 'fix' | 'announcement' | 'data';
  severity: 'critical' | 'major' | 'minor' | 'info';
  targetPage: 'all' | 'landing' | 'dashboard' | 'pricing' | 'faq';
  featureTag?: string; // Pour lier à une fonctionnalité spécifique
  icon?: string;
  publishedAt: string;
  expiresAt?: string;
  active: boolean;
  pinned: boolean;
  author?: string;
  views: number;
}

const STORAGE_KEY = 'xtrendai_platform_updates';
const LAST_SEEN_KEY = 'xtrendai_updates_last_seen';
const UPDATE_EVENT = 'xtrendai-update-published';

// ─── CRUD ───────────────────────────────────────────────

export function getAllUpdates(): PlatformUpdate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultUpdates();
    return JSON.parse(raw);
  } catch {
    return getDefaultUpdates();
  }
}

export function getActiveUpdates(): PlatformUpdate[] {
  const now = new Date().toISOString();
  return getAllUpdates()
    .filter(u => u.active)
    .filter(u => !u.expiresAt || u.expiresAt > now)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
}

export function getUpdatesForPage(page: string): PlatformUpdate[] {
  return getActiveUpdates().filter(u => u.targetPage === 'all' || u.targetPage === page);
}

export function getPinnedUpdates(): PlatformUpdate[] {
  return getActiveUpdates().filter(u => u.pinned);
}

export function getRecentUpdates(limit: number = 5): PlatformUpdate[] {
  return getActiveUpdates().slice(0, limit);
}

export function hasUnreadUpdates(): boolean {
  const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
  if (!lastSeen) return getActiveUpdates().length > 0;
  const updates = getActiveUpdates();
  return updates.some(u => new Date(u.publishedAt).getTime() > new Date(lastSeen).getTime());
}

export function markUpdatesAsSeen(): void {
  localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
}

export function getUnreadCount(): number {
  const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
  if (!lastSeen) return getActiveUpdates().length;
  return getActiveUpdates().filter(u => new Date(u.publishedAt).getTime() > new Date(lastSeen).getTime()).length;
}

// ─── Mutations ──────────────────────────────────────────

export function addUpdate(update: Omit<PlatformUpdate, 'id' | 'publishedAt' | 'views'>): PlatformUpdate {
  const updates = getAllUpdates();
  const newUpdate: PlatformUpdate = {
    ...update,
    id: `upd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    publishedAt: new Date().toISOString(),
    views: 0,
  };
  updates.unshift(newUpdate);
  saveUpdates(updates);
  notifyUpdatePublished(newUpdate);
  return newUpdate;
}

export function editUpdate(id: string, changes: Partial<PlatformUpdate>): PlatformUpdate | null {
  const updates = getAllUpdates();
  const idx = updates.findIndex(u => u.id === id);
  if (idx === -1) return null;
  updates[idx] = { ...updates[idx], ...changes };
  saveUpdates(updates);
  notifyUpdatePublished(updates[idx]);
  return updates[idx];
}

export function toggleUpdateActive(id: string): boolean {
  const updates = getAllUpdates();
  const idx = updates.findIndex(u => u.id === id);
  if (idx === -1) return false;
  updates[idx].active = !updates[idx].active;
  saveUpdates(updates);
  notifyUpdatePublished(updates[idx]);
  return updates[idx].active;
}

export function deleteUpdate(id: string): boolean {
  const updates = getAllUpdates().filter(u => u.id !== id);
  saveUpdates(updates);
  notifyUpdatePublished();
  return true;
}

export function togglePinned(id: string): boolean {
  const updates = getAllUpdates();
  const idx = updates.findIndex(u => u.id === id);
  if (idx === -1) return false;
  updates[idx].pinned = !updates[idx].pinned;
  saveUpdates(updates);
  return updates[idx].pinned;
}

export function incrementViews(id: string): void {
  const updates = getAllUpdates();
  const idx = updates.findIndex(u => u.id === id);
  if (idx !== -1) {
    updates[idx].views++;
    saveUpdates(updates);
  }
}

// ─── Helpers ────────────────────────────────────────────

function saveUpdates(updates: PlatformUpdate[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updates));
}

function notifyUpdatePublished(update?: PlatformUpdate): void {
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: update }));
}

export function onUpdatePublished(callback: (update?: PlatformUpdate) => void): () => void {
  const handler = (e: Event) => callback((e as CustomEvent).detail);
  window.addEventListener(UPDATE_EVENT, handler);
  return () => window.removeEventListener(UPDATE_EVENT, handler);
}

// ─── Category helpers ───────────────────────────────────

export const categoryLabels: Record<string, { label: string; color: string; bg: string }> = {
  feature: { label: 'Nouveauté', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  improvement: { label: 'Amélioration', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  fix: { label: 'Correction', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  announcement: { label: 'Annonce', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  data: { label: 'Données', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
};

export const severityConfig: Record<string, { label: string; color: string }> = {
  critical: { label: 'Critique', color: 'text-red-400' },
  major: { label: 'Majeur', color: 'text-orange-400' },
  minor: { label: 'Mineur', color: 'text-amber-400' },
  info: { label: 'Info', color: 'text-slate-400' },
};

// ─── Default seed data ──────────────────────────────────

function getDefaultUpdates(): PlatformUpdate[] {
  const defaults: PlatformUpdate[] = [
    {
      id: 'upd-001',
      title: 'AI Signal Engine — Moteur de signaux temps réel',
      description: 'Notre moteur IA génère désormais des signaux ACHAT/VENTE/ATTENTE basés sur les données marché réelles (Binance, Frankfurter, Currency-API). Chaque signal inclut Entry, SL, TP1/TP2/TP3 et un ratio Risk/Reward calculé automatiquement.',
      category: 'feature',
      severity: 'major',
      targetPage: 'landing',
      featureTag: 'AI Signal Engine',
      icon: 'Zap',
      publishedAt: '2026-06-05T10:00:00Z',
      active: true,
      pinned: true,
      author: 'Système',
      views: 142,
    },
    {
      id: 'upd-002',
      title: 'XAU/USD connecté à Currency-API — Prix de l\'or en direct',
      description: 'Le prix de l\'or est maintenant récupéré en temps réel via Currency-API (~4 470 USD/oz au lieu du prix statique précédent de 3 380). Toutes les pages (Dashboard, XAU Premium, Smart Money) utilisent désormais ce prix live.',
      category: 'improvement',
      severity: 'critical',
      targetPage: 'all',
      featureTag: 'XAU/USD Premium',
      icon: 'Diamond',
      publishedAt: '2026-06-05T11:00:00Z',
      active: true,
      pinned: true,
      author: 'Système',
      views: 238,
    },
    {
      id: 'upd-003',
      title: 'Smart Money Tracker — 7 concepts institutionnels détectés',
      description: 'Détection automatique en temps réel : Order Blocks, Breaker Blocks, Fair Value Gaps, Liquidity Pools, BOS/CHOCH, Stop Hunts et zones Premium/Discount. Tous calculés depuis les candles réelles.',
      category: 'feature',
      severity: 'major',
      targetPage: 'landing',
      featureTag: 'Smart Money Tracker',
      icon: 'Target',
      publishedAt: '2026-06-05T12:00:00Z',
      active: true,
      pinned: false,
      author: 'Système',
      views: 89,
    },
    {
      id: 'upd-004',
      title: 'Laboratoire de Stratégies — Backtest sur données réelles',
      description: 'Testez 5 stratégies (RSI Reversal, MACD Momentum, EMA Cross, Bollinger Breakout, Trend Following) sur des données Binance réelles. Métriques : Win Rate, Profit Factor, Drawdown Max.',
      category: 'feature',
      severity: 'major',
      targetPage: 'landing',
      featureTag: 'Strategy Lab',
      icon: 'FlaskConical',
      publishedAt: '2026-06-05T13:00:00Z',
      active: true,
      pinned: false,
      author: 'Système',
      views: 67,
    },
    {
      id: 'upd-005',
      title: 'Assistant IA Trading — Réponses basées sur données temps réel',
      description: 'L\'assistant interroge les prix actuels du marché et les signaux IA pour fournir des analyses personnalisées. Demandez "Analyse XAU/USD" et obtenez le prix live avec recommandations.',
      category: 'feature',
      severity: 'minor',
      targetPage: 'all',
      featureTag: 'AI Assistant',
      icon: 'Cpu',
      publishedAt: '2026-06-05T14:00:00Z',
      active: true,
      pinned: false,
      author: 'Système',
      views: 45,
    },
    {
      id: 'upd-006',
      title: 'Site Vitrine restructuré avec images concrètes',
      description: 'La landing page affiche désormais 7 images professionnelles des fonctionnalités, des témoignages avec résultats concrets, une FAQ complète et un système de packs évolutifs Free/Pro/Expert/Institutionnel.',
      category: 'improvement',
      severity: 'major',
      targetPage: 'landing',
      icon: 'Globe',
      publishedAt: '2026-06-05T15:00:00Z',
      active: true,
      pinned: false,
      author: 'Système',
      views: 312,
    },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  return defaults;
}

// ─── Reset (for testing) ────────────────────────────────

export function resetUpdates(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LAST_SEEN_KEY);
  getDefaultUpdates();
}
