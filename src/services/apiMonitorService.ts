/**
 * API Monitor Service
 * Enregistre les appels API réels : temps de réponse, statut, erreurs
 * Fournit des données live pour l'API Center
 */

export interface ApiCall {
  id: string;
  provider: string;
  endpoint: string;
  method: 'GET' | 'POST';
  status: number;
  statusText: string;
  responseTime: number; // ms
  timestamp: number;
  success: boolean;
  error?: string;
  dataSize?: number;
}

export interface ApiProviderStatus {
  id: string;
  name: string;
  category: 'market' | 'commodity' | 'crypto' | 'forex' | 'ai' | 'notifications' | 'payments';
  baseUrl: string;
  icon: string;
  // Live stats
  status: 'connected' | 'disconnected' | 'error' | 'limited';
  lastCallTime: number;
  lastResponseTime: number;
  avgResponseTime: number;
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  errorRate: number;
  // Limits
  rateLimitPerMinute: number;
  callsThisMinute: number;
  resetTime: number;
  // History
  recentCalls: ApiCall[];
}

const PROVIDERS_KEY = 'xtrendai_api_providers';
const CALLS_KEY = 'xtrendai_api_calls';
const MAX_RECENT_CALLS = 50;
const MAX_STORED_CALLS = 200;

// ─── Default Providers Configuration ────────────────────

