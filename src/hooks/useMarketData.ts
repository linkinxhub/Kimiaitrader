/**
 * useMarketData — Donnees de marché avec stabilite anti-scintillement
 *
 * Regles :
 * - Pas de setLoading(true) apres le premier chargement
 * - Updates incrementales (ne remplace que les prix modifies)
 * - Refresh toutes les 30 secondes
 * - Pas de rechargement complet du state
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAllPrices, fetchCandlesForAsset, type PriceData, type CandleData, type AssetSymbol } from '@/services/marketApi';
import { isDemoMode, DEMO_PRICES, DEMO_CANDLES } from '@/services/demoData';
import { publishPrices } from '@/services/pricePublisher';

const REFRESH_INTERVAL_MS = 30000; // 30s pour dashboard
const CANDLE_REFRESH_INTERVAL_MS = 60000; // 60s pour bougies

// Fallback prices when all APIs fail — ensures the UI never shows "—"
// Updated: 2026-06-08 — synced with current market prices
const FALLBACK_PRICE_DATA: Record<string, PriceData> = {
  'XAU/USD': { price: 4470.00, change24hPercent: 0.12, high24h: 4485.00, low24h: 4455.00, volume24h: 125000, source: 'fallback', lastUpdate: Date.now() },
  'BTC/USD': { price: 67500.00, change24hPercent: 1.25, high24h: 68200.00, low24h: 66800.00, volume24h: 28500000000, source: 'fallback', lastUpdate: Date.now() },
  'ETH/USD': { price: 3520.00, change24hPercent: 0.85, high24h: 3560.00, low24h: 3480.00, volume24h: 15200000000, source: 'fallback', lastUpdate: Date.now() },
  'EUR/USD': { price: 1.0850, change24hPercent: -0.05, high24h: 1.0870, low24h: 1.0830, volume24h: 85000000000, source: 'fallback', lastUpdate: Date.now() },
  'GBP/USD': { price: 1.2750, change24hPercent: 0.08, high24h: 1.2780, low24h: 1.2720, volume24h: 42000000000, source: 'fallback', lastUpdate: Date.now() },
  'USD/JPY': { price: 149.50, change24hPercent: -0.12, high24h: 150.00, low24h: 149.10, volume24h: 68000000000, source: 'fallback', lastUpdate: Date.now() },
  'XAG/USD': { price: 22.50, change24hPercent: 0.35, high24h: 22.65, low24h: 22.35, volume24h: 45000000, source: 'fallback', lastUpdate: Date.now() },
  'NAS100': { price: 20150.00, change24hPercent: 0.45, high24h: 20250.00, low24h: 20050.00, volume24h: 5200000000, source: 'fallback', lastUpdate: Date.now() },
  'SPX500': { price: 6144.00, change24hPercent: 0.32, high24h: 6170.00, low24h: 6118.00, volume24h: 4800000000, source: 'fallback', lastUpdate: Date.now() },
};

// ─── useMarketData — Prix avec updates incrementales ────

export function useMarketData() {
  const isDemo = isDemoMode();
  const [prices, setPrices] = useState<Record<string, PriceData>>(isDemo ? DEMO_PRICES : FALLBACK_PRICE_DATA);
  const [loading, setLoading] = useState(!isDemo);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const hasLoadedRef = useRef(true); // fallback prices loaded immediately
  const isRefreshingRef = useRef(false); // evite les appels parallels
  const pricesRef = useRef<Record<string, PriceData>>(isDemo ? DEMO_PRICES : FALLBACK_PRICE_DATA); // always current prices

  const refresh = useCallback(async () => {
    // Demo mode
    if (isDemoMode()) {
      setPrices(DEMO_PRICES);
      setLastUpdate(new Date());
      setLoading(false);
      return;
    }

    // Evite les appels paralleles
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    // PAS de setLoading(true) apres le premier chargement
    if (!hasLoadedRef.current) {
      setLoading(true);
    }
    setError(null);

    try {
      // Timeout 10s — prevents indefinite blocking when APIs are unreachable
      const fetchWithTimeout = Promise.race([
        fetchAllPrices(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('API Timeout')), 10000)
        ),
      ]);
      const data = await fetchWithTimeout;

      // Build updated prices map using ref (avoids stale closure)
      let updated: Record<string, PriceData>;
      const currentPrices = pricesRef.current;
      // Filter out invalid entries (price <= 0 or null)
      const validEntries = Object.entries(data).filter(([, d]) => d && d.price > 0);
      if (validEntries.length === 0) {
        updated = { ...FALLBACK_PRICE_DATA };
      } else {
        updated = { ...currentPrices };
        for (const [symbol, newData] of validEntries) {
          const oldData = currentPrices[symbol];
          if (!oldData ||
              oldData.price !== newData.price ||
              oldData.change24hPercent !== newData.change24hPercent) {
            updated[symbol] = newData;
          }
        }
        // Merge fallback for missing symbols
        for (const [symbol, fallbackData] of Object.entries(FALLBACK_PRICE_DATA)) {
          if (!updated[symbol] || updated[symbol].price <= 0) {
            updated[symbol] = fallbackData;
          }
        }
      }

      setPrices(updated);
      pricesRef.current = updated;
      setLastUpdate(new Date());
      hasLoadedRef.current = true;

      // Publish prices to global state for useLiveAlerts and PriceAlerts
      publishPrices(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
      // Garde les anciennes donnees en cas d'erreur (stale-while-revalidate)
      // Si aucune donnée n'a jamais été chargée, injecte des fallback prices
      const current = pricesRef.current;
      if (Object.keys(current).length === 0) {
        setPrices(FALLBACK_PRICE_DATA);
        pricesRef.current = FALLBACK_PRICE_DATA;
        publishPrices(FALLBACK_PRICE_DATA);
      }
    } finally {
      setLoading(false);
      isRefreshingRef.current = false;
    }
  }, []);

  useEffect(() => {
    refresh();
    if (!isDemoMode()) {
      const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
      return () => clearInterval(interval);
    }
  }, [refresh]);

  return { prices, loading, error, lastUpdate, refresh };
}

// ─── useCandles — Bougies avec stabilite anti-scintillement ─

export function useCandles(symbol: AssetSymbol, timeframe: string = '1h', anchorPrice?: number) {
  const isDemo = isDemoMode();
  const initialCandles = isDemo ? (DEMO_CANDLES[symbol] || []) : [];
  const [candles, setCandles] = useState<CandleData[]>(initialCandles);
  const [loading, setLoading] = useState(!isDemo);
  const hasLoadedRef = useRef(isDemo);
  const isRefreshingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (isDemoMode()) {
      setCandles(DEMO_CANDLES[symbol] || []);
      setLoading(false);
      return;
    }

    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    if (!hasLoadedRef.current) setLoading(true);

    try {
      // Timeout 8s per asset
      const fetchWithTimeout = Promise.race([
        fetchCandlesForAsset(symbol, timeframe, anchorPrice),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Candle Timeout')), 8000)
        ),
      ]);
      const data = await fetchWithTimeout;
      // Update seulement si les donnees sont differentes
      setCandles(prev => {
        if (prev.length === 0 || data.length === 0) return data;
        // Compare le dernier close
        if (Math.abs(prev[prev.length - 1].close - data[data.length - 1].close) < 0.0001) {
          return prev; // Pas de changement significatif
        }
        return data;
      });
      hasLoadedRef.current = true;
    } catch {
      // Garde les anciennes bougies en cas d'erreur
    } finally {
      setLoading(false);
      isRefreshingRef.current = false;
    }
  }, [symbol, timeframe, anchorPrice]);

  useEffect(() => {
    refresh();
    if (!isDemoMode()) {
      const interval = setInterval(refresh, CANDLE_REFRESH_INTERVAL_MS);
      return () => clearInterval(interval);
    }
  }, [refresh]);

  return { candles, loading, refresh };
}
