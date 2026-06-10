/**
 * Asset Catalog — Catalogue global d'actifs de la plateforme
 * Organisé par catégories avec priorités pour affichage intelligent
 * Utilisé par : Dashboard, Analyse Technique, Signaux, Centre Décision, Watchlist
 */

export type AssetCategory =
  | 'forex_major' | 'forex_minor' | 'forex_exotic'
  | 'metals' | 'crypto' | 'indices'
  | 'stocks_us' | 'stocks_eu' | 'commodities' | 'energy'
  | 'bonds' | 'volatility';

export type MarketType = 'forex' | 'metals' | 'crypto' | 'indices' | 'stocks' | 'commodities' | 'energy' | 'bonds';

export interface AssetDef {
  symbol: string;       // EUR/USD, BTC/USD, etc.
  name: string;         // Euro / Dollar US
  category: AssetCategory;
  market: MarketType;
  priority: 1 | 2 | 3;  // 1 = prioritaire, 2 = important, 3 = complémentaire
  pipSize: number;      // Taille d'un pip/point
  decimals: number;     // Nombre de décimales d'affichage
  tradingHours: string;
  spreadAvg: number;    // Spread moyen en pips/points
  volatility: 'low' | 'medium' | 'high' | 'very_high';
  icon?: string;
}

// ════════════════════════════════════════════════════════
//  CATALOGUE COMPLET
// ════════════════════════════════════════════════════════

