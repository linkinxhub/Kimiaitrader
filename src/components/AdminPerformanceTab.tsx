import { useState, useCallback } from 'react';
import { Award, Target, TrendingUp, Sparkles, CheckCircle, RefreshCw, Zap } from 'lucide-react';

const DEFAULT_PACKS = [
  { pack: 'free', name: 'Free', signals: 3, achat: 1, vente: 1, attente: 1, conf: 45, wr: 0, trades: 0, wins: 0, losses: 0, pnl: 0, users: 1, engage: 25, color: 'slate' },
  { pack: 'pro', name: 'Pro', signals: 89, achat: 38, vente: 31, attente: 20, conf: 72, wr: 66.7, trades: 12, wins: 8, losses: 4, pnl: 2850, users: 3, engage: 68, color: 'amber' },
  { pack: 'expert', name: 'Expert', signals: 156, achat: 67, vente: 54, attente: 35, conf: 78, wr: 71.4, trades: 28, wins: 20, losses: 8, pnl: 6240, users: 2, engage: 82, color: 'purple' },
  { pack: 'institutional', name: 'Institutionnel', signals: 312, achat: 134, vente: 109, attente: 69, conf: 85, wr: 76.8, trades: 56, wins: 43, losses: 13, pnl: 18950, users: 1, engage: 91, color: 'rose' },
];

const COLOR_MAP: Record<string, { border: string; title: string; bg: string }> = {
  slate:  { border: 'border-slate-600/30',  title: 'text-slate-400',  bg: 'bg-slate-800' },
  amber:  { border: 'border-amber-500/30',  title: 'text-amber-400',  bg: 'bg-amber-500/10' },
  purple: { border: 'border-purple-500/30', title: 'text-purple-400', bg: 'bg-purple-500/10' },
  rose:   { border: 'border-rose-500/30',   title: 'text-rose-400',   bg: 'bg-rose-500/10' },
};

export default function AdminPerformanceTab() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  }, []);

  const globalWr = DEFAULT_PACKS.reduce((s, p) => s + p.wins, 0);
  const globalTrades = DEFAULT_PACKS.reduce((s, p) => s + p.trades, 0);
  const globalPnl = DEFAULT_PACKS.reduce((s, p) => s + p.pnl, 0);
  const globalSignals = DEFAULT_PACKS.reduce((s, p) => s + p.signals, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" /> Performance des Packs
          </h3>
          <p className="text-xs text-slate-400">Statistiques par pack — actualisees en temps reel</p>
        </div>
        <button onClick={refresh} disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Actualiser
        </button>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-emerald-500/20 rounded-2xl p-4 text-center">
          <Target className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-emerald-400">{globalTrades > 0 ? ((globalWr / globalTrades) * 100).toFixed(1) : 0}%</p>
          <p className="text-xs text-slate-500">Win Rate Global</p>
        </div>
        <div className="bg-slate-900/60 border border-blue-500/20 rounded-2xl p-4 text-center">
          <TrendingUp className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-400">{globalPnl.toLocaleString('fr-FR')} €</p>
          <p className="text-xs text-slate-500">P&L Total</p>
        </div>
        <div className="bg-slate-900/60 border border-purple-500/20 rounded-2xl p-4 text-center">
          <Sparkles className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-purple-400">{globalSignals.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-slate-500">Signaux Total</p>
        </div>
        <div className="bg-slate-900/60 border border-amber-500/20 rounded-2xl p-4 text-center">
          <CheckCircle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-amber-400">76.4%</p>
          <p className="text-xs text-slate-500">Precision Moyenne</p>
        </div>
      </div>

      {/* Pack Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {DEFAULT_PACKS.map(pack => {
          const c = COLOR_MAP[pack.color];
          return (
            <div key={pack.pack} className={`bg-slate-900/60 border ${c.border} rounded-2xl p-5`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
                  <Zap className={`w-5 h-5 ${c.title}`} />
                </div>
                <div>
                  <h4 className={`text-lg font-bold ${c.title}`}>{pack.name}</h4>
                  <p className="text-xs text-slate-500">{pack.users} utilisateur{pack.users > 1 ? 's' : ''}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-slate-800/40 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-emerald-400">{pack.wr}%</p>
                  <p className="text-[10px] text-slate-500">Win Rate</p>
                </div>
                <div className="bg-slate-800/40 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-blue-400">{pack.pnl.toLocaleString('fr-FR')} €</p>
                  <p className="text-[10px] text-slate-500">P&L</p>
                </div>
                <div className="bg-slate-800/40 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-amber-400">{pack.trades}</p>
                  <p className="text-[10px] text-slate-500">Trades</p>
                </div>
              </div>

              {/* Signal Distribution */}
              <div className="mb-3">
                <p className="text-xs text-slate-500 mb-2">Distribution signaux</p>
                <div className="flex h-3 rounded-full overflow-hidden">
                  <div className="bg-emerald-500" style={{ width: `${(pack.achat / pack.signals) * 100}%` }} />
                  <div className="bg-red-500" style={{ width: `${(pack.vente / pack.signals) * 100}%` }} />
                  <div className="bg-amber-500" style={{ width: `${(pack.attente / pack.signals) * 100}%` }} />
                </div>
                <div className="flex gap-3 text-xs text-slate-400 mt-2">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />{pack.achat} Achats</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />{pack.vente} Ventes</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />{pack.attente} Attentes</span>
                </div>
              </div>

              {/* Engagement */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">Engagement</span>
                  <span className="text-xs font-bold text-white">{pack.engage}/100</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${pack.engage >= 80 ? 'bg-emerald-500' : pack.engage >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pack.engage}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
