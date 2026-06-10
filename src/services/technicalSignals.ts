/**
 * Technical Signals Engine
 * Moteur de détection de signaux techniques avancés
 * Couvre : Tendance, RSI, MACD, EMA, Bollinger, Ichimoku, Price Action, Institutionnel, Risque
 */

import type { CandleData } from './marketApi';
import { calculateRSI, calculateMACD, calculateEMA } from './marketApi';

export type TechnicalSignalType =
  // Tendance
  | 'trend_bullish' | 'trend_bearish' | 'trend_neutral' | 'trend_range' | 'trend_consolidation'
  // Achat/Vente
  | 'buy_signal' | 'sell_signal' | 'neutral_signal' | 'wait_signal' | 'confirmed_buy' | 'confirmed_sell'
  // Supports/Résistances
  | 'breakout_resistance' | 'breakdown_support' | 'bounce_support' | 'reject_resistance'
  | 'pullback_support' | 'pullback_resistance' | 'retest_after_break' | 'false_breakout'
  // RSI
  | 'rsi_overbought' | 'rsi_oversold' | 'rsi_neutral_return' | 'rsi_div_bullish' | 'rsi_div_bearish'
  | 'rsi_trend_break' | 'rsi_confirm_buy' | 'rsi_confirm_sell' | 'rsi_weak_momentum' | 'rsi_strong_momentum'
  // MACD
  | 'macd_bullish_cross' | 'macd_bearish_cross' | 'macd_hist_positive' | 'macd_hist_negative'
  | 'macd_div_bullish' | 'macd_div_bearish' | 'macd_weak_momentum' | 'macd_strong_momentum'
  // EMA
  | 'ema_bullish_cross' | 'ema_bearish_cross' | 'price_above_ema20' | 'price_below_ema20'
  | 'price_above_ema50' | 'price_below_ema50' | 'price_above_ema200' | 'price_below_ema200'
  | 'golden_cross' | 'death_cross' | 'ema_reject' | 'ema_pullback'
  // Bollinger
  | 'bb_squeeze' | 'bb_expansion' | 'bb_break_upper' | 'bb_break_lower' | 'bb_return_mean'
  | 'bb_volatility_signal' | 'bb_reversal' | 'bb_continuation'
  // Volatilité
  | 'high_volatility' | 'low_volatility' | 'volatility_rising' | 'volatility_falling'
  // Price Action
  | 'pin_bar_bullish' | 'pin_bar_bearish' | 'engulfing_bullish' | 'engulfing_bearish'
  | 'doji' | 'hammer' | 'shooting_star' | 'double_top' | 'double_bottom'
  // Institutionnel
  | 'bos_bullish' | 'bos_bearish' | 'choch_bullish' | 'choch_bearish'
  | 'ob_bullish' | 'ob_bearish' | 'fvg_bullish' | 'fvg_bearish'
  | 'liquidity_grab' | 'stop_hunt' | 'accumulation' | 'distribution'
  // Risque
  | 'risk_high' | 'risk_medium' | 'risk_low' | 'news_risk' | 'no_trade_zone'
  | 'contradictory_timeframes' | 'spread_warning' | 'low_volume';

export interface TechnicalSignal {
  type: TechnicalSignalType;
  category: 'trend' | 'entry' | 'sr' | 'rsi' | 'macd' | 'ema' | 'bollinger' | 'volatility' | 'price_action' | 'institutional' | 'risk';
  label: string;
  description: string;
  importance: 'critical' | 'major' | 'minor' | 'info';
  confidence: number; // 0-100
  direction: 'bullish' | 'bearish' | 'neutral';
}

// ─── Signal Definitions ─────────────────────────────────

