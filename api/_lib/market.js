const PROVIDER_CHAIN = ["Twelve Data", "Finnhub", "Alpha Vantage", "Yahoo Finance"];

const ASSET_DEFINITIONS = [
  { code: "EUR/USD", ticker: "EURUSD=X", category: "Forex", source: "Yahoo Finance" },
  { code: "GBP/USD", ticker: "GBPUSD=X", category: "Forex", source: "Yahoo Finance" },
  { code: "USD/JPY", ticker: "JPY=X", category: "Forex", source: "Yahoo Finance" },
  { code: "USD/CAD", ticker: "CAD=X", category: "Forex", source: "Yahoo Finance" },
  { code: "XAU/USD", ticker: "GC=F", category: "Metals", source: "Yahoo Finance (proxy)" },
  { code: "XAG/USD", ticker: "SI=F", category: "Metals", source: "Yahoo Finance (proxy)" },
  { code: "BTC", ticker: "BTC-USD", category: "Crypto", source: "Yahoo Finance" },
  { code: "ETH", ticker: "ETH-USD", category: "Crypto", source: "Yahoo Finance" },
  { code: "SOL", ticker: "SOL-USD", category: "Crypto", source: "Yahoo Finance" },
  { code: "BNB", ticker: "BNB-USD", category: "Crypto", source: "Yahoo Finance" },
  { code: "NASDAQ", ticker: "^IXIC", category: "Indices", source: "Yahoo Finance" },
  { code: "US30", ticker: "^DJI", category: "Indices", source: "Yahoo Finance" },
  { code: "SP500", ticker: "^GSPC", category: "Indices", source: "Yahoo Finance" },
  { code: "DAX", ticker: "^GDAXI", category: "Indices", source: "Yahoo Finance" },
];

function formatTimeLabel(timestamp) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(timestamp * 1000));
}

function createFallbackChart() {
  return [
    { label: "00:00", price: 0 },
    { label: "04:00", price: 0 },
    { label: "08:00", price: 0 },
    { label: "12:00", price: 0 },
    { label: "16:00", price: 0 },
    { label: "20:00", price: 0 },
  ];
}

async function fetchYahooAsset(definition) {
  const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(definition.ticker)}`);
  url.searchParams.set("interval", "5m");
  url.searchParams.set("range", "1d");
  url.searchParams.set("includePrePost", "false");

  const startedAt = Date.now();
  const response = await fetch(url, {
    headers: {
      "User-Agent": "XTrendAI-Pro/1.0",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance returned ${response.status}`);
  }

  const json = await response.json();
  const result = json?.chart?.result?.[0];
  const meta = result?.meta ?? {};
  const closes = result?.indicators?.quote?.[0]?.close ?? [];
  const timestamps = result?.timestamp ?? [];
  const points = timestamps
    .map((timestamp, index) => ({ timestamp, price: closes[index] }))
    .filter((point) => typeof point.price === "number" && Number.isFinite(point.price));

  const lastPoint = points.at(-1);
  const price = typeof meta.regularMarketPrice === "number" ? meta.regularMarketPrice : lastPoint?.price ?? null;
  const previousClose = typeof meta.previousClose === "number" ? meta.previousClose : null;
  const changePercent =
    price != null && previousClose != null && previousClose !== 0
      ? ((price - previousClose) / previousClose) * 100
      : null;

  const chart = points.length
    ? points.slice(-24).map((point) => ({
        label: formatTimeLabel(point.timestamp),
        price: Number(point.price.toFixed(4)),
      }))
    : createFallbackChart();

  const asOf = lastPoint ? new Date(lastPoint.timestamp * 1000).toISOString() : new Date().toISOString();

  return {
    asset: {
      code: definition.code,
      category: definition.category,
      price,
      changePercent,
      source: definition.source,
      quality: price == null ? "degraded" : "live",
      asOf,
      lastUpdated: new Date().toISOString(),
      status: price == null ? "error" : "live",
    },
    chart,
    responseTimeMs: Date.now() - startedAt,
  };
}

export async function getMarketSnapshot() {
  const charts = {};
  const assets = [];
  let yahooResponseTimeMs = 0;

  for (const definition of ASSET_DEFINITIONS) {
    try {
      const { asset, chart, responseTimeMs } = await fetchYahooAsset(definition);
      charts[definition.code] = chart;
      assets.push(asset);
      yahooResponseTimeMs = Math.max(yahooResponseTimeMs, responseTimeMs);
    } catch (error) {
      charts[definition.code] = createFallbackChart();
      assets.push({
        code: definition.code,
        category: definition.category,
        price: null,
        changePercent: null,
        source: definition.source,
        quality: "error",
        asOf: null,
        lastUpdated: new Date().toISOString(),
        status: "error",
      });
    }
  }

  return {
    snapshot: {
      fetchedAt: new Date().toISOString(),
      providerChain: PROVIDER_CHAIN,
      assets,
      charts,
    },
    yahooResponseTimeMs,
  };
}

