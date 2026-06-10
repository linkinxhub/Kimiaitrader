/**
 * AI Router - tRPC routes for market analysis with OpenAI and Gemini
 */

import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import {
  analyzeWithOpenAI,
  analyzeWithGemini,
  analyzeWithBoth,
  getAvailableProviders,
  type MarketDataInput,
} from "./ai-service";

export const aiRouter = createRouter({
  /** Get available AI providers status */
  providers: publicQuery.query(() => {
    return getAvailableProviders();
  }),

  /** Analyze single asset with OpenAI */
  analyzeOpenAI: publicQuery
    .input(
      z.object({
        symbol: z.string().min(1),
        price: z.number().positive(),
        change24hPercent: z.number().optional(),
        high24h: z.number().positive().optional(),
        low24h: z.number().positive().optional(),
        volume24h: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const data: MarketDataInput = {
        ...input,
        timestamp: new Date().toISOString(),
      };
      return await analyzeWithOpenAI(data);
    }),

  /** Analyze single asset with Gemini */
  analyzeGemini: publicQuery
    .input(
      z.object({
        symbol: z.string().min(1),
        price: z.number().positive(),
        change24hPercent: z.number().optional(),
        high24h: z.number().positive().optional(),
        low24h: z.number().positive().optional(),
        volume24h: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const data: MarketDataInput = {
        ...input,
        timestamp: new Date().toISOString(),
      };
      return await analyzeWithGemini(data);
    }),

  /** Analyze with both models - returns best result */
  analyzeBoth: publicQuery
    .input(
      z.object({
        symbol: z.string().min(1),
        price: z.number().positive(),
        change24hPercent: z.number().optional(),
        high24h: z.number().positive().optional(),
        low24h: z.number().positive().optional(),
        volume24h: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const data: MarketDataInput = {
        ...input,
        timestamp: new Date().toISOString(),
      };
      return await analyzeWithBoth(data);
    }),

  /** Batch analysis for multiple assets */
  analyzeBatch: publicQuery
    .input(
      z.array(
        z.object({
          symbol: z.string().min(1),
          price: z.number().positive(),
          change24hPercent: z.number().optional(),
          high24h: z.number().positive().optional(),
          low24h: z.number().positive().optional(),
          volume24h: z.number().optional(),
        })
      )
    )
    .mutation(async ({ input }) => {
      const results = await Promise.all(
        input.map(async (item) => {
          try {
            const data: MarketDataInput = {
              ...item,
              timestamp: new Date().toISOString(),
            };
            return await analyzeWithBoth(data);
          } catch (error) {
            return {
              model: "openai" as const,
              symbol: item.symbol,
              sentiment: "neutral" as const,
              confidence: 0,
              summary: `Erreur d'analyse: ${error instanceof Error ? error.message : String(error)}`,
              keyLevels: { support: 0, resistance: 0 },
              recommendation: "Analyse indisponible",
              riskLevel: "medium" as const,
              timestamp: new Date().toISOString(),
            };
          }
        })
      );
      return results;
    }),
});
