import { motion } from 'framer-motion';
import { MarketTicker } from '@/components/MarketTicker';
import { SignalCard } from '@/components/SignalCard';
import { TimeFrameMatrix } from '@/components/TimeFrameMatrix';
import { PriceChart } from '@/components/PriceChart';
import { TechnicalPanel } from '@/components/TechnicalPanel';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { AILiveAnalysisPanel } from '@/components/AILiveAnalysisPanel';
import { RiskManager } from '@/components/RiskManager';
import { DashboardGuide } from '@/components/FeatureGuide';
import { useDashboardData } from '@/hooks/useAISignals';
import { useCandles } from '@/hooks/useMarketData';
import { calculateRSI, calculateMACD } from '@/services/marketApi';
import { Diamond, Activity, TrendingUp, Clock, Shield, Wifi, WifiOff, RefreshCw, Radio, Layers, Target, ArrowRight, Star, Ban, Eye } from 'lucide-react';
import { useWebSocketPrices } from '@/services/websocketService';
import { useNavigate } from 'react-router';
import SignalComparison from '@/components/SignalComparison';
import { publishPrices, publishWsPrices, publishWsStatus, publishSignals } from '@/hooks/useLiveAlerts';
import { useEffect } from 'react';
import { useAlertNavigation } from '@/hooks/useAlertNavigation';
import { calculateGrade, detectNoTradeZone, analyzeRiskBeforeProfit, generateDayDecision } from '@/services/profitabilityEngine';

