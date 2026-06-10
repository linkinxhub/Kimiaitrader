/**
 * API Provider Manager
 * Architecture centralisee : configuration, registration, fallback,
 * health monitoring, et proxy de tous les providers de donnees.
 *
 * Aucune page ne contacte directement une API externe.
 * Tout passe par ce manager.
 */

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export type ProviderType = 'crypto' | 'forex' | 'metals' | 'stocks' | 'indices' | 'news' | 'calendar' | 'websocket';
export type ProviderStatus = 'active' | 'error' | 'quota_exceeded' | 'disabled' | 'unconfigured';
export type DataSource = 'live' | 'cached' | 'delayed' | 'fallback' | 'unavailable';

export interface ApiProvider {
  id: string;
  name: string;
  slug: string;
  type: ProviderType[];
  baseUrl: string;
  wsUrl?: string;
  apiKey?: string;
  apiSecret?: string;
  isActive: boolean;
  isPrimary: boolean;
  isFallback: boolean;
  priority: number; // 1 = highest
  rateLimitPerMinute: number;
  supportsRest: boolean;
  supportsWs: boolean;
  status: ProviderStatus;
  lastError?: string;
  lastSuccessAt?: number;
  lastTestedAt?: number;
  latencyMs?: number;
  dailyQuota?: number;
  requestsToday: number;
  createdAt: number;
}

export interface ApiCallLog {
  id: string;
  providerId: string;
  endpoint: string;
  symbol?: string;
  status: 'success' | 'error' | 'timeout' | 'quota_exceeded';
  responseTimeMs: number;
  errorMessage?: string;
  dataSource: DataSource;
  timestamp: number;
}

export interface NormalizedMarketData {
  symbol: string;
  name: string;
  market: string;
  category: string;
  price: number;
  bid: number;
  ask: number;
  spread: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
  timestamp: number;
  source: string;
  provider: string;
  isLive: boolean;
  isDelayed: boolean;
  isCached: boolean;
  latency: number;
  timeframe: string;
  lastUpdate: number;
  dataSource: DataSource;
}

// ═══════════════════════════════════════════════════════════
// STORAGE KEYS
// ═══════════════════════════════════════════════════════════

const PROVIDERS_KEY = 'xtrendai_api_providers';
const LOGS_KEY = 'xtrendai_api_logs';
const SETTINGS_KEY = 'xtrendai_api_settings';

// ═══════════════════════════════════════════════════════════
// DEFAULT PROVIDERS (pre-configured, key to be added by admin)
// ═══════════════════════════════════════════════════════════

const DEFAULT_PROVIDERS: Omit<ApiProvider, 'apiKey' | 'apiSecret'>[] = [
  {
    id: 'prov-binance', name: 'Binance', slug: 'binance',
    type: ['crypto', 'websocket'], baseUrl: 'https://api.binance.com/api/v3',
    wsUrl: 'wss://stream.binance.com:9443/ws',
    isActive: true, isPrimary: true, isFallback: false, priority: 1,
    rateLimitPerMinute: 1200, supportsRest: true, supportsWs: true,
    status: 'active', requestsToday: 0, createdAt: Date.now(),
  },
  {
    id: 'prov-coingecko', name: 'CoinGecko', slug: 'coingecko',
    type: ['crypto'], baseUrl: 'https://api.coingecko.com/api/v3',
    isActive: true, isPrimary: false, isFallback: true, priority: 2,
    rateLimitPerMinute: 30, supportsRest: true, supportsWs: false,
    status: 'active', requestsToday: 0, createdAt: Date.now(),
  },
  {
    id: 'prov-finnhub', name: 'Finnhub', slug: 'finnhub',
    type: ['stocks', 'indices', 'crypto', 'news', 'calendar', 'websocket'],
    baseUrl: 'https://finnhub.io/api/v1',
    wsUrl: 'wss://ws.finnhub.io',
    isActive: true, isPrimary: true, isFallback: false, priority: 1,
    rateLimitPerMinute: 60, supportsRest: true, supportsWs: true,
    status: 'unconfigured', requestsToday: 0, createdAt: Date.now(),
  },
  {
    id: 'prov-frankfurter', name: 'Frankfurter', slug: 'frankfurter',
    type: ['forex'], baseUrl: 'https://api.frankfurter.app',
    isActive: true, isPrimary: true, isFallback: false, priority: 1,
    rateLimitPerMinute: 100, supportsRest: true, supportsWs: false,
    status: 'active', requestsToday: 0, createdAt: Date.now(),
  },
  {
    id: 'prov-currencyapi', name: 'Currency-API', slug: 'currencyapi',
    type: ['metals'], baseUrl: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies',
    isActive: true, isPrimary: true, isFallback: false, priority: 1,
    rateLimitPerMinute: 100, supportsRest: true, supportsWs: false,
    status: 'active', requestsToday: 0, createdAt: Date.now(),
  },
  {
    id: 'prov-alphavantage', name: 'Alpha Vantage', slug: 'alphavantage',
    type: ['stocks', 'indices', 'metals', 'news'],
    baseUrl: 'https://www.alphavantage.co/query',
    isActive: true, isPrimary: false, isFallback: true, priority: 3,
    rateLimitPerMinute: 5, supportsRest: true, supportsWs: false,
    status: 'unconfigured', requestsToday: 0, createdAt: Date.now(),
  },
];

