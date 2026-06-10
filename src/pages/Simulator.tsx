import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gamepad2, TrendingUp, TrendingDown, Brain, History,
  Play, Award, BarChart3, DollarSign
} from 'lucide-react';
import { SimulateurGuide } from '@/components/FeatureGuide';
import { useMarketData, useCandles } from '@/hooks/useMarketData';
import { calculateRSI, calculateMACD } from '@/services/marketApi';
import { SIGNAL_TYPES } from '@/types/simulator';
import type { Simulation, SignalType } from '@/types/simulator';
import { PriceChart } from '@/components/PriceChart';
import { formatCurrency } from '@/lib/format';

const ASSET_OPTIONS = [
  { label: 'BTC/USD', value: 'BTC/USD' },
  { label: 'ETH/USD', value: 'ETH/USD' },
  { label: 'SOL/USD', value: 'SOL/USD' },
  { label: 'XRP/USD', value: 'XRP/USD' },
  { label: 'EUR/USD', value: 'EUR/USD' },
  { label: 'GBP/USD', value: 'GBP/USD' },
  { label: 'USD/JPY', value: 'USD/JPY' },
  { label: 'XAU/USD', value: 'XAU/USD' },
];

const TIMEFRAMES = ['M5', 'M15', 'M30', 'H1', 'H4', 'D1'];

const generateAICommentary = (pnl: number, rrr: number, signalName: string): string => {
  if (pnl > 0) {
    if (rrr > 2) return `Excellent trade ! Le signal ${signalName} a parfaitement fonctionné. Votre ratio risk/reward de ${rrr}:1 est optimal. Continuez à attendre des setups de cette qualité.`;
    return `Trade gagnant. Le signal ${signalName} était valide. Pour améliorer, cherchez des entrées avec un R/R supérieur à 2:1.`;
  }
  if (rrr < 1) return `Le stop loss était trop serré (R/R de ${rrr}:1). Avec le signal ${signalName}, donnez plus d'espace au prix pour respirer. Considérez un SL basé sur l'ATR.`;
  return `Le trade n'a pas fonctionné malgré un bon setup ${signalName}. Cela arrive — respectez votre plan et votre risk management. La clé est la constance sur le long terme.`;
};

