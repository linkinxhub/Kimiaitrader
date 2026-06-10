import type { TimeFrameAnalysis, TradingSignal, MarketOverview, EconomicEvent, SignalHistory, AIInsight, PriceData, SubscriptionPlan } from '@/types/trading';

export const generatePriceData = (basePrice: number, count: number = 50): PriceData[] => {
  const data: PriceData[] = [];
  let price = basePrice;
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.48) * price * 0.002;
    const open = price;
    price += change;
    const high = Math.max(open, price) + Math.random() * price * 0.001;
    const low = Math.min(open, price) - Math.random() * price * 0.001;
    
    data.push({
      timestamp: now - (count - i) * 60000,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(price.toFixed(2)),
      volume: Math.floor(Math.random() * 10000 + 5000),
    });
  }
  return data;
};

export const timeFrameAnalyses: TimeFrameAnalysis[] = [
  { timeframe: 'M1', trend: 'HAUSSIÈRE', trendStrength: 72, probability: 68, recommendation: 'Achat Faible', signal: 'ACHAT' },
  { timeframe: 'M5', trend: 'HAUSSIÈRE', trendStrength: 78, probability: 74, recommendation: 'Achat Modéré', signal: 'ACHAT' },
  { timeframe: 'M15', trend: 'HAUSSIÈRE', trendStrength: 85, probability: 82, recommendation: 'Achat Fort', signal: 'ACHAT' },
  { timeframe: 'M30', trend: 'HAUSSIÈRE', trendStrength: 88, probability: 86, recommendation: 'Achat Fort', signal: 'ACHAT' },
  { timeframe: 'M45', trend: 'HAUSSIÈRE', trendStrength: 82, probability: 79, recommendation: 'Achat Modéré', signal: 'ACHAT' },
  { timeframe: 'H1', trend: 'HAUSSIÈRE', trendStrength: 91, probability: 89, recommendation: 'Achat Confirmé', signal: 'ACHAT' },
  { timeframe: 'H4', trend: 'HAUSSIÈRE', trendStrength: 76, probability: 73, recommendation: 'Hausse Modérée', signal: 'ACHAT' },
  { timeframe: 'H12', trend: 'HAUSSIÈRE', trendStrength: 69, probability: 65, recommendation: 'Tendance Haussière', signal: 'ACHAT' },
  { timeframe: 'D1', trend: 'HAUSSIÈRE', trendStrength: 83, probability: 80, recommendation: 'Tendance Haussière', signal: 'ACHAT' },
  { timeframe: 'W1', trend: 'HAUSSIÈRE', trendStrength: 79, probability: 75, recommendation: 'Biais Haussier', signal: 'ACHAT' },
  { timeframe: 'MN', trend: 'HAUSSIÈRE', trendStrength: 71, probability: 68, recommendation: 'Biais Haussier', signal: 'ACHAT' },
];

export const currentSignal: TradingSignal = {
  id: 'sig-xau-001',
  asset: 'XAU/USD',
  assetType: 'XAU/USD',
  signal: 'ACHAT',
  confidence: 94,
  riskLevel: 'Faible',
  signalQuality: 'Excellent',
  entryPoint: 4470.00,
  stopLoss: 4450.00,
  takeProfit1: 4490.00,
  takeProfit2: 4510.00,
  takeProfit3: 4535.00,
  riskRewardRatio: '1:3.5',
  timestamp: new Date(),
  explanations: [
    { indicator: 'RSI (M15)', value: '32.4', interpretation: 'RSI en zone de survente, rebond imminent' },
    { indicator: 'MACD (H1)', value: 'Croisement haussier', interpretation: 'Croisement MACD haussier confirmé sur H1' },
    { indicator: 'Support', value: '4465.00', interpretation: 'Rebond sur support majeur testé 3 fois' },
    { indicator: 'Ichimoku', value: 'Nuage', interpretation: 'Prix au-dessus du nuage Ichimoku' },
    { indicator: 'EMA 200', value: '3368.00', interpretation: 'Prix bien au-dessus de l\'EMA 200' },
    { indicator: 'Structure', value: 'BOS', interpretation: 'Break of Structure haussier détecté' },
  ],
  timeFrameAnalysis: timeFrameAnalyses,
  aiScore: 94,
  marketSentiment: 'Bullish',
  volatility: 42,
};

