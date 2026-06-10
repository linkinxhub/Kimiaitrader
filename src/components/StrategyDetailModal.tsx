/**
 * Strategy Detail Modal — Fiche detaillee avec backtest simule
 * Affiche : description, regles, signaux, gestion risque, backtest
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  X, BookOpen, Target, TrendingUp, TrendingDown, Shield,
  AlertTriangle, CheckCircle, Star, Zap, Clock, BarChart3,
  Award, ArrowRight, Play, Layers, XCircle
} from 'lucide-react';
import {
  getStrategyById, generateBacktest, CATEGORY_LABELS, STYLE_LABELS, DIFFICULTY_LABELS, RISK_LABELS,
  type Strategy, type BacktestResult,
} from '@/services/strategyLibrary';
import { getPriority1Assets } from '@/services/assetCatalog';

const GRADE_COLORS: Record<string, { bg: string; text: string }> = {
  'A+': { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  'A': { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  'B': { bg: 'bg-blue-500/15', text: 'text-blue-400' },
  'C': { bg: 'bg-amber-500/15', text: 'text-amber-400' },
  'D': { bg: 'bg-red-500/15', text: 'text-red-400' },
};

function gradeFromScore(score: number): string {
  if (score >= 85) return 'A+';
  if (score >= 70) return 'A';
  if (score >= 55) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

interface Props {
  strategyId: string;
  onClose: () => void;
}

export default function StrategyDetailModal({ strategyId, onClose }: Props) {
  const strategy = getStrategyById(strategyId);
  const [selectedAsset, setSelectedAsset] = useState<string>('XAU/USD');
  const [selectedTF, setSelectedTF] = useState<string>('H1');
  const [showBacktest, setShowBacktest] = useState(false);

  if (!strategy) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-950/95 backdrop-blur border-b border-slate-800 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${GRADE_COLORS[gradeFromScore(strategy.reliabilityScore)]?.bg} flex items-center justify-center`}>
              <BookOpen className={`w-5 h-5 ${GRADE_COLORS[gradeFromScore(strategy.reliabilityScore)]?.text}`} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{strategy.name}</h2>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${GRADE_COLORS[gradeFromScore(strategy.reliabilityScore)]?.bg} ${GRADE_COLORS[gradeFromScore(strategy.reliabilityScore)]?.text}`}>
                  {gradeFromScore(strategy.reliabilityScore)}
                </span>
                <span className="text-xs text-slate-500">{CATEGORY_LABELS[strategy.category]} — {STYLE_LABELS[strategy.style]}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800"><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        <div className="p-5 space-y-6">
          {/* Meta */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetaCard icon={Star} label="Fiabilite" value={`${strategy.reliabilityScore}%`} color="amber" />
            <MetaCard icon={Shield} label="Risque" value={RISK_LABELS[strategy.riskLevel].label} color={strategy.riskLevel === 'faible' ? 'emerald' : strategy.riskLevel === 'moyen' ? 'amber' : 'red'} />
            <MetaCard icon={Award} label="Difficulte" value={DIFFICULTY_LABELS[strategy.difficulty]} color="blue" />
            <MetaCard icon={Target} label="R/R Conseille" value={strategy.recommendedRR} color="purple" />
          </div>

          {/* Description */}
          <Section icon={BookOpen} title="Description">
            <p className="text-sm text-slate-300 leading-relaxed">{strategy.description}</p>
            <p className="text-sm text-slate-400 mt-2"><span className="text-slate-500">Objectif:</span> {strategy.objective}</p>
          </Section>

          {/* Markets & Timeframes */}
          <Section icon={Layers} title="Marches et Timeframes">
            <div className="flex flex-wrap gap-2 mb-2">
              {strategy.markets.map(m => <span key={m} className="px-2 py-1 rounded-lg bg-slate-800 text-xs text-slate-300">{m}</span>)}
            </div>
            <div className="flex flex-wrap gap-2">
              {strategy.timeframes.map(tf => <span key={tf} className="px-2 py-1 rounded-lg bg-violet-500/10 text-xs text-violet-400">{tf}</span>)}
            </div>
          </Section>

          {/* Indicators */}
          <Section icon={Zap} title="Indicateurs Utilises">
            <div className="flex flex-wrap gap-2">
              {strategy.indicators.map(i => <span key={i} className="px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400">{i}</span>)}
            </div>
          </Section>

          {/* Signals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SignalCard type="buy" signal={strategy.buySignal} />
            <SignalCard type="sell" signal={strategy.sellSignal} />
          </div>

          {/* Risk Management */}
          <Section icon={Shield} title="Gestion du Risque">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                <p className="text-[10px] text-red-400 font-medium mb-1">STOP LOSS</p>
                <p className="text-sm text-white">{strategy.stopLossRule}</p>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                <p className="text-[10px] text-emerald-400 font-medium mb-1">TAKE PROFIT</p>
                <p className="text-sm text-white">{strategy.takeProfitRule}</p>
              </div>
            </div>
          </Section>

          {/* Avantages / Inconvenients */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Section icon={CheckCircle} title="Avantages">
              <ul className="space-y-1">
                {strategy.advantages.map((a, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><span className="text-emerald-400 mt-0.5">+</span>{a}</li>)}
              </ul>
            </Section>
            <Section icon={AlertTriangle} title="Inconvenients">
              <ul className="space-y-1">
                {strategy.disadvantages.map((d, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><span className="text-amber-400 mt-0.5">-</span>{d}</li>)}
              </ul>
            </Section>
          </div>

          {/* Erreurs frequentes */}
          <Section icon={AlertTriangle} title="Erreurs Frequentes">
            <ul className="space-y-1">
              {strategy.commonErrors.map((e, i) => <li key={i} className="text-xs text-red-400 flex items-start gap-2"><X className="w-3 h-3 mt-0.5 flex-shrink-0" />{e}</li>)}
            </ul>
          </Section>

          {/* When not to use */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Quand ne PAS utiliser cette strategie
            </h4>
            <ul className="space-y-1">
              {strategy.whenNotToUse.map((w, i) => <li key={i} className="text-xs text-slate-400">{w}</li>)}
            </ul>
          </div>

          {/* AI Summary */}
          <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-violet-400 mb-2 flex items-center gap-2">
              <Star className="w-4 h-4" /> Resume IA
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">{strategy.aiSummary}</p>
          </div>

          {/* Backtest Section */}
          <div className="border-t border-slate-800 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" /> Backtest Simule
              </h3>
              <div className="flex items-center gap-2">
                <select value={selectedAsset} onChange={e => setSelectedAsset(e.target.value)}
                  className="px-2 py-1 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-white">
                  {getPriority1Assets().map(a => <option key={a.symbol} value={a.symbol}>{a.symbol}</option>)}
                </select>
                <select value={selectedTF} onChange={e => setSelectedTF(e.target.value)}
                  className="px-2 py-1 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-white">
                  {['M15', 'H1', 'H4', 'D1'].map(tf => <option key={tf} value={tf}>{tf}</option>)}
                </select>
                <button onClick={() => setShowBacktest(!showBacktest)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs hover:bg-emerald-500/20">
                  <Play className="w-3 h-3" /> {showBacktest ? 'Masquer' : 'Tester'}
                </button>
              </div>
            </div>

            {showBacktest && <BacktestResults strategy={strategy} asset={selectedAsset} tf={selectedTF} />}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Sub-components ─────────────────────────────────────

function MetaCard({ icon: Icon, label, value, color }: { icon: typeof Star; label: string; value: string; color: string }) {
  const colors: Record<string, string> = { amber: 'text-amber-400', emerald: 'text-emerald-400', red: 'text-red-400', blue: 'text-blue-400', purple: 'text-purple-400' };
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
      <Icon className={`w-5 h-5 mx-auto mb-1 ${colors[color] || 'text-slate-400'}`} />
      <p className={`text-sm font-bold ${colors[color] || 'text-white'}`}>{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof BookOpen; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-500" /> {title}
      </h4>
      {children}
    </div>
  );
}

function SignalCard({ type, signal }: { type: 'buy' | 'sell'; signal: string }) {
  return (
    <div className={`rounded-xl p-4 border ${type === 'buy' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
      <p className={`text-[10px] font-medium mb-1 ${type === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>
        {type === 'buy' ? 'SIGNAL ACHAT' : 'SIGNAL VENTE'}
      </p>
      <p className={`text-sm ${type === 'buy' ? 'text-emerald-300' : 'text-red-300'}`}>{signal}</p>
    </div>
  );
}

function BacktestResults({ strategy, asset, tf }: { strategy: Strategy; asset: string; tf: string }) {
  const result = useMemo(() => generateBacktest(strategy, asset, tf), [strategy, asset, tf]);

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: 'Win Rate', value: `${result.winRate}%`, color: result.winRate >= 60 ? 'text-emerald-400' : result.winRate >= 45 ? 'text-amber-400' : 'text-red-400' },
          { label: 'Profit Factor', value: `${result.profitFactor}`, color: result.profitFactor >= 1.5 ? 'text-emerald-400' : 'text-amber-400' },
          { label: 'Trades', value: `${result.totalTrades}`, color: 'text-blue-400' },
          { label: 'P&L Net', value: `${result.netProfit > 0 ? '+' : ''}${result.netProfit.toFixed(0)} pts`, color: result.netProfit > 0 ? 'text-emerald-400' : 'text-red-400' },
          { label: 'Gain Moy.', value: `${result.avgGain.toFixed(1)} pts`, color: 'text-emerald-400' },
          { label: 'Perte Moy.', value: `${result.avgLoss.toFixed(1)} pts`, color: 'text-red-400' },
          { label: 'Drawdown Max', value: `${result.maxDrawdown.toFixed(1)} pts`, color: 'text-red-400' },
          { label: 'R/R Moy.', value: `${result.avgRR.toFixed(2)}`, color: result.avgRR >= 1.5 ? 'text-emerald-400' : 'text-amber-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900/40 rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-slate-500">{stat.label}</p>
            <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-600">Simulation basee sur les parametres de la strategie. Resultats non garantis en conditions reelles.</p>
    </motion.div>
  );
}
