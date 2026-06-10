/**
 * Analyse Technique Avancée
 * Tableau professionnel de signaux avec filtres complets, grading A+/B/C/D,
 * marché en un coup d'œil, et catalogue global d'actifs.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarketData, useCandles } from '@/hooks/useMarketData';
import { useAssetSignal } from '@/hooks/useAISignals';
import { TechnicalPanel } from '@/components/TechnicalPanel';
import { PriceChart } from '@/components/PriceChart';
import { detectAllSignals, type TechnicalSignal } from '@/services/technicalSignals';
import { calculateGrade, detectNoTradeZone, analyzeRiskBeforeProfit, calculateFinalDecision } from '@/services/profitabilityEngine';
import { GRADE_LEGEND } from '@/services/gradeLegend';
import {
  ASSET_CATALOG, ASSET_CATEGORIES_UI, TIMEFRAMES_UI, PERIOD_OPTIONS,
  getCategoryLabel, type AssetCategory, type MarketType,
} from '@/services/assetCatalog';
import {
  BarChart3, TrendingUp, TrendingDown, Minus, Star, AlertTriangle,
  CheckCircle, XCircle, Filter, ChevronDown, ChevronUp, Wifi,
  RefreshCw, Eye, Search, Zap, Shield, Target, ArrowRight,
  Clock, Activity, HelpCircle, X, Download, FileText, Ban,
  Crown, TrendingDown as TrendDownIcon, Layers
} from 'lucide-react';
import { AnalyseTechniqueGuide } from '@/components/FeatureGuide';

// ─── Grade Badge Colors (from profitabilityEngine) ──────
const GRADE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'A+': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'A':  { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/25' },
  'B':  { bg: 'bg-blue-500/15',    text: 'text-blue-400',    border: 'border-blue-500/25' },
  'C':  { bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/25' },
  'D':  { bg: 'bg-red-500/15',     text: 'text-red-400',     border: 'border-red-500/25' },
};

// ─── Main Component ─────────────────────────────────────

export default function Technical() {
  // Filters
  const [selectedMarket, setSelectedMarket] = useState<MarketType | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'ALL'>('ALL');
  const [selectedAsset, setSelectedAsset] = useState<string>('XAU/USD');
  const [selectedTimeframe, setSelectedTimeframe] = useState('H1');
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [signalFilter, setSignalFilter] = useState<'ALL' | 'buy' | 'sell' | 'neutral'>('ALL');
  const [gradeFilter, setGradeFilter] = useState<'ALL' | 'A' | 'B' | 'C' | 'D'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);

  // Get candles for selected asset (anchored to live price for accuracy)
  const { prices } = useMarketData();
  const currentPrice = prices[selectedAsset]?.price || 0;
  const { candles } = useCandles(selectedAsset as any, selectedTimeframe as any, currentPrice);

  // Detect technical signals
  const techSignals = useMemo(() => {
    if (candles.length < 20 || !currentPrice) return [];
    return detectAllSignals(candles, currentPrice);
  }, [candles, currentPrice]);

  // Compute grade using profitability engine
  const signalData = useAssetSignal(selectedAsset);
  const grade = useMemo(() => {
    if (!signalData.signal) return null;
    return calculateGrade(signalData.signal, 0, 0);
  }, [signalData.signal]);

  // No trade detection
  const noTrade = useMemo(() => {
    if (!signalData.signal) return null;
    return detectNoTradeZone(signalData.signal);
  }, [signalData.signal]);

  // Risk analysis
  const risk = useMemo(() => {
    if (!signalData.signal) return null;
    return analyzeRiskBeforeProfit(signalData.signal);
  }, [signalData.signal]);

  // Decision
  const decision = useMemo(() => {
    if (!grade || !noTrade || !risk || !signalData.signal) return null;
    return calculateFinalDecision(signalData.signal, grade, noTrade, risk);
  }, [grade, noTrade, risk, signalData.signal]);

  // Filter assets
  const filteredAssets = useMemo(() => {
    let assets = [...ASSET_CATALOG];
    if (selectedMarket !== 'ALL') assets = assets.filter(a => a.market === selectedMarket);
    if (selectedCategory !== 'ALL') assets = assets.filter(a => a.category === selectedCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      assets = assets.filter(a => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));
    }
    // Note: signalFilter (buy/sell/neutral) is applied to the SignalsTable below,
    // NOT to the asset list. Filtering assets by signal creates a circular dependency
    // since techSignals are computed FROM the selected asset.
    return assets;
  }, [selectedMarket, selectedCategory, searchQuery]);

  // Market at a glance
  const bullishCount = techSignals.filter(s => s.direction === 'bullish').length;
  const bearishCount = techSignals.filter(s => s.direction === 'bearish').length;
  const criticalSignals = techSignals.filter(s => s.importance === 'critical');

  // Filter signals for the table (not the asset list)
  const filteredSignals = useMemo(() => {
    if (signalFilter === 'ALL') return techSignals;
    return techSignals.filter(s => {
      if (signalFilter === 'buy') return s.direction === 'bullish';
      if (signalFilter === 'sell') return s.direction === 'bearish';
      if (signalFilter === 'neutral') return s.direction === 'neutral';
      return true;
    });
  }, [techSignals, signalFilter]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      <AnalyseTechniqueGuide />
      {/* ─── HEADER ─────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Analyse Technique Avancee</h1>
              <p className="text-xs text-slate-400">
                {ASSET_CATALOG.length} actifs — {techSignals.length} signaux detectes — Grades A+/A/B/C/D
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowLegend(!showLegend)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-400 hover:text-white transition-colors">
              <HelpCircle className="w-3.5 h-3.5" /> Notes A+/B/C/D
            </button>
            <button onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-400 hover:text-white transition-colors">
              <Filter className="w-3.5 h-3.5" /> Filtres
            </button>
          </div>
        </div>
      </motion.div>

      {/* ─── GRADE LEGEND ───────────────────────────── */}
      <AnimatePresence>
        {showLegend && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Signification des Notes</h3>
                <button onClick={() => setShowLegend(false)} className="p-1 rounded-lg hover:bg-slate-800"><X className="w-4 h-4 text-slate-500" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                {GRADE_LEGEND.map(g => (
                  <div key={g.grade} className={`p-3 rounded-xl border ${GRADE_COLORS[g.grade]?.border || 'border-slate-700'} ${GRADE_COLORS[g.grade]?.bg || 'bg-slate-800/40'}`}>
                    <p className={`text-sm font-bold ${GRADE_COLORS[g.grade]?.text || 'text-white'}`}>{g.grade} — {g.label}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{g.shortDescription}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-600 mt-2">Les notes sont des aides a la decision et ne garantissent pas de gain.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MARCHÉ EN UN COUP D'OEIL ─────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <GlanceCard icon={Zap} label="Signaux detectes" value={String(techSignals.length)} color="blue" />
        <GlanceCard icon={TrendingUp} label="Signaux haussiers" value={String(bullishCount)} color="emerald" />
        <GlanceCard icon={TrendDownIcon} label="Signaux baissiers" value={String(bearishCount)} color="red" />
        <GlanceCard icon={AlertTriangle} label="Signaux critiques" value={String(criticalSignals.length)} color="amber" />
      </div>

      {/* ─── FILTERS ────────────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un actif (ex: Gold, EURUSD, BTC...)"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50" />
              </div>
              {/* Market */}
              <div>
                <p className="text-xs text-slate-500 mb-2">Marche</p>
                <div className="flex flex-wrap gap-2">
                  {(['ALL', 'forex', 'metals', 'crypto', 'indices', 'stocks', 'energy', 'commodities'] as const).map(m => (
                    <button key={m} onClick={() => { setSelectedMarket(m); setSelectedCategory('ALL'); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedMarket === m ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                      {m === 'ALL' ? 'Tous' : m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {/* Category */}
              <div>
                <p className="text-xs text-slate-500 mb-2">Categorie</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setSelectedCategory('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedCategory === 'ALL' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                    Toutes
                  </button>
                  {ASSET_CATEGORIES_UI.map(c => (
                    <button key={c.key} onClick={() => setSelectedCategory(c.key as AssetCategory)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedCategory === c.key ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Timeframe */}
              <div>
                <p className="text-xs text-slate-500 mb-2">Timeframe</p>
                <div className="flex flex-wrap gap-2">
                  {TIMEFRAMES_UI.map(tf => (
                    <button key={tf.key} onClick={() => setSelectedTimeframe(tf.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedTimeframe === tf.key ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Period */}
              <div>
                <p className="text-xs text-slate-500 mb-2">Periode</p>
                <div className="flex flex-wrap gap-2">
                  {PERIOD_OPTIONS.map(p => (
                    <button key={p.key} onClick={() => setSelectedPeriod(p.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedPeriod === p.key ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Signal type + Grade */}
              <div className="flex flex-wrap gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-2">Type de signal</p>
                  <div className="flex gap-2">
                    {(['ALL', 'buy', 'sell', 'neutral'] as const).map(f => (
                      <button key={f} onClick={() => setSignalFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${signalFilter === f ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                        {f === 'ALL' ? 'Tous' : f === 'buy' ? 'Achat' : f === 'sell' ? 'Vente' : 'Neutre'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-2">Note minimum</p>
                  <div className="flex gap-2">
                    {(['ALL', 'A', 'B', 'C', 'D'] as const).map(g => (
                      <button key={g} onClick={() => setGradeFilter(g)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${gradeFilter === g ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                        {g === 'ALL' ? 'Toutes' : g + '+'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── ASSET SELECTOR ─────────────────────────── */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <p className="text-xs text-slate-500 mb-2">Actif selectionne — {filteredAssets.length} actifs disponibles</p>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          {filteredAssets.map(asset => (
            <button key={asset.symbol} onClick={() => setSelectedAsset(asset.symbol)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedAsset === asset.symbol
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-slate-800/60 text-slate-400 border border-slate-700 hover:text-white'
              }`}>
              {asset.symbol}
              {asset.priority === 1 && <span className="ml-1 text-[8px] text-amber-400">★</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ─── MAIN CONTENT ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Signal details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Signal Header */}
          <SignalHeader
            asset={selectedAsset}
            price={currentPrice}
            grade={grade}
            noTrade={noTrade}
            decision={decision}
            techSignals={techSignals}
          />

          {/* Chart */}
          {candles.length > 0 && currentPrice > 0 && (
            <PriceChart
              data={candles.map(c => ({ timestamp: c.time, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume }))}
              title={`${selectedAsset} — ${selectedTimeframe}`}
              height={350}
            />
          )}

          {/* Technical Signals Table */}
          <SignalsTable signals={filteredSignals} expandedId={expandedSignal} onToggle={setExpandedSignal} />

          {/* Technical Panel */}
          {signalData.techIndicators.length > 0 && (
            <TechnicalPanel indicators={signalData.techIndicators} />
          )}
        </div>

        {/* Right column: Summary */}
        <div className="space-y-6">
          {/* Risk Card */}
          {risk && <RiskCard risk={risk} />}

          {/* Decision Card */}
          {decision && <DecisionCard decision={decision} />}

          {/* Signal Categories */}
          <CategoryBreakdown signals={techSignals} />

          {/* Grade Legend Mini */}
          <GradeLegendMini />
        </div>
      </div>
    </div>
  );
}

// ─── Sub-Components ─────────────────────────────────────

function GlanceCard({ icon: Icon, label, value, color }: { icon: typeof Zap; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-400', emerald: 'text-emerald-400', red: 'text-red-400', amber: 'text-amber-400',
  };
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
      <Icon className={`w-5 h-5 ${colors[color] || 'text-slate-400'}`} />
      <div>
        <p className="text-lg font-bold text-white">{value}</p>
        <p className="text-[10px] text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function SignalHeader({ asset, price, grade, noTrade, decision, techSignals }: {
  asset: string; price: number; grade: any; noTrade: any; decision: any; techSignals: TechnicalSignal[];
}) {
  const assetDef = ASSET_CATALOG.find(a => a.symbol === asset);
  const bullCount = techSignals.filter(s => s.direction === 'bullish').length;
  const bearCount = techSignals.filter(s => s.direction === 'bearish').length;
  const overallDir = bullCount > bearCount ? 'bullish' : bearCount > bullCount ? 'bearish' : 'neutral';

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-bold text-white">{asset}</h2>
            {assetDef && <span className="text-xs text-slate-500">{assetDef.name}</span>}
            {assetDef?.priority === 1 && <Star className="w-4 h-4 text-amber-400" />}
          </div>
          <p className="text-2xl font-bold text-white">{price > 0 ? price.toLocaleString('fr-FR', { minimumFractionDigits: assetDef?.decimals || 2 }) : '—'}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-xs flex items-center gap-1 ${overallDir === 'bullish' ? 'text-emerald-400' : overallDir === 'bearish' ? 'text-red-400' : 'text-amber-400'}`}>
              {overallDir === 'bullish' ? <TrendingUp className="w-3 h-3" /> : overallDir === 'bearish' ? <TrendDownIcon className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {bullCount}H / {bearCount}B
            </span>
            {assetDef && <span className="text-xs text-slate-500">Spread: {assetDef.spreadAvg} | {assetDef.volatility}</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {grade && <GradeBadge grade={grade.grade} score={grade.score} />}
          {noTrade?.isNoTradeZone && (
            <span className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-bold flex items-center gap-1">
              <Ban className="w-3 h-3" /> NO TRADE
            </span>
          )}
          {decision && (
            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${decision.color?.split(' ').slice(1, 3).join(' ') || 'bg-amber-500/10 text-amber-400'}`}>
              {decision.decision}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function GradeBadge({ grade, score }: { grade: string; score: number }) {
  const cfg = GRADE_COLORS[grade] || GRADE_COLORS['B'];
  return (
    <div className={`px-3 py-2 rounded-xl border ${cfg.bg} ${cfg.border}`}>
      <span className={`text-lg font-bold ${cfg.text}`}>{grade}</span>
      <span className="text-xs text-slate-400 ml-1">{score}/100</span>
    </div>
  );
}

function SignalsTable({ signals, expandedId, onToggle }: { signals: TechnicalSignal[]; expandedId: string | null; onToggle: (id: string) => void }) {
  if (signals.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
        <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <p className="text-sm text-slate-400">Aucun signal technique detecte</p>
        <p className="text-xs text-slate-600">Chargez les donnees de l'actif selectionne</p>
      </div>
    );
  }

  const dirColors = { bullish: 'text-emerald-400', bearish: 'text-red-400', neutral: 'text-amber-400' };
  const dirIcons = { bullish: TrendingUp, bearish: TrendDownIcon, neutral: Minus };
  const impColors = { critical: 'text-red-400', major: 'text-amber-400', minor: 'text-blue-400', info: 'text-slate-500' };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-400" /> Signaux Techniques Detectes ({signals.length})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-500 border-b border-slate-800">
              <th className="text-left p-3">Signal</th>
              <th className="text-center p-3">Direction</th>
              <th className="text-center p-3">Importance</th>
              <th className="text-center p-3">Conf.</th>
              <th className="text-left p-3">Description</th>
            </tr>
          </thead>
          <tbody>
            {signals.map((sig, i) => {
              const Icon = dirIcons[sig.direction];
              const id = `${sig.type}-${i}`;
              return (
                <tr key={id} className="border-b border-slate-800/50 hover:bg-slate-800/30 cursor-pointer" onClick={() => onToggle(expandedId === id ? '' : id)}>
                  <td className="p-3">
                    <span className="font-medium text-white">{sig.label}</span>
                    <span className="text-[10px] text-slate-600 ml-2 uppercase">{sig.category}</span>
                  </td>
                  <td className="p-3 text-center"><Icon className={`w-4 h-4 ${dirColors[sig.direction]} mx-auto`} /></td>
                  <td className="p-3 text-center"><span className={`text-xs ${impColors[sig.importance]}`}>{sig.importance}</span></td>
                  <td className="p-3 text-center">
                    <div className="w-12 mx-auto">
                      <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${sig.confidence >= 70 ? 'bg-emerald-500' : sig.confidence >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${sig.confidence}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-500">{sig.confidence}%</span>
                    </div>
                  </td>
                  <td className="p-3 text-xs text-slate-400">{sig.description}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RiskCard({ risk }: { risk: import('@/services/profitabilityEngine').RiskAnalysis }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <Shield className="w-4 h-4 text-amber-400" /> Risque Avant Profit
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between text-xs"><span className="text-slate-500">R/R</span><span className={`font-bold ${risk.isRRAcceptable ? 'text-emerald-400' : 'text-red-400'}`}>{risk.rrLabel}</span></div>
        <div className="flex justify-between text-xs"><span className="text-slate-500">Risque max</span><span className="text-red-400">{risk.slDistance.toFixed(2)}%</span></div>
        <div className="flex justify-between text-xs"><span className="text-slate-500">Gain potentiel</span><span className="text-emerald-400">{risk.tpDistance.toFixed(2)}%</span></div>
        <div className="flex justify-between text-xs"><span className="text-slate-500">Taille reco.</span><span className="text-blue-400">{risk.positionSize.toFixed(2)}u</span></div>
      </div>
      {risk.warning && <p className="text-xs text-amber-400 mt-2 bg-amber-500/5 p-2 rounded-lg">{risk.warning}</p>}
    </div>
  );
}

function DecisionCard({ decision }: { decision: import('@/services/profitabilityEngine').DecisionResult }) {
  const colors: Record<string, { border: string; bg: string; text: string }> = {
    'ACHETER': { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    'VENDRE': { border: 'border-red-500/30', bg: 'bg-red-500/10', text: 'text-red-400' },
    'ATTENDRE': { border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-400' },
    'EVITER': { border: 'border-red-500/30', bg: 'bg-red-500/10', text: 'text-red-400' },
  };
  const c = colors[decision.decision] || colors['ATTENDRE'];

  return (
    <div className={`rounded-2xl border p-4 ${c.border} ${c.bg}`}>
      <h3 className={`text-sm font-bold ${c.text} mb-2`}>Decision: {decision.decision}</h3>
      <p className="text-xs text-slate-300 mb-2">{decision.explanation}</p>
      <div className="space-y-1">
        {decision.actionItems.slice(0, 3).map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
            <ArrowRight className="w-3 h-3 text-slate-600" /> {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryBreakdown({ signals }: { signals: TechnicalSignal[] }) {
  const counts: Record<string, number> = {};
  signals.forEach(s => { counts[s.category] = (counts[s.category] || 0) + 1; });

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-white mb-3">Repartition des Signaux</h3>
      <div className="space-y-1.5">
        {Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
          <div key={cat} className="flex items-center justify-between">
            <span className="text-xs text-slate-400 capitalize">{cat.replace('_', ' ')}</span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (count / signals.length) * 200)}%` }} />
              </div>
              <span className="text-xs text-slate-500 w-4">{count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GradeLegendMini() {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-white mb-2">Notes de Decision</h3>
      <div className="space-y-1.5">
        {GRADE_LEGEND.map(g => (
          <div key={g.grade} className="flex items-center gap-2">
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${GRADE_COLORS[g.grade]?.bg || ''} ${GRADE_COLORS[g.grade]?.text || ''}`}>{g.grade}</span>
            <span className="text-xs text-slate-400">{g.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
