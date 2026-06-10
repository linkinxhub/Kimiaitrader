/**
 * Strategy Library — Bibliotheque professionnelle de 20 strategies de trading
 * Chaque strategie inclut : description, regles, marchés, timeframes, indicateurs,
 * signaux, gestion du risque, difficulte, et metadata pour grading dynamique.
 */

export type StrategyCategory = 'trend' | 'momentum' | 'mean_reversion' | 'breakout' | 'institutional' | 'multi_timeframe' | 'news_based';
export type DifficultyLevel = 'debutant' | 'intermediaire' | 'avance';
export type RiskLevel = 'faible' | 'moyen' | 'eleve';
export type TradingStyle = 'scalping' | 'day_trading' | 'swing_trading' | 'position_trading';

export interface Strategy {
  id: string;
  name: string;
  shortName: string;
  category: StrategyCategory;
  categoryLabel: string;
  style: TradingStyle;
  difficulty: DifficultyLevel;
  riskLevel: RiskLevel;
  description: string;
  objective: string;
  markets: string[];
  assets: string[];
  timeframes: string[];
  indicators: string[];
  idealMarket: string;
  avoidMarket: string;
  buySignal: string;
  sellSignal: string;
  stopLossRule: string;
  takeProfitRule: string;
  recommendedRR: string;
  reliabilityScore: number; // 0-100 base
  advantages: string[];
  disadvantages: string[];
  commonErrors: string[];
  whenNotToUse: string[];
  aiSummary: string;
  status: 'active' | 'test' | 'advanced' | 'risky';
  priority: number; // 1=high, 2=medium, 3=low
}

// ─── 20 STRATEGIES PROFESSIONNELLES ─────────────────────