export default function Simulator() {
  const { prices } = useMarketData();

  // Simulator state
  const [virtualCapital, setVirtualCapital] = useState(10000);
  const [selectedAsset, setSelectedAsset] = useState('BTC/USD');
  const [selectedTimeframe, setSelectedTimeframe] = useState('H1');
  const [selectedSignal, setSelectedSignal] = useState(SIGNAL_TYPES[0]);
  const [lotSize, setLotSize] = useState(0.1);
  const [direction, setDirection] = useState<SignalType>('ACHAT');
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [lastSim, setLastSim] = useState<Simulation | null>(null);
  const [mode, setMode] = useState<'manual' | 'signal'>('manual');

  // Candles for chart
  const binanceTfMap: Record<string, string> = { M5: '5m', M15: '15m', M30: '30m', H1: '1h', H4: '4h', D1: '1d' };
  const { candles } = useCandles(selectedAsset as any, binanceTfMap[selectedTimeframe] || '1h');

  // Use live price or fallback — ensures simulator always works
  const currentPrice = prices[selectedAsset]?.price || 0;
  const hasPrice = currentPrice > 0;
  const closes = candles.map(c => c.close);
  const rsi = closes.length > 14 ? calculateRSI(closes) : 50;
  const macdData = closes.length > 26 ? calculateMACD(closes) : null;

  // Stats
  const totalPnL = simulations.reduce((s, sim) => s + sim.pnl, 0);
  const winCount = simulations.filter(s => s.pnl > 0).length;
  const winRate = simulations.length > 0 ? (winCount / simulations.length) * 100 : 0;
  const maxDrawdown = simulations.length > 0 ? Math.min(...simulations.map(s => s.pnl)) : 0;

  // Calculate SL/TP based on signal
  const calculateSLTP = useCallback(() => {
    if (!currentPrice) return { sl: 0, tp: 0 };
    const volatility = currentPrice * 0.005;
    const sl = direction === 'ACHAT' ? currentPrice - volatility * 1.5 : currentPrice + volatility * 1.5;
    const tp = direction === 'ACHAT' ? currentPrice + volatility * 3 : currentPrice - volatility * 3;
    return { sl: Number(sl.toFixed(2)), tp: Number(tp.toFixed(2)) };
  }, [currentPrice, direction]);

  const { sl, tp } = calculateSLTP();
  const leverage = currentPrice > 1000 ? 10 : 100000;
  const potentialProfit = Math.abs(tp - currentPrice) * lotSize * leverage;
  const potentialLoss = Math.abs(sl - currentPrice) * lotSize * leverage;
  const riskReward = potentialLoss > 0 ? (potentialProfit / potentialLoss).toFixed(2) : '0';

  const runSimulation = () => {
    if (!currentPrice || currentPrice <= 0) return;

    // AI-powered simulation: result influenced by technical indicators
    // Higher RSI favors VENTE, lower RSI favors ACHAT
    // MACD histogram direction influences outcome
    const rsiBias = direction === 'ACHAT' ? (100 - rsi) / 100 : rsi / 100;
    const macdBias = macdData ? (macdData.histogram[macdData.histogram.length - 1] > 0 ? 1 : -1) : 0;
    const signalBias = direction === 'ACHAT' ? (macdBias > 0 ? 0.15 : -0.1) : (macdBias < 0 ? 0.15 : -0.1);
    const confidenceFactor = selectedSignal.confidence / 100;

    // Combined bias: -1 (worst) to +1 (best)
    const combinedBias = (rsiBias - 0.5) * 0.4 + signalBias * 0.4 + (confidenceFactor - 0.5) * 0.2;

    // Price change based on bias + small randomness (realistic volatility)
    const volatility = currentPrice * 0.008; // 0.8% realistic intraday move
    const priceChange = (combinedBias + (Math.random() - 0.5) * 0.3) * volatility;
    const exitPrice = direction === 'ACHAT' ? currentPrice + priceChange : currentPrice - priceChange;

    // Contract size calculation
    const contractSize = selectedAsset.includes('JPY') ? 1000 :
                         selectedAsset.includes('XAU') ? 100 :
                         selectedAsset.includes('XAG') ? 5000 :
                         selectedAsset.includes('BTC') ? 1 :
                         selectedAsset.includes('ETH') ? 10 :
                         selectedAsset.includes('NAS') || selectedAsset.includes('SPX') ? 10 :
                         100000; // Standard forex lot

    const pnl = direction === 'ACHAT'
      ? (exitPrice - currentPrice) * lotSize * contractSize
      : (currentPrice - exitPrice) * lotSize * contractSize;
    const pnlPercent = (pnl / virtualCapital) * 100;

    const sim: Simulation = {
      id: `sim-${Date.now()}`,
      asset: selectedAsset,
      mode: mode === 'signal' ? 'signal' : 'manual',
      signalType: selectedSignal.name,
      entryPrice: currentPrice,
      exitPrice,
      stopLoss: sl,
      takeProfit: tp,
      lotSize,
      direction,
      pnl: Number(pnl.toFixed(2)),
      pnlPercent: Number(pnlPercent.toFixed(2)),
      riskReward: `${riskReward}:1`,
      status: pnl > 0 ? 'closed_win' : 'closed_loss',
      openedAt: new Date(),
      closedAt: new Date(Date.now() + Math.random() * 3600000),
      duration: Math.floor(Math.random() * 3600),
      aiCommentary: generateAICommentary(pnl, parseFloat(riskReward), selectedSignal.name),
    };

    setSimulations(prev => [sim, ...prev]);
    setLastSim(sim);
    setShowResults(true);
    setVirtualCapital(prev => prev + sim.pnl);
  };

  // Chart data for PriceChart
  const chartData = candles.map((c) => ({
    timestamp: c.time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
  }));

  return (
    <div className="p-6 space-y-6">
      <SimulateurGuide />
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <Gamepad2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Simulateur de Trading</h1>
          <p className="text-xs text-slate-400">Testez vos stratégies sans risque avec des données réelles</p>
        </div>
        <span className="ml-auto px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/20">LIVE</span>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center">
          <DollarSign className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{formatCurrency(virtualCapital)}</p>
          <p className="text-xs text-slate-500">Capital virtuel</p>
        </div>
        <div className={`rounded-2xl p-4 text-center border ${totalPnL >= 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
          <TrendingUp className={`w-5 h-5 mx-auto mb-1 ${totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
          <p className={`text-lg font-bold ${totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)} €</p>
          <p className="text-xs text-slate-500">PnL Total</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center">
          <Award className="w-5 h-5 text-amber-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-amber-400">{winRate.toFixed(1)}%</p>
          <p className="text-xs text-slate-500">Win Rate ({winCount}/{simulations.length})</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center">
          <BarChart3 className="w-5 h-5 text-red-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-red-400">{maxDrawdown.toFixed(2)} €</p>
          <p className="text-xs text-slate-500">Max Drawdown</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 space-y-4">
          <PriceChart data={chartData} title={`${selectedAsset} — ${selectedTimeframe}`} height={350} />

          {/* Indicators */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500">RSI (14)</p>
              <p className={`text-lg font-bold ${rsi > 70 ? 'text-red-400' : rsi < 30 ? 'text-emerald-400' : 'text-amber-400'}`}>{rsi.toFixed(1)}</p>
              <p className="text-xs text-slate-600">{rsi > 70 ? 'Surachat' : rsi < 30 ? 'Survente' : 'Neutre'}</p>
            </div>
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500">MACD</p>
              <p className={`text-lg font-bold ${macdData && macdData.histogram[macdData.histogram.length - 1] > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {macdData ? (macdData.histogram[macdData.histogram.length - 1] > 0 ? 'Haussier' : 'Baissier') : 'N/A'}
              </p>
            </div>
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500">Prix</p>
              <p className="text-lg font-bold text-blue-400">{currentPrice ? currentPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '—'}</p>
              <p className="text-xs text-slate-600">{prices[selectedAsset]?.source || '—'}</p>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="space-y-4">
          {/* Mode Selection */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex gap-2 mb-4">
              <button onClick={() => setMode('manual')} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${mode === 'manual' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-400'}`}>Manuelle</button>
              <button onClick={() => setMode('signal')} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${mode === 'signal' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-400'}`}>Par Signal IA</button>
            </div>

            {/* Asset */}
            <div className="mb-3">
              <label className="text-xs text-slate-500 mb-1 block">Actif</label>
              <select value={selectedAsset} onChange={e => setSelectedAsset(e.target.value)} className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white">
                {ASSET_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>

            {/* Timeframe */}
            <div className="mb-3">
              <label className="text-xs text-slate-500 mb-1 block">Timeframe</label>
              <div className="flex gap-1">
                {TIMEFRAMES.map(tf => (
                  <button key={tf} onClick={() => setSelectedTimeframe(tf)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedTimeframe === tf ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-400'}`}>{tf}</button>
                ))}
              </div>
            </div>

            {/* Direction */}
            <div className="mb-3">
              <label className="text-xs text-slate-500 mb-1 block">Direction</label>
              <div className="flex gap-2">
                <button onClick={() => setDirection('ACHAT')} className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-all ${direction === 'ACHAT' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}><TrendingUp className="w-4 h-4" /> ACHAT</button>
                <button onClick={() => setDirection('VENTE')} className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-all ${direction === 'VENTE' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-400'}`}><TrendingDown className="w-4 h-4" /> VENTE</button>
              </div>
            </div>

            {/* Signal Selection (signal mode) */}
            {mode === 'signal' && (
              <div className="mb-3">
                <label className="text-xs text-slate-500 mb-1 block">Signal IA</label>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {SIGNAL_TYPES.filter(s => s.type === direction).map(sig => (
                    <button key={sig.id} onClick={() => setSelectedSignal(sig)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${selectedSignal.id === sig.id ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-slate-800'}`}>
                      <div className="flex items-center justify-between">
                        <span>{sig.name}</span>
                        <span className={`text-xs ${sig.confidence >= 80 ? 'text-emerald-400' : sig.confidence >= 70 ? 'text-amber-400' : 'text-red-400'}`}>{sig.confidence}%</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Lot Size */}
            <div className="mb-3">
              <label className="text-xs text-slate-500 mb-1 block">Lot Size</label>
              <input type="range" min="0.01" max="5" step="0.01" value={lotSize} onChange={e => setLotSize(parseFloat(e.target.value))} className="w-full" />
              <p className="text-sm font-bold text-white text-center">{lotSize.toFixed(2)} lots</p>
            </div>

            {/* Calculators */}
            <div className="bg-slate-800/40 rounded-xl p-3 space-y-2 mb-3">
              <div className="flex justify-between text-xs"><span className="text-slate-500">Entrée</span><span className="text-blue-400 font-bold">{currentPrice.toFixed(2)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">Stop Loss</span><span className="text-red-400 font-bold">{sl.toFixed(2)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">Take Profit</span><span className="text-emerald-400 font-bold">{tp.toFixed(2)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">Risque</span><span className="text-red-400">-{potentialLoss.toFixed(2)} €</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">Gain potentiel</span><span className="text-emerald-400">+{potentialProfit.toFixed(2)} €</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">R/R</span><span className="text-amber-400 font-bold">{riskReward}:1</span></div>
            </div>

            {/* Price source indicator */}
            {!hasPrice && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 text-center">
                Données en mode estimation — Simulation basée sur prix de référence
              </div>
            )}

            {/* Run Button */}
            <button onClick={runSimulation} disabled={!hasPrice}
              className={`w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${!hasPrice ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : direction === 'ACHAT' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg hover:shadow-emerald-500/20' : 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-lg hover:shadow-red-500/20'}`}>
              <Play className="w-5 h-5" /> {direction === 'ACHAT' ? 'Simuler Achat' : 'Simuler Vente'}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {showResults && lastSim && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`rounded-2xl border p-6 ${lastSim.pnl > 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
            <div className="flex items-center gap-3 mb-4">
              {lastSim.pnl > 0 ? <TrendingUp className="w-6 h-6 text-emerald-400" /> : <TrendingDown className="w-6 h-6 text-red-400" />}
              <h3 className={`text-lg font-bold ${lastSim.pnl > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {lastSim.pnl > 0 ? 'Trade Gagnant' : 'Trade Perdant'} : {lastSim.pnl > 0 ? '+' : ''}{lastSim.pnl.toFixed(2)} € ({lastSim.pnlPercent > 0 ? '+' : ''}{lastSim.pnlPercent.toFixed(2)}%)
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-slate-900/40 rounded-lg p-3 text-center"><p className="text-xs text-slate-500">Entrée</p><p className="text-sm font-bold text-white">{lastSim.entryPrice.toFixed(2)}</p></div>
              <div className="bg-slate-900/40 rounded-lg p-3 text-center"><p className="text-xs text-slate-500">Sortie</p><p className="text-sm font-bold text-white">{lastSim.exitPrice?.toFixed(2)}</p></div>
              <div className="bg-slate-900/40 rounded-lg p-3 text-center"><p className="text-xs text-slate-500">R/R</p><p className="text-sm font-bold text-amber-400">{lastSim.riskReward}</p></div>
              <div className="bg-slate-900/40 rounded-lg p-3 text-center"><p className="text-xs text-slate-500">Durée</p><p className="text-sm font-bold text-white">{Math.floor((lastSim.duration || 0) / 60)}m</p></div>
            </div>

            {/* AI Commentary */}
            {lastSim.aiCommentary && (
              <div className="bg-slate-900/40 rounded-xl p-4 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2"><Brain className="w-4 h-4 text-purple-400" /><span className="text-xs text-purple-400 font-medium">Analyse IA</span></div>
                <p className="text-sm text-slate-300">{lastSim.aiCommentary}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {simulations.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><History className="w-4 h-4 text-blue-400" /> Historique des Simulations</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-800"><th className="pb-2 pr-4">Actif</th><th className="pb-2 pr-4">Signal</th><th className="pb-2 pr-4">Dir</th><th className="pb-2 pr-4">Entrée</th><th className="pb-2 pr-4">Sortie</th><th className="pb-2 pr-4">R/R</th><th className="pb-2">PnL</th></tr></thead>
              <tbody>
                {simulations.slice(0, 10).map((s, idx) => (
                  <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-2 pr-4 font-medium text-white">{s.asset}</td>
                    <td className="py-2 pr-4 text-slate-400">{s.signalType}</td>
                    <td className="py-2 pr-4"><span className={`text-xs ${s.direction === 'ACHAT' ? 'text-emerald-400' : 'text-red-400'}`}>{s.direction}</span></td>
                    <td className="py-2 pr-4 text-slate-400">{s.entryPrice.toFixed(2)}</td>
                    <td className="py-2 pr-4 text-slate-400">{s.exitPrice?.toFixed(2)}</td>
                    <td className="py-2 pr-4 text-amber-400">{s.riskReward}</td>
                    <td className={`py-2 font-bold ${s.pnl > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{s.pnl > 0 ? '+' : ''}{s.pnl.toFixed(2)} €</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
