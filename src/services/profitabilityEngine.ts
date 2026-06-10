/**
 * Profitability Engine — Moteur central de décision rentabilité
 *
 * Transforme les analyses dispersées (technique, IA, institutionnelle)
 * en décisions claires : ACHETER / VENDRE / ATTENDRE / ÉVITER
 *
 * Grading : A+ (forte) → D (à éviter)
 * No Trade Zone : détection automatique des conditions défavorables
 * Risque avant profit : analyse R/R, SL distance, position sizing
 */

import type { AISignal } from './aiSignalEngine';
import type { InstitutionalAnalysis, MultiTimeframeSignal } from './institutionalScoreService';

// ─── Grade System ───────────────────────────────────────

export type SignalGrade = 'A+' | 'A' | 'B' | 'C' | 'D';

export interface GradeResult {
  grade: SignalGrade;
  label: string;       // "Opportunité très forte", "Valide", etc.
  color: string;       // CSS color class
  score: number;       // 0-100 composite
}

// ─── Decision Types ─────────────────────────────────────

export type FinalDecision = 'ACHETER' | 'VENDRE' | 'ATTENDRE' | 'EVITER';

export interface DecisionResult {
  decision: FinalDecision;
  confidence: number;  // 0-100
  explanation: string;
  actionItems: string[];
  color: string;
  icon: 'buy' | 'sell' | 'wait' | 'avoid';
}

// ─── No Trade Zone ──────────────────────────────────────