export const STRATEGIES: Strategy[] = [
  // ─── 1. ICHIMOKU ──────────────────────────────────────
  {
    id: 'ichimoku',
    name: 'Strategie Ichimoku Complete',
    shortName: 'Ichimoku',
    category: 'trend',
    categoryLabel: 'Tendance',
    style: 'swing_trading',
    difficulty: 'avance',
    riskLevel: 'moyen',
    description: 'Strategie japonaise complete utilisant le nuage Ichimoku pour identifier la tendance, les supports, resistances et le momentum. Historiquement utilisee sur les marches asiatiques.',
    objective: 'Identifier la tendance dominante et entrer dans la direction du nuage avec confirmation multi-elements.',
    markets: ['Forex', 'XAU/USD', 'Indices', 'Crypto'],
    assets: ['XAU/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'BTC/USD', 'ETH/USD', 'NAS100', 'DE40'],
    timeframes: ['H1', 'H4', 'D1'],
    indicators: ['Tenkan-sen', 'Kijun-sen', 'Nuage Kumo', 'Chikou Span'],
    idealMarket: 'Marche en tendance claire, prix au-dessus ou sous le nuage',
    avoidMarket: 'Marche range, prix dans le nuage sans direction',
    buySignal: 'Prix au-dessus du nuage + Tenkan croise Kijun a la hausse + Chikou Span au-dessus du prix',
    sellSignal: 'Prix sous le nuage + Tenkan croise Kijun a la baisse + Chikou Span sous le prix',
    stopLossRule: 'Sous Kijun-sen pour achat, au-dessus de Kijun-sen pour vente',
    takeProfitRule: 'Prochaine zone de support/resistance ou retest du nuage',
    recommendedRR: '1:2 a 1:3',
    reliabilityScore: 78,
    advantages: ['Vision complete tendance + S/R + momentum', 'Filtre naturel des ranges', 'Fonctionne sur tous les marches en tendance'],
    disadvantages: ['Complexe pour debutants', 'Moins efficace en range', 'Necessite H1 minimum'],
    commonErrors: ['Trader dans le nuage', 'Ignorer Chikou Span', 'Utiliser en M15 sans confirmation'],
    whenNotToUse: ['Prix dans le nuage', 'Marché range sans direction', 'Volatilite extreme post-news'],
    aiSummary: 'Strategie a fort potentiel en tendance. Efficace sur XAU/USD H4. Eviter en range. Attendre confirmation complete (prix + nuage + Chikou) avant entree.',
    status: 'active',
    priority: 1,
  },

  // ─── 2. RSI + MACD ────────────────────────────────────
  {
    id: 'rsi_macd',
    name: 'Strategie RSI + MACD',
    shortName: 'RSI + MACD',
    category: 'momentum',
    categoryLabel: 'Momentum',
    style: 'day_trading',
    difficulty: 'intermediaire',
    riskLevel: 'moyen',
    description: 'Combinaison classique de deux indicateurs de momentum pour confirmer les retournements et continuations. Historiquement populaire sur tous les marches.',
    objective: 'Confirmer les retournements de tendance avec double validation momentum.',
    markets: ['Forex', 'XAU/USD', 'Crypto', 'Indices'],
    assets: ['EUR/USD', 'XAU/USD', 'BTC/USD', 'ETH/USD', 'GBP/USD', 'NAS100'],
    timeframes: ['M15', 'H1', 'H4'],
    indicators: ['RSI (14)', 'MACD (12,26,9)', 'Histogramme MACD'],
    idealMarket: 'Marche avec momentum clair, pas de range trop serre',
    avoidMarket: 'Marche sans momentum, range etroit',
    buySignal: 'RSI remonte au-dessus de 30 + MACD croisement haussier + histogramme positif',
    sellSignal: 'RSI retombe sous 70 + MACD croisement baissier + histogramme negatif',
    stopLossRule: 'Sous le dernier creux pour achat, au-dessus du dernier sommet pour vente',
    takeProfitRule: 'Niveau S/R suivant ou divergence inverse',
    recommendedRR: '1:1.5 a 1:2.5',
    reliabilityScore: 72,
    advantages: ['Double confirmation', 'Simple a comprendre', 'Fonctionne sur tous timeframes'],
    disadvantages: ['Lagging indicators', 'Faux signaux en range', 'Retards possibles'],
    commonErrors: ['Ignorer la tendance globale', 'Prendre chaque croisement', 'Pas de confirmation prix'],
    whenNotToUse: ['Range serre', 'Volatilite extreme', 'News a fort impact imminente'],
    aiSummary: 'Strategie populaire et accessible. Fonctionne mieux en suivant la tendance H4. Attendre alignment des deux indicateurs avant entree. Win rate historiquement meilleur sur H1+',
    status: 'active',
    priority: 1,
  },

  // ─── 3. EMA TRIPLE ────────────────────────────────────
  {
    id: 'ema_triple',
    name: 'Strategie EMA 20 / 50 / 200',
    shortName: 'EMA Triple',
    category: 'trend',
    categoryLabel: 'Tendance',
    style: 'swing_trading',
    difficulty: 'intermediaire',
    riskLevel: 'faible',
    description: 'Utilisation de trois moyennes mobiles exponentielles pour definir la tendance courte, moyenne et longue terme. Pullback sur EMA 20/50 en tendance.',
    objective: 'Suivre la tendance et entrer sur les pullbacks des moyennes mobiles.',
    markets: ['Forex', 'Indices', 'Actions', 'XAU/USD'],
    assets: ['EUR/USD', 'XAU/USD', 'GBP/USD', 'NAS100', 'SPX500', 'DE40'],
    timeframes: ['H1', 'H4', 'D1'],
    indicators: ['EMA 20', 'EMA 50', 'EMA 200'],
    idealMarket: 'Tendance claire, EMA alignees dans le meme ordre',
    avoidMarket: 'EMA entrelacees, marche sans direction',
    buySignal: 'Prix au-dessus EMA 200 + pullback sur EMA 20 ou EMA 50 + rebond haussier',
    sellSignal: 'Prix sous EMA 200 + pullback sur EMA 20 ou EMA 50 + rejet baissier',
    stopLossRule: 'Sous l\'EMA de support pour achat (EMA 50 ou 200)',
    takeProfitRule: 'Prochaine resistance/support ou lorsque prix s\'eloigne de l\'EMA 20',
    recommendedRR: '1:2 a 1:4',
    reliabilityScore: 75,
    advantages: ['Tendance claire sur 3 horizons', 'Entrees sur pullback = bon R/R', 'Simple a visualiser'],
    disadvantages: ['Retard en EMA', 'Mauvais en range', 'Necessite patience pour pullback'],
    commonErrors: ['Entrer avant confirmation du rebond', 'Ignorer EMA 200', 'Trader contre tendance H4'],
    whenNotToUse: ['Range', 'EMA entrelacees', 'Tendance H4 incertaine'],
    aiSummary: 'Strategie fiable en tendance. Meilleure sur H4/D1. Attendre le pullback sur EMA 20 dans tendance H4 haussiere. SL sous EMA 50.',
    status: 'active',
    priority: 1,
  },

  // ─── 4. GOLDEN/DEATH CROSS ────────────────────────────
  {
    id: 'golden_cross',
    name: 'Strategie Golden Cross / Death Cross',
    shortName: 'Golden Cross',
    category: 'trend',
    categoryLabel: 'Tendance',
    style: 'position_trading',
    difficulty: 'debutant',
    riskLevel: 'faible',
    description: 'Croisement de la EMA 50 au-dessus/au-dessous de la EMA 200. Signal historiquement suivi par les institutionnels pour identifier les changements de tendance majeurs.',
    objective: 'Capturer les tendances de long terme avec un signal simple et robuste.',
    markets: ['Actions', 'Indices', 'Crypto'],
    assets: ['NAS100', 'SPX500', 'BTC/USD', 'ETH/USD', 'AAPL', 'TSLA', 'DE40'],
    timeframes: ['D1', 'W1'],
    indicators: ['EMA 50', 'EMA 200'],
    idealMarket: 'Marche avec tendance de long terme en formation',
    avoidMarket: 'Range long terme, marche sans direction claire',
    buySignal: 'EMA 50 croise au-dessus de EMA 200 (Golden Cross)',
    sellSignal: 'EMA 50 croise en-dessous de EMA 200 (Death Cross)',
    stopLossRule: 'Sous l\'EMA 200 pour Golden Cross, au-dessus pour Death Cross',
    takeProfitRule: 'Lors d\'un croisement inverse ou objectif S/R long terme',
    recommendedRR: '1:3 a 1:6',
    reliabilityScore: 68,
    advantages: ['Signal simple et clair', 'Tres suivi institutionnellement', 'Filtre le bruit court terme'],
    disadvantages: ['Signal tres tardif', 'Faux signaux en range', 'Necessite D1 minimum'],
    commonErrors: ['Reagir trop tot au croisement', 'Ne pas attendre la cloture', 'Oublier le contexte macro'],
    whenNotToUse: ['Range long terme', 'Volatilite extreme', 'Changement de regime de marche'],
    aiSummary: 'Strategie historiquement utilisee pour le position trading. Patience requise. Meilleure sur indices et actions D1. Ne pas utiliser pour du scalping.',
    status: 'active',
    priority: 2,
  },

  // ─── 5. BREAKOUT + RETEST ─────────────────────────────
  {
    id: 'breakout_retest',
    name: 'Strategie Breakout + Retest',
    shortName: 'Breakout Retest',
    category: 'breakout',
    categoryLabel: 'Breakout',
    style: 'day_trading',
    difficulty: 'intermediaire',
    riskLevel: 'eleve',
    description: 'Attendre la cassure d\'un niveau cle, puis le retest de ce niveau comme nouveau support/resistance avant d\'entrer. Strategie a fort potentiel avec excellent R/R.',
    objective: 'Entrer apres confirmation d\'un breakout valide sur retest.',
    markets: ['XAU/USD', 'Forex', 'Crypto', 'Indices'],
    assets: ['XAU/USD', 'EUR/USD', 'BTC/USD', 'ETH/USD', 'NAS100', 'GBP/USD'],
    timeframes: ['H1', 'H4', 'D1'],
    indicators: ['Supports/Resistances', 'Volume', 'ATR'],
    idealMarket: 'Marche sortant d\'un range, compression de volatilite',
    avoidMarket: 'Range sans fin, faux breakouts frequents',
    buySignal: 'Cassure resistance + retest sur la resistance devenue support + rejet haussier',
    sellSignal: 'Cassure support + retest sur le support devenu resistance + rejet baissier',
    stopLossRule: 'Sous le niveau reteste pour achat, au-dessus pour vente',
    takeProfitRule: 'Prochaine zone S/R ou mesure du range casse',
    recommendedRR: '1:2 a 1:5',
    reliabilityScore: 74,
    advantages: ['Excellent ratio R/R', 'Entree avec confirmation', 'Psychologiquement solide'],
    disadvantages: ['Risque de faux breakout', 'Necessite patience', 'Rate l\'impulsion initiale'],
    commonErrors: ['Entrer avant le retest', 'Ne pas attendre la confirmation', 'Mauvais placement du SL'],
    whenNotToUse: ['Faux breakout probable', 'Volatilite post-news', 'Range sans compression'],
    aiSummary: 'Strategie avec excellent potentiel R/R. Cle : attendre le retest, ne pas foncer sur la cassure. Fonctionne tres bien sur XAU/USD H4 apres long range.',
    status: 'active',
    priority: 1,
  },

  // ─── 6. SUPPORT/RESISTANCE ────────────────────────────
  {
    id: 'sr_levels',
    name: 'Strategie Support / Resistance',
    shortName: 'S/R Levels',
    category: 'mean_reversion',
    categoryLabel: 'Range',
    style: 'day_trading',
    difficulty: 'debutant',
    riskLevel: 'moyen',
    description: 'Strategie fondamentale basee sur les rebonds sur supports et rejets sur resistances. La plus utilisee historiquement par les traders de tous niveaux.',
    objective: 'Acheter sur support et vendre sur resistance dans un range ou tendance.',
    markets: ['Tous les marches'],
    assets: ['EUR/USD', 'XAU/USD', 'GBP/USD', 'BTC/USD', 'NAS100', 'USD/JPY'],
    timeframes: ['M15', 'H1', 'H4'],
    indicators: ['Supports/Resistances horizontaux', 'Volume', 'Price Action'],
    idealMarket: 'Range clair avec S/R bien definis, ou tendance avec S/R en escalier',
    avoidMarket: 'Marche sans S/R identifiable, tendance explosive',
    buySignal: 'Prix proche d\'un support + price action haussiere (pin bar, engulfing)',
    sellSignal: 'Prix proche d\'une resistance + price action baissiere',
    stopLossRule: 'Sous le support pour achat, au-dessus de la resistance pour vente',
    takeProfitRule: 'Resistance suivante pour achat, support suivant pour vente',
    recommendedRR: '1:1.5 a 1:3',
    reliabilityScore: 70,
    advantages: ['Universelle, fonctionne partout', 'Simple a comprendre', 'Excellente base pour tout trader'],
    disadvantages: ['S/R subjectifs', 'Cassures frequentes', 'Necessite confirmation'],
    commonErrors: ['Trader chaque S/R', 'SL trop serre', 'Ignorer la tendance globale'],
    whenNotToUse: ['Tendance forte', 'S/R trop proches', 'News a fort impact'],
    aiSummary: 'Strategie de base essentielle. Toujours utiliser avec confirmation price action et en accord avec tendance H4. Sur XAU/USD, les niveaux 4300/4350/4400 sont cles.',
    status: 'active',
    priority: 2,
  },

  // ─── 7. BOLLINGER BANDS ───────────────────────────────
  {
    id: 'bollinger',
    name: 'Strategie Bollinger Bands',
    shortName: 'Bollinger',
    category: 'mean_reversion',
    categoryLabel: 'Range',
    style: 'day_trading',
    difficulty: 'intermediaire',
    riskLevel: 'moyen',
    description: 'Utilise les bandes de Bollinger pour identifier les extremes de prix, les compressions de volatilite et les retours a la moyenne.',
    objective: 'Acheter pres de la bande inferieure et vendre pres de la bande superieure en range, ou trader la cassure en tendance.',
    markets: ['Forex', 'Crypto', 'Indices'],
    assets: ['EUR/USD', 'GBP/USD', 'BTC/USD', 'ETH/USD', 'NAS100'],
    timeframes: ['M15', 'H1', 'H4'],
    indicators: ['Bollinger Bands (20,2)', 'Bande centrale (SMA 20)'],
    idealMarket: 'Range ou tendance avec retours a la moyenne',
    avoidMarket: 'Tendance parabolique sans retour',
    buySignal: 'Prix touche bande inferieure + reversal candle + pas de tendance baissiere H4',
    sellSignal: 'Prix touche bande superieure + reversal candle + pas de tendance haussiere H4',
    stopLossRule: 'Sous la bande inferieure pour achat, au-dessus de la bande superieure pour vente',
    takeProfitRule: 'Bande centrale (SMA 20) ou bande opposee',
    recommendedRR: '1:1.5 a 1:2',
    reliabilityScore: 65,
    advantages: ['Visualise la volatilite', 'Signaux clairs', 'Squeeze = alerte breakout'],
    disadvantages: ['Mauvais en tendance forte', 'Retours pas garantis', 'Necessite confirmation'],
    commonErrors: ['Acheter bande basse en tendance baissiere', 'Ignorer le squeeze', 'Pas de stop loss'],
    whenNotToUse: ['Tendance parabolique', 'Bandes en expansion extreme', 'Breakout imminent'],
    aiSummary: 'Strategie efficace en range. Le squeeze est un signal avant breakout. Toujours verifier la tendance H4 avant de contre-trader les bandes.',
    status: 'active',
    priority: 2,
  },

  // ─── 8. ATR VOLATILITE ────────────────────────────────
  {
    id: 'atr_volatility',
    name: 'Strategie ATR Volatilite',
    shortName: 'ATR',
    category: 'momentum',
    categoryLabel: 'Volatilite',
    style: 'day_trading',
    difficulty: 'intermediaire',
    riskLevel: 'moyen',
    description: 'Utilise l\'ATR pour mesurer la volatilite, ajuster le stop loss dynamiquement, et detecter les changements de regime de marche.',
    objective: 'Adapter la taille de position et le SL selon la volatilite reelle du marche.',
    markets: ['XAU/USD', 'Indices', 'Forex', 'Crypto'],
    assets: ['XAU/USD', 'NAS100', 'EUR/USD', 'BTC/USD', 'DE40'],
    timeframes: ['H1', 'H4', 'D1'],
    indicators: ['ATR (14)', 'ATR % du prix'],
    idealMarket: 'Tout marche avec volatilite mesurable',
    avoidMarket: 'Marche avec volatilite anormale post-news',
    buySignal: 'ATR bas en compression + breakout haussier = volatilite en hausse',
    sellSignal: 'ATR bas en compression + breakout baissier',
    stopLossRule: '2x ATR pour le timeframe de trading',
    takeProfitRule: '3x ATR ou S/R suivant',
    recommendedRR: '1:1.5 a 1:3',
    reliabilityScore: 62,
    advantages: ['SL adapte a la volatilite', 'Detecte les compressions', 'Gestion du risque objective'],
    disadvantages: ['Ne donne pas la direction', 'Lagging', 'Necessite un autre signal d\'entree'],
    commonErrors: ['Utiliser ATR seul pour la direction', 'SL 0.5x ATR trop serre', 'Ignorer le contexte'],
    whenNotToUse: ['Volatilite anormale', 'ATR en expansion extreme', 'Seul sans autre signal'],
    aiSummary: 'ATR est un outil de gestion du risque, pas un signal d\'entree. L\'utiliser pour position sizing et SL. La compression ATR precede souvent un mouvement important.',
    status: 'active',
    priority: 3,
  },

  // ─── 9. ADX FORCE TENDANCE ────────────────────────────
  {
    id: 'adx_trend',
    name: 'Strategie ADX Force de Tendance',
    shortName: 'ADX',
    category: 'trend',
    categoryLabel: 'Tendance',
    style: 'swing_trading',
    difficulty: 'intermediaire',
    riskLevel: 'faible',
    description: 'L\'ADX mesure la force de la tendance independamment de sa direction. ADX > 25 = tendance forte. Utilise avec +DI et -DI pour la direction.',
    objective: 'Filtrer les faux signaux en ne tradant que les tendances fortes.',
    markets: ['Marchés en tendance'],
    assets: ['EUR/USD', 'XAU/USD', 'NAS100', 'GBP/USD', 'BTC/USD'],
    timeframes: ['H1', 'H4', 'D1'],
    indicators: ['ADX (14)', '+DI', '-DI'],
    idealMarket: 'ADX > 25 avec +DI/-DI clairement separes',
    avoidMarket: 'ADX < 20, marche sans tendance',
    buySignal: 'ADX > 25 croissant + +DI au-dessus de -DI',
    sellSignal: 'ADX > 25 croissant + -DI au-dessus de +DI',
    stopLossRule: 'Sous le dernier swing low pour achat',
    takeProfitRule: 'Lorsque ADX baisse sous 25 ou divergence',
    recommendedRR: '1:2 a 1:3',
    reliabilityScore: 71,
    advantages: ['Filtre les faux signaux', 'Objective', 'Combine bien avec autres strategies'],
    disadvantages: ['Lagging', 'Ne donne pas la direction seule', 'Mauvais en range'],
    commonErrors: ['Trader ADX < 20', 'Ignorer la direction DI', 'Utiliser seul'],
    whenNotToUse: ['ADX < 20', 'Range', 'Sans confirmation directionnelle'],
    aiSummary: 'ADX est un filtre, pas un signal seul. L\'utiliser pour confirmer la force avant d\'entrer avec une autre strategie. Ideale avec Ichimoku ou EMA.',
    status: 'active',
    priority: 2,
  },

  // ─── 10. FIBONACCI PULLBACK ───────────────────────────
  {
    id: 'fibonacci',
    name: 'Strategie Fibonacci Pullback',
    shortName: 'Fibonacci',
    category: 'trend',
    categoryLabel: 'Tendance',
    style: 'swing_trading',
    difficulty: 'avance',
    riskLevel: 'moyen',
    description: 'Utilise les retracements de Fibonacci (38.2%, 50%, 61.8%) pour identifier les zones de pullback ideal dans une tendance.',
    objective: 'Entrer dans la direction de la tendance apres un pullback sur un niveau Fibonacci cle.',
    markets: ['Forex', 'XAU/USD', 'Indices', 'Crypto'],
    assets: ['XAU/USD', 'EUR/USD', 'GBP/USD', 'BTC/USD', 'NAS100', 'DE40'],
    timeframes: ['H1', 'H4', 'D1'],
    indicators: ['Fibonacci Retracement', 'Extension Fibonacci'],
    idealMarket: 'Tendance claire avec mouvement impulse mesurable',
    avoidMarket: 'Range, tendance sans mouvement clair',
    buySignal: 'Tendance haussiere + pullback sur 38.2%, 50% ou 61.8% + rejection haussiere',
    sellSignal: 'Tendance baissiere + pullback sur 38.2%, 50% ou 61.8% + rejection baissiere',
    stopLossRule: 'Sous le 61.8% (ou 78.6%) pour achat',
    takeProfitRule: 'Extension 138.2% ou 161.8% du mouvement initial',
    recommendedRR: '1:2 a 1:4',
    reliabilityScore: 73,
    advantages: ['Zones precises d\'entree', 'Excellent R/R', 'Universellement suivi'],
    disadvantages: ['Subjectif sur les points A et B', 'Plusieurs niveaux = incertitude', 'Necessite tendance claire'],
    commonErrors: ['Mauvais trace des points A/B', 'Acheter 61.8% en tendance baissiere', 'Ignorer confirmation'],
    whenNotToUse: ['Range', 'Tendance incertaine', 'Sans confirmation price action'],
    aiSummary: 'Strategie precise en tendance. Le 50% et 61.8% sont les plus fiables. Toujours attendre une confirmation (pin bar, engulfing) sur le niveau Fibonacci.',
    status: 'active',
    priority: 1,
  },

  // ─── 11. PRICE ACTION ─────────────────────────────────
  {
    id: 'price_action',
    name: 'Strategie Price Action Chandeliers',
    shortName: 'Price Action',
    category: 'momentum',
    categoryLabel: 'Price Action',
    style: 'day_trading',
    difficulty: 'avance',
    riskLevel: 'eleve',
    description: 'Trading base uniquement sur l\'analyse des chandeliers japonais et des formes chartistes, sans indicateurs. Approche pure des institutionnels.',
    objective: 'Lire le comportement du prix pour anticiper les mouvements via les chandeliers et patterns.',
    markets: ['Tous les marches'],
    assets: ['XAU/USD', 'EUR/USD', 'BTC/USD', 'NAS100', 'GBP/USD'],
    timeframes: ['M15', 'H1', 'H4'],
    indicators: ['Pin bar', 'Engulfing', 'Doji', 'Marteau', 'Etoile filante', 'Double top/bottom'],
    idealMarket: 'Marche avec chandeliers clairs et patterns identifiables',
    avoidMarket: 'Marche chaotique, spreads elargis',
    buySignal: 'Pin bar haussier sur support + tendance H4 haussiere + engulfing haussier',
    sellSignal: 'Pin bar baissier sur resistance + tendance H4 baissiere + engulfing baissier',
    stopLossRule: 'Sous le low du pattern pour achat',
    takeProfitRule: 'S/R suivante ou mesure du pattern',
    recommendedRR: '1:2 a 1:4',
    reliabilityScore: 76,
    advantages: ['Pas d\'indicateur lagging', 'Reactive', 'Comprendre le comportement du marche'],
    disadvantages: ['Subjective', 'Necessite experience', 'Facile de voir des patterns imaginaires'],
    commonErrors: ['Trop de patterns subjectifs', 'Ignorer le contexte', 'Forcer un pattern'],
    whenNotToUse: ['Spread large', 'Chandeliers de mauvaise qualite', 'Sans contexte S/R'],
    aiSummary: 'Approche professionnelle mais exigeante. Pin bar + engulfing sur S/R en tendance H4 = setup fort. Eviter de trader les dojis seuls.',
    status: 'advanced',
    priority: 1,
  },

  // ─── 12. SMART MONEY ──────────────────────────────────
  {
    id: 'smart_money',
    name: 'Strategie Smart Money Concepts',
    shortName: 'Smart Money',
    category: 'institutional',
    categoryLabel: 'Institutionnel',
    style: 'swing_trading',
    difficulty: 'avance',
    riskLevel: 'eleve',
    description: 'Analyse le comportement des institutions via le Break of Structure, Change of Character, Order Blocks et Fair Value Gaps. Approche utilisee par les traders professionnels.',
    objective: 'Suivre les mouvements institutionnels et entrer dans leurs zones d\'accumulation.',
    markets: ['XAU/USD', 'Forex', 'Indices', 'Crypto'],
    assets: ['XAU/USD', 'EUR/USD', 'GBP/USD', 'NAS100', 'BTC/USD'],
    timeframes: ['H1', 'H4', 'D1'],
    indicators: ['BOS', 'CHOCH', 'Order Blocks', 'FVG', 'Premium/Discount'],
    idealMarket: 'Marche avec structure claire, pas de chaos',
    avoidMarket: 'Marche sans structure, news a haut impact',
    buySignal: 'CHOCH haussier + retest Order Block haussier + FVG haussier non comble',
    sellSignal: 'CHOCH baissier + retest Order Block baissier + FVG baissier non comble',
    stopLossRule: 'Sous l\'Order Block pour achat, au-dessus pour vente',
    takeProfitRule: 'Prochaine zone de liquidite ou Order Block oppose',
    recommendedRR: '1:3 a 1:5',
    reliabilityScore: 80,
    advantages: ['Comprendre le comportement institutionnel', 'Excellent R/R', 'Zones precises'],
    disadvantages: ['Complexe', 'Subjectif sur les OB', 'Necessite formation'],
    commonErrors: ['Mauvais identification des OB', 'Trader sans confirmation', 'Ignorer le contexte H4'],
    whenNotToUse: ['Sans formation adequate', 'Marche apres news majeure', 'Structure chaotique'],
    aiSummary: 'Strategie institutionnelle avec excellent potentiel. Cle : attendre le CHOCH + retest OB. Ne pas anticiper. Fonctionne tres bien sur XAU/USD H4.',
    status: 'advanced',
    priority: 1,
  },

  // ─── 13. SUPPLY DEMAND ────────────────────────────────
  {
    id: 'supply_demand',
    name: 'Strategie Supply & Demand',
    shortName: 'S&D',
    category: 'institutional',
    categoryLabel: 'Institutionnel',
    style: 'swing_trading',
    difficulty: 'avance',
    riskLevel: 'moyen',
    description: 'Identifie les zones d\'offre (supply) et de demande (demande) ou les institutions ont accumule ou distribue. Base de la Smart Money.',
    objective: 'Acheter dans les zones de demande et vendre dans les zones d\'offre.',
    markets: ['Forex', 'XAU/USD', 'Indices', 'Actions'],
    assets: ['EUR/USD', 'XAU/USD', 'GBP/USD', 'NAS100', 'DE40'],
    timeframes: ['H1', 'H4', 'D1'],
    indicators: ['Zones Supply/Demand', 'Price Action', 'Volume'],
    idealMarket: 'Marche avec S&D zones claires et testees',
    avoidMarket: 'Marche chaotique, tendance parabolique',
    buySignal: 'Prix entre dans zone de demande + price action haussiere + contexte haussier H4',
    sellSignal: 'Prix entre dans zone d\'offre + price action baissiere + contexte baissier H4',
    stopLossRule: 'Sous la zone de demande pour achat',
    takeProfitRule: 'Zone d\'offre opposee ou S/R suivante',
    recommendedRR: '1:2 a 1:4',
    reliabilityScore: 77,
    advantages: ['Zones precises', 'Base institutionnelle', 'Bon R/R'],
    disadvantages: ['Subjectif', 'Necessite experience', 'Zones peuvent etre violees'],
    commonErrors: ['Mauvaise identification des zones', 'Acheter en tendance baissiere H4', 'SL trop proche'],
    whenNotToUse: ['Tendance parabolique', 'Sans confirmation', 'Zones non testees'],
    aiSummary: 'Fondamentale pour le trading institutionnel. Qualite > quantite. Une bonne zone S&D testee 2-3 fois vaut mieux que 10 zones forcees.',
    status: 'active',
    priority: 2,
  },

  // ─── 14. VWAP ─────────────────────────────────────────
  {
    id: 'vwap',
    name: 'Strategie VWAP',
    shortName: 'VWAP',
    category: 'trend',
    categoryLabel: 'Tendance',
    style: 'scalping',
    difficulty: 'intermediaire',
    riskLevel: 'moyen',
    description: 'Volume Weighted Average Price. Le prix au-dessus du VWAP = acheteurs actifs. Sous = vendeurs actifs. Utilise par les institutionnels pour evaluer la qualite de leurs executions.',
    objective: 'Trader dans la direction du VWAP avec rebond ou breakout.',
    markets: ['Actions', 'Indices', 'Crypto'],
    assets: ['NAS100', 'SPX500', 'AAPL', 'TSLA', 'BTC/USD', 'ETH/USD'],
    timeframes: ['M5', 'M15', 'M30', 'H1'],
    indicators: ['VWAP', 'Deviation VWAP (1x, 2x, 3x)'],
    idealMarket: 'Session active avec volume',
    avoidMarket: 'Faible volume, session asiatique Forex',
    buySignal: 'Prix au-dessus du VWAP + retest VWAP + rejet haussier',
    sellSignal: 'Prix sous le VWAP + retest VWAP + rejet baissier',
    stopLossRule: 'Sous le VWAP pour achat, au-dessus pour vente',
    takeProfitRule: '2x ou 3x deviation VWAP ou S/R',
    recommendedRR: '1:1.5 a 1:2',
    reliabilityScore: 69,
    advantages: ['Base sur le volume', 'Populaire institutionnellement', 'Signaux intraday clairs'],
    disadvantages: ['Moins efficace en swing', 'Reset quotidien', 'Moins pertinent Forex'],
    commonErrors: ['Utiliser en swing trading', 'Trader contre VWAP', 'Ignorer le volume'],
    whenNotToUse: ['Faible volume', 'Holding overnight', 'Forex sans volume reel'],
    aiSummary: 'Ideale pour le day trading actions/indices. Ne pas hold overnight. Le retest du VWAP en session est le setup le plus fiable.',
    status: 'active',
    priority: 3,
  },

  // ─── 15. OPENING RANGE ────────────────────────────────
  {
    id: 'opening_range',
    name: 'Strategie Opening Range Breakout',
    shortName: 'ORB',
    category: 'breakout',
    categoryLabel: 'Breakout',
    style: 'day_trading',
    difficulty: 'intermediaire',
    riskLevel: 'eleve',
    description: 'Trader la cassure de la range des premiers X minutes de la session. Strategie populaire sur les indices et actions.',
    objective: 'Capturer le mouvement directionnel initial de la session.',
    markets: ['NASDAQ', 'S&P 500', 'DAX', 'Actions', 'XAU/USD'],
    assets: ['NAS100', 'SPX500', 'DE40', 'XAU/USD', 'AAPL', 'TSLA'],
    timeframes: ['M5', 'M15'],
    indicators: ['High/Low d\'ouverture', 'Volume'],
    idealMarket: 'Ouverture de session avec volatilite',
    avoidMarket: 'Ouverture calme, gap trop large deja',
    buySignal: 'Cassure du high des 30 premieres minutes + volume croissant',
    sellSignal: 'Cassure du low des 30 premieres minutes + volume croissant',
    stopLossRule: 'De l\'autre cote de la range d\'ouverture',
    takeProfitRule: '2x la range d\'ouverture ou S/R proche',
    recommendedRR: '1:2 a 1:3',
    reliabilityScore: 66,
    advantages: ['Profite de l\'impulsion initiale', 'Regles claires', 'Bon sur indices'],
    disadvantages: ['Eleve risque de faux breakout', 'Necessite presence a l\'ouverture', 'Gap risk'],
    commonErrors: ['Entrer avant confirmation', 'Range trop large', 'Pas de gestion du gap'],
    whenNotToUse: ['Ouverture apres news', 'Range trop large (> 2 ATR)', 'Volume anormalement faible'],
    aiSummary: 'Strategie de day trading classique. Fonctionne mieux sur NAS100/D40 a l\'ouverture europeenne/americaine. Ne pas forcer si la range est trop large.',
    status: 'risky',
    priority: 3,
  },

  // ─── 16. MULTI-TIMEFRAME ──────────────────────────────
  {
    id: 'multi_timeframe',
    name: 'Strategie Multi-Timeframes',
    shortName: 'Multi-TF',
    category: 'multi_timeframe',
    categoryLabel: 'Multi-TF',
    style: 'swing_trading',
    difficulty: 'avance',
    riskLevel: 'faible',
    description: 'Analyse alignee sur plusieurs timeframes : D1 pour tendance, H4 pour structure, H1 pour zone, M15 pour timing. La strategie la plus recommandee pour reduire les faux signaux.',
    objective: 'Aligner l\'analyse sur 3-4 timeframes pour n\'entrer que sur des setups confirmes.',
    markets: ['Tous les marches'],
    assets: ['XAU/USD', 'EUR/USD', 'BTC/USD', 'NAS100', 'GBP/USD'],
    timeframes: ['M15', 'H1', 'H4', 'D1'],
    indicators: ['Toutes les strategies precedentes par timeframe'],
    idealMarket: 'Timeframes alignes dans la meme direction',
    avoidMarket: 'Timeframes contradictoires',
    buySignal: 'D1 haussier + H4 haussier + H1 pullback sur support + M15 confirmation',
    sellSignal: 'D1 baissier + H4 baissier + H1 pullback sur resistance + M15 confirmation',
    stopLossRule: 'Sous le support H1 pour achat',
    takeProfitRule: 'Resistance H4 ou D1 suivante',
    recommendedRR: '1:2 a 1:5',
    reliabilityScore: 85,
    advantages: ['Reduit les faux signaux', 'Confirme la direction', 'Excellente win rate'],
    disadvantages: ['Moins d\'opportunites', 'Necessite patience', 'Analyse plus longue'],
    commonErrors: ['Ignorer un timeframe', 'Forcer un trade non aligne', 'Trop de timeframes'],
    whenNotToUse: ['Timeframes contradictoires', 'Urgence', 'Sans assez de confirmation'],
    aiSummary: 'Strategie fondamentale. L\'alignement D1+H4+H1 est le filtre le plus puissant. Si D1 et H4 sont contradictoires = pas de trade. Point.',
    status: 'active',
    priority: 1,
  },

  // ─── 17. TREND FOLLOWING ──────────────────────────────
  {
    id: 'trend_following',
    name: 'Strategie Trend Following',
    shortName: 'Trend Following',
    category: 'trend',
    categoryLabel: 'Tendance',
    style: 'swing_trading',
    difficulty: 'intermediaire',
    riskLevel: 'moyen',
    description: 'Suivre la tendance dominante avec des entrees sur pullback et gestion du risque progressive. L\'approche la plus utilisee par les fonds de gestion.',
    objective: 'Capturer la majorite d\'une tendance en entrant sur les pullbacks.',
    markets: ['Forex', 'XAU/USD', 'Indices', 'Actions'],
    assets: ['EUR/USD', 'XAU/USD', 'NAS100', 'BTC/USD', 'DE40'],
    timeframes: ['H4', 'D1'],
    indicators: ['Moyennes mobiles', 'ADX', 'MACD'],
    idealMarket: 'Tendance claire et soutenue',
    avoidMarket: 'Range, contre-tendance',
    buySignal: 'Tendance haussiere D1 + pullback sur support + momentum haussier H4',
    sellSignal: 'Tendance baissiere D1 + pullback sur resistance + momentum baissier H4',
    stopLossRule: 'Sous le dernier swing low, ajuste au fur et a mesure',
    takeProfitRule: 'Trailing stop ou prochaine resistance majeure',
    recommendedRR: '1:2 a 1:5',
    reliabilityScore: 79,
    advantages: ['Profite des grands mouvements', 'Moins de stress', 'Gestion progressive'],
    disadvantages: ['Donne du profit en fin de tendance', 'Necessite patience', 'Retour au depart possible'],
    commonErrors: ['Entrer trop tot', 'Sortir trop tot', 'Ne pas ajuster le SL'],
    whenNotToUse: ['Fin de tendance', 'Range', 'Sans trailing stop'],
    aiSummary: 'La strategie des professionnels. Patience + discipline + gestion progressive. Ne pas essayer de predire la fin de la tendance.',
    status: 'active',
    priority: 1,
  },

  // ─── 18. MEAN REVERSION ───────────────────────────────
  {
    id: 'mean_reversion',
    name: 'Strategie Mean Reversion',
    shortName: 'Mean Reversion',
    category: 'mean_reversion',
    categoryLabel: 'Range',
    style: 'day_trading',
    difficulty: 'intermediaire',
    riskLevel: 'eleve',
    description: 'Parie sur le retour du prix vers sa moyenne apres un mouvement extreme. Basee sur RSI extreme, Bollinger Bands, ou eloignement des moyennes mobiles.',
    objective: 'Profiter du retour a la normale apres un mouvement excessif.',
    markets: ['Marchés en range', 'Forex', 'Indices'],
    assets: ['EUR/USD', 'GBP/USD', 'NAS100', 'XAU/USD'],
    timeframes: ['M15', 'H1', 'H4'],
    indicators: ['RSI', 'Bollinger Bands', 'Z-Score'],
    idealMarket: 'Range clair, prix eloigne de la moyenne',
    avoidMarket: 'Tendance forte, breakout',
    buySignal: 'RSI < 20 + prix sous bande Bollinger inferieure + rejection',
    sellSignal: 'RSI > 80 + prix au-dessus bande Bollinger superieure + rejection',
    stopLossRule: 'Sous le niveau extreme pour achat',
    takeProfitRule: 'Moyenne ou bande centrale',
    recommendedRR: '1:1.5 a 1:2',
    reliabilityScore: 64,
    advantages: ['Nombreuses opportunites en range', 'Signaux clairs', 'Bon pour debutants en range'],
    disadvantages: ['Dangereux en tendance', 'Catch un couteau qui tombe', 'Faux extremes'],
    commonErrors: ['Mean reversion en tendance', 'Pas de stop', 'Trop confiant dans le retour'],
    whenNotToUse: ['Tendance claire', 'Breakout', 'News a fort impact'],
    aiSummary: 'Strategie de range uniquement. Verifier D1/H4 = range avant d\'utiliser. En tendance, mean reversion = perte assuree.',
    status: 'risky',
    priority: 2,
  },

  // ─── 19. NEWS FILTER ──────────────────────────────────
  {
    id: 'news_filter',
    name: 'Strategie News Filter',
    shortName: 'News Filter',
    category: 'news_based',
    categoryLabel: 'News',
    style: 'day_trading',
    difficulty: 'debutant',
    riskLevel: 'faible',
    description: 'Eviter de trader avant et pendant les annonces economiques majeures. Strategie defensive essentielle pour la preservation du capital.',
    objective: 'Proteger le capital en evitant les periodes de haute volatilite imprevisible.',
    markets: ['Forex', 'XAU/USD', 'Indices'],
    assets: ['EUR/USD', 'XAU/USD', 'GBP/USD', 'USD/JPY', 'NAS100'],
    timeframes: ['Tous'],
    indicators: ['Calendrier economique', 'Impact des news'],
    idealMarket: 'Aucun — c\'est une strategie d\'evitement',
    avoidMarket: 'Periodes NFP, CPI, FOMC, taux',
    buySignal: 'Aucun — attendre 15-30 min apres la news',
    sellSignal: 'Aucun — attendre 15-30 min apres la news',
    stopLossRule: 'Ne pas trader = pas de perte',
    takeProfitRule: 'Re-entrer quand le marche s\'est stabilise',
    recommendedRR: 'N/A',
    reliabilityScore: 90,
    advantages: ['Preserve le capital', 'Zero risque pendant news', 'Discipline'],
    disadvantages: ['Rate les mouvements post-news', 'Necessite patience', 'Pas de profit direct'],
    commonErrors: ['Trader pendant NFP', 'Oublier le calendrier', 'FOMO post-news'],
    whenNotToUse: ['Jamais — toujours respecter les news'],
    aiSummary: 'La strategie la plus sous-estimee. Ne pas trader 15 min avant et 30 min apres NFP/CPI/FOMC = preservation du capital. Aucune strategie ne bat celle-ci en termes de protection.',
    status: 'active',
    priority: 1,
  },

  // ─── 20. CORRELATION ──────────────────────────────────
  {
    id: 'correlation',
    name: 'Strategie Correlation de Marche',
    shortName: 'Correlation',
    category: 'multi_timeframe',
    categoryLabel: 'Correlation',
    style: 'swing_trading',
    difficulty: 'avance',
    riskLevel: 'moyen',
    description: 'Utilise les correlations entre marches pour confirmer les signaux et eviter les contradictions. Ex: DXY haussier = pression baissiere EUR/USD et XAU/USD.',
    objective: 'Confirmer les trades avec l\'analyse des correlations inter-marches.',
    markets: ['XAU/USD', 'Forex', 'Indices', 'Crypto'],
    assets: ['XAU/USD', 'EUR/USD', 'DXY', 'NAS100', 'BTC/USD'],
    timeframes: ['H4', 'D1'],
    indicators: ['DXY', 'US 10Y Yield', 'VIX', 'Correlations'],
    idealMarket: 'Correlations claires et stables',
    avoidMarket: 'Correlations cassees, crises',
    buySignal: 'Signal XAU/USD achat + DXY baisse + VIX baisse = confirmation',
    sellSignal: 'Signal XAU/USD vente + DXY hausse + VIX hausse = confirmation',
    stopLossRule: 'Standard selon la strategie principale',
    takeProfitRule: 'Standard selon la strategie principale',
    recommendedRR: '1:2 a 1:3',
    reliabilityScore: 72,
    advantages: ['Confirmation inter-marche', 'Filtre supplementaire', 'Vision macro'],
    disadvantages: ['Correlations peuvent se casser', 'Complexe', 'Necessite suivi multiple'],
    commonErrors: ['Trader sans verifier DXY', 'Ignorer une correlation cassee', 'Trop de confirmation = pas de trade'],
    whenNotToUse: ['Correlations instables', 'Crise', 'Sans comprehension macro'],
    aiSummary: 'Filtre avance. Avant d\'acheter XAU/USD, verifier DXY et US10Y. Si DXY monte fort = risque pour XAU. Cette strategie seule ne trade pas, elle confirme ou invalide.',
    status: 'active',
    priority: 2,
  },
];

// ─── Helpers ────────────────────────────────────────────

export function getStrategiesByCategory(category: StrategyCategory): Strategy[] {
  return STRATEGIES.filter(s => s.category === category);
}

export function getStrategiesByMarket(market: string): Strategy[] {
  return STRATEGIES.filter(s => s.markets.some(m => m.toLowerCase().includes(market.toLowerCase())));
}

export function getStrategiesByAsset(asset: string): Strategy[] {
  return STRATEGIES.filter(s => s.assets.some(a => a.toLowerCase().includes(asset.toLowerCase())));
}

export function getStrategiesByStyle(style: TradingStyle): Strategy[] {
  return STRATEGIES.filter(s => s.style === style);
}

export function getStrategiesByDifficulty(diff: DifficultyLevel): Strategy[] {
  return STRATEGIES.filter(s => s.difficulty === diff);
}

export function getStrategiesByRisk(risk: RiskLevel): Strategy[] {
  return STRATEGIES.filter(s => s.riskLevel === risk);
}

export function getStrategyById(id: string): Strategy | undefined {
  return STRATEGIES.find(s => s.id === id);
}

export function getTopStrategies(limit: number = 5): Strategy[] {
  return [...STRATEGIES].sort((a, b) => b.reliabilityScore - a.reliabilityScore).slice(0, limit);
}

export function getBestStrategyForAsset(asset: string): Strategy | undefined {
  const candidates = getStrategiesByAsset(asset);
  if (candidates.length === 0) return undefined;
  return candidates.reduce((best, s) => s.reliabilityScore > best.reliabilityScore ? s : best, candidates[0]);
}

export const CATEGORY_LABELS: Record<StrategyCategory, string> = {
  trend: 'Tendance',
  momentum: 'Momentum',
  mean_reversion: 'Range / Mean Reversion',
  breakout: 'Breakout',
  institutional: 'Institutionnel',
  multi_timeframe: 'Multi-Timeframe',
  news_based: 'News Based',
};

export const STYLE_LABELS: Record<TradingStyle, string> = {
  scalping: 'Scalping',
  day_trading: 'Day Trading',
  swing_trading: 'Swing Trading',
  position_trading: 'Position Trading',
};

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  debutant: 'Debutant',
  intermediaire: 'Intermediaire',
  avance: 'Avance',
};

