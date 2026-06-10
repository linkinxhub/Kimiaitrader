/**
 * AI Signal Engine
 * Génère des signaux de trading dynamiques basés sur les données de marché réelles
 * Calcule les indicateurs techniques et produit des explications en langage naturel
 */

import { calculateRSI, calculateMACD, calculateEMA } from './marketApi';
import type { CandleData } from './marketApi';
import { recordSignalGenerated } from './packAnalyticsService';

export interface AISignal {
  id: string;
  asset: string;
  signal: 'ACHAT' | 'VENTE' | 'ATTENTE';
  confidence: number;
  entryPoint: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskRewardRatio: string;
  riskLevel: 'Faible' | 'Modéré' | 'Élevé';
  explanations: { indicator: string; value: string; interpretation: string }[];
  timestamp: Date;
  timeframe: string;
  aiScore: number;
  marketSentiment: 'Bullish' | 'Bearish' | 'Neutral';
  volatility: number;
  source: 'AI-Engine-Live';
  timeFrameAnalysis?: { timeframe: string; trend: string; trendStrength: number; probability: number; recommendation: string; signal: string }[];
}

export interface AIOpportunity {
  id: string;
  asset: string;
  signal: 'ACHAT' | 'VENTE' | 'ATTENTE';
  strength: 'exceptionnelle' | 'forte' | 'moyenne' | 'faible' | 'aucune';
  score: number;
  timeframe: string;
  reason: string;
  entry: number;
  sl: number;
  tp: number;
}

export interface SmartMoneyLevel {
  concept: string;
  price: number;
  type: string;
  detected: boolean;
  description: string;
}

// ─── Signal Generator ───────────────────────────────────

