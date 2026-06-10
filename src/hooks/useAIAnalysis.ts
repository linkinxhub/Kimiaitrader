/**
 * useAIAnalysis — Hook pour analyser les données de marché via IA
 * Utilise tRPC pour appeler OpenAI et Gemini en toute sécurité
 */

import { useState, useCallback, useRef } from 'react';
import { trpc } from '@/providers/trpc';

export interface AIAnalysis {
  model: "openai" | "gemini";
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  summary: string;
  keyLevels: {
    support: number;
    resistance: number;
  };
  recommendation: string;
  riskLevel: "low" | "medium" | "high";
  timestamp: string;
}

interface AnalysisInput {
  symbol: string;
  price: number;
  change24hPercent?: number;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
}

export function useAIAnalysis() {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const analyzeBothMutation = trpc.ai.analyzeBoth.useMutation();
  const analyzeOpenAIMutation = trpc.ai.analyzeOpenAI.useMutation();
  const analyzeGeminiMutation = trpc.ai.analyzeGemini.useMutation();
  const analyzeBatchMutation = trpc.ai.analyzeBatch.useMutation();

  /** Analyze with both OpenAI and Gemini (returns best result) */
  const analyze = useCallback(async (data: AnalysisInput): Promise<AIAnalysis | null> => {
    abortRef.current = false;
    setLoading(true);
    setError(null);

    try {
      const result = await analyzeBothMutation.mutateAsync(data);
      if (!abortRef.current) {
        setAnalysis(result as AIAnalysis);
      }
      return result as AIAnalysis;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur analyse IA';
      if (!abortRef.current) {
        setError(msg);
      }
      return null;
    } finally {
      if (!abortRef.current) {
        setLoading(false);
      }
    }
  }, [analyzeBothMutation]);

  /** Analyze with OpenAI only */
  const analyzeWithOpenAI = useCallback(async (data: AnalysisInput): Promise<AIAnalysis | null> => {
    abortRef.current = false;
    setLoading(true);
    setError(null);

    try {
      const result = await analyzeOpenAIMutation.mutateAsync(data);
      if (!abortRef.current) {
        setAnalysis(result as AIAnalysis);
      }
      return result as AIAnalysis;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur OpenAI';
      if (!abortRef.current) {
        setError(msg);
      }
      return null;
    } finally {
      if (!abortRef.current) {
        setLoading(false);
      }
    }
  }, [analyzeOpenAIMutation]);

  /** Analyze with Gemini only */
  const analyzeWithGemini = useCallback(async (data: AnalysisInput): Promise<AIAnalysis | null> => {
    abortRef.current = false;
    setLoading(true);
    setError(null);

    try {
      const result = await analyzeGeminiMutation.mutateAsync(data);
      if (!abortRef.current) {
        setAnalysis(result as AIAnalysis);
      }
      return result as AIAnalysis;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur Gemini';
      if (!abortRef.current) {
        setError(msg);
      }
      return null;
    } finally {
      if (!abortRef.current) {
        setLoading(false);
      }
    }
  }, [analyzeGeminiMutation]);

  /** Batch analysis for multiple assets */
  const analyzeBatch = useCallback(async (data: AnalysisInput[]): Promise<AIAnalysis[]> => {
    abortRef.current = false;
    setLoading(true);
    setError(null);

    try {
      const results = await analyzeBatchMutation.mutateAsync(data);
      return results as AIAnalysis[];
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur analyse batch';
      if (!abortRef.current) {
        setError(msg);
      }
      return [];
    } finally {
      if (!abortRef.current) {
        setLoading(false);
      }
    }
  }, [analyzeBatchMutation]);

  /** Reset state */
  const reset = useCallback(() => {
    abortRef.current = true;
    setAnalysis(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    analysis,
    loading,
    error,
    analyze,
    analyzeWithOpenAI,
    analyzeWithGemini,
    analyzeBatch,
    reset,
  };
}

/** Hook to check which AI providers are available */
export function useAIProviders() {
  return trpc.ai.providers.useQuery();
}
