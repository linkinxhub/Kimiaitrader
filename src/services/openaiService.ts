import type { AISignal, AssetQuote, LlmConfig, LlmProvider } from "@/types";
import { chunkText, readStorage, sleep, writeStorage } from "@/lib/utils";

const LLM_CONFIG_KEY = "xtrendai_llm_config";

export function getLlmConfig() {
  return readStorage<LlmConfig>(LLM_CONFIG_KEY, {
    provider: "openai",
    apiKey: "",
    model: "gpt-4o-mini",
  });
}

export function saveLlmConfig(config: LlmConfig) {
  writeStorage(LLM_CONFIG_KEY, config);
}

function buildMarketContext(quotes: AssetQuote[], signals: AISignal[]) {
  const quoteSummary = quotes.slice(0, 4).map((quote) => `${quote.label}: ${quote.price} (${quote.change24h.toFixed(2)}%)`).join(" | ");
  const signalSummary = signals.slice(0, 3).map((signal) => `${signal.asset} ${signal.direction} confiance ${signal.confidence}%`).join(" | ");
  return `Contexte marché: ${quoteSummary}. Signaux en focus: ${signalSummary}.`;
}

function getSimulation(provider: LlmProvider, prompt: string, context: string) {
  return `${provider.toUpperCase()} simulation active. ${context} Réponse synthétique: ${prompt}. Priorité du moment: discipline de risque, confirmation multi-timeframe, et gestion des entrées sur niveaux clairs.`;
}

export async function* chatWithLLMStream(params: {
  prompt: string;
  quotes: AssetQuote[];
  signals: AISignal[];
}) {
  const config = getLlmConfig();
  const context = buildMarketContext(params.quotes, params.signals);

  if (!config.apiKey) {
    const simulation = getSimulation(config.provider, params.prompt, context);
    for (const chunk of chunkText(simulation, 36)) {
      await sleep(80);
      yield chunk;
    }
    return;
  }

  if (config.provider !== "openai") {
    const simulation = getSimulation(config.provider, params.prompt, context);
    for (const chunk of chunkText(simulation, 36)) {
      await sleep(80);
      yield chunk;
    }
    return;
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || "gpt-4o-mini",
      input: `${context}\n\nQuestion utilisateur: ${params.prompt}`,
      stream: false,
    }),
  });

  if (!response.ok) {
    const simulation = getSimulation("openai", params.prompt, context);
    for (const chunk of chunkText(simulation, 36)) {
      await sleep(80);
      yield chunk;
    }
    return;
  }

  const payload = (await response.json()) as { output_text?: string };
  const text = payload.output_text || getSimulation("openai", params.prompt, context);
  for (const chunk of chunkText(text, 42)) {
    await sleep(70);
    yield chunk;
  }
}
