/**
 * News Engine — Moteur de gestion des news économiques et de marché
 *
 * Types, scoring d'impact, liens aux actifs, décisions IA,
 * historique des réactions, et connexion au Centre de Décision.
 */

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export type NewsCategory =
  | 'macro' | 'forex' | 'xau' | 'crypto' | 'indices' | 'stocks'
  | 'commodities' | 'energy' | 'bonds' | 'bank_speaks' | 'geopolitics'
  | 'earnings' | 'regulation' | 'central_bank';

export type NewsImpact = 'low' | 'medium' | 'high' | 'critical';
export type NewsStatus = 'upcoming' | 'live' | 'past';
export type SurpriseType = 'positive' | 'negative' | 'neutral';
export type DecisionAction = 'ACHETER' | 'VENDRE' | 'ATTENDRE' | 'EVITER' | 'NO_TRADE';

export interface NewsItem {
  id: string;
  timestamp: number;
  timeLabel: string;
  country: string;
  currency: string;
  category: NewsCategory;
  title: string;
  source: string;
  impact: NewsImpact;
  status: NewsStatus;
  // Data comparison
  previousValue: string;
  forecastValue: string;
  actualValue: string | null;
  surprise: SurpriseType | null;
  // Impact & Decision
  affectedAssets: string[];
  probableDirection: 'bullish' | 'bearish' | 'neutral' | null;
  aiDecision: DecisionAction | null;
  riskLevel: 'low' | 'medium' | 'high' | null;
  signalNote: 'A+' | 'A' | 'B' | 'C' | 'D' | null;
  // Score
  impactScore: number; // 0-100
  // Explanation
  whyImportant: string;
  marketReaction: string;
  // Links
  links: NewsLinks;
  // After-news analysis
  beforeSignal: string | null;
  afterSignal: string | null;
  invalidationLevel: string | null;
  // Admin
  createdAt: number;
}

export interface NewsLinks {
  technicalAnalysis: string | null;
  fundamentalAnalysis: string | null;
  institutionalAnalysis: string | null;
  decisionCenter: string | null;
  affectedAsset: string | null;
  createAlert: string | null;
  externalSource: string | null;
}

export interface NewsFilterState {
  date: string | null;
  country: string | null;
  currency: string | null;
  market: string | null;
  asset: string | null;
  impact: NewsImpact | 'ALL';
  category: NewsCategory | 'ALL';
  source: string | null;
  result: 'better' | 'worse' | 'as_expected' | 'ALL';
  decision: DecisionAction | 'ALL';
  note: 'A+' | 'A' | 'B' | 'C' | 'D' | 'ALL';
  status: NewsStatus | 'ALL';
  searchQuery: string;
  showWatchlistOnly: boolean;
}

export interface NewsDaySummary {
  topNews: NewsItem | null;
  mostImpactedCurrency: string | null;
  mostImpactedAsset: string | null;
  riskiestMarket: string | null;
  upcomingNews: NewsItem[];
  bestOpportunity: NewsItem | null;
  assetToAvoid: string | null;
  aiSummary: string;
  totalHighImpact: number;
  totalCritical: number;
}

export interface NewsAlert {
  id: string;
  type: 'before_60' | 'before_30' | 'published' | 'surprise_positive' | 'surprise_negative'
    | 'high_volatility' | 'decision_changed' | 'no_trade' | 'watchlist_impacted' | 'score_changed';
  newsId: string;
  title: string;
  message: string;
  triggered: boolean;
  triggeredAt: number | null;
  dismissed: boolean;
}

export interface HistoricalReaction {
  newsId: string;
  title: string;
  category: NewsCategory;
  impact: NewsImpact;
  actualValue: string;
  forecastValue: string;
  surprise: SurpriseType;
  // Reactions
  xauReaction: string;
  eurUsdReaction: string;
  nasdaqReaction: string;
  btcReaction: string;
  volatility5m: string;
  volatility15m: string;
  volatility1h: string;
  // Decisions
  beforeDecision: string;
  afterDecision: string;
  result: string;
  lesson: string;
}

// ═══════════════════════════════════════════════════════════
// IMPACT SCORING
// ═══════════════════════════════════════════════════════════