const SIGNAL_DEFS: Record<TechnicalSignalType, Omit<TechnicalSignal, 'type' | 'confidence'>> = {
  // Tendance
  trend_bullish: { category: 'trend', label: 'Tendance haussière', description: 'Prix au-dessus des moyennes mobiles, structure haussière intacte', importance: 'major', direction: 'bullish' },
  trend_bearish: { category: 'trend', label: 'Tendance baissière', description: 'Prix sous les moyennes mobiles, structure baissière intacte', importance: 'major', direction: 'bearish' },
  trend_neutral: { category: 'trend', label: 'Tendance neutre', description: 'Aucune direction claire, marché sans tendance', importance: 'minor', direction: 'neutral' },
  trend_range: { category: 'trend', label: 'Marché en range', description: 'Prix oscillant entre support et résistance clairs', importance: 'major', direction: 'neutral' },
  trend_consolidation: { category: 'trend', label: 'Consolidation', description: 'Compression de volatilité, rupture imminente possible', importance: 'minor', direction: 'neutral' },
  // Entry
  buy_signal: { category: 'entry', label: 'Signal achat', description: 'Conditions d\'achat réunies', importance: 'critical', direction: 'bullish' },
  sell_signal: { category: 'entry', label: 'Signal vente', description: 'Conditions de vente réunies', importance: 'critical', direction: 'bearish' },
  neutral_signal: { category: 'entry', label: 'Signal neutre', description: 'Aucune direction privilégiée', importance: 'minor', direction: 'neutral' },
  wait_signal: { category: 'entry', label: 'Attendre', description: 'Conditions insuffisantes pour entrer', importance: 'major', direction: 'neutral' },
  confirmed_buy: { category: 'entry', label: 'Achat confirmé', description: 'Signal achat validé par plusieurs confirmations', importance: 'critical', direction: 'bullish' },
  confirmed_sell: { category: 'entry', label: 'Vente confirmée', description: 'Signal vente validé par plusieurs confirmations', importance: 'critical', direction: 'bearish' },
  // S/R
  breakout_resistance: { category: 'sr', label: 'Cassure résistance', description: 'Prix au-dessus d\'une résistance clé', importance: 'critical', direction: 'bullish' },
  breakdown_support: { category: 'sr', label: 'Cassure support', description: 'Prix sous un support clé', importance: 'critical', direction: 'bearish' },
  bounce_support: { category: 'sr', label: 'Rebond support', description: 'Rebond haussier sur un support', importance: 'major', direction: 'bullish' },
  reject_resistance: { category: 'sr', label: 'Rejet résistance', description: 'Rejet baissier sur une résistance', importance: 'major', direction: 'bearish' },
  pullback_support: { category: 'sr', label: 'Pullback support', description: 'Retour sur un support après cassure', importance: 'major', direction: 'bullish' },
  pullback_resistance: { category: 'sr', label: 'Pullback résistance', description: 'Retour sur une résistance après cassure', importance: 'major', direction: 'bearish' },
  retest_after_break: { category: 'sr', label: 'Retest après cassure', description: 'Retest d\'un niveau cassé comme nouveau S/R', importance: 'major', direction: 'neutral' },
  false_breakout: { category: 'sr', label: 'Fausse cassure', description: 'Retour rapide sous/au-dessus du niveau cassé', importance: 'critical', direction: 'neutral' },
  // RSI
  rsi_overbought: { category: 'rsi', label: 'RSI surachat', description: 'RSI > 70 — zone de surachat, attention à la correction', importance: 'major', direction: 'bearish' },
  rsi_oversold: { category: 'rsi', label: 'RSI survente', description: 'RSI < 30 — zone de survente, rebond possible', importance: 'major', direction: 'bullish' },
  rsi_neutral_return: { category: 'rsi', label: 'RSI retour neutre', description: 'RSI revient vers la zone 40-60', importance: 'minor', direction: 'neutral' },
  rsi_div_bullish: { category: 'rsi', label: 'Divergence RSI haussière', description: 'Prix baisse mais RSI monte — signal de force', importance: 'critical', direction: 'bullish' },
  rsi_div_bearish: { category: 'rsi', label: 'Divergence RSI baissière', description: 'Prix monte mais RSI baisse — signal de faiblesse', importance: 'critical', direction: 'bearish' },
  rsi_trend_break: { category: 'rsi', label: 'RSI cassure tendance', description: 'RSI casse sa ligne de tendance', importance: 'major', direction: 'neutral' },
  rsi_confirm_buy: { category: 'rsi', label: 'RSI confirme achat', description: 'RSI croise à la hausse depuis zone 30-50', importance: 'major', direction: 'bullish' },
  rsi_confirm_sell: { category: 'rsi', label: 'RSI confirme vente', description: 'RSI croise à la baisse depuis zone 50-70', importance: 'major', direction: 'bearish' },
  rsi_weak_momentum: { category: 'rsi', label: 'RSI momentum faible', description: 'Faible momentum, signal peu fiable', importance: 'minor', direction: 'neutral' },
  rsi_strong_momentum: { category: 'rsi', label: 'RSI momentum fort', description: 'Fort momentum, signal fiable', importance: 'major', direction: 'neutral' },
  // MACD
  macd_bullish_cross: { category: 'macd', label: 'Croisement MACD haussier', description: 'MACD croise au-dessus de sa ligne de signal', importance: 'major', direction: 'bullish' },
  macd_bearish_cross: { category: 'macd', label: 'Croisement MACD baissier', description: 'MACD croise en-dessous de sa ligne de signal', importance: 'major', direction: 'bearish' },
  macd_hist_positive: { category: 'macd', label: 'Histogramme MACD positif', description: 'Momentum haussier en cours', importance: 'minor', direction: 'bullish' },
  macd_hist_negative: { category: 'macd', label: 'Histogramme MACD négatif', description: 'Momentum baissier en cours', importance: 'minor', direction: 'bearish' },
  macd_div_bullish: { category: 'macd', label: 'Divergence MACD haussière', description: 'Prix baisse mais MACD monte', importance: 'critical', direction: 'bullish' },
  macd_div_bearish: { category: 'macd', label: 'Divergence MACD baissière', description: 'Prix monte mais MACD baisse', importance: 'critical', direction: 'bearish' },
  macd_weak_momentum: { category: 'macd', label: 'MACD momentum faible', description: 'Histogramme faible, manque de conviction', importance: 'minor', direction: 'neutral' },
  macd_strong_momentum: { category: 'macd', label: 'MACD momentum fort', description: 'Histogramme fort, momentum confirmé', importance: 'major', direction: 'neutral' },
  // EMA
  ema_bullish_cross: { category: 'ema', label: 'Croisement EMA haussier', description: 'EMA rapide croise au-dessus de EMA lente', importance: 'major', direction: 'bullish' },
  ema_bearish_cross: { category: 'ema', label: 'Croisement EMA baissier', description: 'EMA rapide croise en-dessous de EMA lente', importance: 'major', direction: 'bearish' },
  price_above_ema20: { category: 'ema', label: 'Prix au-dessus EMA 20', description: 'Tendance courte terme haussière', importance: 'minor', direction: 'bullish' },
  price_below_ema20: { category: 'ema', label: 'Prix sous EMA 20', description: 'Tendance courte terme baissière', importance: 'minor', direction: 'bearish' },
  price_above_ema50: { category: 'ema', label: 'Prix au-dessus EMA 50', description: 'Tendance moyen terme haussière', importance: 'major', direction: 'bullish' },
  price_below_ema50: { category: 'ema', label: 'Prix sous EMA 50', description: 'Tendance moyen terme baissière', importance: 'major', direction: 'bearish' },
  price_above_ema200: { category: 'ema', label: 'Prix au-dessus EMA 200', description: 'Tendance long terme haussière', importance: 'major', direction: 'bullish' },
  price_below_ema200: { category: 'ema', label: 'Prix sous EMA 200', description: 'Tendance long terme baissière', importance: 'major', direction: 'bearish' },
  golden_cross: { category: 'ema', label: 'Golden Cross', description: 'EMA 50 croise au-dessus de EMA 200', importance: 'critical', direction: 'bullish' },
  death_cross: { category: 'ema', label: 'Death Cross', description: 'EMA 50 croise en-dessous de EMA 200', importance: 'critical', direction: 'bearish' },
  ema_reject: { category: 'ema', label: 'Rejet moyenne mobile', description: 'Prix rejeté sur une moyenne mobile', importance: 'major', direction: 'neutral' },
  ema_pullback: { category: 'ema', label: 'Pullback moyenne mobile', description: 'Retour sur la moyenne mobile après éloignement', importance: 'minor', direction: 'neutral' },
  // Bollinger
  bb_squeeze: { category: 'bollinger', label: 'Compression Bollinger', description: 'Bandes resserrées — explosion de volatilité prochaine', importance: 'major', direction: 'neutral' },
  bb_expansion: { category: 'bollinger', label: 'Expansion Bollinger', description: 'Bandes qui s\'écartent — forte volatilité en cours', importance: 'minor', direction: 'neutral' },
  bb_break_upper: { category: 'bollinger', label: 'Cassure bande supérieure', description: 'Prix au-dessus de la bande supérieure', importance: 'major', direction: 'bullish' },
  bb_break_lower: { category: 'bollinger', label: 'Cassure bande inférieure', description: 'Prix sous la bande inférieure', importance: 'major', direction: 'bearish' },
  bb_return_mean: { category: 'bollinger', label: 'Retour moyenne Bollinger', description: 'Prix revient vers la moyenne centrale', importance: 'minor', direction: 'neutral' },
  bb_volatility_signal: { category: 'bollinger', label: 'Signal volatilité Bollinger', description: 'Changement de régime de volatilité détecté', importance: 'major', direction: 'neutral' },
  bb_reversal: { category: 'bollinger', label: 'Retournement Bollinger', description: 'Rejet sur bande avec retour vers la moyenne', importance: 'critical', direction: 'neutral' },
  bb_continuation: { category: 'bollinger', label: 'Continuation Bollinger', description: 'Marche le long de la bande = tendance forte', importance: 'major', direction: 'neutral' },
  // Volatilité
  high_volatility: { category: 'volatility', label: 'Forte volatilité', description: 'ATR élevé — prudence recommandée', importance: 'major', direction: 'neutral' },
  low_volatility: { category: 'volatility', label: 'Faible volatilité', description: 'ATR faible — compression possible', importance: 'minor', direction: 'neutral' },
  volatility_rising: { category: 'volatility', label: 'Volatilité en hausse', description: 'Le marché s\'accélère', importance: 'major', direction: 'neutral' },
  volatility_falling: { category: 'volatility', label: 'Volatilité en baisse', description: 'Le marché se calme', importance: 'minor', direction: 'neutral' },
  // Price Action
  pin_bar_bullish: { category: 'price_action', label: 'Pin bar haussière', description: 'Rejet fort des prix bas — mèche inférieure longue', importance: 'major', direction: 'bullish' },
  pin_bar_bearish: { category: 'price_action', label: 'Pin bar baissière', description: 'Rejet fort des prix hauts — mèche supérieure longue', importance: 'major', direction: 'bearish' },
  engulfing_bullish: { category: 'price_action', label: 'Engulfing haussier', description: 'Bougie haussière qui englobe la précédente', importance: 'critical', direction: 'bullish' },
  engulfing_bearish: { category: 'price_action', label: 'Engulfing baissier', description: 'Bougie baissière qui englobe la précédente', importance: 'critical', direction: 'bearish' },
  doji: { category: 'price_action', label: 'Doji', description: 'Indécision — ouverture = clôture', importance: 'minor', direction: 'neutral' },
  hammer: { category: 'price_action', label: 'Marteau', description: 'Rejet des bas après tendance baissière', importance: 'major', direction: 'bullish' },
  shooting_star: { category: 'price_action', label: 'Étoile filante', description: 'Rejet des hauts après tendance haussière', importance: 'major', direction: 'bearish' },
  double_top: { category: 'price_action', label: 'Double top', description: 'Deux sommets à même niveau — retournement baissier', importance: 'critical', direction: 'bearish' },
  double_bottom: { category: 'price_action', label: 'Double bottom', description: 'Deux creux à même niveau — retournement haussier', importance: 'critical', direction: 'bullish' },
  // Institutionnel
  bos_bullish: { category: 'institutional', label: 'BOS haussier', description: 'Break of Structure haussier — nouveaux sommets', importance: 'major', direction: 'bullish' },
  bos_bearish: { category: 'institutional', label: 'BOS baissier', description: 'Break of Structure baissier — nouveaux creux', importance: 'major', direction: 'bearish' },
  choch_bullish: { category: 'institutional', label: 'CHOCH haussier', description: 'Change of Character haussier — fin de tendance baissière', importance: 'critical', direction: 'bullish' },
  choch_bearish: { category: 'institutional', label: 'CHOCH baissier', description: 'Change of Character baissier — fin de tendance haussière', importance: 'critical', direction: 'bearish' },
  ob_bullish: { category: 'institutional', label: 'Order Block haussier', description: 'Zone d\'accumulation institutionnelle haussière', importance: 'major', direction: 'bullish' },
  ob_bearish: { category: 'institutional', label: 'Order Block baissier', description: 'Zone de distribution institutionnelle baissière', importance: 'major', direction: 'bearish' },
  fvg_bullish: { category: 'institutional', label: 'FVG haussier', description: 'Fair Value Gap haussier — vide de prix à combler', importance: 'major', direction: 'bullish' },
  fvg_bearish: { category: 'institutional', label: 'FVG baissier', description: 'Fair Value Gap baissier — vide de prix à combler', importance: 'major', direction: 'bearish' },
  liquidity_grab: { category: 'institutional', label: 'Grab de liquidité', description: 'Mouvement pour chasser les stops', importance: 'major', direction: 'neutral' },
  stop_hunt: { category: 'institutional', label: 'Stop Hunt', description: 'Mouvement artificiel pour déclencher les stops', importance: 'critical', direction: 'neutral' },
  accumulation: { category: 'institutional', label: 'Accumulation', description: 'Les institutions accumulent discrètement', importance: 'major', direction: 'bullish' },
  distribution: { category: 'institutional', label: 'Distribution', description: 'Les institutions distribuent discrètement', importance: 'major', direction: 'bearish' },
  // Risque
  risk_high: { category: 'risk', label: 'Risque élevé', description: 'Conditions défavorables — risque excessif', importance: 'critical', direction: 'neutral' },
  risk_medium: { category: 'risk', label: 'Risque moyen', description: 'Prudence recommandée', importance: 'major', direction: 'neutral' },
  risk_low: { category: 'risk', label: 'Risque faible', description: 'Conditions favorables', importance: 'minor', direction: 'neutral' },
  news_risk: { category: 'risk', label: 'Risque news', description: 'Annonce économique proche', importance: 'major', direction: 'neutral' },
  no_trade_zone: { category: 'risk', label: 'No Trade Zone', description: 'Conditions non favorables au trading', importance: 'critical', direction: 'neutral' },
  contradictory_timeframes: { category: 'risk', label: 'Timeframes contradictoires', description: 'Les timeframes ne s\'accordent pas', importance: 'major', direction: 'neutral' },
  spread_warning: { category: 'risk', label: 'Spread élevé', description: 'Spread anormalement large', importance: 'minor', direction: 'neutral' },
  low_volume: { category: 'risk', label: 'Volume faible', description: 'Faible volume — signal moins fiable', importance: 'minor', direction: 'neutral' },
};

