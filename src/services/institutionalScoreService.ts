/**
 * Institutional Score Service
 * Calcule un score institutionnel pour chaque signal basé sur :
 * - Smart Money Concepts (OB, BOS, FVG, liquidité)
 * - Alignement multi-timeframes
 * - Ratio R/R
 * - Qualité du point d'entrée
 * - Tendance globale
 */

import type { AISignal, SmartMoneyLevel } from './aiSignalEngine';
import { calculateSmartMoneyLevels } from './aiSignalEngine';
import type { CandleData } from './marketApi';

export interface InstitutionalAnalysis {
  score: number; // 0-100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  label: string; // "Très Fort", "Valide", "Moyen", "Faible"
  // Smart Money
  orderBlocks: { detected: boolean; price: number; type: string };
  breakOfStructure: { detected: boolean; price: number; description: string };
  fairValueGap: { detected: boolean; price: number; description: string };
  liquidityPools: { low: number; high: number; nearest: 'low' | 'high' | 'none' };
  premiumDiscount: { equilibrium: number; zone: 'Premium' | 'Discount' | 'Equilibrium' };
  stopHuntRisk: { detected: boolean; distance: number; description: string };
  // Multi-timeframe alignment
  timeframeAlignment: number; // 0-100
  alignmentDirection: 'bullish' | 'bearish' | 'mixed' | 'neutral';
  alignmentComment: string;
  // Conclusion
  entryZone: string;
  invalidationLevel: string;
  confirmationRequired: string[];
  institutionalBias: 'haussier' | 'baissier' | 'neutre';
  recommendation: string;
}

export interface MultiTimeframeSignal {
  timeframe: string;
  signal: 'ACHAT' | 'VENTE' | 'ATTENTE';
  confidence: number;
  trend: 'HAUSSIÈRE' | 'BAISSIÈRE' | 'LATÉRALE';
  strength: number; // 0-100
}

export interface TimeframeAnalysis {
  signals: MultiTimeframeSignal[];
  conclusion: string;
  conclusionType: 'strong' | 'moderate' | 'weak' | 'contradictory';
  overallDirection: string;
  xauSpecial?: XAUInstitutionalAnalysis;
}

export interface XAUInstitutionalAnalysis {
  buyZone: { min: number; max: number; quality: string };
  sellZone: { min: number; max: number; quality: string };
  mainLiquidity: number;
  criticalBreakLevel: number;
  idealPullbackZone: number;
  likelyProfitZone: number;
  usdCorrelation: string;
  sentiment: 'haussier' | 'baissier' | 'neutre';
  newsRisk: string;
  institutionalBias: string;
}

// ─── Score Calculation ──────────────────────────────────