export function generateSignal(
  asset: string,
  currentPrice: number,
  candles: CandleData[],
  timeframe: string = 'H1'
): AISignal {
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);

  // Calculate indicators
  const rsi = closes.length >= 15 ? calculateRSI(closes, 14) : 50;
  const macdResult = closes.length >= 27 ? calculateMACD(closes) : null;
  const ema20 = closes.length >= 20 ? calculateEMA(closes, 20) : [];
  const ema50 = closes.length >= 50 ? calculateEMA(closes, 50) : [];

  const lastEma20 = ema20.length > 0 ? ema20[ema20.length - 1] : currentPrice;
  const lastEma50 = ema50.length > 0 ? ema50[ema50.length - 1] : currentPrice;

  // MACD analysis
  const macdLine = macdResult?.macd ?? [];
  const signalLine = macdResult?.signal ?? [];
  const lastMACD = macdLine.length > 0 ? macdLine[macdLine.length - 1] : 0;
  const prevMACD = macdLine.length > 1 ? macdLine[macdLine.length - 2] : 0;
  const lastSignal = signalLine.length > 0 ? signalLine[signalLine.length - 1] : 0;
  const prevSignal = signalLine.length > 1 ? signalLine[signalLine.length - 2] : 0;
  const macdBullish = prevMACD <= prevSignal && lastMACD > lastSignal;
  const macdBearish = prevMACD >= prevSignal && lastMACD < lastSignal;

  // Price vs EMA analysis
  const aboveEma20 = currentPrice > lastEma20;
  const aboveEma50 = currentPrice > lastEma50;
  const goldenCross = lastEma20 > lastEma50 && ema20.length > 1 && ema20[ema20.length - 2] <= ema50[ema50.length - 2];

  // Trend strength
  const recentCloses = closes.slice(-10);
  const trendUp = recentCloses.length >= 2 && recentCloses[recentCloses.length - 1] > recentCloses[0];
  const trendDown = recentCloses.length >= 2 && recentCloses[recentCloses.length - 1] < recentCloses[0];

  // Support/Resistance detection — sécurisé contre les arrays vides
  const support = lows.length > 0 ? Math.min(...lows.slice(-20)) : currentPrice * 0.995;
  const resistance = highs.length > 0 ? Math.max(...highs.slice(-20)) : currentPrice * 1.005;
  const nearSupport = lows.length > 0 && (currentPrice - support) / support < 0.005;
  const nearResistance = highs.length > 0 && (resistance - currentPrice) / resistance < 0.005;

  // Volatility (ATR approximation)
  const atr = calculateATR(candles.slice(-15));

  // ─── Decision Engine ────────────────────────────────
  let signal: 'ACHAT' | 'VENTE' | 'ATTENTE' = 'ATTENTE';
  let confidence = 50;
  let reasons: string[] = [];

  // ACHAT conditions
  if ((rsi < 40 && macdBullish) || (nearSupport && rsi < 50) || (goldenCross && aboveEma20)) {
    signal = 'ACHAT';
    confidence = 0;
    if (rsi < 35) { confidence += 25; reasons.push('RSI en zone de survente'); }
    else if (rsi < 45) { confidence += 15; reasons.push('RSI favorable'); }
    if (macdBullish) { confidence += 25; reasons.push('Croisement MACD haussier'); }
    if (aboveEma20 && aboveEma50) { confidence += 15; reasons.push('Prix au-dessus des EMA 20/50'); }
    if (nearSupport) { confidence += 10; reasons.push('Proche du support'); }
    if (trendUp) { confidence += 10; reasons.push('Tendance haussière récente'); }
  }
  // VENTE conditions
  else if ((rsi > 60 && macdBearish) || (nearResistance && rsi > 55) || (!aboveEma20 && !aboveEma50 && macdBearish)) {
    signal = 'VENTE';
    confidence = 0;
    if (rsi > 65) { confidence += 25; reasons.push('RSI en zone de surachat'); }
    else if (rsi > 55) { confidence += 15; reasons.push('RSI élevé'); }
    if (macdBearish) { confidence += 25; reasons.push('Croisement MACD baissier'); }
    if (!aboveEma20 && !aboveEma50) { confidence += 15; reasons.push('Prix sous les EMA 20/50'); }
    if (nearResistance) { confidence += 10; reasons.push('Proche de la résistance'); }
    if (trendDown) { confidence += 10; reasons.push('Tendance baissière récente'); }
  }
  else {
    confidence = 45;
    reasons.push('Conditions de marché neutres');
    if (atr > currentPrice * 0.002) reasons.push('Volatilité élevée — patience recommandée');
  }

  confidence = Math.min(98, Math.max(35, confidence));

  // ─── Level Calculation ──────────────────────────────
  const slDistance = signal === 'ACHAT'
    ? Math.max(atr * 1.5, currentPrice * 0.003)
    : signal === 'VENTE'
    ? Math.max(atr * 1.5, currentPrice * 0.003)
    : currentPrice * 0.005;

  const entryPoint = currentPrice;
  const stopLoss = signal === 'ACHAT' ? entryPoint - slDistance : signal === 'VENTE' ? entryPoint + slDistance : entryPoint;
  const tp1 = signal === 'ACHAT' ? entryPoint + slDistance * 1.5 : signal === 'VENTE' ? entryPoint - slDistance * 1.5 : entryPoint;
  const tp2 = signal === 'ACHAT' ? entryPoint + slDistance * 2.5 : signal === 'VENTE' ? entryPoint - slDistance * 2.5 : entryPoint;
  const tp3 = signal === 'ACHAT' ? entryPoint + slDistance * 3.5 : signal === 'VENTE' ? entryPoint - slDistance * 3.5 : entryPoint;

  const rr = signal === 'ATTENTE' ? '0:0' : `1:${((tp3 - entryPoint) / (entryPoint - stopLoss)).toFixed(1)}`;

  // ─── Explanations ───────────────────────────────────
  const explanations: { indicator: string; value: string; interpretation: string }[] = [
    { indicator: 'RSI (14)', value: rsi.toFixed(1), interpretation: rsi < 30 ? 'RSI en survente — rebond probable' : rsi > 70 ? 'RSI en surachat — correction probable' : `RSI neutre à ${rsi.toFixed(1)}` },
    { indicator: 'MACD', value: macdBullish ? 'Croisement haussier' : macdBearish ? 'Croisement baissier' : 'Sans direction claire', interpretation: macdBullish ? 'Momentum haussier en cours' : macdBearish ? 'Momentum baissier en cours' : 'Attente d\'un signal de momentum' },
    { indicator: 'Prix vs EMA 20', value: aboveEma20 ? 'Au-dessus' : 'En-dessous', interpretation: aboveEma20 ? 'Tendance courte terme haussière' : 'Tendance courte terme baissière' },
    { indicator: 'Support/Résistance', value: `${support.toFixed(2)} / ${resistance.toFixed(2)}`, interpretation: nearSupport ? 'Proche du support — zone d\'achat' : nearResistance ? 'Proche de la résistance — zone de vente' : 'En milieu de range' },
    { indicator: 'Volatilité (ATR)', value: atr.toFixed(2), interpretation: atr > currentPrice * 0.002 ? 'Volatilité élevée' : 'Volatilité modérée' },
  ];

  // ─── Risk Level ─────────────────────────────────────
  const riskLevel: 'Faible' | 'Modéré' | 'Élevé' =
    confidence >= 80 && !nearResistance && !nearSupport ? 'Faible' :
    confidence >= 60 ? 'Modéré' : 'Élevé';

  const result: AISignal = {
    id: `ai-${asset.replace('/', '')}-${Date.now()}`,
    asset,
    signal,
    confidence,
    entryPoint,
    stopLoss,
    takeProfit1: tp1,
    takeProfit2: tp2,
    takeProfit3: tp3,
    riskRewardRatio: rr,
    riskLevel,
    explanations,
    timestamp: new Date(),
    timeframe,
    aiScore: confidence,
    marketSentiment: trendUp ? 'Bullish' : trendDown ? 'Bearish' : 'Neutral',
    volatility: Math.round((atr / currentPrice) * 10000),
    source: 'AI-Engine-Live',
  };

  // Enregistrer le signal pour les stats dynamiques
  recordSignalGenerated({
    id: result.id,
    asset: result.asset,
    signal: result.signal,
    confidence: result.confidence,
    timestamp: result.timestamp.toISOString(),
    entryPoint: result.entryPoint,
    stopLoss: result.stopLoss,
  });

  return result;
}

