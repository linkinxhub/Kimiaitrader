const PROVIDER_CHAIN = ["Twelve Data", "Finnhub", "Alpha Vantage", "Yahoo Finance"];
const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0",
  Accept: "application/json",
};

const ASSETS = [
  {
    code: "EUR/USD",
    category: "Forex",
    yahoo: "EURUSD=X",
    yahooCandidates: ["EURUSD=X"],
    twelveData: "EUR/USD",
    finnhub: "OANDA:EUR_USD",
    alpha: { from: "EUR", to: "USD", kind: "fx" },
  },
  {
    code: "GBP/USD",
    category: "Forex",
    yahoo: "GBPUSD=X",
    yahooCandidates: ["GBPUSD=X"],
    twelveData: "GBP/USD",
    finnhub: "OANDA:GBP_USD",
    alpha: { from: "GBP", to: "USD", kind: "fx" },
  },
  {
    code: "USD/JPY",
    category: "Forex",
    yahoo: "JPY=X",
    yahooCandidates: ["JPY=X"],
    twelveData: "USD/JPY",
    finnhub: "OANDA:USD_JPY",
    alpha: { from: "USD", to: "JPY", kind: "fx" },
  },
  {
    code: "USD/CAD",
    category: "Forex",
    yahoo: "CAD=X",
    yahooCandidates: ["CAD=X"],
    twelveData: "USD/CAD",
    finnhub: "OANDA:USD_CAD",
    alpha: { from: "USD", to: "CAD", kind: "fx" },
  },
  {
    code: "XAU/USD",
    category: "Metals",
    yahoo: "XAUUSD=X",
    yahooCandidates: ["XAUUSD=X", "GC=F"],
    twelveData: "XAU/USD",
    finnhub: "OANDA:XAU_USD",
    alpha: { from: "XAU", to: "USD", kind: "fx" },
  },
  {
    code: "XAG/USD",
    category: "Metals",
    yahoo: "XAGUSD=X",
    yahooCandidates: ["XAGUSD=X", "SI=F"],
    twelveData: "XAG/USD",
    finnhub: "OANDA:XAG_USD",
    alpha: { from: "XAG", to: "USD", kind: "fx" },
  },
  {
    code: "BTC",
    category: "Crypto",
    yahoo: "BTC-USD",
    yahooCandidates: ["BTC-USD"],
    twelveData: "BTC/USD",
    finnhub: "BINANCE:BTCUSDT",
    alpha: { from: "BTC", to: "USD", kind: "crypto" },
  },
  {
    code: "ETH",
    category: "Crypto",
    yahoo: "ETH-USD",
    yahooCandidates: ["ETH-USD"],
    twelveData: "ETH/USD",
    finnhub: "BINANCE:ETHUSDT",
    alpha: { from: "ETH", to: "USD", kind: "crypto" },
  },
  {
    code: "SOL",
    category: "Crypto",
    yahoo: "SOL-USD",
    yahooCandidates: ["SOL-USD"],
    twelveData: "SOL/USD",
    finnhub: "BINANCE:SOLUSDT",
    alpha: { from: "SOL", to: "USD", kind: "crypto" },
  },
  {
    code: "BNB",
    category: "Crypto",
    yahoo: "BNB-USD",
    yahooCandidates: ["BNB-USD"],
    twelveData: "BNB/USD",
    finnhub: "BINANCE:BNBUSDT",
    alpha: { from: "BNB", to: "USD", kind: "crypto" },
  },
  {
    code: "NASDAQ",
    category: "Indices",
    yahoo: "^IXIC",
    yahooCandidates: ["^IXIC"],
    twelveData: "IXIC",
    finnhub: "^IXIC",
    alpha: { symbol: "^IXIC", kind: "equity" },
  },
  {
    code: "US30",
    category: "Indices",
    yahoo: "^DJI",
    yahooCandidates: ["^DJI"],
    twelveData: "DJI",
    finnhub: "^DJI",
    alpha: { symbol: "^DJI", kind: "equity" },
  },
  {
    code: "SP500",
    category: "Indices",
    yahoo: "^GSPC",
    yahooCandidates: ["^GSPC"],
    twelveData: "GSPC",
    finnhub: "^GSPC",
    alpha: { symbol: "^GSPC", kind: "equity" },
  },
  {
    code: "DAX",
    category: "Indices",
    yahoo: "^GDAXI",
    yahooCandidates: ["^GDAXI"],
    twelveData: "GDAXI",
    finnhub: "^GDAXI",
    alpha: { symbol: "^GDAXI", kind: "equity" },
  },
];

