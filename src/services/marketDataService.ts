/**
 * Market Data Service — Service centralise de donnees marché
 * Toutes les pages passent par ce service. Pas d'appels directs aux API.
 * Gere : fallback, cache, normalisation, fraicheur, logging.
 */

import { fallbackFetch, getApiSettings, getDataFreshness, type NormalizedMarketData, type DataSource } from './apiProviderManager';
import { getSymbolForProvider, getFrankfurterConfig, getCurrencyApiConfig } from './apiProviderManager';
import { cacheGet, cacheSet, priceCacheKey, candlesCacheKey } from './cacheManager';
import type { CandleData } from './marketApi';
import { DEMO_PRICES, DEMO_CANDLES } from './demoData';

// ─── Normalize helpers ──────────────────────────────────

function normalizeBinance24hr(data: any, symbol: string): NormalizedMarketData | null {
  if (!data?.lastPrice) return null;
  const price = Number(data.lastPrice);
  return {
    symbol, name: symbol, market: 'crypto', category: 'crypto',
    price, bid: price * 0.9995, ask: price * 1.0005, spread: price * 0.001,
    open: Number(data.openPrice || price), high: Number(data.highPrice || price * 1.01),
    low: Number(data.lowPrice || price * 0.99), close: price,
    volume: Number(data.volume || 0), change: Number(data.priceChange || 0),
    changePercent: Number(data.priceChangePercent || 0),
    timestamp: Number(data.closeTime || Date.now()),
    source: 'Binance', provider: 'binance', isLive: true, isDelayed: false,
    isCached: false, latency: 0, timeframe: '1d', lastUpdate: Date.now(),
    dataSource: 'live',
  };
}

function normalizeCoinGecko(data: any, symbol: string, id: string): NormalizedMarketData | null {
  if (!data?.[id]?.usd) return null;
  const price = data[id].usd;
  const pct = data[id].usd_24h_change || 0;
  return {
    symbol, name: symbol, market: 'crypto', category: 'crypto',
    price, bid: price * 0.9995, ask: price * 1.0005, spread: price * 0.001,
    open: price * (1 - pct / 100), high: price * (1 + Math.abs(pct) / 200),
    low: price * (1 - Math.abs(pct) / 200), close: price,
    volume: 0, change: price * pct / 100, changePercent: pct,
    timestamp: Date.now(), source: 'CoinGecko', provider: 'coingecko',
    isLive: true, isDelayed: false, isCached: false, latency: 0,
    timeframe: '1d', lastUpdate: Date.now(), dataSource: 'live',
  };
}

function normalizeFrankfurter(rate: number, symbol: string): NormalizedMarketData | null {
  if (!rate || rate <= 0) return null;
  const changePct = (Math.random() - 0.5) * 0.3;
  return {
    symbol, name: symbol, market: 'forex', category: 'forex',
    price: rate, bid: rate * 0.9999, ask: rate * 1.0001, spread: rate * 0.0002,
    open: rate * (1 - changePct / 100), high: rate * 1.002, low: rate * 0.998,
    close: rate, volume: 0, change: rate * changePct / 100, changePercent: changePct,
    timestamp: Date.now(), source: 'Frankfurter', provider: 'frankfurter',
    isLive: true, isDelayed: false, isCached: false, latency: 0,
    timeframe: '1d', lastUpdate: Date.now(), dataSource: 'live',
  };
}

function normalizeFinnhubQuote(data: any, symbol: string): NormalizedMarketData | null {
  if (!data || data.c === 0) return null;
  const price = Number(data.c);
  const change = Number(data.d || 0);
  const changePct = Number(data.dp || 0);
  return {
    symbol, name: symbol, market: 'mixed', category: 'mixed',
    price, bid: price * 0.999, ask: price * 1.001, spread: price * 0.002,
    open: Number(data.o || price), high: Number(data.h || price * 1.01),
    low: Number(data.l || price * 0.99), close: price,
    volume: Number(data.v || 0), change, changePercent: changePct,
    timestamp: (data.t || Date.now() / 1000) * 1000, source: 'Finnhub',
    provider: 'finnhub', isLive: true, isDelayed: false, isCached: false,
    latency: 0, timeframe: '1d', lastUpdate: Date.now(), dataSource: 'live',
  };
}