export default function Dashboard() {
  const navigate = useNavigate();
  useAlertNavigation(); // Consumes alert context and scrolls to highlighted asset

  // All data connected to real-time APIs + AI Engine
  const {
    prices,
    signals,
    topSignal,
    xauSignal,
    marketOverview,
    aiInsights,
    loading,
    lastUpdate,
  } = useDashboardData();

  // Real candles for charts
  const { candles: btcCandles, loading: btcLoading } = useCandles('BTC/USD', '1h');
  const { candles: ethCandles, loading: ethLoading } = useCandles('ETH/USD', '1h');

  // Binance WebSocket - ultra-low latency prices
  const { prices: wsPrices, status: wsStatus, latency } = useWebSocketPrices(['BTC/USD', 'ETH/USD', 'SOL/USD', 'BNB/USD']);

  // Live prices
  const xauPrice = prices['XAU/USD']?.price || 0;
  const xauChange = prices['XAU/USD']?.change24hPercent || 0;
  const btcPrice = prices['BTC/USD']?.price || 0;
  const btcChange = prices['BTC/USD']?.change24hPercent || 0;
  const eurPrice = prices['EUR/USD']?.price || 0;

  // RSI calculations on real data
  const btcCloses = btcCandles.map(c => c.close);
  const btcRSI = btcCloses.length > 14 ? calculateRSI(btcCloses) : 50;
  const ethCloses = ethCandles.map(c => c.close);
  const ethRSI = ethCloses.length > 14 ? calculateRSI(ethCloses) : 50;

  // MACD on real data
  const btcMACD = btcCloses.length > 26 ? calculateMACD(btcCloses) : null;
  const ethMACD = ethCloses.length > 26 ? calculateMACD(ethCloses) : null;

  // Dynamic technical indicators from top signal
  const dynamicIndicators = topSignal?.explanations.map(exp => ({
    name: exp.indicator,
    value: exp.value,
    signal: exp.interpretation,
    status: (exp.indicator.includes('RSI') && parseFloat(exp.value) < 45) || exp.value.includes('haussier') || exp.value.includes('Au-dessus')
      ? 'bullish' as const
      : (exp.indicator.includes('RSI') && parseFloat(exp.value) > 55) || exp.value.includes('baissier') || exp.value.includes('En-dessous')
      ? 'bearish' as const
      : 'neutral' as const,
  })) || [];

  // Publish live data to the global alert system
  useEffect(() => {
    publishPrices(prices);
  }, [prices]);

  useEffect(() => {
    publishWsPrices(wsPrices);
  }, [wsPrices]);

  useEffect(() => {
    publishWsStatus(wsStatus);
  }, [wsStatus]);

  useEffect(() => {
    publishSignals(signals);
  }, [signals]);

  // Chart data formatted for PriceChart
  const btcChartData = btcCandles.map(c => ({
    timestamp: c.time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
  }));

  const ethChartData = ethCandles.map(c => ({
    timestamp: c.time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
  }));

  // ─── Profitability Decision Engine ────────────────────
  const enrichedSignals = signals.map(sig => {
    const grade = calculateGrade(sig, 0, 0);
    const noTrade = detectNoTradeZone(sig);
    return { ...sig, grade, noTrade };
  });
  const gradeMap = new Map(enrichedSignals.map(e => [e.id, e.grade]));
  const noTradeMap = new Map(enrichedSignals.map(e => [e.id, e.noTrade]));
  const dayDecision = generateDayDecision(signals, gradeMap, noTradeMap);
  const aPlusSignals = enrichedSignals.filter(e => e.grade.grade === 'A+' || e.grade.grade === 'A').slice(0, 3);

  // Timeframe analysis from XAU signal or fallback
  const timeFrameAnalysis = (xauSignal?.timeFrameAnalysis || topSignal?.timeFrameAnalysis || []) as any[];

  // Economic events — dynamically generated from signals
  const dynamicEvents = signals.slice(0, 4).map((sig, idx) => ({
    id: `evt-live-${idx}`,
    time: sig.timestamp,
    currency: sig.asset.split('/')[0] || 'USD',
    event: `Signal IA ${sig.asset} — ${sig.signal}`,
    impact: sig.confidence >= 80 ? 'High' as const : sig.confidence >= 60 ? 'Medium' as const : 'Low' as const,
    forecast: `${sig.confidence}% confiance`,
    previous: `${sig.entryPoint.toFixed(2)}`,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Feature Guide */}
      <DashboardGuide />

      {/* API Status Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {loading ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
              <RefreshCw className="w-3 h-3 animate-spin" /> Chargement IA...
            </span>
          ) : signals.length > 0 ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
              <Wifi className="w-3 h-3" /> {signals.length} signaux actifs — {lastUpdate?.toLocaleTimeString('fr-FR')}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              <WifiOff className="w-3 h-3" /> Mode estimation
            </span>
          )}
          {/* WebSocket Status */}
          {wsStatus === 'connected' && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400">
              <Radio className="w-3 h-3 animate-pulse" /> WS Live {latency > 0 && `(${latency}ms)`}
            </span>
          )}
          {wsStatus === 'connecting' && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
              <Radio className="w-3 h-3" /> WS...
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {Object.entries(prices).slice(0, 10).map(([sym, data]) => (
            <span key={sym} className="text-xs text-slate-500">
              {sym}: <span className={data.change24hPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {data.change24hPercent >= 0 ? '+' : ''}{data.change24hPercent.toFixed(2)}%
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ─── DECISION DU JOUR ─────────────────────────── */}
      {signals.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={`rounded-2xl border p-4 ${
            dayDecision.noTradeToday
              ? 'bg-red-500/5 border-red-500/20'
              : dayDecision.bestOpportunity?.grade === 'A+' || dayDecision.bestOpportunity?.grade === 'A'
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : 'bg-amber-500/5 border-amber-500/20'
          }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dayDecision.noTradeToday ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                {dayDecision.noTradeToday ? <Ban className="w-5 h-5 text-red-400" /> : <Target className="w-5 h-5 text-emerald-400" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{dayDecision.headline}</h3>
                <p className="text-xs text-slate-400">{dayDecision.summary.substring(0, 120)}...</p>
                {aPlusSignals.length > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    {aPlusSignals.map(s => (
                      <span key={s.id} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[10px] text-emerald-400 font-medium">
                        <Star className="w-2.5 h-2.5 inline" /> {s.asset} {s.grade.grade}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => navigate('/decision-center')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all flex-shrink-0">
              <Eye className="w-3.5 h-3.5" /> Centre de Decision <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Top Stats Row — REAL DATA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div data-asset="XAU/USD" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Diamond className="w-5 h-5 text-amber-400" />
              <span className="text-sm text-slate-400">XAU/USD</span>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full font-medium ${xauChange >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {xauChange >= 0 ? '+' : ''}{xauChange.toFixed(2)}%
            </span>
          </div>
          <p className="text-2xl font-bold text-white">{xauPrice > 0 ? xauPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '—'}</p>
          <p className="text-xs text-slate-500 mt-1">Source: <span className="text-blue-400">{prices['XAU/USD']?.source || 'API'}</span></p>
        </motion.div>

        <motion.div data-asset="BTC/USD" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-slate-400">BTC/USD</span>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full font-medium ${btcChange >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {btcChange >= 0 ? '+' : ''}{btcChange.toFixed(2)}%
            </span>
          </div>
          <p className="text-2xl font-bold text-white">{btcPrice > 0 ? btcPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '—'}</p>
          <p className="text-xs text-slate-500 mt-1">RSI: <span className={btcRSI > 70 ? 'text-red-400' : btcRSI < 30 ? 'text-emerald-400' : 'text-amber-400'}>{btcRSI.toFixed(1)}</span> | Source: <span className="text-blue-400">{prices['BTC/USD']?.source || '—'}</span></p>
        </motion.div>

        <motion.div data-asset="EUR/USD" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-slate-400">EUR/USD</span>
            </div>
            <span className="px-2 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-400 font-medium">Live</span>
          </div>
          <p className="text-2xl font-bold text-white">{eurPrice > 0 ? eurPrice.toFixed(5) : '—'}</p>
          <p className="text-xs text-slate-500 mt-1">RSI: <span className={ethRSI > 70 ? 'text-red-400' : ethRSI < 30 ? 'text-emerald-400' : 'text-amber-400'}>{ethRSI.toFixed(1)}</span> | Source: <span className="text-blue-400">{prices['EUR/USD']?.source || '—'}</span></p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-slate-400">Meilleur Signal</span>
            </div>
            {topSignal && (
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${topSignal.signal === 'ACHAT' ? 'bg-emerald-500/20 text-emerald-400' : topSignal.signal === 'VENTE' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {topSignal.signal}
              </span>
            )}
          </div>
          {topSignal ? (
            <>
              <p className="text-lg font-bold text-white">{topSignal.asset} @ {topSignal.confidence}%</p>
              <p className="text-xs text-slate-500 mt-1">R/R {topSignal.riskRewardRatio} — Risque {topSignal.riskLevel}</p>
            </>
          ) : (
            <p className="text-sm text-slate-500">Analyse en cours...</p>
          )}
        </motion.div>
      </div>

      {/* Market Ticker — DYNAMIC from real prices */}
      {marketOverview.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <MarketTicker markets={marketOverview} />
        </motion.div>
      )}

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Dynamic Signal Card */}
          {topSignal ? (
            <SignalCard signal={{
              id: topSignal.id,
              asset: topSignal.asset,
              assetType: topSignal.asset as any,
              signal: topSignal.signal,
              confidence: topSignal.confidence,
              riskLevel: topSignal.riskLevel,
              signalQuality: topSignal.confidence >= 80 ? 'Excellent' : topSignal.confidence >= 60 ? 'Bon' : 'Moyen',
              entryPoint: topSignal.entryPoint,
              stopLoss: topSignal.stopLoss,
              takeProfit1: topSignal.takeProfit1,
              takeProfit2: topSignal.takeProfit2,
              takeProfit3: topSignal.takeProfit3,
              riskRewardRatio: topSignal.riskRewardRatio,
              timestamp: topSignal.timestamp,
              explanations: topSignal.explanations,
              timeFrameAnalysis: timeFrameAnalysis,
              aiScore: topSignal.aiScore,
              marketSentiment: topSignal.marketSentiment,
              volatility: topSignal.volatility,
            }} />
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-400">Génération des signaux IA en cours...</p>
            </div>
          )}

          {/* REAL CHARTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {btcCandles.length > 0 && !btcLoading ? (
              <PriceChart data={btcChartData} title={`BTC/USD — H1 (Live)`} height={320} />
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex items-center justify-center h-[320px]">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-slate-400">Chargement données BTC...</p>
                </div>
              </div>
            )}
            {ethCandles.length > 0 && !ethLoading ? (
              <PriceChart data={ethChartData} title={`ETH/USD — H1 (Live)`} height={320} />
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex items-center justify-center h-[320px]">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-slate-400">Chargement données ETH...</p>
                </div>
              </div>
            )}
          </div>

          {/* Real Indicator Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500">BTC RSI (14)</p>
              <p className={`text-lg font-bold ${btcRSI > 70 ? 'text-red-400' : btcRSI < 30 ? 'text-emerald-400' : 'text-amber-400'}`}>{btcRSI.toFixed(1)}</p>
            </div>
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500">BTC MACD</p>
              <p className={`text-lg font-bold ${btcMACD && btcMACD.histogram[btcMACD.histogram.length - 1] > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {btcMACD ? (btcMACD.histogram[btcMACD.histogram.length - 1] > 0 ? 'Haussier' : 'Baissier') : 'N/A'}
              </p>
            </div>
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500">ETH RSI (14)</p>
              <p className={`text-lg font-bold ${ethRSI > 70 ? 'text-red-400' : ethRSI < 30 ? 'text-emerald-400' : 'text-amber-400'}`}>{ethRSI.toFixed(1)}</p>
            </div>
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500">ETH MACD</p>
              <p className={`text-lg font-bold ${ethMACD && ethMACD.histogram[ethMACD.histogram.length - 1] > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {ethMACD ? (ethMACD.histogram[ethMACD.histogram.length - 1] > 0 ? 'Haussier' : 'Baissier') : 'N/A'}
              </p>
            </div>
          </div>

          {timeFrameAnalysis.length > 0 && (
            <TimeFrameMatrix analyses={timeFrameAnalysis} />
          )}
        </div>

        <div className="space-y-6">
          {/* Dynamic Risk Manager */}
          {topSignal && (
            <RiskManager signal={{
              id: topSignal.id,
              asset: topSignal.asset,
              assetType: topSignal.asset as any,
              signal: topSignal.signal,
              confidence: topSignal.confidence,
              riskLevel: topSignal.riskLevel,
              signalQuality: topSignal.confidence >= 80 ? 'Excellent' : topSignal.confidence >= 60 ? 'Bon' : 'Moyen',
              entryPoint: topSignal.entryPoint,
              stopLoss: topSignal.stopLoss,
              takeProfit1: topSignal.takeProfit1,
              takeProfit2: topSignal.takeProfit2,
              takeProfit3: topSignal.takeProfit3,
              riskRewardRatio: topSignal.riskRewardRatio,
              timestamp: topSignal.timestamp,
              explanations: topSignal.explanations,
              timeFrameAnalysis: timeFrameAnalysis,
              aiScore: topSignal.aiScore,
              marketSentiment: topSignal.marketSentiment,
              volatility: topSignal.volatility,
            }} />
          )}

          {/* Dynamic Technical Panel */}
          {dynamicIndicators.length > 0 ? (
            <TechnicalPanel indicators={dynamicIndicators} />
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center">
              <p className="text-sm text-slate-500">Chargement indicateurs...</p>
            </div>
          )}

          {/* AI Live Analysis — OpenAI + Gemini */}
          <AILiveAnalysisPanel
            symbol="XAU/USD"
            price={xauPrice}
            change24hPercent={xauChange}
            high24h={prices['XAU/USD']?.high24h}
            low24h={prices['XAU/USD']?.low24h}
            volume24h={prices['XAU/USD']?.volume24h}
          />

          <AILiveAnalysisPanel
            symbol="BTC/USD"
            price={btcPrice}
            change24hPercent={btcChange}
            high24h={prices['BTC/USD']?.high24h}
            low24h={prices['BTC/USD']?.low24h}
            volume24h={prices['BTC/USD']?.volume24h}
          />

          {/* Dynamic AI Insights */}
          {aiInsights.length > 0 && <AIInsightsPanel insights={aiInsights} />}

          {/* Dynamic Economic Calendar */}
          {dynamicEvents.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                Événements Signaux IA
              </h3>
              <div className="space-y-2">
                {dynamicEvents.map(evt => (
                  <div key={evt.id} className="flex items-center gap-3 p-2 bg-slate-800/40 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${evt.impact === 'High' ? 'bg-red-500' : evt.impact === 'Medium' ? 'bg-amber-500' : 'bg-slate-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{evt.event}</p>
                      <p className="text-xs text-slate-500">{evt.currency} — {evt.forecast}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Performance Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Résumé Performance IA</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-slate-800/40 rounded-xl">
            <p className="text-2xl font-bold text-emerald-400">{signals.length}</p>
            <p className="text-xs text-slate-500">Signaux actifs</p>
          </div>
          <div className="text-center p-4 bg-slate-800/40 rounded-xl">
            <p className="text-2xl font-bold text-emerald-400">
              {signals.filter(s => s.signal === 'ACHAT').length}/{signals.filter(s => s.signal === 'VENTE').length}
            </p>
            <p className="text-xs text-slate-500">Achats / Ventes</p>
          </div>
          <div className="text-center p-4 bg-slate-800/40 rounded-xl">
            <p className="text-2xl font-bold text-blue-400">
              {signals.length > 0 ? (signals.reduce((s, sig) => s + sig.confidence, 0) / signals.length).toFixed(0) : 0}%
            </p>
            <p className="text-xs text-slate-500">Confiance moyenne</p>
          </div>
          <div className="text-center p-4 bg-slate-800/40 rounded-xl">
            <p className="text-2xl font-bold text-amber-400">
              {topSignal?.riskRewardRatio || '—'}
            </p>
            <p className="text-xs text-slate-500">Meilleur R/R</p>
          </div>
        </div>
      </motion.div>

      {/* ─── Signal Comparison ────────────────────────── */}
      {signals.length >= 2 && (
        <SignalComparison signals={signals} title="Comparer les Signaux du Dashboard" />
      )}
    </div>
  );
}