async function safeFetch(url, init) {
  const startedAt = Date.now();
  const response = await fetch(url, init);
  const responseTimeMs = Date.now() - startedAt;
  return { response, responseTimeMs };
}

function toIso(timestampSeconds) {
  if (!timestampSeconds) return new Date().toISOString();
  return new Date(timestampSeconds * 1000).toISOString();
}

function toQuality(source) {
  if (source === "Twelve Data") return "primary";
  if (source === "Finnhub") return "secondary";
  if (source === "Alpha Vantage") return "tertiary";
  if (source === "Yahoo Finance") return "fallback";
  return "unavailable";
}

function normalizeTwelveData(asset, payload) {
  const price = Number(payload.close ?? payload.price);
  if (!Number.isFinite(price)) return null;
  const changePercent = Number(payload.percent_change ?? payload.change_percent ?? 0);
  return {
    code: asset.code,
    category: asset.category,
    price,
    changePercent,
    source: "Twelve Data",
    quality: toQuality("Twelve Data"),
    asOf: payload.datetime ?? new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    status: "live",
  };
}

function normalizeFinnhub(asset, payload) {
  const price = Number(payload.c);
  if (!Number.isFinite(price) || price <= 0) return null;
  const previousClose = Number(payload.pc);
  const changePercent = previousClose ? ((price - previousClose) / previousClose) * 100 : 0;
  return {
    code: asset.code,
    category: asset.category,
    price,
    changePercent,
    source: "Finnhub",
    quality: toQuality("Finnhub"),
    asOf: toIso(payload.t),
    lastUpdated: new Date().toISOString(),
    status: "live",
  };
}

function normalizeAlpha(asset, payload) {
  const exchangeRate = payload["Realtime Currency Exchange Rate"];
  const globalQuote = payload["Global Quote"];

  if (exchangeRate) {
    const price = Number(exchangeRate["5. Exchange Rate"]);
    if (!Number.isFinite(price)) return null;
    return {
      code: asset.code,
      category: asset.category,
      price,
      changePercent: 0,
      source: "Alpha Vantage",
      quality: toQuality("Alpha Vantage"),
      asOf: exchangeRate["6. Last Refreshed"] ?? new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: "live",
    };
  }

  if (globalQuote) {
    const price = Number(globalQuote["05. price"]);
    const previousClose = Number(globalQuote["08. previous close"]);
    if (!Number.isFinite(price)) return null;
    const changePercent = previousClose ? ((price - previousClose) / previousClose) * 100 : 0;
    return {
      code: asset.code,
      category: asset.category,
      price,
      changePercent,
      source: "Alpha Vantage",
      quality: toQuality("Alpha Vantage"),
      asOf: globalQuote["07. latest trading day"] ?? new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: "live",
    };
  }

  return null;
}

function normalizeYahooQuote(asset, payload, usedProxy = false) {
  const price = Number(payload.regularMarketPrice ?? payload.postMarketPrice ?? payload.preMarketPrice);
  if (!Number.isFinite(price)) return null;
  return {
    code: asset.code,
    category: asset.category,
    price,
    changePercent: Number(payload.regularMarketChangePercent ?? 0),
    source: usedProxy ? "Yahoo Finance (proxy)" : "Yahoo Finance",
    quality: usedProxy ? "fallback-proxy" : toQuality("Yahoo Finance"),
    asOf: toIso(payload.regularMarketTime),
    lastUpdated: new Date().toISOString(),
    status: "live",
  };
}

async function fetchTwelveDataQuote(asset, apiKey) {
  if (!apiKey) return null;
  const { response } = await safeFetch(
    `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(asset.twelveData)}&apikey=${encodeURIComponent(apiKey)}`,
  );
  if (!response.ok) return null;
  const payload = await response.json();
  if (payload.status === "error") return null;
  return normalizeTwelveData(asset, payload);
}