export interface NoTradeCheck {
  condition: string;
  active: boolean;
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

export interface NoTradeResult {
  isNoTradeZone: boolean;
  checks: NoTradeCheck[];
  overallMessage: string;
  reasonCount: number;
  criticalCount: number;
}

// ─── Risk Analysis ──────────────────────────────────────

export interface RiskAnalysis {
  riskAmount: number;        // Perte potentielle en pips/%
  rewardAmount: number;      // Gain potentiel en pips/%
  rrRatio: number;           // Ratio numérique (ex: 2.5)
  rrLabel: string;           // "1:2.5"
  slDistance: number;        // Distance SL en %
  tpDistance: number;        // Distance TP1 en %
  riskPercent: number;       // Risque du capital (%)
  positionSize: number;      // Taille recommandée (lots/unités)
  forCapital: number;        // Capital de référence
  isRRAcceptable: boolean;   // R/R >= 1:1.5
  isRiskHigh: boolean;       // Risque > 2%
  warning: string | null;
  recommendation: string;
}

// ─── Trade Plan ─────────────────────────────────────────

export interface TradePlan {
  asset: string;
  signal: string;
  idealEntry: number;
  aggressiveEntry: number;
  conservativeEntry: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  tp3: number;
  invalidationLevel: string;
  mainScenario: string;
  altScenario: string;
  whyEnter: string;
  whyAvoid: string;
  cancelIf: string;
}

// ─── Performance Stats ──────────────────────────────────

export interface SignalPerformance {
  totalSignals: number;
  winningSignals: number;
  losingSignals: number;
  breakEvenSignals: number;
  winRate: number;
  profitFactor: number;
  avgGain: number;
  avgLoss: number;
  maxDrawdown: number;
  bestAsset: string;
  worstAsset: string;
  bestTimeframe: string;
  bestSession: string;
}

// ─── Tech / IA / Institutional Grid ─────────────────────

export interface ValidationGrid {
  technicalAnalysis: { result: string; confidence: number; color: string };
  iaAnalysis: { result: string; confidence: number; color: string };
  institutionalAnalysis: { result: string; confidence: number; color: string };
  newsRisk: { result: string; severity: 'low' | 'medium' | 'high'; color: string };
  finalDecision: { result: string; confidence: number; color: string };
  agreement: 'aligned' | 'partial' | 'contradictory';
}

// ════════════════════════════════════════════════════════
//  IMPLEMENTATION
// ════════════════════════════════════════════════════════

// ─── 1. GRADE CALCULATION ───────────────────────────────

export function calculateGrade(
  signal: AISignal,
  instScore: number = 0,
  alignmentScore: number = 0
): GradeResult {
  // Composite score (0-100)
  let score = 0;

  // IA Score (0-40 pts)
  score += Math.min(40, (signal.confidence / 100) * 40);

  // Institutional Score (0-30 pts)
  score += Math.min(30, (instScore / 100) * 30);

  // Multi-timeframe alignment (0-15 pts)
  score += Math.min(15, (alignmentScore / 30) * 15);

  // Risk/Reward quality (0-15 pts)
  const rr = parseFloat(signal.riskRewardRatio.replace('1:', '')) || 1;
  if (rr >= 3) score += 15;
  else if (rr >= 2) score += 12;
  else if (rr >= 1.5) score += 8;
  else if (rr >= 1) score += 4;
  else score += 1;

  score = Math.round(Math.min(100, Math.max(0, score)));

  // Grade mapping
  if (score >= 85) return { grade: 'A+', label: 'Opportunité très forte', color: 'text-emerald-400', score };
  if (score >= 70) return { grade: 'A', label: 'Opportunité valide', color: 'text-emerald-400', score };
  if (score >= 55) return { grade: 'B', label: 'Opportunité moyenne', color: 'text-blue-400', score };
  if (score >= 40) return { grade: 'C', label: 'Risque élevé', color: 'text-amber-400', score };
  return { grade: 'D', label: 'Signal à éviter', color: 'text-red-400', score };
}

// ─── 2. NO TRADE ZONE DETECTION ─────────────────────────

export function detectNoTradeZone(
  signal: AISignal,
  instAnalysis?: InstitutionalAnalysis,
  timeframeSignals?: MultiTimeframeSignal[]
): NoTradeResult {
  const checks: NoTradeCheck[] = [];

  // 1. Signal too weak
  checks.push({
    condition: 'signal_faible',
    active: signal.confidence < 50,
    severity: 'critical',
    message: signal.confidence < 50
      ? `Score IA trop faible (${signal.confidence}%) — signal non fiable`
      : `Score IA acceptable (${signal.confidence}%)`,
  });

  // 2. ATTENTE signal
  checks.push({
    condition: 'signal_neutre',
    active: signal.signal === 'ATTENTE',
    severity: 'warning',
    message: signal.signal === 'ATTENTE'
      ? 'Signal neutre — aucune direction claire détectée'
      : `Signal directionnel : ${signal.signal}`,
  });

  // 3. Poor R/R
  const rr = parseFloat(signal.riskRewardRatio.replace('1:', '')) || 0;
  checks.push({
    condition: 'rr_faible',
    active: rr < 1.5,
    severity: 'critical',
    message: rr < 1.5
      ? `Ratio R/R insuffisant (${signal.riskRewardRatio}) — minimum recommandé 1:1.5`
      : `Ratio R/R favorable (${signal.riskRewardRatio})`,
  });

  // 4. High risk level
  checks.push({
    condition: 'risque_eleve',
    active: signal.riskLevel === 'Élevé',
    severity: 'warning',
    message: signal.riskLevel === 'Élevé'
      ? 'Niveau de risque élevé — réduire la taille de position'
      : `Risque ${signal.riskLevel.toLowerCase()}`,
  });

  // 5. Timeframe contradictions
  let hasContradictions = false;
  if (timeframeSignals && timeframeSignals.length > 0) {
    const bullish = timeframeSignals.filter(t => t.signal === 'ACHAT').length;
    const bearish = timeframeSignals.filter(t => t.signal === 'VENTE').length;
    const total = bullish + bearish;
    hasContradictions = total > 0 && (Math.max(bullish, bearish) / total) < 0.6;
  }
  checks.push({
    condition: 'timeframes_contradictoires',
    active: hasContradictions,
    severity: 'warning',
    message: hasContradictions
      ? 'Timeframes contradictoires — pas de consensus directionnel'
      : 'Timeframes cohérents',
  });

  // 6. Institutional score low
  checks.push({
    condition: 'score_institutionnel_faible',
    active: !!instAnalysis && instAnalysis.score < 45,
    severity: 'warning',
    message: instAnalysis && instAnalysis.score < 45
      ? `Score institutionnel faible (${instAnalysis.score}/100) — pas de confirmations Smart Money`
      : instAnalysis
        ? `Score institutionnel ${instAnalysis.score}/100`
        : 'Analyse institutionnelle non disponible',
  });

  // 7. Stop Loss too wide
  const slDist = Math.abs(signal.entryPoint - signal.stopLoss) / signal.entryPoint * 100;
  checks.push({
    condition: 'stop_loss_large',
    active: slDist > 1.5,
    severity: 'warning',
    message: slDist > 1.5
      ? `Stop Loss très large (${slDist.toFixed(2)}%) — risque excessif`
      : `Stop Loss raisonnable (${slDist.toFixed(2)}%)`,
  });

  // 8. Price in middle of range (no clear direction)
  checks.push({
    condition: 'sans_direction',
    active: signal.signal === 'ATTENTE' && signal.confidence < 55,
    severity: 'info',
    message: signal.signal === 'ATTENTE' && signal.confidence < 55
      ? 'Prix au milieu d\'une zone sans direction claire'
      : 'Direction identifiable',
  });

  const criticalCount = checks.filter(c => c.active && c.severity === 'critical').length;
  const warningCount = checks.filter(c => c.active && c.severity === 'warning').length;
  const activeCount = checks.filter(c => c.active).length;

  const isNoTradeZone = criticalCount >= 2 || activeCount >= 4 || (criticalCount >= 1 && warningCount >= 2);

  let overallMessage: string;
  if (isNoTradeZone) {
    overallMessage = `❌ NO TRADE ZONE — ${activeCount} condition${activeCount > 1 ? 's' : ''} défavorable${activeCount > 1 ? 's' : ''} détectée${activeCount > 1 ? 's' : ''}. Attendre une meilleure configuration.`;
  } else if (warningCount > 0) {
    overallMessage = `⚠️ PRUDENCE — ${warningCount} avertissement${warningCount > 1 ? 's' : ''}. Signal tradeable avec précautions.`;
  } else {
    overallMessage = '✅ Conditions favorables — signal validé par le moteur de décision.';
  }

  return { isNoTradeZone, checks, overallMessage, reasonCount: activeCount, criticalCount };
}

// ─── 3. RISK BEFORE PROFIT ──────────────────────────────

export function analyzeRiskBeforeProfit(
  signal: AISignal,
  capital: number = 10000
): RiskAnalysis {
  const slDistance = Math.abs(signal.entryPoint - signal.stopLoss);
  const tpDistance = Math.abs(signal.takeProfit1 - signal.entryPoint);
  const rr = slDistance > 0 ? tpDistance / slDistance : 0;
  const slPct = (slDistance / signal.entryPoint) * 100;
  const tpPct = (tpDistance / signal.entryPoint) * 100;

  // Risk 1% of capital per trade
  const riskPercent = 1.0;
  const riskAmount = capital * (riskPercent / 100);
  const positionSize = slDistance > 0 ? riskAmount / slDistance : 0;

  const isRRAcceptable = rr >= 1.5;
  const isRiskHigh = slPct > 2.0;

  let warning: string | null = null;
  if (!isRRAcceptable) {
    warning = `⚠️ Ratio R/R insuffisant (${rr.toFixed(1)}:1). Minimum recommandé: 1:1.5. Ce signal est déconseillé sauf confirmation supplémentaire.`;
  } else if (isRiskHigh) {
    warning = `⚠️ Le Stop Loss est trop éloigné (${slPct.toFixed(2)}%). Réduisez la taille de position ou attendez un meilleur point d'entrée.`;
  }

  let recommendation: string;
  if (rr >= 3 && !isRiskHigh) {
    recommendation = `Opportunité intéressante — R/R de ${rr.toFixed(1)}:1 avec risque maîtrisé. Taille recommandée: ${positionSize.toFixed(2)} unités pour ${riskPercent}% de risque sur ${capital.toLocaleString()}€.`;
  } else if (rr >= 1.5 && !isRiskHigh) {
    recommendation = `Signal acceptable — R/R de ${rr.toFixed(1)}:1. Taille recommandée: ${positionSize.toFixed(2)} unités. Surveillez la confirmation avant l'entrée.`;
  } else if (isRiskHigh) {
    recommendation = `Risque excessif — le SL représente ${slPct.toFixed(2)}% du prix. Attendre un pullback pour réduire le SL, ou réduire la taille à ${(positionSize * 0.5).toFixed(2)} unités.`;
  } else {
    recommendation = `Signal à éviter — R/R de ${rr.toFixed(1)}:1 insuffisant. Attendre une meilleure configuration.`;
  }

  return {
    riskAmount: slDistance,
    rewardAmount: tpDistance,
    rrRatio: rr,
    rrLabel: `1:${rr.toFixed(1)}`,
    slDistance: slPct,
    tpDistance: tpPct,
    riskPercent,
    positionSize,
    forCapital: capital,
    isRRAcceptable,
    isRiskHigh,
    warning,
    recommendation,
  };
}

// ─── 4. TRADE PLAN GENERATOR ────────────────────────────

export function generateTradePlan(signal: AISignal): TradePlan {
  const slDist = Math.abs(signal.entryPoint - signal.stopLoss);
  const isBuy = signal.signal === 'ACHAT';

  // Three entry types
  const idealEntry = signal.entryPoint;
  const aggressiveEntry = isBuy
    ? signal.entryPoint + slDist * 0.3    // Enter earlier (higher risk)
    : signal.entryPoint - slDist * 0.3;
  const conservativeEntry = isBuy
    ? signal.entryPoint - slDist * 0.5    // Wait for better price
    : signal.entryPoint + slDist * 0.5;

  return {
    asset: signal.asset,
    signal: signal.signal,
    idealEntry,
    aggressiveEntry,
    conservativeEntry,
    stopLoss: signal.stopLoss,
    tp1: signal.takeProfit1,
    tp2: signal.takeProfit2,
    tp3: signal.takeProfit3,
    invalidationLevel: isBuy
      ? `Break sous ${signal.stopLoss.toFixed(4)}`
      : `Break au-dessus de ${signal.stopLoss.toFixed(4)}`,
    mainScenario: isBuy
      ? `Pullback sur support institutionnel puis rebond haussier vers ${signal.takeProfit1.toFixed(2)}`
      : `Rebond sur résistance institutionnelle puis correction baissière vers ${signal.takeProfit1.toFixed(2)}`,
    altScenario: isBuy
      ? `Consolidation latérale puis breakout haussier`
      : `Consolidation latérale puis breakdown baissier`,
    whyEnter: `${signal.asset} présente un signal ${signal.signal} avec ${signal.confidence}% de confiance. Ratio R/R: ${signal.riskRewardRatio}. Niveau de risque: ${signal.riskLevel.toLowerCase()}.`,
    whyAvoid: `Si le prix casse ${signal.stopLoss.toFixed(4)} avant l'entrée, le signal est invalidé. Si la volatilité augmente de plus de 50%, réduire la taille ou annuler.`,
    cancelIf: `Prix invalide le niveau de ${signal.stopLoss.toFixed(4)}, volatilité > 3× moyenne, ou news haute impact dans moins de 30 minutes.`,
  };
}

// ─── 5. FINAL DECISION ENGINE ───────────────────────────

export function calculateFinalDecision(
  signal: AISignal,
  grade: GradeResult,
  noTrade: NoTradeResult,
  risk: RiskAnalysis
): DecisionResult {
  // No Trade Zone overrides everything
  if (noTrade.isNoTradeZone) {
    return {
      decision: 'ATTENDRE',
      confidence: Math.round((100 - grade.score) * 0.6),
      explanation: noTrade.overallMessage + ` Le signal ${signal.asset} présente trop de conditions défavorables. La meilleure décision est de ne pas trader actuellement.`,
      actionItems: [
        'Attendre une meilleure configuration',
        `Surveiller le niveau de ${signal.entryPoint.toFixed(4)}`,
        'Confirmer sur timeframe supérieur',
      ],
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      icon: 'wait',
    };
  }

  // D grade → ÉVITER
  if (grade.grade === 'D') {
    return {
      decision: 'EVITER',
      confidence: 85,
      explanation: `Signal ${signal.asset} classé D (${grade.score}/100) — ${grade.label}. Le ratio R/R de ${signal.riskRewardRatio} est insuffisant et le score IA de ${signal.confidence}% ne justifie pas une entrée.`,
      actionItems: [
        'Ignorer ce signal',
        'Chercher une meilleure opportunité',
        `Surveiller ${signal.asset} pour un prochain setup`,
      ],
      color: 'text-red-400 border-red-500/30 bg-red-500/10',
      icon: 'avoid',
    };
  }

  // C grade with poor R/R → ATTENDRE
  if (grade.grade === 'C' && !risk.isRRAcceptable) {
    return {
      decision: 'ATTENDRE',
      confidence: 60,
      explanation: `Signal ${signal.asset} classé C (${grade.score}/100). Techniquement valide mais le ratio R/R de ${risk.rrLabel} est sous le minimum recommandé. Attendre un meilleur point d'entrée ou une confirmation supplémentaire.`,
      actionItems: [
        `Attendre un pullback vers ${(signal.entryPoint * 0.995).toFixed(4)}`,
        'Confirmer sur H4 avant entrée',
        'Réduire la taille si vous entrez quand même',
      ],
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      icon: 'wait',
    };
  }

  // A+ or A → ACHETER/VENDRE
  if ((grade.grade === 'A+' || grade.grade === 'A') && risk.isRRAcceptable && !risk.isRiskHigh) {
    const isBuy = signal.signal === 'ACHAT';
    return {
      decision: isBuy ? 'ACHETER' : 'VENDRE',
      confidence: grade.score,
      explanation: `${signal.asset} — Signal ${grade.grade} (${grade.score}/100). ${grade.label} avec R/R ${risk.rrLabel}. ${risk.recommendation}`,
      actionItems: [
        `Entrée idéale: ${signal.entryPoint.toFixed(4)}`,
        `Stop Loss: ${signal.stopLoss.toFixed(4)} (${risk.slDistance.toFixed(2)}%)`,
        `TP1: ${signal.takeProfit1.toFixed(4)} | TP2: ${signal.takeProfit2.toFixed(4)} | TP3: ${signal.takeProfit3.toFixed(4)}`,
        `Taille: ${risk.positionSize.toFixed(2)} unités (risque ${risk.riskPercent}%)`,
      ],
      color: isBuy ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10',
      icon: isBuy ? 'buy' : 'sell',
    };
  }

  // B or C with acceptable R/R → ATTENDRE
  const isBuy = signal.signal === 'ACHAT';
  return {
    decision: 'ATTENDRE',
    confidence: grade.score,
    explanation: `${signal.asset} — Signal ${grade.grade} (${grade.score}/100). ${grade.label}. ${risk.recommendation}`,
    actionItems: [
      `Surveiller la zone ${signal.entryPoint.toFixed(4)}`,
      'Attendre confirmation de momentum',
      risk.isRRAcceptable ? 'R/R acceptable — prêt à entrer sur confirmation' : 'R/R insuffisant — attendre meilleur point',
    ],
    color: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    icon: 'wait',
  };
}

// ─── 6. VALIDATION GRID (Tech / IA / Institutional) ─────

export function generateValidationGrid(
  signal: AISignal,
  instAnalysis?: InstitutionalAnalysis
): ValidationGrid {
  // Technical analysis result
  const techResult = signal.signal === 'ACHAT'
    ? 'Achat — Confirmé par RSI/MACD/EMA'
    : signal.signal === 'VENTE'
      ? 'Vente — Confirmé par RSI/MACD/EMA'
      : 'Neutre — Aucun signal technique clair';
  const techConf = signal.confidence;

  // IA analysis
  const iaResult = signal.confidence >= 80
    ? `${signal.signal} fortement confirmé (${signal.confidence}%)`
    : signal.confidence >= 60
      ? `${signal.signal} modérément confirmé (${signal.confidence}%)`
      : `Signal faible — ${signal.confidence}% de confiance`;
  const iaConf = signal.confidence;

  // Institutional analysis
  let instResult: string;
  let instConf: number;
  if (instAnalysis) {
    instConf = instAnalysis.score;
    if (instAnalysis.score >= 70) {
      instResult = `${signal.signal} aligné avec Smart Money (${instAnalysis.score}%)`;
    } else if (instAnalysis.score >= 50) {
      instResult = `${signal.signal} — Alignement partiel (${instAnalysis.score}%)`;
    } else {
      instResult = `Pas de confirmation institutionnelle (${instAnalysis.score}%)`;
    }
  } else {
    instResult = 'Analyse institutionnelle non disponible';
    instConf = 0;
  }

  // News risk (simulated — would connect to CalendarPage)
  const newsRisk: ValidationGrid['newsRisk'] = {
    result: signal.volatility > 30
      ? 'Risque élevé — Volatilité anormale'
      : signal.volatility > 20
        ? 'Risque moyen — Attention aux annonces'
        : 'Risque faible — Conditions normales',
    severity: signal.volatility > 30 ? 'high' : signal.volatility > 20 ? 'medium' : 'low',
    color: signal.volatility > 30 ? 'text-red-400' : signal.volatility > 20 ? 'text-amber-400' : 'text-emerald-400',
  };

  // Agreement check
  let agreement: ValidationGrid['agreement'];
  const signalsAlign = signal.confidence >= 60 && (!instAnalysis || instAnalysis.score >= 50);
  const bothBuy = signal.signal === 'ACHAT' && (!instAnalysis || instAnalysis.institutionalBias === 'haussier');
  const bothSell = signal.signal === 'VENTE' && (!instAnalysis || instAnalysis.institutionalBias === 'baissier');

  if (signalsAlign && (bothBuy || bothSell)) {
    agreement = 'aligned';
  } else if (signal.signal === 'ATTENTE' || !instAnalysis) {
    agreement = 'partial';
  } else {
    agreement = 'contradictory';
  }

  // Final decision
  const grade = calculateGrade(signal, instAnalysis?.score || 0, instAnalysis?.timeframeAlignment || 0);
  const noTrade = detectNoTradeZone(signal, instAnalysis);
  const risk = analyzeRiskBeforeProfit(signal);
  const final = calculateFinalDecision(signal, grade, noTrade, risk);

  return {
    technicalAnalysis: { result: techResult, confidence: techConf, color: signal.signal === 'ACHAT' ? 'text-emerald-400' : signal.signal === 'VENTE' ? 'text-red-400' : 'text-amber-400' },
    iaAnalysis: { result: iaResult, confidence: iaConf, color: iaConf >= 80 ? 'text-emerald-400' : iaConf >= 60 ? 'text-blue-400' : 'text-amber-400' },
    institutionalAnalysis: { result: instResult, confidence: instConf, color: instConf >= 70 ? 'text-emerald-400' : instConf >= 50 ? 'text-blue-400' : 'text-amber-400' },
    newsRisk,
    finalDecision: { result: final.explanation.substring(0, 120) + '...', confidence: final.confidence, color: final.color.split(' ')[0] },
    agreement,
  };
}

// ─── 7. FILTER BY PROFITABILITY ─────────────────────────

export type ProfitabilityFilter = 'best_rr' | 'highest_probability' | 'lowest_risk' | 'most_confirmed' | 'grade_a_only' | 'avoid';

export function filterByProfitability(
  signals: Array<{ signal: AISignal; grade?: GradeResult; noTrade?: NoTradeResult }>,
  filter: ProfitabilityFilter
): typeof signals {
  switch (filter) {
    case 'best_rr':
      return [...signals].sort((a, b) => {
        const rrA = parseFloat(a.signal.riskRewardRatio.replace('1:', '')) || 0;
        const rrB = parseFloat(b.signal.riskRewardRatio.replace('1:', '')) || 0;
        return rrB - rrA;
      });
    case 'highest_probability':
      return [...signals].sort((a, b) => b.signal.confidence - a.signal.confidence);
    case 'lowest_risk':
      return [...signals].sort((a, b) => {
        const riskA = a.signal.riskLevel === 'Faible' ? 0 : a.signal.riskLevel === 'Modéré' ? 1 : 2;
        const riskB = b.signal.riskLevel === 'Faible' ? 0 : b.signal.riskLevel === 'Modéré' ? 1 : 2;
        return riskA - riskB;
      });
    case 'most_confirmed':
      return [...signals].sort((a, b) => {
        const cA = a.grade?.score || a.signal.confidence;
        const cB = b.grade?.score || b.signal.confidence;
        return cB - cA;
      });
    case 'grade_a_only':
      return signals.filter(s => s.grade && (s.grade.grade === 'A+' || s.grade.grade === 'A'));
    case 'avoid':
      return signals.filter(s => s.noTrade?.isNoTradeZone || s.grade?.grade === 'D' || s.grade?.grade === 'C');
    default:
      return signals;
  }
}

// ─── 8. DECISION OF THE DAY ─────────────────────────────

export interface DayDecision {
  headline: string;
  bestOpportunity: { asset: string; signal: string; grade: SignalGrade; why: string } | null;
  marketsToWatch: string[];
  marketsToAvoid: string[];
  riskLevel: 'low' | 'medium' | 'high';
  summary: string;
  noTradeToday: boolean;
}

export function generateDayDecision(
  signals: AISignal[],
  grades?: Map<string, GradeResult>,
  noTradeResults?: Map<string, NoTradeResult>
): DayDecision {
  if (signals.length === 0) {
    return {
      headline: 'Aucun signal disponible',
      bestOpportunity: null,
      marketsToWatch: [],
      marketsToAvoid: [],
      riskLevel: 'medium',
      summary: 'Les données de marché ne sont pas encore chargées. Revenez dans quelques minutes.',
      noTradeToday: true,
    };
  }

  // Filter active signals (not ATTENTE)
  const activeSignals = signals.filter(s => s.signal !== 'ATTENTE');

  // Check if all are in No Trade Zone
  const allNoTrade = noTradeResults
    ? activeSignals.every(s => noTradeResults.get(s.id)?.isNoTradeZone)
    : false;

  if (allNoTrade || activeSignals.length === 0) {
    return {
      headline: '🛡️ No Trade Zone — Marché instable',
      bestOpportunity: null,
      marketsToWatch: signals.slice(0, 3).map(s => s.asset),
      marketsToAvoid: signals.map(s => s.asset),
      riskLevel: 'high',
      summary: 'Aucune entrée recommandée actuellement. Les conditions de marché ne sont pas favorables — attente d\'une meilleure configuration.',
      noTradeToday: true,
    };
  }

  // Find best opportunity
  let bestSignal = activeSignals[0];
  let bestScore = 0;

  for (const sig of activeSignals) {
    const grade = grades?.get(sig.id);
    const score = grade?.score || sig.confidence;
    if (score > bestScore) {
      bestScore = score;
      bestSignal = sig;
    }
  }

  const bestGrade = grades?.get(bestSignal.id);
  const isAPlus = bestGrade?.grade === 'A+' || bestGrade?.grade === 'A';

  // Markets trending
  const bullishAssets = signals.filter(s => s.signal === 'ACHAT').map(s => s.asset);
  const bearishAssets = signals.filter(s => s.signal === 'VENTE').map(s => s.asset);

  // Risk assessment
  const avgConfidence = signals.reduce((s, sig) => s + sig.confidence, 0) / signals.length;
  const riskLevel: DayDecision['riskLevel'] = avgConfidence >= 75 ? 'low' : avgConfidence >= 55 ? 'medium' : 'high';

  return {
    headline: isAPlus
      ? `🎯 ${bestSignal.asset} — Meilleure opportunité (${bestGrade?.grade || 'A'})`
      : `⚠️ Conditions mitigées — Prudence recommandée`,
    bestOpportunity: {
      asset: bestSignal.asset,
      signal: bestSignal.signal,
      grade: bestGrade?.grade || 'B',
      why: `${bestSignal.asset} offre ${bestSignal.signal} avec ${bestSignal.confidence}% de confiance et R/R ${bestSignal.riskRewardRatio}. ${bestGrade?.label || 'Opportunité moyenne'}.`,
    },
    marketsToWatch: [...new Set([bestSignal.asset, ...bullishAssets])].slice(0, 4),
    marketsToAvoid: bearishAssets.slice(0, 3),
    riskLevel,
    summary: isAPlus
      ? `${bestSignal.asset} présente la meilleure configuration du jour. Entrée recommandée uniquement après confirmation sur le timeframe de trading. Gérer le risque avec un SL à ${bestSignal.stopLoss.toFixed(2)}.`
      : `Le marché présente des signaux mitigés. ${bestSignal.asset} est le plus intéressant mais ${bestGrade?.grade === 'B' ? 'nécessite une confirmation' : 'présente des risques'}. Attendre un pullback ou une cassure claire avant d'entrer.`,
    noTradeToday: false,
  };
}
