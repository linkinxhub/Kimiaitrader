import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfidenceGauge } from '@/components/ConfidenceGauge';
import { publishPrices, publishSignals } from '@/hooks/useLiveAlerts';
import { useAISignals } from '@/hooks/useAISignals';
import { useMarketData } from '@/hooks/useMarketData';
import type { SignalType } from '@/types/trading';
import {
  Radio, TrendingUp, TrendingDown, Minus, Filter, Search,
  Clock, Shield, AlertTriangle, CheckCircle, Wifi, FileDown,
  Layers, Zap, Target, BarChart3, Sparkles, ChevronRight
} from 'lucide-react';
import { exportSignalsListToPDF } from '@/services/pdfExportService';
import { SignalsGuide } from '@/components/FeatureGuide';
import SignalComparison from '@/components/SignalComparison';
import { useAlertNavigation } from '@/hooks/useAlertNavigation';

// ─── Signal Color System — Elegant Palette ────────────────

const signalStyles: Record<SignalType, {
  text: string;
  bg: string;
  border: string;
  gradient: string;
  icon: typeof TrendingUp;
  glow: string;
  label: string;
}> = {
  ACHAT: {
    text: 'text-emerald-300',
    bg: 'bg-emerald-500/[0.07]',
    border: 'border-emerald-500/25',
    gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    icon: TrendingUp,
    glow: 'shadow-emerald-500/10',
    label: 'ACHAT',
  },
  VENTE: {
    text: 'text-rose-300',
    bg: 'bg-rose-500/[0.07]',
    border: 'border-rose-500/25',
    gradient: 'from-rose-500/20 via-rose-500/5 to-transparent',
    icon: TrendingDown,
    glow: 'shadow-rose-500/10',
    label: 'VENTE',
  },
  ATTENTE: {
    text: 'text-amber-300',
    bg: 'bg-amber-500/[0.07]',
    border: 'border-amber-500/25',
    gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
    icon: Minus,
    glow: 'shadow-amber-500/10',
    label: 'ATTENTE',
  },
};

