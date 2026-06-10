/**
 * Hook: useAISignals
 * Connecte le AI Signal Engine aux donnees de marche
 * Garantit que les signaux sont generes meme si les prix live echouent
 * (utilise le dernier close des bougies comme fallback prix)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMarketData, useCandles } from './useMarketData';
import {
  generateSignal,
  generateOpportunities,
  generateMarketSummary,
  calculateTechnicalIndicators,
  calculateSmartMoneyLevels,
  type AISignal,
  type AIOpportunity,
} from '@/services/aiSignalEngine';
import {
  isDemoMode,
  DEMO_SIGNALS,
  DEMO_OPPORTUNITIES,
  DEMO_MARKET_OVERVIEW,
  DEMO_AI_INSIGHTS,
  DEMO_TECH_INDICATORS,
  DEMO_SMART_MONEY_LEVELS,
  DEMO_PRICES,
  DEMO_CANDLES,
} from '@/services/demoData';
import { ASSETS } from '@/services/marketApi';
import type { CandleData } from '@/services/marketApi';

const ALL_ASSETS = Object.keys(ASSETS) as string[];
const MAX_WAIT_MS = 12000;
const RETRY_INTERVAL_MS = 5000;

function mapDemoSignals(): AISignal[] {
  return DEMO_SIGNALS.map((s) => ({ ...s, source: 'Mode-Demo' as const })) as AISignal[];
}

function mapDemoOpportunities() {
  return DEMO_OPPORTUNITIES.map((o) => ({
    ...o,
    strength: o.strength as 'exceptionnelle' | 'forte' | 'moyenne' | 'faible' | 'aucune',
  }));
}

export function useAISignals() {
  const { prices } = useMarketData();
  const [signals, setSignals] = useState<AISignal[]>([]);
  const [opportunities, setOpportunities] = useState<AIOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const attemptCountRef = { current: 0 };
  const demo = isDemoMode();

  // Candles for priority assets
  const c1 = useCandles('BTC/USD' as any, '1h');
  const c2 = useCandles('ETH/USD' as any, '1h');
  const c3 = useCandles('XAU/USD' as any, '1h');
  const c4 = useCandles('XAG/USD' as any, '1h');
  const c5 = useCandles('EUR/USD' as any, '1h');
  const c6 = useCandles('GBP/USD' as any, '1h');
  const c7 = useCandles('USD/JPY' as any, '1h');
  const c8 = useCandles('USD/CHF' as any, '1h');
  const c9 = useCandles('SOL/USD' as any, '1h');
  const c10 = useCandles('BNB/USD' as any, '1h');
  const c11 = useCandles('ADA/USD' as any, '1h');
  const c12 = useCandles('DOT/USD' as any, '1h');
  const c13 = useCandles('NAS100' as any, '1h');
  const c14 = useCandles('SPX500' as any, '1h');
  const c15 = useCandles('DE40' as any, '1h');

  const candlesMap = useMemo(() => {
    const m: Record<string, CandleData[]> = {};
    const hooks = [
      ['BTC/USD', c1], ['ETH/USD', c2], ['XAU/USD', c3], ['XAG/USD', c4],
      ['EUR/USD', c5], ['GBP/USD', c6], ['USD/JPY', c7], ['USD/CHF', c8],
      ['SOL/USD', c9], ['BNB/USD', c10], ['ADA/USD', c11], ['DOT/USD', c12],
      ['NAS100', c13], ['SPX500', c14], ['DE40', c15],
    ];
    for (const [asset, hook] of hooks) {
      const h = hook as { candles: CandleData[] };
      if (h.candles.length >= 20) m[asset as string] = h.candles;
    }
    return m;
  }, [c1.candles, c2.candles, c3.candles, c4.candles, c5.candles, c6.candles,
      c7.candles, c8.candles, c9.candles, c10.candles, c11.candles, c12.candles,
      c13.candles, c14.candles, c15.candles]);

  const generateAllSignals = useCallback(() => {
    const newSignals: AISignal[] = [];
    let dataAvailable = false;

    for (const asset of ALL_ASSETS) {
      const candles = candlesMap[asset];
      if (!candles || candles.length < 20) continue;

      // Prix : live > dernier close des bougies > defaultPrice
      let price = prices[asset]?.price;
      if (!price || price <= 0) {
        price = candles[candles.length - 1]?.close;
      }
      if (!price || price <= 0) {
        const cfg = (ASSETS as Record<string, any>)[asset];
        price = cfg?.defaultPrice;
      }
      if (!price || price <= 0) continue;

      dataAvailable = true;
      try {
        const signal = generateSignal(asset, price, candles, 'H1');
        newSignals.push(signal);
      } catch (e) {
        console.warn(`Signal generation failed for ${asset}:`, e);
      }
    }

    newSignals.sort((a, b) => b.confidence - a.confidence);

    setSignals(newSignals);
    setOpportunities(generateOpportunities(newSignals));

    attemptCountRef.current += 1;

    if (dataAvailable) {
      setLoading(false);
      setError(null);
    } else if (attemptCountRef.current >= 4) {
      setLoading(false);
      setError('Donnees live temporairement indisponibles. Derniere donnee connue affichee.');
    }
  }, [prices, candlesMap]);

  useEffect(() => {
    if (demo) {
      setSignals(mapDemoSignals());
      setOpportunities(mapDemoOpportunities());
      setLoading(false);
      return;
    }

    attemptCountRef.current = 0;

    const interval = setInterval(generateAllSignals, RETRY_INTERVAL_MS);
    generateAllSignals();

    const timeout = setTimeout(() => {
      setLoading(false);
      setSignals(prev => {
        if (prev.length === 0) {
          setError('Donnees live indisponibles. Veuillez configurer les APIs dans l\'admin panel.');
        }
        return prev;
      });
    }, MAX_WAIT_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [generateAllSignals, demo]);

  const resultSignals = demo ? mapDemoSignals() : signals;
  const resultOpportunities = demo ? mapDemoOpportunities() : opportunities;
  const resultLoading = demo ? false : loading;

  return {
    signals: resultSignals,
    opportunities: resultOpportunities,
    loading: resultLoading,
    error: demo ? null : error,
    topSignal: resultSignals[0] || null,
    marketSummary: useMemo(() => generateMarketSummary(resultSignals), [resultSignals]),
  };
}

export function useAssetSignal(asset: string) {
  const { prices } = useMarketData();
  const { candles } = useCandles(asset as any, '1h');
  const demo = isDemoMode();

  const realSignal = useMemo(() => {
    if (demo) return null;
    let price = prices[asset]?.price;
    if (!price || price <= 0) price = candles[candles.length - 1]?.close;
    if (!price || price <= 0) {
      const cfg = (ASSETS as Record<string, any>)[asset];
      price = cfg?.defaultPrice;
    }
    if (!price || candles.length < 20) return null;
    return generateSignal(asset, price, candles, 'H1');
  }, [prices, candles, asset, demo]);

  const realTechIndicators = useMemo(() => {
    if (demo || candles.length < 15) return [];
    return calculateTechnicalIndicators(candles);
  }, [candles, demo]);

  const realSmartMoneyLevels = useMemo(() => {
    if (demo) return [];
    let price = prices[asset]?.price;
    if (!price || price <= 0) price = candles[candles.length - 1]?.close;
    if (!price || candles.length < 20) return [];
    return calculateSmartMoneyLevels(price, candles);
  }, [prices, candles, asset, demo]);

  const demoResult = useMemo(() => {
    if (!demo) return null;
    const ds = DEMO_SIGNALS.find((s: any) => s.asset === asset) || null;
    return {
      signal: ds ? { ...ds, source: 'AI-Engine-Demo' as const } : null,
      techIndicators: DEMO_TECH_INDICATORS,
      smartMoneyLevels: asset === 'XAU/USD' ? DEMO_SMART_MONEY_LEVELS : [],
      candles: DEMO_CANDLES[asset] || [],
    };
  }, [asset, demo]);

  if (demo && demoResult) return demoResult;

  return { signal: realSignal, techIndicators: realSmartMoneyLevels, smartMoneyLevels: realSmartMoneyLevels, candles };
}

export function useDashboardData() {
  const { prices, loading: pricesLoading, lastUpdate } = useMarketData();
  const { signals, opportunities, topSignal, marketSummary, loading: signalsLoading, error: signalsError } = useAISignals();
  const demo = isDemoMode();

  const realMarketOverview = useMemo(() => {
    if (demo) return DEMO_MARKET_OVERVIEW;
    return Object.entries(prices).map(([asset, data]) => {
      const sig = signals.find((s) => s.asset === asset);
      return {
        asset,
        price: data.price,
        change: data.change24h,
        changePercent: data.change24hPercent,
        trend: sig?.marketSentiment === 'Bullish' ? 'HAUSSIERE' as const : sig?.marketSentiment === 'Bearish' ? 'BAISSIERE' as const : 'NEUTRE' as const,
        volatility: sig?.volatility || 0,
        marketStrength: sig?.confidence || 50,
        sentiment: sig?.marketSentiment || 'Neutral',
        aiScore: sig?.confidence || 50,
      };
    });
  }, [prices, signals, demo]);

  const realAiInsights = useMemo(() => {
    if (demo) return DEMO_AI_INSIGHTS;
    if (signals.length === 0) return [];
    return signals.slice(0, 3).map((sig) => ({
      type: sig.signal === 'ACHAT' ? 'technical' as const : sig.signal === 'VENTE' ? 'fundamental' as const : 'sentiment' as const,
      title: `${sig.asset} — ${sig.signal} (${sig.confidence}%)`,
      description: sig.explanations[0]?.interpretation || 'Signal genere par IA',
      confidence: sig.confidence,
      timestamp: sig.timestamp,
    }));
  }, [signals, demo]);

  if (demo) {
    return {
      prices: DEMO_PRICES, signals: mapDemoSignals(), opportunities: mapDemoOpportunities(),
      topSignal: (DEMO_SIGNALS[0] as AISignal) || null,
      xauSignal: (DEMO_SIGNALS.find((s: any) => s.asset === 'XAU/USD') as AISignal) || null,
      marketOverview: DEMO_MARKET_OVERVIEW,
      marketSummary: [
        { label: 'Forex', status: 'Haussier (2/3)', score: 77 },
        { label: 'Or (XAU/USD)', status: 'ACHAT (94%)', score: 94 },
        { label: 'Crypto', status: '2/3 Haussier', score: 66 },
      ],
      aiInsights: DEMO_AI_INSIGHTS, loading: false, lastUpdate: new Date(),
    };
  }

  return {
    prices, signals, opportunities, topSignal,
    xauSignal: signals.find((s) => s.asset === 'XAU/USD') || topSignal,
    marketOverview: realMarketOverview, marketSummary,
    aiInsights: realAiInsights,
    loading: pricesLoading && signalsLoading,
    signalsError, lastUpdate,
  };
}
