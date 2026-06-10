/**
 * Demo Data Service
 * Fournit des données fixes et réalistes pour le mode démo.
 * Aucun appel API — tout est statique pour une expérience fluide.
 */

import type { PriceData, CandleData } from './marketApi';

const DEMO_KEY = 'xtrendai_demo_mode';
const DEMO_PACK_KEY = 'xtrendai_local_auth';

/**
 * isDemoMode — Détermine si l'utilisateur voit des données fixes (démo)
 * 
 * REGLES :
 * 1. SUPER ADMIN (role === 'admin') → toujours DONNEES LIVE, jamais démo
 * 2. Pack FREE non-admin → données fixes (Mode Démonstration)
 * 3. Pack PRO/EXPERT/INSTITUTIONNEL → données LIVE réelles
 * 4. Comptes de test free (id: *-free-*) → données fixes
 */
export function isDemoMode(): boolean {
  const userRaw = localStorage.getItem(DEMO_PACK_KEY);
  if (!userRaw) return false;
  try {
    const user = JSON.parse(userRaw);
    const pack = user.pack;
    const role = user.role;
    const userId = user.id || '';

    // RULE 1: Super Admin voit toujours les données LIVE
    if (role === 'admin') {
      return false;
    }

    // RULE 2: Pack FREE (non-admin) → Mode Démonstration
    if (pack === 'free' || pack === 'gratuit') {
      return true;
    }

    // RULE 3: Comptes de test Free uniquement
    if (userId.startsWith('demo-free-') || userId.startsWith('test-free-') || userId.startsWith('local-')) {
      return true;
    }

    // RULE 4: Pack PRO/EXPERT/INSTITUTIONNEL → données LIVE
    return false;
  } catch {
    return false;
  }
}

// ─── Fixed Prices (realistic but static) ─────────────────

