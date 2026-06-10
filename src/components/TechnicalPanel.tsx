import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Indicator {
  name: string;
  value: string;
  signal: string;
  status: 'bullish' | 'bearish' | 'neutral';
}

interface TechnicalPanelProps {
  indicators: Indicator[];
}

export const TechnicalPanel: React.FC<TechnicalPanelProps> = ({ indicators }) => {
  const getStatusIcon = (status: string) => {
    if (status === 'bullish') return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    if (status === 'bearish') return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-amber-400" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'bullish') return 'border-emerald-500/30 bg-emerald-500/5';
    if (status === 'bearish') return 'border-red-500/30 bg-red-500/5';
    return 'border-amber-500/30 bg-amber-500/5';
  };

  const bullishCount = indicators.filter(i => i.status === 'bullish').length;
  const bearishCount = indicators.filter(i => i.status === 'bearish').length;
  const neutralCount = indicators.filter(i => i.status === 'neutral').length;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Indicateurs Techniques</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-emerald-400">
            <TrendingUp className="w-3 h-3" /> {bullishCount}
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <TrendingDown className="w-3 h-3" /> {bearishCount}
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <Minus className="w-3 h-3" /> {neutralCount}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {indicators.map((indicator, idx) => (
          <motion.div
            key={indicator.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`flex items-center justify-between p-3 rounded-xl border ${getStatusColor(indicator.status)}`}
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(indicator.status)}
              <div>
                <p className="text-sm font-medium text-slate-300">{indicator.name}</p>
                <p className="text-xs text-slate-500">{indicator.signal}</p>
              </div>
            </div>
            <span className="text-sm font-bold text-white">{indicator.value}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
