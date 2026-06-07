export interface LiveAsset {
  code: string;
  category: string;
  price: number | null;
  changePercent: number | null;
  source: string;
  quality: string;
  asOf: string | null;
  lastUpdated: string;
  status: "live" | "error";
}

export interface ChartPoint {
  label: string;
  price: number;
}

export interface MarketSnapshot {
  fetchedAt: string;
  providerChain: string[];
  assets: LiveAsset[];
  charts: Record<string, ChartPoint[]>;
  error?: string;
}

export interface ProviderHealth {
  name: string;
  status: string;
  configured: boolean;
  mode: string;
  hasKey: boolean;
  hasSecret: boolean;
  productionMode: boolean;
  sandboxMode: boolean;
  responseTimeMs: number;
  lastError: string | null;
  note: string;
}

export interface ProviderHealthResponse {
  fetchedAt: string;
  providers: ProviderHealth[];
}

export interface PaymentHealth {
  name: string;
  hasPublicKey: boolean;
  hasSecretKey: boolean;
  mode: string;
  productionMode: boolean;
  sandboxMode: boolean;
  status: string;
  note: string;
}

export interface PaymentHealthResponse {
  fetchedAt: string;
  providers: PaymentHealth[];
}
