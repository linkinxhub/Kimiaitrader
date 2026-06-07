import { getMarketSnapshot } from "../_lib/market.js";

export default async function handler(_request, response) {
  try {
    const { snapshot } = await getMarketSnapshot();
    response.status(200).json(snapshot);
  } catch (error) {
    response.status(500).json({
      fetchedAt: new Date().toISOString(),
      providerChain: ["Twelve Data", "Finnhub", "Alpha Vantage", "Yahoo Finance"],
      assets: [],
      charts: {},
      error: error instanceof Error ? error.message : "Unknown market snapshot error",
    });
  }
}
