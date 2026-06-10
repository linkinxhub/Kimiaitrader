import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAISignals } from '@/hooks/useAISignals';
import { useMarketData } from '@/hooks/useMarketData';
import { Newspaper, Sun, Wifi } from 'lucide-react';
import { IntelligenceCenterGuide } from '@/components/FeatureGuide';

export default function IntelligenceCenter() {
  const { signals, marketSummary, loading } = useAISignals();
  const { prices } = useMarketData();

  // Generate dynamic briefings from real data
  const briefings = useMemo(() => {
    const xau = prices['XAU/USD'];
    const btc = prices['BTC/USD'];
    const eur = prices['EUR/USD'];

    const xauSig = signals.find(s => s.asset === 'XAU/USD');
    const btcSig = signals.find(s => s.asset === 'BTC/USD');
    const eurSig = signals.find(s => s.asset === 'EUR/USD');

    const now = new Date();
    const hour = now.getHours();

    let timeOfDay: 'Matin' | 'Midi' | 'Soir';
    let timeIcon = Sun;
    let timeColor = 'text-amber-400';
    let timeBg = 'bg-amber-500/5 border-amber-500/10';

    if (hour < 12) {
      timeOfDay = 'Matin';
      timeIcon = Sun;
      timeColor = 'text-amber-400';
      timeBg = 'bg-amber-500/5 border-amber-500/10';
    } else if (hour < 18) {
      timeOfDay = 'Midi';
      timeIcon = Sun;
      timeColor = 'text-orange-400';
      timeBg = 'bg-orange-500/5 border-orange-500/10';
    } else {
      timeOfDay = 'Soir';
      timeIcon = Sun;
      timeColor = 'text-blue-400';
      timeBg = 'bg-blue-500/5 border-blue-500/10';
    }

    const bullishCount = signals.filter(s => s.signal === 'ACHAT').length;
    const bearishCount = signals.filter(s => s.signal === 'VENTE').length;
    const dominantBias = bullishCount > bearishCount ? 'haussier' : bearishCount > bullishCount ? 'baissier' : 'neutre';

    return [{
      time: timeOfDay,
      icon: timeIcon,
      color: timeColor,
      bg: timeBg,
      title: `Briefing ${timeOfDay} — ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      summary: `Le marché affiche un biais ${dominantBias} avec ${bullishCount} signaux d'achat et ${bearishCount} signaux de vente sur ${signals.length} actifs analysés. ${xauSig ? `L'or (XAU/USD) est à ${xau?.price.toFixed(2)} avec un signal ${xauSig.signal} (${xauSig.confidence}%).` : ''}`,
      forex: eurSig ? `${eurSig.signal} EUR/USD (${eurSig.confidence}%)` : `${eur ? eur.price.toFixed(5) : '...'} EUR/USD`,
      xau: xau ? `${xauSig?.signal || 'Analyse'} XAU @ ${xau.price.toFixed(2)}` : 'Chargement...',
      crypto: btc ? `BTC @ ${btc.price.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} — ${btcSig?.signal || 'Analyse'}` : 'Chargement...',
      indices: `${signals.filter(s => s.asset.includes('NAS') || s.asset.includes('US30')).length} signaux indices`,
    }];
  }, [signals, prices]);

  return (
    <div className="p-6 space-y-6">
      <IntelligenceCenterGuide />
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <Newspaper className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Centre Intelligence Marché</h1>
          <p className="text-xs text-slate-400">Synthèses basées sur les données temps réel</p>
        </div>
        {!loading && signals.length > 0 && (
          <span className="ml-auto flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400">
            <Wifi className="w-3 h-3" /> {signals.length} signaux actifs
          </span>
        )}
        <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/20">PRO</span>
      </motion.div>

      {/* Dynamic Market Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {marketSummary.map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
            className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-white">{m.label}</span>
            </div>
            <p className={`text-sm ${m.score >= 70 ? 'text-emerald-400' : m.score >= 50 ? 'text-amber-400' : 'text-red-400'} mb-2`}>{m.status}</p>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${m.score}%` }} transition={{ duration: 1, delay: 0.3 }}
                className={`h-full rounded-full ${m.score >= 80 ? 'bg-emerald-500' : m.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} />
            </div>
            <p className="text-xs text-slate-500 mt-1">Force IA : {m.score}%</p>
          </motion.div>
        ))}
      </div>

      {/* Dynamic Briefings */}
      <div className="space-y-4">
        {briefings.map((b, i) => (
          <motion.div key={b.time} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
            className={`rounded-2xl border p-6 ${b.bg}`}>
            <div className="flex items-center gap-3 mb-4">
              <b.icon className={`w-6 h-6 ${b.color}`} />
              <h3 className="text-lg font-bold text-white">{b.title}</h3>
            </div>
            <p className="text-sm text-slate-300 mb-4">{b.summary}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[{ label: 'Forex', val: b.forex }, { label: 'Or (XAU)', val: b.xau }, { label: 'Crypto', val: b.crypto }, { label: 'Indices', val: b.indices }].map((item, j) => (
                <div key={j} className="bg-slate-900/40 rounded-lg p-3">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-xs font-medium text-slate-300 mt-1">{item.val}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