// ═══════════════════════════════════════════════════════════
// API SETTINGS
// ═══════════════════════════════════════════════════════════

export interface ApiSettings {
  enableLiveData: boolean;
  enableWebsocket: boolean;
  enableFallback: boolean;
  enableCache: boolean;
  showDataSource: boolean;
  showLastUpdate: boolean;
  preventFakeData: boolean;
  autoDisableFailed: boolean;
  notifyAdminOnError: boolean;
  encryptKeys: boolean;
  useBackendProxy: boolean;
  refreshInterval: number; // seconds
  cacheDuration: number; // seconds
  staleThreshold: number; // seconds
  disableDemoData: boolean;
  allowMockData: boolean;
  requireSourceUrl: boolean;
  requireTimestamp: boolean;
  preventAIDecisionFromDemo: boolean;
  timezone: string;
}

export const DEFAULT_API_SETTINGS: ApiSettings = {
  enableLiveData: true,
  enableWebsocket: true,
  enableFallback: true,
  enableCache: true,
  showDataSource: true,
  showLastUpdate: true,
  preventFakeData: true,
  autoDisableFailed: true,
  notifyAdminOnError: true,
  encryptKeys: true,
  useBackendProxy: false,
  refreshInterval: 30,
  cacheDuration: 300,
  staleThreshold: 60,
  disableDemoData: true,
  allowMockData: false,
  requireSourceUrl: true,
  requireTimestamp: true,
  preventAIDecisionFromDemo: true,
  timezone: 'Europe/Brussels',
};

// ═══════════════════════════════════════════════════════════
// KEY OBFUSCATION (lightweight — NOT secure, but better than plaintext)
// ═══════════════════════════════════════════════════════════

function obfuscateKey(key: string): string {
  if (!key) return '';
  try {
    return btoa(key.split('').reverse().join('') + '_xtrendai_salt');
  } catch { return key; }
}

function deobfuscKey(obf: string): string {
  if (!obf) return '';
  try {
    const decoded = atob(obf);
    return decoded.replace('_xtrendai_salt', '').split('').reverse().join('');
  } catch { return obf; }
}

// ═══════════════════════════════════════════════════════════
// PROVIDER CRUD
// ═══════════════════════════════════════════════════════════

export function getProviders(): ApiProvider[] {
  try {
    const raw = localStorage.getItem(PROVIDERS_KEY);
    if (raw) {
      const providers: ApiProvider[] = JSON.parse(raw);
      // Deobfuscate keys for use
      return providers.map(p => ({
        ...p,
        apiKey: p.apiKey ? deobfuscKey(p.apiKey) : undefined,
        apiSecret: p.apiSecret ? deobfuscKey(p.apiSecret) : undefined,
      }));
    }
  } catch { /* ignore */ }
  // Return defaults with empty keys
  return DEFAULT_PROVIDERS.map(d => ({ ...d, apiKey: undefined, apiSecret: undefined }));
}

export function saveProviders(providers: ApiProvider[]): void {
  // Obfuscate keys before saving
  const toSave = providers.map(p => ({
    ...p,
    apiKey: p.apiKey ? obfuscateKey(p.apiKey) : undefined,
    apiSecret: p.apiSecret ? obfuscateKey(p.apiSecret) : undefined,
  }));
  localStorage.setItem(PROVIDERS_KEY, JSON.stringify(toSave));
}

export function getProvider(id: string): ApiProvider | undefined {
  return getProviders().find(p => p.id === id);
}