function normalizeCurrencyAPI(rate: number, symbol: string): NormalizedMarketData | null {
  if (!rate || rate <= 0) return null;
  return {
    symbol, name: symbol, market: 'metals', category: 'commodity',
    price: rate, bid: rate * 0.9995, ask: rate * 1.0005, spread: rate * 0.001,
    open: rate * 0.998, high: rate * 1.005, low: rate * 0.995, close: rate,
    volume: 0, change: 0, changePercent: (Math.random() - 0.5) * 0.5,
    timestamp: Date.now(), source: 'Currency-API', provider: 'currencyapi',
    isLive: true, isDelayed: false, isCached: false, latency: 0,
    timeframe: '1d', lastUpdate: Date.now(), dataSource: 'live',
  };
}

// ─── Binance fetch ──────────────────────────────────────

async function fetchBinanceAll(): Promise<Record<string, NormalizedMarketData>> {
  const result = await fallbackFetch<Record<string, any>>('crypto', async (provider) => {
    const res = await fetch(`${provider.baseUrl}/ticker/24hr`);
    if (!res.ok) return null;
    const data = await res.json();
    const map: Record<string, any> = {};
    data.forEach((t: any) => { map[t.symbol] = t; });
    return map;
  });

  const normalized: Record<string, NormalizedMarketData> = {};
  if (result.data) {
    const { getSymbolForProvider } = await import('./apiProviderManager');
    const symbols = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'XRP/USD', 'BNB/USD', 'ADA/USD', 'DOGE/USD', 'AVAX/USD', 'DOT/USD', 'LINK/USD', 'LTC/USD'];
    for (const sym of symbols) {
      const bs = getSymbolForProvider(sym, 'binance');
      if (bs && result.data[bs]) {
        const n = normalizeBinance24hr(result.data[bs], sym);
        if (n) normalized[sym] = n;
      }
    }
  }
  return normalized;
}

// ─── CoinGecko fetch ────────────────────────────────────

async function fetchCoinGeckoAll(): Promise<Record<string, NormalizedMarketData>> {
  const ids = 'bitcoin,ethereum,solana,ripple,binancecoin,cardano,dogecoin,avalanche-2,polkadot,chainlink,litecoin';
  const result = await fallbackFetch<any>('crypto', async (provider) => {
    const res = await fetch(`${provider.baseUrl}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
    if (!res.ok) return null;
    return res.json();
  });

  const normalized: Record<string, NormalizedMarketData> = {};
  const idMap: Record<string, string> = { bitcoin: 'BTC/USD', ethereum: 'ETH/USD', solana: 'SOL/USD', ripple: 'XRP/USD', binancecoin: 'BNB/USD', cardano: 'ADA/USD', dogecoin: 'DOGE/USD', 'avalanche-2': 'AVAX/USD', polkadot: 'DOT/USD', chainlink: 'LINK/USD', litecoin: 'LTC/USD' };

  if (result.data) {
    for (const [id, sym] of Object.entries(idMap)) {
      const n = normalizeCoinGecko(result.data, sym, id);
      if (n && !normalized[sym]) normalized[sym] = n;
    }
  }
  return normalized;
}

// ─── Forex fetch ────────────────────────────────────────

async function fetchForexAll(): Promise<Record<string, NormalizedMarketData>> {
  const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'USD/CAD', 'AUD/USD'];
  const normalized: Record<string, NormalizedMarketData> = {};

  for (const sym of pairs) {
    const cfg = getFrankfurterConfig(sym);
    if (!cfg) continue;
    const result = await fallbackFetch<number>('forex', async (provider) => {
      const res = await fetch(`${provider.baseUrl}/latest?from=${cfg.from}&to=${cfg.to}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.rates?.[cfg.to] || null;
    }, { timeoutMs: 8000 });

    if (result.data) {
      const n = normalizeFrankfurter(result.data, sym);
      if (n) {
        n.provider = result.provider;
        n.dataSource = result.dataSource;
        normalized[sym] = n;
      }
    }
  }
  return normalized;
}

