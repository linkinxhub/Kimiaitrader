import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import type { MarketOverview } from '@/types/trading';

interface MarketTickerProps {
  markets: MarketOverview[];
}

export const MarketTicker: React.FC<MarketTickerProps> = ({ markets }) => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
      {markets.map((market, idx) => (
        <motion.div
          key={market.asset}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="flex-shrink-0 bg-slate-900/80 border border-slate-800 rounded-xl p-4 min-w-[180px]"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-white">{market.asset}</span>
            {market.changePercent >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
          </div>
          <p className="text-lg font-bold text-white">
            {market.price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
          </p>
          <p className={`text-sm font-medium ${market.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {market.changePercent >= 0 ? '+' : ''}{market.changePercent.toFixed(2)}%
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Activity className="w-3 h-3 text-slate-500" />
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${market.aiScore >= 80 ? 'bg-emerald-500' : market.aiScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${market.aiScore}%` }}
              />
            </div>
            <span className="text-xs text-slate-500">{market.aiScore}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