export const DEMO_PRICES: Record<string, PriceData> = {
  'XAU/USD': {
    symbol: 'XAU/USD',
    price: 4482.77,
    change24h: 15.4,
    change24hPercent: 0.35,
    high24h: 4501.2,
    low24h: 4465.8,
    volume24h: 0,
    lastUpdate: Date.now(),
    source: 'Mode-Demo',
  },
  'BTC/USD': {
    symbol: 'BTC/USD',
    price: 63733.94,
    change24h: 1240.5,
    change24hPercent: 1.98,
    high24h: 64200.0,
    low24h: 62500.0,
    volume24h: 28500000000,
    lastUpdate: Date.now(),
    source: 'Mode-Demo',
  },
  'ETH/USD': {
    symbol: 'ETH/USD',
    price: 3487.22,
    change24h: 62.15,
    change24hPercent: 1.81,
    high24h: 3520.0,
    low24h: 3410.0,
    volume24h: 15200000000,
    lastUpdate: Date.now(),
    source: 'Mode-Demo',
  },
  'EUR/USD': {
    symbol: 'EUR/USD',
    price: 1.08456,
    change24h: 0.0023,
    change24hPercent: 0.21,
    high24h: 1.08620,
    low24h: 1.08150,
    volume24h: 0,
    lastUpdate: Date.now(),
    source: 'Mode-Demo',
  },
  'GBP/USD': {
    symbol: 'GBP/USD',
    price: 1.27432,
    change24h: -0.0051,
    change24hPercent: -0.40,
    high24h: 1.27980,
    low24h: 1.27100,
    volume24h: 0,
    lastUpdate: Date.now(),
    source: 'Mode-Demo',
  },
  'USD/JPY': {
    symbol: 'USD/JPY',
    price: 151.842,
    change24h: 0.235,
    change24hPercent: 0.16,
    high24h: 152.100,
    low24h: 151.450,
    volume24h: 0,
    lastUpdate: Date.now(),
    source: 'Mode-Demo',
  },
  // ─── Crypto supplémentaires ────────────────────────────
  'SOL/USD': {
    symbol: 'SOL/USD',
    price: 142.35,
    change24h: 3.12,
    change24hPercent: 2.24,
    high24h: 145.80,
    low24h: 138.50,
    volume24h: 3200000000,
    lastUpdate: Date.now(),
    source: 'Mode-Demo',
  },
  'XRP/USD': {
    symbol: 'XRP/USD',
    price: 0.5234,
    change24h: 0.0082,
    change24hPercent: 1.59,
    high24h: 0.5310,
    low24h: 0.5120,
    volume24h: 1200000000,
    lastUpdate: Date.now(),
    source: 'Mode-Demo',
  },
  'BNB/USD': {
    symbol: 'BNB/USD',
    price: 594.20,
    change24h: 8.45,
    change24hPercent: 1.44,
    high24h: 601.00,
    low24h: 583.50,
    volume24h: 1800000000,
    lastUpdate: Date.now(),
    source: 'Mode-Demo',
  },
  'ADA/USD': {
    symbol: 'ADA/USD',
    price: 0.3845,
    change24h: 0.0067,
    change24hPercent: 1.77,
    high24h: 0.3910,
    low24h: 0.3760,
    volume24h: 450000000,
    lastUpdate: Date.now(),
    source: 'Mode-Demo',
  },
  'DOGE/USD': {
    symbol: 'DOGE/USD',
    price: 0.1023,
    change24h: 0.0021,
    change24hPercent: 2.10,
    high24h: 0.1045,
    low24h: 0.0998,
    volume24h: 890000000,
    lastUpdate: Date.now(),
    source: 'Mode-Demo',
  },
  'AVAX/USD': {
    symbol: 'AVAX/USD',
    price: 28.45,
    change24h: 0.82,
    change24hPercent: 2.97,
    high24h: 29.10,
    low24h: 27.50,
    volume24h: 380000000,
    lastUpdate: Date.now(),
    source: 'Mode-Demo',
  },
  // ─── Forex supplémentaires ─────────────────────────────
  'USD/CHF': {
    symbol: 'USD/CHF',
    price: 0.90123,
    change24h: 0.00045,
    change24hPercent: 0.05,
    high24h: 0.90300,
    low24h: 0.89900,
    volume24h: 0,
    lastUpdate: Date.now(),
    source: 'Mode-Demo',
  },
  'USD/CAD': {
    symbol: 'USD/CAD',
    price: 1.36450,
    change24h: 0.00180,
    change24hPercent: 0.13,
    high24h: 1.36600,
    low24h: 1.36200,
    volume24h: 0,
    lastUpdate: Date.now(),
    source: 'Mode-Demo',
  },
  'AUD/USD': {
    symbol: 'AUD/USD',
    price: 0.65670,
    change24h: -0.00120,
    change24hPercent: -0.18,
    high24h: 0.65850,
    low24h: 0.65480,
    volume24h: 0,
    lastUpdate: Date.now(),
    source: 'Mode-Demo',
  },
  // ─── Métaux ────────────────────────────────────────────
  'XAG/USD': {
    symbol: 'XAG/USD',
    price: 22.845,
    change24h: 0.125,
    change24hPercent: 0.55,
    high24h: 23.020,
    low24h: 22.650,
    volume24h: 0,
    lastUpdate: Date.now(),
    source: 'Mode-Demo',
  },
  // ─── INDICES ──────────────────────────────────────────
  'NAS100': { symbol: 'NAS100', price: 19847.35, change24h: 125.40, change24hPercent: 0.64, high24h: 19950.00, low24h: 19720.00, volume24h: 5800000000, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'SPX500': { symbol: 'SPX500', price: 6051.35, change24h: 32.80, change24hPercent: 0.54, high24h: 6075.00, low24h: 6018.00, volume24h: 3200000000, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'US30': { symbol: 'US30', price: 45052.18, change24h: 285.60, change24hPercent: 0.64, high24h: 45180.00, low24h: 44765.00, volume24h: 280000000, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'DE40': { symbol: 'DE40', price: 24405.60, change24h: 182.30, change24hPercent: 0.75, high24h: 24520.00, low24h: 24223.00, volume24h: 85000000, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'FR40': { symbol: 'FR40', price: 7985.20, change24h: 52.80, change24hPercent: 0.67, high24h: 8020.00, low24h: 7932.00, volume24h: 72000000, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'UK100': { symbol: 'UK100', price: 8605.40, change24h: 38.20, change24hPercent: 0.45, high24h: 8640.00, low24h: 8567.00, volume24h: 950000000, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'JP225': { symbol: 'JP225', price: 40580.20, change24h: -125.60, change24hPercent: -0.31, high24h: 40710.00, low24h: 40450.00, volume24h: 120000000, lastUpdate: Date.now(), source: 'Mode-Demo' },
  // ─── ACTIONS US ───────────────────────────────────────
  'AAPL': { symbol: 'AAPL', price: 239.20, change24h: 3.45, change24hPercent: 1.46, high24h: 241.80, low24h: 236.50, volume24h: 48500000, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'TSLA': { symbol: 'TSLA', price: 342.85, change24h: 8.20, change24hPercent: 2.45, high24h: 348.00, low24h: 335.50, volume24h: 98500000, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'NVDA': { symbol: 'NVDA', price: 148.20, change24h: 2.85, change24hPercent: 1.96, high24h: 150.50, low24h: 145.80, volume24h: 278000000, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'MSFT': { symbol: 'MSFT', price: 442.60, change24h: 1.95, change24hPercent: 0.44, high24h: 445.20, low24h: 440.50, volume24h: 18500000, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'AMZN': { symbol: 'AMZN', price: 228.45, change24h: 2.30, change24hPercent: 1.02, high24h: 230.80, low24h: 226.20, volume24h: 42500000, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'META': { symbol: 'META', price: 615.80, change24h: 5.60, change24hPercent: 0.92, high24h: 622.00, low24h: 610.20, volume24h: 15200000, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'GOOGL': { symbol: 'GOOGL', price: 186.25, change24h: 1.80, change24hPercent: 0.98, high24h: 188.40, low24h: 184.60, volume24h: 22500000, lastUpdate: Date.now(), source: 'Mode-Demo' },
  // ─── ENERGIES ─────────────────────────────────────────
  'WTI': { symbol: 'WTI', price: 68.45, change24h: -0.82, change24hPercent: -1.18, high24h: 69.50, low24h: 67.90, volume24h: 1250000, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'BRENT': { symbol: 'BRENT', price: 72.30, change24h: -0.95, change24hPercent: -1.30, high24h: 73.40, low24h: 71.80, volume24h: 980000, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'NATGAS': { symbol: 'NATGAS', price: 3.245, change24h: 0.085, change24hPercent: 2.69, high24h: 3.320, low24h: 3.150, volume24h: 450000, lastUpdate: Date.now(), source: 'Mode-Demo' },
  // ─── VOLATILITE ───────────────────────────────────────
  'DXY': { symbol: 'DXY', price: 106.125, change24h: 0.235, change24hPercent: 0.22, high24h: 106.450, low24h: 105.820, volume24h: 0, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'VIX': { symbol: 'VIX', price: 14.25, change24h: -0.85, change24hPercent: -5.63, high24h: 15.20, low24h: 13.80, volume24h: 0, lastUpdate: Date.now(), source: 'Mode-Demo' },
  // ─── COMMODITIES ──────────────────────────────────────
  'COPPER': { symbol: 'COPPER', price: 4.2845, change24h: 0.045, change24hPercent: 1.06, high24h: 4.3150, low24h: 4.2380, volume24h: 0, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'WHEAT': { symbol: 'WHEAT', price: 542.50, change24h: 8.25, change24hPercent: 1.55, high24h: 548.00, low24h: 534.00, volume24h: 0, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'CORN': { symbol: 'CORN', price: 412.75, change24h: 3.50, change24hPercent: 0.86, high24h: 418.00, low24h: 408.50, volume24h: 0, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'COTTON': { symbol: 'COTTON', price: 0.7250, change24h: 0.0085, change24hPercent: 1.19, high24h: 0.7320, low24h: 0.7160, volume24h: 0, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'SUGAR': { symbol: 'SUGAR', price: 0.1845, change24h: 0.0025, change24hPercent: 1.37, high24h: 0.1870, low24h: 0.1815, volume24h: 0, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'COFFEE': { symbol: 'COFFEE', price: 1.8450, change24h: 0.025, change24hPercent: 1.37, high24h: 1.8720, low24h: 1.8180, volume24h: 0, lastUpdate: Date.now(), source: 'Mode-Demo' },
  // ─── OBLIGATIONS ──────────────────────────────────────
  'US10Y': { symbol: 'US10Y', price: 4.285, change24h: -0.035, change24hPercent: -0.81, high24h: 4.340, low24h: 4.250, volume24h: 0, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'US2Y': { symbol: 'US2Y', price: 4.105, change24h: -0.025, change24hPercent: -0.60, high24h: 4.150, low24h: 4.080, volume24h: 0, lastUpdate: Date.now(), source: 'Mode-Demo' },
  // ─── FOREX MINEURES MANQUANTES ────────────────────────
  'GBP/CHF': { symbol: 'GBP/CHF', price: 1.14850, change24h: 0.00230, change24hPercent: 0.20, high24h: 1.15120, low24h: 1.14580, volume24h: 0, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'GBP/CAD': { symbol: 'GBP/CAD', price: 1.74020, change24h: 0.00560, change24hPercent: 0.32, high24h: 1.74500, low24h: 1.73450, volume24h: 0, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'GBP/AUD': { symbol: 'GBP/AUD', price: 1.94150, change24h: -0.00820, change24hPercent: -0.42, high24h: 1.95000, low24h: 1.93500, volume24h: 0, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'AUD/CAD': { symbol: 'AUD/CAD', price: 0.89630, change24h: 0.00150, change24hPercent: 0.17, high24h: 0.89900, low24h: 0.89400, volume24h: 0, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'AUD/CHF': { symbol: 'AUD/CHF', price: 0.59120, change24h: -0.00080, change24hPercent: -0.14, high24h: 0.59350, low24h: 0.58900, volume24h: 0, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'NZD/JPY': { symbol: 'NZD/JPY', price: 90.350, change24h: 0.120, change24hPercent: 0.13, high24h: 90.820, low24h: 89.950, volume24h: 0, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'CAD/CHF': { symbol: 'CAD/CHF', price: 0.65980, change24h: -0.00040, change24hPercent: -0.06, high24h: 0.66200, low24h: 0.65750, volume24h: 0, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'CHF/JPY': { symbol: 'CHF/JPY', price: 168.520, change24h: 0.185, change24hPercent: 0.11, high24h: 168.950, low24h: 168.050, volume24h: 0, lastUpdate: Date.now(), source: 'Mode-Demo' },
  // ─── FOREX EXOTIQUES MANQUANTES ───────────────────────
  'USD/NOK': { symbol: 'USD/NOK', price: 10.8240, change24h: 0.0150, change24hPercent: 0.14, high24h: 10.8750, low24h: 10.8050, volume24h: 0, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'USD/SGD': { symbol: 'USD/SGD', price: 1.34560, change24h: 0.00180, change24hPercent: 0.13, high24h: 1.34800, low24h: 1.34350, volume24h: 0, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'USD/HKD': { symbol: 'USD/HKD', price: 7.81250, change24h: 0.00050, change24hPercent: 0.01, high24h: 7.81500, low24h: 7.81000, volume24h: 0, lastUpdate: Date.now(), source: 'Mode-Demo' },
  // ─── METAUX MANQUANTS ─────────────────────────────────
  'XPT/USD': { symbol: 'XPT/USD', price: 945.20, change24h: -8.50, change24hPercent: -0.89, high24h: 958.00, low24h: 938.50, volume24h: 0, lastUpdate: Date.now(), source: 'Mode-Demo' },
  'XPD/USD': { symbol: 'XPD/USD', price: 985.80, change24h: -12.30, change24hPercent: -1.23, high24h: 1002.00, low24h: 975.00, volume24h: 0, lastUpdate: Date.now(), source: 'Mode-Demo' },
  // ─── INDICE MANQUANT ──────────────────────────────────
  'AU200': { symbol: 'AU200', price: 8452.30, change24h: 45.60, change24hPercent: 0.54, high24h: 8498.00, low24h: 8405.00, volume24h: 45000000, lastUpdate: Date.now(), source: 'Mode-Demo' },
};

// ─── Fixed Candles (pre-generated realistic data) ────────

function generateFixedCandles(basePrice: number, count: number, decimals: number, volatility: number = 0.002): CandleData[] {
  const candles: CandleData[] = [];
  let price = basePrice;
  const now = Date.now();
  const hourMs = 3600000;

  // Use fixed seed for reproducibility
  const seedRandom = (i: number) => {
    const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  };

  for (let i = count; i >= 0; i--) {
    const change = (seedRandom(i) - 0.48) * price * volatility;
    const open = price;
    price += change;
    const high = Math.max(open, price) + seedRandom(i + 100) * price * volatility * 0.5;
    const low = Math.min(open, price) - seedRandom(i + 200) * price * volatility * 0.5;

    candles.push({
      time: now - i * hourMs,
      open: Number(open.toFixed(decimals)),
      high: Number(high.toFixed(decimals)),
      low: Number(low.toFixed(decimals)),
      close: Number(price.toFixed(decimals)),
      volume: Math.floor(seedRandom(i + 300) * 10000 + 2000),
    });
  }
  return candles;
}

export const DEMO_CANDLES: Record<string, CandleData[]> = {
  'XAU/USD': generateFixedCandles(4482.77, 60, 2, 0.0015),
  'XAG/USD': generateFixedCandles(22.845, 60, 2, 0.002),
  'BTC/USD': generateFixedCandles(63733.94, 60, 2, 0.004),
  'ETH/USD': generateFixedCandles(3487.22, 60, 2, 0.0035),
  'SOL/USD': generateFixedCandles(142.35, 60, 2, 0.005),
  'XRP/USD': generateFixedCandles(0.5234, 60, 4, 0.006),
  'BNB/USD': generateFixedCandles(594.20, 60, 2, 0.003),
  'ADA/USD': generateFixedCandles(0.3845, 60, 4, 0.007),
  'DOGE/USD': generateFixedCandles(0.1023, 60, 5, 0.008),
  'AVAX/USD': generateFixedCandles(28.45, 60, 2, 0.006),
  'EUR/USD': generateFixedCandles(1.08456, 60, 5, 0.0008),
  'GBP/USD': generateFixedCandles(1.27432, 60, 5, 0.001),
  'USD/JPY': generateFixedCandles(151.842, 60, 3, 0.001),
  'USD/CHF': generateFixedCandles(0.90123, 60, 5, 0.001),
  'USD/CAD': generateFixedCandles(1.36450, 60, 5, 0.001),
  'AUD/USD': generateFixedCandles(0.65670, 60, 5, 0.0012),
  // ─── INDICES ──────────────────────────────────────────
  'NAS100': generateFixedCandles(19847.35, 60, 1, 0.008),
  'SPX500': generateFixedCandles(6051.35, 60, 1, 0.006),
  'US30': generateFixedCandles(45052.18, 60, 1, 0.007),
  'DE40': generateFixedCandles(24405.60, 60, 1, 0.009),
  'FR40': generateFixedCandles(7985.20, 60, 1, 0.009),
  'UK100': generateFixedCandles(8605.40, 60, 1, 0.007),
  'JP225': generateFixedCandles(40580.20, 60, 1, 0.012),
  // ─── ACTIONS ──────────────────────────────────────────
  'AAPL': generateFixedCandles(239.20, 60, 2, 0.015),
  'TSLA': generateFixedCandles(342.85, 60, 2, 0.025),
  'NVDA': generateFixedCandles(148.20, 60, 2, 0.020),
  'MSFT': generateFixedCandles(442.60, 60, 2, 0.012),
  'AMZN': generateFixedCandles(228.45, 60, 2, 0.016),
  'META': generateFixedCandles(615.80, 60, 2, 0.018),
  'GOOGL': generateFixedCandles(186.25, 60, 2, 0.015),
  // ─── ENERGIES ─────────────────────────────────────────
  'WTI': generateFixedCandles(68.45, 60, 2, 0.018),
  'BRENT': generateFixedCandles(72.30, 60, 2, 0.017),
  'NATGAS': generateFixedCandles(3.245, 60, 3, 0.025),
  // ─── VOLATILITE ───────────────────────────────────────
  'DXY': generateFixedCandles(106.125, 60, 3, 0.004),
  'VIX': generateFixedCandles(14.25, 60, 2, 0.035),
  // ─── COMMODITIES ──────────────────────────────────────
  'COPPER': generateFixedCandles(4.2845, 60, 4, 0.012),
  'WHEAT': generateFixedCandles(542.50, 60, 2, 0.015),
  'CORN': generateFixedCandles(412.75, 60, 2, 0.014),
  'COTTON': generateFixedCandles(0.7250, 60, 4, 0.018),
  'SUGAR': generateFixedCandles(0.1845, 60, 4, 0.020),
  'COFFEE': generateFixedCandles(1.8450, 60, 4, 0.022),
  // ─── OBLIGATIONS ──────────────────────────────────────
  'US10Y': generateFixedCandles(4.285, 60, 3, 0.008),
  'US2Y': generateFixedCandles(4.105, 60, 3, 0.007),
  // ─── FOREX MINEURES MANQUANTES ────────────────────────
  'GBP/CHF': generateFixedCandles(1.14850, 60, 5, 0.001),
  'GBP/CAD': generateFixedCandles(1.74020, 60, 5, 0.001),
  'GBP/AUD': generateFixedCandles(1.94150, 60, 5, 0.0012),
  'AUD/CAD': generateFixedCandles(0.89630, 60, 5, 0.001),
  'AUD/CHF': generateFixedCandles(0.59120, 60, 5, 0.001),
  'NZD/JPY': generateFixedCandles(90.350, 60, 3, 0.001),
  'CAD/CHF': generateFixedCandles(0.65980, 60, 5, 0.001),
  'CHF/JPY': generateFixedCandles(168.520, 60, 3, 0.001),
  // ─── FOREX EXOTIQUES MANQUANTES ───────────────────────
  'USD/NOK': generateFixedCandles(10.8240, 60, 5, 0.001),
  'USD/SGD': generateFixedCandles(1.34560, 60, 5, 0.0008),
  'USD/HKD': generateFixedCandles(7.81250, 60, 5, 0.0003),
  // ─── METAUX MANQUANTS ─────────────────────────────────
  'XPT/USD': generateFixedCandles(945.20, 60, 2, 0.012),
  'XPD/USD': generateFixedCandles(985.80, 60, 2, 0.015),
  // ─── INDICE MANQUANT ──────────────────────────────────
  'AU200': generateFixedCandles(8452.30, 60, 1, 0.007),
};

// ─── Fixed AI Signals ────────────────────────────────────

export interface DemoSignal {
  id: string;
  asset: string;
  signal: 'ACHAT' | 'VENTE' | 'ATTENTE';
  confidence: number;
  entryPoint: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskRewardRatio: string;
  riskLevel: 'Faible' | 'Modéré' | 'Élevé';
  timeframe: string;
  timestamp: Date;
  aiScore: number;
  marketSentiment: 'Bullish' | 'Bearish' | 'Neutral';
  volatility: number;
  explanations: { indicator: string; value: string; interpretation: string }[];
}

export const DEMO_SIGNALS: DemoSignal[] = [
  {
    id: 'demo-sig-001',
    asset: 'XAU/USD',
    signal: 'ACHAT',
    confidence: 94,
    entryPoint: 4482.77,
    stopLoss: 4455.00,
    takeProfit1: 4510.00,
    takeProfit2: 4535.00,
    takeProfit3: 4560.00,
    riskRewardRatio: '1:2.8',
    riskLevel: 'Faible',
    timeframe: 'H1',
    timestamp: new Date(),
    aiScore: 94,
    marketSentiment: 'Bullish',
    volatility: 42,
    explanations: [
      { indicator: 'RSI (14)', value: '38.2', interpretation: 'RSI en zone de survente favorable' },
      { indicator: 'MACD', value: 'Croisement haussier', interpretation: 'Momentum haussier en cours' },
      { indicator: 'Prix vs EMA 20', value: 'Au-dessus', interpretation: 'Tendance courte terme haussiere' },
      { indicator: 'Support/Resistance', value: '4450.00 / 4520.00', interpretation: 'Rebond sur support majeur' },
    ],
  },
  {
    id: 'demo-sig-002',
    asset: 'BTC/USD',
    signal: 'ACHAT',
    confidence: 87,
    entryPoint: 63733.94,
    stopLoss: 62100.00,
    takeProfit1: 65500.00,
    takeProfit2: 67200.00,
    takeProfit3: 69000.00,
    riskRewardRatio: '1:3.4',
    riskLevel: 'Modéré',
    timeframe: 'H4',
    timestamp: new Date(Date.now() - 3600000),
    aiScore: 87,
    marketSentiment: 'Bullish',
    volatility: 68,
    explanations: [
      { indicator: 'RSI (14)', value: '55.8', interpretation: 'RSI neutre favorable' },
      { indicator: 'MACD', value: 'Croisement haussier', interpretation: 'Momentum positif' },
      { indicator: 'EMA 50', value: '62,800', interpretation: 'Prix au-dessus EMA 50' },
    ],
  },
  {
    id: 'demo-sig-003',
    asset: 'EUR/USD',
    signal: 'VENTE',
    confidence: 72,
    entryPoint: 1.08456,
    stopLoss: 1.08900,
    takeProfit1: 1.08000,
    takeProfit2: 1.07750,
    takeProfit3: 1.07500,
    riskRewardRatio: '1:2.1',
    riskLevel: 'Modéré',
    timeframe: 'H1',
    timestamp: new Date(Date.now() - 7200000),
    aiScore: 72,
    marketSentiment: 'Bearish',
    volatility: 25,
    explanations: [
      { indicator: 'RSI (14)', value: '62.4', interpretation: 'RSI proche surachat' },
      { indicator: 'MACD', value: 'Croisement baissier', interpretation: 'Momentum baissier' },
    ],
  },
  {
    id: 'demo-sig-004',
    asset: 'ETH/USD',
    signal: 'ATTENTE',
    confidence: 45,
    entryPoint: 3487.22,
    stopLoss: 3400.00,
    takeProfit1: 3580.00,
    takeProfit2: 3650.00,
    takeProfit3: 3720.00,
    riskRewardRatio: '1:2.9',
    riskLevel: 'Élevé',
    timeframe: 'H1',
    timestamp: new Date(Date.now() - 1800000),
    aiScore: 45,
    marketSentiment: 'Neutral',
    volatility: 55,
    explanations: [
      { indicator: 'RSI (14)', value: '50.1', interpretation: 'RSI neutre' },
      { indicator: 'MACD', value: 'Sans direction claire', interpretation: 'Attente de signal' },
    ],
  },
  {
    id: 'demo-sig-005',
    asset: 'GBP/USD',
    signal: 'ACHAT',
    confidence: 78,
    entryPoint: 1.27432,
    stopLoss: 1.26800,
    takeProfit1: 1.28200,
    takeProfit2: 1.28800,
    takeProfit3: 1.29500,
    riskRewardRatio: '1:3.4',
    riskLevel: 'Faible',
    timeframe: 'D1',
    timestamp: new Date(Date.now() - 14400000),
    aiScore: 78,
    marketSentiment: 'Bullish',
    volatility: 32,
    explanations: [
      { indicator: 'RSI (14)', value: '42.5', interpretation: 'Zone favorable' },
      { indicator: 'Support', value: '1.2700', interpretation: 'Support majeur teste 3 fois' },
    ],
  },
  {
    id: 'demo-sig-006',
    asset: 'USD/JPY',
    signal: 'VENTE',
    confidence: 81,
    entryPoint: 151.842,
    stopLoss: 152.350,
    takeProfit1: 151.200,
    takeProfit2: 150.800,
    takeProfit3: 150.350,
    riskRewardRatio: '1:2.6',
    riskLevel: 'Faible',
    timeframe: 'H4',
    timestamp: new Date(Date.now() - 5400000),
    aiScore: 81,
    marketSentiment: 'Bearish',
    volatility: 28,
    explanations: [
      { indicator: 'RSI (14)', value: '68.7', interpretation: 'Zone de surachat' },
      { indicator: 'Resistance', value: '152.10', interpretation: 'Proche resistance' },
    ],
  },
];

// ─── Fixed Market Overview ───────────────────────────────

export const DEMO_MARKET_OVERVIEW = [
  { asset: 'XAU/USD', price: 4482.77, change: 15.4, changePercent: 0.35, trend: 'HAUSSIERE' as const, volatility: 42, marketStrength: 94, sentiment: 'Bullish', aiScore: 94 },
  { asset: 'BTC/USD', price: 63733.94, change: 1240.5, changePercent: 1.98, trend: 'HAUSSIERE' as const, volatility: 68, marketStrength: 87, sentiment: 'Bullish', aiScore: 87 },
  { asset: 'ETH/USD', price: 3487.22, change: 62.15, changePercent: 1.81, trend: 'HAUSSIERE' as const, volatility: 55, marketStrength: 45, sentiment: 'Neutral', aiScore: 45 },
  { asset: 'EUR/USD', price: 1.08456, change: 0.0023, changePercent: 0.21, trend: 'HAUSSIERE' as const, volatility: 25, marketStrength: 72, sentiment: 'Bearish', aiScore: 72 },
  { asset: 'GBP/USD', price: 1.27432, change: -0.0051, changePercent: -0.40, trend: 'BAISSIERE' as const, volatility: 32, marketStrength: 78, sentiment: 'Bullish', aiScore: 78 },
  { asset: 'USD/JPY', price: 151.842, change: 0.235, changePercent: 0.16, trend: 'HAUSSIERE' as const, volatility: 28, marketStrength: 81, sentiment: 'Bearish', aiScore: 81 },
];

// ─── Fixed AI Insights ───────────────────────────────────

export const DEMO_AI_INSIGHTS = [
  { type: 'technical' as const, title: 'XAU/USD — ACHAT (94%)', description: 'RSI en survente a 38.2, rebond sur support 4450. Croisement MACD haussier detecte.', confidence: 94, timestamp: new Date() },
  { type: 'fundamental' as const, title: 'BTC/USD — ACHAT (87%)', description: 'Momentum haussier confirme. Prix au-dessus EMA 50. Volume en augmentation.', confidence: 87, timestamp: new Date(Date.now() - 3600000) },
  { type: 'sentiment' as const, title: 'EUR/USD — VENTE (72%)', description: 'Dollar index en hausse. Attente annonce Fed. RSI proche zone surachat.', confidence: 72, timestamp: new Date(Date.now() - 7200000) },
];

// ─── Fixed Calendar Events ───────────────────────────────

export const DEMO_CALENDAR_EVENTS = [
  { id: 'evt-1', time: new Date(Date.now() + 3600000), currency: 'USD', event: 'Discours Powell (Fed)', impact: 'High' as const, forecast: 'Neutre', previous: '0.25%' },
  { id: 'evt-2', time: new Date(Date.now() + 7200000), currency: 'EUR', event: 'IPC Zone Euro', impact: 'High' as const, forecast: '2.1%', previous: '2.0%' },
  { id: 'evt-3', time: new Date(Date.now() + 10800000), currency: 'USD', event: 'Chômage hebdo', impact: 'Medium' as const, forecast: '215K', previous: '218K' },
  { id: 'evt-4', time: new Date(Date.now() + 18000000), currency: 'GBP', event: 'Décision taux BOE', impact: 'High' as const, forecast: '5.25%', previous: '5.25%' },
  { id: 'evt-5', time: new Date(Date.now() + 86400000), currency: 'USD', event: 'NFP (Non Farm Payrolls)', impact: 'High' as const, forecast: '185K', previous: '175K' },
  { id: 'evt-6', time: new Date(Date.now() + 172800000), currency: 'ALL', event: 'Rafraîchissement Signaux IA', impact: 'Low' as const, forecast: 'Tous actifs', previous: '6 signaux' },
];

// ─── Fixed Smart Money Levels ────────────────────────────

export const DEMO_SMART_MONEY_LEVELS = [
  { concept: 'Order Blocks', price: 4455.20, type: 'Bullish OB', detected: true, description: 'Zone ou les institutions ont accumule des positions majeures', icon: '' },
  { concept: 'Breaker Blocks', price: 4520.80, type: 'Bearish BB', detected: true, description: 'Ancien support devenu resistance', icon: '' },
  { concept: 'Fair Value Gaps', price: 4478.50, type: 'FVG', detected: true, description: 'Vides de prix crees par un mouvement impulsif', icon: '' },
  { concept: 'Liquidity Pools', price: 4440.00, type: 'Double Pool', detected: true, description: 'Zones stops concentres: 4440.00 / 4501.20', icon: '' },
  { concept: 'BOS / CHOCH', price: 4495.00, type: 'BOS Haussier', detected: true, description: 'Break of Structure detecte', icon: '' },
  { concept: 'Stop Hunts', price: 4440.00, type: 'Liquidity Grab', detected: false, description: 'Aucun mouvement artificiel detecte', icon: '' },
  { concept: 'Premium / Discount', price: 4482.77, type: 'Zone Equilibre', detected: true, description: 'Equilibre: 4480.00 — Prix au-dessus de l\'equilibre', icon: '' },
  { concept: 'Imbalances', price: 4470.00, type: 'Scan', detected: false, description: 'Scan en cours', icon: '' },
];

// ─── Fixed Technical Indicators ──────────────────────────

export const DEMO_TECH_INDICATORS = [
  { name: 'RSI (14)', value: '38.2', signal: 'Survente favorable', status: 'bullish' as const },
  { name: 'MACD', value: 'Haussier', signal: 'Croisement haussier', status: 'bullish' as const },
  { name: 'EMA 20', value: '4475.40', signal: 'Support dynamique', status: 'bullish' as const },
  { name: 'EMA 50', value: '4458.20', signal: 'Tendance haussiere', status: 'bullish' as const },
  { name: 'Prix Actuel', value: '4482.77', signal: 'vs EMA20: +0.16%', status: 'neutral' as const },
  { name: 'Volatilite', value: '0.15%', signal: 'ATR (14 periodes)', status: 'neutral' as const },
];

// ─── Fixed History ───────────────────────────────────────

export const DEMO_HISTORY = [
  { id: 'h-001', asset: 'XAU/USD', signal: 'ACHAT' as const, entryPrice: 4455.20, exitPrice: 4510.50, result: 'Gagnant' as const, profit: 552.80, timestamp: new Date(Date.now() - 86400000), timeFrame: 'H1' },
  { id: 'h-002', asset: 'BTC/USD', signal: 'ACHAT' as const, entryPrice: 62100.00, exitPrice: 63800.00, result: 'Gagnant' as const, profit: 1700.00, timestamp: new Date(Date.now() - 172800000), timeFrame: 'H4' },
  { id: 'h-003', asset: 'EUR/USD', signal: 'VENTE' as const, entryPrice: 1.08950, exitPrice: 1.08200, result: 'Gagnant' as const, profit: 75.00, timestamp: new Date(Date.now() - 259200000), timeFrame: 'H1' },
  { id: 'h-004', asset: 'ETH/USD', signal: 'ACHAT' as const, entryPrice: 3520.00, exitPrice: 3480.00, result: 'Perdant' as const, profit: -40.00, timestamp: new Date(Date.now() - 345600000), timeFrame: 'H1' },
  { id: 'h-005', asset: 'GBP/USD', signal: 'ACHAT' as const, entryPrice: 1.26500, exitPrice: 1.27800, result: 'Gagnant' as const, profit: 130.00, timestamp: new Date(Date.now() - 432000000), timeFrame: 'D1' },
  { id: 'h-006', asset: 'XAU/USD', signal: 'VENTE' as const, entryPrice: 4520.00, exitPrice: 4465.00, result: 'Gagnant' as const, profit: 550.00, timestamp: new Date(Date.now() - 518400000), timeFrame: 'H4' },
];

// ─── Fixed Opportunities ─────────────────────────────────

export const DEMO_OPPORTUNITIES = [
  { id: 'opp-001', asset: 'XAU/USD', signal: 'ACHAT' as const, strength: 'exceptionnelle' as const, score: 94, timeframe: 'H1', reason: 'Confluence Smart Money + Order Block + Divergence RSI', entry: 4482.77, sl: 4455.00, tp: 4560.00 },
  { id: 'opp-002', asset: 'BTC/USD', signal: 'ACHAT' as const, strength: 'forte' as const, score: 87, timeframe: 'H4', reason: 'Breakout volume + EMA croisement haussier', entry: 63733.94, sl: 62100.00, tp: 69000.00 },
  { id: 'opp-003', asset: 'GBP/USD', signal: 'ACHAT' as const, strength: 'forte' as const, score: 78, timeframe: 'D1', reason: 'Rebond support majeur + FVG haussier', entry: 1.27432, sl: 1.26800, tp: 1.29500 },
  { id: 'opp-004', asset: 'USD/JPY', signal: 'VENTE' as const, strength: 'moyenne' as const, score: 81, timeframe: 'H4', reason: 'Zone premium + divergence RSI', entry: 151.842, sl: 152.350, tp: 150.350 },
  { id: 'opp-005', asset: 'EUR/USD', signal: 'VENTE' as const, strength: 'moyenne' as const, score: 72, timeframe: 'H1', reason: 'Approche resistance + MACD baissier', entry: 1.08456, sl: 1.08900, tp: 1.07500 },
];
