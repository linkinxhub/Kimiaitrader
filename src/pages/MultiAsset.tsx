/**
 * Multi-Actifs — Comparaison cross-actifs avec données LIVE
 * Fusionne structure statique avec prix live du marché
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Split, TrendingUp, TrendingDown, Minus,
  BarChart3, Target, Zap, Activity, Globe, Clock,
} from 'lucide-react';
import { useLiveData } from '@/hooks/useLiveData';
import { DataFreshnessMonitor } from '@/components/DataFreshnessMonitor';
import { MultiAssetGuide } from '@/components/FeatureGuide';

interface AssetRow {
  asset: string;
  category: string;
  price: number;
  change24h: number;
  signal: 'ACHAT' | 'VENTE' | 'NEUTRE';
  score: number;
  rsi: number;
  trend: string;
  volatility: number;
  volume: string;
}

// Base structure — prices merged with live data at runtime
const BASE_ASSETS: Array<Omit<AssetRow, 'price' | 'change24h'>> = [
  { asset: 'XAU/USD', category: 'Metaux', signal: 'ACHAT', score: 94, rsi: 62, trend: 'Haussiere', volatility: 12, volume: 'High' },
  { asset: 'XAG/USD', category: 'Metaux', signal: 'ACHAT', score: 65, rsi: 58, trend: 'Haussiere', volatility: 18, volume: 'Medium' },
  { asset: 'BTC/USD', category: 'Crypto', signal: 'ACHAT', score: 82, rsi: 68, trend: 'Haussiere', volatility: 45, volume: 'Very High' },
  { asset: 'ETH/USD', category: 'Crypto', signal: 'ACHAT', score: 75, rsi: 64, trend: 'Haussiere', volatility: 38, volume: 'High' },
  { asset: 'SOL/USD', category: 'Crypto', signal: 'ACHAT', score: 72, rsi: 71, trend: 'Haussiere', volatility: 42, volume: 'High' },
  { asset: 'EUR/USD', category: 'Forex', signal: 'VENTE', score: 71, rsi: 72, trend: 'Baissiere', volatility: 8, volume: 'High' },
  { asset: 'GBP/USD', category: 'Forex', signal: 'ACHAT', score: 78, rsi: 55, trend: 'Haussiere', volatility: 10, volume: 'Medium' },
  { asset: 'USD/JPY', category: 'Forex', signal: 'VENTE', score: 68, rsi: 78, trend: 'Baissiere', volatility: 9, volume: 'Medium' },
  { asset: 'NAS100', category: 'Indices', signal: 'ACHAT', score: 85, rsi: 66, trend: 'Haussiere', volatility: 15, volume: 'High' },
  { asset: 'SPX500', category: 'Indices', signal: 'ACHAT', score: 80, rsi: 63, trend: 'Haussiere', volatility: 12, volume: 'High' },
  { asset: 'WTI', category: 'Energie', signal: 'ACHAT', score: 70, rsi: 59, trend: 'Haussiere', volatility: 22, volume: 'High' },
  { asset: 'BRENT', category: 'Energie', signal: 'ACHAT', score: 72, rsi: 61, trend: 'Haussiere', volatility: 20, volume: 'High' },
];

// Fallback prices when live data not yet available
const FALLBACK_PRICES: Record<string, { price: number; change24h: number }> = {
  'XAU/USD': { price: 4470.00, change24h: 0.12 },
  'XAG/USD': { price: 30.20, change24h: 0.45 },
  'BTC/USD': { price: 67500.00, change24h: 2.35 },
  'ETH/USD': { price: 3520.00, change24h: 1.85 },
  'SOL/USD': { price: 145.00, change24h: 3.20 },
  'BNB/USD': { price: 590.00, change24h: 1.46 },
  'EUR/USD': { price: 1.0850, change24h: -0.25 },
  'GBP/USD': { price: 1.2750, change24h: 0.15 },
  'USD/JPY': { price: 149.50, change24h: -0.35 },
  'USD/CHF': { price: 0.9050, change24h: 0.30 },
  'NAS100': { price: 19500.00, change24h: 1.10 },
  'SPX500': { price: 5500.00, change24h: 0.85 },
  'DE40': { price: 18500.00, change24h: 0.65 },
  'WTI': { price: 78.50, change24h: 1.50 },
  'BRENT': { price: 82.30, change24h: 1.35 },
};

type CategoryFilter = 'ALL' | 'Metaux' | 'Crypto' | 'Forex' | 'Indices' | 'Energie';
type SignalFilter = 'ALL' | 'ACHAT' | 'VENTE' | 'NEUTRE';

export default function MultiAsset() {
  const [category, setCategory] = useState<CategoryFilter>('ALL');
  const [signalFilter, setSignalFilter] = useState<SignalFilter>('ALL');
  const [sortBy, setSortBy] = useState<'score' | 'change' | 'volatility'>('score');
  const [selected, setSelected] = useState<string[]>([]);

  // ─── LIVE DATA — merged with base structure ──
  const { data: liveData } = useLiveData();

  const assets = useMemo((): AssetRow[] => {
    return BASE_ASSETS.map(base => {
      const live = liveData[base.asset];
      const fallback = FALLBACK_PRICES[base.asset];

      const price = live?.price ?? fallback?.price ?? 0;
      const change24h = live?.change24hPercent ?? fallback?.change24h ?? 0;

      // Recalculate signal from live change
      const signal = change24h > 0.2 ? 'ACHAT' as const : change24h < -0.2 ? 'VENTE' as const : 'NEUTRE' as const;

      return { ...base, price, change24h, signal };
    });
  }, [liveData]);

  const filtered = useMemo(() => {
    let list = [...assets];
    if (category !== 'ALL') list = list.filter(a => a.category === category);
    if (signalFilter !== 'ALL') list = list.filter(a => a.signal === signalFilter);
    list.sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'change') return Math.abs(b.change24h) - Math.abs(a.change24h);
      return b.volatility - a.volatility;
    });
    return list;
  }, [assets, category, signalFilter, sortBy]);

  const toggleSelect = (asset: string) => {
    setSelected(prev => prev.includes(asset) ? prev.filter(a => a !== asset) : [...prev, asset]);
  };

  const selectedAssets = assets.filter(a => selected.includes(a.asset));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Split className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Multi-Actifs</h1>
          <p className="text-xs text-slate-400">Comparaison cross-actifs — {assets.length} actifs avec prix live</p>
        </div>
        <DataFreshnessMonitor />
      </div>

      <MultiAssetGuide />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {(['ALL', 'Metaux', 'Crypto', 'Forex', 'Indices', 'Energie'] as CategoryFilter[]).map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${category === c ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-slate-900/60 border border-slate-800 text-slate-400'}`}>{c}</button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {(['ALL', 'ACHAT', 'VENTE'] as SignalFilter[]).map(f => (
            <button key={f} onClick={() => setSignalFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${signalFilter === f ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-900/60 border border-slate-800 text-slate-400'}`}>{f === 'ALL' ? 'Tous' : f}</button>
          ))}
        </div>
        <div className="flex gap-1.5 ml-auto">
          {([['score', 'Score'], ['change', 'Change %'], ['volatility', 'Volatilite']] as [string, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setSortBy(k as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sortBy === k ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-900/60 border border-slate-800 text-slate-400'}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500">
                <th className="px-4 py-3 text-left">Actif</th>
                <th className="px-4 py-3 text-left">Categorie</th>
                <th className="px-4 py-3 text-right">Prix</th>
                <th className="px-4 py-3 text-right">24h</th>
                <th className="px-4 py-3 text-center">Signal</th>
                <th className="px-4 py-3 text-right">Score</th>
                <th className="px-4 py-3 text-right">RSI</th>
                <th className="px-4 py-3 text-left">Trend</th>
                <th className="px-4 py-3 text-right">Vol</th>
                <th className="px-4 py-3 text-center">Select</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((asset, i) => (
                <motion.tr key={asset.asset} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${selected.includes(asset.asset) ? 'bg-blue-500/5' : ''}`}>
                  <td className="px-4 py-3 font-bold text-white">{asset.asset}</td>
                  <td className="px-4 py-3 text-slate-400">{asset.category}</td>
                  <td className="px-4 py-3 text-right font-mono text-white">{asset.price.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</td>
                  <td className={`px-4 py-3 text-right font-mono ${asset.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${asset.signal === 'ACHAT' ? 'bg-emerald-500/20 text-emerald-400' : asset.signal === 'VENTE' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>{asset.signal}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold ${asset.score >= 80 ? 'text-emerald-400' : asset.score >= 60 ? 'text-amber-400' : 'text-slate-400'}`}>{asset.score}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-400">{asset.rsi}</td>
                  <td className="px-4 py-3 text-slate-400">{asset.trend}</td>
                  <td className="px-4 py-3 text-right text-slate-400">{asset.volatility}%</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleSelect(asset.asset)}
                      className={`w-5 h-5 rounded border transition-colors ${selected.includes(asset.asset) ? 'bg-blue-500 border-blue-500' : 'border-slate-600 hover:border-blue-500'}`}>
                      {selected.includes(asset.asset) && <Zap className="w-3 h-3 text-white mx-auto" />}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAssets.length >= 2 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-violet-400" /> Comparaison: {selectedAssets.map(a => a.asset).join(' vs ')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {selectedAssets.map(a => (
              <div key={a.asset} className="bg-slate-950/40 rounded-xl p-4">
                <p className="font-bold text-white mb-2">{a.asset}</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-slate-500">Prix</span><span className="text-white font-mono">{a.price.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Score</span><span className={a.score >= 80 ? 'text-emerald-400' : 'text-amber-400'}>{a.score}/100</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">RSI</span><span className="text-slate-300">{a.rsi}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Vol</span><span className="text-slate-300">{a.volatility}%</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">24h</span><span className={a.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}>{a.change24h >= 0 ? '+' : ''}{a.change24h}%</span></div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
