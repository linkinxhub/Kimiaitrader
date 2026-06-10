/**
 * Alpha Vantage Service
 * API Key: 673HJIG6FO126TFY
 * Endpoints: Forex, Crypto, Actions, Matières premières, Indices
 */

const API_KEY = '673HJIG6FO126TFY';
const BASE_URL = 'https://www.alphavantage.co/query';

// Rate limit: 5 calls per minute (free tier)
let lastCallTime = 0;
const MIN_DELAY_MS = 13000; // 13s between calls

async function rateLimitedFetch(url: string): Promise<any> {
  const now = Date.now();
  const elapsed = now - lastCallTime;
  if (elapsed < MIN_DELAY_MS) {
    await new Promise(r => setTimeout(r, MIN_DELAY_MS - elapsed));
  }
  lastCallTime = Date.now();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    clearTimeout(timeout);
    return null;
  }
}

export interface AlphaVantageQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  source: string;
}

// ─── Forex (FX_DAILY) ─────────────────────────────────

export async function fetchAlphaVantageForex(from: string, to: string): Promise<AlphaVantageQuote | null> {
  const url = `${BASE_URL}?function=FX_DAILY&from_symbol=${from}&to_symbol=${to}&apikey=${API_KEY}`;
  const data = await rateLimitedFetch(url);
  if (!data || !data['Time Series FX (Daily)']) return null;

  const dates = Object.keys(data['Time Series FX (Daily)']).sort().reverse();
  if (dates.length < 2) return null;

  const today = data['Time Series FX (Daily)'][dates[0]];
  const yesterday = data['Time Series FX (Daily)'][dates[1]];

  const price = parseFloat(today['4. close']);
  const prevClose = parseFloat(yesterday['4. close']);
  const change = price - prevClose;
  const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

  return {
    symbol: `${from}/${to}`,
    price,
    change,
    changePercent,
    volume: 0,
    high: parseFloat(today['2. high']),
    low: parseFloat(today['3. low']),
    source: 'AlphaVantage',
  };
}

// ─── Global Quote (Actions, Indices, ETFs) ──────────────

export async function fetchAlphaVantageQuote(symbol: string, displaySymbol: string): Promise<AlphaVantageQuote | null> {
  const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`;
  const data = await rateLimitedFetch(url);
  if (!data || !data['Global Quote']) return null;

  const q = data['Global Quote'];
  const price = parseFloat(q['05. price'] || 0);
  if (!price) return null;

  return {
    symbol: displaySymbol,
    price,
    change: parseFloat(q['09. change'] || 0),
    changePercent: parseFloat(q['10. change percent']?.replace('%', '') || 0),
    volume: parseInt(q['06. volume'] || 0),
    high: parseFloat(q['03. high'] || price * 1.01),
    low: parseFloat(q['04. low'] || price * 0.99),
    source: 'AlphaVantage',
  };
}

// ─── Commodities ────────────────────────────────────────

export async function fetchAlphaVantageCommodity(commodity: string, displaySymbol: string): Promise<AlphaVantageQuote | null> {
  const commodityMap: Record<string, string> = {
    'WTI': 'WTI',
    'BRENT': 'BRENT',
    'NATURAL_GAS': 'NATURAL_GAS',
    'COPPER': 'COPPER',
    'ALUMINUM': 'ALUMINUM',
    'WHEAT': 'WHEAT',
    'CORN': 'CORN',
    'COTTON': 'COTTON',
    'SUGAR': 'SUGAR',
    'COFFEE': 'COFFEE',
  };

  const apiName = commodityMap[commodity];
  if (!apiName) return null;

  const url = `${BASE_URL}?function=${apiName}&interval=daily&apikey=${API_KEY}`;
  const data = await rateLimitedFetch(url);
  if (!data || !data.data || data.data.length < 2) return null;

  const latest = data.data[0];
  const previous = data.data[1];

  const price = parseFloat(latest.value);
  const prevPrice = parseFloat(previous.value);
  const change = price - prevPrice;
  const changePercent = prevPrice > 0 ? (change / prevPrice) * 100 : 0;

  return {
    symbol: displaySymbol,
    price,
    change,
    changePercent,
    volume: 0,
    high: price * 1.02,
    low: price * 0.98,
    source: 'AlphaVantage',
  };
}

// ─── Treasury Yield (Obligations) ───────────────────────

export async function fetchAlphaVantageTreasury(maturity: '10year' | '2year', displaySymbol: string): Promise<AlphaVantageQuote | null> {
  const url = `${BASE_URL}?function=TREASURY_YIELD&interval=daily&maturity=${maturity}&apikey=${API_KEY}`;
  const data = await rateLimitedFetch(url);
  if (!data || !data.data || data.data.length < 2) return null;

  const latest = data.data[0];
  const previous = data.data[1];

  const price = parseFloat(latest.value);
  const prevPrice = parseFloat(previous.value);

  return {
    symbol: displaySymbol,
    price,
    change: price - prevPrice,
    changePercent: prevPrice > 0 ? ((price - prevPrice) / prevPrice) * 100 : 0,
    volume: 0,
    high: price * 1.005,
    low: price * 0.995,
    source: 'AlphaVantage',
  };
}

// ─── Batch helper for multiple symbols ──────────────────

export async function fetchAlphaVantageBatch(symbols: Array<{ symbol: string; display: string; type: 'forex' | 'quote' | 'commodity' | 'treasury'; param?: string }>): Promise<Record<string, AlphaVantageQuote>> {
  const results: Record<string, AlphaVantageQuote> = {};

  for (const s of symbols) {
    let quote: AlphaVantageQuote | null = null;

    if (s.type === 'forex' && s.param) {
      const [from, to] = s.param.split('/');
      quote = await fetchAlphaVantageForex(from, to);
    } else if (s.type === 'quote') {
      quote = await fetchAlphaVantageQuote(s.symbol, s.display);
    } else if (s.type === 'commodity' && s.param) {
      quote = await fetchAlphaVantageCommodity(s.param, s.display);
    } else if (s.type === 'treasury' && s.param) {
      quote = await fetchAlphaVantageTreasury(s.param as '10year' | '2year', s.display);
    }

    if (quote) {
      results[s.display] = quote;
    }
  }

  return results;
}