export const API_PROVIDERS: Omit<ApiProviderStatus, 'recentCalls'>[] = [
  // Market Data
  { id: 'binance', name: 'Binance API', category: 'crypto', baseUrl: 'https://api.binance.com/api/v3', icon: 'zap', status: 'disconnected', lastCallTime: 0, lastResponseTime: 0, avgResponseTime: 0, totalCalls: 0, successCalls: 0, failedCalls: 0, errorRate: 0, rateLimitPerMinute: 1200, callsThisMinute: 0, resetTime: 0 },
  { id: 'coingecko', name: 'CoinGecko', category: 'crypto', baseUrl: 'https://api.coingecko.com/api/v3', icon: 'zap', status: 'disconnected', lastCallTime: 0, lastResponseTime: 0, avgResponseTime: 0, totalCalls: 0, successCalls: 0, failedCalls: 0, errorRate: 0, rateLimitPerMinute: 50, callsThisMinute: 0, resetTime: 0 },
  { id: 'frankfurter', name: 'Frankfurter (Forex)', category: 'forex', baseUrl: 'https://api.frankfurter.app', icon: 'globe', status: 'disconnected', lastCallTime: 0, lastResponseTime: 0, avgResponseTime: 0, totalCalls: 0, successCalls: 0, failedCalls: 0, errorRate: 0, rateLimitPerMinute: 60, callsThisMinute: 0, resetTime: 0 },
  { id: 'currencyapi', name: 'Currency-API (XAU)', category: 'commodity', baseUrl: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api', icon: 'trending-up', status: 'disconnected', lastCallTime: 0, lastResponseTime: 0, avgResponseTime: 0, totalCalls: 0, successCalls: 0, failedCalls: 0, errorRate: 0, rateLimitPerMinute: 100, callsThisMinute: 0, resetTime: 0 },
  { id: 'alphavantage', name: 'Alpha Vantage', category: 'market', baseUrl: 'https://www.alphavantage.co/query', icon: 'bar-chart', status: 'disconnected', lastCallTime: 0, lastResponseTime: 0, avgResponseTime: 0, totalCalls: 0, successCalls: 0, failedCalls: 0, errorRate: 0, rateLimitPerMinute: 5, callsThisMinute: 0, resetTime: 0 },
  { id: 'twelvedata', name: 'Twelve Data', category: 'market', baseUrl: 'https://api.twelvedata.com', icon: 'bar-chart', status: 'disconnected', lastCallTime: 0, lastResponseTime: 0, avgResponseTime: 0, totalCalls: 0, successCalls: 0, failedCalls: 0, errorRate: 0, rateLimitPerMinute: 8, callsThisMinute: 0, resetTime: 0 },
  { id: 'yahoo', name: 'Yahoo Finance', category: 'market', baseUrl: 'https://query1.finance.yahoo.com', icon: 'globe', status: 'disconnected', lastCallTime: 0, lastResponseTime: 0, avgResponseTime: 0, totalCalls: 0, successCalls: 0, failedCalls: 0, errorRate: 0, rateLimitPerMinute: 100, callsThisMinute: 0, resetTime: 0 },
  // AI
  { id: 'openai', name: 'OpenAI GPT-4o', category: 'ai', baseUrl: 'https://api.openai.com/v1', icon: 'bot', status: 'disconnected', lastCallTime: 0, lastResponseTime: 0, avgResponseTime: 0, totalCalls: 0, successCalls: 0, failedCalls: 0, errorRate: 0, rateLimitPerMinute: 500, callsThisMinute: 0, resetTime: 0 },
  { id: 'anthropic', name: 'Anthropic Claude', category: 'ai', baseUrl: 'https://api.anthropic.com', icon: 'bot', status: 'disconnected', lastCallTime: 0, lastResponseTime: 0, avgResponseTime: 0, totalCalls: 0, successCalls: 0, failedCalls: 0, errorRate: 0, rateLimitPerMinute: 400, callsThisMinute: 0, resetTime: 0 },
  { id: 'gemini', name: 'Google Gemini', category: 'ai', baseUrl: 'https://generativelanguage.googleapis.com', icon: 'bot', status: 'disconnected', lastCallTime: 0, lastResponseTime: 0, avgResponseTime: 0, totalCalls: 0, successCalls: 0, failedCalls: 0, errorRate: 0, rateLimitPerMinute: 60, callsThisMinute: 0, resetTime: 0 },
  // Notifications
  { id: 'telegram', name: 'Telegram Bot API', category: 'notifications', baseUrl: 'https://api.telegram.org', icon: 'message-square', status: 'disconnected', lastCallTime: 0, lastResponseTime: 0, avgResponseTime: 0, totalCalls: 0, successCalls: 0, failedCalls: 0, errorRate: 0, rateLimitPerMinute: 30, callsThisMinute: 0, resetTime: 0 },
  { id: 'sendgrid', name: 'SendGrid SMTP', category: 'notifications', baseUrl: 'https://api.sendgrid.com/v3', icon: 'mail', status: 'disconnected', lastCallTime: 0, lastResponseTime: 0, avgResponseTime: 0, totalCalls: 0, successCalls: 0, failedCalls: 0, errorRate: 0, rateLimitPerMinute: 100, callsThisMinute: 0, resetTime: 0 },
  // Payments
  { id: 'stripe', name: 'Stripe API', category: 'payments', baseUrl: 'https://api.stripe.com/v1', icon: 'credit-card', status: 'disconnected', lastCallTime: 0, lastResponseTime: 0, avgResponseTime: 0, totalCalls: 0, successCalls: 0, failedCalls: 0, errorRate: 0, rateLimitPerMinute: 100, callsThisMinute: 0, resetTime: 0 },
  { id: 'paypal', name: 'PayPal API', category: 'payments', baseUrl: 'https://api.paypal.com/v2', icon: 'credit-card', status: 'disconnected', lastCallTime: 0, lastResponseTime: 0, avgResponseTime: 0, totalCalls: 0, successCalls: 0, failedCalls: 0, errorRate: 0, rateLimitPerMinute: 100, callsThisMinute: 0, resetTime: 0 },
];

// ─── Storage ────────────────────────────────────────────

function loadProviders(): Record<string, ApiProviderStatus> {
  try {
    const raw = localStorage.getItem(PROVIDERS_KEY);
    const parsed: Record<string, ApiProviderStatus> = raw ? JSON.parse(raw) : {};
    // Merge with defaults to ensure all providers exist
    const merged: Record<string, ApiProviderStatus> = {};
    for (const def of API_PROVIDERS) {
      const existing = parsed[def.id];
      merged[def.id] = {
        ...def,
        ...(existing || {}),
        recentCalls: existing?.recentCalls || [],
      };
    }
    return merged;
  } catch {
    const map: Record<string, ApiProviderStatus> = {};
    for (const p of API_PROVIDERS) {
      map[p.id] = { ...p, recentCalls: [] };
    }
    return map;
  }
}

function saveProviders(providers: Record<string, ApiProviderStatus>) {
  // Don't save recentCalls to localStorage (too large) — keep in memory
  const slim: Record<string, Omit<ApiProviderStatus, 'recentCalls'>> = {};
  for (const [k, v] of Object.entries(providers)) {
    const { recentCalls: _, ...rest } = v;
    slim[k] = rest;
  }
  localStorage.setItem(PROVIDERS_KEY, JSON.stringify(slim));
}

function loadCalls(): ApiCall[] {
  try {
    const raw = localStorage.getItem(CALLS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCalls(calls: ApiCall[]) {
  localStorage.setItem(CALLS_KEY, JSON.stringify(calls.slice(-MAX_STORED_CALLS)));
}

// ─── Global State (in-memory for recent calls) ──────────

let providersMap: Record<string, ApiProviderStatus> = loadProviders();
let allCalls: ApiCall[] = loadCalls();

// ─── Record an API Call ─────────────────────────────────

export function recordApiCall(
  providerId: string,
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  responseTime: number,
  status: number,
  error?: string,
  dataSize?: number
): ApiCall {
  const call: ApiCall = {
    id: `call-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    provider: providerId,
    endpoint,
    method,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : status >= 400 ? 'Error' : 'Unknown',
    responseTime,
    timestamp: Date.now(),
    success: status >= 200 && status < 300,
    error,
    dataSize,
  };

  // Update provider stats
  const p = providersMap[providerId];
  if (p) {
    const now = Date.now();
    // Reset per-minute counter if minute passed
    if (now > p.resetTime) {
      p.callsThisMinute = 0;
      p.resetTime = now + 60000;
    }
    p.callsThisMinute++;
    p.lastCallTime = now;
    p.lastResponseTime = responseTime;
    p.totalCalls++;
    if (call.success) {
      p.successCalls++;
      p.status = 'connected';
    } else {
      p.failedCalls++;
      if (status === 429) p.status = 'limited';
      else if (status >= 500) p.status = 'error';
      else p.status = 'disconnected';
    }
    p.errorRate = p.totalCalls > 0 ? (p.failedCalls / p.totalCalls) * 100 : 0;
    // Rolling average
    p.avgResponseTime = p.avgResponseTime === 0
      ? responseTime
      : Math.round(p.avgResponseTime * 0.9 + responseTime * 0.1);

    // Update recent calls
    p.recentCalls = [call, ...p.recentCalls].slice(0, MAX_RECENT_CALLS);
  }

  // Global calls
  allCalls = [call, ...allCalls].slice(0, MAX_STORED_CALLS);

  // Persist
  saveProviders(providersMap);
  saveCalls(allCalls);

  return call;
}

// ─── Get Provider Status ────────────────────────────────

export function getProviderStatus(providerId: string): ApiProviderStatus | null {
  return providersMap[providerId] || null;
}

export function getAllProviderStatuses(): ApiProviderStatus[] {
  return Object.values(providersMap);
}

export function getProvidersByCategory(category: string): ApiProviderStatus[] {
  return Object.values(providersMap).filter(p => p.category === category);
}

// ─── Get Recent Calls ───────────────────────────────────

export function getRecentCalls(providerId?: string, limit: number = 20): ApiCall[] {
  if (providerId) {
    return providersMap[providerId]?.recentCalls.slice(0, limit) || [];
  }
  return allCalls.slice(0, limit);
}

export function getAllCalls(): ApiCall[] {
  return allCalls;
}

// ─── Get Summary Stats ──────────────────────────────────

export interface ApiSummary {
  totalProviders: number;
  connected: number;
  disconnected: number;
  error: number;
  limited: number;
  totalCallsToday: number;
  totalCallsThisHour: number;
  avgResponseTime: number;
  overallErrorRate: number;
  activeProviders: string[];
}

export function getApiSummary(): ApiSummary {
  const now = Date.now();
  const hourAgo = now - 3600000;
  const dayAgo = now - 86400000;

  const all = Object.values(providersMap);
  const callsToday = allCalls.filter(c => c.timestamp > dayAgo);
  const callsHour = allCalls.filter(c => c.timestamp > hourAgo);

  const avgRt = all.length > 0
    ? Math.round(all.reduce((s, p) => s + p.avgResponseTime, 0) / all.filter(p => p.avgResponseTime > 0).length || 1)
    : 0;

  return {
    totalProviders: all.length,
    connected: all.filter(p => p.status === 'connected').length,
    disconnected: all.filter(p => p.status === 'disconnected').length,
    error: all.filter(p => p.status === 'error').length,
    limited: all.filter(p => p.status === 'limited').length,
    totalCallsToday: callsToday.length,
    totalCallsThisHour: callsHour.length,
    avgResponseTime: avgRt,
    overallErrorRate: all.length > 0 ? all.reduce((s, p) => s + p.errorRate, 0) / all.length : 0,
    activeProviders: all.filter(p => p.status === 'connected').map(p => p.name),
  };
}

// ─── Reset Stats ────────────────────────────────────────

export function resetApiStats() {
  providersMap = {};
  for (const p of API_PROVIDERS) {
    providersMap[p.id] = { ...p, recentCalls: [] };
  }
  allCalls = [];
  saveProviders(providersMap);
  saveCalls([]);
}

// ─── Initialize providers on load ───────────────────────

// Ensure providers are initialized
if (Object.keys(providersMap).length === 0) {
  for (const p of API_PROVIDERS) {
    providersMap[p.id] = { ...p, recentCalls: [] };
  }
}
