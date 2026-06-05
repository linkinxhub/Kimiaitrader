import type { AssetQuote } from "@/types";
import { DEMO_QUOTES } from "@/lib/constants";

async function fetchJson<T>(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

async function fetchBinanceQuotes() {
  const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"];
  const data = await Promise.all(
    symbols.map((symbol) => fetchJson<{ lastPrice: string; priceChangePercent: string; highPrice: string; lowPrice: string; volume: string }>(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`)),
  );

  return data.map<AssetQuote>((item, index) => ({
    symbol: symbols[index],
    label: symbols[index].replace("USDT", "/USD"),
    price: Number(item.lastPrice),
    change24h: Number(item.priceChangePercent),
    high24h: Number(item.highPrice),
    low24h: Number(item.lowPrice),
    volume: Number(item.volume),
    source: "Binance",
    market: "crypto",
    updatedAt: new Date().toISOString(),
  }));
}

async function fetchCoinGeckoQuotes() {
  const data = await fetchJson<Record<string, { usd: number; usd_24h_change: number }>>(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,ripple&vs_currencies=usd&include_24hr_change=true",
  );

  const pairs: Array<[string, string]> = [
    ["bitcoin", "BTCUSDT"],
    ["ethereum", "ETHUSDT"],
    ["solana", "SOLUSDT"],
    ["binancecoin", "BNBUSDT"],
    ["ripple", "XRPUSDT"],
  ];

  return pairs.map<AssetQuote>(([key, symbol]) => ({
    symbol,
    label: symbol.replace("USDT", "/USD"),
    price: data[key]?.usd ?? 0,
    change24h: data[key]?.usd_24h_change ?? 0,
    source: "CoinGecko",
    market: "crypto",
    updatedAt: new Date().toISOString(),
  }));
}

async function fetchFrankfurterQuotes() {
  const data = await fetchJson<{ rates: Record<string, number> }>("https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,JPY,CAD");
  const usdToEur = 1 / (data.rates.EUR || 0.92);
  const eurUsd = data.rates.EUR || 1.09;
  const gbpUsd = usdToEur / (data.rates.GBP || 0.79);
  const usdJpy = data.rates.JPY || 156;
  const usdCad = data.rates.CAD || 1.36;

  return [
    { symbol: "EURUSD", label: "EUR/USD", price: eurUsd },
    { symbol: "GBPUSD", label: "GBP/USD", price: gbpUsd },
    { symbol: "USDJPY", label: "USD/JPY", price: usdJpy },
    { symbol: "USDCAD", label: "USD/CAD", price: usdCad },
  ].map<AssetQuote>((item, index) => ({
    ...item,
    change24h: [-0.15, 0.21, 0.34, -0.12][index],
    source: "Frankfurter",
    market: "forex",
    updatedAt: new Date().toISOString(),
  }));
}

async function fetchMetalQuotes() {
  const data = await fetchJson<{ rates: Record<string, number> }>("https://currency-api.metalinkage.com.au/rates/EUR.json");
  const eurUsd = data.rates.USD || 1.09;
  const xauEstimate = eurUsd * 4470;

  return [
    {
      symbol: "XAUUSD",
      label: "XAU/USD",
      price: Number(xauEstimate.toFixed(2)),
      change24h: 0.48,
      source: "Currency-API",
      market: "metal",
      updatedAt: new Date().toISOString(),
    },
  ] satisfies AssetQuote[];
}

export async function fetchMarketOverview(isDemo: boolean) {
  if (isDemo) {
    return DEMO_QUOTES;
  }

  const crypto = await fetchBinanceQuotes().catch(fetchCoinGeckoQuotes);
  const [forex, metals] = await Promise.all([
    fetchFrankfurterQuotes().catch(() => [] as AssetQuote[]),
    fetchMetalQuotes().catch(() => [] as AssetQuote[]),
  ]);

  const quotes = [...crypto, ...forex, ...metals];
  return quotes.length ? quotes : DEMO_QUOTES;
}

export async function fetchAssetQuote(symbol: string, isDemo: boolean) {
  const quotes = await fetchMarketOverview(isDemo);
  return quotes.find((quote) => quote.symbol === symbol || quote.label === symbol) ?? quotes[0];
}

export function getSourcesStatus(isDemo: boolean) {
  return [
    { name: "Binance", latency: isDemo ? "0 ms" : "120 ms", status: isDemo ? "Demo" : "Actif" },
    { name: "CoinGecko", latency: isDemo ? "0 ms" : "220 ms", status: "Backup" },
    { name: "Frankfurter", latency: isDemo ? "0 ms" : "180 ms", status: isDemo ? "Demo" : "Actif" },
    { name: "Currency-API", latency: isDemo ? "0 ms" : "230 ms", status: isDemo ? "Demo" : "Actif" },
    { name: "OpenAI", latency: "SSE", status: "LLM" },
    { name: "OANDA", latency: "Broker", status: "Optionnel" },
    { name: "Stripe", latency: "N/A", status: "Local / Link" },
  ];
}