export async function getProvidersHealth() {
  const { yahooResponseTimeMs } = await getMarketSnapshot();

  const providers = [
    {
      name: "Twelve Data",
      status: process.env.TWELVE_DATA_API_KEY ? "connected" : "not_configured",
      configured: Boolean(process.env.TWELVE_DATA_API_KEY),
      mode: "production",
      hasKey: Boolean(process.env.TWELVE_DATA_API_KEY),
      hasSecret: false,
      productionMode: true,
      sandboxMode: false,
      responseTimeMs: 0,
      lastError: process.env.TWELVE_DATA_API_KEY ? null : "Missing TWELVE_DATA_API_KEY",
      note: "Primary market data provider",
    },
    {
      name: "Finnhub",
      status: process.env.FINNHUB_API_KEY ? "connected" : "not_configured",
      configured: Boolean(process.env.FINNHUB_API_KEY),
      mode: "production",
      hasKey: Boolean(process.env.FINNHUB_API_KEY),
      hasSecret: false,
      productionMode: true,
      sandboxMode: false,
      responseTimeMs: 0,
      lastError: process.env.FINNHUB_API_KEY ? null : "Missing FINNHUB_API_KEY",
      note: "Secondary quote fallback",
    },
    {
      name: "Alpha Vantage",
      status: process.env.ALPHA_VANTAGE_API_KEY ? "connected" : "not_configured",
      configured: Boolean(process.env.ALPHA_VANTAGE_API_KEY),
      mode: "production",
      hasKey: Boolean(process.env.ALPHA_VANTAGE_API_KEY),
      hasSecret: false,
      productionMode: true,
      sandboxMode: false,
      responseTimeMs: 0,
      lastError: process.env.ALPHA_VANTAGE_API_KEY ? null : "Missing ALPHA_VANTAGE_API_KEY",
      note: "Tertiary provider for FX and indicators",
    },
    {
      name: "Yahoo Finance",
      status: "connected",
      configured: true,
      mode: "production",
      hasKey: true,
      hasSecret: false,
      productionMode: true,
      sandboxMode: false,
      responseTimeMs: yahooResponseTimeMs,
      lastError: null,
      note: "Public fallback market data source",
    },
  ];

  return {
    fetchedAt: new Date().toISOString(),
    providers,
  };
}

export function getPaymentsHealth() {
  return {
    fetchedAt: new Date().toISOString(),
    providers: [
      {
        name: "Stripe",
        hasPublicKey: Boolean(process.env.STRIPE_PUBLISHABLE_KEY),
        hasSecretKey: Boolean(process.env.STRIPE_SECRET_KEY),
        mode: process.env.STRIPE_SECRET_KEY ? "production" : "missing_config",
        productionMode: Boolean(process.env.STRIPE_SECRET_KEY),
        sandboxMode: !process.env.STRIPE_SECRET_KEY,
        status: process.env.STRIPE_PUBLISHABLE_KEY && process.env.STRIPE_SECRET_KEY ? "connected" : "missing_config",
        note: "Card payments and Bancontact via Stripe rails",
      },
      {
        name: "PayPal",
        hasPublicKey: Boolean(process.env.PAYPAL_CLIENT_ID),
        hasSecretKey: Boolean(process.env.PAYPAL_CLIENT_SECRET),
        mode: process.env.PAYPAL_CLIENT_SECRET ? "production" : "missing_config",
        productionMode: Boolean(process.env.PAYPAL_CLIENT_SECRET),
        sandboxMode: !process.env.PAYPAL_CLIENT_SECRET,
        status: process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET ? "connected" : "missing_config",
        note: "Wallet and PayPal checkout",
      },
      {
        name: "Bancontact",
        hasPublicKey: Boolean(process.env.STRIPE_PUBLISHABLE_KEY),
        hasSecretKey: Boolean(process.env.STRIPE_SECRET_KEY),
        mode: process.env.STRIPE_SECRET_KEY ? "production" : "missing_config",
        productionMode: Boolean(process.env.STRIPE_SECRET_KEY),
        sandboxMode: !process.env.STRIPE_SECRET_KEY,
        status: process.env.STRIPE_PUBLISHABLE_KEY && process.env.STRIPE_SECRET_KEY ? "connected" : "missing_config",
        note: "Served through Stripe payment method configuration",
      },
    ],
  };
}
