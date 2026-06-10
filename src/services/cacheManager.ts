/**
 * Cache Manager — Cache intelligent localStorage
 * Evite les depassements de quota, accelere l'affichage,
 * et indique clairement quand une donnee vient du cache.
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  provider: string;
  dataSource: 'live' | 'cached' | 'fallback';
  ttlSeconds: number;
}

const CACHE_PREFIX = 'xtcache_';

export function cacheSet<T>(key: string, entry: CacheEntry<T>): void {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
  } catch (e) {
    // Storage full — clear old entries
    cacheClearOld(600); // Clear entries older than 10 min
    try {
      localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
    } catch { /* still full, skip */ }
  }
}

export function cacheGet<T>(key: string, maxAgeSeconds?: number): CacheEntry<T> | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    const age = (Date.now() - entry.timestamp) / 1000;
    const maxAge = maxAgeSeconds || entry.ttlSeconds || 300;
    if (age > maxAge) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }
    return { ...entry, dataSource: 'cached' };
  } catch { return null; }
}

export function cacheClearOld(maxAgeSeconds: number): void {
  const now = Date.now();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      try {
        const entry = JSON.parse(localStorage.getItem(key) || '{}');
        if ((now - entry.timestamp) / 1000 > maxAgeSeconds) {
          localStorage.removeItem(key);
        }
      } catch { /* skip */ }
    }
  }
}

export function cacheClearAll(): void {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) keys.push(key);
  }
  keys.forEach(k => localStorage.removeItem(k));
}

export function cacheHas(key: string): boolean {
  return localStorage.getItem(`${CACHE_PREFIX}${key}`) !== null;
}

export function cacheDelete(key: string): void {
  localStorage.removeItem(`${CACHE_PREFIX}${key}`);
}

// Cache key helpers
export function priceCacheKey(symbol: string, provider: string): string {
  return `price_${symbol}_${provider}`;
}

export function newsCacheKey(newsId: string): string {
  return `news_${newsId}`;
}

export function candlesCacheKey(symbol: string, tf: string): string {
  return `candles_${symbol}_${tf}`;
}
