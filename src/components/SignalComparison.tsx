/**
 * SignalComparison — Comparateur multi-signaux complet
 * Intégré dans Dashboard, Signals, XAU Premium, et toutes les pages avec signaux
 *
 * Gère les limites par pack :
 *   Free     : max 2 signaux comparables
 *   Pro      : max 10 signaux comparables
 *   Expert/Institutionnel : illimité
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, Star, AlertTriangle,
  CheckCircle, XCircle, ArrowUpDown, Filter, Download,
  BellPlus, Eye, BarChart3, Sparkles, ChevronDown,
  ShieldCheck, Clock, Target, Zap, Layers
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { AISignal } from '@/services/aiSignalEngine';

interface SignalComparisonProps {
  signals: AISignal[];
  title?: string;
  maxCompare?: number;
}

type SortKey = 'confidence' | 'riskReward' | 'riskLevel' | 'timeframe' | 'asset';
type FilterType = 'ALL' | 'ACHAT' | 'VENTE' | 'ATTENTE';

const TIMEFRAME_ORDER: Record<string, number> = {
  'M1': 1, 'M5': 2, 'M15': 3, 'M30': 4,
  'H1': 5, 'H4': 6, 'D1': 7, 'W1': 8
};

function getMaxCompare(pack: string): number {
  if (pack === 'free') return 2;
  if (pack === 'pro') return 10;
  return 999; // expert / institutional
}

function riskLevelValue(level: string): number {
  if (level === 'Faible') return 1;
  if (level === 'Modéré') return 2;
  return 3;
}

export default function SignalComparison({ signals, title = 'Comparateur de Signaux' }: SignalComparisonProps) {
  const { user } = useAuth();
  const maxCompare = getMaxCompare(user?.pack || 'free');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('confidence');
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSignals = useMemo(() => {
    let result = [...signals];
    if (filterType !== 'ALL') result = result.filter(s => s.signal === filterType);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.asset.toLowerCase().includes(q) ||
        s.signal.toLowerCase().includes(q) ||
        s.explanations.some(e => e.indicator.toLowerCase().includes(q))
      );
    }
    result.sort((a, b) => {
      switch (sortKey) {
        case 'confidence': return b.confidence - a.confidence;
        case 'riskReward': return parseFloat(b.riskRewardRatio) - parseFloat(a.riskRewardRatio);
        case 'riskLevel': return riskLevelValue(a.riskLevel) - riskLevelValue(b.riskLevel);
        case 'timeframe': return (TIMEFRAME_ORDER[a.timeframe] || 0) - (TIMEFRAME_ORDER[b.timeframe] || 0);
        case 'asset': return a.asset.localeCompare(b.asset);
        default: return 0;
      }
    });
    return result;
  }, [signals, filterType, searchQuery, sortKey]);

  const comparedSignals = useMemo(() =>
    signals.filter(s => selectedIds.has(s.id)),
    [signals, selectedIds]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); }
      else if (next.size < maxCompare) { next.add(id); }
      return next;
    });
  };

  const bestSignal = comparedSignals.length > 0
    ? comparedSignals.reduce((best, s) =>
        s.confidence > best.confidence && s.signal !== 'ATTENTE' ? s : best,
      comparedSignals[0])
    : null;

  const worstSignal = comparedSignals.length > 0
    ? comparedSignals.reduce((worst, s) =>
        s.confidence < worst.confidence ? s : worst,
      comparedSignals[0])
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-xs text-blue-400">
            {comparedSignals.length}/{maxCompare === 999 ? '∞' : maxCompare} selectionnes
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-400 hover:text-white transition-colors">
            <Filter className="w-3.5 h-3.5" /> Filtres
          </button>
          {comparedSignals.length >= 2 && (
            <button
              onClick={() => exportComparison(comparedSignals)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-400 hover:text-white transition-colors">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {(['ALL', 'ACHAT', 'VENTE', 'ATTENTE'] as FilterType[]).map(f => (
                  <button key={f} onClick={() => setFilterType(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      filterType === f ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                    {f === 'ALL' ? 'Tous' : f}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {([
                  { key: 'confidence' as SortKey, label: 'Score IA' },
                  { key: 'riskReward' as SortKey, label: 'R/R' },
                  { key: 'riskLevel' as SortKey, label: 'Risque' },
                  { key: 'timeframe' as SortKey, label: 'Timeframe' },
                  { key: 'asset' as SortKey, label: 'Actif' },
                ]).map(s => (
                  <button key={s.key} onClick={() => setSortKey(s.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                      sortKey === s.key ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                    <ArrowUpDown className="w-3 h-3" /> {s.label}
                  </button>
                ))}
              </div>
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher un actif, indicateur..."
                className="w-full px-4 py-2 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Signal Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filteredSignals.map(signal => {
          const isSelected = selectedIds.has(signal.id);
          const isBest = bestSignal?.id === signal.id && comparedSignals.length >= 2;
          const isFull = selectedIds.size >= maxCompare && !isSelected;

          return (
            <button key={signal.id} onClick={() => toggleSelect(signal.id)}
              disabled={isFull}
              className={`relative text-left p-4 rounded-2xl border transition-all ${
                isSelected
                  ? 'bg-blue-500/5 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                  : isFull
                    ? 'bg-slate-900/30 border-slate-800/50 opacity-40 cursor-not-allowed'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}>
              {isBest && (
                <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-[10px] font-bold text-white flex items-center gap-1">
                  <Star className="w-3 h-3 fill-white" /> Meilleur
                </div>
              )}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-bold text-white">{signal.asset}</span>
                <SignalBadge signal={signal.signal} />
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400">{signal.timeframe}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-2">
                <div><p className="text-[10px] text-slate-500">Entry</p><p className="text-xs font-bold text-white">{signal.entryPoint.toFixed(2)}</p></div>
                <div><p className="text-[10px] text-slate-500">SL</p><p className="text-xs font-bold text-red-400">{signal.stopLoss.toFixed(2)}</p></div>
                <div><p className="text-[10px] text-slate-500">TP1</p><p className="text-xs font-bold text-emerald-400">{signal.takeProfit1.toFixed(2)}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <ScoreRing confidence={signal.confidence} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">R/R</span>
                    <span className="text-xs font-bold text-blue-400">{signal.riskRewardRatio}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Risque</span>
                    <RiskBadge level={signal.riskLevel} />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Comparison Table */}
      {comparedSignals.length >= 2 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" /> Tableau Comparatif ({comparedSignals.length} signaux)
          </h4>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-800">
                  <th className="text-left p-3">Actif</th>
                  <th className="text-center p-3">Signal</th>
                  <th className="text-center p-3">Score IA</th>
                  <th className="text-center p-3">Entry</th>
                  <th className="text-center p-3">SL</th>
                  <th className="text-center p-3">TP1</th>
                  <th className="text-center p-3">TP2</th>
                  <th className="text-center p-3">TP3</th>
                  <th className="text-center p-3">R/R</th>
                  <th className="text-center p-3">Risque</th>
                  <th className="text-center p-3">TF</th>
                  <th className="text-center p-3">Sentiment</th>
                </tr>
              </thead>
              <tbody>
                {comparedSignals.map((s, idx) => {
                  const isBestRow = bestSignal?.id === s.id;
                  const isWorstRow = worstSignal?.id === s.id && comparedSignals.length > 2;
                  return (
                    <tr key={s.id} className={`border-b border-slate-800/50 ${isBestRow ? 'bg-emerald-500/5' : isWorstRow ? 'bg-red-500/5' : ''}`}>
                      <td className="p-3 font-bold text-white">{s.asset}</td>
                      <td className="p-3 text-center"><SignalBadge signal={s.signal} /></td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <ScoreRing confidence={s.confidence} size="sm" />
                          <span className={`font-bold ${s.confidence >= 80 ? 'text-emerald-400' : s.confidence >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{s.confidence}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-center text-white font-medium">{s.entryPoint.toFixed(4)}</td>
                      <td className="p-3 text-center text-red-400">{s.stopLoss.toFixed(4)}</td>
                      <td className="p-3 text-center text-emerald-400">{s.takeProfit1.toFixed(4)}</td>
                      <td className="p-3 text-center text-emerald-400">{s.takeProfit2.toFixed(4)}</td>
                      <td className="p-3 text-center text-emerald-400">{s.takeProfit3.toFixed(4)}</td>
                      <td className="p-3 text-center text-blue-400 font-bold">{s.riskRewardRatio}</td>
                      <td className="p-3 text-center"><RiskBadge level={s.riskLevel} /></td>
                      <td className="p-3 text-center text-slate-400">{s.timeframe}</td>
                      <td className="p-3 text-center">
                        <span className={`text-xs ${s.marketSentiment === 'Bullish' ? 'text-emerald-400' : s.marketSentiment === 'Bearish' ? 'text-red-400' : 'text-amber-400'}`}>
                          {s.marketSentiment}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Decision Engine */}
          <DecisionEngine signals={comparedSignals} best={bestSignal} worst={worstSignal} />
        </motion.div>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────

function SignalBadge({ signal }: { signal: string }) {
  const config: Record<string, { bg: string; text: string; icon: typeof TrendingUp }> = {
    ACHAT: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: TrendingUp },
    VENTE: { bg: 'bg-red-500/20', text: 'text-red-400', icon: TrendingDown },
    ATTENTE: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: Minus },
  };
  const c = config[signal] || config.ATTENTE;
  const Icon = c.icon;
  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${c.bg} ${c.text} text-xs font-medium`}>
      <Icon className="w-3 h-3" /> {signal}
    </span>
  );
}

function RiskBadge({ level }: { level: string }) {
  const color = level === 'Faible' ? 'text-emerald-400' : level === 'Modéré' ? 'text-amber-400' : 'text-red-400';
  return <span className={`text-xs font-medium ${color}`}>{level}</span>;
}

function ScoreRing({ confidence, size = 'md' }: { confidence: number; size?: 'sm' | 'md' }) {
  const w = size === 'sm' ? 'w-8 h-8' : 'w-12 h-12';
  const sw = size === 'sm' ? 2 : 3;
  return (
    <div className={`${w} relative flex-shrink-0`}>
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <circle cx="18" cy="18" r="15" fill="none" stroke="#1e293b" strokeWidth={sw} />
        <circle cx="18" cy="18" r="15" fill="none"
          stroke={confidence >= 80 ? '#10b981' : confidence >= 60 ? '#f59e0b' : '#ef4444'}
          strokeWidth={sw}
          strokeDasharray={`${confidence} ${100 - confidence}`}
          strokeLinecap="round"
        />
      </svg>
      {size === 'md' && <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">{confidence}</span>}
    </div>
  );
}

// ─── Decision Engine ────────────────────────────────────

function DecisionEngine({ signals, best, worst }: { signals: AISignal[]; best: AISignal | null; worst: AISignal | null }) {
  if (!best || signals.length < 2) return null;

  const avgConfidence = Math.round(signals.reduce((s, sig) => s + sig.confidence, 0) / signals.length);
  const achatSignals = signals.filter(s => s.signal === 'ACHAT');
  const venteSignals = signals.filter(s => s.signal === 'VENTE');
  const attenteSignals = signals.filter(s => s.signal === 'ATTENTE');

  let recommendation: { action: string; color: string; icon: typeof Zap; explanation: string };

  if (best.signal === 'ACHAT' && best.confidence >= 75) {
    recommendation = {
      action: 'ACHETER — Signal Fort',
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      icon: TrendingUp,
      explanation: `${best.asset} présente le meilleur profil risque/rendement avec un score IA de ${best.confidence}%. Le ratio R/R de ${best.riskRewardRatio} est favorable.`,
    };
  } else if (best.signal === 'VENTE' && best.confidence >= 75) {
    recommendation = {
      action: 'VENDRE — Signal Fort',
      color: 'text-red-400 border-red-500/30 bg-red-500/10',
      icon: TrendingDown,
      explanation: `${best.asset} montre des signaux de faiblesse avec un score IA de ${best.confidence}%. Le ratio R/R de ${best.riskRewardRatio} justifie la vente.`,
    };
  } else if (best.confidence >= 60) {
    recommendation = {
      action: 'ATTENDRE — Validation Requise',
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      icon: Minus,
      explanation: `La confiance est modérée (${best.confidence}%). Attendez un pullback vers ${best.entryPoint.toFixed(2)} ou une confirmation sur ${best.timeframe} avant d'entrer.`,
    };
  } else {
    recommendation = {
      action: 'EVITER — Risque Élevé',
      color: 'text-red-400 border-red-500/30 bg-red-500/10',
      icon: AlertTriangle,
      explanation: `Aucun signal ne dépasse 60% de confiance. Le marché est incertain — restez à l'écart jusqu'à meilleure configuration.`,
    };
  }

  const Icon = recommendation.icon;

  return (
    <div className={`mt-4 p-5 rounded-2xl border ${recommendation.color}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h5 className="text-sm font-bold mb-1 flex items-center gap-2">
            <Icon className="w-4 h-4" /> Décision IA
          </h5>
          <p className="text-sm mb-3">{recommendation.explanation}</p>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <p className="text-lg font-bold">{achatSignals.length}</p>
              <p className="text-[10px] text-slate-500">Achats</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <p className="text-lg font-bold">{venteSignals.length}</p>
              <p className="text-[10px] text-slate-500">Ventes</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <p className="text-lg font-bold">{attenteSignals.length}</p>
              <p className="text-[10px] text-slate-500">Attentes</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <p className="text-lg font-bold">{avgConfidence}%</p>
              <p className="text-[10px] text-slate-500">Conf. moyenne</p>
            </div>
          </div>

          {/* Best signal details */}
          {best && (
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">Meilleur signal identifié</p>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold">{best.asset}</span>
                <SignalBadge signal={best.signal} />
                <span className="text-xs text-blue-400">Entry: {best.entryPoint.toFixed(4)}</span>
                <span className="text-xs text-red-400">SL: {best.stopLoss.toFixed(4)}</span>
                <span className="text-xs text-emerald-400">TP: {best.takeProfit1.toFixed(4)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Export CSV ─────────────────────────────────────────

function exportComparison(signals: AISignal[]) {
  const headers = 'Actif,Signal,Confiance,Entry,SL,TP1,TP2,TP3,R/R,Risque,Timeframe\n';
  const rows = signals.map(s =>
    `${s.asset},${s.signal},${s.confidence}%,${s.entryPoint},${s.stopLoss},${s.takeProfit1},${s.takeProfit2},${s.takeProfit3},${s.riskRewardRatio},${s.riskLevel},${s.timeframe}`
  ).join('\n');
  const blob = new Blob([headers + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `comparison-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
