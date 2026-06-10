import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import type { TradingSignal } from '@/types/trading';
import { ConfidenceGauge } from './ConfidenceGauge';

interface SignalCardProps {
  signal: TradingSignal;
}

export const SignalCard: React.FC<SignalCardProps> = ({ signal }) => {
  const isBuy = signal.signal === 'ACHAT';
  const isSell = signal.signal === 'VENTE';
  
  const signalColor = isBuy ? 'text-emerald-400' : isSell ? 'text-red-400' : 'text-amber-400';
  const signalBg = isBuy ? 'bg-emerald-500/10 border-emerald-500/30' : isSell ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30';
  const SignalIcon = isBuy ? TrendingUp : isSell ? TrendingDown : Minus;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border ${signalBg} p-6 backdrop-blur-sm`}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <SignalIcon className={`w-8 h-8 ${signalColor}`} />
            <h2 className={`text-3xl font-bold ${signalColor}`}>{signal.signal}</h2>
          </div>
          <p className="text-lg text-slate-300">{signal.asset}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-slate-800 text-slate-300">
              {signal.riskLevel === 'Faible' && <Shield className="w-3 h-3 inline mr-1" />}
              {signal.riskLevel === 'Élevé' && <AlertTriangle className="w-3 h-3 inline mr-1" />}
              {signal.riskLevel === 'Modéré' && <CheckCircle className="w-3 h-3 inline mr-1" />}
              Risque {signal.riskLevel}
            </span>
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-slate-800 text-emerald-400">
              Qualité: {signal.signalQuality}
            </span>
          </div>
        </div>
        <ConfidenceGauge value={signal.confidence} size={120} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900/60 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Point d'entrée</p>
          <p className="text-xl font-bold text-white">{signal.entryPoint.toFixed(2)}</p>
        </div>
        <div className="bg-slate-900/60 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Stop Loss</p>
          <p className="text-xl font-bold text-red-400">{signal.stopLoss.toFixed(2)}</p>
        </div>
        <div className="bg-slate-900/60 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Take Profit 1</p>
          <p className="text-xl font-bold text-emerald-400">{signal.takeProfit1.toFixed(2)}</p>
        </div>
        <div className="bg-slate-900/60 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Risk/Reward</p>
          <p className="text-xl font-bold text-blue-400">{signal.riskRewardRatio}</p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-400 mb-3">Explication IA</h3>
        {signal.explanations.map((exp, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-start gap-3 bg-slate-900/40 rounded-lg p-3"
          >
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-300">{exp.indicator}: <span className="text-blue-400">{exp.value}</span></p>
              <p className="text-xs text-slate-500">{exp.interpretation}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