export function calculateImpactScore(news: Partial<NewsItem>): number {
  let score = 0;

  // Impact level (0-40)
  const impactScores: Record<NewsImpact, number> = { low: 10, medium: 25, high: 35, critical: 40 };
  score += impactScores[news.impact || 'low'];

  // Surprise magnitude (0-30)
  if (news.surprise === 'positive' || news.surprise === 'negative') {
    score += 25;
  } else {
    score += 10;
  }

  // Affected assets count (0-15)
  const assetCount = news.affectedAssets?.length || 0;
  score += Math.min(15, assetCount * 3);

  // Category weight (0-15)
  const catWeights: Partial<Record<NewsCategory, number>> = {
    macro: 15, central_bank: 15, geopolitics: 12, earnings: 10,
    forex: 8, xau: 8, crypto: 8, indices: 8, regulation: 8,
    commodities: 6, energy: 6, bonds: 5, bank_speaks: 5, stocks: 5,
  };
  score += catWeights[news.category || 'macro'] || 5;

  return Math.min(100, Math.round(score));
}

// ═══════════════════════════════════════════════════════════
// ASSET MAPPING
// ═══════════════════════════════════════════════════════════

export const NEWS_TO_ASSETS: Record<string, string[]> = {
  'USD': ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'USD/CAD', 'AUD/USD', 'XAU/USD', 'BTC/USD', 'NAS100', 'SPX500', 'DXY', 'US10Y', 'US2Y'],
  'EUR': ['EUR/USD', 'EUR/GBP', 'EUR/JPY', 'EUR/CHF', 'EUR/CAD', 'EUR/AUD', 'DE40', 'FR40', 'EU50', 'EUR/GBP'],
  'GBP': ['GBP/USD', 'EUR/GBP', 'GBP/JPY', 'GBP/CHF', 'GBP/CAD', 'GBP/AUD', 'UK100'],
  'JPY': ['USD/JPY', 'EUR/JPY', 'GBP/JPY', 'AUD/JPY', 'CAD/JPY', 'CHF/JPY', 'NZD/JPY', 'JP225'],
  'CHF': ['USD/CHF', 'EUR/CHF', 'GBP/CHF', 'AUD/CHF', 'CAD/CHF', 'CHF/JPY'],
  'AUD': ['AUD/USD', 'EUR/AUD', 'GBP/AUD', 'AUD/JPY', 'AUD/CAD', 'AUD/CHF', 'AUD/USD', 'AU200'],
  'CAD': ['USD/CAD', 'EUR/CAD', 'GBP/CAD', 'AUD/CAD', 'CAD/JPY', 'CAD/CHF', 'USD/CAD'],
  'NZD': ['NZD/USD', 'NZD/JPY', 'AUD/USD'],
  'CNY': ['XAU/USD', 'WTI', 'BRENT', 'COPPER', 'AUD/USD', 'JP225'],
  // Commodities
  'OIL': ['WTI', 'BRENT', 'USD/CAD', 'NATGAS'],
  'GAS': ['NATGAS', 'WTI', 'BRENT'],
  'GOLD': ['XAU/USD', 'XAG/USD', 'DXY', 'US10Y', 'EUR/USD'],
  'SILVER': ['XAG/USD', 'XAU/USD', 'DXY'],
  'COPPER': ['COPPER', 'XAU/USD', 'AUD/USD'],
  // Crypto
  'BTC': ['BTC/USD', 'ETH/USD', 'SOL/USD', 'BNB/USD', 'XRP/USD'],
  'ETH': ['ETH/USD', 'BTC/USD', 'SOL/USD'],
  'CRYPTO': ['BTC/USD', 'ETH/USD', 'SOL/USD', 'BNB/USD', 'XRP/USD', 'ADA/USD', 'DOGE/USD', 'AVAX/USD'],
  // Indices
  'NASDAQ': ['NAS100', 'SPX500', 'AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'META', 'GOOGL'],
  'SPX': ['SPX500', 'NAS100', 'US30', 'AAPL', 'MSFT', 'AMZN'],
  'FED': ['XAU/USD', 'EUR/USD', 'USD/JPY', 'NAS100', 'SPX500', 'US10Y', 'US2Y', 'DXY', 'BTC/USD'],
  'ECB': ['EUR/USD', 'GBP/USD', 'DE40', 'FR40', 'EU50', 'EUR/JPY', 'EUR/GBP'],
  'BOE': ['GBP/USD', 'EUR/GBP', 'UK100', 'GBP/JPY'],
  'BOJ': ['USD/JPY', 'EUR/JPY', 'GBP/JPY', 'JP225'],
  // Inflation
  'CPI': ['XAU/USD', 'EUR/USD', 'USD/JPY', 'NAS100', 'SPX500', 'US10Y', 'DXY', 'BTC/USD'],
  'NFP': ['XAU/USD', 'EUR/USD', 'USD/JPY', 'NAS100', 'SPX500', 'US30', 'DXY', 'US10Y'],
  'GDP': ['EUR/USD', 'GBP/USD', 'USD/JPY', 'NAS100', 'DE40', 'SPX500'],
  'PMI': ['EUR/USD', 'GBP/USD', 'DE40', 'FR40', 'UK100'],
  // Defaults
  'ALL': ['XAU/USD', 'BTC/USD', 'EUR/USD', 'USD/JPY', 'NAS100', 'SPX500', 'WTI', 'DXY'],
};