export function calculateInstitutionalScore(
  signal: AISignal,
  smartMoneyLevels: SmartMoneyLevel[],
  timeframeSignals: MultiTimeframeSignal[]
): InstitutionalAnalysis {
  let score = 0;
  const confirmations: string[] = [];

  // 1. Smart Money Concepts (max 40 points)
  const ob = smartMoneyLevels.find(l => l.concept === 'Order Blocks');
  const bos = smartMoneyLevels.find(l => l.concept === 'BOS / CHOCH');
  const fvg = smartMoneyLevels.find(l => l.concept === 'Fair Value Gaps');
  const liq = smartMoneyLevels.find(l => l.concept === 'Liquidity Pools');
  const premium = smartMoneyLevels.find(l => l.concept === 'Premium / Discount');
  const stopHunt = smartMoneyLevels.find(l => l.concept === 'Stop Hunts');

  // Order Block alignment (0-12 pts)
  let obScore = 0;
  let obAligned = false;
  if (ob?.detected) {
    if (signal.signal === 'ACHAT' && ob.type.includes('Bullish')) {
      obScore = 12; obAligned = true; confirmations.push('OB haussier aligné');
    } else if (signal.signal === 'VENTE' && ob.type.includes('Bearish')) {
      obScore = 12; obAligned = true; confirmations.push('OB baissier aligné');
    } else {
      obScore = 4; confirmations.push('OB présent mais non aligné');
    }
  }
  score += obScore;

  // Break of Structure (0-10 pts)
  let bosScore = 0;
  if (bos?.detected) {
    bosScore = 8; confirmations.push('BOS/CHOCH détecté');
    if ((signal.signal === 'ACHAT' && bos.type.includes('Haussier')) ||
        (signal.signal === 'VENTE' && bos.type.includes('Baissier'))) {
      bosScore = 10; confirmations.push('BOS aligné avec le signal');
    }
  }
  score += bosScore;

  // Fair Value Gap (0-8 pts)
  let fvgScore = 0;
  if (fvg?.detected) {
    fvgScore = 6; confirmations.push('FVG détecté');
    if ((signal.signal === 'ACHAT' && signal.entryPoint <= fvg.price * 1.002) ||
        (signal.signal === 'VENTE' && signal.entryPoint >= fvg.price * 0.998)) {
      fvgScore = 8; confirmations.push('Entrée proche du FVG');
    }
  }
  score += fvgScore;

  // Liquidity proximity (0-6 pts)
  let liqScore = 0;
  if (liq?.detected) {
    const liqDistance = Math.abs(signal.entryPoint - liq.price) / signal.entryPoint;
    if (liqDistance < 0.005) { liqScore = 6; confirmations.push('Proche zone de liquidité'); }
    else if (liqDistance < 0.01) { liqScore = 4; confirmations.push('Liquidité identifiable'); }
    else { liqScore = 2; }
  }
  score += liqScore;

  // Premium/Discount (0-4 pts)
  let premScore = 0;
  if (premium) {
    const isDiscount = premium.type.includes('Discount');
    const isPremium = premium.type.includes('Premium');
    if ((signal.signal === 'ACHAT' && isDiscount) || (signal.signal === 'VENTE' && isPremium)) {
      premScore = 4; confirmations.push(`Zone ${premium.type} favorable`);
    } else if ((signal.signal === 'ACHAT' && isPremium) || (signal.signal === 'VENTE' && isDiscount)) {
      premScore = 1; confirmations.push(`Zone ${premium.type} défavorable`);
    } else {
      premScore = 2;
    }
  }
  score += premScore;

  // 2. Multi-Timeframe Alignment (max 30 points)
  const tfScore = calculateTimeframeAlignmentScore(timeframeSignals, signal.signal);
  score += tfScore.score;
  if (tfScore.score >= 25) confirmations.push('Alignement MTF fort');
  else if (tfScore.score >= 15) confirmations.push('Alignement MTF modéré');
  else if (tfScore.score > 0) confirmations.push('Alignement MTF faible');

  // 3. Risk/Reward Quality (max 15 points)
  const rrValue = parseFloat(signal.riskRewardRatio.replace('1:', '')) || 1;
  let rrScore = 0;
  if (rrValue >= 3) { rrScore = 15; confirmations.push('R/R excellent (≥3)'); }
  else if (rrValue >= 2) { rrScore = 12; confirmations.push('R/R bon (≥2)'); }
  else if (rrValue >= 1.5) { rrScore = 8; confirmations.push('R/R acceptable'); }
  else { rrScore = 4; confirmations.push('R/R faible'); }
  score += rrScore;

  // 4. Entry Quality (max 10 points)
  let entryScore = 0;
  const slDistance = Math.abs(signal.entryPoint - signal.stopLoss) / signal.entryPoint;
  if (slDistance < 0.005) { entryScore = 8; confirmations.push('SL serré — gestion optimale'); }
  else if (slDistance < 0.01) { entryScore = 6; confirmations.push('SL raisonnable'); }
  else if (slDistance < 0.02) { entryScore = 4; confirmations.push('SL large'); }
  else { entryScore = 2; confirmations.push('SL très large'); }
  score += entryScore;

  // 5. Confidence Integration (max 5 points)
  if (signal.confidence >= 80) { score += 5; }
  else if (signal.confidence >= 60) { score += 3; }
  else { score += 1; }

  // Clamp
  score = Math.min(100, Math.max(0, score));

  // Grade
  let grade: InstitutionalAnalysis['grade'];
  let label: string;
  if (score >= 85) { grade = 'A+'; label = 'Excellente'; }
  else if (score >= 70) { grade = 'A'; label = 'Très Fort'; }
  else if (score >= 55) { grade = 'B'; label = 'Valide'; }
  else if (score >= 40) { grade = 'C'; label = 'Moyen'; }
  else { grade = 'D'; label = 'Faible'; }

  // Entry zone & invalidation
  const entryZone = signal.signal === 'ACHAT'
    ? `${(signal.entryPoint * 0.998).toFixed(2)} — ${(signal.entryPoint * 1.002).toFixed(2)}`
    : `${(signal.entryPoint * 0.998).toFixed(2)} — ${(signal.entryPoint * 1.002).toFixed(2)}`;

  const invalidationLevel = signal.signal === 'ACHAT'
    ? `Break sous ${signal.stopLoss.toFixed(2)}`
    : `Break au-dessus de ${signal.stopLoss.toFixed(2)}`;

  return {
    score,
    grade,
    label,
    orderBlocks: { detected: ob?.detected ?? false, price: ob?.price ?? 0, type: ob?.type ?? '' },
    breakOfStructure: {
      detected: bos?.detected ?? false,
      price: bos?.price ?? 0,
      description: bos?.description ?? '',
    },
    fairValueGap: {
      detected: fvg?.detected ?? false,
      price: fvg?.price ?? 0,
      description: fvg?.description ?? '',
    },
    liquidityPools: {
      low: liq?.price ?? signal.entryPoint * 0.99,
      high: (premium?.price ?? signal.entryPoint) * 1.01,
      nearest: signal.entryPoint < (liq?.price ?? 0) ? 'low' : 'high',
    },
    premiumDiscount: {
      equilibrium: premium?.price ?? signal.entryPoint,
      zone: premium?.type.includes('Premium') ? 'Premium' : premium?.type.includes('Discount') ? 'Discount' : 'Equilibrium',
    },
    stopHuntRisk: {
      detected: stopHunt?.detected ?? false,
      distance: stopHunt ? Math.abs(signal.entryPoint - stopHunt.price) / signal.entryPoint : 1,
      description: stopHunt?.description ?? '',
    },
    timeframeAlignment: tfScore.score,
    alignmentDirection: tfScore.direction,
    alignmentComment: tfScore.comment,
    entryZone,
    invalidationLevel,
    confirmationRequired: confirmations,
    institutionalBias: signal.signal === 'ACHAT' ? 'haussier' : signal.signal === 'VENTE' ? 'baissier' : 'neutre',
    recommendation: generateRecommendation(score, signal, confirmations),
  };
}

