import { useState } from 'react';
import { motion } from 'framer-motion';
import { useCandles } from '@/hooks/useMarketData';
import { calculateRSI, calculateMACD, calculateEMA } from '@/services/marketApi';
import { FlaskConical, Play, RotateCcw, TrendingUp, TrendingDown, Percent, Target, Wifi } from 'lucide-react';
import { LaboStrategiesGuide } from '@/components/FeatureGuide';

interface BacktestResult {
  strategy: string;
  period: string;
  winRate: number;
  profitFactor: number;
  totalReturn: number;
  maxDrawdown: number;
  totalTrades: number;
  profitableTrades: number;
  avgWin: number;
  avgLoss: number;
}

const STRATEGIES = [
  { name: 'RSI Reversal', desc: 'Achat en survente RSI < 30, vente en surachat RSI > 70' },
  { name: 'MACD Momentum', desc: 'Suivi du momentum via croisements MACD' },
  { name: 'EMA Cross', desc: 'Croisement EMA 20/50 comme signal d\'entrée' },
  { name: 'Bollinger Breakout', desc: 'Breakout des bandes de Bollinger' },
  { name: 'Trend Following', desc: 'Suivi de tendance via EMA 50' },
];


function runBacktestOnRealData(
  strategy: string,
  candles: { close: number; high: number; low: number }[],
): BacktestResult | null {
  if (candles.length < 50) return null;

  const closes = candles.map(c => c.close);
  let trades: { profit: number; type: 'win' | 'loss' }[] = [];

  if (strategy === 'RSI Reversal') {
    for (let i = 20; i < candles.length - 1; i++) {
      const rsiWindow = closes.slice(i - 14, i);
      const rsi = calculateRSI(rsiWindow, 14);
      if (rsi < 30) {
        // Buy signal - check if price goes up in next 5 candles
        const entry = closes[i];
        const exit = closes[Math.min(i + 5, candles.length - 1)];
        trades.push({ profit: exit - entry, type: exit > entry ? 'win' : 'loss' });
      } else if (rsi > 70) {
        // Sell signal
        const entry = closes[i];
        const exit = closes[Math.min(i + 5, candles.length - 1)];
        trades.push({ profit: entry - exit, type: entry > exit ? 'win' : 'loss' });
      }
    }
  } else if (strategy === 'EMA Cross') {
    const ema20 = calculateEMA(closes, 20);
    const ema50 = calculateEMA(closes, 50);
    for (let i = 50; i < candles.length - 1; i++) {
      if (ema20[i - 1] <= ema50[i - 1] && ema20[i] > ema50[i]) {
        const entry = closes[i];
        const exit = closes[Math.min(i + 10, candles.length - 1)];
        trades.push({ profit: exit - entry, type: exit > entry ? 'win' : 'loss' });
      } else if (ema20[i - 1] >= ema50[i - 1] && ema20[i] < ema50[i]) {
        const entry = closes[i];
        const exit = closes[Math.min(i + 10, candles.length - 1)];
        trades.push({ profit: entry - exit, type: entry > exit ? 'win' : 'loss' });
      }
    }
  } else if (strategy === 'MACD Momentum') {
    const macd = calculateMACD(closes);
    const macdLine = macd.macd;
    const signalLine = macd.signal;
    for (let i = 35; i < candles.length - 1; i++) {
      if (macdLine[i - 1] <= signalLine[i - 1] && macdLine[i] > signalLine[i]) {
        const entry = closes[i];
        const exit = closes[Math.min(i + 8, candles.length - 1)];
        trades.push({ profit: exit - entry, type: exit > entry ? 'win' : 'loss' });
      } else if (macdLine[i - 1] >= signalLine[i - 1] && macdLine[i] < signalLine[i]) {
        const entry = closes[i];
        const exit = closes[Math.min(i + 8, candles.length - 1)];
        trades.push({ profit: entry - exit, type: entry > exit ? 'win' : 'loss' });
      }
    }
  } else {
    // Trend Following - simplified
    const ema50 = calculateEMA(closes, 50);
    for (let i = 50; i < candles.length - 1; i += 5) {
      if (closes[i] > ema50[i]) {
        const entry = closes[i];
        const exit = closes[Math.min(i + 10, candles.length - 1)];
        trades.push({ profit: exit - entry, type: exit > entry ? 'win' : 'loss' });
      } else {
        const entry = closes[i];
        const exit = closes[Math.min(i + 10, candles.length - 1)];
        trades.push({ profit: entry - exit, type: entry > exit ? 'win' : 'loss' });
      }
    }
  }

  if (trades.length === 0) return null;

  const wins = trades.filter(t => t.type === 'win');
  const losses = trades.filter(t => t.type === 'loss');
  const totalProfit = trades.reduce((s, t) => s + t.profit, 0);
  const avgWinVal = wins.length > 0 ? wins.reduce((s, t) => s + t.profit, 0) / wins.length : 0;
  const avgLossVal = losses.length > 0 ? losses.reduce((s, t) => s + t.profit, 0) / losses.length : 0;

  // Calculate max drawdown
  let peak = 0;
  let maxDrawdown = 0;
  let cumulative = 0;
  for (const t of trades) {
    cumulative += t.profit;
    if (cumulative > peak) peak = cumulative;
    const dd = peak - cumulative;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  const firstPrice = closes[0];
  const totalReturn = (totalProfit / firstPrice) * 100;

  return {
    strategy,
    period: `${candles.length} périodes`,
    winRate: (wins.length / trades.length) * 100,
    profitFactor: Math.abs(avgLossVal) > 0 ? Math.abs(avgWinVal / avgLossVal) : avgWinVal,
    totalReturn,
    maxDrawdown: -(maxDrawdown / firstPrice) * 100,
    totalTrades: trades.length,
    profitableTrades: wins.length,
    avgWin: Math.abs(avgWinVal),
    avgLoss: -Math.abs(avgLossVal),
  };
}

const ASSETS = ['BTC/USD', 'ETH/USD', 'XAU/USD', 'EUR/USD'] as const;

export default function StrategyLab() {
  const [selectedStrategy, setSelectedStrategy] = useState(STRATEGIES[0]);
  const [selectedAsset, setSelectedAsset] = useState<string>(ASSETS[0]);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [running, setRunning] = useState(false);

  const { candles } = useCandles(selectedAsset as any, '1h');

  const handleRunBacktest = () => {
    setRunning(true);
    setResult(null);
    // Small delay for UX
    setTimeout(() => {
      const res = runBacktestOnRealData(selectedStrategy.name, candles);
      setResult(res);
      setRunning(false);
    }, 800);
  };

  return (
    <div className="p-6 space-y-6">
      <LaboStrategiesGuide />
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
          <FlaskConical className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Laboratoire de Stratégies</h1>
          <p className="text-xs text-slate-400">Backtesting sur données réelles temps réel</p>
        </div>
        <span className="ml-auto flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400">
          <Wifi className="w-3 h-3" /> Données Live
        </span>
        <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/20">EXPERT</span>
      </motion.div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Configurer le Test</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs text-slate-500 mb-2 block">Stratégie</label>
            <select value={selectedStrategy.name} onChange={(e) => {
              const s = STRATEGIES.find(st => st.name === e.target.value);
              if (s) setSelectedStrategy(s);
            }}
              className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50">
              {STRATEGIES.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
            <p className="text-xs text-slate-600 mt-1">{selectedStrategy.desc}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-2 block">Actif</label>
            <select value={selectedAsset} onChange={(e) => setSelectedAsset(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50">
              {ASSETS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <p className="text-xs text-slate-600 mt-1">{candles.length} périodes chargées</p>
          </div>
          <div className="flex items-end">
            <button onClick={handleRunBacktest} disabled={running || candles.length < 50}
              className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${running || candles.length < 50 ? 'bg-slate-700 text-slate-500' : 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white hover:shadow-lg hover:shadow-indigo-500/20'}`}>
              {running ? <><RotateCcw className="w-4 h-4 animate-spin" /> Analyse en cours...</> : candles.length < 50 ? <><p>Chargement données...</p></> : <><Play className="w-4 h-4" /> Lancer le Backtest</>}
            </button>
          </div>
        </div>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 text-center">
              <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-emerald-400">{result.totalReturn >= 0 ? '+' : ''}{result.totalReturn.toFixed(1)}%</p>
              <p className="text-xs text-slate-500">Rendement total</p>
            </div>
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 text-center">
              <Percent className="w-5 h-5 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-400">{result.winRate.toFixed(1)}%</p>
              <p className="text-xs text-slate-500">Win Rate</p>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 text-center">
              <Target className="w-5 h-5 text-amber-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-400">{result.profitFactor.toFixed(2)}</p>
              <p className="text-xs text-slate-500">Profit Factor</p>
            </div>
            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 text-center">
              <TrendingDown className="w-5 h-5 text-red-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-400">{result.maxDrawdown.toFixed(1)}%</p>
              <p className="text-xs text-slate-500">Drawdown max</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Détail des Trades ({result.period})</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xl font-bold text-white">{result.totalTrades}</p>
                <p className="text-xs text-slate-500">Trades totaux</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-emerald-400">{result.profitableTrades}</p>
                <p className="text-xs text-slate-500">Trades gagnants</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-emerald-400">+{result.avgWin.toFixed(2)} pts</p>
                <p className="text-xs text-slate-500">Gain moyen</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-red-400">{result.avgLoss.toFixed(2)} pts</p>
                <p className="text-xs text-slate-500">Perte moyenne</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