// ─── Multi-Asset Signal Scanner ─────────────────────────

export function scanAllAssets(
  prices: Record<string, { price: number }>,
  candlesMap: Record<string, CandleData[]>
): AISignal[] {
  const signals: AISignal[] = [];

  for (const [asset, priceData] of Object.entries(prices)) {
    const candles = candlesMap[asset];
    if (!candles || candles.length < 20) continue;

    const signal = generateSignal(asset, priceData.price, candles, 'H1');
    signals.push(signal);
  }

  // Sort by confidence descending
  return signals.sort((a, b) => b.confidence - a.confidence);
}

// ─── Opportunity Generator ──────────────────────────────

export function generateOpportunities(signals: AISignal[]): AIOpportunity[] {
  return signals
    .filter(s => s.signal !== 'ATTENTE')
    .map((s, idx) => ({
      id: `opp-${idx + 1}`,
      asset: s.asset,
      signal: s.signal,
      strength: s.confidence >= 90 ? 'exceptionnelle' as const :
                s.confidence >= 75 ? 'forte' as const :
                s.confidence >= 60 ? 'moyenne' as const :
                s.confidence >= 40 ? 'faible' as const : 'aucune' as const,
      score: s.confidence,
      timeframe: s.timeframe,
      reason: s.explanations.slice(0, 2).map(e => e.interpretation).join('. '),
      entry: s.entryPoint,
      sl: s.stopLoss,
      tp: s.takeProfit3,
    }));
}

// ─── Smart Money Levels ─────────────────────────────────

export function calculateSmartMoneyLevels(
  currentPrice: number,
  candles: CandleData[]
): SmartMoneyLevel[] {
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const closes = candles.map(c => c.close);

  // Find swing highs/lows
  const swingHighs = findSwingPoints(highs, 'high');
  const swingLows = findSwingPoints(lows, 'low');

  const orderBlockPrice = swingLows.length > 0 ? swingLows[swingLows.length - 1] : currentPrice * 0.995;
  const breakerBlockPrice = swingHighs.length > 0 ? swingHighs[swingHighs.length - 1] : currentPrice * 1.005;
  const liquidityPoolLow = lows.length > 0 ? Math.min(...lows.slice(-30)) : currentPrice * 0.99;
  const liquidityPoolHigh = highs.length > 0 ? Math.max(...highs.slice(-30)) : currentPrice * 1.01;
  const equilibrium = closes.reduce((a, b) => a + b, 0) / closes.length;

  return [
    { concept: 'Order Blocks', price: orderBlockPrice, type: currentPrice > orderBlockPrice ? 'Bullish OB' : 'Bearish OB', detected: true, description: 'Zone où les institutions ont accumulé des positions majeures' },
    { concept: 'Breaker Blocks', price: breakerBlockPrice, type: currentPrice < breakerBlockPrice ? 'Bearish BB' : 'Bullish BB', detected: true, description: 'Ancien support devenu résistance ou inversement' },
    { concept: 'Fair Value Gaps', price: currentPrice * 0.998, type: 'FVG', detected: Math.abs(currentPrice - equilibrium) / currentPrice > 0.001, description: 'Vides de prix créés par un mouvement impulsif' },
    { concept: 'Liquidity Pools', price: liquidityPoolLow, type: 'Double Pool', detected: true, description: `Zones stops concentrés: ${liquidityPoolLow.toFixed(2)} / ${liquidityPoolHigh.toFixed(2)}` },
    { concept: 'BOS / CHOCH', price: swingHighs[swingHighs.length - 2] || currentPrice, type: 'BOS Haussier', detected: swingHighs.length >= 2, description: 'Break of Structure détecté' },
    { concept: 'Stop Hunts', price: liquidityPoolLow, type: 'Liquidity Grab', detected: Math.abs(currentPrice - liquidityPoolLow) / currentPrice < 0.003, description: 'Mouvement artificiel pour déclencher les stops' },
    { concept: 'Premium / Discount', price: equilibrium, type: currentPrice > equilibrium ? 'Zone Premium' : 'Zone Discount', detected: true, description: `Équilibre: ${equilibrium.toFixed(2)} — ${currentPrice > equilibrium ? 'Premium = vente' : 'Discount = achat'}` },
  ];
}

