/**
 * Centre de Decision Institutionnel IA
 * Module professionnel de comparaison multi-signaux avec analyse institutionnelle
 *
 * Intégration : Route /institutional-comparator, sidebar sous "Intelligence IA"
 * Packs : Free (2 signaux, analyse simplifiee), Pro (10 signaux), Expert (illimite + institutionnel)
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, TrendingUp, TrendingDown, Minus, Star, AlertTriangle,
  CheckCircle, XCircle, Filter, Download, FileDown, Shield,
  Clock, Target, Zap, ChevronDown, ChevronUp, Layers, BarChart3,
  Sparkles, Lock, ArrowUpDown, Wifi, RefreshCw, Eye, Globe,
  Crosshair, BookOpen, Activity, Diamond
} from 'lucide-react';
import { ComparateurInstitutionnelGuide } from '@/components/FeatureGuide';
import { useInstitutionalSignals } from '@/hooks/useInstitutionalSignals';
import type { EnrichedSignal, PeriodFilter } from '@/hooks/useInstitutionalSignals';
import type { InstitutionalAnalysis, MultiTimeframeSignal } from '@/services/institutionalScoreService';
import { exportSignalsListToPDF } from '@/services/pdfExportService';

// ─── Period filter options ──────────────────────────────

const PERIOD_OPTIONS: { key: PeriodFilter['type']; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'yesterday', label: 'Hier' },
  { key: '7d', label: '7 derniers jours' },
  { key: '30d', label: '30 derniers jours' },
  { key: 'thisMonth', label: 'Ce mois' },
  { key: 'asian', label: 'Session Asiatique' },
  { key: 'european', label: 'Session Européenne' },
  { key: 'american', label: 'Session Américaine' },
];

const ASSET_OPTIONS = ['ALL', 'XAU/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'BTC/USD', 'ETH/USD'];

const TIMEFRAME_LABELS: Record<string, string> = {
  M15: 'M15', H1: 'H1', H4: 'H4', D1: 'D1',
};

// ─── Main Component ─────────────────────────────────────

export default function InstitutionalComparator() {
  const {
    signals, timeframeAnalyses, loading, periodFilter, setPeriodFilter,
    selectedAsset, setSelectedAsset, bestSignals, maxSignals,
    showInstitutional, pack, refresh,
  } = useInstitutionalSignals();

  const [sortKey, setSortKey] = useState<'confidence' | 'institutional' | 'riskReward' | 'asset'>('confidence');
  const [filterSignal, setFilterSignal] = useState<'ALL' | 'ACHAT' | 'VENTE' | 'ATTENTE'>('ALL');
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sort & filter
  const displayedSignals = useMemo(() => {
    let result = [...signals];
    if (filterSignal !== 'ALL') result = result.filter(s => s.signal === filterSignal);
    result.sort((a, b) => {
      switch (sortKey) {
        case 'confidence': return b.confidence - a.confidence;
        case 'institutional': return b.institutionalAnalysis.score - a.institutionalAnalysis.score;
        case 'riskReward': return parseFloat(b.riskRewardRatio.replace('1:', '')) - parseFloat(a.riskRewardRatio.replace('1:', ''));
        case 'asset': return a.asset.localeCompare(b.asset);
        default: return 0;
      }
    });
    return result;
  }, [signals, filterSignal, sortKey]);

  const comparedSignals = useMemo(() =>
    signals.filter(s => selectedIds.has(s.id)).slice(0, 4),
    [signals, selectedIds]
  );

  const toggleCompare = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 4) next.add(id);
      return next;
    });
  };

  const exportCSV = () => {
    const headers = 'Actif,Signal,Confiance,Score Inst.,Entry,SL,TP1,TP2,TP3,R/R,Risque,Grade,Recommandation\n';
    const rows = displayedSignals.map(s =>
      `${s.asset},${s.signal},${s.confidence}%,${s.institutionalAnalysis.score},${s.entryPoint.toFixed(4)},${s.stopLoss.toFixed(4)},${s.takeProfit1.toFixed(4)},${s.takeProfit2.toFixed(4)},${s.takeProfit3.toFixed(4)},${s.riskRewardRatio},${s.riskLevel},${s.institutionalAnalysis.grade},"${s.institutionalAnalysis.recommendation.substring(0, 80)}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `institutional-signals-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && signals.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">L'IA institutionnelle analyse les marches...</p>
          <p className="text-xs text-slate-600 mt-1">Multi-timeframes + Smart Money Concepts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      <ComparateurInstitutionnelGuide />
      {/* ─── HEADER ─────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Centre de Decision Institutionnel</h1>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <Wifi className="w-3 h-3 text-emerald-400" />
                {signals.length} signaux actifs — Multi-timeframes + Analyse Smart Money
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
            {signals.length > 0 && (
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
            <button onClick={() => setCompareMode(!compareMode)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-colors ${compareMode ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800/60 text-slate-400 border border-slate-700 hover:text-white'}`}>
              <Layers className="w-3.5 h-3.5" /> Comparer
            </button>
            <button onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-400 hover:text-white transition-colors">
              <Filter className="w-3.5 h-3.5" /> Filtres
            </button>
          </div>
        </div>

        {/* ─── BEST SIGNALS BANNER ────────────────────── */}
        {bestSignals && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <BestSignalCard
              title="Meilleur Signal"
              signal={bestSignals.best}
              icon={Star}
              color="amber"
            />
            <BestSignalCard
              title="Plus Securise"
              signal={bestSignals.safest}
              icon={Shield}
              color="emerald"
            />
            <BestSignalCard
              title="Meilleur R/R"
              signal={bestSignals.bestRR}
              icon={Target}
              color="blue"
            />
          </div>
        )}
      </motion.div>

      {/* ─── FILTERS ────────────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-4">
              {/* Period filter */}
              <div>
                <p className="text-xs text-slate-500 mb-2">Periode d'analyse</p>
                <div className="flex flex-wrap gap-2">
                  {PERIOD_OPTIONS.map(opt => (
                    <button key={opt.key} onClick={() => setPeriodFilter({ type: opt.key })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        periodFilter.type === opt.key ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Asset filter */}
              <div>
                <p className="text-xs text-slate-500 mb-2">Actif</p>
                <div className="flex flex-wrap gap-2">
                  {ASSET_OPTIONS.map(asset => (
                    <button key={asset} onClick={() => setSelectedAsset(asset)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedAsset === asset ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                      {asset === 'ALL' ? 'Tous' : asset}
                    </button>
                  ))}
                </div>
              </div>
              {/* Signal type + Sort */}
              <div className="flex flex-wrap gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-2">Type de signal</p>
                  <div className="flex gap-2">
                    {(['ALL', 'ACHAT', 'VENTE', 'ATTENTE'] as const).map(f => (
                      <button key={f} onClick={() => setFilterSignal(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          filterSignal === f ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                        {f === 'ALL' ? 'Tous' : f}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-2">Trier par</p>
                  <div className="flex gap-2">
                    {([
                      { key: 'confidence' as const, label: 'Score IA' },
                      { key: 'institutional' as const, label: 'Score Inst.' },
                      { key: 'riskReward' as const, label: 'R/R' },
                      { key: 'asset' as const, label: 'Actif' },
                    ]).map(s => (
                      <button key={s.key} onClick={() => setSortKey(s.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                          sortKey === s.key ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                        <ArrowUpDown className="w-3 h-3" /> {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── COMPARISON MODE ────────────────────────── */}
      {compareMode && comparedSignals.length >= 2 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <ComparisonTable signals={comparedSignals} />
        </motion.div>
      )}

      {/* ─── SIGNAL CARDS ───────────────────────────── */}
      {displayedSignals.length > 0 ? (
        <div className="space-y-4">
          {displayedSignals.map((sig, idx) => (
            <SignalCard
              key={sig.id}
              signal={sig}
              idx={idx}
              isExpanded={expandedSignal === sig.id}
              onToggle={() => setExpandedSignal(expandedSignal === sig.id ? null : sig.id)}
              compareMode={compareMode}
              isSelected={selectedIds.has(sig.id)}
              onToggleCompare={() => toggleCompare(sig.id)}
              showInstitutional={showInstitutional}
              timeframeAnalysis={timeframeAnalyses[sig.asset]}
            />
          ))}
        </div>
      ) : (
        <EmptyState onRefresh={refresh} />
      )}

      {/* ─── PACK LIMIT INDICATOR ───────────────────── */}
      {signals.length >= maxSignals && maxSignals !== 999 && (
        <div className="text-center p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
          <p className="text-xs text-amber-400">
            <Lock className="w-3 h-3 inline mr-1" />
            Limite atteinte ({maxSignals} signaux) — Passez a Expert pour l'analyse illimitee
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Sub-Components ─────────────────────────────────────

function BestSignalCard({ title, signal, icon: Icon, color }: {
  title: string; signal: EnrichedSignal; icon: typeof Star; color: string;
}) {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  };
  const c = colorMap[color] || colorMap.blue;
  const SigIcon = signal.signal === 'ACHAT' ? TrendingUp : signal.signal === 'VENTE' ? TrendingDown : Minus;

  return (
    <div className={`${c.bg} border ${c.border} rounded-2xl p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${c.text}`} />
        <span className={`text-xs font-medium ${c.text}`}>{title}</span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <SigIcon className={`w-5 h-5 ${signal.signal === 'ACHAT' ? 'text-emerald-400' : signal.signal === 'VENTE' ? 'text-red-400' : 'text-amber-400'}`} />
            <span className="text-lg font-bold text-white">{signal.asset}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${signal.signal === 'ACHAT' ? 'bg-emerald-500/20 text-emerald-400' : signal.signal === 'VENTE' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {signal.signal}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Score IA: {signal.confidence}% | Score Inst.: {signal.institutionalAnalysis.score} | R/R: {signal.riskRewardRatio}
          </p>
        </div>
        <ScoreBadge score={signal.institutionalAnalysis.score} />
      </div>
    </div>
  );
}

function SignalCard({ signal, idx, isExpanded, onToggle, compareMode, isSelected, onToggleCompare, showInstitutional, timeframeAnalysis }: {
  signal: EnrichedSignal; idx: number; isExpanded: boolean; onToggle: () => void;
  compareMode: boolean; isSelected: boolean; onToggleCompare: () => void;
  showInstitutional: boolean; timeframeAnalysis?: import('@/services/institutionalScoreService').TimeframeAnalysis;
}) {
  const sigColor = signal.signal === 'ACHAT' ? 'border-emerald-500/30' : signal.signal === 'VENTE' ? 'border-red-500/30' : 'border-amber-500/30';
  const SigIcon = signal.signal === 'ACHAT' ? TrendingUp : signal.signal === 'VENTE' ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      className={`bg-slate-900/60 border ${sigColor} rounded-2xl overflow-hidden ${isSelected ? 'ring-1 ring-blue-500/40' : ''}`}
    >
      {/* ─── HEADER ───────────────────────────────── */}
      <div className="p-4 md:p-5 cursor-pointer" onClick={onToggle}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {compareMode && (
              <button onClick={(e) => { e.stopPropagation(); onToggleCompare(); }}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-blue-500' : 'bg-slate-700 hover:bg-slate-600'
                }`}>
                {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
              </button>
            )}
            <div className={`w-10 h-10 rounded-xl ${signal.signal === 'ACHAT' ? 'bg-emerald-500/20' : signal.signal === 'VENTE' ? 'bg-red-500/20' : 'bg-amber-500/20'} flex items-center justify-center`}>
              <SigIcon className={`w-5 h-5 ${signal.signal === 'ACHAT' ? 'text-emerald-400' : signal.signal === 'VENTE' ? 'text-red-400' : 'text-amber-400'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">{signal.asset}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${signal.signal === 'ACHAT' ? 'bg-emerald-500/20 text-emerald-400' : signal.signal === 'VENTE' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {signal.signal}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400">{signal.timeframe}</span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" /> {signal.timestamp.toLocaleTimeString('fr-FR')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Mini stats */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-[10px] text-slate-500">Score IA</p>
                <p className="text-sm font-bold text-blue-400">{signal.confidence}%</p>
              </div>
              {showInstitutional && (
                <div className="text-center">
                  <p className="text-[10px] text-slate-500">Score Inst.</p>
                  <p className="text-sm font-bold text-purple-400">{signal.institutionalAnalysis.score}</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-[10px] text-slate-500">R/R</p>
                <p className="text-sm font-bold text-emerald-400">{signal.riskRewardRatio}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500">Entry</p>
                <p className="text-sm font-bold text-white">{signal.entryPoint.toFixed(2)}</p>
              </div>
            </div>
            {showInstitutional && <ScoreBadge score={signal.institutionalAnalysis.score} size="sm" />}
            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </div>
        </div>
      </div>

      {/* ─── EXPANDED DETAILS ─────────────────────── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="border-t border-slate-800 p-4 md:p-5 space-y-5">
              {/* Levels Grid */}
              <LevelsGrid signal={signal} />

              {/* Multi-Timeframe */}
              <MultiTimeframePanel signals={signal.timeframeSignals} analysis={timeframeAnalysis} />

              {/* Institutional Analysis */}
              {showInstitutional ? (
                <InstitutionalPanel analysis={signal.institutionalAnalysis} />
              ) : (
                <LockedPanel />
              )}

              {/* XAU Special */}
              {signal.asset === 'XAU/USD' && timeframeAnalysis?.xauSpecial && showInstitutional && (
                <XAUSpecialPanel analysis={timeframeAnalysis.xauSpecial} />
              )}

              {/* Decision */}
              <DecisionBlock analysis={signal.institutionalAnalysis} signal={signal} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function LevelsGrid({ signal }: { signal: EnrichedSignal }) {
  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
      {[
        { label: 'Entree', value: signal.entryPoint.toFixed(4), color: 'text-blue-400' },
        { label: 'Stop Loss', value: signal.stopLoss.toFixed(4), color: 'text-red-400' },
        { label: 'TP1', value: signal.takeProfit1.toFixed(4), color: 'text-emerald-400' },
        { label: 'TP2', value: signal.takeProfit2.toFixed(4), color: 'text-emerald-400' },
        { label: 'TP3', value: signal.takeProfit3.toFixed(4), color: 'text-emerald-400' },
        { label: 'R/R', value: signal.riskRewardRatio, color: 'text-purple-400' },
      ].map((item, i) => (
        <div key={i} className="bg-slate-800/40 rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-slate-500 mb-0.5">{item.label}</p>
          <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function MultiTimeframePanel({ signals, analysis }: { signals: MultiTimeframeSignal[]; analysis?: import('@/services/institutionalScoreService').TimeframeAnalysis }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <Activity className="w-4 h-4 text-blue-400" /> Analyse Multi-Timeframes
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {signals.map(tf => (
          <div key={tf.timeframe} className={`rounded-xl p-3 border ${
            tf.signal === 'ACHAT' ? 'border-emerald-500/20 bg-emerald-500/5' :
            tf.signal === 'VENTE' ? 'border-red-500/20 bg-red-500/5' :
            'border-slate-700 bg-slate-800/40'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white">{TIMEFRAME_LABELS[tf.timeframe] || tf.timeframe}</span>
              <span className={`text-xs font-medium ${tf.signal === 'ACHAT' ? 'text-emerald-400' : tf.signal === 'VENTE' ? 'text-red-400' : 'text-amber-400'}`}>
                {tf.signal}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Force</span>
                <span className="text-[10px] text-slate-300">{tf.strength}%</span>
              </div>
              <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${tf.strength >= 70 ? 'bg-emerald-500' : tf.strength >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${tf.strength}%` }} />
              </div>
              <p className="text-[10px] text-slate-500">{tf.trend}</p>
            </div>
          </div>
        ))}
      </div>
      {analysis && (
        <div className={`mt-2 px-3 py-2 rounded-xl text-xs font-medium ${
          analysis.conclusionType === 'strong' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
          analysis.conclusionType === 'contradictory' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
          analysis.conclusionType === 'moderate' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
          'bg-slate-800 text-slate-400 border border-slate-700'
        }`}>
          <Sparkles className="w-3 h-3 inline mr-1" />
          {analysis.conclusion}
        </div>
      )}
    </div>
  );
}

function InstitutionalPanel({ analysis }: { analysis: InstitutionalAnalysis }) {
  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-4">
      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <Building2 className="w-4 h-4 text-purple-400" /> Analyse Institutionnelle
      </h4>

      {/* Grade badge */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`px-3 py-1 rounded-xl text-sm font-bold ${
          analysis.grade === 'A+' ? 'bg-emerald-500/20 text-emerald-400' :
          analysis.grade === 'A' ? 'bg-emerald-500/15 text-emerald-400' :
          analysis.grade === 'B' ? 'bg-blue-500/15 text-blue-400' :
          analysis.grade === 'C' ? 'bg-amber-500/15 text-amber-400' :
          'bg-red-500/15 text-red-400'
        }`}>
          {analysis.grade} — {analysis.label}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500">Score:</span>
          <span className={`text-sm font-bold ${analysis.score >= 80 ? 'text-emerald-400' : analysis.score >= 60 ? 'text-blue-400' : analysis.score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
            {analysis.score}/100
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500">Alignement MTF:</span>
          <span className="text-xs font-medium text-slate-300">{analysis.timeframeAlignment}/30</span>
        </div>
      </div>

      {/* Smart Money Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
        <SMItem label="Order Blocks" detected={analysis.orderBlocks.detected} detail={`${analysis.orderBlocks.type} @ ${analysis.orderBlocks.price.toFixed(2)}`} />
        <SMItem label="BOS / CHOCH" detected={analysis.breakOfStructure.detected} detail={analysis.breakOfStructure.description} />
        <SMItem label="Fair Value Gap" detected={analysis.fairValueGap.detected} detail={analysis.fairValueGap.description || `FVG @ ${analysis.fairValueGap.price.toFixed(2)}`} />
        <SMItem label="Liquidite" detected={true} detail={`Low: ${analysis.liquidityPools.low.toFixed(2)} | High: ${analysis.liquidityPools.high.toFixed(2)}`} />
        <SMItem label="Premium/Discount" detected={true} detail={`Zone ${analysis.premiumDiscount.zone} — Eq: ${analysis.premiumDiscount.equilibrium.toFixed(2)}`} />
        <SMItem label="Stop Hunt Risk" detected={analysis.stopHuntRisk.detected} detail={analysis.stopHuntRisk.detected ? `Distance: ${(analysis.stopHuntRisk.distance * 100).toFixed(2)}%` : 'Aucun risque detecte'} alert={analysis.stopHuntRisk.detected} />
      </div>

      {/* Confirmations */}
      <div className="mb-3">
        <p className="text-xs text-slate-500 mb-1">Confirmations techniques</p>
        <div className="flex flex-wrap gap-1">
          {analysis.confirmationRequired.map((c, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full bg-slate-700/50 text-[10px] text-slate-300">
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Entry zone & invalidation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="bg-slate-900/50 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 mb-0.5">Zone d'entree ideale</p>
          <p className="text-sm font-bold text-emerald-400">{analysis.entryZone}</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 mb-0.5">Niveau d'invalidation</p>
          <p className="text-sm font-bold text-red-400">{analysis.invalidationLevel}</p>
        </div>
      </div>
    </div>
  );
}

function SMItem({ label, detected, detail, alert }: { label: string; detected: boolean; detail: string; alert?: boolean }) {
  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg ${alert ? 'bg-red-500/5' : 'bg-slate-900/40'}`}>
      {detected ? (
        alert ? <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
      ) : (
        <XCircle className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-[10px] text-slate-500">{label}</p>
        <p className="text-xs text-slate-300 truncate">{detail}</p>
      </div>
    </div>
  );
}

function XAUSpecialPanel({ analysis }: { analysis: import('@/services/institutionalScoreService').XAUInstitutionalAnalysis }) {
  return (
    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <Diamond className="w-4 h-4 text-amber-400" /> Analyse Institutionnelle XAU/USD
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <XAUItem label="Zone Achat Inst." value={`${analysis.buyZone.min.toFixed(2)} - ${analysis.buyZone.max.toFixed(2)}`} quality={analysis.buyZone.quality} />
        <XAUItem label="Zone Vente Inst." value={`${analysis.sellZone.min.toFixed(2)} - ${analysis.sellZone.max.toFixed(2)}`} quality={analysis.sellZone.quality} />
        <XAUItem label="Liquidite Principale" value={analysis.mainLiquidity.toFixed(2)} />
        <XAUItem label="Break Critique" value={analysis.criticalBreakLevel.toFixed(2)} alert />
        <XAUItem label="Pullback Ideal" value={analysis.idealPullbackZone.toFixed(2)} />
        <XAUItem label="TP Probable" value={analysis.likelyProfitZone.toFixed(2)} />
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-xs text-slate-400"><span className="text-slate-500">Correl. USD:</span> {analysis.usdCorrelation}</p>
        <p className="text-xs text-slate-400"><span className="text-slate-500">Sentiment:</span> <span className={analysis.sentiment === 'haussier' ? 'text-emerald-400' : analysis.sentiment === 'baissier' ? 'text-red-400' : 'text-amber-400'}>{analysis.sentiment}</span></p>
        <p className="text-xs text-slate-400"><span className="text-slate-500">Risk News:</span> {analysis.newsRisk}</p>
        <p className="text-xs text-purple-400 mt-2 bg-purple-500/5 p-2 rounded-lg">{analysis.institutionalBias}</p>
      </div>
    </div>
  );
}

function XAUItem({ label, value, quality, alert }: { label: string; value: string; quality?: string; alert?: boolean }) {
  return (
    <div className={`p-2 rounded-lg ${alert ? 'bg-red-500/10' : 'bg-slate-900/40'}`}>
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className={`text-sm font-bold ${alert ? 'text-red-400' : 'text-white'}`}>{value}</p>
      {quality && <p className={`text-[10px] ${quality === 'Excellente' ? 'text-emerald-400' : quality === 'Bonne' ? 'text-blue-400' : 'text-amber-400'}`}>{quality}</p>}
    </div>
  );
}

function DecisionBlock({ analysis, signal }: { analysis: InstitutionalAnalysis; signal: EnrichedSignal }) {
  const isStrong = analysis.score >= 70;
  const isModerate = analysis.score >= 50;

  return (
    <div className={`rounded-2xl border p-4 ${
      isStrong ? 'bg-emerald-500/5 border-emerald-500/20' :
      isModerate ? 'bg-amber-500/5 border-amber-500/20' :
      'bg-red-500/5 border-red-500/20'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isStrong ? 'bg-emerald-500/20' : isModerate ? 'bg-amber-500/20' : 'bg-red-500/20'
        }`}>
          <Sparkles className={`w-5 h-5 ${isStrong ? 'text-emerald-400' : isModerate ? 'text-amber-400' : 'text-red-400'}`} />
        </div>
        <div className="flex-1">
          <h5 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Crosshair className="w-4 h-4" /> Decision IA Institutionnelle
          </h5>
          <p className="text-sm text-slate-300 leading-relaxed">{analysis.recommendation}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <p className="text-[10px] text-slate-500">Biais</p>
              <p className={`text-sm font-bold ${analysis.institutionalBias === 'haussier' ? 'text-emerald-400' : analysis.institutionalBias === 'baissier' ? 'text-red-400' : 'text-amber-400'}`}>
                {analysis.institutionalBias}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <p className="text-[10px] text-slate-500">Entry</p>
              <p className="text-sm font-bold text-blue-400">{signal.entryPoint.toFixed(4)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <p className="text-[10px] text-slate-500">SL recommande</p>
              <p className="text-sm font-bold text-red-400">{signal.stopLoss.toFixed(4)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <p className="text-[10px] text-slate-500">TP recommande</p>
              <p className="text-sm font-bold text-emerald-400">{signal.takeProfit1.toFixed(4)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LockedPanel() {
  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center">
      <Lock className="w-10 h-10 text-amber-400 mx-auto mb-3" />
      <p className="text-sm font-medium text-white mb-1">Analyse Institutionnelle Reservee</p>
      <p className="text-xs text-slate-400">Passez au pack Expert pour debloquer :</p>
      <div className="flex flex-wrap justify-center gap-2 mt-3">
        {['Score Institutionnel', 'Smart Money Concepts', 'Analyse XAU Avancee', 'Zones de Liquidite', 'Order Blocks', 'FVG Detection'].map(item => (
          <span key={item} className="px-2 py-1 rounded-full bg-slate-700/50 text-[10px] text-slate-400">{item}</span>
        ))}
      </div>
    </div>
  );
}

function ComparisonTable({ signals }: { signals: EnrichedSignal[] }) {
  return (
    <div className="bg-slate-900/60 border border-blue-500/20 rounded-2xl p-4">
      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-blue-400" /> Tableau Comparatif ({signals.length} signaux)
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-500 border-b border-slate-800">
              <th className="text-left p-2">Actif</th>
              <th className="text-center p-2">Signal</th>
              <th className="text-center p-2">Score IA</th>
              <th className="text-center p-2">Score Inst.</th>
              <th className="text-center p-2">Entry</th>
              <th className="text-center p-2">SL</th>
              <th className="text-center p-2">TP1</th>
              <th className="text-center p-2">TP2</th>
              <th className="text-center p-2">TP3</th>
              <th className="text-center p-2">R/R</th>
              <th className="text-center p-2">Risque</th>
              <th className="text-center p-2">Grade</th>
            </tr>
          </thead>
          <tbody>
            {signals.map(s => (
              <tr key={s.id} className="border-b border-slate-800/50">
                <td className="p-2 font-bold text-white">{s.asset}</td>
                <td className="p-2 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.signal === 'ACHAT' ? 'bg-emerald-500/20 text-emerald-400' : s.signal === 'VENTE' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {s.signal}
                  </span>
                </td>
                <td className="p-2 text-center text-blue-400 font-bold">{s.confidence}%</td>
                <td className="p-2 text-center text-purple-400 font-bold">{s.institutionalAnalysis.score}</td>
                <td className="p-2 text-center text-white">{s.entryPoint.toFixed(4)}</td>
                <td className="p-2 text-center text-red-400">{s.stopLoss.toFixed(4)}</td>
                <td className="p-2 text-center text-emerald-400">{s.takeProfit1.toFixed(4)}</td>
                <td className="p-2 text-center text-emerald-400">{s.takeProfit2.toFixed(4)}</td>
                <td className="p-2 text-center text-emerald-400">{s.takeProfit3.toFixed(4)}</td>
                <td className="p-2 text-center text-blue-400 font-bold">{s.riskRewardRatio}</td>
                <td className="p-2 text-center">
                  <span className={`text-xs ${s.riskLevel === 'Faible' ? 'text-emerald-400' : s.riskLevel === 'Modéré' ? 'text-amber-400' : 'text-red-400'}`}>
                    {s.riskLevel}
                  </span>
                </td>
                <td className="p-2 text-center">
                  <span className={`text-xs font-bold ${s.institutionalAnalysis.grade === 'A+' || s.institutionalAnalysis.grade === 'A' ? 'text-emerald-400' : s.institutionalAnalysis.grade === 'B' ? 'text-blue-400' : s.institutionalAnalysis.grade === 'C' ? 'text-amber-400' : 'text-red-400'}`}>
                    {s.institutionalAnalysis.grade}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScoreBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D';
  const w = size === 'sm' ? 'w-10 h-10' : 'w-14 h-14';
  return (
    <div className={`${w} relative flex-shrink-0`}>
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <circle cx="18" cy="18" r="15" fill="none" stroke="#1e293b" strokeWidth={3} />
        <circle cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={`${score} ${100 - score}`} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{label}</span>
    </div>
  );
}

function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
      <Globe className="w-12 h-12 text-slate-600 mx-auto mb-4" />
      <p className="text-sm font-medium text-white mb-1">Aucun signal disponible</p>
      <p className="text-xs text-slate-400 mb-4">Les donnees de marche ne sont pas encore chargees</p>
      <button onClick={onRefresh}
        className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-500/30 transition-colors">
        <RefreshCw className="w-4 h-4 inline mr-2" /> Recharger
      </button>
    </div>
  );
}
