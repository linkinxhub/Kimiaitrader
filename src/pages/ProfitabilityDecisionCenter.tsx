/**
 * Centre de Décision Rentabilité IA
 * Module central professionnel — transforme les analyses dispersées en décisions claires
 *
 * Ce que le module répond : "Quel est le meilleur signal actuellement, et pourquoi ?"
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, TrendingUp, TrendingDown, Minus, Star, AlertTriangle,
  CheckCircle, Shield, ChevronDown, ChevronUp, Filter, Download,
  FileDown, Zap, BarChart3, Sparkles, ArrowUpDown, Wifi,
  RefreshCw, Eye, Lock, Ban, Clock, Crosshair, Layers,
  TrendingDown as TrendDownIcon, ShieldAlert, CircleDollarSign,
  Brain, Building2, Activity, Newspaper, FileText
} from 'lucide-react';
import { DecisionCenterGuide } from '@/components/FeatureGuide';
import { useInstitutionalSignals } from '@/hooks/useInstitutionalSignals';
import type { EnrichedSignal } from '@/hooks/useInstitutionalSignals';
import { useAuth } from '@/hooks/useAuth';
import { exportSignalsListToPDF } from '@/services/pdfExportService';
import {
  calculateGrade,
  detectNoTradeZone,
  analyzeRiskBeforeProfit,
  generateTradePlan,
  calculateFinalDecision,
  generateValidationGrid,
  filterByProfitability,
  generateDayDecision,
  type SignalGrade,
  type ProfitabilityFilter,
  type FinalDecision,
} from '@/services/profitabilityEngine';

// ─── Grade Badge Colors ─────────────────────────────────

const GRADE_CONFIG: Record<SignalGrade, { bg: string; text: string; border: string; icon: typeof Star }> = {
  'A+': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: Star },
  'A':  { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/25', icon: CheckCircle },
  'B':  { bg: 'bg-blue-500/15',    text: 'text-blue-400',    border: 'border-blue-500/25',    icon: Eye },
  'C':  { bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/25',   icon: AlertTriangle },
  'D':  { bg: 'bg-red-500/15',     text: 'text-red-400',     border: 'border-red-500/25',     icon: Ban },
};

const DECISION_CONFIG: Record<FinalDecision, { color: string; bg: string; border: string; icon: typeof TrendingUp }> = {
  'ACHETER':  { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: TrendingUp },
  'VENDRE':   { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     icon: TrendDownIcon },
  'ATTENDRE': { color: 'text-amber-400',    bg: 'bg-amber-500/10',    border: 'border-amber-500/20',    icon: Clock },
  'EVITER':   { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     icon: Ban },
};

// ─── Main Component ─────────────────────────────────────

export default function ProfitabilityDecisionCenter() {
  const {
    signals, timeframeAnalyses, loading, periodFilter, setPeriodFilter,
    selectedAsset, setSelectedAsset, bestSignals, maxSignals,
    showInstitutional, pack, refresh,
  } = useInstitutionalSignals();

  const [profitFilter, setProfitFilter] = useState<ProfitabilityFilter>('most_confirmed');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Enrich all signals with grades, decisions, etc.
  const enrichedSignals = useMemo(() => {
    return signals.map(sig => {
      const instScore = showInstitutional ? sig.institutionalAnalysis.score : 0;
      const tfAlign = showInstitutional ? sig.institutionalAnalysis.timeframeAlignment : 0;
      const grade = calculateGrade(sig, instScore, tfAlign);
      const noTrade = detectNoTradeZone(sig, showInstitutional ? sig.institutionalAnalysis : undefined, sig.timeframeSignals);
      const risk = analyzeRiskBeforeProfit(sig);
      const decision = calculateFinalDecision(sig, grade, noTrade, risk);
      const plan = generateTradePlan(sig);
      const grid = showInstitutional ? generateValidationGrid(sig, sig.institutionalAnalysis) : null;

      return { ...sig, grade, noTrade, risk, decision, plan, grid };
    });
  }, [signals, showInstitutional]);

  // Apply profitability filter
  const filteredSignals = useMemo(() => {
    const mapped = enrichedSignals.map(e => ({ signal: e, grade: e.grade, noTrade: e.noTrade }));
    const sorted = filterByProfitability(mapped, profitFilter);
    return sorted.map(s => s.signal);
  }, [enrichedSignals, profitFilter]);

  // Day Decision
  const dayDecision = useMemo(() => {
    const gradeMap = new Map(enrichedSignals.map(e => [e.id, e.grade]));
    const noTradeMap = new Map(enrichedSignals.map(e => [e.id, e.noTrade]));
    return generateDayDecision(signals, gradeMap, noTradeMap);
  }, [signals, enrichedSignals]);

  const exportCSV = () => {
    const headers = 'Actif,Signal,Grade,Score IA,Score Inst.,R/R,Risque,Decision,Entree,SL,TP1\n';
    const rows = enrichedSignals.map(s =>
      `${s.asset},${s.signal},${s.grade.grade},${s.confidence}%,${s.institutionalAnalysis.score},${s.riskRewardRatio},${s.riskLevel},${s.decision.decision},${s.entryPoint.toFixed(4)},${s.stopLoss.toFixed(4)},${s.takeProfit1.toFixed(4)}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `decision-center-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && signals.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">Le moteur de decision analyse les marches...</p>
          <p className="text-xs text-slate-600 mt-1">Grading + No Trade Zone + Risque avant Profit</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      <DecisionCenterGuide />
      {/* ─── HEADER ─────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Centre de Decision Rentabilite IA</h1>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <Wifi className="w-3 h-3 text-emerald-400" />
                {enrichedSignals.length} signaux grades — Moins de bruit, plus de qualite
                {!showInstitutional && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px]">
                    <Lock className="w-3 h-3 inline" /> Upgrade Expert
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={refresh} className="p-2 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-400 hover:text-white transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            {enrichedSignals.length > 0 && (
              <>
                <button onClick={exportCSV}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-400 hover:text-white transition-colors">
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
                <button onClick={() => exportSignalsListToPDF(signals.map(s => ({ ...s, source: 'AI-Engine-Live' })))}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-400 hover:text-white transition-colors">
                  <FileDown className="w-3.5 h-3.5" /> PDF
                </button>
              </>
            )}
            <button onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-400 hover:text-white transition-colors">
              <Filter className="w-3.5 h-3.5" /> Filtres
            </button>
          </div>
        </div>

        {/* ─── DECISION DU JOUR ───────────────────────── */}
        <DayDecisionBanner decision={dayDecision} />
      </motion.div>

      {/* ─── FILTERS ────────────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-4">
              {/* Profitability filter */}
              <div>
                <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                  <CircleDollarSign className="w-3 h-3" /> Filtre Rentabilite
                </p>
                <div className="flex flex-wrap gap-2">
                  {([
                    { key: 'most_confirmed' as ProfitabilityFilter, label: 'Plus confirmes', icon: CheckCircle },
                    { key: 'best_rr' as ProfitabilityFilter, label: 'Meilleur R/R', icon: TrendingUp },
                    { key: 'highest_probability' as ProfitabilityFilter, label: 'Probabilite max', icon: Sparkles },
                    { key: 'lowest_risk' as ProfitabilityFilter, label: 'Risque min', icon: Shield },
                    { key: 'grade_a_only' as ProfitabilityFilter, label: 'Grades A/A+ uniquement', icon: Star },
                    { key: 'avoid' as ProfitabilityFilter, label: 'Signaux a eviter', icon: Ban },
                  ]).map(f => (
                    <button key={f.key} onClick={() => setProfitFilter(f.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        profitFilter === f.key ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                      <f.icon className="w-3 h-3" /> {f.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Asset filter */}
              <div>
                <p className="text-xs text-slate-500 mb-2">Actif</p>
                <div className="flex flex-wrap gap-2">
                  {['ALL', 'XAU/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'BTC/USD', 'ETH/USD'].map(asset => (
                    <button key={asset} onClick={() => setSelectedAsset(asset)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedAsset === asset ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                      {asset === 'ALL' ? 'Tous' : asset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── STATS BAR ──────────────────────────────── */}
      {enrichedSignals.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Signaux', value: String(enrichedSignals.length), icon: BarChart3, color: 'text-blue-400' },
            { label: 'Grade A+', value: String(enrichedSignals.filter(s => s.grade.grade === 'A+').length), icon: Star, color: 'text-emerald-400' },
            { label: 'No Trade', value: String(enrichedSignals.filter(s => s.noTrade.isNoTradeZone).length), icon: Ban, color: 'text-red-400' },
            { label: 'Conf. moy', value: `${Math.round(enrichedSignals.reduce((a, s) => a + s.confidence, 0) / enrichedSignals.length)}%`, icon: Activity, color: 'text-purple-400' },
            { label: 'R/R moy', value: `1:${(enrichedSignals.reduce((a, s) => a + parseFloat(s.riskRewardRatio.replace('1:', '')), 0) / enrichedSignals.length).toFixed(1)}`, icon: Crosshair, color: 'text-amber-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <div>
                <p className="text-lg font-bold text-white">{stat.value}</p>
                <p className="text-[10px] text-slate-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── SIGNAL CARDS ───────────────────────────── */}
      {filteredSignals.length > 0 ? (
        <div className="space-y-4">
          {filteredSignals.map((sig, idx) => (
            <SignalDecisionCard
              key={sig.id}
              signal={sig}
              idx={idx}
              isExpanded={expandedId === sig.id}
              onToggle={() => setExpandedId(expandedId === sig.id ? null : sig.id)}
              showInstitutional={showInstitutional}
            />
          ))}
        </div>
      ) : (
        <NoSignalsState onRefresh={refresh} />
      )}

      {/* ─── PACK LIMIT ─────────────────────────────── */}
      {signals.length >= maxSignals && maxSignals !== 999 && (
        <div className="text-center p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
          <p className="text-xs text-amber-400">
            <Lock className="w-3 h-3 inline mr-1" />
            Limite atteinte ({maxSignals} signaux) — Passez a Expert pour illimite
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Day Decision Banner ────────────────────────────────

function DayDecisionBanner({ decision }: { decision: import('@/services/profitabilityEngine').DayDecision }) {
  const isNoTrade = decision.noTradeToday;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-5 ${
        isNoTrade
          ? 'bg-red-500/5 border-red-500/20'
          : decision.bestOpportunity?.grade === 'A+' || decision.bestOpportunity?.grade === 'A'
            ? 'bg-emerald-500/5 border-emerald-500/20'
            : 'bg-amber-500/5 border-amber-500/20'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isNoTrade ? 'bg-red-500/20' : 'bg-emerald-500/20'
        }`}>
          {isNoTrade ? <Ban className="w-6 h-6 text-red-400" /> : <Target className="w-6 h-6 text-emerald-400" />}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-white mb-1">{decision.headline}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{decision.summary}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {decision.marketsToWatch.length > 0 && (
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Surveiller: {decision.marketsToWatch.join(', ')}
              </span>
            )}
            {decision.riskLevel && (
              <span className={`text-[10px] flex items-center gap-1 ${
                decision.riskLevel === 'low' ? 'text-emerald-400' : decision.riskLevel === 'medium' ? 'text-amber-400' : 'text-red-400'
              }`}>
                <Shield className="w-3 h-3" /> Risque: {decision.riskLevel}
              </span>
            )}
          </div>
        </div>
        {decision.bestOpportunity && (
          <div className="flex-shrink-0">
            <GradeBadge grade={decision.bestOpportunity.grade} size="lg" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Signal Decision Card ───────────────────────────────

function SignalDecisionCard({
  signal, idx, isExpanded, onToggle, showInstitutional,
}: {
  signal: EnrichedSignal & {
    grade: import('@/services/profitabilityEngine').GradeResult;
    noTrade: import('@/services/profitabilityEngine').NoTradeResult;
    risk: import('@/services/profitabilityEngine').RiskAnalysis;
    decision: import('@/services/profitabilityEngine').DecisionResult;
    plan: import('@/services/profitabilityEngine').TradePlan;
    grid: import('@/services/profitabilityEngine').ValidationGrid | null;
  };
  idx: number; isExpanded: boolean; onToggle: () => void; showInstitutional: boolean;
}) {
  const gradeCfg = GRADE_CONFIG[signal.grade.grade];
  const decCfg = DECISION_CONFIG[signal.decision.decision];
  const SigIcon = signal.signal === 'ACHAT' ? TrendingUp : signal.signal === 'VENTE' ? TrendDownIcon : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      className={`bg-slate-900/60 border rounded-2xl overflow-hidden ${
        signal.noTrade.isNoTradeZone ? 'border-red-500/20' : signal.grade.grade === 'A+' || signal.grade.grade === 'A' ? 'border-emerald-500/20' : 'border-slate-800'
      }`}
    >
      {/* ─── CARD HEADER ──────────────────────────── */}
      <div className="p-4 md:p-5 cursor-pointer" onClick={onToggle}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              signal.signal === 'ACHAT' ? 'bg-emerald-500/20' : signal.signal === 'VENTE' ? 'bg-red-500/20' : 'bg-amber-500/20'
            }`}>
              <SigIcon className={`w-5 h-5 ${signal.signal === 'ACHAT' ? 'text-emerald-400' : signal.signal === 'VENTE' ? 'text-red-400' : 'text-amber-400'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold text-white">{signal.asset}</span>
                <GradeBadge grade={signal.grade.grade} />
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${decCfg.bg} ${decCfg.color} border ${decCfg.border}`}>
                  {signal.decision.decision}
                </span>
                {signal.noTrade.isNoTradeZone && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 flex items-center gap-1">
                    <Ban className="w-3 h-3" /> NO TRADE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{signal.decision.explanation.substring(0, 80)}...</p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="text-center"><p className="text-[10px] text-slate-500">IA</p><p className="text-sm font-bold text-blue-400">{signal.confidence}%</p></div>
              {showInstitutional && <div className="text-center"><p className="text-[10px] text-slate-500">Inst.</p><p className="text-sm font-bold text-purple-400">{signal.institutionalAnalysis.score}</p></div>}
              <div className="text-center"><p className="text-[10px] text-slate-500">R/R</p><p className="text-sm font-bold text-emerald-400">{signal.riskRewardRatio}</p></div>
            </div>
            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </div>
        </div>
      </div>

      {/* ─── EXPANDED ─────────────────────────────── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="border-t border-slate-800 p-4 md:p-5 space-y-5">
              {/* Decision Block */}
              <DecisionBlock decision={signal.decision} />

              {/* Risk Before Profit */}
              <RiskBlock risk={signal.risk} />

              {/* No Trade Zone */}
              {signal.noTrade.isNoTradeZone && <NoTradeBlock noTrade={signal.noTrade} />}

              {/* Trade Plan */}
              <TradePlanBlock plan={signal.plan} signal={signal} />

              {/* Validation Grid */}
              {signal.grid && showInstitutional && <ValidationGridBlock grid={signal.grid} />}

              {/* Multi-Timeframe */}
              <MultiTimeframeMini signals={signal.timeframeSignals} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Sub-Components ─────────────────────────────────────

function GradeBadge({ grade, size = 'md' }: { grade: SignalGrade; size?: 'sm' | 'md' | 'lg' }) {
  const cfg = GRADE_CONFIG[grade];
  const s = size === 'lg' ? 'px-3 py-1 text-sm' : size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg font-bold ${s} ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
      <cfg.icon className="w-3 h-3" /> {grade}
    </span>
  );
}

function DecisionBlock({ decision }: { decision: import('@/services/profitabilityEngine').DecisionResult }) {
  const cfg = DECISION_CONFIG[decision.decision];
  const Icon = cfg.icon;

  return (
    <div className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cfg.bg}`}>
          <Icon className={`w-5 h-5 ${cfg.color}`} />
        </div>
        <div className="flex-1">
          <h4 className={`text-sm font-bold ${cfg.color} mb-1`}>Decision: {decision.decision}</h4>
          <p className="text-xs text-slate-300 leading-relaxed mb-2">{decision.explanation}</p>
          <div className="space-y-1">
            {decision.actionItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" /> {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskBlock({ risk }: { risk: import('@/services/profitabilityEngine').RiskAnalysis }) {
  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-400" /> Risque Avant Profit
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        <div className="bg-slate-900/50 rounded-lg p-2.5 text-center">
          <p className="text-[10px] text-slate-500">Risque max</p>
          <p className="text-sm font-bold text-red-400">{risk.slDistance.toFixed(2)}%</p>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-2.5 text-center">
          <p className="text-[10px] text-slate-500">Gain potentiel</p>
          <p className="text-sm font-bold text-emerald-400">{risk.tpDistance.toFixed(2)}%</p>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-2.5 text-center">
          <p className="text-[10px] text-slate-500">R/R</p>
          <p className={`text-sm font-bold ${risk.isRRAcceptable ? 'text-emerald-400' : 'text-red-400'}`}>{risk.rrLabel}</p>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-2.5 text-center">
          <p className="text-[10px] text-slate-500">Taille</p>
          <p className="text-sm font-bold text-blue-400">{risk.positionSize.toFixed(2)}u</p>
        </div>
      </div>
      {risk.warning && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
          <p className="text-xs text-amber-400">{risk.warning}</p>
        </div>
      )}
      <p className="text-xs text-slate-400 mt-2">{risk.recommendation}</p>
    </div>
  );
}

function NoTradeBlock({ noTrade }: { noTrade: import('@/services/profitabilityEngine').NoTradeResult }) {
  return (
    <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
      <h4 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
        <Ban className="w-4 h-4" /> No Trade Zone — {noTrade.reasonCount} condition{noTrade.reasonCount > 1 ? 's' : ''} défavorable{noTrade.reasonCount > 1 ? 's' : ''}
      </h4>
      <div className="space-y-1.5">
        {noTrade.checks.filter(c => c.active).map((check, i) => (
          <div key={i} className={`flex items-center gap-2 text-xs ${
            check.severity === 'critical' ? 'text-red-400' : check.severity === 'warning' ? 'text-amber-400' : 'text-slate-400'
          }`}>
            {check.severity === 'critical' ? <XCircle className="w-3.5 h-3.5 flex-shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />}
            {check.message}
          </div>
        ))}
      </div>
      <p className="text-xs text-red-400 mt-2 font-medium">{noTrade.overallMessage}</p>
    </div>
  );
}

function TradePlanBlock({ plan, signal }: { plan: import('@/services/profitabilityEngine').TradePlan; signal: EnrichedSignal }) {
  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <FileText className="w-4 h-4 text-blue-400" /> Plan de Trade Automatique
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
          <p className="text-[10px] text-emerald-400 font-medium mb-0.5">ENTREE CONSERVATRICE</p>
          <p className="text-lg font-bold text-white">{plan.conservativeEntry.toFixed(4)}</p>
          <p className="text-[10px] text-slate-500">Attendre meilleur prix</p>
        </div>
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
          <p className="text-[10px] text-blue-400 font-medium mb-0.5">ENTREE IDEALE</p>
          <p className="text-lg font-bold text-white">{plan.idealEntry.toFixed(4)}</p>
          <p className="text-[10px] text-slate-500">Prix actuel recommande</p>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
          <p className="text-[10px] text-amber-400 font-medium mb-0.5">ENTREE AGRESSIVE</p>
          <p className="text-lg font-bold text-white">{plan.aggressiveEntry.toFixed(4)}</p>
          <p className="text-[10px] text-slate-500">Entree anticipee (risque+)</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-red-500/5 rounded-lg p-2 text-center"><p className="text-[10px] text-red-400">SL</p><p className="text-sm font-bold text-white">{plan.stopLoss.toFixed(4)}</p></div>
        <div className="bg-emerald-500/5 rounded-lg p-2 text-center"><p className="text-[10px] text-emerald-400">TP1</p><p className="text-sm font-bold text-white">{plan.tp1.toFixed(4)}</p></div>
        <div className="bg-emerald-500/5 rounded-lg p-2 text-center"><p className="text-[10px] text-emerald-400">TP2/TP3</p><p className="text-sm font-bold text-white">{plan.tp2.toFixed(4)}/{plan.tp3.toFixed(4)}</p></div>
      </div>
      <div className="space-y-1 text-xs text-slate-400">
        <p><span className="text-slate-500">Invalidation:</span> {plan.invalidationLevel}</p>
        <p><span className="text-slate-500">Scenario:</span> {plan.mainScenario}</p>
        <p><span className="text-slate-500">Alternatif:</span> {plan.altScenario}</p>
        <p><span className="text-slate-500">Annuler si:</span> {plan.cancelIf}</p>
      </div>
    </div>
  );
}

function ValidationGridBlock({ grid }: { grid: import('@/services/profitabilityEngine').ValidationGrid }) {
  const agreementColor = grid.agreement === 'aligned' ? 'text-emerald-400' : grid.agreement === 'partial' ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <Layers className="w-4 h-4 text-purple-400" /> Validation Technique / IA / Institutionnelle
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <GridRow label="Analyse Technique" icon={Brain} result={grid.technicalAnalysis.result} confidence={grid.technicalAnalysis.confidence} color={grid.technicalAnalysis.color} />
        <GridRow label="Analyse IA" icon={Sparkles} result={grid.iaAnalysis.result} confidence={grid.iaAnalysis.confidence} color={grid.iaAnalysis.color} />
        <GridRow label="Institutionnelle" icon={Building2} result={grid.institutionalAnalysis.result} confidence={grid.institutionalAnalysis.confidence} color={grid.institutionalAnalysis.color} />
        <GridRow label="Risque News" icon={Newspaper} result={grid.newsRisk.result} confidence={grid.newsRisk.severity === 'high' ? 90 : grid.newsRisk.severity === 'medium' ? 60 : 20} color={grid.newsRisk.color} />
      </div>
      <div className={`mt-3 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${agreementColor} bg-white/5`}>
        <span>Alignement global: {grid.agreement === 'aligned' ? 'CONFIRME' : grid.agreement === 'partial' ? 'PARTIEL' : 'CONTRADICTOIRE'}</span>
        <span>{grid.finalDecision.confidence}% confiance</span>
      </div>
    </div>
  );
}

function GridRow({ label, icon: Icon, result, confidence, color }: {
  label: string; icon: typeof Brain; result: string; confidence: number; color: string;
}) {
  return (
    <div className="flex items-center gap-2 p-2 bg-slate-900/40 rounded-lg">
      <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-slate-500">{label}</p>
        <p className="text-xs text-slate-300 truncate">{result}</p>
      </div>
      <div className="w-12 text-right">
        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${confidence >= 70 ? 'bg-emerald-500' : confidence >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${confidence}%` }} />
        </div>
      </div>
    </div>
  );
}

function MultiTimeframeMini({ signals }: { signals: MultiTimeframeSignal[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
        <Activity className="w-3.5 h-3.5 text-blue-400" /> Multi-Timeframes
      </h4>
      <div className="flex gap-2">
        {signals.map(tf => (
          <div key={tf.timeframe} className={`flex-1 rounded-lg p-2 text-center border ${
            tf.signal === 'ACHAT' ? 'border-emerald-500/20 bg-emerald-500/5' :
            tf.signal === 'VENTE' ? 'border-red-500/20 bg-red-500/5' :
            'border-slate-700 bg-slate-800/40'
          }`}>
            <p className="text-[10px] text-slate-500">{tf.timeframe}</p>
            <p className={`text-xs font-bold ${tf.signal === 'ACHAT' ? 'text-emerald-400' : tf.signal === 'VENTE' ? 'text-red-400' : 'text-amber-400'}`}>
              {tf.signal}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function NoSignalsState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
      <Ban className="w-12 h-12 text-slate-600 mx-auto mb-4" />
      <p className="text-sm font-medium text-white mb-1">Aucun signal valide</p>
      <p className="text-xs text-slate-400 mb-4">Le marché est en zone d'attente ou les données ne sont pas encore chargees.</p>
      <button onClick={onRefresh}
        className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-500/30 transition-colors">
        <RefreshCw className="w-4 h-4 inline mr-2" /> Analyser a nouveau
      </button>
    </div>
  );
}
