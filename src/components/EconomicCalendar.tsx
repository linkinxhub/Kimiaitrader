import React from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, TrendingUp, Circle } from 'lucide-react';
import type { EconomicEvent } from '@/types/trading';

interface EconomicCalendarProps {
  events: EconomicEvent[];
}

export const EconomicCalendar: React.FC<EconomicCalendarProps> = ({ events }) => {
  const getImpactIcon = (impact: string) => {
    if (impact === 'High') return <AlertTriangle className="w-4 h-4 text-red-400" />;
    if (impact === 'Medium') return <TrendingUp className="w-4 h-4 text-amber-400" />;
    return <Circle className="w-4 h-4 text-slate-500" />;
  };

  const getImpactColor = (impact: string) => {
    if (impact === 'High') return 'border-red-500/30 bg-red-500/5';
    if (impact === 'Medium') return 'border-amber-500/30 bg-amber-500/5';
    return 'border-slate-700 bg-slate-800/50';
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Calendrier Économique</h3>
      </div>

      <div className="space-y-3">
        {events.map((event, idx) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`p-4 rounded-xl border ${getImpactColor(event.impact)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {getImpactIcon(event.impact)}
                  <span className="text-xs font-medium text-slate-500">
                    {event.time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded bg-slate-800 text-slate-400">
                    {event.currency}
                  </span>
                </div>
                <p className="text-sm font-medium text-white">{event.event}</p>
                
                {(event.actual || event.forecast || event.previous) && (
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    {event.actual && (
                      <span className="text-slate-400">
                        Réel: <span className="text-emerald-400 font-medium">{event.actual}</span>
                      </span>
                    )}
                    {event.forecast && (
                      <span className="text-slate-400">
                        Prév: <span className="text-blue-400 font-medium">{event.forecast}</span>
                      </span>
                    )}
                    {event.previous && (
                      <span className="text-slate-400">
                        Préc: <span className="text-slate-500">{event.previous}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                event.impact === 'High' ? 'bg-red-500/20 text-red-400' :
                event.impact === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                'bg-slate-700 text-slate-400'
              }`}>
                {event.impact === 'High' ? 'Haut' : event.impact === 'Medium' ? 'Moyen' : 'Faible'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
