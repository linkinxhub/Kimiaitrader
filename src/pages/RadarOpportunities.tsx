/**
 * Radar d'Opportunites IA — Données LIVE réelles
 * Fusionne données statiques (structure) avec prix live (marché)
 */

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Radar, TrendingUp, Star, AlertTriangle, Zap,
  Filter, Search, X, Target, Brain, Globe,
} from 'lucide-react';
import { useLiveData } from '@/hooks/useLiveData';
import { DataFreshnessMonitor } from '@/components/DataFreshnessMonitor';
import { RadarGuide } from '@/components/FeatureGuide';
import { useAlertNavigation } from '@/hooks/useAlertNavigation';
import type { AIOpportunity } from '@/services/aiSignalEngine';
import { publishScannerResults } from '@/hooks/useLiveAlerts';

// ─── Base structure — merged with live prices at runtime ──

const BASE_OPPORTUNITIES: Array< Omit<AIOpportunity, 'price'> & { basePrice: number; baseChange24h: number } > = [
  { asset: 'XAU/USD', category: 'Metaux', basePrice: 2650.50, baseChange24h: 0.85, signal: 'ACHAT', score: 94, strength: 'exceptionnelle', reason: 'Breakout resistance 2648, volume croissant, RSI haussier', riskReward: 2.5, timeframe: 'H1', entry: 2650.50, stopLoss: 2645.00, takeProfit: 2660.00, confidence: 94, volatility: 12, marketSentiment: 'Bullish' },
  { asset: 'BTC/USD', category: 'Crypto', basePrice: 67500.00, baseChange24h: 2.35, signal: 'ACHAT', score: 82, strength: 'forte', reason: 'Retest support 67000 valide, MACD croisement haussier', riskReward: 2.0, timeframe: 'H1', entry: 67500.00, stopLoss: 66500.00, takeProfit: 69500.00, confidence: 82, volatility: 45, marketSentiment: 'Bullish' },
  { asset: 'EUR/USD', category: 'Forex', basePrice: 1.0850, baseChange24h: -0.25, signal: 'VENTE', score: 71, strength: 'moyenne', reason: 'Double top H4, divergence baissiere RSI', riskReward: 1.5, timeframe: 'H4', entry: 1.0850, stopLoss: 1.0880, takeProfit: 1.0800, confidence: 71, volatility: 8, marketSentiment: 'Bearish' },
  { asset: 'GBP/USD', category: 'Forex', basePrice: 1.2750, baseChange24h: 0.15, signal: 'ACHAT', score: 78, strength: 'forte', reason: 'Rebond support 1.2720, marteau haussier, volume en hausse', riskReward: 2.0, timeframe: 'H1', entry: 1.2750, stopLoss: 1.2700, takeProfit: 1.2850, confidence: 78, volatility: 10, marketSentiment: 'Bullish' },
  { asset: 'ETH/USD', category: 'Crypto', basePrice: 3520.00, baseChange24h: 1.85, signal: 'ACHAT', score: 75, strength: 'forte', reason: 'Consolidation au-dessus de 3500, EMA 20 support', riskReward: 1.9, timeframe: 'H1', entry: 3520.00, stopLoss: 3450.00, takeProfit: 3650.00, confidence: 75, volatility: 38, marketSentiment: 'Bullish' },
  { asset: 'USD/JPY', category: 'Forex', basePrice: 149.50, baseChange24h: -0.35, signal: 'VENTE', score: 68, strength: 'moyenne', reason: 'Surachat RSI D1, pin bar baissier au contact de 150', riskReward: 1.4, timeframe: 'D1', entry: 149.50, stopLoss: 150.20, takeProfit: 148.50, confidence: 68, volatility: 9, marketSentiment: 'Bearish' },
  { asset: 'NAS100', category: 'Indices', basePrice: 19500.00, baseChange24h: 1.10, signal: 'ACHAT', score: 85, strength: 'forte', reason: 'All-time high en approche, momentum haussier fort', riskReward: 2.0, timeframe: 'H1', entry: 19500.00, stopLoss: 19300.00, takeProfit: 19900.00, confidence: 85, volatility: 15, marketSentiment: 'Bullish' },
  { asset: 'SOL/USD', category: 'Crypto', basePrice: 145.00, baseChange24h: 3.20, signal: 'ACHAT', score: 72, strength: 'moyenne', reason: 'Breakout triangle consolidation, volume profile haussier', riskReward: 1.9, timeframe: 'H1', entry: 145.00, stopLoss: 138.00, takeProfit: 158.00, confidence: 72, volatility: 42, marketSentiment: 'Bullish' },
  { asset: 'SPX500', category: 'Indices', basePrice: 5500.00, baseChange24h: 0.85, signal: 'ACHAT', score: 80, strength: 'forte', reason: 'Tendance haussiere intacte, EMA 50 support dynamique', riskReward: 1.8, timeframe: 'H4', entry: 5500.00, stopLoss: 5420.00, takeProfit: 5650.00, confidence: 80, volatility: 12, marketSentiment: 'Bullish' },
  { asset: 'XAG/USD', category: 'Metaux', basePrice: 30.20, baseChange24h: 0.45, signal: 'ACHAT', score: 65, strength: 'moyenne', reason: 'Support 29.50 teste 3 fois, rebond en cours', riskReward: 1.6, timeframe: 'H1', entry: 30.20, stopLoss: 29.50, takeProfit: 31.50, confidence: 65, volatility: 18, marketSentiment: 'Bullish' },
];

