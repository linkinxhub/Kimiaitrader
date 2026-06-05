import type { AISignal, AuthUser } from "@/types";
import { createId } from "@/lib/utils";

export const DEMO_SIGNALS: AISignal[] = [
  {
    id: createId("sig"),
    asset: "XAU/USD",
    market: "metal",
    direction: "ACHAT",
    confidence: 78,
    entryPoint: 2358.5,
    stopLoss: 2346.2,
    takeProfits: [2368.1, 2374.4, 2382.6],
    riskRewardRatio: 2.6,
    riskLevel: "Moyen",
    source: "Mode-Demo",
    timeframe: "H1",
    generatedAt: "2026-06-05T07:30:00.000Z",
    indicators: { rsi: 58, macd: 1.21, emaFast: 2352.4, emaSlow: 2346.8, atr: 8.5 },
    explanation: [
      "RSI au-dessus de 50, momentum haussier encore sain.",
      "MACD positif, l'impulsion reste constructive.",
      "EMA rapide au-dessus de l'EMA lente, biais directionnel haussier.",
      "ATR modéré, volatilité gérable pour un setup swing court.",
    ],
  },
  {
    id: createId("sig"),
    asset: "BTC/USD",
    market: "crypto",
    direction: "ATTENTE",
    confidence: 65,
    entryPoint: 68320,
    stopLoss: 67110,
    takeProfits: [69100, 69850, 70740],
    riskRewardRatio: 1.9,
    riskLevel: "Elevé",
    source: "Mode-Demo",
    timeframe: "M30",
    generatedAt: "2026-06-05T07:35:00.000Z",
    indicators: { rsi: 49, macd: 0.42, emaFast: 68210, emaSlow: 68180, atr: 1250 },
    explanation: [
      "RSI proche de 50, marché en équilibre et sans avantage clair.",
      "MACD légèrement positif, mais la pente reste prudente.",
      "EMAs presque plates, ce qui suggère une consolidation.",
      "ATR élevé, mieux vaut attendre la cassure confirmée.",
    ],
  },
  {
    id: createId("sig"),
    asset: "EUR/USD",
    market: "forex",
    direction: "VENTE",
    confidence: 72,
    entryPoint: 1.0874,
    stopLoss: 1.0912,
    takeProfits: [1.0849, 1.0824, 1.0798],
    riskRewardRatio: 2.3,
    riskLevel: "Faible",
    source: "Mode-Demo",
    timeframe: "H4",
    generatedAt: "2026-06-05T07:42:00.000Z",
    indicators: { rsi: 43, macd: -0.26, emaFast: 1.0869, emaSlow: 1.0882, atr: 0.0041 },
    explanation: [
      "RSI sous 50, pression vendeuse toujours présente.",
      "MACD négatif, l'élan baissier continue de dominer.",
      "EMA rapide sous l'EMA lente, structure de tendance vendeuse.",
      "ATR contenu, ce qui rend la gestion du risque plus précise.",
    ],
  },
];

export function isDemoMode(user: AuthUser | null) {
  return !!user && user.pack === "free" && user.role !== "admin";
}

export function mapDemoSignals() {
  return DEMO_SIGNALS.map((signal) => ({ ...signal, source: "Mode-Demo" }));
}