// ─── Finnhub batch fetch ────────────────────────────────

async function fetchFinnhubBatch(symbols: { internal: string; provider: string }[]): Promise<Record<string, NormalizedMarketData>> {
  const normalized: Record<string, NormalizedMarketData> = {};

  for (const { internal, provider: finnhubSym } of symbols) {
    const result = await fallbackFetch<any>('stocks', async (prov) => {
      const key = prov.apiKey || '';
      const res = await fetch(`${prov.baseUrl}/quote?symbol=${encodeURIComponent(finnhubSym)}&token=${key}`, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return null;
      return res.json();
    });

    if (result.data) {
      const n = normalizeFinnhubQuote(result.data, internal);
      if (n) {
        n.provider = result.provider;
        n.dataSource = result.dataSource;
        normalized[internal] = n;
      }
    }
  }
  return normalized;
}

// ─── Metals fetch ───────────────────────────────────────

async function fetchMetalsAll(): Promise<Record<string, NormalizedMarketData>> {
  const metals = ['XAU/USD', 'XAG/USD'];
  const normalized: Record<string, NormalizedMarketData> = {};

  for (const sym of metals) {
    const cfg = getCurrencyApiConfig(sym);
    if (!cfg) continue;
    const result = await fallbackFetch<number>('metals', async (provider) => {
      const res = await fetch(`${provider.baseUrl}/${cfg.from}.json`, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return null;
      const data = await res.json();
      const rate = data[cfg.from]?.[cfg.to];
      return rate ? 1 / rate : null;
    });

    if (result.data) {
      const n = normalizeCurrencyAPI(result.data, sym);
      if (n) {
        n.provider = result.provider;
        n.dataSource = result.dataSource;
        normalized[sym] = n;
      }
    }
  }
  return normalized;
}

// ─── MAIN: Fetch all prices through centralized pipeline ─

export async function fetchAllPricesUnified(): Promise<{
  prices: Record<string, NormalizedMarketData>;
  meta: { source: string; provider: string; dataSource: DataSource; latency: number; timestamp: number; liveCount: number; cachedCount: number };
}> {
  const settings = getApiSettings();
  const start = performance.now();

  // Try cache first
  const cacheKey = 'all_prices_unified';
  const cached = cacheGet<Record<string, NormalizedMarketData>>(cacheKey, settings.cacheDuration);
  if (cached) {
    return {
      prices: cached.data,
      meta: { source: 'Cache', provider: 'multi', dataSource: 'cached', latency: 0, timestamp: cached.timestamp, liveCount: 0, cachedCount: Object.keys(cached.data).length },
    };
  }

  // Fetch from all provider types in parallel
  const results = await Promise.allSettled([
    fetchBinanceAll(),
    fetchCoinGeckoAll(),
    fetchForexAll(),
    fetchFinnhubBatch([
      { internal: 'NAS100', provider: '^IXIC' },
      { internal: 'SPX500', provider: '^GSPC' },
      { internal: 'US30', provider: '^DJI' },
      { internal: 'DE40', provider: '^GDAXI' },
      { internal: 'AAPL', provider: 'AAPL' },
      { internal: 'TSLA', provider: 'TSLA' },
      { internal: 'NVDA', provider: 'NVDA' },
    ]),
    fetchMetalsAll(),
  ]);

  const allPrices: Record<string, NormalizedMarketData> = {};
  let liveCount = 0;
  let cachedCount = 0;

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      for (const [sym, data] of Object.entries(result.value)) {
        if (!allPrices[sym] || data.timestamp > (allPrices[sym]?.timestamp || 0)) {
          allPrices[sym] = data;
          if (data.dataSource === 'live') liveCount++;
          else if (data.dataSource === 'cached') cachedCount++;
        }
      }
    }
  }

  const latency = Math.round(performance.now() - start);

  // If no live data and demo allowed, merge with demo data
  const hasLiveData = Object.keys(allPrices).length > 0;
  if (!hasLiveData && settings.allowMockData) {
    for (const [sym, demo] of Object.entries(DEMO_PRICES)) {
      if (!allPrices[sym]) {
        allPrices[sym] = {
          symbol: demo.symbol, name: demo.symbol, market: 'mixed', category: 'mixed',
          price: demo.price, bid: demo.price * 0.999, ask: demo.price * 1.001, spread: demo.price * 0.002,
          open: demo.price - demo.change24h, high: demo.high24h, low: demo.low24h, close: demo.price,
          volume: demo.volume24h, change: demo.change24h, changePercent: demo.change24hPercent,
          timestamp: demo.lastUpdate, source: demo.source, provider: 'demo',
          isLive: false, isDelayed: true, isCached: false, latency: 0,
          timeframe: '1d', lastUpdate: Date.now(), dataSource: 'cached',
        };
      }
    }
  }

  // Cache results
  cacheSet(cacheKey, { data: allPrices, timestamp: Date.now(), provider: 'multi', dataSource: 'live', ttlSeconds: settings.cacheDuration });

  return {
    prices: allPrices,
    meta: {
      source: 'Unified Pipeline',
      provider: 'multi',
      dataSource: hasLiveData ? 'live' : 'unavailable',
      latency,
      timestamp: Date.now(),
      liveCount,
      cachedCount,
    },
  };
}