// ─── Timeframe Alignment ────────────────────────────────

function calculateTimeframeAlignmentScore(
  tfs: MultiTimeframeSignal[],
  mainSignal: string
): { score: number; direction: 'bullish' | 'bearish' | 'mixed' | 'neutral'; comment: string } {
  if (tfs.length === 0) return { score: 0, direction: 'neutral', comment: 'Aucune donnée MTF' };

  const bullishCount = tfs.filter(t => t.signal === 'ACHAT').length;
  const bearishCount = tfs.filter(t => t.signal === 'VENTE').length;
  const totalActive = bullishCount + bearishCount;

  if (totalActive === 0) return { score: 0, direction: 'neutral', comment: 'Tous les timeframes sont neutres' };

  // Check alignment with main signal
  const alignedCount = mainSignal === 'ACHAT' ? bullishCount : mainSignal === 'VENTE' ? bearishCount : 0;
  const alignmentRatio = totalActive > 0 ? alignedCount / totalActive : 0;

  // Higher timeframes weight more
  const weights: Record<string, number> = { M5: 1, M15: 2, M30: 3, H1: 4, H4: 5, D1: 6 };
  let weightedAlign = 0;
  let totalWeight = 0;
  for (const tf of tfs) {
    const w = weights[tf.timeframe] || 3;
    totalWeight += w;
    if (tf.signal === mainSignal) weightedAlign += w;
  }
  const weightedRatio = totalWeight > 0 ? weightedAlign / totalWeight : 0;

  const score = Math.round(weightedRatio * 30);

  let direction: 'bullish' | 'bearish' | 'mixed' | 'neutral';
  let comment: string;

  if (bullishCount >= 4 && bearishCount <= 1) {
    direction = 'bullish';
    comment = 'Biais haussier fort multi-timeframes';
  } else if (bearishCount >= 4 && bullishCount <= 1) {
    direction = 'bearish';
    comment = 'Biais baissier fort multi-timeframes';
  } else if (alignmentRatio >= 0.7) {
    direction = mainSignal === 'ACHAT' ? 'bullish' : 'bearish';
    comment = 'Alignement MTF favorable au signal principal';
  } else if (alignmentRatio >= 0.4) {
    direction = 'mixed';
    comment = 'Alignement MTF partiel — prudence recommandée';
  } else {
    direction = 'mixed';
    comment = 'Timeframes contradictoires — signal faible';
  }

  return { score: Math.min(30, score), direction, comment };
}

