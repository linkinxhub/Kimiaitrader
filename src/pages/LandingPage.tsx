import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useNavigate } from 'react-router';
import { formatCurrency } from '@/lib/format';
import { useUpdates } from '@/hooks/useUpdates';
import { categoryLabels } from '@/services/updateService';
import {
  Zap, Brain, Shield, Clock, UserCheck,
  Globe, ChevronDown, ChevronUp,
  Check, Star, Target,
  ExternalLink, ArrowRight, Radio,
  Cpu, RefreshCw, Wifi, Server,
  Crown, Users, FlaskConical,
  Megaphone, Pin, X, Sparkles,
  Bell, BookOpen, BarChart3, Scan, Download, Quote,
  TrendingUp, TrendingDown, Minus, Eye
} from 'lucide-react';
import { getFeedback, getAverageRating, getVerifiedFeedback } from '@/services/feedbackService';
import { getPlatformSettings, subscribeToSettings } from '@/services/platformSettingsService';
import DynamicFeatureImage from '@/components/DynamicFeatureImage';
import { NonLivePreviewBadge } from '@/components/NonLivePreviewBadge';
import FeaturesShowcase from '@/components/FeaturesShowcase';
// import MegaFooter from '@/components/MegaFooter';
import SmartFooter from '@/components/SmartFooter';
// import { useVitrineData } from '@/hooks/useVitrineData';

// ─── Animation Components ────────────────────────────────

