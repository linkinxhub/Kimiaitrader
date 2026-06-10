/**
 * Hook: useVitrineData
 * Donnees live pour le site vitrine — leger, pas d'auth requise
 * 
 * REGLE: Les donnees du vitrine s'actualisent simultanement avec l'admin panel.
 * Ce hook est concu pour etre utilise sur la Landing Page (page publique).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchVitrinePrices,
  getVitrineStats,
  getVitrineSignals,
  type VitrinePrice,
  type VitrineStats,
  type VitrineSignal,
} from '@/services/vitrineService';

const PRICE_REFRESH_MS = 30000; // 30s
const STATS_REFRESH_MS = 10000; // 10s

export function useVitrineData() {
  const [prices, setPrices] = useState<VitrinePrice[]>([]);
  const [stats, setStats] = useState<VitrineStats>(getVitrineStats());
  const [signals, setSignals] = useState<VitrineSignal[]>(getVitrineSignals());
  const [loading, setLoading] = useState(true);
  const pricesRef = useRef<VitrinePrice[]>([]);

  // Fetch prices (lightweight — 3 assets)
  const refreshPrices = useCallback(async () => {
    try {
      const data = await fetchVitrinePrices();
      if (data.length > 0) {
        // Compare before setting to avoid unnecessary re-renders
        const hasChanges = data.some((newP, i) => {
          const oldP = pricesRef.current[i];
          return !oldP || oldP.price !== newP.price;
        });
        if (hasChanges) {
          pricesRef.current = data;
          setPrices(data);
        }
      }
    } catch {
      // Keep previous prices on error
    }
  }, []);

  // Refresh stats from localStorage
  const refreshStats = useCallback(() => {
    setStats(getVitrineStats());
    setSignals(getVitrineSignals());
  }, []);

  // Initial load — NON-BLOCKING: render first, fetch after
  useEffect(() => {
    let mounted = true;

    // Start with default data (no blocking)
    refreshStats();
    setLoading(false);

    // Fetch prices in background (non-blocking)
    refreshPrices();

    // Price refresh interval
    const priceInterval = setInterval(refreshPrices, PRICE_REFRESH_MS);

    // Stats refresh interval (localStorage changes)
    const statsInterval = setInterval(refreshStats, STATS_REFRESH_MS);

    // Listen for storage changes (admin panel updates)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'xtrendai_vitrine_stats' ||
          e.key === 'xtrendai_vitrine_mode' ||
          e.key === 'xtrendai_vitrine_manual_stats' ||
          e.key === 'xtrendai_signals_history') {
        refreshStats();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      mounted = false;
      clearInterval(priceInterval);
      clearInterval(statsInterval);
      window.removeEventListener('storage', handleStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { prices, stats, signals, loading };
}
