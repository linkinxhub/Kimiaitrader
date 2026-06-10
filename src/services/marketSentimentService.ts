/**
 * Market Sentiment Service — Analyse complète du sentiment et de la volatilité
 * 
 * Fournit :
 * - Fear & Greed Index composite (0-100)
 * - Sentiment par catégorie (Forex, Crypto, Métaux, Indices, Énergies)
 * - Volatilité (ATR, range 24h, vol implicite)
 * - Market Breadth (% haussiers/baissiers)
 * - Heatmap (force relative par actif)
 * - Correlation Matrix (inter-actifs)
 */

import type { PriceData } from './marketApi';

// ─── Types ──────────────────────────────────────────────

export interface CategorySentiment {
  category: string;
  fearGreed: number;       // 0-100 (0=extreme fear, 100=extreme greed)
  fearGreedLabel: string;  // "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed"
  color: string;           // tailwind color class
  avgChange24h: number;    // moyenne change24h
  volatility: number;      // volatilité moyenne (ATR-like)
  breadthBullish: number;  // % d'actifs haussiers
  breadthBearish: number;  // % d'actifs baissiers
  breadthNeutral: number;  // % d'actifs neutres
  momentum: number;        // -100 à +100
  trend: 'haussier' | 'baissier' | 'neutre' | 'volatile';
  trendStrength: number;   // 0-100
  keyLevel: string;        // niveau clé (support/résistance)
}

export interface AssetHeatmap {
  asset: string;
  category: string;
  price: number;
  change24h: number;
  change1h: number;
  volume: number;          // volume relatif (0-100)
  strength: number;        // force relative (0-100)
  signal: 'ACHAT' | 'VENTE' | 'NEUTRE';
  rsi: number;
  volatility: number;
}

export interface CorrelationPair {
  assetA: string;
  assetB: string;
  correlation: number;     // -1 à +1
  strength: 'forte' | 'moderee' | 'faible';
}

export interface MarketSentiment {
  timestamp: number;
  globalFearGreed: number;
  globalLabel: string;
  globalColor: string;
  categories: CategorySentiment[];
  heatmap: AssetHeatmap[];
  correlations: CorrelationPair[];
  topGainers: AssetHeatmap[];
  topLosers: AssetHeatmap[];
  mostVolatile: AssetHeatmap[];
  vixEstimate: number;     // estimation VIX (0-100)
  riskOnRiskOff: 'risk-on' | 'risk-off' | 'neutral';
  safeHavenFlow: 'inflow' | 'outflow' | 'neutral';
}

// ─── Categories ─────────────────────────────────────────

const CATEGORY_ASSETS: Record<string, string[]> = {
  'Forex': ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD'],
  'Crypto': ['BTC/USD', 'ETH/USD', 'SOL/USD', 'BNB/USD', 'ADA/USD', 'DOT/USD', 'XRP/USD'],
  'Metaux': ['XAU/USD', 'XAG/USD', 'XPT/USD'],
  'Indices': ['NAS100', 'SPX500', 'DE40', 'UK100', 'JP225', 'US30'],
  'Energies': ['WTI', 'BRENT', 'NATGAS'],
  'Agriculture': ['SOYBEAN', 'WHEAT', 'CORN'],
};

// ─── Fear & Greed thresholds ────────────────────────────

function getFearGreedLabel(score: number): { label: string; color: string } {
  if (score <= 20) return { label: 'Peur Extrême', color: 'text-red-500' };
  if (score <= 40) return { label: 'Peur', color: 'text-red-400' };
  if (score <= 60) return { label: 'Neutre', color: 'text-amber-400' };
  if (score <= 80) return { label: 'Avarice', color: 'text-emerald-400' };
  return { label: 'Avarice Extrême', color: 'text-emerald-500' };
}

// ─── RSI estimation from price changes ──────────────────

function estimateRSI(changes: number[]): number {
  if (changes.length === 0) return 50;
  const gains = changes.filter(c => c > 0);
  const losses = changes.filter(c => c < 0);
  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / gains.length : 0;
  const avgLoss = Math.abs(losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0.001);
  const rs = avgGain / avgLoss;
  return Math.round(100 - (100 / (1 + rs)));
}