export const marketOverview: MarketOverview[] = [
  { asset: 'XAU/USD', price: 4470.00, change: 15.40, changePercent: 0.35, trend: 'HAUSSIÈRE', volatility: 42, marketStrength: 78, sentiment: 'Bullish', aiScore: 94 },
  { asset: 'EUR/USD', price: 1.0845, change: 0.0023, changePercent: 0.21, trend: 'HAUSSIÈRE', volatility: 35, marketStrength: 65, sentiment: 'Bullish', aiScore: 82 },
  { asset: 'GBP/USD', price: 1.2730, change: -0.0015, changePercent: -0.12, trend: 'BAISSIÈRE', volatility: 38, marketStrength: 42, sentiment: 'Bearish', aiScore: 68 },
  { asset: 'USD/JPY', price: 151.80, change: 0.25, changePercent: 0.16, trend: 'HAUSSIÈRE', volatility: 40, marketStrength: 71, sentiment: 'Bullish', aiScore: 75 },
  { asset: 'BTC/USD', price: 67540.00, change: 1230.00, changePercent: 1.86, trend: 'HAUSSIÈRE', volatility: 68, marketStrength: 85, sentiment: 'Bullish', aiScore: 88 },
  { asset: 'US30', price: 42150.00, change: 125.00, changePercent: 0.30, trend: 'HAUSSIÈRE', volatility: 45, marketStrength: 72, sentiment: 'Bullish', aiScore: 79 },
  { asset: 'USOIL', price: 78.45, change: -0.32, changePercent: -0.41, trend: 'BAISSIÈRE', volatility: 55, marketStrength: 38, sentiment: 'Bearish', aiScore: 61 },
  { asset: 'NAS100', price: 18560.00, change: 89.00, changePercent: 0.48, trend: 'HAUSSIÈRE', volatility: 48, marketStrength: 80, sentiment: 'Bullish', aiScore: 85 },
];

export const economicEvents: EconomicEvent[] = [
  { id: 'evt-001', time: new Date(Date.now() + 3600000), currency: 'USD', event: 'NFP (Non-Farm Payrolls)', impact: 'High', forecast: '220K', previous: '185K' },
  { id: 'evt-002', time: new Date(Date.now() + 7200000), currency: 'USD', event: 'Taux de chômage', impact: 'High', forecast: '3.7%', previous: '3.8%' },
  { id: 'evt-003', time: new Date(Date.now() + 10800000), currency: 'EUR', event: 'IPC Zone Euro', impact: 'High', forecast: '2.4%', previous: '2.5%' },
  { id: 'evt-004', time: new Date(Date.now() + 14400000), currency: 'USD', event: 'Discours Powell (FED)', impact: 'High' },
  { id: 'evt-005', time: new Date(Date.now() + 18000000), currency: 'GBP', event: 'PIB Royaume-Uni', impact: 'Medium', forecast: '0.3%', previous: '0.2%' },
  { id: 'evt-006', time: new Date(Date.now() + 86400000), currency: 'USD', event: 'Inventaires pétrole', impact: 'Medium', forecast: '-1.2M', previous: '-0.8M' },
];

