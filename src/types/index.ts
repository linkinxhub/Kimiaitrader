export type Pack = "free" | "pro" | "expert" | "institutional";
export type Role = "user" | "admin";
export type SignalDirection = "ACHAT" | "VENTE" | "ATTENTE";
export type RiskLevel = "Faible" | "Moyen" | "Eleve";
export type AlertCondition = "ABOVE" | "BELOW" | "EQUALS";
export type MarketKind = "crypto" | "forex" | "metal" | "index";
export type LlmProvider = "openai" | "anthropic" | "deepseek" | "gemini";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  pack: Pack;
  packStatus: "inactive" | "active" | "trial" | "past_due";
  packExpiresAt?: string;
  paymentPending: "yes" | "no";
  createdAt: string;
  createdBy: string;
}

export interface AuthSession {
  userId: string;
  loggedInAt: string;
}

export interface AssetQuote {
  symbol: string;
  label: string;
  price: number;
  change24h: number;
  high24h?: number;
  low24h?: number;
  volume?: number;
  source: string;
  market: MarketKind;
  updatedAt: string;
}

export interface SignalIndicators {
  rsi: number;
  macd: number;
  emaFast: number;
  emaSlow: number;
  atr: number;
}

export interface AISignal {
  id: string;
  asset: string;
  market: MarketKind;
  direction: SignalDirection;
  confidence: number;
  entryPoint: number;
  stopLoss: number;
  takeProfits: [number, number, number];
  riskRewardRatio: number;
  riskLevel: RiskLevel;
  source: string;
  timeframe: string;
  generatedAt: string;
  indicators: SignalIndicators;
  explanation: string[];
}

export interface PriceAlert {
  id: string;
  asset: string;
  condition: AlertCondition;
  targetPrice: number;
  createdAt: string;
  active: boolean;
}

export interface TriggeredAlert extends PriceAlert {
  triggeredAt: string;
  marketPrice: number;
}

export interface Trade {
  id: string;
  asset: string;
  type: "ACHAT" | "VENTE";
  entryPrice: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  size: number;
  notes?: string;
  openedAt: string;
  closedAt?: string;
  status: "open" | "closed";
  pnl?: number;
}

export interface PortfolioStats {
  totalTrades: number;
  closedTrades: number;
  winRate: number;
  profitFactor: number;
  totalPnl: number;
  avgWin: number;
  avgLoss: number;
  monthlyPerformance: Array<{ month: string; pnl: number }>;
}

export interface PackPrices {
  free: number;
  pro: number;
  expert: number;
  institutional: number;
}

export interface MarketingMetric {
  label: string;
  value: string;
  note: string;
}

export interface PlatformSettings {
  platformName: string;
  slogan: string;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  realTimeSignals: boolean;
  globalDemoMode: boolean;
  contactEmail: string;
  contactPhone: string;
  contactWhatsApp: string;
  enable2FA: boolean;
  enableOTP: boolean;
  limitLoginAttempts: boolean;
  detectSuspiciousIP: boolean;
  packPrices: PackPrices;
  packPricesYearly: PackPrices;
  heroBadge: string;
  heroTitle: string;
  heroDescription: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  finalCtaTitle: string;
  finalCtaDescription: string;
  controlPanelLabel: string;
  liveStatusLabel: string;
  heroMetrics: MarketingMetric[];
}

export interface SignalRecord {
  id: string;
  signalId: string;
  pack: Pack;
  asset: string;
  direction: SignalDirection;
  confidence: number;
  createdAt: string;
}

export interface PackAnalytics {
  pack: Pack;
  signals: number;
  winRate: number;
  pnl: number;
  trades: number;
  engagement: number;
  trends7d: number[];
}

export interface FeedbackEntry {
  id: string;
  userName: string;
  pack: Pack;
  rating: number;
  comment: string;
  verified: boolean;
  results: {
    winRate: number;
    pnl: number;
    period: string;
  };
}

export interface SiteUpdate {
  id: string;
  title: string;
  description: string;
  category: "Produit" | "Trading" | "Securite" | "Business";
  publishedAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  actorEmail: string;
  ip: string;
  createdAt: string;
}

export interface LlmConfig {
  provider: LlmProvider;
  apiKey: string;
  model?: string;
}

export interface OandaConfig {
  apiKey: string;
  accountId: string;
  environment: "practice" | "live";
}
