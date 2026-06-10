import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { TimeFrameAnalysis } from '@/types/trading';

interface TimeFrameMatrixProps {
  analyses: TimeFrameAnalysis[];
}

export const TimeFrameMatrix: React.FC<TimeFrameMatrixProps> = ({ analyses }) => {
  const getTrendIcon = (trend: string) => {
    if (trend === 'HAUSSIÈRE') return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    if (trend === 'BAISSIÈRE') return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-amber-400" />;
  };

  const getProbabilityColor = (prob: number) => {
    if (prob >= 80) return 'text-emerald-400';
    if (prob >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getBarColor = (strength: number) => {
    if (strength >= 80) return 'bg-emerald-500';
    if (strength >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Analyse Multi-Timeframes</h3>
      <div className="space-y-3">
        {analyses.map((analysis, idx) => (
          <motion.div
            key={analysis.timeframe}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-center gap-4 group"
          >
            <div className="w-12 flex-shrink-0">
              <span className="text-sm font-bold text-slate-400">{analysis.timeframe}</span>
            </div>
            
            <div className="w-6 flex-shrink-0">
              {getTrendIcon(analysis.trend)}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">{analysis.recommendation}</span>
                <span className={`text-sm font-bold ${getProbabilityColor(analysis.probability)}`}>
                  {analysis.probability}%
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${analysis.trendStrength}%` }}
                  transition={{ duration: 1, delay: idx * 0.1 }}
                  className={`h-full rounded-full ${getBarColor(analysis.trendStrength)}`}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-slate-800/60 rounded-xl border border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Décision finale IA</span>
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg font-bold text-lg border border-emerald-500/30"
          >
            ACHAT FORT
          </motion.span>
        </div>
      </div>
    </div>
  );
};