export const signalHistory: SignalHistory[] = [
  { id: 'hist-001', asset: 'XAU/USD', signal: 'ACHAT', entryPrice: 3365.00, exitPrice: 3385.00, result: 'Gagnant', profit: 200.00, timestamp: new Date(Date.now() - 86400000), timeFrame: 'H1' },
  { id: 'hist-002', asset: 'EUR/USD', signal: 'VENTE', entryPrice: 1.0870, exitPrice: 1.0830, result: 'Gagnant', profit: 40.00, timestamp: new Date(Date.now() - 172800000), timeFrame: 'H4' },
  { id: 'hist-003', asset: 'BTC/USD', signal: 'ACHAT', entryPrice: 65800.00, exitPrice: 67200.00, result: 'Gagnant', profit: 1400.00, timestamp: new Date(Date.now() - 259200000), timeFrame: 'D1' },
  { id: 'hist-004', asset: 'GBP/USD', signal: 'ACHAT', entryPrice: 1.2750, exitPrice: 1.2710, result: 'Perdant', profit: -40.00, timestamp: new Date(Date.now() - 345600000), timeFrame: 'H1' },
  { id: 'hist-005', asset: 'XAU/USD', signal: 'VENTE', entryPrice: 4490.00, exitPrice: 4470.00, result: 'Gagnant', profit: 200.00, timestamp: new Date(Date.now() - 432000000), timeFrame: 'H4' },
  { id: 'hist-006', asset: 'US30', signal: 'ACHAT', entryPrice: 41800.00, exitPrice: 42200.00, result: 'Gagnant', profit: 400.00, timestamp: new Date(Date.now() - 518400000), timeFrame: 'D1' },
];

export const aiInsights: AIInsight[] = [
  { type: 'technical', title: 'Golden Cross détecté', description: 'Croisement haussier EMA 50/200 sur XAU/USD en daily', confidence: 87, timestamp: new Date() },
  { type: 'fundamental', title: 'Impact FED imminent', description: 'Le discours de Powell pourrait créer une volatilité de 150+ pips', confidence: 92, timestamp: new Date() },
  { type: 'sentiment', title: 'Sentiment haussier dominant', description: '78% des traders sont acheteurs sur l\'or actuellement', confidence: 75, timestamp: new Date() },
  { type: 'technical', title: 'Pattern Triangle Ascendant', description: 'Formation en cours sur EUR/USD H4, rupture attendue', confidence: 81, timestamp: new Date() },
];

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'mois',
    features: ['Analyse M15 limitée', '1 signal par jour', 'Dashboard basique'],
    limitations: ['Pas d\'analyse multi-timeframes', 'Pas de notifications', 'Pas de gestion du risque'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 79,
    period: 'mois',
    features: ['Analyse multi-timeframes complète', 'Signaux illimités', 'Notifications push + Telegram', 'Module XAU/USD premium', 'Calendrier économique'],
    limitations: [],
    recommended: true,
  },
  {
    id: 'expert',
    name: 'Expert',
    price: 199,
    period: 'mois',
    features: ['Tout le pack Pro', 'API trading', 'Support dédié 24/7', 'Stratégies personnalisées IA', 'Accès anticipé aux features'],
    limitations: [],
  },
  {
    id: 'institutional',
    name: 'Institutionnel',
    price: 499,
    period: 'mois',
    features: ['Tout le pack Expert', 'Multi-comptes (10)', 'White label possible', 'API prioritaire', 'Account manager dédié', 'Formation équipe incluse', 'SLA garanti 99.9%'],
    limitations: [],
  },
];

export const technicalIndicators = [
  { name: 'RSI (14)', value: '32.4', signal: 'Survente', status: 'bullish' as const },
  { name: 'MACD', value: '0.45', signal: 'Croisement haussier', status: 'bullish' as const },
  { name: 'EMA 20', value: '4465.20', signal: 'Support dynamique', status: 'bullish' as const },
  { name: 'EMA 50', value: '3368.50', signal: 'Tendance haussière', status: 'bullish' as const },
  { name: 'EMA 200', value: '3345.00', signal: 'Tendance majeure haussière', status: 'bullish' as const },
  { name: 'Bollinger Bands', value: 'Étroites', signal: 'Compression - explosion imminent', status: 'neutral' as const },
  { name: 'Stochastic', value: '25.3', signal: 'Zone de survente', status: 'bullish' as const },
  { name: 'ATR (14)', value: '18.5', signal: 'Volatilité modérée', status: 'neutral' as const },
  { name: 'Ichimoku', value: 'Au-dessus du nuage', signal: 'Haussier', status: 'bullish' as const },
  { name: 'Volume', value: '125% moy.', signal: 'Volume confirmant', status: 'bullish' as const },
];
