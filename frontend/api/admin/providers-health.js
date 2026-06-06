import { buildProviderHealth, buildProviders } from "../_lib/market.js";

export default async function handler(_req, res) {
  const providers = buildProviders();
  const results = await Promise.all(providers.map((provider) => buildProviderHealth(provider)));

  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
  return res.status(200).json({
    fetchedAt: new Date().toISOString(),
    providers: results,
  });
}