export function updateProvider(id: string, updates: Partial<ApiProvider>): void {
  const providers = getProviders();
  const idx = providers.findIndex(p => p.id === id);
  if (idx === -1) return;
  providers[idx] = { ...providers[idx], ...updates, lastUpdatedAt: Date.now() };
  saveProviders(providers);
}

export function addProvider(provider: Omit<ApiProvider, 'id' | 'createdAt' | 'requestsToday'>): void {
  const providers = getProviders();
  const newProvider: ApiProvider = {
    ...provider,
    id: `prov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
    requestsToday: 0,
  };
  providers.push(newProvider);
  saveProviders(providers);
}

export function removeProvider(id: string): void {
  const providers = getProviders().filter(p => p.id !== id);
  saveProviders(providers);
}

export function resetProviders(): void {
  localStorage.removeItem(PROVIDERS_KEY);
}

// ═══════════════════════════════════════════════════════════
// SETTINGS CRUD
// ═══════════════════════════════════════════════════════════

export function getApiSettings(): ApiSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_API_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_API_SETTINGS };
}

export function saveApiSettings(settings: Partial<ApiSettings>): void {
  const current = getApiSettings();
  const merged = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
}

export function resetApiSettings(): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_API_SETTINGS));
}

// ═══════════════════════════════════════════════════════════
// PROVIDER SELECTION (primary / fallback chain)
// ═══════════════════════════════════════════════════════════

export function getActiveProvidersFor(type: ProviderType): ApiProvider[] {
  return getProviders()
    .filter(p => p.isActive && p.type.includes(type) && p.status !== 'disabled' && p.status !== 'unconfigured')
    .sort((a, b) => {
      // Primary first, then by priority
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      return a.priority - b.priority;
    });
}

export function getPrimaryProvider(type: ProviderType): ApiProvider | undefined {
  return getActiveProvidersFor(type)[0];
}

export function getFallbackChain(type: ProviderType): ApiProvider[] {
  const active = getActiveProvidersFor(type);
  return active.length > 1 ? active.slice(1) : [];
}

// ═══════════════════════════════════════════════════════════
// API CALL LOGGING
// ═══════════════════════════════════════════════════════════

export function logApiCall(log: Omit<ApiCallLog, 'id' | 'timestamp'>): void {
  const logs = getApiLogs();
  const newLog: ApiCallLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
  };
  logs.unshift(newLog);
  // Keep last 200 logs
  if (logs.length > 200) logs.length = 200;
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

export function getApiLogs(): ApiCallLog[] {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function clearApiLogs(): void {
  localStorage.removeItem(LOGS_KEY);
}

// ═══════════════════════════════════════════════════════════
// FALLBACK FETCH ENGINE
// ═══════════════════════════════════════════════════════════

interface FallbackResult<T> {
  data: T | null;
  provider: string;
  dataSource: DataSource;
  latency: number;
  error?: string;
}

export async function fallbackFetch<T>(
  type: ProviderType,
  fetcher: (provider: ApiProvider) => Promise<T | null>,
  options: { timeoutMs?: number; maxRetries?: number } = {}
): Promise<FallbackResult<T>> {
  const { timeoutMs = 10000 } = options;
  const settings = getApiSettings();
  const providers = getActiveProvidersFor(type);

  if (providers.length === 0) {
    return { data: null, provider: 'none', dataSource: 'unavailable', latency: 0, error: 'No configured provider' };
  }

  for (const provider of providers) {
    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const data = await fetcher(provider);
      clearTimeout(timeout);

      const latency = Math.round(performance.now() - start);

      if (data) {
        // Update provider status
        updateProvider(provider.id, {
          status: 'active',
          lastSuccessAt: Date.now(),
          latencyMs: latency,
          requestsToday: (provider.requestsToday || 0) + 1,
        });

        logApiCall({
          providerId: provider.id,
          endpoint: provider.baseUrl,
          status: 'success',
          responseTimeMs: latency,
          dataSource: provider.isPrimary ? 'live' : 'fallback',
        });

        return {
          data,
          provider: provider.name,
          dataSource: provider.isPrimary ? 'live' : 'fallback',
          latency,
        };
      }
    } catch (e) {
      const latency = Math.round(performance.now() - start);
      const errorMsg = e instanceof Error ? e.message : 'Unknown error';

      // Update provider status
      const newStatus: ProviderStatus = errorMsg.includes('quota') ? 'quota_exceeded' :
        errorMsg.includes('401') || errorMsg.includes('403') ? 'error' :
        settings.autoDisableFailed && provider.status !== 'active' ? 'disabled' : 'error';

      updateProvider(provider.id, {
        status: newStatus,
        lastError: errorMsg,
      });

      logApiCall({
        providerId: provider.id,
        endpoint: provider.baseUrl,
        status: errorMsg.includes('quota') ? 'quota_exceeded' : 'error',
        responseTimeMs: latency,
        errorMessage: errorMsg,
        dataSource: 'unavailable',
      });

      // Continue to next provider in chain
      continue;
    }
  }

  return {
    data: null,
    provider: providers[0]?.name || 'none',
    dataSource: 'unavailable',
    latency: 0,
    error: 'All providers failed',
  };
}

// ═══════════════════════════════════════════════════════════
// DATA FRESHNESS
// ═══════════════════════════════════════════════════════════

export function getDataFreshness(timestamp: number): {
  ageSeconds: number;
  isStale: boolean;
  isFresh: boolean;
  label: string;
  color: string;
} {
  const settings = getApiSettings();
  const ageSeconds = Math.floor((Date.now() - timestamp) / 1000);
  const isStale = ageSeconds > settings.staleThreshold;
  const isFresh = ageSeconds < 15;

  let label: string;
  let color: string;

  if (ageSeconds < 5) { label = 'LIVE'; color = 'text-emerald-400'; }
  else if (ageSeconds < 30) { label = `${ageSeconds}s`; color = 'text-emerald-400'; }
  else if (ageSeconds < 60) { label = `${ageSeconds}s`; color = 'text-amber-400'; }
  else if (ageSeconds < 300) { label = `${Math.floor(ageSeconds / 60)}m`; color = 'text-amber-400'; }
  else { label = `${Math.floor(ageSeconds / 60)}m`; color = 'text-red-400'; }

  return { ageSeconds, isStale, isFresh, label, color };
}

// ═══════════════════════════════════════════════════════════
// SUMMARY STATS
// ═══════════════════════════════════════════════════════════

export function getApiStats(): {
  totalProviders: number;
  activeProviders: number;
  providersInError: number;
  avgLatency: number;
  totalRequestsToday: number;
  wsConnected: boolean;
  lastDataAt: number | null;
  fallbackUsed: number;
} {
  const providers = getProviders();
  const logs = getApiLogs().filter(l => l.timestamp > Date.now() - 86400000);

  const active = providers.filter(p => p.isActive && p.status === 'active');
  const errors = providers.filter(p => p.status === 'error' || p.status === 'quota_exceeded');
  const latencies = providers.filter(p => p.latencyMs).map(p => p.latencyMs!);
  const fallbackLogs = logs.filter(l => l.dataSource === 'fallback');
  const successLogs = logs.filter(l => l.status === 'success');

  return {
    totalProviders: providers.length,
    activeProviders: active.length,
    providersInError: errors.length,
    avgLatency: latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0,
    totalRequestsToday: providers.reduce((s, p) => s + (p.requestsToday || 0), 0),
    wsConnected: active.some(p => p.supportsWs),
    lastDataAt: successLogs.length > 0 ? successLogs[0].timestamp : null,
    fallbackUsed: fallbackLogs.length,
  };
}

// ═══════════════════════════════════════════════════════════
// SYMBOL MAPPER
// ═══════════════════════════════════════════════════════════

export interface SymbolMapping {
  internal: string;
  binance?: string;
  coingecko?: string;
  finnhub?: string;
  frankfurter?: { from: string; to: string };
  alphavantage?: string;
  currencyapi?: { from: string; to: string };
}

export const SYMBOL_MAP: SymbolMapping[] = [
  { internal: 'BTC/USD', binance: 'BTCUSDT', coingecko: 'bitcoin', finnhub: 'BINANCE:BTCUSDT' },
  { internal: 'ETH/USD', binance: 'ETHUSDT', coingecko: 'ethereum', finnhub: 'BINANCE:ETHUSDT' },
  { internal: 'SOL/USD', binance: 'SOLUSDT', coingecko: 'solana', finnhub: 'BINANCE:SOLUSDT' },
  { internal: 'XRP/USD', binance: 'XRPUSDT', coingecko: 'ripple', finnhub: 'BINANCE:XRPUSDT' },
  { internal: 'BNB/USD', binance: 'BNBUSDT', coingecko: 'binancecoin', finnhub: 'BINANCE:BNBUSDT' },
  { internal: 'ADA/USD', binance: 'ADAUSDT', coingecko: 'cardano', finnhub: 'BINANCE:ADAUSDT' },
  { internal: 'DOGE/USD', binance: 'DOGEUSDT', coingecko: 'dogecoin', finnhub: 'BINANCE:DOGEUSDT' },
  { internal: 'AVAX/USD', binance: 'AVAXUSDT', coingecko: 'avalanche-2', finnhub: 'BINANCE:AVAXUSDT' },
  { internal: 'DOT/USD', binance: 'DOTUSDT', coingecko: 'polkadot', finnhub: 'BINANCE:DOTUSDT' },
  { internal: 'LINK/USD', binance: 'LINKUSDT', coingecko: 'chainlink', finnhub: 'BINANCE:LINKUSDT' },
  { internal: 'LTC/USD', binance: 'LTCUSDT', coingecko: 'litecoin', finnhub: 'BINANCE:LTCUSDT' },
  { internal: 'EUR/USD', frankfurter: { from: 'EUR', to: 'USD' }, finnhub: 'OANDA:EUR_USD' },
  { internal: 'GBP/USD', frankfurter: { from: 'GBP', to: 'USD' }, finnhub: 'OANDA:GBP_USD' },
  { internal: 'USD/JPY', frankfurter: { from: 'USD', to: 'JPY' }, finnhub: 'OANDA:USD_JPY' },
  { internal: 'USD/CHF', frankfurter: { from: 'USD', to: 'CHF' }, finnhub: 'OANDA:USD_CHF' },
  { internal: 'USD/CAD', frankfurter: { from: 'USD', to: 'CAD' }, finnhub: 'OANDA:USD_CAD' },
  { internal: 'AUD/USD', frankfurter: { from: 'AUD', to: 'USD' }, finnhub: 'OANDA:AUD_USD' },
  { internal: 'XAU/USD', currencyapi: { from: 'usd', to: 'xau' }, alphavantage: 'XAU', finnhub: 'OANDA:XAU_USD' },
  { internal: 'XAG/USD', currencyapi: { from: 'usd', to: 'xag' }, alphavantage: 'XAG', finnhub: 'OANDA:XAG_USD' },
  { internal: 'NAS100', finnhub: '^IXIC', alphavantage: 'IXIC' },
  { internal: 'SPX500', finnhub: '^GSPC', alphavantage: 'SPX' },
  { internal: 'US30', finnhub: '^DJI', alphavantage: 'DJI' },
  { internal: 'DE40', finnhub: '^GDAXI', alphavantage: 'GDAXI' },
  { internal: 'AAPL', finnhub: 'AAPL', alphavantage: 'AAPL' },
  { internal: 'TSLA', finnhub: 'TSLA', alphavantage: 'TSLA' },
  { internal: 'NVDA', finnhub: 'NVDA', alphavantage: 'NVDA' },
  { internal: 'MSFT', finnhub: 'MSFT', alphavantage: 'MSFT' },
  { internal: 'WTI', finnhub: 'USO' },
  { internal: 'DXY', finnhub: 'UUP' },
];

export function getSymbolForProvider(internalSymbol: string, providerSlug: string): string | null {
  const mapping = SYMBOL_MAP.find(m => m.internal === internalSymbol);
  if (!mapping) return null;

  switch (providerSlug) {
    case 'binance': return mapping.binance || null;
    case 'coingecko': return mapping.coingecko || null;
    case 'finnhub': return mapping.finnhub || null;
    case 'frankfurter': return mapping.frankfurter ? `${mapping.frankfurter.from}_${mapping.frankfurter.to}` : null;
    case 'alphavantage': return mapping.alphavantage || null;
    case 'currencyapi': return mapping.currencyapi ? `${mapping.currencyapi.from}_${mapping.currencyapi.to}` : null;
    default: return mapping.internal;
  }
}

export function getFrankfurterConfig(internalSymbol: string): { from: string; to: string } | null {
  return SYMBOL_MAP.find(m => m.internal === internalSymbol)?.frankfurter || null;
}

export function getCurrencyApiConfig(internalSymbol: string): { from: string; to: string } | null {
  return SYMBOL_MAP.find(m => m.internal === internalSymbol)?.currencyapi || null;
}