// ─── Detection Engine ───────────────────────────────────

export function detectAllSignals(candles: CandleData[], currentPrice: number): TechnicalSignal[] {
  const signals: TechnicalSignal[] = [];
  if (candles.length < 20) return signals;

  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const opens = candles.map(c => c.open);

  // RSI
  const rsi = closes.length >= 15 ? calculateRSI(closes, 14) : 50;
  if (rsi > 70) signals.push(makeSignal('rsi_overbought', 85));
  else if (rsi < 30) signals.push(makeSignal('rsi_oversold', 85));
  else if (rsi > 55) signals.push(makeSignal('rsi_confirm_sell', 60));
  else if (rsi < 45) signals.push(makeSignal('rsi_confirm_buy', 60));
  else signals.push(makeSignal('rsi_neutral_return', 40));

  // RSI Divergence
  const rsiDiv = detectRSIDivergence(closes, highs, lows);
  if (rsiDiv === 'bullish') signals.push(makeSignal('rsi_div_bullish', 75));
  if (rsiDiv === 'bearish') signals.push(makeSignal('rsi_div_bearish', 75));

  // MACD
  const macdResult = calculateMACD(closes);
  if (macdResult) {
    const macdLine = macdResult.macd;
    const signalLine = macdResult.signal;
    if (macdLine.length >= 2 && signalLine.length >= 2) {
      const curr = macdLine[macdLine.length - 1];
      const prev = macdLine[macdLine.length - 2];
      const currSig = signalLine[signalLine.length - 1];
      const prevSig = signalLine[signalLine.length - 2];
      if (prev <= prevSig && curr > currSig) signals.push(makeSignal('macd_bullish_cross', 80));
      if (prev >= prevSig && curr < currSig) signals.push(makeSignal('macd_bearish_cross', 80));
      if (curr > 0) signals.push(makeSignal('macd_hist_positive', 50));
      else signals.push(makeSignal('macd_hist_negative', 50));
    }
  }

  // EMA
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, 50); // fallback if not enough data
  if (ema20.length > 0) {
    const lastEma20 = ema20[ema20.length - 1];
    if (currentPrice > lastEma20) signals.push(makeSignal('price_above_ema20', 60));
    else signals.push(makeSignal('price_below_ema20', 60));
  }
  if (ema50.length > 0) {
    const lastEma50 = ema50[ema50.length - 1];
    if (currentPrice > lastEma50) signals.push(makeSignal('price_above_ema50', 65));
    else signals.push(makeSignal('price_below_ema50', 65));
  }

  // Trend detection
  const last20 = closes.slice(-20);
  const trendUp = last20[last20.length - 1] > last20[0];
  const trendDown = last20[last20.length - 1] < last20[0];
  const inRange = Math.abs(last20[last20.length - 1] - last20[0]) / last20[0] < 0.005;
  if (trendUp && !inRange) signals.push(makeSignal('trend_bullish', 70));
  else if (trendDown && !inRange) signals.push(makeSignal('trend_bearish', 70));
  else if (inRange) signals.push(makeSignal('trend_range', 55));
  else signals.push(makeSignal('trend_neutral', 40));

  // Price Action
  const lastCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];
  if (lastCandle && prevCandle) {
    const body = Math.abs(lastCandle.close - lastCandle.open);
    const upperWick = lastCandle.high - Math.max(lastCandle.open, lastCandle.close);
    const lowerWick = Math.min(lastCandle.open, lastCandle.close) - lastCandle.low;
    if (lowerWick > body * 2 && upperWick < body) signals.push(makeSignal('pin_bar_bullish', 70));
    if (upperWick > body * 2 && lowerWick < body) signals.push(makeSignal('pin_bar_bearish', 70));
    if (body > Math.abs(prevCandle.close - prevCandle.open) * 1.5 &&
        (lastCandle.close > lastCandle.open) !== (prevCandle.close > prevCandle.open)) {
      if (lastCandle.close > lastCandle.open) signals.push(makeSignal('engulfing_bullish', 80));
      else signals.push(makeSignal('engulfing_bearish', 80));
    }
    if (body < 0.001 * currentPrice) signals.push(makeSignal('doji', 35));
    if (lastCandle.close > lastCandle.open && lowerWick > body * 1.5 && trendDown) signals.push(makeSignal('hammer', 75));
  }

  // Volatility (ATR approximation)
  const atr = calculateATR(candles.slice(-14));
  const atrPct = (atr / currentPrice) * 100;
  if (atrPct > 0.5) signals.push(makeSignal('high_volatility', 65));
  else if (atrPct < 0.1) signals.push(makeSignal('low_volatility', 45));

  // Bollinger approximation
  const bbSignals = detectBollingerSignals(closes, currentPrice);
  signals.push(...bbSignals);

  // Risk assessment
  if (atrPct > 1.0) signals.push(makeSignal('risk_high', 70));
  else if (signals.filter(s => s.direction === 'bullish').length >= 3 && signals.filter(s => s.direction === 'bearish').length >= 3) {
    signals.push(makeSignal('contradictory_timeframes', 60));
  }

  return signals;
}

