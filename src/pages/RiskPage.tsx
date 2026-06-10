import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RiskManager } from '@/components/RiskManager';
import { useAISignals } from '@/hooks/useAISignals';
import { useMarketData } from '@/hooks/useMarketData';
import { Shield, Calculator, AlertTriangle, TrendingUp, DollarSign, Percent, Wifi } from 'lucide-react';
import { GestionRisqueGuide } from '@/components/FeatureGuide';

export default function RiskPage() {
  const { topSignal, signals } = useAISignals();
  const { prices } = useMarketData();

  const [capital, setCapital] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(2);
  const [lotSize, setLotSize] = useState(0.1);
  const [selectedSignal, setSelectedSignal] = useState<string>('');

  // Select a signal dynamically
  const activeSignal = useMemo(() => {
    if (selectedSignal) return signals.find(s => s.id === selectedSignal) || topSignal;
    return topSignal;
  }, [selectedSignal, signals, topSignal]);

  const riskAmount = (capital * riskPercent) / 100;
  const slPips = activeSignal ? Math.abs(activeSignal.entryPoint - activeSignal.stopLoss) : 0;
  const pipValue = slPips > 0 ? riskAmount / (slPips * 10) : 0;
  const recommendedLots = Math.min(pipValue / 10, 5);
  const tp1Pips = activeSignal ? Math.abs(activeSignal.takeProfit1 - activeSignal.entryPoint) : 0;
  const tp2Pips = activeSignal ? Math.abs(activeSignal.takeProfit2 - activeSignal.entryPoint) : 0;
  const tp3Pips = activeSignal ? Math.abs(activeSignal.takeProfit3 - activeSignal.entryPoint) : 0;
  const profit1 = tp1Pips * lotSize * 10;
  const profit2 = tp2Pips * lotSize * 10;
  const profit3 = tp3Pips * lotSize * 10;

  return (
    <div className="p-6 space-y-6">
      <GestionRisqueGuide />
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Gestion du Risque Avancée</h1>
          <p className="text-xs text-slate-400">Calculez votre sizing optimal basé sur les signaux IA en temps réel</p>
        </div>
        {signals.length > 0 && (
          <span className="ml-auto flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
            <Wifi className="w-3 h-3" /> {signals.length} signaux
          </span>
        )}
      </motion.div>

      {/* Signal Selector */}
      {signals.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <label className="text-xs text-slate-500 mb-2 block">Sélectionner un signal actif</label>
          <div className="flex flex-wrap gap-2">
            {signals.slice(0, 6).map(sig => (
              <button
                key={sig.id}
                onClick={() => setSelectedSignal(sig.id)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  selectedSignal === sig.id
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'bg-slate-800/60 text-slate-400 border border-slate-700 hover:text-white'
                }`}
              >
                {sig.asset} — {sig.signal} ({sig.confidence}%)
                {prices[sig.asset]?.price && (
                  <span className="ml-1 text-slate-600">@ {prices[sig.asset].price.toFixed(2)}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Manager */}
        <div className="lg:col-span-1">
          {activeSignal ? (
            <RiskManager signal={{
              id: activeSignal.id,
              asset: activeSignal.asset,
              assetType: activeSignal.asset as any,
              signal: activeSignal.signal,
              confidence: activeSignal.confidence,
              riskLevel: activeSignal.riskLevel,
              signalQuality: activeSignal.confidence >= 80 ? 'Excellent' : activeSignal.confidence >= 60 ? 'Bon' : 'Moyen',
              entryPoint: activeSignal.entryPoint,
              stopLoss: activeSignal.stopLoss,
              takeProfit1: activeSignal.takeProfit1,
              takeProfit2: activeSignal.takeProfit2,
              takeProfit3: activeSignal.takeProfit3,
              riskRewardRatio: activeSignal.riskRewardRatio,
              timestamp: activeSignal.timestamp,
              explanations: activeSignal.explanations,
              timeFrameAnalysis: [],
              aiScore: activeSignal.aiScore,
              marketSentiment: activeSignal.marketSentiment,
              volatility: activeSignal.volatility,
            }} />
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center">
              <p className="text-sm text-slate-500">Aucun signal actif — calcul impossible</p>
            </div>
          )}
        </div>

        {/* Calculator */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-400" />
              Calculateur de Position
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="text-xs text-slate-500 mb-2 block flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Capital (USD)
                </label>
                <input
                  type="number"
                  value={capital}
                  onChange={(e) => setCapital(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-2 block flex items-center gap-1">
                  <Percent className="w-3 h-3" /> Risque par Trade (%)
                </label>
                <input
                  type="number"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(Number(e.target.value))}
                  min={0.5} max={10} step={0.5}
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-2 block">Taille du Lot</label>
                <input
                  type="number"
                  value={lotSize}
                  onChange={(e) => setLotSize(Number(e.target.value))}
                  min={0.01} max={5} step={0.01}
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            {activeSignal ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl text-center">
                    <p className="text-xs text-slate-500 mb-1">Montant à risquer</p>
                    <p className="text-xl font-bold text-red-400">${riskAmount.toFixed(2)}</p>
                    <p className="text-xs text-red-400/60">{riskPercent}% du capital</p>
                  </div>
                  <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl text-center">
                    <p className="text-xs text-slate-500 mb-1">SL en pts</p>
                    <p className="text-xl font-bold text-blue-400">{slPips.toFixed(2)}</p>
                    <p className="text-xs text-blue-400/60">{activeSignal.asset}</p>
                  </div>
                  <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl text-center">
                    <p className="text-xs text-slate-500 mb-1">Lot recommandé</p>
                    <p className="text-xl font-bold text-amber-400">{recommendedLots.toFixed(2)}</p>
                    <p className="text-xs text-amber-400/60">Based on risk {riskPercent}%</p>
                  </div>
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-center">
                    <p className="text-xs text-slate-500 mb-1">Potentiel TP3</p>
                    <p className="text-xl font-bold text-emerald-400">+${profit3.toFixed(2)}</p>
                    <p className="text-xs text-emerald-400/60">{activeSignal.riskRewardRatio} R/R</p>
                  </div>
                </div>

                {/* Profit Scenarios */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mt-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6"
                >
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    Scénarios de Profit — {activeSignal.asset}
                  </h2>
                  <div className="space-y-3">
                    {[
                      { label: 'Take Profit 1 (Conservateur)', price: activeSignal.takeProfit1, pips: tp1Pips, profit: profit1, color: 'emerald' as const },
                      { label: 'Take Profit 2 (Modéré)', price: activeSignal.takeProfit2, pips: tp2Pips, profit: profit2, color: 'blue' as const },
                      { label: 'Take Profit 3 (Aggressif)', price: activeSignal.takeProfit3, pips: tp3Pips, profit: profit3, color: 'purple' as const },
                    ].map((tp, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`flex items-center justify-between p-4 bg-${tp.color}-500/5 rounded-xl border border-${tp.color}-500/10`}
                      >
                        <div>
                          <p className={`text-sm font-semibold text-${tp.color}-400`}>{tp.label}</p>
                          <p className="text-xs text-slate-500">{tp.pips.toFixed(2)} pts — Prix: {tp.price.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold text-${tp.color}-400`}>+${tp.profit.toFixed(2)}</p>
                          <p className="text-xs text-slate-500">{((tp.profit / riskAmount) * 100).toFixed(0)}% du risque</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </>
            ) : (
              <div className="text-center p-8">
                <p className="text-sm text-slate-500">Sélectionnez un signal pour calculer les niveaux de risque</p>
              </div>
            )}
          </motion.div>

          {/* Risk Warning */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-amber-400 mb-1">Avertissement de Risque</h3>
                <p className="text-xs text-slate-400">
                  Le trading comporte des risques significatifs de perte. Ne risquez jamais plus de 2% de votre capital par trade.
                  Les signaux IA sont indicatifs et ne garantissent pas les résultats.
                  Utilisez toujours un stop loss et gérez votre risque de manière responsable.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
