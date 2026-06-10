import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAISignals } from '@/hooks/useAISignals';
import { Calendar, Clock, AlertTriangle, TrendingUp, Circle, Wifi } from 'lucide-react';
import { CalendrierEcoGuide } from '@/components/FeatureGuide';

export default function CalendarPage() {
  const [filter, setFilter] = useState<'ALL' | 'High' | 'Medium' | 'Low'>('ALL');
  const { signals } = useAISignals();
  // Prices available via market context

  // Generate dynamic economic events from real signals + market context
  const economicEvents = useMemo(() => {
    const now = new Date();
    const events = [];

    // Create events from active high-confidence signals
    signals.filter(s => s.confidence >= 70).forEach((sig, idx) => {
      events.push({
        id: `evt-sig-${idx}`,
        time: sig.timestamp,
        currency: sig.asset.split('/')[0] || 'USD',
        event: `Signal IA ${sig.asset} — ${sig.signal} (${sig.confidence}%)`,
        impact: sig.confidence >= 90 ? 'High' : sig.confidence >= 75 ? 'Medium' : 'Low',
        forecast: `${sig.entryPoint.toFixed(2)}`,
        previous: `${sig.stopLoss.toFixed(2)}`,
      });
    });

    // Add upcoming signal refresh events
    events.push({
      id: 'evt-refresh',
      time: new Date(now.getTime() + 60000),
      currency: 'ALL',
      event: 'Rafraîchissement Signaux IA',
      impact: 'Low',
      forecast: 'Tous actifs',
      previous: `${signals.length} signaux`,
    });

    // Add market open events based on time
    const hour = now.getHours();
    if (hour < 9) {
      events.push({
        id: 'evt-open-eu',
        time: new Date(now.setHours(9, 0, 0, 0)),
        currency: 'EUR',
        event: 'Ouverture Marché Européen',
        impact: 'High' as const,
        forecast: 'Volatilité attendue',
      });
    }
    if (hour < 14) {
      events.push({
        id: 'evt-open-us',
        time: new Date(now.setHours(14, 30, 0, 0)),
        currency: 'USD',
        event: 'Ouverture Marché US + Futures',
        impact: 'High' as const,
        forecast: 'Impact élevé sur XAU/USD',
      });
    }

    return events.sort((a, b) => a.time.getTime() - b.time.getTime());
  }, [signals]);

  const filtered = filter === 'ALL' ? economicEvents : economicEvents.filter(e => e.impact === filter);

  const highCount = economicEvents.filter(e => e.impact === 'High').length;
  const mediumCount = economicEvents.filter(e => e.impact === 'Medium').length;
  const lowCount = economicEvents.filter(e => e.impact === 'Low').length;

  // Next 24h events
  const upcomingEvents = economicEvents.filter(e => e.time.getTime() > Date.now()).slice(0, 4);

  return (
    <div className="p-6 space-y-6">
      <CalendrierEcoGuide />
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Calendrier Économique</h1>
          <p className="text-xs text-slate-400">{economicEvents.length} événements — Signaux IA + Ouvertures marchés</p>
        </div>
        <span className="ml-auto flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
          <Wifi className="w-3 h-3" /> Live
        </span>
      </motion.div>

      {/* Impact Stats */}
      <div className="grid grid-cols-3 gap-4">
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setFilter('High')}
          className={`p-4 rounded-2xl border transition-all ${filter === 'High' ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-900/60 border-slate-800 hover:border-red-500/20'}`}
        >
          <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{highCount}</p>
          <p className="text-xs text-red-400">Impact Haut</p>
        </motion.button>
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          onClick={() => setFilter('Medium')}
          className={`p-4 rounded-2xl border transition-all ${filter === 'Medium' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-900/60 border-slate-800 hover:border-amber-500/20'}`}
        >
          <TrendingUp className="w-5 h-5 text-amber-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{mediumCount}</p>
          <p className="text-xs text-amber-400">Impact Moyen</p>
        </motion.button>
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          onClick={() => setFilter('Low')}
          className={`p-4 rounded-2xl border transition-all ${filter === 'Low' ? 'bg-slate-500/10 border-slate-500/30' : 'bg-slate-900/60 border-slate-800 hover:border-slate-600'}`}
        >
          <Circle className="w-5 h-5 text-slate-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{lowCount}</p>
          <p className="text-xs text-slate-400">Impact Faible</p>
        </motion.button>
      </div>

      {filter !== 'ALL' && (
        <button
          onClick={() => setFilter('ALL')}
          className="text-xs text-blue-400 hover:text-blue-300 underline"
        >
          Voir tous ({filter})
        </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {filtered.map((evt, idx) => (
            <motion.div
              key={evt.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex items-center gap-4 p-4 rounded-xl border ${
                evt.impact === 'High' ? 'bg-red-500/5 border-red-500/10' :
                evt.impact === 'Medium' ? 'bg-amber-500/5 border-amber-500/10' :
                'bg-slate-800/40 border-slate-700'
              }`}
            >
              <div className={`w-2 h-12 rounded-full ${evt.impact === 'High' ? 'bg-red-500' : evt.impact === 'Medium' ? 'bg-amber-500' : 'bg-slate-500'}`} />
              <div className="flex-1">
                <p className="text-sm text-white font-medium">{evt.event}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-500">{evt.currency}</span>
                  <span className="text-xs text-slate-500">{evt.time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  {evt.forecast && <span className="text-xs text-blue-400">Prev: {evt.forecast}</span>}
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded font-medium ${
                evt.impact === 'High' ? 'bg-red-500/20 text-red-400' :
                evt.impact === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                'bg-slate-600/20 text-slate-400'
              }`}>{evt.impact}</span>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-slate-500">Aucun événement pour ce filtre</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Upcoming */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6"
          >
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Prochains événements
            </h3>
            <div className="space-y-3">
              {upcomingEvents.map((evt, idx) => (
                <motion.div
                  key={evt.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-lg"
                >
                  <div className={`w-2 h-2 rounded-full ${evt.impact === 'High' ? 'bg-red-500' : evt.impact === 'Medium' ? 'bg-amber-500' : 'bg-slate-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{evt.event}</p>
                    <p className="text-xs text-slate-500">{evt.currency} — {evt.time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  {evt.impact === 'High' && <span className="px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-400">HIGH</span>}
                </motion.div>
              ))}
              {upcomingEvents.length === 0 && true && (
                <p className="text-xs text-slate-500 text-center">Aucun événement imminent</p>
              )}
            </div>
          </motion.div>

          {/* Volatility gauge */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900/60 border border-red-500/20 rounded-2xl p-6"
          >
            <h3 className="text-sm font-semibold text-red-400 mb-3">Contexte Marché</h3>
            <p className="text-xs text-slate-400 mb-3">
              {signals.length} signaux IA actifs analysant {new Set(signals.map(s => s.asset)).size} actifs en temps réel.
              La volatilité est calculée dynamiquement à partir des données de marché.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full" style={{ width: `${Math.min(100, signals.length * 15)}%` }} />
              </div>
              <span className="text-xs text-red-400 font-bold">{Math.min(100, signals.length * 15)}%</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">Activité de trading IA</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
