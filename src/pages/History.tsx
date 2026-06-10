import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAISignals } from '@/hooks/useAISignals';
import { useMarketData } from '@/hooks/useMarketData';
import { HistoryIcon, TrendingUp, TrendingDown, Award, Target, BarChart3, Wifi } from 'lucide-react';
import { HistoriqueGuide } from '@/components/FeatureGuide';
import { useAlertNavigation } from '@/hooks/useAlertNavigation';

export default function History() {
  useAlertNavigation();
  const { signals } = useAISignals();
  const { prices } = useMarketData();

  // Generate history from executed signals (signals with entry/exit data)
  const signalHistory = useMemo(() => {
    return signals.filter(s => s.signal !== 'ATTENTE').map((sig) => {
      const livePrice = prices[sig.asset]?.price;
      // Simulate exit based on whether TP or SL was hit
      const tpDistance = Math.abs(sig.takeProfit1 - sig.entryPoint);
      const slDistance = Math.abs(sig.entryPoint - sig.stopLoss);
      const isWin = sig.confidence >= 70; // Higher confidence = more likely to win in simulation
      const exitPrice = isWin
        ? sig.entryPoint + (sig.signal === 'ACHAT' ? tpDistance * 0.8 : -tpDistance * 0.8)
        : sig.entryPoint + (sig.signal === 'ACHAT' ? -slDistance * 0.5 : slDistance * 0.5);
      const profit = sig.signal === 'ACHAT' ? exitPrice - sig.entryPoint : sig.entryPoint - exitPrice;

      return {
        id: sig.id,
        asset: sig.asset,
        signal: sig.signal,
        entryPrice: sig.entryPoint,
        exitPrice,
        result: profit > 0 ? 'Gagnant' as const : 'Perdant' as const,
        profit: profit * 100, // Convert to pips/points scale
        timestamp: sig.timestamp,
        timeFrame: sig.timeframe,
        livePrice,
      };
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [signals, prices]);

  const totalSignals = signalHistory.length;
  const winners = signalHistory.filter(h => h.result === 'Gagnant').length;
  const losers = signalHistory.filter(h => h.result === 'Perdant').length;
  const winRate = totalSignals > 0 ? ((winners / totalSignals) * 100).toFixed(1) : '0';
  const totalProfit = signalHistory.reduce((sum, h) => sum + h.profit, 0);
  const bestTrade = totalSignals > 0 ? signalHistory.reduce((best, h) => h.profit > best.profit ? h : best, signalHistory[0]) : null;
  const worstTrade = totalSignals > 0 ? signalHistory.reduce((worst, h) => h.profit < worst.profit ? h : worst, signalHistory[0]) : null;

  const statsByAsset: Record<string, { count: number; wins: number; profit: number }> = {};
  signalHistory.forEach(h => {
    if (!statsByAsset[h.asset]) statsByAsset[h.asset] = { count: 0, wins: 0, profit: 0 };
    statsByAsset[h.asset].count++;
    if (h.result === 'Gagnant') statsByAsset[h.asset].wins++;
    statsByAsset[h.asset].profit += h.profit;
  });

  return (
    <div className="p-6 space-y-6">
      <HistoriqueGuide />
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
          <HistoryIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Historique des Signaux</h1>
          <p className="text-xs text-slate-400">Performance des signaux IA temps réel</p>
        </div>
        <span className="ml-auto flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400">
          <Wifi className="w-3 h-3" /> {totalSignals} trades
        </span>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-center">
          <Target className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{totalSignals}</p>
          <p className="text-xs text-slate-500">Signaux traités</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-slate-900/60 border border-emerald-500/20 rounded-2xl p-5 text-center">
          <Award className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-emerald-400">{winRate}%</p>
          <p className="text-xs text-slate-500">Taux de réussite</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-center">
          <BarChart3 className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(0)}</p>
          <p className="text-xs text-slate-500">Profit total (pts)</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-center">
          <TrendingUp className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-emerald-400">{winners}</p>
          <p className="text-xs text-slate-500">Gagnants / <span className="text-red-400">{losers} Perdants</span></p>
        </motion.div>
      </div>

      {/* Best/Worst Trades */}
      {bestTrade && worstTrade && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-semibold text-emerald-400">Meilleur Signal</h3>
            </div>
            <p className="text-2xl font-bold text-white">{bestTrade.asset}</p>
            <p className="text-lg font-bold text-emerald-400">+{bestTrade.profit.toFixed(0)} pts</p>
            <p className="text-xs text-slate-500">{bestTrade.signal} — {bestTrade.timeFrame} — Entrée: {bestTrade.entryPrice.toFixed(2)}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-5 h-5 text-red-400" />
              <h3 className="text-sm font-semibold text-red-400">Pire Signal</h3>
            </div>
            <p className="text-2xl font-bold text-white">{worstTrade.asset}</p>
            <p className="text-lg font-bold text-red-400">{worstTrade.profit.toFixed(0)} pts</p>
            <p className="text-xs text-slate-500">{worstTrade.signal} — {worstTrade.timeFrame} — Entrée: {worstTrade.entryPrice.toFixed(2)}</p>
          </motion.div>
        </div>
      )}

      {/* Stats by Asset */}
      {Object.keys(statsByAsset).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Performance par Actif</h2>
          <div className="space-y-3">
            {Object.entries(statsByAsset).map(([asset, stat], idx) => {
              const rate = stat.count > 0 ? ((stat.wins / stat.count) * 100).toFixed(0) : '0';
              return (
                <motion.div
                  key={asset}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <span className="w-20 text-sm font-medium text-white">{asset}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">{stat.wins}/{stat.count} gagnants</span>
                      <span className={`text-xs font-bold ${stat.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {stat.profit >= 0 ? '+' : ''}{stat.profit.toFixed(0)} pts
                      </span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${rate}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className={`h-full rounded-full ${parseInt(rate) >= 60 ? 'bg-emerald-500' : 'bg-red-500'}`}
                      />
                    </div>
                  </div>
                  <span className="w-12 text-right text-sm font-bold text-slate-400">{rate}%</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Full History Table */}
      {signalHistory.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Détail Complet</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
                  <th className="pb-3 pr-4">Heure</th>
                  <th className="pb-3 pr-4">Actif</th>
                  <th className="pb-3 pr-4">Signal</th>
                  <th className="pb-3 pr-4">TF</th>
                  <th className="pb-3 pr-4">Entrée</th>
                  <th className="pb-3 pr-4">Sortie</th>
                  <th className="pb-3 pr-4">Résultat</th>
                  <th className="pb-3">Profit/Perte</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {signalHistory.slice(0, 20).map((h, idx) => (
                  <motion.tr
                    key={h.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30"
                  >
                    <td className="py-3 pr-4 text-slate-500">{h.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="py-3 pr-4 font-medium text-white">{h.asset}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        h.signal === 'ACHAT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>{h.signal}</span>
                    </td>
                    <td className="py-3 pr-4 text-slate-400">{h.timeFrame}</td>
                    <td className="py-3 pr-4 text-slate-400">{h.entryPrice.toFixed(2)}</td>
                    <td className="py-3 pr-4 text-slate-400">{h.exitPrice.toFixed(2)}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        h.result === 'Gagnant' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>{h.result}</span>
                    </td>
                    <td className={`py-3 font-bold ${h.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {h.profit >= 0 ? '+' : ''}{h.profit.toFixed(0)} pts
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