// ─── Timeframe Analysis ─────────────────────────────────

export function analyzeTimeframes(
  signals: MultiTimeframeSignal[],
  asset: string
): TimeframeAnalysis {
  const bullishCount = signals.filter(s => s.signal === 'ACHAT').length;
  const bearishCount = signals.filter(s => s.signal === 'VENTE').length;
  const total = signals.length;

  // Check for contradictions (short vs long term)
  const shortTerm = signals.filter(s => ['M5', 'M15', 'M30'].includes(s.timeframe));
  const longTerm = signals.filter(s => ['H4', 'D1'].includes(s.timeframe));
  const shortBull = shortTerm.filter(s => s.signal === 'ACHAT').length;
  const shortBear = shortTerm.filter(s => s.signal === 'VENTE').length;
  const longBull = longTerm.filter(s => s.signal === 'ACHAT').length;
  const longBear = longTerm.filter(s => s.signal === 'VENTE').length;

  let conclusion: string;
  let conclusionType: TimeframeAnalysis['conclusionType'];

  if (bullishCount >= 4 && bearishCount <= 1) {
    if (longBull >= longTerm.length - 1) {
      conclusion = 'Signal fortement confirmé — Biais institutionnel haussier';
      conclusionType = 'strong';
    } else {
      conclusion = 'Signal confirmé — Court terme haussier';
      conclusionType = 'strong';
    }
  } else if (bearishCount >= 4 && bullishCount <= 1) {
    if (longBear >= longTerm.length - 1) {
      conclusion = 'Signal fortement confirmé — Biais institutionnel baissier';
      conclusionType = 'strong';
    } else {
      conclusion = 'Signal confirmé — Court terme baissier';
      conclusionType = 'strong';
    }
  } else if (shortBull > shortBear && longBear > longBull) {
    conclusion = 'Risque de contre-tendance — Le long terme va contre le court terme';
    conclusionType = 'contradictory';
  } else if (shortBear > shortBull && longBull > longBear) {
    conclusion = 'Risque de contre-tendance — Le long terme va contre le court terme';
    conclusionType = 'contradictory';
  } else if (bullishCount >= 3 || bearishCount >= 3) {
    conclusion = 'Signal modérément confirmé — Validation requise sur timeframes supérieurs';
    conclusionType = 'moderate';
  } else {
    conclusion = 'Signal faible ou attente recommandée — Timeframes contradictoires';
    conclusionType = 'weak';
  }

  // XAU special analysis
  let xauSpecial: XAUInstitutionalAnalysis | undefined;
  if (asset === 'XAU/USD' && signals.length > 0) {
    const h1Signal = signals.find(s => s.timeframe === 'H1');
    const currentPrice = h1Signal ? h1Signal.confidence * 10 + 2400 : 2470; // Approximation
    xauSpecial = generateXAUAnalysis(currentPrice, signals);
  }

  return {
    signals,
    conclusion,
    conclusionType,
    overallDirection: bullishCount > bearishCount ? 'HAUSSIÈRE' : bearishCount > bullishCount ? 'BAISSIÈRE' : 'NEUTRE',
    xauSpecial,
  };
}