async function fetchFinnhubQuote(asset, apiKey) {
  if (!apiKey) return null;
  const { response } = await safeFetch(
    `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(asset.finnhub)}&token=${encodeURIComponent(apiKey)}`,
  );
  if (!response.ok) return null;
  const payload = await response.json();
  return normalizeFinnhub(asset, payload);
}

async function fetchAlphaQuote(asset, apiKey) {
  if (!apiKey) return null;
  const query =
    asset.alpha.kind === "equity"
      ? `function=GLOBAL_QUOTE&symbol=${encodeURIComponent(asset.alpha.symbol)}&apikey=${encodeURIComponent(apiKey)}`
      : `function=CURRENCY_EXCHANGE_RATE&from_currency=${encodeURIComponent(asset.alpha.from)}&to_currency=${encodeURIComponent(asset.alpha.to)}&apikey=${encodeURIComponent(apiKey)}`;
  const { response } = await safeFetch(`https://www.alphavantage.co/query?${query}`);
  if (!response.ok) return null;
  const payload = await response.json();
  return normalizeAlpha(asset, payload);
}

async function fetchYahooQuote(asset) {
  for (const [index, candidate] of (asset.yahooCandidates ?? [asset.yahoo]).entries()) {
    const { response } = await safeFetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(candidate)}?interval=15m&range=1d`,
      { headers: BROWSER_HEADERS },
    );
    if (!response.ok) {
      continue;
    }

    const payload = await response.json();
    const result = payload?.chart?.result?.[0];
    const meta = result?.meta;
    const closes = result?.indicators?.quote?.[0]?.close ?? [];
    const validCloses = closes.filter((price) => Number.isFinite(price));
    const latestPrice = validCloses[validCloses.length - 1];

    if (!Number.isFinite(latestPrice)) {
      continue;
    }

    return normalizeYahooQuote(
      asset,
      {
        regularMarketPrice: latestPrice,
        regularMarketChangePercent: meta?.chartPreviousClose
          ? ((latestPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100
          : 0,
        regularMarketTime: meta?.regularMarketTime ?? meta?.currentTradingPeriod?.regular?.end,
      },
      index > 0,
    );
  }

  throw new Error("Yahoo Finance unavailable");
}

async function fetchYahooBatchQuotes(assets) {
  const results = await Promise.all(
    assets.map(async (asset) => {
      try {
        return await fetchYahooQuote(asset);
      } catch {
        return null;
      }
    }),
  );

  return results.filter(Boolean);
}

async function fetchYahooChart(asset) {
  for (const candidate of asset.yahooCandidates ?? [asset.yahoo]) {
    const { response } = await safeFetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(candidate)}?interval=15m&range=1d`,
      { headers: BROWSER_HEADERS },
    );
    if (!response.ok) continue;
    const payload = await response.json();
    const result = payload?.chart?.result?.[0];
    const closes = result?.indicators?.quote?.[0]?.close ?? [];
    const timestamps = result?.timestamp ?? [];

    const series = timestamps
      .map((timestamp, index) => {
        const price = closes[index];
        if (!Number.isFinite(price)) return null;
        const date = new Date(timestamp * 1000);
        return {
          label: date.toISOString().slice(11, 16),
          price: Number(price),
        };
      })
      .filter(Boolean);

    if (series.length) {
      return series;
    }
  }

  return [];
}

async function fetchAssetQuote(asset, env) {
  const attempts = [
    () => fetchTwelveDataQuote(asset, env.TWELVE_DATA_API_KEY),
    () => fetchFinnhubQuote(asset, env.FINNHUB_API_KEY),
    () => fetchAlphaQuote(asset, env.ALPHA_VANTAGE_API_KEY),
  ];

  for (const attempt of attempts) {
    try {
      const quote = await attempt();
      if (quote) return quote;
    } catch {
      // Try next provider in the chain.
    }
  }

  const yahooQuotes = await fetchYahooBatchQuotes([asset]);
  return (
    yahooQuotes[0] ?? {
      code: asset.code,
      category: asset.category,
      price: null,
      changePercent: null,
      source: "Unavailable",
      quality: "unavailable",
      asOf: null,
      lastUpdated: new Date().toISOString(),
      status: "error",
    }
  );
}