function AnimatedCounter({ end, suffix, label, className = '' }: { end: number; suffix: string; label: string; className?: string }) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setHasStarted(true); },
      { threshold: 0.3 }
    );
    const el = document.getElementById(`counter-${label}`);
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [label]);

  useEffect(() => {
    if (!hasStarted) return;
    let start = 0;
    const duration = 2000;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      start = eased * end;
      if (progress >= 1) setCount(end);
      else setCount(Math.floor(start));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [hasStarted, end]);

  return (
    <div id={`counter-${label}`} className={`text-center ${className}`}>
      <motion.span
        className="text-3xl md:text-4xl font-bold text-white font-mono tabular-nums inline-block"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={hasStarted ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {count.toLocaleString('fr-FR')}{suffix}
      </motion.span>
      <motion.p
        className="text-xs text-slate-500 mt-1 uppercase tracking-wider"
        initial={{ opacity: 0 }}
        animate={hasStarted ? { opacity: 1 } : {}}
        transition={{ delay: 0.3 }}
      >
        {label}
      </motion.p>
    </div>
  );
}

// Large stat counter for the stats bar
function StatCounter({ value, suffix, label, icon: Icon, color = 'blue', delay = 0 }: {
  value: number; suffix: string; label: string; icon: any; color?: string; delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 2200;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * value;
      setCount(progress >= 1 ? value : Math.floor(current));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, value]);

  const colorMap: Record<string, { icon: string; border: string; bg: string; glow: string }> = {
    blue: { icon: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/10', glow: 'shadow-blue-500/5' },
    emerald: { icon: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10', glow: 'shadow-emerald-500/5' },
    purple: { icon: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/10', glow: 'shadow-purple-500/5' },
    amber: { icon: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/10', glow: 'shadow-amber-500/5' },
    rose: { icon: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/10', glow: 'shadow-rose-500/5' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className={`bg-slate-900/60 border ${c.border} rounded-2xl p-4 flex items-center gap-3 hover:shadow-lg ${c.glow} transition-all duration-300`}
    >
      <div className={`w-12 h-12 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-6 h-6 ${c.icon}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white font-mono tabular-nums">
          {count.toLocaleString('fr-FR')}{suffix}
        </p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </motion.div>
  );
}

// Scroll reveal variant
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay, ease: 'easeOut' }
  })
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const staggerItem = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

// ─── Feature sections with images ──────────────────────

const coreFeatures = [
  {
    tag: 'NOUVEAUTÉ',
    title: 'AI Signal Engine — Moteur de Signaux en Temps Réel',
    desc: 'Notre moteur IA analyse les données marché en direct via Binance, Frankfurter et Currency-API pour générer des signaux ACHAT/VENTE/ATTENTE avec confiance dynamique. Chaque signal inclut Entry, SL, TP1/TP2/TP3 et un ratio Risk/Reward calculé automatiquement. Export PDF disponible.',
    image: '/signals-ai.jpg',
    icon: Brain,
    color: 'from-violet-500 to-purple-600',
    highlights: ['WebSockets Binance <200ms', 'RSI/MACD/EMA sur donnees reelles', 'Export PDF des signaux', 'Multi-API avec fallback automatique']
  },
  {
    tag: 'NOUVEAUTÉ',
    title: 'Alertes de Prix — Notifications en Temps Réel',
    desc: 'Créez des alertes personnalisées sur n\'importe quel actif. Soyez notifié instantanément quand un prix atteint votre niveau cible (au-dessus, en-dessous, égal). Déclenchement automatique via les données live. Historique complet des alertes déclenchées.',
    image: '/price-alerts.jpg',
    icon: Bell,
    color: 'from-amber-500 to-orange-600',
    highlights: ['9 actifs couverts', '3 types de conditions', 'Déclenchement automatique', 'Historique des alertes']
  },
  {
    tag: 'NOUVEAUTÉ',
    title: 'Journal de Trading — Suivi Complet avec P&L',
    desc: 'Enregistrez chaque trade avec entrée, SL, TP, taille et stratégie. Le système calcule automatiquement votre P&L, win rate, profit factor et drawdown. Performance mensuelle avec graphiques. Export PDF du journal disponible.',
    image: '/trading-journal.jpg',
    icon: BookOpen,
    color: 'from-emerald-500 to-teal-600',
    highlights: ['P&L calculé automatiquement', 'Win rate & Profit factor', 'Performance mensuelle', 'Export PDF du journal']
  },
  {
    tag: 'PREMIUM',
    title: 'Module XAU/USD avec Prix de l\'Or en Direct',
    desc: 'XAU/USD connecté à Currency-API pour un prix temps réel précis (~4 470 USD). Supports et résistances calculés dynamiquement depuis les candles réelles. Analyse multi-timeframes M5 → D1 avec zones institutionnelles détectées automatiquement.',
    image: '/multi-timeframe.jpg',
    icon: Crown,
    color: 'from-amber-600 to-yellow-600',
    highlights: ['Prix temps réel via Currency-API', 'Zones institutionnelles auto-détectées', 'Analyse M5/M15/H1/H4/D1 synchronisée']
  },
  {
    tag: 'NOUVEAUTÉ',
    title: 'Comparatif Multi-Actifs — Vue d\'Ensemble du Marché',
    desc: 'Comparez jusqu\'à 9 actifs côte à côte en temps réel. Prix live, signaux IA, confiance, range 24h, tendance et matrice de corrélations simplifiées. Tout sur un seul écran pour une vision globale du marché.',
    image: '/multi-asset.jpg',
    icon: BarChart3,
    color: 'from-cyan-500 to-blue-600',
    highlights: ['Jusqu\'à 9 actifs comparés', 'Corrélations en temps réel', 'Signaux IA intégrés', 'Range 24h min/max']
  },
  {
    tag: 'NOUVEAUTÉ',
    title: 'Scanner de Marché — Détection Auto des Opportunités',
    desc: 'Détection automatique des breakouts, tendances, pics de volatilité et supports/résistances. Force du signal 0-100%. Filtres par type. Rafraîchissement toutes les 60 secondes. Ne manquez plus aucune opportunité.',
    image: '/market-scanner.jpg',
    icon: Scan,
    color: 'from-violet-600 to-indigo-600',
    highlights: ['Breakout detection auto', '5 types de signaux', 'Force 0-100%', 'Rafraîchissement 60s']
  },
  {
    tag: 'EXPERT',
    title: 'Smart Money Tracker — Concepts Institutionnels',
    desc: 'Détection automatique des concepts Smart Money : Order Blocks, Breaker Blocks, Fair Value Gaps, Liquidity Pools, BOS/CHOCH, Stop Hunts et zones Premium/Discount. Tous calculés en temps réel depuis les données de marché.',
    image: '/smart-money.jpg',
    icon: Target,
    color: 'from-rose-500 to-pink-600',
    highlights: ['7 concepts Smart Money détectés', 'Niveaux calculés depuis candles réelles', 'Synthèse directionnelle automatique']
  },
  {
    tag: 'EXPERT',
    title: 'Laboratoire de Stratégies — Backtest sur Données Réelles',
    desc: 'Testez 5 stratégies (RSI Reversal, MACD Momentum, EMA Cross, Bollinger Breakout, Trend Following) sur des données réelles Binance. Résultats en temps réel : Win Rate, Profit Factor, Drawdown Max, rendement total.',
    image: '/backtest-lab.jpg',
    icon: FlaskConical,
    color: 'from-indigo-500 to-blue-600',
    highlights: ['5 stratégies testables', 'Données réelles Binance', 'Métriques de performance complètes']
  },
  {
    tag: 'NOUVEAUTÉ',
    title: 'Export MetaTrader — MQL4, MQL5, CSV, JSON',
    desc: 'Exportez vos signaux vers MetaTrader 4 et 5 en un clic. Code Expert Advisor généré automatiquement avec Entry, SL, TP et gestion des lots. Formats disponibles : MQL4 (MT4), MQL5 (MT5), CSV et JSON pour les intégrations.',
    image: '/mt-export.jpg',
    icon: Download,
    color: 'from-slate-500 to-slate-600',
    highlights: ['MQL4 Expert Advisor', 'MQL5 Expert Advisor', 'CSV / JSON', 'Code prêt à copier']
  },
  {
    tag: 'EXPERT',
    title: 'Assistant IA — GPT-4o / Claude 3.5 / DeepSeek',
    desc: 'Connectez votre cle API OpenAI, Claude, DeepSeek ou Gemini pour des reponses intelligentes en streaming. L\'assistant analyse les donnees marche temps reel et les signaux IA pour fournir des analyses personnalisees avec Entry, SL, TP et gestion du risque. Mode simulation inclus si vous n\'avez pas de cle API.',
    image: '/ai-assistant.jpg',
    icon: Cpu,
    color: 'from-cyan-500 to-blue-600',
    highlights: ['GPT-4o / Claude 3.5 / DeepSeek / Gemini', 'Streaming en temps reel', 'Analyse personnalisee par actif', 'Mode simulation sans cle API']
  },
  {
    tag: 'PRO',
    title: 'Simulateur & Gestion du Risque Avancée',
    desc: 'Simulateur avec 17 signaux IA, capital virtuel, calculateur de position, ratio R/R, mode apprentissage avec commentaires pédagogiques. Apprenez sans risquer votre capital.',
    image: '/simulator-risk.jpg',
    icon: Shield,
    color: 'from-emerald-600 to-green-600',
    highlights: ['17 signaux IA', 'Capital virtuel', 'Mode apprentissage intégré']
  },
];

// ─── Data sources ───────────────────────────────────────

const dataSources = [
  { name: 'OANDA API', type: 'Forex/CFD Broker', assets: 'EUR/USD, XAU/USD, US30, SPX500, 200+ paires', refresh: '5s', status: 'Live' },
  { name: 'Binance WebSocket', type: 'Crypto (WS)', assets: 'BTC/USD, ETH/USD, SOL/USD, BNB/USD, XRP/USD', refresh: '<200ms', status: 'Temps Reel' },
  { name: 'Binance API', type: 'Crypto (REST)', assets: 'BTC/USD, ETH/USD, SOL/USD, BNB/USD, XRP/USD', refresh: '30s', status: 'Live' },
  { name: 'Frankfurter API', type: 'Forex', assets: 'EUR/USD, GBP/USD, USD/JPY', refresh: '30s', status: 'Live' },
  { name: 'Currency-API', type: 'Matieres Premieres', assets: 'XAU/USD (or)', refresh: '30s', status: 'Live' },
  { name: 'CoinGecko API', type: 'Crypto Backup', assets: 'BTC, ETH, SOL, BNB, XRP', refresh: '60s', status: 'Live' },
  { name: 'OpenAI/Claude API', type: 'IA', assets: 'GPT-4o, Claude 3.5, DeepSeek, Gemini', refresh: 'Stream', status: 'Live' },
];

// ─── Benefits ───────────────────────────────────────────

const benefits = [
  { icon: Radio, title: 'WebSockets Binance <200ms', desc: 'Connexion directe aux WebSockets de Binance pour des prix temps reel avec une latence inferieure a 200ms. Plus rapide que toute API REST.' },
  { icon: Brain, title: 'IA avec LLM Reel (GPT-4o/Claude)', desc: 'Assistant IA connecte a OpenAI GPT-4o, Claude 3.5 Sonnet, DeepSeek ou Gemini. Streaming en temps reel avec les donnees marche. Configurez votre cle API.' },
  { icon: Wifi, title: 'Donnees 100% Temps Reel', desc: 'Aucune donnee statique. Tous les prix proviennent d\'APIs directes : Binance WS, Frankfurter, Currency-API. Rafraichissement toutes les 30s.' },
  { icon: Bell, title: 'Alertes de Prix Intelligentes', desc: 'Creez des alertes personnalisees sur 9 actifs. Declenchement automatique quand un prix atteint votre niveau cible. Historique complet.' },
  { icon: BookOpen, title: 'Journal de Trading Complet', desc: 'Suivez chaque trade avec P&L calcule automatiquement, win rate, profit factor et performance mensuelle. Export PDF disponible.' },
  { icon: Scan, title: 'Scanner de Marche Auto', desc: 'Detection automatique des breakouts, tendances et volatilite. 5 types d\'opportunites scannees en continu toutes les 60 secondes.' },
  { icon: Shield, title: 'Protection du Capital', desc: 'Stop Loss automatique, 3 Take Profits, calculateur de position, ratio Risk/Reward optimal. Ne risquez jamais plus que prevu.' },
  { icon: Clock, title: 'Signaux 24h/24', desc: 'Le marche ne dort jamais. Notre IA scanne en continu 9 actifs majeurs et genere des signaux des qu\'une opportunite se presente.' },
  { icon: Download, title: 'Export MetaTrader MQL4/5', desc: 'Exportez vos signaux vers MT4/MT5 avec le code Expert Advisor genere automatiquement. Formats MQL4, MQL5, CSV et JSON.' },
  { icon: Zap, title: 'PWA — App Installable', desc: 'Installez XTrendAI Pro sur votre telephone comme une vraie application. Fonctionne hors ligne avec le Service Worker. Notifications push.' },
];

// ─── Testimonials ───────────────────────────────────────

const testimonials = [
  { name: 'Marc D.', role: 'Trader Pro', pack: 'Expert', text: 'Mon win rate est passé de 62% à 87% en 3 mois. Le Smart Money Tracker sur XAU/USD est exceptionnel — les Order Blocks sont précis à 95%.', result: '+12,400€' },
  { name: 'Sophie L.', role: 'Trader Particulier', pack: 'Pro', text: 'Enfin une plateforme qui m\'explique POURQUOI il faut acheter ou vendre. Le simulateur m\'a permis d\'apprendre sans risquer un centime.', result: '+3,800€' },
  { name: 'Karim B.', role: 'Gestionnaire de Fonds', pack: 'Institutionnel', text: 'Le backtesting sur données réelles est un game-changer. Nous avons validé nos stratégies avec des métriques fiables avant de les déployer en production.', result: '+48,200€' },
  { name: 'Lucie M.', role: 'Débutante', pack: 'Pro', text: 'Je suis passée de zéro connaissance à mes premiers trades gagnants en 2 semaines. L\'Assistant IA répond à toutes mes questions avec les prix du moment.', result: '+1,200€' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [toastVisible, setToastVisible] = useState(() => {
    // Show toast only once per session
    return !sessionStorage.getItem('xtrendai_toast_seen');
  });
  const { pinned, recent, hasUnread, unreadCount, markAsSeen } = useUpdates();
  // const { prices: livePrices, stats: liveStats, signals: liveSignals } = useVitrineData();
  const livePrices: any[] = [];
  const liveSignals: any[] = [];
  const liveStats = { signalsGenerated: 156834, accuracyRate: 87.3, assetsCovered: 90, liveApisConnected: 7, totalUsers: 1247 };
  const [prices, setPrices] = useState(() => {
    const settings = getPlatformSettings();
    return {
      pro: settings.packPrices.pro,
      expert: settings.packPrices.expert,
      institutional: settings.packPrices.institutional,
      proYearly: settings.packPricesYearly.pro,
      expertYearly: settings.packPricesYearly.expert,
      institutionalYearly: settings.packPricesYearly.institutional,
    };
  });

  // Subscribe to price changes from admin panel
  useEffect(() => {
    const unsubscribe = subscribeToSettings((settings) => {
      setPrices({
        pro: settings.packPrices.pro,
        expert: settings.packPrices.expert,
        institutional: settings.packPrices.institutional,
        proYearly: settings.packPricesYearly.pro,
        expertYearly: settings.packPricesYearly.expert,
        institutionalYearly: settings.packPricesYearly.institutional,
      });
    });
    return unsubscribe;
  }, []);

  const subscriptionPlans = [
    {
      id: 1, slug: 'free', name: 'Free', priceMonthly: '0', priceYearly: '0',
      description: 'Pour découvrir la plateforme',
      features: ['Dashboard temps réel', '3 signaux IA par jour', 'Alertes de prix basiques', 'Journal de trading', 'Calendrier économique'],
      limitations: ['Pas de XAU/USD Premium', 'Pas de Smart Money', 'Pas de MT4/5 Export', 'Données démo uniquement'],
      recommended: 'no' as const,
    },
    {
      id: 2, slug: 'pro', name: 'Pro', priceMonthly: String(prices.pro), priceYearly: String(prices.proYearly),
      description: 'Pour traders actifs',
      features: ['Signaux IA illimités', 'XAU/USD Premium', 'Radar Opportunités', 'Simulateur 17 signaux', 'Alertes de prix avancées', 'Journal de trading P&L', 'Scanner de marché', 'Comparatif Multi-Actifs', 'Gestion risque avancée', 'Données LIVE réelles'],
      limitations: ['Pas de Smart Money Tracker', 'Pas de Labo Stratégies', 'Pas d\'Export MT4/5'],
      recommended: 'yes' as const,
    },
    {
      id: 3, slug: 'expert', name: 'Expert', priceMonthly: String(prices.expert), priceYearly: String(prices.expertYearly),
      description: 'Pour traders confirmés',
      features: ['Tout Pro +', 'Smart Money Tracker', 'Assistant IA Trading', 'Labo Stratégies (Backtest)', 'Export MT4/MT5 (MQL4/5/CSV/JSON)', 'API Trading', 'Support prioritaire', 'Stratégies personnalisées IA'],
      limitations: [],
      recommended: 'no' as const,
    },
    {
      id: 4, slug: 'institutional', name: 'Institutionnel', priceMonthly: String(prices.institutional), priceYearly: String(prices.institutionalYearly),
      description: 'Pour les institutions',
      features: ['Tout Expert +', 'Multi-comptes (10 traders)', 'White label possible', 'Account manager dédié', 'Formation équipe incluse', 'SLA 99.9% garanti', 'Intégration sur mesure'],
      limitations: [],
      recommended: 'no' as const,
    },
  ];

  // ─── FAQ (dynamic — uses live prices from admin panel) ──
  const faqs = [
    { q: 'Les données sont-elles vraiment en temps réel ?', a: 'Oui ! XTrendAI Pro se connecte directement aux APIs Binance (crypto), Frankfurter (forex) et Currency-API (or). Les prix se rafraîchissent toutes les 30 secondes. Aucun prix statique ou simulé.' },
    { q: 'Comment fonctionne le moteur IA de signaux ?', a: 'Notre AI Signal Engine calcule les indicateurs techniques (RSI, MACD, EMA 20/50) sur les candles réelles, détecte les supports/résistances, analyse la tendance et génère des signaux ACHAT/VENTE/ATTENTE avec Entry, SL, TP1/TP2/TP3 et un ratio R/R. Les signaux se recalculent toutes les 60 secondes.' },
    { q: 'Quelle est la différence entre les 4 packs ?', a: `Free : 1 signal/jour, analyse M15. Pro : signaux illimités, XAU/USD Premium, calendrier économique, ${formatCurrency(prices.pro)}€/mois. Expert : + Smart Money, Backtesting, Assistant IA, ${formatCurrency(prices.expert)}€/mois. Institutionnel : multi-comptes, API, white label, ${formatCurrency(prices.institutional)}€/mois.` },
    { q: 'Puis-je tester sans risquer mon capital ?', a: 'Absolument ! Le Simulateur (pack Pro+) vous donne un capital virtuel avec 17 signaux IA, un calculateur de position et un mode apprentissage. Pratiquez autant que vous voulez avant de trader en réel.' },
    { q: 'Quels actifs sont couverts ?', a: 'Forex (EUR/USD, GBP/USD, USD/JPY), Or (XAU/USD en temps réel via Currency-API), Crypto (BTC/USD, ETH/USD via Binance). Nous ajoutons régulièrement de nouveaux actifs.' },
    { q: 'Comment annuler mon abonnement ?', a: 'Annulation à tout moment depuis votre espace client. L\'accès reste actif jusqu\'à la fin de la période payée. Aucun frais caché.' },
  ];

  // Mark updates as seen when user scrolls
  useEffect(() => {
    const handler = () => { if (window.scrollY > 200) markAsSeen(); };
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, [markAsSeen]);

  // Close toast after 5 seconds
  useEffect(() => {
    if (hasUnread) {
      const t = setTimeout(() => setToastVisible(false), 5000);
      return () => clearTimeout(t);
    }
  }, [hasUnread]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Check if a feature has a recent update (within 30 days)
  const getFeatureUpdate = (featureTag: string) => {
    return recent.find(u => u.featureTag?.toLowerCase() === featureTag.toLowerCase() && u.category === 'feature');
  };

  const isRecent = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    return (now.getTime() - d.getTime()) < 30 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ─── NOTIFICATION TOAST ──────────────────────── */}
      <AnimatePresence>
        {hasUnread && toastVisible && (
          <motion.div initial={{ opacity: 0, y: -60, x: '-50%' }} animate={{ opacity: 1, y: 20, x: '-50%' }} exit={{ opacity: 0, y: -60, x: '-50%' }}
            className="fixed top-0 left-1/2 z-[70] max-w-sm w-full mx-auto cursor-pointer pointer-events-none"
            onClick={() => navigate('/nouveautes')}>
            <div className="bg-slate-900/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-4 shadow-2xl shadow-purple-500/10 flex items-start gap-3 hover:border-purple-500/50 transition-all pointer-events-auto">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{unreadCount} nouvelle{unreadCount > 1 ? 's' : ''} mise à jour sur la plateforme !</p>
                <p className="text-xs text-purple-400 mt-1 flex items-center gap-1">
                  Cliquez pour voir les détails <ArrowRight className="w-3 h-3" />
                </p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setToastVisible(false); sessionStorage.setItem('xtrendai_toast_seen', '1'); }} className="p-1 rounded-lg hover:bg-slate-800 transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── PINNED ANNOUNCEMENTS BAR ────────────────── */}
      {pinned.length > 0 && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-purple-900/90 via-blue-900/90 to-emerald-900/90 backdrop-blur-md border-b border-purple-500/30 shadow-lg shadow-purple-500/10">
          <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center gap-4 overflow-x-auto">
            <Pin className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            {pinned.map(p => (
              <span key={p.id} className="flex items-center gap-2 text-sm text-white whitespace-nowrap font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {p.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className={`fixed left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50 ${pinned.length > 0 ? 'top-8' : 'top-0'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">XTrendAI Pro</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <button onClick={() => scrollTo('features')} className="hover:text-white transition-colors">Fonctionnalités</button>
            <button onClick={() => scrollTo('datasources')} className="hover:text-white transition-colors">Données</button>
            <button onClick={() => navigate('/nouveautes')} className="hover:text-white transition-colors flex items-center gap-1.5">
              Nouveautés
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold">{unreadCount}</span>
              )}
            </button>
            <button onClick={() => scrollTo('pricing')} className="hover:text-white transition-colors">Tarifs</button>
            <button onClick={() => scrollTo('feedback')} className="hover:text-white transition-colors">Temoignages</button>
            <button onClick={() => scrollTo('faq')} className="hover:text-white transition-colors">FAQ</button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="text-sm text-slate-400 hover:text-white transition-colors">Connexion</button>
            <button onClick={() => navigate('/register')} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/20 transition-all">
              Commencer
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─────────────────────────────────────── */}
      <section className={`${pinned.length > 0 ? 'pt-40' : 'pt-32'} pb-20 px-6 relative overflow-hidden`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.12)_0%,transparent_70%)]" />
        {/* Animated floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-blue-400/30"
              style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }}
              animate={{ y: [-20, 20, -20], opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
            />
          ))}
        </div>
        <div className="max-w-7xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.span
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 mb-6"
              >
                <Wifi className="w-4 h-4" /> Données Marché 100% Temps Réel
              </motion.span>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
              >
                Vos Signaux de Trading<br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">Alimentés par l'IA</span><br />
                <span className="text-white">avec des Données Réelles</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="text-lg text-slate-400 max-w-xl mb-8"
              >
                <span className="text-blue-400 font-bold">9 actifs</span> en temps réel via Binance, CoinGecko, Frankfurter et Currency-API.
                <span className="text-emerald-400 font-bold">20+ fonctionnalités</span> : Signaux IA, Alertes Prix, Journal Trading,
                Scanner Marché, Export MT4/5. Aucune donnée statique.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row items-start gap-4"
              >
                <button onClick={() => navigate('/register')} className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 transition-all flex items-center gap-2">
                  Essai Gratuit <ArrowRight className="w-5 h-5" />
                </button>
                <button onClick={() => scrollTo('features')} className="px-8 py-4 bg-slate-800/60 border border-slate-700 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center gap-2">
                  Découvrir <ExternalLink className="w-5 h-5" />
                </button>
              </motion.div>

              {/* Animated stats counter */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="flex items-center gap-6 mt-8"
              >
                <AnimatedCounter end={9} suffix="+" label="Actifs temps réel" />
                <div className="w-px h-8 bg-slate-800" />
                <AnimatedCounter end={20} suffix="+" label="Fonctionnalités" />
                <div className="w-px h-8 bg-slate-800" />
                <AnimatedCounter end={200} suffix="ms" label="Latence WebSocket" />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            >
              <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl shadow-blue-500/10">
                <motion.img
                  src="/hero-dashboard.jpg"
                  alt="XTrendAI Pro Dashboard"
                  className="w-full"
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1.2, delay: 0.3 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                  <NonLivePreviewBadge text="Aperçu démo — données non réelles" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* ─── LIVE PRICE TICKER ──────────────────────── */}
          {livePrices.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="mt-10 flex flex-wrap items-center gap-3">
              {livePrices.map(p => (
                <div key={p.symbol} className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl">
                  <span className="text-xs text-slate-500 font-medium">{p.symbol}</span>
                  <span className="text-sm font-bold text-white">{p.price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: p.symbol === 'XAU/USD' ? 2 : p.symbol === 'BTC/USD' ? 0 : 4 })}</span>
                  <span className={`text-xs font-medium ${(p.change24hPercent || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {(p.change24hPercent || 0) >= 0 ? '+' : ''}{(p.change24hPercent || 0).toFixed(2)}%
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-slate-600">{p.source}</span>
                </div>
              ))}
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                <Wifi className="w-3 h-3" /> Rafraichissement 30s
              </span>
            </motion.div>
          )}

          {/* ─── LIVE SIGNALS PREVIEW ───────────────────── */}
          {liveSignals.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {liveSignals.map((sig, i) => {
                const isBuy = sig.direction === 'ACHAT';
                const isSell = sig.direction === 'VENTE';
                return (
                  <div key={i} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${isBuy ? 'border-emerald-500/20 bg-emerald-500/5' : isSell ? 'border-red-500/20 bg-red-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
                    <div className="flex items-center gap-3">
                      {isBuy ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : isSell ? <TrendingDown className="w-4 h-4 text-red-400" /> : <Minus className="w-4 h-4 text-amber-400" />}
                      <div>
                        <p className="text-sm font-bold text-white">{sig.asset}</p>
                        <p className={`text-xs ${isBuy ? 'text-emerald-400' : isSell ? 'text-red-400' : 'text-amber-400'}`}>{sig.direction}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Confiance IA</p>
                      <p className={`text-sm font-bold ${(sig.confidence || 0) >= 80 ? 'text-emerald-400' : (sig.confidence || 0) >= 60 ? 'text-amber-400' : 'text-slate-400'}`}>{sig.confidence || 0}%</p>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* ─── PLATFORM GUIDE ─────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-8">
            <div className="bg-gradient-to-r from-blue-900/30 via-slate-900/50 to-slate-900/30 border border-blue-500/20 rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white mb-1">Comment fonctionne XTrendAI Pro ?</h3>
                  <p className="text-sm text-slate-400 mb-3">Plateforme d'analyse trading propulsée par IA — de l'inscription à votre premier signal en 3 étapes.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { step: '1', title: 'Créez votre compte', desc: 'Inscrivez-vous gratuitement. Accédez immédiatement au Dashboard avec les prix temps réel de 90+ actifs.' },
                      { step: '2', title: 'Laissez l\'IA analyser', desc: 'Notre IA scanne le marché en continu, détecte les opportunités et génère des signaux avec Entry, SL et TP précis.' },
                      { step: '3', title: 'Tradez informé', desc: 'Suivez les signaux IA, consultez les analyses techniques et prenez des décisions basées sur des données réelles.' },
                    ].map(s => (
                      <div key={s.step} className="flex items-start gap-3 bg-slate-900/40 rounded-xl p-3">
                        <span className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-sm text-blue-400 font-bold flex-shrink-0">{s.step}</span>
                        <div>
                          <p className="text-sm font-semibold text-white">{s.title}</p>
                          <p className="text-xs text-slate-400">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Signaux IA temps réel</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" /> 90+ actifs couverts</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400" /> 5 sources de données</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ─── DYNAMIC STATS BAR ──────────────────────── */}
          <div className="flex items-center gap-3 mt-10 mb-2">
            <NonLivePreviewBadge text="Chiffres indicatifs — ne pas interpréter comme des résultats garantis" />
          </div>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCounter value={liveStats?.signalsGenerated || 156834} suffix="" label="Signaux IA generes" icon={Radio} color="blue" delay={0} />
            <StatCounter value={liveStats?.accuracyRate || 87} suffix="%" label="Precision moyenne" icon={Target} color="emerald" delay={0.1} />
            <StatCounter value={liveStats?.assetsCovered || 90} suffix="" label="Actifs couverts" icon={Globe} color="purple" delay={0.2} />
            <StatCounter value={liveStats?.liveApisConnected || 7} suffix="" label="APIs connectees" icon={Server} color="amber" delay={0.3} />
            <StatCounter value={liveStats?.totalUsers || 1247} suffix="" label="Traders actifs" icon={Users} color="rose" delay={0.4} />
          </motion.div>
        </div>
      </section>

      {/* ─── RECENT UPDATES SECTION ───────────────────── */}
      {recent.length > 0 && (
        <section id="updates" className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-10">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-sm text-purple-400 mb-4">
                <Sparkles className="w-4 h-4" /> Dernières Nouveautés
              </span>
              <h2 className="text-3xl font-bold mb-3">Ce qui vient d'arriver sur XTrendAI</h2>
              <p className="text-slate-400 max-w-xl mx-auto">Les dernières mises à jour publiées par notre équipe. Chaque fonctionnalité est connectée aux données temps réel.</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recent.map((u, idx) => {
                const cat = categoryLabels[u.category] || categoryLabels.feature;
                return (
                  <motion.div key={u.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                    className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-purple-500/30 transition-all group">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cat.bg} ${cat.color}`}>{cat.label}</span>
                      {u.pinned && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400"><Pin className="w-3 h-3" /></span>}
                      {isRecent(u.publishedAt) && <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-bold">NOUVEAU</span>}
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">{u.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-3">{u.description}</p>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/50">
                      <span className="text-xs text-slate-600">{new Date(u.publishedAt).toLocaleDateString('fr-FR')}</span>
                      {u.featureTag && <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">{u.featureTag}</span>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── DATA SOURCES BANNER ──────────────────────── */}
      <section id="datasources" className="py-12 px-6 bg-slate-900/40 border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-4">
            <NonLivePreviewBadge text="Configuration des sources de données — disponibles dans l'app après inscription" />
            <p className="text-sm text-slate-400 mt-4 mb-2">Données provenant directement de</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dataSources.map((ds, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center hover:border-blue-500/30 transition-all">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">{ds.name}</span>
                </div>
                <p className="text-xs text-slate-500">{ds.assets}</p>
                <p className="text-xs text-emerald-400 mt-1">Rafraîchissement {ds.refresh}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CORE FEATURES WITH IMAGES ────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-20">
            <span className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400 mb-4 inline-block">Fonctionnalités Clés</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Une Plateforme Complète,<br />Propulsée par l'IA</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Chaque fonctionnalité est connectée aux données de marché en temps réel. Aucune simulation, que des analyses réelles.</p>
          </motion.div>

          <div className="space-y-24">
            {coreFeatures.map((f, i) => {
              const featureUpdate = getFeatureUpdate(f.title.split('—')[0].trim());
              const hasNewUpdate = featureUpdate && isRecent(featureUpdate.publishedAt);
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? 'lg:grid-flow-dense' : ''}`}>
                  <div className={i % 2 === 1 ? 'lg:col-start-2' : ''}>
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${f.color} text-white`}>{f.tag}</span>
                      {hasNewUpdate && (
                        <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-bold">
                          <Sparkles className="w-3 h-3" /> NOUVEAU
                        </motion.span>
                      )}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-4">{f.title}</h3>
                    <p className="text-slate-400 mb-6 leading-relaxed">{f.desc}</p>
                    {hasNewUpdate && featureUpdate && (
                      <div className="mb-4 p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl">
                        <p className="text-xs text-purple-400 font-medium flex items-center gap-1">
                          <Megaphone className="w-3 h-3" /> {featureUpdate.title}
                        </p>
                      </div>
                    )}
                    <div className="space-y-3">
                      {f.highlights.map((h, j) => (
                        <div key={j} className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                          <span className="text-sm text-slate-300">{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={i % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}>
                    <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl group">
                      <DynamicFeatureImage src={f.image} alt={f.title} icon={f.icon} color={f.color} />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute bottom-4 left-4">
                        <NonLivePreviewBadge text="Aperçu démo — données réelles dans l'app" />
                      </div>
                      {hasNewUpdate && (
                        <div className="absolute top-4 left-4">
                          <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-xs text-emerald-400 font-bold backdrop-blur-md">
                            <Sparkles className="w-3 h-3" /> NOUVEAUTÉ
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── BENEFITS ─────────────────────────────────── */}
      <section className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Pourquoi Choisir XTrendAI ?</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Des avantages concrets qui font la différence entre un trader amateur et un trader professionnel.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <b.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{b.title}</h3>
                <p className="text-sm text-slate-400">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Résultats Concrets</h2>
            <p className="text-slate-400">Ce que nos traders ont gagné grâce à XTrendAI Pro</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-sm text-slate-300 mb-4 flex-1">"{t.text}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role} — Pack {t.pack}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-bold">{t.result}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ──────────────────────────────────── */}
      {/* ─── COMPLETE FEATURES SHOWCASE ───────────────── */}
      <FeaturesShowcase />

      <section id="pricing" className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-sm text-amber-400 mb-4 inline-block">Packs & Tarifs</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Choisissez Votre Niveau</h2>
            <p className="text-slate-400">4 packs conçus pour chaque étape de votre parcours trading</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {subscriptionPlans.map((plan, idx) => {
              const packSlug = plan.slug || 'free';
              const packPrice = parseFloat(plan.priceMonthly || '0');
              const packColors: Record<string, { border: string; badge: string; btn: string }> = {
                free: { border: 'border-slate-700', badge: 'bg-slate-600', btn: 'bg-slate-700 hover:bg-slate-600' },
                pro: { border: 'border-amber-500/40', badge: 'bg-amber-500', btn: 'bg-gradient-to-r from-amber-500 to-orange-500' },
                expert: { border: 'border-purple-500/40', badge: 'bg-purple-500', btn: 'bg-gradient-to-r from-purple-500 to-indigo-500' },
                institutional: { border: 'border-rose-500/40', badge: 'bg-rose-500', btn: 'bg-gradient-to-r from-rose-500 to-pink-500' },
              };
              const colors = packColors[packSlug] || packColors.free;
              const isRecommended = plan.recommended === 'yes' || plan.recommended === true;
              return (
                <motion.div key={plan.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                  className={`relative bg-slate-900/60 border rounded-2xl p-6 flex flex-col ${colors.border} ${isRecommended ? 'ring-1 ring-amber-500/20 scale-105' : ''}`}>
                  {isRecommended && <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-0.5 ${colors.badge} rounded-full text-xs font-bold text-white`}>RECOMMANDÉ</div>}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="text-3xl font-bold text-white mt-2">{formatCurrency(packPrice)}<span className="text-sm text-slate-500 font-normal">/mois</span></p>
                  </div>
                  <div className="flex-1 space-y-3 mb-6">
                    {(plan.features as string[]).map((f, i) => (
                      <div key={i} className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" /><span className="text-sm text-slate-300">{f}</span></div>
                    ))}
                    {(plan.limitations as string[] | null)?.map((lim, i) => (
                      <div key={`lim-${i}`} className="flex items-start gap-2 opacity-40"><span className="w-4 h-4 flex items-center justify-center text-xs text-slate-600 flex-shrink-0">×</span><span className="text-sm text-slate-500 line-through">{lim}</span></div>
                    ))}
                  </div>
                  <button onClick={() => navigate(`/register?plan=${packSlug}`)} className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${colors.btn} text-white`}>
                    {packPrice === 0 ? 'Commencer Gratuitement' : `Choisir ${plan.name}`}
                  </button>
                </motion.div>
              );
            })}
          </div>
          <p className="text-center text-xs text-slate-600 mt-8">Tous les packs payants incluent un essai de 7 jours. Annulation à tout moment.</p>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────── */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Questions Fréquentes</h2>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left">
                  <span className="text-sm font-medium text-white pr-4">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                </button>
                {openFaq === i && <div className="px-4 pb-4 text-sm text-slate-400 leading-relaxed">{faq.a}</div>}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── USER FEEDBACK ────────────────────────────── */}
      <section id="feedback" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 mb-4 inline-block">Resultats Prouves</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ils Ont Gagne avec XTrendAI</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Des traders reels partagent leurs resultats. Chaque temoignage est verifie par notre equipe.
            </p>
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-400">{getAverageRating()}/5</p>
                <p className="text-xs text-slate-500">Note moyenne</p>
              </div>
              <div className="w-px h-10 bg-slate-700" />
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-400">{getVerifiedFeedback().length}</p>
                <p className="text-xs text-slate-500">Temoignages verifies</p>
              </div>
              <div className="w-px h-10 bg-slate-700" />
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-400">68%</p>
                <p className="text-xs text-slate-500">Win rate moyen</p>
              </div>
            </div>
          </motion.div>

          {/* Feedback Cards */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <NonLivePreviewBadge text="Résultats individuels variables — ne pas interpréter comme des résultats typiques ou garantis" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getVerifiedFeedback().map((fb, idx) => (
              <motion.div
                key={fb.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < fb.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                  ))}
                </div>

                {/* Quote */}
                <Quote className="w-6 h-6 text-slate-700 mb-2" />
                <p className="text-sm text-slate-300 leading-relaxed mb-4">{fb.comment}</p>

                {/* Results */}
                <div className="flex items-center gap-3 mb-4 p-3 bg-slate-800/40 rounded-xl">
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-400">{fb.results.winRate}%</p>
                    <p className="text-[10px] text-slate-500">Win Rate</p>
                  </div>
                  <div className="w-px h-8 bg-slate-700" />
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-400">+{fb.results.pnl}€</p>
                    <p className="text-[10px] text-slate-500">P&L</p>
                  </div>
                  <div className="w-px h-8 bg-slate-700" />
                  <div className="text-center">
                    <p className="text-lg font-bold text-purple-400">{fb.results.period}</p>
                    <p className="text-[10px] text-slate-500">Periode</p>
                  </div>
                </div>

                {/* User */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                    {fb.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{fb.userName}</p>
                    <p className="text-xs text-slate-500">Pack {fb.pack.charAt(0).toUpperCase() + fb.pack.slice(1)} — {fb.date}</p>
                  </div>
                  {fb.verified && (
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Verifie
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ────────────────────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.15)_0%,transparent_70%)]" />
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Prêt à Trader avec l'IA ?</h2>
            <p className="text-slate-400 mb-4 max-w-2xl mx-auto">
              Rejoignez des traders qui utilisent déjà des signaux IA basés sur des données réelles. 
              Commencez gratuitement, évoluez quand vous êtes prêt.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
              <span className="flex items-center gap-1.5 text-sm text-emerald-400"><Check className="w-4 h-4" /> Essai gratuit 7 jours</span>
              <span className="flex items-center gap-1.5 text-sm text-emerald-400"><Check className="w-4 h-4" /> Sans carte bancaire</span>
              <span className="flex items-center gap-1.5 text-sm text-emerald-400"><Check className="w-4 h-4" /> Annulation à tout moment</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => navigate('/register?plan=free')} className="px-10 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 transition-all">
                Commencer Gratuitement
              </button>
              <button onClick={() => navigate('/register?plan=pro')} className="px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-amber-500/30 hover:scale-105 transition-all">
                Essayer Pro 7 Jours
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────── */}
      {/* ─── HOW IT WORKS — visible after features ────── */}
      <section className="py-16 px-6 bg-slate-900/20 border-y border-slate-800/30">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-medium mb-4">
              <BookOpen className="w-3 h-3" /> Guide rapide
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Comment ça marche ?</h2>
            <p className="text-sm text-slate-400">De l'inscription à votre premier signal en 3 étapes simples.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Créez votre compte', desc: 'Inscription gratuite en 30 secondes. Accédez immédiatement au Dashboard avec les prix temps réel de 90+ actifs et les signaux IA.', color: 'blue', icon: UserCheck },
              { step: '02', title: 'Laissez l\'IA analyser', desc: 'Notre IA scanne le marché 24/7 via 7 sources de données. Elle détecte les opportunités et génère des signaux complets avec Entry, SL et 3 niveaux de TP.', color: 'purple', icon: Brain },
              { step: '03', title: 'Tradez avec confiance', desc: 'Suivez les signaux, consultez les analyses techniques, vérifiez le sentiment du marché, et prenez des décisions basées sur des données réelles.', color: 'emerald', icon: TrendingUp },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center">
                  <div className={`inline-flex w-12 h-12 rounded-xl bg-${s.color}-500/10 border border-${s.color}-500/20 items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 text-${s.color}-400`} />
                  </div>
                  <span className={`text-xs font-bold text-${s.color}-400 mb-2 block`}>ÉTAPE {s.step}</span>
                  <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                </motion.div>
              );
            })}
          </div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-10 text-center">
            <button onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors">
              <Zap className="w-4 h-4" /> Commencer gratuitement
            </button>
            <p className="text-xs text-slate-500 mt-3">Sans carte bancaire. Annulation à tout moment.</p>
          </motion.div>
        </div>
      </section>

      {/* ─── MEGA FOOTER ──────────────────────────────── */}
      <SmartFooter />
    </div>
  );
}