// ─── Technical Indicators for Display ───────────────────

export function calculateTechnicalIndicators(
  candles: CandleData[]
): { name: string; value: string; signal: string; status: 'bullish' | 'bearish' | 'neutral' }[] {
  const closes = candles.map(c => c.close);

  if (closes.length < 15) return [];

  const rsi = calculateRSI(closes, 14);
  const macd = calculateMACD(closes);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const lastPrice = closes[closes.length - 1];

  const macdBullish = (macd?.macd ?? []).length > 1 &&
    (macd?.macd[macd.macd.length - 1] ?? 0) > (macd?.signal[macd.signal.length - 1] ?? 0);

  return [
    { name: 'RSI (14)', value: rsi.toFixed(1), signal: rsi < 30 ? 'Survente' : rsi > 70 ? 'Surachat' : 'Neutre', status: rsi < 45 ? 'bullish' : rsi > 55 ? 'bearish' : 'neutral' },
    { name: 'MACD', value: macdBullish ? 'Haussier' : 'Baissier', signal: macdBullish ? 'Croisement haussier' : 'Croisement baissier', status: macdBullish ? 'bullish' : 'bearish' },
    { name: 'EMA 20', value: ema20.length > 0 ? ema20[ema20.length - 1].toFixed(2) : '-', signal: lastPrice > ema20[ema20.length - 1] ? 'Support dynamique' : 'Résistance dynamique', status: lastPrice > ema20[ema20.length - 1] ? 'bullish' : 'bearish' },
    { name: 'EMA 50', value: ema50.length > 0 ? ema50[ema50.length - 1].toFixed(2) : '-', signal: lastPrice > ema50[ema50.length - 1] ? 'Tendance haussière' : 'Tendance baissière', status: lastPrice > ema50[ema50.length - 1] ? 'bullish' : 'bearish' },
    { name: 'Prix Actuel', value: lastPrice.toFixed(2), signal: `vs EMA20: ${((lastPrice / ema20[ema20.length - 1] - 1) * 100).toFixed(2)}%`, status: 'neutral' },
    { name: 'Volatilité', value: `${(calculateATR(candles.slice(-14)) / lastPrice * 100).toFixed(2)}%`, signal: 'ATR (14 périodes)', status: 'neutral' },
  ];
}

// ─── Helper Functions ───────────────────────────────────

function calculateATR(candles: CandleData[]): number {
  if (candles.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < candles.length; i++) {
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    sum += tr;
  }
  return sum / (candles.length - 1);
}

function findSwingPoints(data: number[], type: 'high' | 'low'): number[] {
  const points: number[] = [];
  for (let i = 2; i < data.length - 2; i++) {
    if (type === 'high' && data[i] > data[i - 1] && data[i] > data[i - 2] && data[i] > data[i + 1] && data[i] > data[i + 2]) {
      points.push(data[i]);
    }
    if (type === 'low' && data[i] < data[i - 1] && data[i] < data[i - 2] && data[i] < data[i + 1] && data[i] < data[i + 2]) {
      points.push(data[i]);
    }
  }
  return points.length > 0 ? points : [data[data.length - 1]];
}

// ─── Market Summary Generator ───────────────────────────

export interface MarketSummaryItem {
  label: string;
  status: string;
  score: number;
}

export function generateMarketSummary(signals: AISignal[]): MarketSummaryItem[] {
  const forexSignals = signals.filter(s => ['EUR/USD', 'GBP/USD', 'USD/JPY'].includes(s.asset));
  const xauSignal = signals.find(s => s.asset === 'XAU/USD');
  const cryptoSignals = signals.filter(s => ['BTC/USD', 'ETH/USD'].includes(s.asset));

  const forexBullish = forexSignals.filter(s => s.signal === 'ACHAT').length;
  const forexBearish = forexSignals.filter(s => s.signal === 'VENTE').length;

  return [
    { label: 'Forex', status: forexBullish > forexBearish ? `Haussier (${forexBullish}/${forexSignals.length})` : `Baissier (${forexBearish}/${forexSignals.length})`, score: Math.round((forexSignals.reduce((s, sig) => s + sig.confidence, 0) / Math.max(forexSignals.length, 1))) },
    { label: 'Or (XAU/USD)', status: xauSignal ? `${xauSignal.signal} (${xauSignal.confidence}%)` : 'Analyse...', score: xauSignal?.confidence ?? 50 },
    { label: 'Crypto', status: cryptoSignals.length > 0 ? `${cryptoSignals.filter(s => s.signal === 'ACHAT').length}/${cryptoSignals.length} Haussier` : 'Analyse...', score: Math.round(cryptoSignals.reduce((s, sig) => s + sig.confidence, 0) / Math.max(cryptoSignals.length, 1)) || 50 },
  ];
}