export const RISK_LABELS: Record<RiskLevel, { label: string; color: string }> = {
  faible: { label: 'Faible', color: 'text-emerald-400' },
  moyen: { label: 'Moyen', color: 'text-amber-400' },
  eleve: { label: 'Eleve', color: 'text-red-400' },
};

// Simulated backtest result for a strategy
export interface BacktestResult {
  strategyId: string;
  asset: string;
  timeframe: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  avgGain: number;
  avgLoss: number;
  maxDrawdown: number;
  netProfit: number;
  bestTrade: number;
  worstTrade: number;
  avgRR: number;
  sharpeRatio: number;
}

export function generateBacktest(strategy: Strategy, asset: string, timeframe: string): BacktestResult {
  const base = strategy.reliabilityScore;
  const volatility = asset.includes('XAU') || asset.includes('BTC') ? 1.3 : asset.includes('NAS') ? 1.1 : 1.0;
  const tfMult = timeframe === 'D1' ? 1.2 : timeframe === 'H4' ? 1.1 : timeframe === 'H1' ? 1.0 : 0.85;
  const winRate = Math.min(85, Math.max(35, base * 0.7 + Math.random() * 15)) * tfMult;
  const totalTrades = Math.floor(50 + Math.random() * 200);
  const winningTrades = Math.floor(totalTrades * (winRate / 100));
  const losingTrades = totalTrades - winningTrades;
  const avgGain = parseFloat((50 + Math.random() * 150 * volatility).toFixed(2));
  const avgLoss = parseFloat((30 + Math.random() * 70 * volatility).toFixed(2));
  const profitFactor = parseFloat(((winningTrades * avgGain) / Math.max(1, losingTrades * avgLoss)).toFixed(2));
  const netProfit = parseFloat((winningTrades * avgGain - losingTrades * avgLoss).toFixed(2));
  const maxDrawdown = parseFloat((netProfit * (0.1 + Math.random() * 0.3)).toFixed(2));
  const avgRR = parseFloat((avgGain / Math.max(1, avgLoss)).toFixed(2));

  return {
    strategyId: strategy.id,
    asset,
    timeframe,
    totalTrades,
    winningTrades,
    losingTrades,
    winRate: parseFloat(winRate.toFixed(1)),
    profitFactor,
    avgGain,
    avgLoss,
    maxDrawdown,
    netProfit,
    bestTrade: parseFloat((avgGain * 2 + Math.random() * avgGain).toFixed(2)),
    worstTrade: parseFloat((-(avgLoss * 1.5 + Math.random() * avgLoss)).toFixed(2)),
    avgRR,
    sharpeRatio: parseFloat(((winRate / 100) * avgRR).toFixed(2)),
  };
}