const riskConfig: Record<string, { color: string; icon: typeof Shield; label: string }> = {
  'Faible': { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: Shield, label: 'Faible' },
  'Modéré': { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: CheckCircle, label: 'Modéré' },
  'Élevé': { color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', icon: AlertTriangle, label: 'Élevé' },
};

// ─── Animated Counter ─────────────────────────────────────

function AnimatedValue({ value, suffix = '', decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) { setCount(value); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}{suffix}</span>;
}

// ─── Signal Card ──────────────────────────────────────────

function SignalCard({ sig, index }: { sig: any; index: number }) {
  const style = signalStyles[sig.signal];
  const Icon = style.icon;
  const risk = riskConfig[sig.riskLevel] || riskConfig['Modéré'];
  const RiskIcon = risk.icon;

  return (
    <motion.div
      key={sig.id}
      data-asset={sig.asset}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24, scale: 0.95 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: 'easeOut' }}
      layout
      className={`group relative rounded-2xl border ${style.border} ${style.bg} backdrop-blur-sm overflow-hidden hover:shadow-lg ${style.glow} transition-all duration-300 hover:-translate-y-0.5`}
    >
      {/* Top gradient bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${style.gradient}`} />

      <div className="p-5">
        {/* Header: Signal + Asset + Confidence */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${style.gradient} border ${style.border} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${style.text}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-bold ${style.text}`}>{sig.signal}</h3>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${style.bg} ${style.text} border ${style.border}`}>
                  {sig.asset}
                </span>
              </div>
              {sig.livePrice && (
                <p className="text-xs text-blue-400/80 mt-0.5 font-mono">
                  {sig.livePrice.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>
          </div>
          <ConfidenceGauge value={sig.confidence} size={64} />
        </div>

        {/* Entry / SL / TP Grid */}
        {sig.signal !== 'ATTENTE' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="grid grid-cols-3 gap-2 mb-4"
          >
            <div className="bg-slate-900/50 rounded-xl p-3 text-center border border-slate-800/60 hover:border-blue-500/20 transition-colors">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Entrée</p>
              <p className="text-sm font-bold text-blue-400 font-mono">{sig.entryPoint.toFixed(2)}</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-3 text-center border border-slate-800/60 hover:border-rose-500/20 transition-colors">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Stop Loss</p>
              <p className="text-sm font-bold text-rose-400 font-mono">{sig.stopLoss.toFixed(2)}</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-3 text-center border border-slate-800/60 hover:border-emerald-500/20 transition-colors">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Take Profit</p>
              <p className="text-sm font-bold text-emerald-400 font-mono">{sig.takeProfit1.toFixed(2)}</p>
            </div>
          </motion.div>
        )}

        {/* Footer: Quality, Risk, Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quality badge */}
            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
              sig.confidence >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
              sig.confidence >= 60 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
              'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              <Sparkles className="w-3 h-3 inline mr-1" />
              {sig.quality}
            </span>
            {/* Risk badge */}
            <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${risk.color}`}>
              <RiskIcon className="w-3 h-3" />
              {risk.label}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-600">
            <Clock className="w-3 h-3" />
            <span className="font-mono">{sig.timeFrame}</span>
            <span className="text-slate-700">|</span>
            <span>{sig.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Summary Bar ──────────────────────────────────────────

function SignalSummary({ signals }: { signals: any[] }) {
  const buyCount = signals.filter(s => s.signal === 'ACHAT').length;
  const sellCount = signals.filter(s => s.signal === 'VENTE').length;
  const waitCount = signals.filter(s => s.signal === 'ATTENTE').length;
  const avgConfidence = signals.length > 0
    ? Math.round(signals.reduce((a, s) => a + s.confidence, 0) / signals.length)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-3"
    >
      {[
        { label: 'Signaux Actifs', value: signals.length, suffix: '', icon: Radio, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
        { label: 'Achat / Vente', value: buyCount, suffix: ` / ${sellCount}`, icon: BarChart3, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        { label: 'En Attente', value: waitCount, suffix: '', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
        { label: 'Confiance Moy.', value: avgConfidence, suffix: '%', icon: Target, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
      ].map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.08 }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${stat.bg}`}
        >
          <stat.icon className={`w-5 h-5 ${stat.color}`} />
          <div>
            <p className={`text-lg font-bold ${stat.color} font-mono`}>
              <AnimatedValue value={stat.value} suffix={stat.suffix} />
            </p>
            <p className="text-[10px] text-slate-500">{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────

export default function Signals() {
  useAlertNavigation();
  const { signals, loading } = useAISignals();
  const { prices } = useMarketData();
  const [filter, setFilter] = useState<SignalType | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  // Build active signals from real AI-generated data
  const activeSignals = useMemo(() => {
    return signals.map(sig => ({
      id: sig.id,
      asset: sig.asset,
      signal: sig.signal,
      confidence: sig.confidence,
      entryPoint: sig.entryPoint,
      stopLoss: sig.stopLoss,
      takeProfit1: sig.takeProfit1,
      timeFrame: sig.timeframe as any,
      timestamp: sig.timestamp,
      riskLevel: sig.riskLevel,
      quality: sig.confidence >= 80 ? 'Excellent' : sig.confidence >= 60 ? 'Bon' : 'Moyen',
      livePrice: prices[sig.asset]?.price,
      source: sig.source,
    }));
  }, [signals, prices]);

  // Publish live data to the global alert system
  useEffect(() => { publishSignals(signals); }, [signals]);
  useEffect(() => { publishPrices(prices); }, [prices]);

  const filtered = activeSignals.filter(s => {
    const matchFilter = filter === 'ALL' || s.signal === filter;
    const matchSearch = s.asset.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (loading && signals.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Signaux IA Temps Réel</h1>
              <p className="text-xs text-slate-400">Génération des signaux...</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-400">L&apos;IA analyse les marchés en temps réel...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Feature Guide */}
      <SignalsGuide />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Signaux IA Temps Réel
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
                <Wifi className="w-3 h-3" /> Live
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              <AnimatedValue value={activeSignals.length} /> signaux actifs sur {new Set(activeSignals.map(s => s.asset)).size} actifs — Source: AI-Engine-Live
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {signals.length > 0 && (
            <button
              onClick={() => exportSignalsListToPDF(signals)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 hover:bg-blue-500/20 transition-all"
            >
              <FileDown className="w-3.5 h-3.5" /> Export PDF
            </button>
          )}
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">Actif</span>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <SignalSummary signals={activeSignals} />

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
      >
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input
            type="text"
            placeholder="Rechercher un actif..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900/40 rounded-xl p-1 border border-slate-800">
          {(['ALL', 'ACHAT', 'VENTE', 'ATTENTE'] as const).map(f => {
            const isActive = filter === f;
            const style = f === 'ALL' ? null : signalStyles[f];
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`relative px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
                  isActive
                    ? f === 'ALL'
                      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                      : `${style?.bg} ${style?.text} border ${style?.border}`
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                {f === 'ALL' ? 'Tous' : f}
                {f !== 'ALL' && (
                  <span className={`ml-1.5 text-[10px] opacity-60 font-mono`}>
                    {activeSignals.filter(s => s.signal === f).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Signal Cards Grid */}
      <AnimatePresence mode="popLayout">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((sig, idx) => (
              <SignalCard key={sig.id} sig={sig} index={idx} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center"
          >
            <Radio className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-sm text-slate-500 font-medium">Aucun signal ne correspond aux critères</p>
            <p className="text-xs text-slate-600 mt-1">Essayez de changer vos filtres</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Signal Comparison */}
      {filtered.length >= 2 && (
        <SignalComparison signals={filtered.map(s => ({
          id: s.id,
          asset: s.asset,
          signal: s.signal,
          confidence: s.confidence,
          entryPoint: s.entryPoint,
          stopLoss: s.stopLoss,
          takeProfit1: s.takeProfit1,
          takeProfit2: 0,
          takeProfit3: 0,
          riskRewardRatio: '1:2',
          riskLevel: s.riskLevel as 'Faible' | 'Modéré' | 'Élevé',
          timestamp: s.timestamp,
          timeframe: s.timeFrame,
          aiScore: s.confidence,
          marketSentiment: s.signal === 'ACHAT' ? 'Bullish' : s.signal === 'VENTE' ? 'Bearish' : 'Neutral',
          volatility: 0,
          source: s.source || 'AI-Engine-Live',
          explanations: [],
        }))} title="Comparateur de Signaux" />
      )}
    </div>
  );
}
