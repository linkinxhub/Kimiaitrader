import type { AISignal, AssetQuote, AuthUser, SignalDirection, SignalIndicators } from "@/types";
import { clamp, createId } from "@/lib/utils";
import { recordSignalGenerated } from "@/services/packAnalyticsService";

function buildIndicators(quote: AssetQuote): SignalIndicators {
  const magnitude = Math.abs(quote.change24h);
  return {
    rsi: clamp(50 + quote.change24h * 7, 22, 78),
    macd: Number((quote.change24h / 3).toFixed(2)),
    emaFast: Number((quote.price * (1 + quote.change24h / 500)).toFixed(4)),
    emaSlow: Number((quote.price * (1 - quote.change24h / 800)).toFixed(4)),
    atr: Number((quote.price * (magnitude / 100) * 0.6).toFixed(4)),
  };
}

function chooseDirection(indicators: SignalIndicators): SignalDirection {
  if (indicators.rsi > 56 && indicators.macd > 0) {
    return "ACHAT";
  }
  if (indicators.rsi < 46 && indicators.macd < 0) {
    return "VENTE";
  }
  return "ATTENTE";
}

function getRiskLevel(confidence: number): AISignal["riskLevel"] {
  if (confidence >= 75) return "Faible";
  if (confidence >= 60) return "Moyen";
  return "Elevé";
}

export function generateSignalFromQuote(quote: AssetQuote): AISignal {
  const indicators = buildIndicators(quote);
  const direction = chooseDirection(indicators);
  const atr = indicators.atr || quote.price * 0.004;
  const confidence = clamp(58 + Math.abs(quote.change24h) * 7, 55, 87);
  const sign = direction === "VENTE" ? -1 : 1;
  const entryPoint = quote.price;
  const stopLoss = Number((entryPoint - sign * atr * 1.25).toFixed(4));
  const takeProfits: [number, number, number] = [
    Number((entryPoint + sign * atr * 1.1).toFixed(4)),
    Number((entryPoint + sign * atr * 1.8).toFixed(4)),
    Number((entryPoint + sign * atr * 2.7).toFixed(4)),
  ];

  return {
    id: createId("sig"),
    asset: quote.label,
    market: quote.market,
    direction,
    confidence,
    entryPoint,
    stopLoss,
    takeProfits,
    riskRewardRatio: Number(((Math.abs(takeProfits[2] - entryPoint) || 0.1) / Math.abs(entryPoint - stopLoss)).toFixed(2)),
    riskLevel: getRiskLevel(confidence),
    source: quote.source,
    timeframe: quote.market === "crypto" ? "M30" : quote.market === "metal" ? "H1" : "H4",
    generatedAt: new Date().toISOString(),
    indicators,
    explanation: [
      `RSI à ${indicators.rsi.toFixed(1)}, lecture ${indicators.rsi >= 50 ? "favorable à la hausse" : "plutôt vendeuse"}.`,
      `MACD à ${indicators.macd.toFixed(2)}, momentum ${indicators.macd >= 0 ? "positif" : "négatif"}.`,
      `EMA rapide ${indicators.emaFast > indicators.emaSlow ? "au-dessus" : "en dessous"} de l'EMA lente, biais ${direction.toLowerCase()}.`,
      `ATR à ${indicators.atr.toFixed(4)}, volatilité ${indicators.atr > quote.price * 0.01 ? "élevée" : "maîtrisable"} pour ce setup.`,
    ],
  };
}

export function generateSignals(quotes: AssetQuote[], user: AuthUser | null) {
  return quotes.slice(0, 6).map((quote) => {
    const signal = generateSignalFromQuote(quote);
    if (user) {
      recordSignalGenerated({
        signalId: signal.id,
        pack: user.pack,
        asset: signal.asset,
        direction: signal.direction,
        confidence: signal.confidence,
        createdAt: signal.generatedAt,
      });
    }
    return signal;
  });
}
