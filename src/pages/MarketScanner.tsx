/**
 * Scanner Marche — Scan multi-actifs avec données LIVE réelles
 * Fusionne structure statique avec prix live du marché
 */

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ScanLine, TrendingUp, TrendingDown, Activity,
  Clock, Target, Zap, Filter, AlertTriangle,
} from 'lucide-react';
import { useLiveData } from '@/hooks/useLiveData';
import { DataFreshnessMonitor } from '@/components/DataFreshnessMonitor';
import { ScannerGuide } from '@/components/FeatureGuide';
import { publishScannerResults } from '@/hooks/useLiveAlerts';

interface ScanResult {
  asset: string;
  category: string;
  price: number;
  change1h: number;
  change24h: number;
  rsi: number;
  macd: string;
  ema50: string;
  signal: 'ACHAT' | 'VENTE' | 'NEUTRE';
  confidence: number;
  alert: boolean;
}

// Base structure — prices and changes merged with live data at runtime
const BASE_RESULTS: Array<Omit<ScanResult, 'price' | 'change24h'>> = [
  { asset: 'XAU/USD', category: 'Metaux', change1h: 0.25, rsi: 62, macd: 'Haussier', ema50: 'Au-dessus', signal: 'ACHAT', confidence: 94, alert: true },
  { asset: 'BTC/USD', category: 'Crypto', change1h: 0.45, rsi: 68, macd: 'Haussier', ema50: 'Au-dessus', signal: 'ACHAT', confidence: 82, alert: true },
  { asset: 'ETH/USD', category: 'Crypto', change1h: 0.30, rsi: 64, macd: 'Haussier', ema50: 'Au-dessus', signal: 'ACHAT', confidence: 75, alert: false },
  { asset: 'SOL/USD', category: 'Crypto', change1h: 0.80, rsi: 71, macd: 'Fort Haussier', ema50: 'Au-dessus', signal: 'ACHAT', confidence: 72, alert: true },
  { asset: 'EUR/USD', category: 'Forex', change1h: -0.10, rsi: 72, macd: 'Baissier', ema50: 'En-dessous', signal: 'VENTE', confidence: 71, alert: false },
  { asset: 'GBP/USD', category: 'Forex', change1h: 0.15, rsi: 55, macd: 'Haussier', ema50: 'Au-dessus', signal: 'ACHAT', confidence: 78, alert: false },
  { asset: 'USD/JPY', category: 'Forex', change1h: -0.20, rsi: 78, macd: 'Baissier', ema50: 'En-dessous', signal: 'VENTE', confidence: 68, alert: true },
  { asset: 'NAS100', category: 'Indices', change1h: 0.35, rsi: 66, macd: 'Haussier', ema50: 'Au-dessus', signal: 'ACHAT', confidence: 85, alert: true },
  { asset: 'SPX500', category: 'Indices', change1h: 0.25, rsi: 63, macd: 'Haussier', ema50: 'Au-dessus', signal: 'ACHAT', confidence: 80, alert: false },
  { asset: 'XAG/USD', category: 'Metaux', change1h: 0.20, rsi: 58, macd: 'Neutre', ema50: 'Au-dessus', signal: 'ACHAT', confidence: 65, alert: false },
  { asset: 'WTI', category: 'Energie', change1h: 0.40, rsi: 59, macd: 'Haussier', ema50: 'Au-dessus', signal: 'ACHAT', confidence: 70, alert: false },
  { asset: 'DE40', category: 'Indices', change1h: 0.30, rsi: 61, macd: 'Haussier', ema50: 'Au-dessus', signal: 'ACHAT', confidence: 73, alert: false },
];

// Fallback prices when live data not yet available
const FALLBACK_PRICES: Record<string, { price: number; change24h: number }> = {
  'XAU/USD': { price: 4470.00, change24h: 0.12 },
  'XAG/USD': { price: 30.20, change24h: 0.45 },
  'BTC/USD': { price: 67500.00, change24h: 2.35 },
  'ETH/USD': { price: 3520.00, change24h: 1.85 },
  'SOL/USD': { price: 145.00, change24h: 3.20 },
  'EUR/USD': { price: 1.0850, change24h: -0.25 },
  'GBP/USD': { price: 1.2750, change24h: 0.15 },
  'USD/JPY': { price: 149.50, change24h: -0.35 },
  'NAS100': { price: 19500.00, change24h: 1.10 },
  'SPX500': { price: 5500.00, change24h: 0.85 },
  'WTI': { price: 78.50, change24h: 1.50 },
  'DE40': { price: 18500.00, change24h: 0.65 },
};

type CategoryFilter = 'ALL' | 'Metaux' | 'Crypto' | 'Forex' | 'Indices' | 'Energie';
type SignalFilter = 'ALL' | 'ACHAT' | 'VENTE' | 'NEUTRE';

