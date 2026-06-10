/**
 * MarketSentimentPanel — Affichage complet du sentiment et volatilité du marché
 * Fear & Greed Index + Sentiment par catégorie + Heatmap + Corrélations
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, TrendingUp, TrendingDown, Zap, Shield,
  Flame, Snowflake, Gauge, BarChart3, GitCompare,
  ChevronDown, ChevronUp, Eye, AlertTriangle, Globe,
  DollarSign, Bitcoin, Gem, Fuel, Wheat,
} from 'lucide-react';
import { useLiveData } from '@/hooks/useLiveData';
import { DataFreshnessMonitor } from '@/components/DataFreshnessMonitor';
import { FeatureGuide } from '@/components/FeatureGuide';
import { getCachedSentiment } from '@/services/marketSentimentService';
import type { MarketSentiment, CategorySentiment, AssetHeatmap } from '@/services/marketSentimentService';

const CATEGORY_ICONS: Record<string, any> = {
  'Forex': DollarSign,
  'Crypto': Bitcoin,
  'Metaux': Gem,
  'Indices': BarChart3,
  'Energies': Fuel,
  'Agriculture': Wheat,
};

const CATEGORY_COLORS: Record<string, string> = {
  'Forex': 'from-blue-500/20 to-blue-600/10 border-blue-500/20',
  'Crypto': 'from-orange-500/20 to-orange-600/10 border-orange-500/20',
  'Metaux': 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/20',
  'Indices': 'from-purple-500/20 to-purple-600/10 border-purple-500/20',
  'Energies': 'from-red-500/20 to-red-600/10 border-red-500/20',
  'Agriculture': 'from-green-500/20 to-green-600/10 border-green-500/20',
};

function SentimentGauge({ value, label, color, size = 'lg' }: { value: number; label: string; color: string; size?: 'sm' | 'lg' }) {
  const radius = size === 'lg' ? 70 : 45;
  const stroke = size === 'lg' ? 12 : 8;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (value / 100) * circ * 0.75; // 270° arc

  const getColor = (v: number) => {
    if (v <= 20) return '#ef4444';
    if (v <= 40) return '#f97316';
    if (v <= 60) return '#eab308';
    if (v <= 80) return '#22c55e';
    return '#10b981';
  };

  const getGlow = (v: number) => {
    if (v <= 20) return 'drop-shadow(0 0 8px rgba(239,68,68,0.5))';
    if (v <= 40) return 'drop-shadow(0 0 6px rgba(249,115,22,0.4))';
    if (v <= 60) return 'drop-shadow(0 0 6px rgba(234,179,8,0.4))';
    if (v <= 80) return 'drop-shadow(0 0 8px rgba(34,197,94,0.5))';
    return 'drop-shadow(0 0 10px rgba(16,185,129,0.6))';
  };

  // Zone markers
  const zones = [
    { label: 'Peur Extrême', start: 0, end: 20, color: '#ef4444' },
    { label: 'Peur', start: 20, end: 40, color: '#f97316' },
    { label: 'Neutre', start: 40, end: 60, color: '#eab308' },
    { label: 'Avarice', start: 60, end: 80, color: '#22c55e' },
    { label: 'Avarice Extrême', start: 80, end: 100, color: '#10b981' },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg
          width={radius * 2 + stroke * 2}
          height={radius * 2 + stroke * 2}
          className="transform -rotate-[135deg]"
          style={{ filter: getGlow(value) }}
        >
          {/* Background arc */}
          <circle cx={radius + stroke} cy={radius + stroke} r={radius} fill="none"
            stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
          {/* Colored zones */}
          {zones.map((z, i) => {
            const zOffset = circ - (z.start / 100) * circ * 0.75;
            const zDash = ((z.end - z.start) / 100) * circ * 0.75;
            return (
              <circle key={i} cx={radius + stroke} cy={radius + stroke} r={radius} fill="none"
                stroke={z.color} strokeWidth={stroke * 0.3} opacity={0.3}
                strokeDasharray={`${zDash} ${circ - zDash}`}
                strokeDashoffset={-zOffset + circ}
                strokeLinecap="butt" />
            );
          })}
          {/* Value arc */}
          <circle cx={radius + stroke} cy={radius + stroke} r={radius} fill="none"
            stroke={getColor(value)} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ transform: 'rotate(0deg)' }}>
          <p className={`font-bold ${size === 'lg' ? 'text-3xl' : 'text-xl'} ${color}`}>{value}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
        </div>
      </div>
      {/* Zone labels */}
      {size === 'lg' && (
        <div className="flex gap-3 mt-3 flex-wrap justify-center">
          {zones.map((z, i) => (
            <span key={i} className="flex items-center gap-1 text-[9px] text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: z.color }} />
              {z.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryCard({ cat }: { cat: CategorySentiment }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = CATEGORY_ICONS[cat.category] || Globe;

  const trendConfig = {
    haussier: { icon: TrendingUp, color: 'text-emerald-400', label: 'Haussier' },
    baissier: { icon: TrendingDown, color: 'text-red-400', label: 'Baissier' },
    neutre: { icon: Activity, color: 'text-amber-400', label: 'Neutre' },
    volatile: { icon: Zap, color: 'text-purple-400', label: 'Volatile' },
  };
  const trend = trendConfig[cat.trend];
  const TrendIcon = trend.icon;

  return (
    <motion.div
      layout
      className={`bg-gradient-to-br ${CATEGORY_COLORS[cat.category]} border rounded-2xl p-4`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
            <Icon className="w-4 h-4 text-white" />
          </div>
          <p className="font-bold text-white">{cat.category}</p>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-white/5 rounded-lg transition-colors">
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
      </div>

      <div className="flex items-center gap-4">
        <SentimentGauge value={cat.fearGreed} label={cat.fearGreedLabel} color={cat.color} size="sm" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <TrendIcon className={`w-4 h-4 ${trend.color}`} />
            <span className={`text-sm font-medium ${trend.color}`}>{trend.label}</span>
            <span className="text-xs text-slate-500 ml-auto">Force {cat.trendStrength}%</span>
          </div>
          <p className={`text-sm font-mono ${cat.avgChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {cat.avgChange24h >= 0 ? '+' : ''}{cat.avgChange24h.toFixed(2)}% (avg 24h)
          </p>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
            <div className="h-full bg-emerald-500" style={{ width: `${cat.breadthBullish}%` }} />
            <div className="h-full bg-amber-500" style={{ width: `${cat.breadthNeutral}%` }} />
            <div className="h-full bg-red-500" style={{ width: `${cat.breadthBearish}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500">
            <span className="text-emerald-400">{cat.breadthBullish}% haussier</span>
            <span>{cat.breadthNeutral}% neutre</span>
            <span className="text-red-400">{cat.breadthBearish}% baissier</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Volatilité</span>
                <span className="text-slate-300 font-mono">{cat.volatility.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Momentum</span>
                <span className={`font-mono ${cat.momentum > 0 ? 'text-emerald-400' : cat.momentum < 0 ? 'text-red-400' : 'text-slate-300'}`}>{cat.momentum > 0 ? '+' : ''}{cat.momentum}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Niveau clé</span>
                <span className="text-blue-400">{cat.keyLevel}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function HeatmapCell({ asset }: { asset: AssetHeatmap }) {
  const intensity = Math.min(1, Math.abs(asset.change24h) / 5);
  const isUp = asset.change24h >= 0;

  // Gradient background based on intensity
  const bg = isUp
    ? `linear-gradient(135deg, rgba(16,185,129,${0.08 + intensity * 0.22}) 0%, rgba(34,197,94,${0.05 + intensity * 0.15}) 100%)`
    : `linear-gradient(135deg, rgba(239,68,68,${0.08 + intensity * 0.22}) 0%, rgba(220,38,38,${0.05 + intensity * 0.15}) 100%)`;

  const borderColor = isUp
    ? `rgba(34,197,94,${0.15 + intensity * 0.35})`
    : `rgba(239,68,68,${0.15 + intensity * 0.35})`;

  const textColor = isUp
    ? `rgb(${Math.round(52 + 80 * intensity)}, 211, ${Math.round(153 - 20 * intensity)})`
    : `rgb(239, ${Math.round(68 + 40 * intensity)}, ${Math.round(68 + 20 * intensity)})`;

  // Signal badge
  const signalColor = asset.signal === 'ACHAT' ? 'bg-emerald-500/30 text-emerald-300' :
    asset.signal === 'VENTE' ? 'bg-red-500/30 text-red-300' : 'bg-slate-500/20 text-slate-400';

  return (
    <motion.div
      whileHover={{ scale: 1.08, zIndex: 10 }}
      className="rounded-xl p-2.5 text-center cursor-pointer border relative overflow-hidden"
      style={{
        background: bg,
        borderColor: borderColor,
        borderWidth: '1px',
      }}
      title={`${asset.asset}: ${asset.change24h >= 0 ? '+' : ''}${asset.change24h.toFixed(2)}% | RSI: ${asset.rsi} | Vol: ${asset.volatility.toFixed(1)}% | Signal: ${asset.signal}`}
    >
      {/* Signal dot */}
      <span className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${signalColor.split(' ')[0]}`} />
      <p className="text-[9px] text-slate-400 font-medium truncate">{asset.asset}</p>
      <p className="text-sm font-bold font-mono" style={{ color: textColor }}>
        {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
      </p>
      {/* Mini bar */}
      <div className="w-full h-0.5 bg-slate-800/50 rounded-full mt-1 overflow-hidden">
        <div
          className={`h-full rounded-full ${isUp ? 'bg-emerald-400' : 'bg-red-400'}`}
          style={{ width: `${Math.min(100, intensity * 100)}%` }}
        />
      </div>
    </motion.div>
  );
}

function MiniList({ title, items, color }: { title: string; items: AssetHeatmap[]; color: string }) {
  if (items.length === 0) return null;
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
      <p className={`text-sm font-semibold mb-3 ${color}`}>{title}</p>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-sm text-white font-medium">{item.asset}</span>
            <div className="text-right">
              <span className={`text-sm font-mono font-bold ${item.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(2)}%
              </span>
              <span className="text-[10px] text-slate-500 ml-2">vol {item.volatility.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CorrelationMatrix({ correlations }: { correlations: MarketSentiment['correlations'] }) {
  if (correlations.length === 0) return null;
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
      <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <GitCompare className="w-4 h-4 text-blue-400" /> Corrélations
      </p>
      <div className="space-y-2">
        {correlations.map((c, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-slate-400">{c.assetA} ↔ {c.assetB}</span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full ${c.correlation > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.abs(c.correlation) * 100}%` }} />
              </div>
              <span className={`font-mono font-bold w-10 text-right ${c.correlation > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {c.correlation > 0 ? '+' : ''}{c.correlation.toFixed(2)}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${c.strength === 'forte' ? 'bg-emerald-500/10 text-emerald-400' : c.strength === 'moderee' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-500/10 text-slate-400'}`}>
                {c.strength}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Guide spécifique ───────────────────────────────────

function SentimentGuide() {
  return (
    <FeatureGuide
      pageId="sentiment"
      title="Sentiment & Volatilité du Marché"
      description="Analyse complète du sentiment global et par catégorie. Le Fear & Greed Index composite (0-100) agrège le momentum, la volatilité et le breadth pour mesurer l'émotion du marché. Chaque catégorie (Forex, Crypto, Métaux, Indices, Énergies) a son propre sentiment, sa volatilité et sa tendance."
      dataSource="Prix live + calculs techniques (RSI, momentum, breadth)"
      steps={[
        { title: 'Lire le Fear & Greed global', desc: '0-20 = Peur Extrême (opportunité d\'achat), 80-100 = Avarice Extrême (prudence).' },
        { title: 'Analyser par catégorie', desc: 'Chaque carte montre le sentiment, la tendance, la volatilité et le breadth d\'une classe d\'actifs.' },
        { title: 'Consulter la Heatmap', desc: 'Vue d\'ensemble colorée : vert = hausse, rouge = baisse, intensité = force du mouvement.' },
        { title: 'Vérifier les corrélations', desc: 'Identifiez quels actifs bougent ensemble (corrélation positive) ou en opposition (négative).' },
        { title: 'Observer Risk On/Off', desc: 'Risk-On = marché confiant (crypto/indices montent). Risk-Off = fuite vers les safe havens (or, yen).' },
      ]}
      tips={[
        'Fear & Greed < 25 = zone d\'achat historiquement profitable.',
        'Fear & Greed > 75 = zone de prise de profits ou hedge.',
        'Les safe havens (XAU, JPY, CHF) montent en Risk-Off.',
        'Une volatilité > 3% sur les indices = attention, correction possible.',
        'Corrélation forte (>0.7) = diversification limitée entre ces actifs.',
      ]}
    />
  );
}

// ─── Main Component ─────────────────────────────────────

export default function MarketSentimentPage() {
  const { data: liveData } = useLiveData();
  const [activeTab, setActiveTab] = useState<'overview' | 'heatmap' | 'correlations'>('overview');

  const sentiment = useMemo(() => {
    return getCachedSentiment(liveData);
  }, [liveData]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Sentiment & Volatilité</h1>
          <p className="text-xs text-slate-400">Analyse complète du marché — Fear & Greed + Heatmap + Corrélations</p>
        </div>
        <DataFreshnessMonitor />
      </div>

      <SentimentGuide />

      {/* Global Fear & Greed — Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900/80 to-slate-900/60 border border-slate-800 rounded-2xl p-6">
        {/* Animated background glow based on sentiment */}
        <div className={`absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl opacity-20 ${
          sentiment.globalFearGreed > 60 ? 'bg-emerald-500' :
          sentiment.globalFearGreed < 40 ? 'bg-red-500' : 'bg-amber-500'
        }`} />

        <div className="relative flex flex-col md:flex-row items-center gap-8">
          <SentimentGauge value={sentiment.globalFearGreed} label={sentiment.globalLabel} color={sentiment.globalColor} size="lg" />
          <div className="flex-1 space-y-4">
            <div>
              <p className={`text-3xl font-bold ${sentiment.globalColor}`}>{sentiment.globalLabel}</p>
              <p className="text-sm text-slate-500 mt-1">Fear & Greed Index — Score: {sentiment.globalFearGreed}/100</p>
            </div>

            {/* Indicators row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <Gauge className="w-4 h-4 text-purple-400" />
                <div>
                  <p className="text-[10px] text-slate-500">VIX Estimé</p>
                  <p className="text-sm font-bold text-white">{sentiment.vixEstimate}</p>
                </div>
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                sentiment.riskOnRiskOff === 'risk-on' ? 'bg-emerald-500/10 border-emerald-500/20' :
                sentiment.riskOnRiskOff === 'risk-off' ? 'bg-red-500/10 border-red-500/20' :
                'bg-slate-800/60 border-slate-700/50'
              }`}>
                {sentiment.riskOnRiskOff === 'risk-on' ? <Flame className="w-4 h-4 text-emerald-400" /> :
                 sentiment.riskOnRiskOff === 'risk-off' ? <Snowflake className="w-4 h-4 text-red-400" /> :
                 <Activity className="w-4 h-4 text-slate-400" />}
                <div>
                  <p className="text-[10px] text-slate-500">Mode Marché</p>
                  <p className={`text-sm font-bold ${
                    sentiment.riskOnRiskOff === 'risk-on' ? 'text-emerald-400' :
                    sentiment.riskOnRiskOff === 'risk-off' ? 'text-red-400' : 'text-slate-300'
                  }`}>
                    {sentiment.riskOnRiskOff === 'risk-on' ? 'Risk-On' : sentiment.riskOnRiskOff === 'risk-off' ? 'Risk-Off' : 'Neutre'}
                  </p>
                </div>
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                sentiment.safeHavenFlow === 'inflow' ? 'bg-amber-500/10 border-amber-500/20' :
                sentiment.safeHavenFlow === 'outflow' ? 'bg-blue-500/10 border-blue-500/20' :
                'bg-slate-800/60 border-slate-700/50'
              }`}>
                <Shield className={`w-4 h-4 ${
                  sentiment.safeHavenFlow === 'inflow' ? 'text-amber-400' :
                  sentiment.safeHavenFlow === 'outflow' ? 'text-blue-400' : 'text-slate-400'
                }`} />
                <div>
                  <p className="text-[10px] text-slate-500">Safe Haven</p>
                  <p className={`text-sm font-bold ${
                    sentiment.safeHavenFlow === 'inflow' ? 'text-amber-400' :
                    sentiment.safeHavenFlow === 'outflow' ? 'text-blue-400' : 'text-slate-300'
                  }`}>
                    {sentiment.safeHavenFlow === 'inflow' ? 'Entrées' : sentiment.safeHavenFlow === 'outflow' ? 'Sorties' : 'Stable'}
                  </p>
                </div>
              </div>
            </div>

            {/* Interpretation */}
            <p className="text-xs text-slate-400 leading-relaxed">
              {sentiment.globalFearGreed <= 20 ? 'Le marché est en panique. Les prix peuvent être sous-évalués — opportunité d\'achat potentielle pour les investisseurs à long terme.' :
               sentiment.globalFearGreed <= 40 ? 'Le sentiment est négatif. Prudence recommandée, mais les niveaux d\'entrée s\'améliorent.' :
               sentiment.globalFearGreed <= 60 ? 'Le marché est équilibré. Ni peur ni euphorie — conditions normales de trading.' :
               sentiment.globalFearGreed <= 80 ? 'Le sentiment est positif. Le marché montre de l\'optimisme — surveillance des prises de profits.' :
               'Euphorie détectée. Le marché peut être surévalué — prudence et gestion du risque renforcée.'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([
          ['overview', 'Vue d\'ensemble', Eye],
          ['heatmap', 'Heatmap', Flame],
          ['correlations', 'Corrélations', GitCompare],
        ] as [string, string, any][]).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === key ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'bg-slate-900/60 border border-slate-800 text-slate-400'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Category Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sentiment.categories.map(cat => (
                <CategoryCard key={cat.category} cat={cat} />
              ))}
            </div>

            {/* Top Gainers / Losers / Most Volatile */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MiniList title="Top Gainers 24h" items={sentiment.topGainers} color="text-emerald-400" />
              <MiniList title="Top Losers 24h" items={sentiment.topLosers} color="text-red-400" />
              <MiniList title="Plus Volatiles" items={sentiment.mostVolatile} color="text-purple-400" />
            </div>
          </motion.div>
        )}

        {activeTab === 'heatmap' && (
          <motion.div key="heatmap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Flame className="w-4 h-4 text-pink-400" /> Heatmap du Marché
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5">
                {sentiment.heatmap
                  .sort((a, b) => b.change24h - a.change24h)
                  .map(asset => (
                    <HeatmapCell key={asset.asset} asset={asset} />
                  ))}
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500/30" /> Haussier fort</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500/10" /> Haussier léger</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-700" /> Neutre</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500/10" /> Baissier léger</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500/30" /> Baissier fort</span>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'correlations' && (
          <motion.div key="correlations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CorrelationMatrix correlations={sentiment.correlations} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
