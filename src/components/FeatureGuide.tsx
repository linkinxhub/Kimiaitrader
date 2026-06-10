/**
 * FeatureGuide — Bandeau explicatif pour chaque rubrique
 * Explique le rôle de la page, comment l'utiliser, et les données affichées.
 * Se ferme avec localStorage (1x par utilisateur).
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, BookOpen, Lightbulb, Info } from 'lucide-react';

interface GuideStep {
  title: string;
  desc: string;
  icon?: 'info' | 'tip' | 'book';
}

interface FeatureGuideProps {
  pageId: string;       // unique ID pour localStorage
  title: string;        // titre de la rubrique
  description: string;  // description du rôle
  steps?: GuideStep[];  // étapes/guide d'utilisation
  dataSource?: string;  // source des données
  tips?: string[];      // astuces
  className?: string;
}

export function FeatureGuide({
  pageId,
  title,
  description,
  steps = [],
  dataSource,
  tips = [],
  className = '',
}: FeatureGuideProps) {
  const storageKey = `xtrendai_guide_${pageId}`;
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(() => {
    // Check if user dismissed this guide
    return localStorage.getItem(storageKey) !== 'dismissed';
  });
  const [showBadge, setShowBadge] = useState(() => {
    return localStorage.getItem(storageKey) === 'dismissed';
  });

  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-close guide after 30 seconds and on scroll
  useEffect(() => {
    if (!isVisible || !isOpen) return;
    autoCloseTimerRef.current = setTimeout(() => setIsOpen(false), 30000);
    const handleScroll = () => { if (window.scrollY > 200) setIsOpen(false); };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isVisible, isOpen]);

  const dismiss = () => {
    setIsVisible(false);
    setIsOpen(false);
    setShowBadge(true);
    localStorage.setItem(storageKey, 'dismissed');
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
  };

  const reopen = () => {
    setIsVisible(true);
    setShowBadge(false);
    localStorage.removeItem(storageKey);
  };

  if (!isVisible && showBadge) {
    return (
      <button
        onClick={reopen}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 hover:bg-blue-500/20 transition-colors ${className}`}
      >
        <HelpCircle className="w-3.5 h-3.5" /> Guide
      </button>
    );
  }

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-slate-900/40 border border-blue-500/20 rounded-2xl overflow-hidden ${className}`}
    >
      {/* Header — always visible */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-slate-400 truncate">{description}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-slate-500">{isOpen ? 'Replier' : 'Déplier'}</span>
          <button
            onClick={(e) => { e.stopPropagation(); dismiss(); }}
            className="p-1 rounded-lg hover:bg-slate-700 transition-colors"
            title="Ne plus afficher"
          >
            <X className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Expandable content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-slate-800/50 pt-4">
              {/* Description */}
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-300 leading-relaxed">{description}</p>
              </div>

              {/* Steps */}
              {steps.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Comment utiliser</p>
                  {steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 bg-slate-900/40 rounded-xl p-3">
                      <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs text-blue-400 font-bold flex-shrink-0">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-white">{step.title}</p>
                        <p className="text-xs text-slate-400">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Data source */}
              {dataSource && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Source des données : <span className="text-emerald-400">{dataSource}</span>
                </div>
              )}

              {/* Tips */}
              {tips.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" /> Astuces
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/10 rounded-lg p-2.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-slate-400">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Pre-configured guides for each page
 */

export function DashboardGuide() {
  return (
    <FeatureGuide
      pageId="dashboard"
      title="Dashboard — Vue d'ensemble du Marché"
      description="Votre tableau de bord central affiche les prix temps réel de 90+ actifs, les signaux IA générés aujourd'hui, et un aperçu de vos performances. C'est votre point d'entrée pour prendre des décisions de trading éclairées."
      dataSource="Binance WebSocket, Frankfurter, Currency-API — rafraîchissement toutes les 30 secondes"
      steps={[
        { title: 'Observer les prix live', desc: 'Les cartes en haut affichent les prix en temps réel via WebSocket Binance (< 200ms de latence).' },
        { title: 'Consulter les signaux IA', desc: 'Le panneau latéral droit montre les derniers signaux ACHAT/VENTE avec leur confiance.' },
        { title: 'Analyser la tendance', desc: 'Le graphique central montre l\'évolution du prix avec les indicateurs techniques (RSI, MACD).' },
        { title: 'Passer à l\'action', desc: 'Cliquez sur un signal pour voir le détail complet : Entry, SL, TP1/TP2/TP3, ratio R/R.' },
      ]}
      tips={[
        'Les prix clignotent en vert/rouge quand ils changent en temps réel.',
        'Le score de confiance IA > 80% indique un signal fort.',
        'Utilisez les filtres pour ne voir que les actifs qui vous intéressent.',
      ]}
    />
  );
}

export function RadarGuide() {
  return (
    <FeatureGuide
      pageId="radar"
      title="Radar d'Opportunités — Détection IA"
      description="Le Radar scanne automatiquement 10+ actifs majeurs et détecte les opportunités de trading en temps réel. Chaque signal est évalué par notre IA avec un score de 0 à 100, un ratio Risk/Reward, et des niveaux Entry/Stop Loss/Take Profit précis."
      dataSource="Prix live fusionnés avec analyse technique (RSI, MACD, EMA)"
      steps={[
        { title: 'Parcourir les opportunités', desc: 'Les cartes montrent les 10 meilleures opportunités détectées, triées par score IA.' },
        { title: 'Filtrer par signal', desc: 'Utilisez les filtres pour ne voir que les ACHAT, VENTE, ou par score (90+, 80+, etc.).' },
        { title: 'Analyser les niveaux', desc: 'Chaque carte affiche Entry, Stop Loss, Take Profit et le ratio R/R calculé.' },
        { title: 'Rechercher un actif', desc: 'Tapez le nom d\'un actif dans la barre de recherche pour le trouver rapidement.' },
      ]}
      tips={[
        'Un ratio R/R > 2.0 signifie que le potentiel de gain double le risque.',
        'Les signaux "exceptionnelle" (score 90+) ont le taux de réussite le plus élevé.',
        'La force du signal est recalculée en temps réel selon les prix du marché.',
      ]}
    />
  );
}

export function MultiAssetGuide() {
  return (
    <FeatureGuide
      pageId="multiasset"
      title="Multi-Actifs — Comparaison Cross-Marché"
      description="Comparez jusqu'à 12 actifs côte à côte sur un seul écran. Prix live, signaux IA, RSI, volatilité et tendance — tout est réuni pour une vision globale du marché. Sélectionnez plusieurs actifs pour une comparaison détaillée."
      dataSource="Prix live fusionnés avec données techniques"
      steps={[
        { title: 'Filtrer par catégorie', desc: 'Cliquez sur Métaux, Crypto, Forex, Indices ou Énergie pour filtrer.' },
        { title: 'Trier les données', desc: 'Triez par Score, Change % ou Volatilité pour prioriser vos analyses.' },
        { title: 'Sélectionner pour comparer', desc: 'Cochez la case à droite de 2+ actifs pour voir la comparaison détaillée.' },
        { title: 'Lire le signal', desc: 'La colonne Signal indique ACHAT (vert) ou VENTE (rouge) selon l\'analyse IA.' },
      ]}
      tips={[
        'Comparez toujours au moins 2 actifs de catégories différentes pour diversifier.',
        'Le RSI > 70 = surachat (prudence), RSI < 30 = survente (opportunité).',
        'La volatilité élevée = plus de risque mais aussi plus de potentiel.',
      ]}
    />
  );
}

export function ScannerGuide() {
  return (
    <FeatureGuide
      pageId="scanner"
      title="Scanner Marché — Analyse Technique Automatique"
      description="Le Scanner effectue une analyse technique complète sur 12 actifs : MACD, EMA50, RSI, changements 1h et 24h. Les alertes (triangle jaune) se déclenchent automatiquement quand la volatilité dépasse 2%."
      dataSource="Prix live avec indicateurs techniques calculés en temps réel"
      steps={[
        { title: 'Lire le tableau', desc: 'Chaque ligne = 1 actif avec ses indicateurs techniques (MACD, EMA50, RSI).' },
        { title: 'Filtrer par catégorie', desc: 'Métaux, Crypto, Forex, Indices, Énergie — ou Tous.' },
        { title: 'Activer les alertes', desc: 'Cliquez "Alertes" pour ne voir que les actifs avec forte volatilité.' },
        { title: 'Trier les résultats', desc: 'Confiance, 24h, 1h, RSI — trouvez ce qui bouge le plus.' },
      ]}
      tips={[
        'MACD "Haussier" + EMA50 "Au-dessus" = tendance haussière confirmée.',
        'RSI > 70 en rouge = surachat, attendez un retour avant d\'entrer.',
        'Les alertes (triangle) indiquent un mouvement important en cours.',
      ]}
    />
  );
}

export function TechnicalGuide() {
  return (
    <FeatureGuide
      pageId="technical"
      title="Analyse Technique — Graphiques & Indicateurs"
      description="Analysez n'importe quel actif avec des graphiques interactifs, indicateurs techniques (RSI, MACD, EMA), et signaux IA détaillés. Détectez les supports, résistances, et zones de décision pour affiner vos entrées."
      dataSource="Candles temps réel + calculs techniques (RSI, MACD, Bollinger)"
      steps={[
        { title: 'Choisir un actif', desc: 'Sélectionnez un actif dans la liste à gauche.' },
        { title: 'Choisir un timeframe', desc: 'M5, M15, H1, H4, D1 — adaptez à votre style de trading.' },
        { title: 'Lire les indicateurs', desc: 'RSI (surachat/survente), MACD (momentum), EMA (tendance).' },
        { title: 'Suivre les signaux', desc: 'Les signaux IA apparaissent directement sur le graphique.' },
      ]}
      tips={[
        'Utilisez H1 pour du day trading, D1 pour du swing trading.',
        'Un croisement EMA 20/50 = signal de changement de tendance.',
        'Le volume confirme (ou invalide) un mouvement de prix.',
      ]}
    />
  );
}

export function SignalsGuide() {
  return (
    <FeatureGuide
      pageId="signals"
      title="Signaux IA — Recommandations en Temps Réel"
      description="Les signaux IA analysent 90+ actifs en continu et génèrent des recommandations ACHAT/VENTE avec des niveaux précis. Chaque signal inclut Entry, Stop Loss, 3 Take Profits, et un ratio Risk/Reward calculé automatiquement."
      dataSource="AI Signal Engine — analyse multi-indicateurs sur données live"
      steps={[
        { title: 'Filtrer les signaux', desc: 'Par actif, direction (Achat/Vente), ou confiance (60%+, 80%+).' },
        { title: 'Exporter en PDF', desc: 'Cliquez sur Exporter pour générer un PDF des signaux actifs.' },
        { title: 'Consulter l\'historique', desc: 'L\'historique montre les performances passées des signaux.' },
      ]}
      tips={[
        'Un signal avec 3 TPs vous permet de prendre des profits progressifs.',
        'Respectez toujours le Stop Loss — il protège votre capital.',
        'Le ratio R/R > 2 signifie que le gain potentiel vaut au moins 2x le risque.',
      ]}
    />
  );
}

export function SmartMoneyGuide() {
  return (
    <FeatureGuide
      pageId="smartmoney"
      title="Smart Money Tracker — Concepts Institutionnels"
      description="Détectez les concepts Smart Money utilisés par les institutionnels : Order Blocks, Break of Structure (BOS), Change of Character (CHoCH), Fair Value Gaps, et Liquidity Pools. Comprenez où les « gros joueurs » placent leurs ordres."
      dataSource="Calculs sur candles réelles — détection algorithmique"
      steps={[
        { title: 'Choisir un actif', desc: 'XAU/USD et les majors sont les plus riches en concepts Smart Money.' },
        { title: 'Identifier les Order Blocks', desc: 'Zones où le prix a fortement rejeté — niveaux clés institutionnels.' },
        { title: 'Repérer les BOS/CHoCH', desc: 'Break of Structure = continuation, Change of Character = reversal.' },
        { title: 'Trader les FVG', desc: 'Fair Value Gaps = zones non-testées où le prix retourne souvent.' },
      ]}
      tips={[
        'Les Order Blocks sur H4/D1 sont plus fiables que sur M15.',
        'Combinez Smart Money + signaux IA pour confirmer vos entrées.',
        'La liquidité au-dessus/dessous des highs/lows est souvent prise avant un mouvement.',
      ]}
    />
  );
}

// ─── XAU/USD Premium Guide ────────────────────────────────

export function XAUPremiumGuide() {
  return (
    <FeatureGuide
      pageId="xau-premium"
      title="XAU/USD Premium — Analyse Or Détaillée"
      description="Analyse complète de l'or (XAU/USD) avec prix en temps réel via Currency-API, supports et résistances dynamiques, signaux IA spécifiques, et détection des zones institutionnelles. Cette rubrique est dédiée exclusivement au marché de l'or, l'actif le plus suivi par les traders."
      dataSource="Currency-API — prix temps réel, recalculé toutes les 30s"
      steps={[
        { title: 'Observer le prix live', desc: 'Le prix de l\'or est mis à jour en temps réel avec un indicateur de source.' },
        { title: 'Consulter les niveaux clés', desc: 'Supports et résistances dynamiques calculés sur les dernières 24h.' },
        { title: 'Suivre les signaux IA', desc: 'Signaux ACHAT/VENTE spécifiques à l\'or avec Entry, SL et TP précis.' },
        { title: 'Analyser les zones institutionnelles', desc: 'Détection automatique des zones où les institutionnels placent leurs ordres.' },
      ]}
      tips={[
        'L\'or est particulièrement volatile pendant les annonces FED (14h00 ET).',
        'Combinez l\'analyse XAU avec le calendrier économique pour anticiper les mouvements.',
        'Les supports H4 sont plus fiables que ceux M15 pour l\'or.',
      ]}
    />
  );
}

// ─── AI Assistant Guide ───────────────────────────────────

export function AIAssistantGuide() {
  return (
    <FeatureGuide
      pageId="ai-assistant"
      title="Assistant IA Trading — Analyse Personnalisée"
      description="Votre assistant IA propulsé par GPT-4o et Claude 3.5 Sonnet. Posez vos questions sur n'importe quel actif, obtenez des analyses techniques personnalisées, des idées de stratégies, et des explications en temps réel. L'IA accède aux données marché live pour des réponses précises et contextualisées."
      dataSource="OpenAI GPT-4o / Anthropic Claude 3.5 + données marché live"
      steps={[
        { title: 'Choisir un modèle', desc: 'Sélectionnez GPT-4o (analytique) ou Claude 3.5 (pédagogique) selon vos besoins.' },
        { title: 'Poser votre question', desc: 'Ex: "Analyse XAU/USD H1" ou "Quelle stratégie pour EUR/USD ?"' },
        { title: 'Lire la réponse en streaming', desc: 'L\'analyse arrive en temps réel avec les données marché intégrées.' },
        { title: 'Itérer la conversation', desc: 'Posez des questions de suivi pour approfondir l\'analyse.' },
      ]}
      tips={[
        'Soyez précis dans vos questions : mentionnez l\'actif ET le timeframe.',
        'L\'IA connaît les dernières 20 candles — demandez une analyse récente.',
        'Utilisez le mode simulation pour tester sans risquer de capital réel.',
      ]}
    />
  );
}

// ─── Labo Stratégies Guide ────────────────────────────────

export function LaboStrategiesGuide() {
  return (
    <FeatureGuide
      pageId="labo-strategies"
      title="Labo Stratégies — Backtest & Optimisation"
      description="Le laboratoire de stratégies vous permet de backtester 5 approches de trading sur des données réelles Binance. Testez Trend Following, Mean Reversion, Breakout, Scalping et Range Trading. Chaque stratégie affiche : Win Rate, Profit Factor, Drawdown Max, trades gagnants/perdants, et courbe de performance."
      dataSource="Données historiques Binance — backtest sur 100+ candles"
      steps={[
        { title: 'Sélectionner une stratégie', desc: 'Cliquez sur l\'une des 5 cartes pour voir les résultats du backtest.' },
        { title: 'Choisir un actif', desc: 'Testez la stratégie sur différents actifs pour comparer les performances.' },
        { title: 'Analyser les métriques', desc: 'Win Rate > 55% et Profit Factor > 1.5 = stratégie viable.' },
        { title: 'Comparer les stratégies', desc: 'Superposez les courbes de performance pour choisir la meilleure.' },
      ]}
      tips={[
        'Une stratégie avec Win Rate 60% mais Drawdown 20% est risquée — vérifiez toujours les deux.',
        'Le Trend Following fonctionne mieux sur les tendances fortes (H4/D1).',
        'Testez toujours une stratégie en démo avant de l\'utiliser en réel.',
      ]}
    />
  );
}

// ─── Simulateur Guide ─────────────────────────────────────

export function SimulateurGuide() {
  return (
    <FeatureGuide
      pageId="simulateur"
      title="Simulateur Trading — Apprentissage Sans Risque"
      description="Simulateur interactif avec 17 signaux IA réels, capital virtuel de 100 000€, et mode apprentissage pédagogique. Pratiquez le trading sans risquer d'argent réel. Chaque trade est noté avec un feedback IA détaillé : gestion du risque, timing, et respect des règles."
      dataSource="Signaux IA historiques — scénarios pédagogiques"
      steps={[
        { title: 'Choisir un mode', desc: 'Mode Apprentissage (guidé) ou Mode Libre (autonome).' },
        { title: 'Recevoir un signal', desc: 'Un signal IA apparaît avec Entry, SL, TP1/TP2/TP3.' },
        { title: 'Prendre une décision', desc: 'ACHAT, VENTE, ou PASS — justifiez votre choix.' },
        { title: 'Recevoir le feedback IA', desc: 'Note sur 100 avec explications détaillées de votre performance.' },
      ]}
      tips={[
        'En mode apprentissage, suivez les conseils IA pour progresser rapidement.',
        'Un score > 80/100 = vous maîtrisez la gestion du risque.',
        'Le simulateur utilise des signaux réels passés — les conditions sont authentiques.',
      ]}
    />
  );
}

// ─── Analyse Technique Guide ──────────────────────────────

export function AnalyseTechniqueGuide() {
  return (
    <FeatureGuide
      pageId="analyse-technique"
      title="Analyse Technique — Graphiques & Indicateurs"
      description="Analysez n'importe quel actif avec des graphiques interactifs, indicateurs techniques (RSI, MACD, EMA), et signaux IA détaillés. Détectez les supports, résistances, et zones de décision pour affiner vos entrées. 5 timeframes disponibles de M5 à D1."
      dataSource="Candles temps réel + calculs techniques (RSI, MACD, Bollinger)"
      steps={[
        { title: 'Choisir un actif', desc: 'Sélectionnez un actif dans la liste à gauche — 90+ disponibles.' },
        { title: 'Choisir un timeframe', desc: 'M5 (scalping), M15 (intraday), H1 (swing), H4/D1 (position).' },
        { title: 'Lire les indicateurs', desc: 'RSI (surachat/survente), MACD (momentum), EMA (tendance).' },
        { title: 'Suivre les signaux IA', desc: 'Les signaux apparaissent sur le graphique avec Entry/SL/TP.' },
      ]}
      tips={[
        'Utilisez H1 pour du day trading, D1 pour du swing trading.',
        'Un croisement EMA 20/50 = signal de changement de tendance.',
        'Le volume confirme (ou invalide) un mouvement de prix.',
      ]}
    />
  );
}

// ─── Centre Intelligence Guide ────────────────────────────

export function IntelligenceCenterGuide() {
  return (
    <FeatureGuide
      pageId="intelligence-center"
      title="Centre Intelligence — Sentiment & Patterns"
      description="Centre d'intelligence de marché combinant analyse de sentiment, détection de patterns techniques, et alertes de volatilité. Le sentiment est calculé à partir des signaux IA, des mouvements de prix, et des indicateurs techniques pour donner une direction globale du marché."
      dataSource="Agrégation signaux IA + indicateurs techniques + prix live"
      steps={[
        { title: 'Lire le sentiment global', desc: 'Haussier / Baissier / Neutre — basé sur l\'agrégation des données.' },
        { title: 'Détecter les patterns', desc: 'Tête et Épaules, Double Top/Bottom, Triangle — détectés auto.' },
        { title: 'Surveiller la volatilité', desc: 'Alertes quand la volatilité dépasse un seuil critique.' },
        { title: 'Consulter le heatmap', desc: 'Vue d\'ensemble colorée de tous les actifs et leur direction.' },
      ]}
      tips={[
        'Le sentiment est recalculé toutes les 5 minutes — rafraîchissez régulièrement.',
        'Un pattern + sentiment aligné = probabilité de réussite plus élevée.',
        'La volatilité > 2% en 1h = attendez la stabilisation avant d\'entrer.',
      ]}
    />
  );
}

// ─── Centre Décision Rentabilité Guide ────────────────────

export function DecisionCenterGuide() {
  return (
    <FeatureGuide
      pageId="decision-center"
      title="Centre Décision Rentabilité — Optimisez Vos Trades"
      description="Centre de décision avancé qui évalue la rentabilité de vos trades avant exécution. Calcule le grade de qualité du signal, détecte les zones de non-trading, analyse le risque avant profit, et génère une recommandation journalière basée sur les conditions de marché actuelles."
      dataSource="AI Engine — calculs multi-factoriels sur données live"
      steps={[
        { title: 'Vérifier le grade du signal', desc: 'A+ (excellent) à D (faible) — basé sur 6 critères techniques.' },
        { title: 'Lire la recommandation', desc: 'ACHAT / VENTE / ATTENDRE — avec justification détaillée.' },
        { title: 'Vérifier la zone de non-trading', desc: 'Évitez de trader quand le marché est trop risqué.' },
        { title: 'Analyser le risque avant profit', desc: 'Calculez votre risque réel avant de prendre un trade.' },
      ]}
      tips={[
        'Un grade < C = ne tradez pas, attendez de meilleures conditions.',
        'La zone de non-trading protège votre capital pendant les périodes volatiles.',
        'Suivez la recommandation quotidienne pour rester discipliné.',
      ]}
    />
  );
}

// ─── Calendrier Économique Guide ──────────────────────────

export function CalendrierEcoGuide() {
  return (
    <FeatureGuide
      pageId="calendrier-eco"
      title="Calendrier Économique — Événements à Haut Impact"
      description="Calendrier économique en temps réel listant les annonces à fort impact : NFP (Non-Farm Payrolls), décisions FED, taux d'intérêt, CPI (inflation), PIB, et chômage. Chaque événement est noté par impact (faible/moyen/élevé) pour vous aider à anticiper les mouvements de marché."
      dataSource="API économique — mises à jour en temps réel"
      steps={[
        { title: 'Filtrer par date', desc: 'Aujourd\'hui, demain, cette semaine — ou une date spécifique.' },
        { title: 'Trier par impact', desc: 'Élevé (rouge) = fort mouvement attendu, Faible (vert) = léger impact.' },
        { title: 'Vérifier les prévisions', desc: 'Consensus du marché vs résultat précédent — l\'écart crée le mouvement.' },
        { title: 'Planifier vos trades', desc: 'Évitez d\'ouvrir des positions 15 min avant un événement élevé.' },
      ]}
      tips={[
        'Le NFP (1er vendredi du mois à 14h30) fait bouger tout le marché.',
        'Les décisions FED = volatilité extrême sur USD et or.',
        'Attendez 5-10 min après l\'annonce pour trader le vrai mouvement.',
      ]}
    />
  );
}

// ─── Centre News IA Guide ─────────────────────────────────

export function NewsCenterGuide() {
  return (
    <FeatureGuide
      pageId="news-center"
      title="Centre News IA — Analyse d'Actualités"
      description="Centre de news trading alimenté par l'IA qui analyse les actualités financières en temps réel. Détection automatique des annonces à haut impact, analyse de sentiment des headlines, et corrélations avec les mouvements de prix. Restez informé des événements qui influencent vos trades."
      dataSource="Flux news financières + analyse sentiment IA"
      steps={[
        { title: 'Parcourir les actualités', desc: 'Filtrées par catégorie : Macro, Crypto, Actions, Forex, Matières.' },
        { title: 'Lire le sentiment', desc: 'Positif / Négatif / Neutre — calculé par l\'IA sur chaque article.' },
        { title: 'Vérifier l\'impact prix', desc: 'Corrélations entre l\'annonce et le mouvement de prix dans l\'heure.' },
        { title: 'Configurer les alertes', desc: 'Soyez notifié quand une news à haut impact concerne vos actifs.' },
      ]}
      tips={[
        'Les news macro (FED, NFP) ont l\'impact le plus fort sur les devises.',
        'Une news positive + signal technique haussier = confirmation puissante.',
        'Le sentiment global des news peut inverser une tendance technique.',
      ]}
    />
  );
}

// ─── Historique Guide ─────────────────────────────────────

export function HistoriqueGuide() {
  return (
    <FeatureGuide
      pageId="historique"
      title="Historique — Journal de Vos Trades"
      description="Historique complet de tous vos trades avec P&L calculé automatiquement, win rate, profit factor, et performance mensuelle. Chaque trade est enregistré avec l'actif, la direction, le prix d'entrée/sortie, et le résultat. Analysez vos patterns de réussite et d'échec pour progresser."
      dataSource="Données stockées localement — historique persistant"
      steps={[
        { title: 'Consulter les trades', desc: 'Liste chronologique avec filtres par actif, direction, résultat.' },
        { title: 'Analyser les métriques', desc: 'Win Rate, Profit Factor, P&L total — calculés auto.' },
        { title: 'Filtrer par période', desc: 'Aujourd\'hui, cette semaine, ce mois, ou plage personnalisée.' },
        { title: 'Exporter les données', desc: 'Export CSV ou PDF pour analyse externe.' },
      ]}
      tips={[
        'Un Win Rate > 55% avec R/R > 1.5 = rentable sur le long terme.',
        'Analysez vos trades perdants pour identifier vos erreurs récurrentes.',
        'Gardez un journal écrit de vos émotions pendant chaque trade.',
      ]}
    />
  );
}

// ─── Gestion Risque Guide ─────────────────────────────────

export function GestionRisqueGuide() {
  return (
    <FeatureGuide
      pageId="gestion-risque"
      title="Gestion du Risque — Protégez Votre Capital"
      description="Outils complets de gestion du risque : calculateur de position, analyse du ratio Risk/Reward, stop loss dynamique, et alertes de drawdown. La gestion du risque est la clé de la survie en trading — un bon trader perd petit et gagne gros."
      dataSource="Calculs basés sur votre capital et paramètres personnels"
      steps={[
        { title: 'Définir votre risque max', desc: '1-2% par trade est le standard professionnel.' },
        { title: 'Calculer la taille de position', desc: 'Entrez Entry, SL, et risque % — le lot est calculé auto.' },
        { title: 'Vérifier le ratio R/R', desc: 'Minimum 1:2 — le gain doit valoir au moins 2x le risque.' },
        { title: 'Configurer les alertes drawdown', desc: 'Soyez alerté si votre drawdown dépasse un seuil critique.' },
      ]}
      tips={[
        'Ne risquez JAMAIS plus de 2% de votre capital sur un seul trade.',
        'Un ratio R/R de 1:3 avec 40% de win rate = rentable.',
        'Le drawdown max journalier de 5% = règle d\'or des pros.',
      ]}
    />
  );
}

// ─── Alertes Prix Guide ───────────────────────────────────

export function AlertesPrixGuide() {
  return (
    <FeatureGuide
      pageId="alertes-prix"
      title="Alertes de Prix — Notifications Personnalisées"
      description="Créez des alertes de prix personnalisées sur 9 actifs couverts. Définissez une condition (au-dessus, en-dessous, égal) et un prix cible — l'alerte se déclenche automatiquement quand le prix est atteint. Recevez une notification sonore et visuelle avec priorité haute."
      dataSource="Prix temps réel — vérification toutes les 30 secondes"
      steps={[
        { title: 'Créer une alerte', desc: 'Choisissez l\'actif, la condition, et le prix cible.' },
        { title: 'Activer l\'alerte', desc: 'Toggle ON — l\'alerte surveille le prix en continu.' },
        { title: 'Attendre le déclenchement', desc: 'Notification sonore + visuelle quand le prix est atteint.' },
        { title: 'Consulter l\'historique', desc: 'Toutes les alertes déclenchées sont enregistrées avec timestamp.' },
      ]}
      tips={[
        'Placez vos alertes sur des niveaux techniques (supports/résistances).',
        'Créez une alerte au-dessus ET en-dessous pour un range trading.',
        'Les alertes fonctionnent même quand l\'application est en arrière-plan.',
      ]}
    />
  );
}

// ─── Journal Trading Guide ────────────────────────────────

export function JournalTradingGuide() {
  return (
    <FeatureGuide
      pageId="journal-trading"
      title="Journal Trading — Suivi de Performance"
      description="Journal de trading détaillé avec calcul automatique du P&L, win rate, profit factor, et analyse mensuelle. Enregistrez chaque trade avec vos notes, émotions, et le résultat. Le journal est l'outil le plus puissant pour progresser — il révèle vos patterns de réussite et d'échec."
      dataSource="Données saisies manuellement — calculs automatiques"
      steps={[
        { title: 'Ajouter un trade', desc: 'Renseignez actif, direction, entry, exit, et résultat.' },
        { title: 'Ajouter des notes', desc: 'Décrivez votre raisonnement et vos émotions pendant le trade.' },
        { title: 'Consulter les stats', desc: 'Win rate, P&L, profit factor — mis à jour en temps réel.' },
        { title: 'Analyser les patterns', desc: 'Identifiez quels actifs/timeframes vous réussissent le mieux.' },
      ]}
      tips={[
        'Notez vos émotions — elles influencent plus vos trades que la technique.',
        'Un journal tenu pendant 30 jours révèle vos véritables patterns.',
        'Comparez vos trades manuels vs les signaux IA pour voir qui performe mieux.',
      ]}
    />
  );
}

// ─── Export MT4/5 Guide ───────────────────────────────────

export function MTExportGuide() {
  return (
    <FeatureGuide
      pageId="mt-export"
      title="Export MetaTrader — Code MQL4/MQL5"
      description="Exportez vos signaux IA directement vers MetaTrader 4 ou 5. Le code MQL est généré automatiquement avec les niveaux Entry, Stop Loss, et Take Profits. Copiez-collez dans l'Éditeur MetaTrader et lancez votre Expert Advisor. Supporte aussi l'export CSV/JSON pour d'autres plateformes."
      dataSource="Signaux IA — conversion automatique en code MQL"
      steps={[
        { title: 'Choisir un signal', desc: 'Sélectionnez le signal IA à exporter vers MT4/5.' },
        { title: 'Choisir le format', desc: 'MQL4, MQL5, CSV, ou JSON selon votre plateforme.' },
        { title: 'Copier le code', desc: 'Le code est prêt à coller dans l\'Éditeur MetaTrader.' },
        { title: 'Lancer l\'EA', desc: 'Compilez et exécutez votre Expert Advisor sur MT4/5.' },
      ]}
      tips={[
        'Testez toujours l\'EA en démo avant de l\'utiliser sur un compte réel.',
        'Le code MQL5 est plus moderne — préférez-le si vous avez MT5.',
        'Vérifiez que les niveaux SL/TP correspondent à votre broker (spread inclus).',
      ]}
    />
  );
}

// ─── Comparateur Institutionnel Guide ─────────────────────

export function ComparateurInstitutionnelGuide() {
  return (
    <FeatureGuide
      pageId="comparateur-institutionnel"
      title="Comparateur Institutionnel — Multi-Broker"
      description="Comparez les conditions de trading entre différents brokers institutionnels : spreads, commissions, levier, et exécution. Analysez les différences de prix en temps réel entre les sources et choisissez le meilleur broker pour votre style de trading."
      dataSource="Données agrégées multi-brokers — comparaisons en temps réel"
      steps={[
        { title: 'Sélectionner les brokers', desc: 'Ajoutez 2+ brokers à comparer côte à côte.' },
        { title: 'Comparer les spreads', desc: 'Spreads temps réel sur les mêmes actifs — différences visibles.' },
        { title: 'Analyser les commissions', desc: 'Coût total par lot selon le modèle de commission.' },
        { title: 'Choisir le meilleur', desc: 'Sélection optimale selon votre fréquence de trading.' },
      ]}
      tips={[
        'Un spread plus bas = économies significatives en scalping (100+ trades/jour).',
        'Vérifiez la qualité d\'exécution — un spread bas avec slippage = mauvais deal.',
        'Les brokers ECN ont généralement les meilleurs spreads sur le forex.',
      ]}
    />
  );
}

// ─── Paramètres Guide ─────────────────────────────────────

export function ParametresGuide() {
  return (
    <FeatureGuide
      pageId="parametres"
      title="Paramètres — Personnalisez Votre Expérience"
      description="Centre de configuration complet de XTrendAI Pro : alertes sonores avec volume et type de son par priorité, mode Ne Pas Déranger, notifications bureau, filtrage des alertes par priorité minimale, thème, langue, devise, et gestion du risque par défaut. Tous les réglages sont sauvegardés automatiquement."
      dataSource="Configuration locale — persistance dans le navigateur"
      steps={[
        { title: 'Configurer les sons', desc: 'Volume, type de son par priorité, vibration — testez chaque son.' },
        { title: 'Activer les notifications', desc: 'Notifications bureau du navigateur pour les alertes critiques.' },
        { title: 'Définir le mode DND', desc: 'Ne Pas Déranger pendant vos heures de sommeil.' },
        { title: 'Personnaliser l\'interface', desc: 'Thème, langue, devise, mode compact, rafraîchissement.' },
      ]}
      tips={[
        'Le mode DND de 22h à 8h est recommandé pour les traders actifs.',
        'Testez chaque son pour choisir celui qui vous alerte sans vous surprendre.',
        'Exportez vos paramètres avant de changer de navigateur/appareil.',
      ]}
    />
  );
}
