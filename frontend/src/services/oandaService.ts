import type { OandaConfig } from "@/types";
import { readStorage, writeStorage } from "@/lib/utils";

const OANDA_CONFIG_KEY = "xtrendai_oanda_config";

export function getOandaConfig() {
  return readStorage<OandaConfig>(OANDA_CONFIG_KEY, {
    apiKey: "",
    accountId: "",
    environment: "practice",
  });
}

export function saveOandaConfig(config: OandaConfig) {
  writeStorage(OANDA_CONFIG_KEY, config);
}

export async function testOandaConnection(config = getOandaConfig()) {
  if (!config.apiKey || !config.accountId) {
    return { ok: false as const, message: "Renseignez la clé API et l'identifiant de compte." };
  }

  const baseUrl = config.environment === "live" ? "https://api-fxtrade.oanda.com" : "https://api-fxpractice.oanda.com";
  try {
    const response = await fetch(`${baseUrl}/v3/accounts/${config.accountId}/summary`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
    });

    if (!response.ok) {
      return { ok: false as const, message: `Connexion OANDA refusée (${response.status}).` };
    }

    return { ok: true as const, message: "Connexion OANDA validée." };
  } catch {
    return { ok: false as const, message: "Impossible de joindre OANDA depuis ce navigateur." };
  }
}
