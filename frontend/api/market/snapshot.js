import { ASSETS, PROVIDER_CHAIN, fetchAssetQuote, fetchYahooChart } from "../_lib/market.js";

export default async function handler(_req, res) {
  try {
    const assets = await Promise.all(ASSETS.map((asset) => fetchAssetQuote(asset, process.env)));
    const chartAssets = ["EUR/USD", "XAU/USD", "BTC"];
    const charts = {};

    for (const code of chartAssets) {
      const asset = ASSETS.find((entry) => entry.code === code);
      if (!asset) continue;
      charts[code] = await fetchYahooChart(asset);
    }

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json({
      fetchedAt: new Date().toISOString(),
      providerChain: PROVIDER_CHAIN,
      assets,
      charts,
    });
  } catch (error) {
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    return res.status(500).json({
      fetchedAt: new Date().toISOString(),
      providerChain: PROVIDER_CHAIN,
      assets: [],
      charts: {},
      error: error instanceof Error ? error.message : "Unknown market snapshot error",
    });
  }
}