// ─── Helpers ────────────────────────────────────────────

function makeSignal(type: TechnicalSignalType, confidence: number): TechnicalSignal {
  const def = SIGNAL_DEFS[type];
  return { type, ...def, confidence };
}

function detectRSIDivergence(closes: number[], highs: number[], lows: number[]): 'bullish' | 'bearish' | null {
  if (closes.length < 10) return null;
  const rsiVals: number[] = [];
  for (let i = 14; i < closes.length; i++) {
    const slice = closes.slice(i - 14, i);
    rsiVals.push(calculateRSI(slice, 14));
  }
  if (rsiVals.length < 5) return null;
  const last5Price = closes.slice(-5);
  const last5RSI = rsiVals.slice(-5);
  // Bullish div: price lower low, RSI higher low
  if (last5Price[2] < last5Price[0] && last5RSI[2] > last5RSI[0]) return 'bullish';
  // Bearish div: price higher high, RSI lower high
  if (last5Price[2] > last5Price[0] && last5RSI[2] < last5RSI[0]) return 'bearish';
  return null;
}

function calculateATR(candles: CandleData[]): number {
  if (candles.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < candles.length; i++) {
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    sum += tr;
  }
  return sum / (candles.length - 1);
}

function detectBollingerSignals(closes: number[], currentPrice: number): TechnicalSignal[] {
  if (closes.length < 20) return [];
  const period = 20;
  const slice = closes.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period);
  const upper = mean + 2 * std;
  const lower = mean - 2 * std;
  const bandWidth = (upper - lower) / mean;

  const signals: TechnicalSignal[] = [];
  if (bandWidth < 0.01) signals.push(makeSignal('bb_squeeze', 70));
  if (currentPrice > upper) signals.push(makeSignal('bb_break_upper', 65));
  if (currentPrice < lower) signals.push(makeSignal('bb_break_lower', 65));
  const prevPrice = closes[closes.length - 2];
  if ((prevPrice > upper || prevPrice < lower) && Math.abs(currentPrice - mean) < std) {
    signals.push(makeSignal('bb_return_mean', 60));
  }
  return signals;
}

// ─── Filter utilities ───────────────────────────────────

export function filterSignalsByCategory(signals: TechnicalSignal[], category: TechnicalSignal['category']): TechnicalSignal[] {
  return signals.filter(s => s.category === category);
}

export function getCriticalSignals(signals: TechnicalSignal[]): TechnicalSignal[] {
  return signals.filter(s => s.importance === 'critical');
}

export function getBullishSignals(signals: TechnicalSignal[]): TechnicalSignal[] {
  return signals.filter(s => s.direction === 'bullish');
}

export function getBearishSignals(signals: TechnicalSignal[]): TechnicalSignal[] {
  return signals.filter(s => s.direction === 'bearish');
}

export function countByCategory(signals: TechnicalSignal[]): Record<string, number> {
  return signals.reduce((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

export function countByDirection(signals: TechnicalSignal[]): { bullish: number; bearish: number; neutral: number } {
  return {
    bullish: signals.filter(s => s.direction === 'bullish').length,
    bearish: signals.filter(s => s.direction === 'bearish').length,
    neutral: signals.filter(s => s.direction === 'neutral').length,
  };
}