async function buildProviderHealth(provider) {
  const startedAt = Date.now();
  if (!provider.configured && provider.name !== "Yahoo Finance") {
    return {
      name: provider.name,
      status: "not_configured",
      configured: false,
      mode: provider.mode,
      hasKey: provider.hasKey,
      hasSecret: provider.hasSecret,
      productionMode: provider.mode === "production",
      sandboxMode: provider.mode === "sandbox",
      responseTimeMs: Date.now() - startedAt,
      lastError: "Credential missing",
      note: provider.note,
    };
  }

  try {
    const result = await provider.check();
    return {
      name: provider.name,
      status: result ? "connected" : provider.configured ? "error" : "not_configured",
      configured: provider.configured,
      mode: provider.mode,
      hasKey: provider.hasKey,
      hasSecret: provider.hasSecret,
      productionMode: provider.mode === "production",
      sandboxMode: provider.mode === "sandbox",
      responseTimeMs: Date.now() - startedAt,
      lastError: result ? null : "Unexpected empty response",
      note: provider.note,
    };
  } catch (error) {
    return {
      name: provider.name,
      status: provider.configured ? "error" : "not_configured",
      configured: provider.configured,
      mode: provider.mode,
      hasKey: provider.hasKey,
      hasSecret: provider.hasSecret,
      productionMode: provider.mode === "production",
      sandboxMode: provider.mode === "sandbox",
      responseTimeMs: Date.now() - startedAt,
      lastError: error instanceof Error ? error.message : "Unknown error",
      note: provider.note,
    };
  }
}

function envMode(base) {
  return process.env[`${base}_MODE`] === "sandbox" ? "sandbox" : "production";
}

function buildProviders() {
  return [
    {
      name: "Twelve Data",
      configured: Boolean(process.env.TWELVE_DATA_API_KEY),
      hasKey: Boolean(process.env.TWELVE_DATA_API_KEY),
      hasSecret: false,
      mode: envMode("TWELVE_DATA"),
      note: "Primary live market provider",
      check: async () => {
        if (!process.env.TWELVE_DATA_API_KEY) return false;
        const quote = await fetchTwelveDataQuote(ASSETS[0], process.env.TWELVE_DATA_API_KEY);
        return Boolean(quote);
      },
    },
    {
      name: "Finnhub",
      configured: Boolean(process.env.FINNHUB_API_KEY),
      hasKey: Boolean(process.env.FINNHUB_API_KEY),
      hasSecret: false,
      mode: envMode("FINNHUB"),
      note: "Secondary provider for quote fallback",
      check: async () => {
        if (!process.env.FINNHUB_API_KEY) return false;
        const quote = await fetchFinnhubQuote(ASSETS[0], process.env.FINNHUB_API_KEY);
        return Boolean(quote);
      },
    },
    {
      name: "Alpha Vantage",
      configured: Boolean(process.env.ALPHA_VANTAGE_API_KEY),
      hasKey: Boolean(process.env.ALPHA_VANTAGE_API_KEY),
      hasSecret: false,
      mode: envMode("ALPHA_VANTAGE"),
      note: "Tertiary provider for FX and crypto fallback",
      check: async () => {
        if (!process.env.ALPHA_VANTAGE_API_KEY) return false;
        const quote = await fetchAlphaQuote(ASSETS[0], process.env.ALPHA_VANTAGE_API_KEY);
        return Boolean(quote);
      },
    },
    {
      name: "Yahoo Finance",
      configured: true,
      hasKey: false,
      hasSecret: false,
      mode: "production",
      note: "Public fallback to prevent empty dashboards",
      check: async () => {
        const quotes = await fetchYahooBatchQuotes([ASSETS[0]]);
        return quotes.length > 0;
      },
    },
  ];
}

export {
  ASSETS,
  PROVIDER_CHAIN,
  buildProviderHealth,
  buildProviders,
  fetchAssetQuote,
  fetchYahooBatchQuotes,
  fetchYahooChart,
};
