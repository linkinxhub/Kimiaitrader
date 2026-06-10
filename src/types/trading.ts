export type SignalType = 'ACHAT' | 'VENTE' | 'ATTENTE';
export type TrendDirection = 'HAUSSIÈRE' | 'BAISSIÈRE' | 'NEUTRE';
export type RiskLevel = 'Faible' | 'Modéré' | 'Élevé';
export type SignalQuality = 'Excellent' | 'Bon' | 'Moyen' | 'Faible';
export type TimeFrame = 'M1' | 'M5' | 'M15' | 'M30' | 'M45' | 'H1' | 'H4' | 'H12' | 'D1' | 'W1' | 'MN';
export type AssetType = 'Forex' | 'XAU/USD' | 'Indices' | 'Crypto' | 'Matières Premières' | 'Actions';

export interface TimeFrameAnalysis {
  timeframe: TimeFrame;
  trend: TrendDirection;
  trendStrength: number; // 0-100
  probability: number; // 0-100
  recommendation: string;
  signal: SignalType;
}

export interface SignalExplanation {
  indicator: string;
  value: string;
  interpretation: string;
}

export interface TradingSignal {
  id: string;
  asset: string;
  assetType: AssetType;
  signal: SignalType;
  confidence: number; // 0-100
  riskLevel: RiskLevel;
  signalQuality: SignalQuality;
  entryPoint: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskRewardRatio: string;
  timestamp: Date;
  explanations: SignalExplanation[];
  timeFrameAnalysis: TimeFrameAnalysis[];
  aiScore: number;
  marketSentiment: 'Bullish' | 'Bearish' | 'Neutral';
  volatility: number; // 0-100
}

export interface PriceData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketOverview {
  asset: string;
  price: number;
  change: number;
  changePercent: number;
  trend: TrendDirection;
  volatility: number;
  marketStrength: number;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  aiScore: number;
}

export interface EconomicEvent {
  id: string;
  time: Date;
  currency: string;
  event: string;
  impact: 'High' | 'Medium' | 'Low';
  actual?: string;
  forecast?: string;
  previous?: string;
}

export interface SignalHistory {
  id: string;
  asset: string;
  signal: SignalType;
  entryPrice: number;
  exitPrice?: number;
  result?: 'Gagnant' | 'Perdant' | 'En cours';
  profit?: number;
  timestamp: Date;
  timeFrame: TimeFrame;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  limitations: string[];
  recommended?: boolean;
}

export interface RiskManagement {
  entryPoint: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskRewardRatio: string;
  lotSize: number;
  riskAmount: number;
  potentialProfit: number;
}

export interface AIInsight {
  type: 'technical' | 'fundamental' | 'sentiment';
  title: string;
  description: string;
  confidence: number;
  timestamp: Date;
}