// ─── Main calculation ───────────────────────────────────

export function calculateMarketSentiment(
  prices: Record<string, PriceData>,
  previousPrices?: Record<string, number>
): MarketSentiment {
  const now = Date.now();
  const assets = Object.keys(prices);

  // ─── Heatmap per asset ──
  const heatmap: AssetHeatmap[] = assets.map(asset => {
    const d = prices[asset];
    const prev = previousPrices?.[asset] ?? d.price * (1 - d.change24hPercent / 100);
    const change1h = ((d.price - prev) / prev) * 100;
    const rsi = estimateRSI([d.change24hPercent]);
    const vol = Math.abs(d.high24h - d.low24h) / d.price * 100;

    let signal: 'ACHAT' | 'VENTE' | 'NEUTRE' = 'NEUTRE';
    if (rsi < 30 && d.change24hPercent > -1) signal = 'ACHAT';
    else if (rsi > 70 && d.change24hPercent < 1) signal = 'VENTE';

    // Find category
    let category = 'Divers';
    for (const [cat, cats] of Object.entries(CATEGORY_ASSETS)) {
      if (cats.includes(asset)) { category = cat; break; }
    }

    return {
      asset, category, price: d.price, change24h: d.change24hPercent,
      change1h, volume: Math.abs(d.change24hPercent) * 10, // proxy
      strength: Math.min(100, Math.abs(d.change24hPercent) * 5 + 50),
      signal, rsi, volatility: vol,
    };
  });

  // ─── Category sentiments ──
  const categories: CategorySentiment[] = Object.entries(CATEGORY_ASSETS).map(([category, catAssets]) => {
    const catData = heatmap.filter(h => catAssets.includes(h.asset));
    if (catData.length === 0) {
      return { category, fearGreed: 50, fearGreedLabel: 'Neutre', color: 'text-amber-400', avgChange24h: 0, volatility: 0, breadthBullish: 33, breadthBearish: 33, breadthNeutral: 34, momentum: 0, trend: 'neutre', trendStrength: 0, keyLevel: '-' };
    }

    const changes = catData.map(d => d.change24h);
    const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
    const vols = catData.map(d => d.volatility);
    const avgVol = vols.reduce((a, b) => a + b, 0) / vols.length;

    const bullish = catData.filter(d => d.change24h > 0.3).length;
    const bearish = catData.filter(d => d.change24h < -0.3).length;
    const neutral = catData.length - bullish - bearish;
    const total = catData.length;

    const breadthBullish = Math.round((bullish / total) * 100);
    const breadthBearish = Math.round((bearish / total) * 100);
    const breadthNeutral = 100 - breadthBullish - breadthBearish;

    // Fear/Greed = 50 + (avgChange * factor) + (breadthBullish - 50)
    const volatilityFactor = Math.min(1, avgVol / 5); // more volatile = more extreme
    const fearGreedRaw = 50 + (avgChange * 8) + ((breadthBullish - 50) * 0.5);
    const fearGreed = Math.max(0, Math.min(100, fearGreedRaw));

    const { label, color } = getFearGreedLabel(fearGreed);

    let trend: CategorySentiment['trend'] = 'neutre';
    if (avgChange > 0.5 && avgVol < 2) trend = 'haussier';
    else if (avgChange < -0.5 && avgVol < 2) trend = 'baissier';
    else if (avgVol > 3) trend = 'volatile';

    const trendStrength = Math.min(100, Math.abs(avgChange) * 20 + breadthBullish);

    // Key level = prix moyen avec ajout
    const avgPrice = catData.reduce((a, d) => a + d.price, 0) / catData.length;
    const keyLevel = avgVol > 2
      ? `Volatile — range ±${avgVol.toFixed(1)}%`
      : avgChange > 0
        ? `Support ${(avgPrice * 0.995).toFixed(2)}`
        : `Résistance ${(avgPrice * 1.005).toFixed(2)}`;

    return {
      category, fearGreed: Math.round(fearGreed), fearGreedLabel: label, color,
      avgChange24h: avgChange, volatility: avgVol,
      breadthBullish, breadthBearish, breadthNeutral,
      momentum: Math.round(avgChange * 10),
      trend, trendStrength: Math.round(trendStrength),
      keyLevel,
    };
  });

  // ─── Global Fear & Greed ──
  const globalFG = categories.length > 0
    ? Math.round(categories.reduce((a, c) => a + c.fearGreed, 0) / categories.length)
    : 50;
  const { label: globalLabel, color: globalColor } = getFearGreedLabel(globalFG);

  // ─── VIX estimate ──
  const indicesVol = categories.find(c => c.category === 'Indices')?.volatility ?? 15;
  const vixEstimate = Math.min(100, Math.round(indicesVol * 5 + 10));

  // ─── Risk On / Risk Off ──
  const cryptoFG = categories.find(c => c.category === 'Crypto')?.fearGreed ?? 50;
  const forexFG = categories.find(c => c.category === 'Forex')?.fearGreed ?? 50;
  let riskOnRiskOff: MarketSentiment['riskOnRiskOff'] = 'neutral';
  if (cryptoFG > 65 && forexFG > 55) riskOnRiskOff = 'risk-on';
  else if (cryptoFG < 35 && forexFG < 45) riskOnRiskOff = 'risk-off';

  // ─── Safe Haven Flow ──
  const metalsFG = categories.find(c => c.category === 'Metaux')?.fearGreed ?? 50;
  let safeHavenFlow: MarketSentiment['safeHavenFlow'] = 'neutral';
  if (metalsFG > 60 && globalFG < 45) safeHavenFlow = 'inflow'; // or monte quand marché baisse
  else if (metalsFG < 45 && globalFG > 55) safeHavenFlow = 'outflow';

  // ─── Top gainers/losers/most volatile ──
  const sortedByChange = [...heatmap].sort((a, b) => b.change24h - a.change24h);
  const topGainers = sortedByChange.filter(d => d.change24h > 0).slice(0, 5);
  const topLosers = sortedByChange.filter(d => d.change24h < 0).slice(-5).reverse();
  const mostVolatile = [...heatmap].sort((a, b) => b.volatility - a.volatility).slice(0, 5);

  // ─── Correlations ──
  const correlations: CorrelationPair[] = [];
  const mainAssets = ['XAU/USD', 'BTC/USD', 'EUR/USD', 'NAS100', 'WTI'];
  for (let i = 0; i < mainAssets.length; i++) {
    for (let j = i + 1; j < mainAssets.length; j++) {
      const a = heatmap.find(h => h.asset === mainAssets[i]);
      const b = heatmap.find(h => h.asset === mainAssets[j]);
      if (a && b) {
        const corr = Math.sign(a.change24h) === Math.sign(b.change24h)
          ? Math.min(0.95, 0.5 + Math.abs(a.change24h - b.change24h) * 0.05)
          : Math.max(-0.95, -0.5 - Math.abs(a.change24h - b.change24h) * 0.05);
        correlations.push({
          assetA: mainAssets[i], assetB: mainAssets[j],
          correlation: Math.round(corr * 100) / 100,
          strength: Math.abs(corr) > 0.7 ? 'forte' : Math.abs(corr) > 0.3 ? 'moderee' : 'faible',
        });
      }
    }
  }

  return {
    timestamp: now,
    globalFearGreed: globalFG,
    globalLabel,
    globalColor,
    categories,
    heatmap,
    correlations,
    topGainers,
    topLosers,
    mostVolatile,
    vixEstimate,
    riskOnRiskOff,
    safeHavenFlow,
  };
}

// ─── Cached computation ─────────────────────────────────

let lastSentiment: MarketSentiment | null = null;
let lastPricesHash = '';

export function getCachedSentiment(prices: Record<string, PriceData>): MarketSentiment {
  const hash = Object.entries(prices).map(([k, v]) => `${k}:${v.price.toFixed(2)}`).join('|');
  if (lastSentiment && hash === lastPricesHash) return lastSentiment;

  lastPricesHash = hash;
  lastSentiment = calculateMarketSentiment(prices);
  return lastSentiment;
}