export function getAffectedAssets(currency: string, category: NewsCategory): string[] {
  const key = currency.toUpperCase();
  if (NEWS_TO_ASSETS[key]) return NEWS_TO_ASSETS[key];

  // Fallback by category
  const catMap: Partial<Record<NewsCategory, string[]>> = {
    macro: ['XAU/USD', 'EUR/USD', 'USD/JPY', 'NAS100', 'SPX500', 'DXY', 'US10Y'],
    forex: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD'],
    xau: ['XAU/USD', 'XAG/USD', 'DXY', 'US10Y', 'EUR/USD'],
    crypto: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'BNB/USD'],
    indices: ['NAS100', 'SPX500', 'US30', 'DE40', 'FR40'],
    commodities: ['WTI', 'BRENT', 'COPPER', 'XAU/USD'],
    energy: ['WTI', 'BRENT', 'NATGAS', 'USD/CAD'],
    bonds: ['US10Y', 'US2Y', 'EUR/USD', 'XAU/USD'],
    central_bank: ['XAU/USD', 'EUR/USD', 'USD/JPY', 'NAS100', 'DXY', 'US10Y'],
    geopolitics: ['XAU/USD', 'WTI', 'BRENT', 'USD/JPY', 'BTC/USD'],
    earnings: ['NAS100', 'SPX500', 'AAPL', 'TSLA', 'NVDA', 'MSFT'],
    regulation: ['BTC/USD', 'ETH/USD', 'BNB/USD', 'XRP/USD'],
  };
  return catMap[category] || NEWS_TO_ASSETS.ALL;
}

// ═══════════════════════════════════════════════════════════
// AI DECISION ENGINE
// ═══════════════════════════════════════════════════════════

export function generateNewsDecision(news: NewsItem): {
  action: DecisionAction;
  explanation: string;
  beforeSignal: string;
  afterSignal: string;
  invalidationLevel: string;
} {
  const isHighImpact = news.impact === 'high' || news.impact === 'critical';
  const hasSurprise = news.surprise === 'positive' || news.surprise === 'negative';
  const isUpcoming = news.status === 'upcoming';
  const isLive = news.status === 'live';

  // BEFORE NEWS
  if (isUpcoming && isHighImpact) {
    return {
      action: 'NO_TRADE',
      explanation: `Publication ${news.impact === 'critical' ? 'critique' : 'importante'} dans moins de 60 minutes. Volatilité attendue sur ${news.affectedAssets.slice(0, 3).join(', ')}. Attendre la publication et la réaction initiale du marché.`,
      beforeSignal: 'Achat technique identifié avant la news',
      afterSignal: 'Signal suspendu — attente de la réaction post-news',
      invalidationLevel: 'Perte du support H1 si volatilité > 3× normale',
    };
  }

  if (isUpcoming && !isHighImpact) {
    return {
      action: 'ATTENDRE',
      explanation: `News de niveau ${news.impact} à venir. Réduire la taille de position ou sécuriser les profits.`,
      beforeSignal: 'Signal actif — réduction de taille recommandée',
      afterSignal: 'Réévaluation après la publication',
      invalidationLevel: 'Sortie partielle si volatilité anormale',
    };
  }

  // LIVE NEWS
  if (isLive) {
    if (hasSurprise) {
      return {
        action: 'ATTENDRE',
        explanation: `Surprise ${news.surprise === 'positive' ? 'positive' : 'négative'} détectée. Attendre la stabilisation du marché (5-15 minutes) avant toute décision.`,
        beforeSignal: 'Signal précédent suspendu',
        afterSignal: 'Réévaluation en cours — attente de confirmation',
        invalidationLevel: 'Annuler si le prix sort du range de volatilité',
      };
    }
    return {
      action: news.surprise === 'neutral' ? 'ATTENDRE' : 'NO_TRADE',
      explanation: 'News en cours de publication. Attendre le résultat complet et la réaction du marché.',
      beforeSignal: 'Signal actif en attente',
      afterSignal: 'Mise à jour après complétion',
      invalidationLevel: 'Sortie si volatilité > 2%',
    };
  }

  // PAST NEWS — Analyze result
  if (news.surprise === 'positive' && news.probableDirection === 'bullish') {
    return {
      action: 'ACHETER',
      explanation: `Résultat supérieur aux attentes, confirmant la tendance haussière. Entry possible après retest.`,
      beforeSignal: 'Achat technique',
      afterSignal: 'Achat confirmé par la news',
      invalidationLevel: `Perte de ${news.affectedAssets[0] || 'niveau'} support`,
    };
  }
  if (news.surprise === 'negative' && news.probableDirection === 'bearish') {
    return {
      action: 'VENDRE',
      explanation: `Résultat inférieur aux attentes, confirmant la pression baissière.`,
      beforeSignal: 'Vente technique',
      afterSignal: 'Vente confirmée par la news',
      invalidationLevel: `Rebond au-dessus de la résistance`,
    };
  }

  return {
    action: 'ATTENDRE',
    explanation: 'Résultat conforme aux attentes — pas de changement de direction majeur.',
    beforeSignal: 'Signal inchangé',
    afterSignal: 'Signal maintenu',
    invalidationLevel: 'Breakout dans le sens opposé',
  };
}

