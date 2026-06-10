/**
 * OANDA API Service — Alternative gratuite à XTB
 * 
 * OANDA est un broker forex/CFD majeur (comme XTB) avec une API REST gratuite.
 * Compte démo gratuit : https://www.oanda.com/demo-account/
 * 
 * Fournit :
 * - 200+ paires forex (EUR/USD, GBP/USD, USD/JPY...)
 * - Métaux précieux (XAU/USD = or, XAG/USD = argent)
 * - Indices (US30, SPX500, NAS100)
 * - CFD actions
 * 
 * Clé API : configurable par l'utilisateur dans Paramètres > Sources de Données
 * Fallback : si pas de clé OANDA, utilise les APIs existantes (Binance, Frankfurter...)
 */

// ─── Configuration ──────────────────────────────────────

const OANDA_BASE = 'https://api-fxpractice.oanda.com'; // Demo (gratuit)
const OANDA_STREAM = 'https://stream-fxpractice.oanda.com';

const CONFIG_KEY = 'xtrendai_oanda_config';

interface OandaConfig {
  apiKey: string;
  accountId: string;
  enabled: boolean;
}

function getConfig(): OandaConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return { apiKey: '', accountId: '', enabled: false };
    return JSON.parse(raw);
  } catch { return { apiKey: '', accountId: '', enabled: false }; }
}

export function saveOandaConfig(config: Partial<OandaConfig>): void {
  const current = getConfig();
  localStorage.setItem(CONFIG_KEY, JSON.stringify({ ...current, ...config }));
}

export function isOandaConfigured(): boolean {
  const c = getConfig();
  return c.enabled && !!c.apiKey;
}

export function getOandaInstructions(): string {
  return `Pour activer OANDA (alternative gratuite a XTB) :

1. Creez un compte DEMO gratuit sur https://www.oanda.com/demo-account/
2. Connectez-vous au portal : https://trade.oanda.com
3. Generez une API Key :
   - Allez dans "Manage API Access"
   - Cliquez "Generate API Key"
   - Copiez la cle (elle commence par votre ID de compte)
4. Collez votre API Key dans Parametres > Sources de Donnees > OANDA

Le compte demo est gratuit, sans engagement, avec 100 000$ virtuels.
API : 200+ paires forex, XAU/USD, XAG/USD, indices US30/SPX500/NAS100.`;
}

// ─── Symbol Mapping ─────────────────────────────────────

// Map nos symboles internes vers OANDA instrument names
const SYMBOL_MAP: Record<string, string> = {
  'EUR/USD': 'EUR_USD',
  'GBP/USD': 'GBP_USD',
  'USD/JPY': 'USD_JPY',
  'USD/CHF': 'USD_CHF',
  'AUD/USD': 'AUD_USD',
  'NZD/USD': 'NZD_USD',
  'EUR/GBP': 'EUR_GBP',
  'XAU/USD': 'XAU_USD',
  'XAG/USD': 'XAG_USD',
  'US30': 'US30_USD',
  'SPX500': 'SPX500_USD',
  'NAS100': 'NAS100_USD',
  'DE30': 'DE30_EUR',
  'UK100': 'UK100_GBP',
  'USOIL': 'WTICO_USD',
  'BCO': 'BCO_USD',
  'EUR/JPY': 'EUR_JPY',
  'GBP/JPY': 'GBP_JPY',
  'AUD/JPY': 'AUD_JPY',
};

const REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(SYMBOL_MAP).map(([k, v]) => [v, k])
);

// ─── API Calls ──────────────────────────────────────────

interface OandaPrice {
  instrument: string;
  closeoutBid: string;
  closeoutAsk: string;
  bid: string;
  ask: string;
  time: string;
}

