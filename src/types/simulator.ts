export type SignalType = 'ACHAT' | 'VENTE' | 'ATTENTE';
export type SimulationMode = 'manual' | 'signal' | 'multi' | 'historical';
export type TradeStatus = 'open' | 'closed_win' | 'closed_loss' | 'pending';

export interface Simulation {
  id: string;
  asset: string;
  mode: SimulationMode;
  signalType: string;
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  direction: SignalType;
  pnl: number;
  pnlPercent: number;
  riskReward: string;
  status: TradeStatus;
  openedAt: Date;
  closedAt?: Date;
  duration?: number; // seconds
  aiCommentary?: string;
}

export interface SimulatorState {
  virtualCapital: number;
  initialCapital: number;
  totalPnL: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  maxDrawdown: number;
  currentDrawdown: number;
  simulations: Simulation[];
}

export interface SignalDefinition {
  id: string;
  name: string;
  type: SignalType;
  confidence: number;
  riskLevel: 'Faible' | 'Modéré' | 'Élevé';
  description: string;
  entryConditions: string[];
  exitConditions: string[];
}

export const SIGNAL_TYPES: SignalDefinition[] = [
  { id: 'buy_rsi', name: 'RSI Survente', type: 'ACHAT', confidence: 75, riskLevel: 'Modéré', description: 'RSI sous 30 indique une survente, rebond probable', entryConditions: ['RSI < 30', 'Bullish divergence'], exitConditions: ['RSI > 50', 'Résistance atteinte'] },
  { id: 'sell_rsi', name: 'RSI Surachat', type: 'VENTE', confidence: 72, riskLevel: 'Modéré', description: 'RSI au-dessus de 70 indique un surachat', entryConditions: ['RSI > 70', 'Bearish divergence'], exitConditions: ['RSI < 50', 'Support atteint'] },
  { id: 'buy_macd', name: 'MACD Croisement Haussier', type: 'ACHAT', confidence: 80, riskLevel: 'Faible', description: 'Croisement MACD au-dessus de la ligne de signal', entryConditions: ['MACD croise au-dessus', 'Histogramme positif'], exitConditions: ['MACD croise en dessous', 'TP atteint'] },
  { id: 'sell_macd', name: 'MACD Croisement Baissier', type: 'VENTE', confidence: 78, riskLevel: 'Faible', description: 'Croisement MACD en dessous de la ligne de signal', entryConditions: ['MACD croise en dessous', 'Histogramme négatif'], exitConditions: ['MACD croise au-dessus', 'TP atteint'] },
  { id: 'buy_support', name: 'Rebond Support', type: 'ACHAT', confidence: 82, riskLevel: 'Faible', description: 'Prix rebondit sur un support testé multiple fois', entryConditions: ['Prix touche support', 'Rejet haussier', 'Volume haussier'], exitConditions: ['Support cassé', 'Résistance atteinte'] },
  { id: 'sell_resistance', name: 'Rejet Résistance', type: 'VENTE', confidence: 80, riskLevel: 'Faible', description: 'Prix rejeté sur une résistance forte', entryConditions: ['Prix touche résistance', 'Rejet baissier', 'Volume faible'], exitConditions: ['Résistance cassée', 'Support atteint'] },
  { id: 'buy_breakout', name: 'Breakout Haussier', type: 'ACHAT', confidence: 70, riskLevel: 'Élevé', description: 'Rupture haussière au-dessus d\'une résistance', entryConditions: ['Close au-dessus résistance', 'Volume haussier', 'Retest confirmé'], exitConditions: ['Retour sous résistance', 'TP atteint'] },
  { id: 'sell_breakdown', name: 'Breakdown Baissier', type: 'VENTE', confidence: 68, riskLevel: 'Élevé', description: 'Rupture baissière sous un support', entryConditions: ['Close sous support', 'Volume haussier', 'Retest confirmé'], exitConditions: ['Retour au-dessus support', 'TP atteint'] },
  { id: 'buy_ichimoku', name: 'Ichimoku Kumo Breakout', type: 'ACHAT', confidence: 85, riskLevel: 'Faible', description: 'Prix sort du nuage Ichimoku par le haut', entryConditions: ['Prix au-dessus du nuage', 'Tenkan > Kijun', 'ChikouSpan haussier'], exitConditions: ['Retour dans le nuage', 'Tenkan croise Kijun'] },
  { id: 'buy_smart', name: 'Smart Money Order Block', type: 'ACHAT', confidence: 88, riskLevel: 'Modéré', description: 'Order Block haussier avec FVG', entryConditions: ['Order Block identifié', 'FVG haussier', 'Prix en zone discount'], exitConditions: ['OB cassé', 'Zone premium atteinte'] },
  { id: 'buy_fvg', name: 'Fair Value Gap Fill', type: 'ACHAT', confidence: 78, riskLevel: 'Modéré', description: 'Prix revient combler un FVG', entryConditions: ['FVG identifié', 'Prix entre dans FVG', 'Momentum haussier'], exitConditions: ['FVG comblé', 'Résistance atteinte'] },
  { id: 'sell_news', name: 'News High Impact', type: 'VENTE', confidence: 65, riskLevel: 'Élevé', description: 'Impact de news économique majeure', entryConditions: ['News high impact', 'Volatilité élevée', 'Direction confirmée'], exitConditions: ['Volatilité réduite', 'TP atteint'] },
  { id: 'buy_ema', name: 'EMA Golden Cross', type: 'ACHAT', confidence: 82, riskLevel: 'Faible', description: 'Croisement EMA 50 au-dessus de EMA 200', entryConditions: ['EMA50 > EMA200', 'Prix au-dessus EMA50', 'Momentum positif'], exitConditions: ['Death cross', 'TP atteint'] },
  { id: 'sell_ema', name: 'EMA Death Cross', type: 'VENTE', confidence: 80, riskLevel: 'Faible', description: 'Croisement EMA 50 sous EMA 200', entryConditions: ['EMA50 < EMA200', 'Prix sous EMA50', 'Momentum négatif'], exitConditions: ['Golden cross', 'TP atteint'] },
  { id: 'buy_retest', name: 'Retest Support', type: 'ACHAT', confidence: 76, riskLevel: 'Modéré', description: 'Retest d\'un ancien support devenu résistance', entryConditions: ['Support ancien testé', 'Bounce confirmé', 'Volume'], exitConditions: ['Support cassé', 'Résistance atteinte'] },
  { id: 'buy_xau', name: 'XAU/USD Premium', type: 'ACHAT', confidence: 90, riskLevel: 'Faible', description: 'Signal spécial Or basé sur multi-timeframes', entryConditions: ['Zone discount', 'FVG haussier', 'Smart Money confluence'], exitConditions: ['Zone premium', 'TP3 atteint'] },
  { id: 'sell_stop_hunt', name: 'Stop Hunt + Reversal', type: 'VENTE', confidence: 74, riskLevel: 'Élevé', description: 'Stop hunt au nord suivi d\'un retournement', entryConditions: ['Stop hunt détecté', 'CHOCH baissier', 'Volume anormal'], exitConditions: ['Nouveau BOS haussier', 'TP atteint'] },
];
