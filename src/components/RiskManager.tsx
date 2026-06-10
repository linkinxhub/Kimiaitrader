import React from 'react';
import { motion } from 'framer-motion';
import { Target, Shield, TrendingUp, AlertTriangle } from 'lucide-react';
import type { TradingSignal } from '@/types/trading';

interface RiskManagerProps {
  signal: TradingSignal;
}

export const RiskManager: React.FC<RiskManagerProps> = ({ signal }) => {
  const riskAmount = Math.abs(signal.entryPoint - signal.stopLoss);
  const profit1 = Math.abs(signal.takeProfit1 - signal.entryPoint);
  const profit2 = Math.abs(signal.takeProfit2 - signal.entryPoint);
  const profit3 = Math.abs(signal.takeProfit3 - signal.entryPoint);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-emerald-400" />
        <h3 className="text-lg font-semibold text-white">Gestion du Risque</h3>
      </div>

      <div className="space-y-4">
        {/* Entry and Stop Loss */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800/60 rounded-xl p-4 border border-blue-500/20"
          >
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-500">Entrée</span>
            </div>
            <p className="text-xl font-bold text-blue-400">{signal.entryPoint.toFixed(2)}</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/60 rounded-xl p-4 border border-red-500/20"
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-slate-500">Stop Loss</span>
            </div>
            <p className="text-xl font-bold text-red-400">{signal.stopLoss.toFixed(2)}</p>
            <p className="text-xs text-red-400/60">-{riskAmount.toFixed(2)} pts</p>
          </motion.div>
        </div>

        {/* Take Profits */}
        <div className="space-y-2">
          <p className="text-xs text-slate-500 font-medium">Take Profits</p>
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-slate-300">TP1</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-emerald-400">{signal.takeProfit1.toFixed(2)}</p>
              <p className="text-xs text-emerald-400/60">+{profit1.toFixed(2)} pts</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-slate-300">TP2</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-emerald-400">{signal.takeProfit2.toFixed(2)}</p>
              <p className="text-xs text-emerald-400/60">+{profit2.toFixed(2)} pts</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-between p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-slate-300">TP3</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-emerald-400">{signal.takeProfit3.toFixed(2)}</p>
              <p className="text-xs text-emerald-400/60">+{profit3.toFixed(2)} pts</p>
            </div>
          </motion.div>
        </div>

        {/* Risk/Reward Ratio */}
        <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Ratio Risk/Reward</span>
            <span className="text-2xl font-bold text-blue-400">{signal.riskRewardRatio}</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((parseFloat(signal.riskRewardRatio.split(':')[1]) / 5) * 100, 100)}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Pour 1€ de risque, potentiel de {signal.riskRewardRatio.split(':')[1]}€ de gain
          </p>
        </div>
      </div>
    </div>
  );
};