// ─── XAU Special Analysis ───────────────────────────────

function generateXAUAnalysis(
  currentPrice: number,
  signals: MultiTimeframeSignal[]
): XAUInstitutionalAnalysis {
  const bullishCount = signals.filter(s => s.signal === 'ACHAT').length;
  const bearishCount = signals.filter(s => s.signal === 'VENTE').length;
  const sentiment: XAUInstitutionalAnalysis['sentiment'] = bullishCount > bearishCount ? 'haussier' : bearishCount > bullishCount ? 'baissier' : 'neutre';

  return {
    buyZone: {
      min: currentPrice * 0.992,
      max: currentPrice * 0.998,
      quality: bullishCount >= 4 ? 'Excellente' : bullishCount >= 2 ? 'Bonne' : 'Risquée',
    },
    sellZone: {
      min: currentPrice * 1.002,
      max: currentPrice * 1.008,
      quality: bearishCount >= 4 ? 'Excellente' : bearishCount >= 2 ? 'Bonne' : 'Risquée',
    },
    mainLiquidity: currentPrice * (sentiment === 'haussier' ? 0.988 : 1.012),
    criticalBreakLevel: currentPrice * (sentiment === 'haussier' ? 0.985 : 1.015),
    idealPullbackZone: currentPrice * (sentiment === 'haussier' ? 0.995 : 1.005),
    likelyProfitZone: currentPrice * (sentiment === 'haussier' ? 1.012 : 0.988),
    usdCorrelation: 'Inverse — Renforcement USD = pression baissière sur XAU',
    sentiment,
    newsRisk: 'FOMC, NFP et CPI peuvent créer des gaps de 20-50$',
    institutionalBias: sentiment === 'haussier'
      ? 'Accumulation institutionnelle probable — Favoriser les achats sur pullback'
      : sentiment === 'baissier'
        ? 'Distribution institutionnelle — Favoriser les ventes sur rebond'
        : 'Range institutionnel — Attendre une cassure claire',
  };
}

// ─── Helper ─────────────────────────────────────────────

function generateRecommendation(score: number, signal: AISignal, confirmations: string[]): string {
  if (score >= 80) {
    return `${signal.asset} — Signal ${signal.signal} avec score institutionnel de ${score}/100. ${confirmations.slice(0, 3).join('. ')}. Le ratio R/R de ${signal.riskRewardRatio} est excellent. Entrée recommandée dans la zone ${signal.entryPoint.toFixed(2)} avec SL à ${signal.stopLoss.toFixed(2)}.`;
  } else if (score >= 60) {
    return `${signal.asset} — Signal ${signal.signal} valide (${score}/100). ${confirmations.slice(0, 2).join('. ')}. Attendre une confirmation de prix avant d'entrer. Zone d'entrée: ${signal.entryPoint.toFixed(2)}.`;
  } else if (score >= 40) {
    return `${signal.asset} — Signal ${signal.signal} modéré (${score}/100). ${confirmations[0] || 'Analyse limitée'}. Prudence recommandée — réduire la taille de position ou attendre.`;
  } else {
    return `${signal.asset} — Signal ${signal.signal} faible (${score}/100). ${confirmations[0] || 'Insuffisamment de confirmations'}. Éviter ce signal ou attendre une meilleure configuration.`;
  }
}
