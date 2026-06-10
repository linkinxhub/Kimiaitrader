/**
 * AILiveAnalysisPanel — Panneau d'analyse IA en temps réel
 * Utilise OpenAI + Gemini via tRPC pour analyser les prix live
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, TrendingUp, TrendingDown, Minus, ShieldAlert, AlertTriangle, ShieldCheck, Loader2, Zap, Cpu } from 'lucide-react';
import { useAIAnalysis, useAIProviders, type AIAnalysis } from '@/hooks/useAIAnalysis';

interface AILiveAnalysisPanelProps {
  symbol: string;
  price: number;
  change24hPercent?: number;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
}

export function AILiveAnalysisPanel({
  symbol,
  price,
  change24hPercent = 0,
  high24h,
  low24h,
  volume24h,
}: AILiveAnalysisPanelProps) {
  const { analysis, loading, error, analyze, analyzeWithOpenAI, analyzeWithGemini, reset } = useAIAnalysis();
  const { data: providers } = useAIProviders();
  const [selectedModel, setSelectedModel] = useState<'both' | 'openai' | 'gemini'>('both');
  const [lastAnalyzed, setLastAnalyzed] = useState<string | null>(null);

  // Track if component has mounted
  const hasMounted = useRef(false);

  const runAnalysis = useCallback(async () => {
    if (loading || price <= 0) return;

    const data = {
      symbol,
      price,
      change24hPercent,
      high24h,
      low24h,
      volume24h,
    };

    let result: AIAnalysis | null = null;
    if (selectedModel === 'openai') {
      result = await analyzeWithOpenAI(data);
    } else if (selectedModel === 'gemini') {
      result = await analyzeWithGemini(data);
    } else {
      result = await analyze(data);
    }

    if (result) {
      setLastAnalyzed(new Date().toLocaleTimeString('fr-FR'));
    }
  }, [symbol, price, change24hPercent, high24h, low24h, volume24h, selectedModel, loading, analyze, analyzeWithOpenAI, analyzeWithGemini]);

  // Auto-analyze on mount
  useEffect(() => {
    if (price > 0 && !analysis && !loading && !hasMounted.current) {
      hasMounted.current = true;
      runAnalysis();
    }
  }, [price, analysis, loading, runAnalysis]);

  // Cleanup on unmount
  useEffect(() => {
    return () => reset();
  }, [reset]);

  const sentimentConfig = {
    bullish: {
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      label: 'Haussier',
    },
    bearish: {
      icon: <TrendingDown className="w-5 h-5" />,
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
      label: 'Baissier',
    },
    neutral: {
      icon: <Minus className="w-5 h-5" />,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      label: 'Neutre',
    },
  };

  const riskConfig = {
    low: { icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />, label: 'Risque Faible', color: 'text-emerald-400' },
    medium: { icon: <AlertTriangle className="w-4 h-4 text-amber-400" />, label: 'Risque Modéré', color: 'text-amber-400' },
    high: { icon: <ShieldAlert className="w-4 h-4 text-red-400" />, label: 'Risque Élevé', color: 'text-red-400' },
  };

  const currentSentiment = analysis ? sentimentConfig[analysis.sentiment] : null;
  const currentRisk = analysis ? riskConfig[analysis.riskLevel] : null;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-bold text-white">Analyse IA Live</h3>
          {analysis?.model && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-400">
              {analysis.model === 'openai' ? <Cpu className="w-2.5 h-2.5" /> : <Zap className="w-2.5 h-2.5" />}
              {analysis.model === 'openai' ? 'GPT-4o' : 'Gemini'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastAnalyzed && (
            <span className="text-[10px] text-slate-500">{lastAnalyzed}</span>
          )}
          {loading && <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />}
        </div>
      </div>

      {/* Model Selector */}
      <div className="flex gap-1 mb-4 p-1 bg-slate-800/50 rounded-lg">
        {(['both', 'openai', 'gemini'] as const).map((model) => (
          <button
            key={model}
            onClick={() => setSelectedModel(model)}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-medium transition-all ${
              selectedModel === model
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'text-slate-500 hover:text-slate-300'
            } disabled:opacity-50`}
          >
            {model === 'both' && <Brain className="w-3 h-3" />}
            {model === 'openai' && <Cpu className="w-3 h-3" />}
            {model === 'gemini' && <Zap className="w-3 h-3" />}
            {model === 'both' ? 'Auto (Meilleur)' : model === 'openai' ? 'GPT-4o' : 'Gemini'}
          </button>
        ))}
      </div>

      {/* AI Providers Status */}
      {providers && (
        <div className="flex gap-2 mb-3">
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${providers.openai ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
            <Cpu className="w-2.5 h-2.5" /> OpenAI {providers.openai ? 'OK' : 'N/A'}
          </span>
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${providers.gemini ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
            <Zap className="w-2.5 h-2.5" /> Gemini {providers.gemini ? 'OK' : 'N/A'}
          </span>
        </div>
      )}

      {/* Analysis Result */}
      <AnimatePresence mode="wait">
        {error && !analysis && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
          >
            <p className="text-xs text-red-400">{error}</p>
            <button
              onClick={runAnalysis}
              className="mt-2 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition-all"
            >
              Réessayer
            </button>
          </motion.div>
        )}

        {analysis && currentSentiment && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Sentiment */}
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${currentSentiment.bg}`}>
              <div className={currentSentiment.color}>{currentSentiment.icon}</div>
              <div>
                <p className={`text-sm font-bold ${currentSentiment.color}`}>{currentSentiment.label}</p>
                <p className="text-[10px] text-slate-500">Confiance: {analysis.confidence}%</p>
              </div>
              <div className="ml-auto">
                <div className="h-2 w-20 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis.confidence}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      analysis.sentiment === 'bullish'
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                        : analysis.sentiment === 'bearish'
                        ? 'bg-gradient-to-r from-red-500 to-red-400'
                        : 'bg-gradient-to-r from-amber-500 to-amber-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="p-3 bg-slate-800/40 rounded-xl">
              <p className="text-xs text-slate-300 leading-relaxed">{analysis.summary}</p>
            </div>

            {/* Key Levels */}
            {(analysis.keyLevels.support > 0 || analysis.keyLevels.resistance > 0) && (
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-center">
                  <p className="text-[10px] text-slate-500 mb-0.5">Support</p>
                  <p className="text-sm font-bold text-emerald-400">
                    {analysis.keyLevels.support.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-2.5 bg-red-500/5 border border-red-500/10 rounded-lg text-center">
                  <p className="text-[10px] text-slate-500 mb-0.5">Résistance</p>
                  <p className="text-sm font-bold text-red-400">
                    {analysis.keyLevels.resistance.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            )}

            {/* Risk & Recommendation */}
            <div className="space-y-2">
              {currentRisk && (
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/40 rounded-lg">
                  {currentRisk.icon}
                  <span className={`text-xs font-medium ${currentRisk.color}`}>{currentRisk.label}</span>
                </div>
              )}
              <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                <p className="text-[10px] text-blue-400 font-medium mb-1">Recommandation IA</p>
                <p className="text-xs text-slate-300">{analysis.recommendation}</p>
              </div>
            </div>
          </motion.div>
        )}

        {!analysis && !error && !loading && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-4"
          >
            <Brain className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500 mb-3">Cliquez pour analyser {symbol}</p>
            <button
              onClick={runAnalysis}
              className="px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400 hover:bg-purple-500/20 transition-all flex items-center gap-2 mx-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Analyser avec IA
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Refresh Button */}
      {analysis && (
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="w-full mt-3 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-400 hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-purple-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {loading ? 'Analyse en cours...' : 'Rafraîchir l\'analyse'}
        </button>
      )}
    </div>
  );
}