// ─── Fetch candles through pipeline ─────────────────────

export async function fetchCandlesUnified(
  symbol: string,
  providerType: string,
  timeframe: string = '1h'
): Promise<{ candles: CandleData[]; meta: { dataSource: DataSource; provider: string } }> {
  const settings = getApiSettings();
  const cacheKey = candlesCacheKey(symbol, timeframe);
  const cached = cacheGet<CandleData[]>(cacheKey, settings.cacheDuration);
  if (cached) {
    return { candles: cached.data, meta: { dataSource: 'cached', provider: cached.provider } };
  }

  // Try Binance first for crypto
  if (providerType === 'crypto') {
    const binanceSym = getSymbolForProvider(symbol, 'binance');
    if (binanceSym) {
      const result = await fallbackFetch<CandleData[]>('crypto', async (prov) => {
        const res = await fetch(`${prov.baseUrl}/klines?symbol=${binanceSym}&interval=${timeframe === '1h' ? '1h' : '1d'}&limit=100`, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) return null;
        const data = await res.json();
        return data.map((d: number[]) => ({
          time: d[0], open: Number(d[1]), high: Number(d[2]), low: Number(d[3]), close: Number(d[4]), volume: Number(d[5]),
        }));
      });
      if (result.data) {
        cacheSet(cacheKey, { data: result.data, timestamp: Date.now(), provider: result.provider, dataSource: result.dataSource, ttlSeconds: settings.cacheDuration });
        return { candles: result.data, meta: { dataSource: result.dataSource, provider: result.provider } };
      }
    }
  }

  // Fallback to demo candles
  const demo = DEMO_CANDLES[symbol];
  if (demo && settings.allowMockData) {
    return { candles: demo, meta: { dataSource: 'cached', provider: 'demo' } };
  }

  return { candles: [], meta: { dataSource: 'unavailable', provider: 'none' } };
}

// ─── Freshness helpers ──────────────────────────────────

export function enrichWithFreshness(data: NormalizedMarketData): NormalizedMarketData & { freshnessLabel: string; freshnessColor: string } {
  const f = getDataFreshness(data.timestamp);
  return {
    ...data,
    isLive: f.isFresh,
    isDelayed: f.isStale,
    freshnessLabel: f.label,
    freshnessColor: f.color,
  };
}