async function fetchPrices(instruments: string[]): Promise<OandaPrice[]> {
  const config = getConfig();
  if (!config.apiKey) return [];

  const pairs = instruments.map(s => SYMBOL_MAP[s] || s).filter(Boolean).join(',');
  if (!pairs) return [];

  try {
    const res = await fetch(`${OANDA_BASE}/v3/accounts/${config.accountId || '001-001-1234567-001'}/pricing?instruments=${encodeURIComponent(pairs)}`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      // Essayer sans account ID (endpoint public)
      const res2 = await fetch(`${OANDA_BASE}/v3/instruments/${encodeURIComponent(instruments[0])}/candles?count=1&price=M&granularity=S5`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res2.ok) throw new Error(`OANDA Error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    return data.prices || [];
  } catch {
    return [];
  }
}

// Récupération via endpoint public instruments (marche sans account ID complet)
async function fetchCandle(instrument: string): Promise<{ price: number; bid: number; ask: number; time: string } | null> {
  const config = getConfig();
  if (!config.apiKey) return null;

  const oandaSymbol = SYMBOL_MAP[instrument] || instrument;

  try {
    const res = await fetch(`${OANDA_BASE}/v3/instruments/${oandaSymbol}/candles?count=1&price=MBA&granularity=S5`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const candle = data.candles?.[0];
    if (!candle || !candle.complete) return null;

    const mid = candle.mid;
    const bid = candle.bid;
    const ask = candle.ask;

    return {
      price: parseFloat(mid.c),
      bid: parseFloat(bid.c),
      ask: parseFloat(ask.c),
      time: candle.time,
    };
  } catch {
    return null;
  }
}

// ─── Get Price for our symbols ──────────────────────────

export interface OandaPriceData {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  spread: number;
  source: string;
  timestamp: string;
}

export async function getOandaPrices(symbols: string[]): Promise<Record<string, OandaPriceData>> {
  const config = getConfig();
  if (!config.apiKey) return {};

  const result: Record<string, OandaPriceData> = {};

  // OANDA rate limit : 100 req/second, donc on peut faire séquentiel
  for (const symbol of symbols) {
    if (!SYMBOL_MAP[symbol]) continue; // Skip if not mapped

    const data = await fetchCandle(symbol);
    if (data) {
      result[symbol] = {
        symbol,
        price: data.price,
        bid: data.bid,
        ask: data.ask,
        spread: Math.round((data.ask - data.bid) * 100000) / 100000,
        source: 'OANDA-Live',
        timestamp: data.time,
      };
    }
  }

  return result;
}

// ─── Available OANDA Symbols ────────────────────────────

export function getOandaAvailableSymbols(): { symbol: string; name: string; category: string }[] {
  return [
    { symbol: 'EUR/USD', name: 'Euro / Dollar US', category: 'Forex Majeur' },
    { symbol: 'GBP/USD', name: 'Livre / Dollar US', category: 'Forex Majeur' },
    { symbol: 'USD/JPY', name: 'Dollar US / Yen', category: 'Forex Majeur' },
    { symbol: 'USD/CHF', name: 'Dollar US / Franc Suisse', category: 'Forex Majeur' },
    { symbol: 'AUD/USD', name: 'Dollar Aus / Dollar US', category: 'Forex Majeur' },
    { symbol: 'NZD/USD', name: 'Dollar NZ / Dollar US', category: 'Forex Majeur' },
    { symbol: 'EUR/GBP', name: 'Euro / Livre', category: 'Forex Croisé' },
    { symbol: 'EUR/JPY', name: 'Euro / Yen', category: 'Forex Croisé' },
    { symbol: 'GBP/JPY', name: 'Livre / Yen', category: 'Forex Croisé' },
    { symbol: 'XAU/USD', name: 'Or / Dollar US', category: 'Métaux' },
    { symbol: 'XAG/USD', name: 'Argent / Dollar US', category: 'Métaux' },
    { symbol: 'US30', name: 'Wall Street 30', category: 'Indices' },
    { symbol: 'SPX500', name: 'S&P 500', category: 'Indices' },
    { symbol: 'NAS100', name: 'Nasdaq 100', category: 'Indices' },
    { symbol: 'DE30', name: 'DAX 30', category: 'Indices' },
    { symbol: 'USOIL', name: 'WTI Crude Oil', category: 'Energie' },
  ];
}

// ─── Get historical candles ─────────────────────────────

export async function getOandaCandles(
  symbol: string,
  granularity: string = 'H1',
  count: number = 50
): Promise<{ time: string; open: number; high: number; low: number; close: number; volume: number }[]> {
  const config = getConfig();
  if (!config.apiKey) return [];

  const oandaSymbol = SYMBOL_MAP[symbol] || symbol;

  try {
    const res = await fetch(
      `${OANDA_BASE}/v3/instruments/${oandaSymbol}/candles?count=${count}&price=M&granularity=${granularity}`,
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    return (data.candles || [])
      .filter((c: any) => c.complete)
      .map((c: any) => ({
        time: c.time,
        open: parseFloat(c.mid.o),
        high: parseFloat(c.mid.h),
        low: parseFloat(c.mid.l),
        close: parseFloat(c.mid.c),
        volume: parseInt(c.volume),
      }));
  } catch {
    return [];
  }
}

// ─── Get account info (pour vérifier la connexion) ──────

export async function testOandaConnection(): Promise<{ success: boolean; message: string }> {
  const config = getConfig();
  if (!config.apiKey) {
    return { success: false, message: 'Clé API non configurée' };
  }

  try {
    const res = await fetch(`${OANDA_BASE}/v3/accounts`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      return { success: false, message: `Erreur OANDA: ${res.status}` };
    }

    const data = await res.json();
    const accounts = data.accounts || [];
    if (accounts.length > 0) {
      // Auto-save account ID si pas déjà configuré
      if (!config.accountId && accounts[0].id) {
        saveOandaConfig({ accountId: accounts[0].id });
      }
      return {
        success: true,
        message: `Connecté ! ${accounts.length} compte(s) trouvé(s). ID: ${accounts[0].id}`,
      };
    }
    return { success: false, message: 'Aucun compte trouvé' };
  } catch (err) {
    return { success: false, message: `Erreur: ${err instanceof Error ? err.message : 'inconnue'}` };
  }
}

// ─── WebSocket Streaming (pour prix temps réel) ─────────

let ws: WebSocket | null = null;

export function connectOandaStream(
  symbols: string[],
  onPrice: (data: OandaPriceData) => void
): () => void {
  const config = getConfig();
  if (!config.apiKey) return () => {};

  const oandaSymbols = symbols.map(s => SYMBOL_MAP[s]).filter(Boolean);
  if (oandaSymbols.length === 0) return () => {};

  try {
    ws = new WebSocket(`${OANDA_STREAM}/v3/prices/stream?instruments=${oandaSymbols.join('%2C')}&accountId=${config.accountId || '001-001-1234567-001'}`, [], {
      headers: { Authorization: `Bearer ${config.apiKey}` } as any,
    } as any);
  } catch {
    return () => {};
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'PRICE') {
        const symbol = REVERSE_MAP[data.instrument] || data.instrument;
        onPrice({
          symbol,
          price: (parseFloat(data.closeoutBid) + parseFloat(data.closeoutAsk)) / 2,
          bid: parseFloat(data.closeoutBid),
          ask: parseFloat(data.closeoutAsk),
          spread: parseFloat(data.closeoutAsk) - parseFloat(data.closeoutBid),
          source: 'OANDA-Stream',
          timestamp: data.time,
        });
      }
    } catch {
      // ignore
    }
  };

  return () => {
    ws?.close();
    ws = null;
  };
}
