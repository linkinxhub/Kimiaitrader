import type { Pack, AssetQuote, SiteUpdate } from "@/types";

export const PACK_ORDER: Pack[] = ["free", "pro", "expert", "institutional"];

export const PACK_LABELS: Record<Pack, string> = {
  free: "Free",
  pro: "Pro",
  expert: "Expert",
  institutional: "Institutionnel",
};

export const PACK_COLORS: Record<Pack, string> = {
  free: "text-free",
  pro: "text-pro",
  expert: "text-expert",
  institutional: "text-institutional",
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
    title: "Nouveau moteur de signaux IA multi-actifs",
    description: "Le radar analyse désormais crypto, forex et métaux sur le même flux de décision.",
    category: "Produit",
    publishedAt: "2026-06-01T08:30:00.000Z",
  },
  {
    id: "up_2",
    title: "Centre OANDA prêt pour la connexion broker",
    description: "Les utilisateurs peuvent tester leur clé OANDA et préparer leur flux forex en pratique.",
    category: "Trading",
    publishedAt: "2026-05-28T13:10:00.000Z",
  },
  {
    id: "up_3",
    title: "Renforcement des options de sécurité",
    description: "2FA, OTP, limitation des tentatives et détection IP sont maintenant pilotables côté admin.",
    category: "Sécurité",
    publishedAt: "2026-05-23T18:45:00.000Z",
  },
];
