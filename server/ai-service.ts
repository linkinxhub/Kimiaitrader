/**
 * AI Market Analysis Service
 * Integrates OpenAI GPT-4o and Google Gemini for market data analysis
 */

import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

export interface MarketDataInput {
  symbol: string;
  price: number;
  change24hPercent?: number;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
  timestamp: string;
}

export interface AIAnalysisResult {
  model: "openai" | "gemini";
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number; // 0-100
  summary: string;
  keyLevels: {
    support: number;
    resistance: number;
  };
  recommendation: string;
  riskLevel: "low" | "medium" | "high";
  timestamp: string;
}

function buildPrompt(data: MarketDataInput): string {
  return `Analyze the following market data and provide a trading insight:

Symbol: ${data.symbol}
Current Price: ${data.price.toLocaleString()}
24h Change: ${data.change24hPercent?.toFixed(2) ?? "N/A"}%
24h High: ${data.high24h?.toLocaleString() ?? "N/A"}
24h Low: ${data.low24h?.toLocaleString() ?? "N/A"}
24h Volume: ${data.volume24h?.toLocaleString() ?? "N/A"}
Timestamp: ${data.timestamp}

Provide your analysis in the following JSON format:
{
  "sentiment": "bullish|bearish|neutral",
  "confidence": 0-100,
  "summary": "brief analysis text in French",
  "keyLevels": {
    "support": number,
    "resistance": number
  },
  "recommendation": "concise trading recommendation in French",
  "riskLevel": "low|medium|high"
}`;
}

function parseAIResponse(content: string, model: "openai" | "gemini"): AIAnalysisResult {
  try {
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        model,
        sentiment: parsed.sentiment || "neutral",
        confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
        summary: parsed.summary || "Analyse non disponible",
        keyLevels: {
          support: parsed.keyLevels?.support || 0,
          resistance: parsed.keyLevels?.resistance || 0,
        },
        recommendation: parsed.recommendation || "Aucune recommandation",
        riskLevel: parsed.riskLevel || "medium",
        timestamp: new Date().toISOString(),
      };
    }
  } catch {
    // Fall through to default
  }

  return {
    model,
    sentiment: "neutral",
    confidence: 0,
    summary: content.slice(0, 500) || "Réponse brute de l'IA",
    keyLevels: { support: 0, resistance: 0 },
    recommendation: "Analyse manuelle recommandée",
    riskLevel: "medium",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Analyze market data using OpenAI GPT-4o
 */
export async function analyzeWithOpenAI(data: MarketDataInput): Promise<AIAnalysisResult> {
  if (!openai) {
    throw new Error("OpenAI API key not configured");
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are an expert financial analyst specializing in forex and crypto markets. Respond ONLY in valid JSON format with French text fields.",
      },
      {
        role: "user",
        content: buildPrompt(data),
      },
    ],
    temperature: 0.3,
    max_tokens: 800,
  });

  const content = response.choices[0]?.message?.content || "{}";
  return parseAIResponse(content, "openai");
}

/**
 * Analyze market data using Google Gemini
 */
export async function analyzeWithGemini(data: MarketDataInput): Promise<AIAnalysisResult> {
  if (!gemini) {
    throw new Error("Gemini API key not configured");
  }

  const model = gemini.models;
  const response = await model.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `You are an expert financial analyst specializing in forex and crypto markets. ${buildPrompt(data)} Respond ONLY in valid JSON format with French text fields.`,
          },
        ],
      },
    ],
    config: {
      temperature: 0.3,
      maxOutputTokens: 800,
    },
  });

  const content = response.text || "{}";
  return parseAIResponse(content, "gemini");
}

/**
 * Analyze with both models and return the best result (highest confidence)
 */
export async function analyzeWithBoth(data: MarketDataInput): Promise<AIAnalysisResult> {
  const results: AIAnalysisResult[] = [];
  const errors: string[] = [];

  // Call OpenAI
  if (openai) {
    try {
      const openaiResult = await analyzeWithOpenAI(data);
      results.push(openaiResult);
    } catch (err) {
      errors.push(`OpenAI: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Call Gemini
  if (gemini) {
    try {
      const geminiResult = await analyzeWithGemini(data);
      results.push(geminiResult);
    } catch (err) {
      errors.push(`Gemini: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (results.length === 0) {
    // Return a neutral analysis based on price data if no AI is available
    return generateTechnicalAnalysis(data, errors.join("; "));
  }

  // Return the result with highest confidence
  return results.reduce((best, current) =>
    current.confidence > best.confidence ? current : best
  );
}

/**
 * Fallback technical analysis when AI APIs are not available
 */
function generateTechnicalAnalysis(data: MarketDataInput, errorMsg?: string): AIAnalysisResult {
  const change = data.change24hPercent || 0;
  let sentiment: "bullish" | "bearish" | "neutral" = "neutral";
  let confidence = 50;

  if (change > 2) {
    sentiment = "bullish";
    confidence = Math.min(85, 60 + change * 5);
  } else if (change < -2) {
    sentiment = "bearish";
    confidence = Math.min(85, 60 + Math.abs(change) * 5);
  } else {
    sentiment = "neutral";
    confidence = 40;
  }

  const volatility = data.high24h && data.low24h ? data.high24h - data.low24h : 0;
  const support = data.low24h || data.price * 0.98;
  const resistance = data.high24h || data.price * 1.02;

  let recommendation = "Observer et attendre une confirmation de tendance.";
  if (sentiment === "bullish") {
    recommendation = `Tendance haussière détectée. Envisager une position d'achat avec stop-loss sous ${support.toFixed(2)}.`;
  } else if (sentiment === "bearish") {
    recommendation = `Tendance baissière détectée. Envisager une position de vente avec stop-loss au-dessus de ${resistance.toFixed(2)}.`;
  }

  const riskLevel = volatility > data.price * 0.05 ? "high" : volatility > data.price * 0.02 ? "medium" : "low";

  return {
    model: "openai",
    sentiment,
    confidence,
    summary:
      errorMsg ||
      `Analyse technique de ${data.symbol}: variation de ${change.toFixed(2)}% sur 24h. ` +
      `${sentiment === "bullish" ? "Momentum positif" : sentiment === "bearish" ? "Momentum négatif" : "Momentum neutre"} détecté.`,
    keyLevels: { support, resistance },
    recommendation,
    riskLevel: riskLevel as "low" | "medium" | "high",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Check which AI providers are available
 */
export function getAvailableProviders(): { openai: boolean; gemini: boolean } {
  return {
    openai: !!openai,
    gemini: !!gemini,
  };
}