const strengthConfig = {
  exceptionnelle: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: Star },
  forte: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: TrendingUp },
  moyenne: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Zap },
  faible: { color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', icon: AlertTriangle },
  aucune: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: AlertTriangle },
};

type SignalFilter = 'ALL' | 'ACHAT' | 'VENTE' | 'ATTENTE';
type ScoreFilter = 'ALL' | '90+' | '80+' | '70+' | '60+' | 'below60';
type StrengthFilter = 'ALL' | 'exceptionnelle' | 'forte' | 'moyenne' | 'faible';

export default function RadarOpportunities() {
  useAlertNavigation();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [signalFilter, setSignalFilter] = useState<SignalFilter>('ALL');
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('ALL');
  const [strengthFilter, setStrengthFilter] = useState<StrengthFilter>('ALL');
  const [sortBy, setSortBy] = useState<'score' | 'risk' | 'asset'>('score');

  // ─── LIVE DATA — merged with base structure ──
  const { data: liveData } = useLiveData();

  // Merge base structure with live prices + recalculate signal direction from live change24h
  const opportunities = useMemo((): AIOpportunity[] => {
    return BASE_OPPORTUNITIES.map(base => {
      const live = liveData[base.asset];
      const livePrice = live?.price;
      const liveChange = live?.change24hPercent ?? base.baseChange24h;

      // Determine signal direction from LIVE change24h if available
      let signal = base.signal;
      let marketSentiment = base.marketSentiment;
      let strength = base.strength;

      if (liveChange > 1.0) {
        signal = 'ACHAT';
        marketSentiment = 'Bullish';
        strength = 'forte';
      } else if (liveChange > 0.3) {
        signal = 'ACHAT';
        marketSentiment = 'Bullish';
        strength = 'moyenne';
      } else if (liveChange < -1.0) {
        signal = 'VENTE';
        marketSentiment = 'Bearish';
        strength = 'forte';
      } else if (liveChange < -0.3) {
        signal = 'VENTE';
        marketSentiment = 'Bearish';
        strength = 'moyenne';
      }

      // Recalculate entry/stop/tp from live price if available
      const price = livePrice ?? base.basePrice;
      const priceRatio = price / base.basePrice;

      return {
        ...base,
        signal,
        marketSentiment: marketSentiment as 'Bullish' | 'Bearish' | 'Neutral',
        strength: strength as 'exceptionnelle' | 'forte' | 'moyenne' | 'faible' | 'aucune',
        entry: price,
        stopLoss: base.stopLoss * priceRatio,
        takeProfit: base.takeProfit * priceRatio,
        // Adjust score based on live volatility
        score: base.score + (liveChange !== base.baseChange24h ? Math.round((liveChange - base.baseChange24h) * 2) : 0),
      };
    });
  }, [liveData]);

  // Publish scanner results to the global alert system
  useEffect(() => {
    publishScannerResults(opportunities.map(o => ({
      asset: o.asset,
      signal: o.signal,
      confidence: o.score || o.confidence,
      alert: (o.score || o.confidence) >= 80,
    })));
  }, [opportunities]);

  const filtered = useMemo(() => {
    let list = [...opportunities];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(o => o.asset.toLowerCase().includes(q) || o.reason.toLowerCase().includes(q));
    }
    if (signalFilter !== 'ALL') list = list.filter(o => o.signal === signalFilter);
    if (scoreFilter !== 'ALL') {
      const minScores: Record<ScoreFilter, number> = { '90+': 90, '80+': 80, '70+': 70, '60+': 60, 'below60': 0, 'ALL': 0 };
      const maxScores: Record<ScoreFilter, number> = { '90+': 100, '80+': 89, '70+': 79, '60+': 69, 'below60': 59, 'ALL': 100 };
      list = list.filter(o => o.score >= minScores[scoreFilter] && o.score <= maxScores[scoreFilter]);
    }
    if (strengthFilter !== 'ALL') list = list.filter(o => o.strength === strengthFilter);
    list.sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'risk') return (b.riskReward || 0) - (a.riskReward || 0);
      return a.asset.localeCompare(b.asset);
    });
    return list;
  }, [opportunities, search, signalFilter, scoreFilter, strengthFilter, sortBy]);

  const counts = useMemo(() => ({
    total: opportunities.length,
    achat: opportunities.filter(o => o.signal === 'ACHAT').length,
    vente: opportunities.filter(o => o.signal === 'VENTE').length,
    attente: opportunities.filter(o => o.signal === 'ATTENTE').length,
  }), [opportunities]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <Radar className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Radar d'Opportunites IA</h1>
          <p className="text-xs text-slate-400">{counts.total} opportunites — donnees mergees avec prix live</p>
        </div>
        <DataFreshnessMonitor />
      </div>

      <RadarGuide />

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: counts.total, color: 'text-white' },
          { label: 'Achats', value: counts.achat, color: 'text-emerald-400' },
          { label: 'Ventes', value: counts.vente, color: 'text-red-400' },
          { label: 'Attente', value: counts.attente, color: 'text-amber-400' },
        ].map((s, i) => (
          <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un actif..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-slate-500" /></button>}
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${showFilters ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-slate-900/60 border-slate-800 text-slate-400'}`}>
          <Filter className="w-4 h-4" /> Filtres
        </button>
      </div>

      {showFilters && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap gap-3">
            <div>
              <p className="text-xs text-slate-500 mb-1.5">Signal</p>
              <div className="flex gap-1.5">
                {(['ALL', 'ACHAT', 'VENTE', 'ATTENTE'] as SignalFilter[]).map(f => (
                  <button key={f} onClick={() => setSignalFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${signalFilter === f ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>{f === 'ALL' ? 'Tous' : f}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1.5">Score</p>
              <div className="flex gap-1.5">
                {(['ALL', '90+', '80+', '70+', '60+'] as ScoreFilter[]).map(f => (
                  <button key={f} onClick={() => setScoreFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${scoreFilter === f ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>{f}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1.5">Force</p>
              <div className="flex gap-1.5">
                {(['ALL', 'exceptionnelle', 'forte', 'moyenne'] as StrengthFilter[]).map(f => (
                  <button key={f} onClick={() => setStrengthFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${strengthFilter === f ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>{f === 'ALL' ? 'Tous' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1.5">Trier par</p>
              <div className="flex gap-1.5">
                {([['score', 'Score'], ['risk', 'R/R'], ['asset', 'Actif']] as [string, string][]).map(([k, l]) => (
                  <button key={k} onClick={() => setSortBy(k as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sortBy === k ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>{l}</button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((opp, i) => {
          const cfg = strengthConfig[opp.strength] || strengthConfig.moyenne;
          const Icon = cfg.icon;
          const isBuy = opp.signal === 'ACHAT';
          const isSell = opp.signal === 'VENTE';
          return (
            <motion.div key={opp.asset} data-asset={opp.asset} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`bg-slate-900/60 border rounded-2xl p-5 transition-all ${cfg.bg}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${cfg.color}`} />
                  <div>
                    <h3 className="text-lg font-bold text-white">{opp.asset}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isBuy ? 'bg-emerald-500/20 text-emerald-400' : isSell ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>{opp.signal} — {opp.timeframe}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${cfg.color}`}>{opp.score}</p>
                  <p className="text-xs text-slate-500">Score IA</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 mb-3">{opp.reason}</p>
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="bg-slate-950/40 rounded-lg p-2 text-center">
                  <p className="text-xs text-slate-500">Entry</p>
                  <p className="text-sm font-mono font-bold text-white">{opp.entry.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-slate-950/40 rounded-lg p-2 text-center">
                  <p className="text-xs text-slate-500">Stop</p>
                  <p className="text-sm font-mono font-bold text-red-400">{opp.stopLoss.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-slate-950/40 rounded-lg p-2 text-center">
                  <p className="text-xs text-slate-500">TP</p>
                  <p className="text-sm font-mono font-bold text-emerald-400">{opp.takeProfit.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-slate-950/40 rounded-lg p-2 text-center">
                  <p className="text-xs text-slate-500">R/R</p>
                  <p className="text-sm font-mono font-bold text-blue-400">1:{opp.riskReward}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Brain className="w-3 h-3" /> Confiance: {opp.confidence}%</span>
                <span className="flex items-center gap-1"><Target className="w-3 h-3" /> Vol: {opp.volatility}%</span>
                <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {opp.marketSentiment}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Radar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Aucune opportunite ne correspond aux filtres</p>
          <button onClick={() => { setSearch(''); setSignalFilter('ALL'); setScoreFilter('ALL'); setStrengthFilter('ALL'); }}
            className="mt-2 text-sm text-blue-400 hover:underline">Reinitialiser les filtres</button>
        </div>
      )}
    </div>
  );
}
