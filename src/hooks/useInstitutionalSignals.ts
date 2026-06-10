/**
 * Hook: useInstitutionalSignals
 * Génère des signaux multi-timeframes avec analyse institutionnelle complète
 * pour le Comparateur Institutionnel IA
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMarketData, useCandles } from './useMarketData';
import { useAuth } from './useAuth';
import {
  generateSignal,
  calculateSmartMoneyLevels,
  type AISignal,
  type CandleData,
} from '@/services/aiSignalEngine';
import {
  calculateInstitutionalScore,
  analyzeTimeframes,
  type InstitutionalAnalysis,
  type TimeframeAnalysis,
  type MultiTimeframeSignal,
} from '@/services/institutionalScoreService';
import { isDemoMode, DEMO_SIGNALS, DEMO_CANDLES, DEMO_PRICES } from '@/services/demoData';

const ALL_ASSETS = ['BTC/USD', 'ETH/USD', 'XAU/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY'] as const;
const ALL_TIMEFRAMES = ['M15', 'H1', 'H4', 'D1'] as const; // M5 nécessiterait trop d'appels API

// Fallback prices when live APIs are unavailable — ensures signals always generate
// Updated: 2026-06-08 — synced with current market prices
const FALLBACK_PRICES: Record<string, number> = {
  'BTC/USD': 67500,
  'ETH/USD': 3520,
  'XAU/USD': 4470.00,
  'EUR/USD': 1.0850,
  'GBP/USD': 1.2750,
  'USD/JPY': 149.50,
};

export interface EnrichedSignal extends AISignal {
  institutionalAnalysis: InstitutionalAnalysis;
  timeframeSignals: MultiTimeframeSignal[];
}

export interface PeriodFilter {
  type: 'today' | 'yesterday' | '7d' | '30d' | 'thisMonth' | 'lastMonth' | 'asian' | 'european' | 'american' | 'custom';
  startDate?: Date;
  endDate?: Date;
}

// ─── Pack limits ────────────────────────────────────────

function getMaxSignalsByPack(pack: string): number {
  if (pack === 'free') return 2;
  if (pack === 'pro') return 10;
  return 999; // expert / institutional
}

function canViewInstitutional(pack: string): boolean {
  return pack === 'expert' || pack === 'institutional';
}

// ─── Main Hook ──────────────────────────────────────────

export function useInstitutionalSignals() {
  const { prices } = useMarketData();
  const { user } = useAuth();
  const pack = (user?.pack || 'free') as string;
  const maxSignals = getMaxSignalsByPack(pack);
  const showInstitutional = canViewInstitutional(pack);
  const demo = isDemoMode();

  const [enrichedSignals, setEnrichedSignals] = useState<EnrichedSignal[]>([]);
  const [timeframeAnalyses, setTimeframeAnalyses] = useState<Record<string, TimeframeAnalysis>>({});
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>({ type: 'today' });
  const [selectedAsset, setSelectedAsset] = useState<string>('ALL');

  // Candles for all assets & timeframes
  const candlesM15 = useCandles('XAU/USD', '15m');
  const candlesH1 = useCandles('XAU/USD', '1h');
  const candlesH4 = useCandles('XAU/USD', '4h');
  const candlesD1 = useCandles('XAU/USD', '1d');

  const btcH1 = useCandles('BTC/USD', '1h');
  const ethH1 = useCandles('ETH/USD', '1h');
  const eurH1 = useCandles('EUR/USD', '1h');
  const gbpH1 = useCandles('GBP/USD', '1h');
  const jpyH1 = useCandles('USD/JPY', '1h');

  // Generate signals for a single asset across all timeframes
  const generateMultiTimeframeSignals = useCallback((
    asset: string,
    currentPrice: number,
    candlesMap: Record<string, CandleData[]>
  ): { mainSignal: AISignal; timeframeSignals: MultiTimeframeSignal[] } | null => {
    // Generate main signal on H1
    const h1Candles = candlesMap['H1'] || [];
    if (!h1Candles || h1Candles.length < 20) return null;

    const mainSignal = generateSignal(asset, currentPrice, h1Candles, 'H1');

    // Generate timeframe signals
    const tfSignals: MultiTimeframeSignal[] = [];

    for (const tf of ALL_TIMEFRAMES) {
      const tfCandles = candlesMap[tf] || [];
      if (tfCandles.length < 20) {
        tfSignals.push({
          timeframe: tf,
          signal: 'ATTENTE',
          confidence: 0,
          trend: 'LATÉRALE',
          strength: 0,
        });
        continue;
      }

      const tfSig = generateSignal(asset, currentPrice, tfCandles, tf);
      tfSignals.push({
        timeframe: tf,
        signal: tfSig.signal,
        confidence: tfSig.confidence,
        trend: tfSig.marketSentiment === 'Bullish' ? 'HAUSSIÈRE' : tfSig.marketSentiment === 'Bearish' ? 'BAISSIÈRE' : 'LATÉRALE',
        strength: tfSig.confidence,
      });
    }

    return { mainSignal, timeframeSignals: tfSignals };
  }, []);

  // Main generation effect
  const generateAll = useCallback(() => {
    if (demo) {
      // Demo mode: use demo signals with synthetic institutional analysis
      const demoEnriched: EnrichedSignal[] = DEMO_SIGNALS.slice(0, maxSignals).map((ds) => {
        const price = DEMO_PRICES[ds.asset as keyof typeof DEMO_PRICES]?.price || ds.entryPoint;
        const candles = DEMO_CANDLES[ds.asset as keyof typeof DEMO_CANDLES] || [];

        const mainSignal: AISignal = {
          ...ds,
          id: `demo-${ds.asset}-${Date.now()}`,
          source: 'AI-Engine-Demo' as const,
          timestamp: new Date(),
          confidence: ds.confidence || 70,
          entryPoint: ds.entryPoint || price,
          stopLoss: ds.stopLoss || price * 0.995,
          takeProfit1: ds.takeProfit1 || price * 1.005,
          takeProfit2: ds.takeProfit2 || price * 1.01,
          takeProfit3: ds.takeProfit3 || price * 1.015,
          riskRewardRatio: ds.riskRewardRatio || '1:2',
          riskLevel: (ds.riskLevel as 'Faible' | 'Modéré' | 'Élevé') || 'Modéré',
          marketSentiment: 'Neutral',
          volatility: 15,
          aiScore: ds.confidence || 70,
        };

        const smLevels = candles.length > 0 ? calculateSmartMoneyLevels(price, candles) : [];

        const tfSignals: MultiTimeframeSignal[] = [
          { timeframe: 'M15', signal: ds.signal, confidence: (ds.confidence || 70) - 5, trend: ds.signal === 'ACHAT' ? 'HAUSSIÈRE' : 'BAISSIÈRE', strength: (ds.confidence || 70) - 5 },
          { timeframe: 'H1', signal: ds.signal, confidence: ds.confidence || 70, trend: ds.signal === 'ACHAT' ? 'HAUSSIÈRE' : 'BAISSIÈRE', strength: ds.confidence || 70 },
          { timeframe: 'H4', signal: ds.signal, confidence: (ds.confidence || 70) + 5, trend: ds.signal === 'ACHAT' ? 'HAUSSIÈRE' : 'BAISSIÈRE', strength: (ds.confidence || 70) + 5 },
          { timeframe: 'D1', signal: ds.signal === 'ACHAT' ? 'VENTE' : 'ACHAT', confidence: 55, trend: 'LATÉRALE', strength: 55 },
        ];

        const instAnalysis = showInstitutional
          ? calculateInstitutionalScore(mainSignal, smLevels, tfSignals)
          : getSimplifiedAnalysis(mainSignal);

        return { ...mainSignal, institutionalAnalysis: instAnalysis, timeframeSignals: tfSignals };
      });

      setEnrichedSignals(demoEnriched);

      // Generate timeframe analyses
      const analyses: Record<string, TimeframeAnalysis> = {};
      for (const signal of demoEnriched) {
        analyses[signal.asset] = analyzeTimeframes(signal.timeframeSignals, signal.asset);
      }
      setTimeframeAnalyses(analyses);
      setLoading(false);
      return;
    }

    // Real mode: generate from live data (with fallback prices if APIs fail)
    const newEnriched: EnrichedSignal[] = [];

    for (const asset of ALL_ASSETS) {
      const priceData = prices[asset];
      const currentPrice = priceData?.price || FALLBACK_PRICES[asset] || 0;
      if (!currentPrice) continue;

      const assetCandles: Record<string, CandleData[]> = {};

      // Map available candles
      if (asset === 'XAU/USD') {
        assetCandles['M15'] = candlesM15.candles;
        assetCandles['H1'] = candlesH1.candles;
        assetCandles['H4'] = candlesH4.candles;
        assetCandles['D1'] = candlesD1.candles;
      } else if (asset === 'BTC/USD') {
        assetCandles['H1'] = btcH1.candles;
      } else if (asset === 'ETH/USD') {
        assetCandles['H1'] = ethH1.candles;
      } else if (asset === 'EUR/USD') {
        assetCandles['H1'] = eurH1.candles;
      } else if (asset === 'GBP/USD') {
        assetCandles['H1'] = gbpH1.candles;
      } else if (asset === 'USD/JPY') {
        assetCandles['H1'] = jpyH1.candles;
      }

      const result = generateMultiTimeframeSignals(asset, currentPrice, assetCandles);
      if (!result) continue;

      const { mainSignal, timeframeSignals } = result;

      // Smart Money for H1 candles
      const h1Candles = assetCandles['H1'] || [];
      const smLevels = h1Candles.length > 20
        ? calculateSmartMoneyLevels(currentPrice, h1Candles)
        : [];

      const instAnalysis = showInstitutional
        ? calculateInstitutionalScore(mainSignal, smLevels, timeframeSignals)
        : getSimplifiedAnalysis(mainSignal);

      newEnriched.push({
        ...mainSignal,
        institutionalAnalysis: instAnalysis,
        timeframeSignals,
      });
    }

    newEnriched.sort((a, b) => b.confidence - a.confidence);

    // Apply pack limit
    const limited = newEnriched.slice(0, maxSignals);
    setEnrichedSignals(limited);

    // Generate timeframe analyses
    const analyses: Record<string, TimeframeAnalysis> = {};
    for (const signal of limited) {
      analyses[signal.asset] = analyzeTimeframes(signal.timeframeSignals, signal.asset);
    }
    setTimeframeAnalyses(analyses);
    setLoading(false);
  }, [
    demo, prices, maxSignals, showInstitutional,
    generateMultiTimeframeSignals,
    candlesM15.candles, candlesH1.candles, candlesH4.candles, candlesD1.candles,
    btcH1.candles, ethH1.candles, eurH1.candles, gbpH1.candles, jpyH1.candles,
  ]);

  useEffect(() => {
    generateAll();
    const interval = setInterval(generateAll, 60000);
    return () => clearInterval(interval);
  }, [generateAll]);

  // Filtered signals
  const filteredSignals = useMemo(() => {
    let result = [...enrichedSignals];

    // Filter by asset
    if (selectedAsset !== 'ALL') {
      result = result.filter(s => s.asset === selectedAsset);
    }

    // Filter by period (simulated — real signals are always "today")
    if (periodFilter.type !== 'today' && periodFilter.type !== 'custom') {
      // In live mode, all signals are current, so this is mainly for UI consistency
      // Would filter historical signal database in a full implementation
    }

    return result;
  }, [enrichedSignals, selectedAsset, periodFilter]);

  // Best signals by category
  const bestSignals = useMemo(() => {
    const active = filteredSignals.filter(s => s.signal !== 'ATTENTE');
    if (active.length === 0) return null;

    const best = active.reduce((b, s) => s.confidence > b.confidence ? s : b, active[0]);
    const safest = active.reduce((s, sig) =>
      sig.institutionalAnalysis.score > s.institutionalAnalysis.score ? sig : s, active[0]);
    const bestRR = active.reduce((b, s) => {
      const bRR = parseFloat(b.riskRewardRatio.replace('1:', '')) || 0;
      const sRR = parseFloat(s.riskRewardRatio.replace('1:', '')) || 0;
      return sRR > bRR ? s : b;
    }, active[0]);

    return { best, safest, bestRR };
  }, [filteredSignals]);

  return {
    signals: filteredSignals,
    timeframeAnalyses,
    loading,
    periodFilter,
    setPeriodFilter,
    selectedAsset,
    setSelectedAsset,
    bestSignals,
    maxSignals,
    showInstitutional,
    pack,
    refresh: generateAll,
  };
}

// ─── Simplified analysis for non-expert packs ───────────

function getSimplifiedAnalysis(signal: AISignal): InstitutionalAnalysis {
  return {
    score: signal.confidence,
    grade: signal.confidence >= 80 ? 'A' : signal.confidence >= 60 ? 'B' : signal.confidence >= 40 ? 'C' : 'D',
    label: signal.confidence >= 80 ? 'Très Fort' : signal.confidence >= 60 ? 'Valide' : signal.confidence >= 40 ? 'Moyen' : 'Faible',
    orderBlocks: { detected: false, price: 0, type: '' },
    breakOfStructure: { detected: false, price: 0, description: '' },
    fairValueGap: { detected: false, price: 0, description: '' },
    liquidityPools: { low: 0, high: 0, nearest: 'none' },
    premiumDiscount: { equilibrium: signal.entryPoint, zone: 'Equilibrium' },
    stopHuntRisk: { detected: false, distance: 1, description: '' },
    timeframeAlignment: 0,
    alignmentDirection: 'neutral',
    alignmentComment: 'Analyse institutionnelle réservée aux packs Expert+',
    entryZone: `${signal.entryPoint.toFixed(2)}`,
    invalidationLevel: `${signal.stopLoss.toFixed(2)}`,
    confirmationRequired: ['Upgrade vers Expert pour l\'analyse complète'],
    institutionalBias: 'neutre',
    recommendation: `${signal.asset} — ${signal.signal} (${signal.confidence}%). Upgrade vers Expert pour l'analyse institutionnelle complète.`,
  };
}
