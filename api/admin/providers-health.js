import { getProvidersHealth } from "../_lib/market.js";

export default async function handler(_request, response) {
  try {
    const payload = await getProvidersHealth();
    response.status(200).json(payload);
  } catch (error) {
    response.status(500).json({
      fetchedAt: new Date().toISOString(),
      providers: [],
      error: error instanceof Error ? error.message : "Unknown provider health error",
    });
  }
}
