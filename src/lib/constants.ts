import type { AssetQuote, Pack, SiteUpdate } from "@/types";

export const PACK_ORDER: Pack[] = ["free", "pro", "expert", "institutional"];

export const PACK_LABELS: Record<Pack, string> = {
  free: "Free",
  pro: "Pro",
  expert: "Expert",
  institutional: "Institutional",
};

export const PACK_COLORS: Record<Pack, string> = {
  free: "text-slate-300",
  pro: "text-amber-300",
  expert: "text-teal-300",
  institutional: "text-rose-300",
};

export const DEMO_QUOTES: AssetQuote[] = [
  {
    symbol: "XAUUSD",
    label: "XAU/USD",
    price: 2358.5,
    change24h: 0.82,
    high24h: 2369.4,
    low24h: 2340.1,
    volume: 1850000,
    source: "Mode-Demo",
    market: "metal",
    updatedAt: new Date().toISOString(),
  },
  {
    symbol: "BTCUSDT",
    label: "BTC/USD",
    price: 68320,
    change24h: 1.92,
    high24h: 69110,
    low24h: 67010,
    volume: 24000000000,
    source: "Mode-Demo",
    market: "crypto",
    updatedAt: new Date().toISOString(),
  },
  {
    symbol: "EURUSD",
    label: "EUR/USD",
    price: 1.0874,
    change24h: -0.17,
    high24h: 1.091,
    low24h: 1.0842,
    volume: 950000,
    source: "Mode-Demo",
    market: "forex",
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_UPDATES: SiteUpdate[] = [
  {
    id: "up_1",
    title: "Live market backbone redesigned",
    description: "The new workspace now prioritizes live Binance, Frankfurter, and gold feeds with tighter fallback handling.",
    category: "Produit",
    publishedAt: "2026-06-05T08:30:00.000Z",
  },
  {
    id: "up_2",
    title: "Landing and admin are now synchronized",
    description: "Pricing, hero content, and public updates are driven from the same admin-controlled settings layer.",
    category: "Business",
    publishedAt: "2026-06-04T13:10:00.000Z",
  },
  {
    id: "up_3",
    title: "Gold desk refined for live execution",
    description: "The XAU control room now exposes clearer bias, levels, and source visibility for premium users.",
    category: "Trading",
    publishedAt: "2026-06-03T18:45:00.000Z",
  },
];