export const ASSET_CATALOG: AssetDef[] = [
  // ─── FOREX MAJEURES (Priorité 1) ──────────────────────
  { symbol: 'EUR/USD', name: 'Euro / Dollar US', category: 'forex_major', market: 'forex', priority: 1, pipSize: 0.0001, decimals: 5, tradingHours: '24h (dim 22h - ven 22h)', spreadAvg: 0.6, volatility: 'medium' },
  { symbol: 'GBP/USD', name: 'Livre / Dollar US', category: 'forex_major', market: 'forex', priority: 1, pipSize: 0.0001, decimals: 5, tradingHours: '24h (dim 22h - ven 22h)', spreadAvg: 0.9, volatility: 'medium' },
  { symbol: 'USD/JPY', name: 'Dollar US / Yen', category: 'forex_major', market: 'forex', priority: 1, pipSize: 0.01, decimals: 3, tradingHours: '24h (dim 22h - ven 22h)', spreadAvg: 0.7, volatility: 'medium' },
  { symbol: 'USD/CHF', name: 'Dollar US / Franc Suisse', category: 'forex_major', market: 'forex', priority: 2, pipSize: 0.0001, decimals: 5, tradingHours: '24h (dim 22h - ven 22h)', spreadAvg: 1.0, volatility: 'medium' },
  { symbol: 'USD/CAD', name: 'Dollar US / Dollar Canadien', category: 'forex_major', market: 'forex', priority: 2, pipSize: 0.0001, decimals: 5, tradingHours: '24h (dim 22h - ven 22h)', spreadAvg: 1.2, volatility: 'medium' },
  { symbol: 'AUD/USD', name: 'Dollar Australien / Dollar US', category: 'forex_major', market: 'forex', priority: 2, pipSize: 0.0001, decimals: 5, tradingHours: '24h (dim 22h - ven 22h)', spreadAvg: 0.9, volatility: 'medium' },
  { symbol: 'NZD/USD', name: 'Dollar NZ / Dollar US', category: 'forex_major', market: 'forex', priority: 2, pipSize: 0.0001, decimals: 5, tradingHours: '24h (dim 22h - ven 22h)', spreadAvg: 1.5, volatility: 'medium' },

  // ─── FOREX MINEURES (Priorité 2) ──────────────────────
  { symbol: 'EUR/GBP', name: 'Euro / Livre', category: 'forex_minor', market: 'forex', priority: 2, pipSize: 0.0001, decimals: 5, tradingHours: '24h', spreadAvg: 1.0, volatility: 'low' },
  { symbol: 'EUR/JPY', name: 'Euro / Yen', category: 'forex_minor', market: 'forex', priority: 2, pipSize: 0.01, decimals: 3, tradingHours: '24h', spreadAvg: 1.2, volatility: 'medium' },
  { symbol: 'EUR/CHF', name: 'Euro / Franc Suisse', category: 'forex_minor', market: 'forex', priority: 2, pipSize: 0.0001, decimals: 5, tradingHours: '24h', spreadAvg: 1.5, volatility: 'low' },
  { symbol: 'EUR/CAD', name: 'Euro / Dollar Canadien', category: 'forex_minor', market: 'forex', priority: 2, pipSize: 0.0001, decimals: 5, tradingHours: '24h', spreadAvg: 2.0, volatility: 'medium' },
  { symbol: 'EUR/AUD', name: 'Euro / Dollar Australien', category: 'forex_minor', market: 'forex', priority: 2, pipSize: 0.0001, decimals: 5, tradingHours: '24h', spreadAvg: 2.0, volatility: 'medium' },
  { symbol: 'GBP/JPY', name: 'Livre / Yen', category: 'forex_minor', market: 'forex', priority: 2, pipSize: 0.01, decimals: 3, tradingHours: '24h', spreadAvg: 1.8, volatility: 'high' },
  { symbol: 'GBP/CHF', name: 'Livre / Franc Suisse', category: 'forex_minor', market: 'forex', priority: 3, pipSize: 0.0001, decimals: 5, tradingHours: '24h', spreadAvg: 2.5, volatility: 'high' },
  { symbol: 'GBP/CAD', name: 'Livre / Dollar Canadien', category: 'forex_minor', market: 'forex', priority: 3, pipSize: 0.0001, decimals: 5, tradingHours: '24h', spreadAvg: 3.0, volatility: 'high' },
  { symbol: 'GBP/AUD', name: 'Livre / Dollar Australien', category: 'forex_minor', market: 'forex', priority: 3, pipSize: 0.0001, decimals: 5, tradingHours: '24h', spreadAvg: 2.5, volatility: 'high' },
  { symbol: 'AUD/JPY', name: 'Dollar Australien / Yen', category: 'forex_minor', market: 'forex', priority: 2, pipSize: 0.01, decimals: 3, tradingHours: '24h', spreadAvg: 1.5, volatility: 'high' },
  { symbol: 'AUD/CAD', name: 'Dollar Australien / Dollar CAD', category: 'forex_minor', market: 'forex', priority: 3, pipSize: 0.0001, decimals: 5, tradingHours: '24h', spreadAvg: 2.0, volatility: 'medium' },
  { symbol: 'AUD/CHF', name: 'Dollar Australien / Franc CH', category: 'forex_minor', market: 'forex', priority: 3, pipSize: 0.0001, decimals: 5, tradingHours: '24h', spreadAvg: 2.0, volatility: 'medium' },
  { symbol: 'NZD/JPY', name: 'Dollar NZ / Yen', category: 'forex_minor', market: 'forex', priority: 3, pipSize: 0.01, decimals: 3, tradingHours: '24h', spreadAvg: 2.0, volatility: 'high' },
  { symbol: 'CAD/JPY', name: 'Dollar CAD / Yen', category: 'forex_minor', market: 'forex', priority: 3, pipSize: 0.01, decimals: 3, tradingHours: '24h', spreadAvg: 1.8, volatility: 'high' },
  { symbol: 'CAD/CHF', name: 'Dollar CAD / Franc CH', category: 'forex_minor', market: 'forex', priority: 3, pipSize: 0.0001, decimals: 5, tradingHours: '24h', spreadAvg: 2.5, volatility: 'medium' },
  { symbol: 'CHF/JPY', name: 'Franc CH / Yen', category: 'forex_minor', market: 'forex', priority: 3, pipSize: 0.01, decimals: 3, tradingHours: '24h', spreadAvg: 1.8, volatility: 'high' },

  // ─── FOREX EXOTIQUES (Priorité 3) ─────────────────────
  { symbol: 'USD/TRY', name: 'Dollar US / Livre Turque', category: 'forex_exotic', market: 'forex', priority: 3, pipSize: 0.0001, decimals: 5, tradingHours: '24h', spreadAvg: 50, volatility: 'very_high' },
  { symbol: 'USD/ZAR', name: 'Dollar US / Rand Sud-Africain', category: 'forex_exotic', market: 'forex', priority: 3, pipSize: 0.0001, decimals: 5, tradingHours: '24h', spreadAvg: 15, volatility: 'high' },
  { symbol: 'USD/MXN', name: 'Dollar US / Peso Mexicain', category: 'forex_exotic', market: 'forex', priority: 3, pipSize: 0.0001, decimals: 5, tradingHours: '24h', spreadAvg: 20, volatility: 'high' },
  { symbol: 'USD/SEK', name: 'Dollar US / Couronne Suédoise', category: 'forex_exotic', market: 'forex', priority: 3, pipSize: 0.0001, decimals: 5, tradingHours: '24h', spreadAvg: 5, volatility: 'medium' },
  { symbol: 'USD/NOK', name: 'Dollar US / Couronne Norvégienne', category: 'forex_exotic', market: 'forex', priority: 3, pipSize: 0.0001, decimals: 5, tradingHours: '24h', spreadAvg: 5, volatility: 'medium' },
  { symbol: 'USD/SGD', name: 'Dollar US / Dollar Singapour', category: 'forex_exotic', market: 'forex', priority: 3, pipSize: 0.0001, decimals: 5, tradingHours: '24h', spreadAvg: 3, volatility: 'low' },
  { symbol: 'USD/HKD', name: 'Dollar US / Dollar HK', category: 'forex_exotic', market: 'forex', priority: 3, pipSize: 0.0001, decimals: 5, tradingHours: '24h', spreadAvg: 10, volatility: 'low' },

  // ─── MÉTAUX (Priorité 1 pour XAU) ─────────────────────
  { symbol: 'XAU/USD', name: 'Or / Dollar US', category: 'metals', market: 'metals', priority: 1, pipSize: 0.01, decimals: 2, tradingHours: '23h (dim 23h - ven 22h)', spreadAvg: 20, volatility: 'medium' },
  { symbol: 'XAG/USD', name: 'Argent / Dollar US', category: 'metals', market: 'metals', priority: 2, pipSize: 0.001, decimals: 3, tradingHours: '23h', spreadAvg: 15, volatility: 'high' },
  { symbol: 'XPT/USD', name: 'Platine / Dollar US', category: 'metals', market: 'metals', priority: 3, pipSize: 0.1, decimals: 1, tradingHours: '23h', spreadAvg: 50, volatility: 'high' },
  { symbol: 'XPD/USD', name: 'Palladium / Dollar US', category: 'metals', market: 'metals', priority: 3, pipSize: 0.1, decimals: 1, tradingHours: '23h', spreadAvg: 80, volatility: 'very_high' },

  // ─── CRYPTO (Priorité 1 pour BTC/ETH) ─────────────────
  { symbol: 'BTC/USD', name: 'Bitcoin / Dollar US', category: 'crypto', market: 'crypto', priority: 1, pipSize: 0.01, decimals: 2, tradingHours: '24h/7', spreadAvg: 30, volatility: 'very_high' },
  { symbol: 'ETH/USD', name: 'Ethereum / Dollar US', category: 'crypto', market: 'crypto', priority: 1, pipSize: 0.01, decimals: 2, tradingHours: '24h/7', spreadAvg: 20, volatility: 'very_high' },
  { symbol: 'SOL/USD', name: 'Solana / Dollar US', category: 'crypto', market: 'crypto', priority: 2, pipSize: 0.001, decimals: 3, tradingHours: '24h/7', spreadAvg: 5, volatility: 'very_high' },
  { symbol: 'XRP/USD', name: 'Ripple / Dollar US', category: 'crypto', market: 'crypto', priority: 2, pipSize: 0.0001, decimals: 5, tradingHours: '24h/7', spreadAvg: 1, volatility: 'very_high' },
  { symbol: 'BNB/USD', name: 'Binance Coin / Dollar US', category: 'crypto', market: 'crypto', priority: 2, pipSize: 0.01, decimals: 2, tradingHours: '24h/7', spreadAvg: 5, volatility: 'very_high' },
  { symbol: 'ADA/USD', name: 'Cardano / Dollar US', category: 'crypto', market: 'crypto', priority: 2, pipSize: 0.0001, decimals: 5, tradingHours: '24h/7', spreadAvg: 2, volatility: 'very_high' },
  { symbol: 'DOGE/USD', name: 'Dogecoin / Dollar US', category: 'crypto', market: 'crypto', priority: 2, pipSize: 0.0001, decimals: 5, tradingHours: '24h/7', spreadAvg: 3, volatility: 'very_high' },
  { symbol: 'AVAX/USD', name: 'Avalanche / Dollar US', category: 'crypto', market: 'crypto', priority: 3, pipSize: 0.001, decimals: 3, tradingHours: '24h/7', spreadAvg: 5, volatility: 'very_high' },
  { symbol: 'DOT/USD', name: 'Polkadot / Dollar US', category: 'crypto', market: 'crypto', priority: 3, pipSize: 0.001, decimals: 3, tradingHours: '24h/7', spreadAvg: 5, volatility: 'very_high' },
  { symbol: 'LINK/USD', name: 'Chainlink / Dollar US', category: 'crypto', market: 'crypto', priority: 3, pipSize: 0.001, decimals: 3, tradingHours: '24h/7', spreadAvg: 5, volatility: 'very_high' },
  { symbol: 'LTC/USD', name: 'Litecoin / Dollar US', category: 'crypto', market: 'crypto', priority: 3, pipSize: 0.01, decimals: 2, tradingHours: '24h/7', spreadAvg: 5, volatility: 'very_high' },
  { symbol: 'TRX/USD', name: 'Tron / Dollar US', category: 'crypto', market: 'crypto', priority: 3, pipSize: 0.0001, decimals: 5, tradingHours: '24h/7', spreadAvg: 2, volatility: 'very_high' },
  { symbol: 'UNI/USD', name: 'Uniswap / Dollar US', category: 'crypto', market: 'crypto', priority: 3, pipSize: 0.001, decimals: 3, tradingHours: '24h/7', spreadAvg: 5, volatility: 'very_high' },

  // ─── INDICES (Priorité 1 pour NASDAQ/SPX/DAX) ─────────
  { symbol: 'NAS100', name: 'NASDAQ 100', category: 'indices', market: 'indices', priority: 1, pipSize: 0.1, decimals: 1, tradingHours: '15h30-22h (EU)', spreadAvg: 100, volatility: 'high' },
  { symbol: 'SPX500', name: 'S&P 500', category: 'indices', market: 'indices', priority: 1, pipSize: 0.1, decimals: 1, tradingHours: '15h30-22h (EU)', spreadAvg: 50, volatility: 'medium' },
  { symbol: 'US30', name: 'Dow Jones 30', category: 'indices', market: 'indices', priority: 1, pipSize: 0.1, decimals: 1, tradingHours: '15h30-22h (EU)', spreadAvg: 200, volatility: 'medium' },
  { symbol: 'DE40', name: 'DAX 40', category: 'indices', market: 'indices', priority: 1, pipSize: 0.1, decimals: 1, tradingHours: '09h-17h30', spreadAvg: 80, volatility: 'medium' },
  { symbol: 'FR40', name: 'CAC 40', category: 'indices', market: 'indices', priority: 2, pipSize: 0.1, decimals: 1, tradingHours: '09h-17h30', spreadAvg: 60, volatility: 'medium' },
  { symbol: 'UK100', name: 'FTSE 100', category: 'indices', market: 'indices', priority: 2, pipSize: 0.1, decimals: 1, tradingHours: '09h-17h30', spreadAvg: 50, volatility: 'medium' },
  { symbol: 'EU50', name: 'EURO STOXX 50', category: 'indices', market: 'indices', priority: 2, pipSize: 0.1, decimals: 1, tradingHours: '09h-17h30', spreadAvg: 40, volatility: 'medium' },
  { symbol: 'JP225', name: 'Nikkei 225', category: 'indices', market: 'indices', priority: 2, pipSize: 0.1, decimals: 1, tradingHours: '01h-07h', spreadAvg: 150, volatility: 'high' },
  { symbol: 'HK50', name: 'Hang Seng', category: 'indices', market: 'indices', priority: 3, pipSize: 0.1, decimals: 1, tradingHours: '04h-10h', spreadAvg: 200, volatility: 'high' },
  { symbol: 'AU200', name: 'ASX 200', category: 'indices', market: 'indices', priority: 3, pipSize: 0.1, decimals: 1, tradingHours: '01h-07h', spreadAvg: 100, volatility: 'medium' },

  // ─── MATIÈRES PREMIÈRES & ÉNERGIES ────────────────────
  { symbol: 'WTI', name: 'Pétrole WTI', category: 'energy', market: 'energy', priority: 1, pipSize: 0.01, decimals: 2, tradingHours: '01h-22h', spreadAvg: 20, volatility: 'high' },
  { symbol: 'BRENT', name: 'Pétrole Brent', category: 'energy', market: 'energy', priority: 1, pipSize: 0.01, decimals: 2, tradingHours: '03h-22h', spreadAvg: 25, volatility: 'high' },
  { symbol: 'NATGAS', name: 'Gaz naturel', category: 'energy', market: 'energy', priority: 2, pipSize: 0.001, decimals: 3, tradingHours: '01h-22h', spreadAvg: 30, volatility: 'very_high' },
  { symbol: 'COPPER', name: 'Cuivre', category: 'commodities', market: 'commodities', priority: 2, pipSize: 0.0001, decimals: 4, tradingHours: '01h-22h', spreadAvg: 30, volatility: 'medium' },

  // ─── ACTIONS US (CFD) ─────────────────────────────────
  { symbol: 'AAPL', name: 'Apple Inc.', category: 'stocks_us', market: 'stocks', priority: 2, pipSize: 0.01, decimals: 2, tradingHours: '15h30-22h', spreadAvg: 5, volatility: 'medium' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', category: 'stocks_us', market: 'stocks', priority: 2, pipSize: 0.01, decimals: 2, tradingHours: '15h30-22h', spreadAvg: 5, volatility: 'medium' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', category: 'stocks_us', market: 'stocks', priority: 2, pipSize: 0.01, decimals: 2, tradingHours: '15h30-22h', spreadAvg: 8, volatility: 'high' },
  { symbol: 'TSLA', name: 'Tesla Inc.', category: 'stocks_us', market: 'stocks', priority: 2, pipSize: 0.01, decimals: 2, tradingHours: '15h30-22h', spreadAvg: 10, volatility: 'very_high' },
  { symbol: 'AMZN', name: 'Amazon.com', category: 'stocks_us', market: 'stocks', priority: 2, pipSize: 0.01, decimals: 2, tradingHours: '15h30-22h', spreadAvg: 5, volatility: 'high' },
  { symbol: 'META', name: 'Meta Platforms', category: 'stocks_us', market: 'stocks', priority: 2, pipSize: 0.01, decimals: 2, tradingHours: '15h30-22h', spreadAvg: 6, volatility: 'high' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', category: 'stocks_us', market: 'stocks', priority: 2, pipSize: 0.01, decimals: 2, tradingHours: '15h30-22h', spreadAvg: 5, volatility: 'medium' },
  { symbol: 'NFLX', name: 'Netflix Inc.', category: 'stocks_us', market: 'stocks', priority: 3, pipSize: 0.01, decimals: 2, tradingHours: '15h30-22h', spreadAvg: 8, volatility: 'high' },
  { symbol: 'AMD', name: 'AMD Inc.', category: 'stocks_us', market: 'stocks', priority: 3, pipSize: 0.01, decimals: 2, tradingHours: '15h30-22h', spreadAvg: 5, volatility: 'very_high' },
  { symbol: 'INTC', name: 'Intel Corp.', category: 'stocks_us', market: 'stocks', priority: 3, pipSize: 0.01, decimals: 2, tradingHours: '15h30-22h', spreadAvg: 4, volatility: 'medium' },

  // ─── VOLATILITÉ ───────────────────────────────────────
  { symbol: 'VIX', name: 'VIX Index', category: 'volatility', market: 'indices', priority: 2, pipSize: 0.01, decimals: 2, tradingHours: '15h30-22h', spreadAvg: 50, volatility: 'very_high' },
  { symbol: 'DXY', name: 'US Dollar Index', category: 'indices', market: 'indices', priority: 2, pipSize: 0.001, decimals: 3, tradingHours: '03h-22h', spreadAvg: 10, volatility: 'low' },
];

// ════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════

export function getAssetsByCategory(category: AssetCategory): AssetDef[] {
  return ASSET_CATALOG.filter(a => a.category === category);
}

export function getAssetsByMarket(market: MarketType): AssetDef[] {
  return ASSET_CATALOG.filter(a => a.market === market);
}

export function getAssetsByPriority(priority: 1 | 2 | 3): AssetDef[] {
  return ASSET_CATALOG.filter(a => a.priority === priority);
}

export function getAssetBySymbol(symbol: string): AssetDef | undefined {
  return ASSET_CATALOG.find(a => a.symbol === symbol);
}

export function getPriority1Assets(): AssetDef[] {
  return ASSET_CATALOG.filter(a => a.priority === 1);
}

export function getSymbolsList(): string[] {
  return ASSET_CATALOG.map(a => a.symbol);
}

export function getCategoryLabel(cat: AssetCategory): string {
  const labels: Record<AssetCategory, string> = {
    forex_major: 'Forex Majeur',
    forex_minor: 'Forex Mineur',
    forex_exotic: 'Forex Exotique',
    metals: 'Metaux',
    crypto: 'Crypto',
    indices: 'Indices',
    stocks_us: 'Actions US',
    stocks_eu: 'Actions EU',
    commodities: 'Matières',
    energy: 'Energie',
    bonds: 'Obligations',
    volatility: 'Volatilite',
  };
  return labels[cat] || cat;
}

export function getMarketLabel(market: MarketType): string {
  const labels: Record<MarketType, string> = {
    forex: 'Forex',
    metals: 'Metaux',
    crypto: 'Crypto',
    indices: 'Indices',
    stocks: 'Actions',
    commodities: 'Matières',
    energy: 'Energie',
    bonds: 'Obligations',
  };
  return labels[market] || market;
}

// Catégories groupées pour filtres UI
export const ASSET_CATEGORIES_UI = [
  { key: 'forex_major', label: 'Forex Majeures', market: 'forex' as MarketType },
  { key: 'forex_minor', label: 'Forex Mineures', market: 'forex' as MarketType },
  { key: 'forex_exotic', label: 'Forex Exotiques', market: 'forex' as MarketType },
  { key: 'metals', label: 'Metaux', market: 'metals' as MarketType },
  { key: 'crypto', label: 'Crypto', market: 'crypto' as MarketType },
  { key: 'indices', label: 'Indices', market: 'indices' as MarketType },
  { key: 'stocks_us', label: 'Actions US', market: 'stocks' as MarketType },
  { key: 'energy', label: 'Energie', market: 'energy' as MarketType },
  { key: 'commodities', label: 'Matières', market: 'commodities' as MarketType },
  { key: 'volatility', label: 'Volatilite', market: 'indices' as MarketType },
];

// Timeframes pour filtres
export const TIMEFRAMES_UI = [
  { key: 'M1', label: 'M1', minutes: 1 },
  { key: 'M5', label: 'M5', minutes: 5 },
  { key: 'M15', label: 'M15', minutes: 15 },
  { key: 'M30', label: 'M30', minutes: 30 },
  { key: 'H1', label: 'H1', minutes: 60 },
  { key: 'H4', label: 'H4', minutes: 240 },
  { key: 'D1', label: 'D1', minutes: 1440 },
  { key: 'W1', label: 'W1', minutes: 10080 },
];

// Period filter options
export const PERIOD_OPTIONS = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'yesterday', label: 'Hier' },
  { key: '24h', label: '24 dernières heures' },
  { key: '7d', label: '7 derniers jours' },
  { key: '14d', label: '14 derniers jours' },
  { key: '30d', label: '30 derniers jours' },
  { key: 'this_week', label: 'Cette semaine' },
  { key: 'last_week', label: 'Semaine précédente' },
  { key: 'this_month', label: 'Ce mois' },
  { key: 'last_month', label: 'Mois précédent' },
  { key: 'this_quarter', label: 'Ce trimestre' },
  { key: 'this_year', label: 'Cette année' },
];