// ═══════════════════════════════════════════════════════════
// SUMMARY GENERATOR
// ═══════════════════════════════════════════════════════════

export function generateDaySummary(newsList: NewsItem[]): NewsDaySummary {
  const highImpact = newsList.filter(n => n.impact === 'high' || n.impact === 'critical');
  const critical = newsList.filter(n => n.impact === 'critical');
  const upcoming = newsList.filter(n => n.status === 'upcoming' && (n.impact === 'high' || n.impact === 'critical'));

  const topNews = critical[0] || highImpact[0] || newsList[0] || null;

  // Most impacted currency
  const currencyCount: Record<string, number> = {};
  newsList.forEach(n => { currencyCount[n.currency] = (currencyCount[n.currency] || 0) + 1; });
  const mostImpactedCurrency = Object.entries(currencyCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  // Most impacted asset
  const assetCount: Record<string, number> = {};
  newsList.forEach(n => n.affectedAssets.forEach(a => { assetCount[a] = (assetCount[a] || 0) + 1; }));
  const mostImpactedAsset = Object.entries(assetCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  // Riskiest market
  const riskyMarkets = ['Forex', 'Crypto', 'Indices', 'Commodities'];
  const riskiestMarket = mostImpactedCurrency ? `Forex (${mostImpactedCurrency})` : riskyMarkets[Math.floor(Math.random() * riskyMarkets.length)];

  // Best opportunity
  const bestOpp = newsList
    .filter(n => n.impactScore >= 60 && n.aiDecision && (n.aiDecision === 'ACHETER' || n.aiDecision === 'VENDRE'))
    .sort((a, b) => b.impactScore - a.impactScore)[0] || null;

  // Asset to avoid
  const avoidNews = newsList.find(n => n.aiDecision === 'NO_TRADE' || n.aiDecision === 'EVITER');
  const assetToAvoid = avoidNews?.affectedAssets[0] || null;

  // AI Summary
  let aiSummary: string;
  if (topNews) {
    aiSummary = `Aujourd'hui, ${topNews.title} représente le risque principal${topNews.impact === 'critical' ? ' critique' : ''}`;
    if (mostImpactedAsset) {
      aiSummary += `. ${mostImpactedAsset} et ${upcoming.length > 0 ? upcoming.map(n => n.affectedAssets[0]).filter(Boolean).slice(0, 2).join(', ') : 'les actifs liés'} doivent être surveillés`;
    }
    if (avoidNews) {
      aiSummary += `. Décision recommandée : ${avoidNews.aiDecision === 'NO_TRADE' ? 'No Trade' : 'Attendre'} sur ${avoidNews.affectedAssets[0] || 'les actifs sensibles'} jusqu'à confirmation post-news.`;
    } else {
      aiSummary += `. Conditions stables pour le moment.`;
    }
  } else {
    aiSummary = `Aucune news majeure aujourd'hui. Marchés normaux — surveillance standard recommandée.`;
  }

  return {
    topNews,
    mostImpactedCurrency,
    mostImpactedAsset,
    riskiestMarket,
    upcomingNews: upcoming.slice(0, 5),
    bestOpportunity: bestOpp,
    assetToAvoid,
    aiSummary,
    totalHighImpact: highImpact.length,
    totalCritical: critical.length,
  };
}

// ═══════════════════════════════════════════════════════════
// FILTER
// ═══════════════════════════════════════════════════════════

export const DEFAULT_FILTER: NewsFilterState = {
  date: null,
  country: null,
  currency: null,
  market: null,
  asset: null,
  impact: 'ALL',
  category: 'ALL',
  source: null,
  result: 'ALL',
  decision: 'ALL',
  note: 'ALL',
  status: 'ALL',
  searchQuery: '',
  showWatchlistOnly: false,
};

export function filterNews(news: NewsItem[], filters: NewsFilterState): NewsItem[] {
  return news.filter(item => {
    if (filters.impact !== 'ALL' && item.impact !== filters.impact) return false;
    if (filters.category !== 'ALL' && item.category !== filters.category) return false;
    if (filters.status !== 'ALL' && item.status !== filters.status) return false;
    if (filters.decision !== 'ALL' && item.aiDecision !== filters.decision) return false;
    if (filters.note !== 'ALL' && item.signalNote !== filters.note) return false;
    if (filters.currency && !item.currency.includes(filters.currency.toUpperCase())) return false;
    if (filters.asset && !item.affectedAssets.some(a => a.toLowerCase().includes(filters.asset!.toLowerCase()))) return false;
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      if (!item.title.toLowerCase().includes(q) &&
          !item.country.toLowerCase().includes(q) &&
          !item.currency.toLowerCase().includes(q)) return false;
    }
    if (filters.result !== 'ALL' && item.surprise) {
      if (filters.result === 'better' && item.surprise !== 'positive') return false;
      if (filters.result === 'worse' && item.surprise !== 'negative') return false;
      if (filters.result === 'as_expected' && item.surprise !== 'neutral') return false;
    }
    return true;
  }).sort((a, b) => {
    // Critical first, then by timestamp (newest first)
    const impactOrder: Record<NewsImpact, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    if (impactOrder[a.impact] !== impactOrder[b.impact]) {
      return impactOrder[b.impact] - impactOrder[a.impact];
    }
    return b.timestamp - a.timestamp;
  });
}

// ═══════════════════════════════════════════════════════════
// CATEGORY & UI HELPERS
// ═══════════════════════════════════════════════════════════

export const NEWS_CATEGORIES_UI: { key: NewsCategory | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'Toutes' },
  { key: 'macro', label: 'Macroéconomique' },
  { key: 'central_bank', label: 'Banques Centrales' },
  { key: 'forex', label: 'Forex' },
  { key: 'xau', label: 'Or / Métaux' },
  { key: 'crypto', label: 'Crypto' },
  { key: 'indices', label: 'Indices' },
  { key: 'stocks', label: 'Actions' },
  { key: 'energy', label: 'Énergie' },
  { key: 'commodities', label: 'Matières Premières' },
  { key: 'bonds', label: 'Obligations' },
  { key: 'earnings', label: 'Résultats Entreprises' },
  { key: 'geopolitics', label: 'Géopolitique' },
  { key: 'regulation', label: 'Régulation' },
];

export const IMPACT_COLORS: Record<NewsImpact, { bg: string; text: string; border: string; badge: string }> = {
  critical: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', badge: 'bg-red-500 text-white' },
  high: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', badge: 'bg-amber-500 text-white' },
  medium: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', badge: 'bg-blue-500 text-white' },
  low: { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30', badge: 'bg-slate-600 text-slate-200' },
};

export const DECISION_COLORS: Record<DecisionAction, string> = {
  ACHETER: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  VENDRE: 'text-red-400 bg-red-500/10 border-red-500/30',
  ATTENDRE: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  EVITER: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  NO_TRADE: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
};

export const STATUS_LABELS: Record<NewsStatus, string> = {
  upcoming: 'À venir',
  live: 'En cours',
  past: 'Passée',
};

export const NOTE_COLORS: Record<string, { bg: string; text: string }> = {
  'A+': { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  'A': { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  'B': { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  'C': { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  'D': { bg: 'bg-red-500/10', text: 'text-red-400' },
};

// Pack access levels
export function getNewsAccess(pack: string): 'basic' | 'advanced' | 'full' {
  if (pack === 'expert' || pack === 'institutional') return 'full';
  if (pack === 'pro') return 'advanced';
  return 'basic';
}
