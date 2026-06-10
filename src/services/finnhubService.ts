/**
 * Finnhub Service
 * API Key: d8i60bpr01qm63ba4bp0d8i60bpr01qm63ba4bpg
 * Real-time websocket + REST API for stocks, indices, forex, crypto
 */

const API_KEY = 'd8i60bpr01qm63ba4bp0d8i60bpr01qm63ba4bpg';
const REST_URL = 'https://finnhub.io/api/v1';
const WS_URL = 'wss://ws.finnhub.io?token=' + API_KEY;

// ─── REST: Quote ────────────────────────────────────────

export interface FinnhubQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
  timestamp: number;
  source: string;
}

export async function fetchFinnhubQuote(symbol: string, displaySymbol: string): Promise<FinnhubQuote | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${REST_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${API_KEY}`, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();

    if (!data.c || data.c === 0) return null;

    const change = data.c - data.pc;
    const changePercent = data.pc > 0 ? (change / data.pc) * 100 : 0;

    return {
      symbol: displaySymbol,
      price: data.c,
      change,
      changePercent,
      high: data.h || data.c * 1.01,
      low: data.l || data.c * 0.99,
      open: data.o || data.c,
      previousClose: data.pc || data.c,
      volume: data.v || 0,
      timestamp: Date.now(),
      source: 'Finnhub',
    };
  } catch (e) {
    console.warn = () => {}; // Suppressed in production: Finnhub fetch failed for ${symbol}:`, e);
    return null;
  }
}

// ─── REST: Company Profile (for stocks) ─────────────────

export interface CompanyProfile {
  name: string;
  ticker: string;
  industry: string;
  sector: string;
  marketCap: number;
  logo: string;
}

export async function fetchCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${REST_URL}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${API_KEY}`, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    if (!data.ticker) return null;

    return {
      name: data.name || data.ticker,
      ticker: data.ticker,
      industry: data.finnhubIndustry || 'N/A',
      sector: data.sector || 'N/A',
      marketCap: data.marketCapitalization || 0,
      logo: data.logo || '',
    };
  } catch {
    return null;
  }
}

// ─── REST: Market News ──────────────────────────────────

export interface MarketNews {
  category: string;
  datetime: number;
  headline: string;
  source: string;
  summary: string;
  url: string;
}

export async function fetchMarketNews(category: string = 'general', minId: number = 0): Promise<MarketNews[]> {
  try {
    const res = await fetch(`${REST_URL}/news?category=${category}&minId=${minId}&token=${API_KEY}`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// ─── REST: Economic Calendar ────────────────────────────

export interface EconomicEvent {
  time: string;
  country: string;
  event: string;
  actual: string;
  estimate: string;
  impact: 'low' | 'medium' | 'high';
}

export async function fetchEconomicCalendar(from: string, to: string): Promise<EconomicEvent[]> {
  try {
    const res = await fetch(`${REST_URL}/calendar/economic?from=${from}&to=${to}&token=${API_KEY}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.economicCalendar || [];
  } catch {
    return [];
  }
}

// ─── WebSocket (real-time quotes) ───────────────────────

let ws: WebSocket | null = null;
let wsCallbacks: Map<string, ((quote: FinnhubQuote) => void)[]> = new Map();

export function connectFinnhubWS(onConnect?: () => void): WebSocket {
  if (ws && ws.readyState === WebSocket.OPEN) return ws;

  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    /* console.log('Finnhub WS connected'); */
    onConnect?.();
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'trade' && data.data) {
      for (const trade of data.data) {
        const callbacks = wsCallbacks.get(trade.s) || [];
        const quote: FinnhubQuote = {
          symbol: trade.s,
          price: trade.p,
          change: 0,
          changePercent: 0,
          high: trade.p,
          low: trade.p,
          open: trade.p,
          previousClose: trade.p,
          volume: trade.v || 0,
          timestamp: trade.t,
          source: 'Finnhub-WS',
        };
        callbacks.forEach(cb => cb(quote));
      }
    }
  };

  ws.onerror = (e) => /* console.warn('Finnhub WS error:', e); */
  ws.onclose = () => {
    ws = null;
    // Auto-reconnect after 5s
    setTimeout(() => connectFinnhubWS(), 5000);
  };

  return ws;
}

export function subscribeFinnhub(symbol: string, callback: (quote: FinnhubQuote) => void): () => void {
  const ws = connectFinnhubWS(() => {
    ws.send(JSON.stringify({ type: 'subscribe', symbol }));
  });

  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'subscribe', symbol }));
  }

  const callbacks = wsCallbacks.get(symbol) || [];
  callbacks.push(callback);
  wsCallbacks.set(symbol, callbacks);

  return () => {
    const cbs = wsCallbacks.get(symbol) || [];
    wsCallbacks.set(symbol, cbs.filter(cb => cb !== callback));
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'unsubscribe', symbol }));
    }
  };
}

// ─── Batch: Fetch multiple quotes ───────────────────────

export async function fetchFinnhubBatch(symbols: Array<{ symbol: string; display: string }>): Promise<Record<string, FinnhubQuote>> {
  const results: Record<string, FinnhubQuote> = {};

  // Finnhub free tier: 60 calls/minute, so we can do parallel
  const promises = symbols.map(async ({ symbol, display }) => {
    const quote = await fetchFinnhubQuote(symbol, display);
    if (quote) results[display] = quote;
  });

  await Promise.all(promises);
  return results;
}

// ─── Symbol mapping for indices/stocks ──────────────────

export const FINNHUB_SYMBOLS: Record<string, string> = {
  // Indices
  'NAS100': '^IXIC',
  'SPX500': '^GSPC',
  'US30': '^DJI',
  'DE40': '^GDAXI',
  'FR40': '^FCHI',
  'UK100': '^FTSE',
  'EU50': '^STOXX50E',
  'JP225': '^N225',
  'HK50': '^HSI',
  // Stocks
  'AAPL': 'AAPL',
  'TSLA': 'TSLA',
  'NVDA': 'NVDA',
  'MSFT': 'MSFT',
  'AMZN': 'AMZN',
  'META': 'META',
  'GOOGL': 'GOOGL',
  'NFLX': 'NFLX',
  'AMD': 'AMD',
  'INTC': 'INTC',
  // Energies (using ETFs as proxies)
  'WTI': 'USO',
  'BRENT': 'BNO',
  'NATGAS': 'UNG',
  // Volatility
  'VIX': '^VIX',
  'DXY': 'UUP',
};