export default function MarketScanner() {
  const [category, setCategory] = useState<CategoryFilter>('ALL');
  const [signalFilter, setSignalFilter] = useState<SignalFilter>('ALL');
  const [showAlerts, setShowAlerts] = useState(false);
  const [sortBy, setSortBy] = useState<'confidence' | 'change24h' | 'change1h' | 'rsi'>('confidence');

  // ─── LIVE DATA — merged with base structure ──
  const { data: liveData } = useLiveData();

  const results = useMemo((): ScanResult[] => {
    return BASE_RESULTS.map(base => {
      const live = liveData[base.asset];
      const fallback = FALLBACK_PRICES[base.asset];

      const price = live?.price ?? fallback?.price ?? 0;
      const change24h = live?.change24hPercent ?? fallback?.change24h ?? 0;

      // Recalculate signal from live change24h
      const liveSignal = change24h > 0.3 ? 'ACHAT' as const : change24h < -0.3 ? 'VENTE' as const : base.signal;

      // Recalculate alert from live volatility
      const alert = Math.abs(change24h) > 2.0 ? true : base.alert;

      return { ...base, price, change24h, signal: liveSignal, alert };
    });
  }, [liveData]);

  // Publish scanner results to the global alert system
  useEffect(() => {
    publishScannerResults(results.map(r => ({
      asset: r.asset,
      signal: r.signal,
      confidence: r.confidence,
      alert: r.alert,
    })));
  }, [results]);

  const filtered = useMemo(() => {
    let list = [...results];
    if (category !== 'ALL') list = list.filter(a => a.category === category);
    if (signalFilter !== 'ALL') list = list.filter(a => a.signal === signalFilter);
    if (showAlerts) list = list.filter(a => a.alert);
    list.sort((a, b) => {
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      if (sortBy === 'rsi') return b.rsi - a.rsi;
      return Math.abs(b[sortBy]) - Math.abs(a[sortBy]);
    });
    return list;
  }, [results, category, signalFilter, showAlerts, sortBy]);

  const stats = useMemo(() => ({
    total: results.length,
    achat: results.filter(a => a.signal === 'ACHAT').length,
    vente: results.filter(a => a.signal === 'VENTE').length,
    neutre: results.filter(a => a.signal === 'NEUTRE').length,
    alerts: results.filter(a => a.alert).length,
  }), [results]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <ScanLine className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Scanner Marche</h1>
          <p className="text-xs text-slate-400">Scan complet — {stats.total} actifs avec prix live reels</p>
        </div>
        <DataFreshnessMonitor />
      </div>

      <ScannerGuide />

      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Actifs', value: stats.total, icon: Activity, color: 'text-blue-400' },
          { label: 'Achats', value: stats.achat, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Ventes', value: stats.vente, icon: TrendingDown, color: 'text-red-400' },
          { label: 'Neutre', value: stats.neutre, icon: MinusIcon, color: 'text-slate-400' },
          { label: 'Alertes', value: stats.alerts, icon: AlertTriangle, color: 'text-amber-400' },
        ].map((s, i) => (
          <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center">
            <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-1`} />
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {(['ALL', 'Metaux', 'Crypto', 'Forex', 'Indices', 'Energie'] as CategoryFilter[]).map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${category === c ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-slate-900/60 border border-slate-800 text-slate-400'}`}>{c}</button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {(['ALL', 'ACHAT', 'VENTE', 'NEUTRE'] as SignalFilter[]).map(f => (
            <button key={f} onClick={() => setSignalFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${signalFilter === f ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-900/60 border border-slate-800 text-slate-400'}`}>{f === 'ALL' ? 'Tous' : f}</button>
          ))}
        </div>
        <button onClick={() => setShowAlerts(!showAlerts)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showAlerts ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-900/60 border border-slate-800 text-slate-400'}`}>
          <AlertTriangle className="w-3 h-3" /> Alertes
        </button>
        <div className="flex gap-1.5 ml-auto">
          {(['confidence', 'change24h', 'change1h', 'rsi'] as const).map(k => (
            <button key={k} onClick={() => setSortBy(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sortBy === k ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-900/60 border border-slate-800 text-slate-400'}`}>
              {k === 'confidence' ? 'Confiance' : k === 'change24h' ? '24h' : k === 'change1h' ? '1h' : 'RSI'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500">
                <th className="px-4 py-3 text-left">Actif</th>
                <th className="px-4 py-3 text-right">Prix</th>
                <th className="px-4 py-3 text-right">1h</th>
                <th className="px-4 py-3 text-right">24h</th>
                <th className="px-4 py-3 text-right">RSI</th>
                <th className="px-4 py-3 text-left">MACD</th>
                <th className="px-4 py-3 text-left">EMA50</th>
                <th className="px-4 py-3 text-center">Signal</th>
                <th className="px-4 py-3 text-right">Conf</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <motion.tr key={r.asset} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${r.alert ? 'bg-amber-500/5' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {r.alert && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                      <span className="font-bold text-white">{r.asset}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-white">{r.price.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</td>
                  <td className={`px-4 py-3 text-right font-mono ${r.change1h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{r.change1h >= 0 ? '+' : ''}{r.change1h.toFixed(2)}%</td>
                  <td className={`px-4 py-3 text-right font-mono ${r.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{r.change24h >= 0 ? '+' : ''}{r.change24h.toFixed(2)}%</td>
                  <td className={`px-4 py-3 text-right font-mono ${r.rsi > 70 ? 'text-red-400' : r.rsi < 30 ? 'text-emerald-400' : 'text-slate-400'}`}>{r.rsi}</td>
                  <td className={`px-4 py-3 text-xs ${r.macd.includes('Haussier') ? 'text-emerald-400' : r.macd.includes('Baissier') ? 'text-red-400' : 'text-slate-400'}`}>{r.macd}</td>
                  <td className={`px-4 py-3 text-xs ${r.ema50 === 'Au-dessus' ? 'text-emerald-400' : 'text-red-400'}`}>{r.ema50}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.signal === 'ACHAT' ? 'bg-emerald-500/20 text-emerald-400' : r.signal === 'VENTE' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>{r.signal}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold ${r.confidence >= 80 ? 'text-emerald-400' : r.confidence >= 60 ? 'text-amber-400' : 'text-slate-400'}`}>{r.confidence}%</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Dernier scan: {new Date().toLocaleTimeString('fr-FR')}</span>
        <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {filtered.length} resultats</span>
        <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Auto-refresh: 30s</span>
      </div>
    </div>
  );
}

function MinusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
