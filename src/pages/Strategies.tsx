/**
 * Strategies de Trading — Bibliotheque professionnelle
 * 20 strategies filtrables, comparateur, meilleure strategie du moment,
 * fiches detaillees avec backtest simule.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';
import {
  BookOpen, Filter, Search, Star, TrendingUp, ChevronDown, ChevronUp,
  Shield, Target, Zap, Award, BarChart3, Layers, Clock, ArrowRight,
  Brain, AlertTriangle, CheckCircle, X, Download, FileText, Lock
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  STRATEGIES, getTopStrategies, getBestStrategyForAsset, generateBacktest,
  CATEGORY_LABELS, STYLE_LABELS, DIFFICULTY_LABELS, RISK_LABELS,
  type Strategy, type StrategyCategory, type TradingStyle, type DifficultyLevel, type RiskLevel,
} from '@/services/strategyLibrary';
import { ASSET_CATALOG, getPriority1Assets } from '@/services/assetCatalog';
import { GRADE_LEGEND } from '@/services/gradeLegend';
import StrategyDetailModal from '@/components/StrategyDetailModal';

const GRADE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'A+': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'A': { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/25' },
  'B': { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/25' },
  'C': { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/25' },
  'D': { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/25' },
};

function gradeFromScore(score: number): { grade: string; label: string } {
  if (score >= 85) return { grade: 'A+', label: 'Excellente' };
  if (score >= 70) return { grade: 'A', label: 'Tres bonne' };
  if (score >= 55) return { grade: 'B', label: 'Bonne' };
  if (score >= 40) return { grade: 'C', label: 'Moyenne' };
  return { grade: 'D', label: 'Faible' };
}

// ─── Main Component ─────────────────────────────────────

export default function Strategies() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const pack = (user?.pack || 'free') as string;

  // Filters
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<StrategyCategory | 'ALL'>('ALL');
  const [styleFilter, setStyleFilter] = useState<TradingStyle | 'ALL'>('ALL');
  const [diffFilter, setDiffFilter] = useState<DifficultyLevel | 'ALL'>('ALL');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'ALL'>('ALL');
  const [assetFilter, setAssetFilter] = useState<string>('ALL');
  const [scoreFilter, setScoreFilter] = useState<string>('ALL');
  const [tfFilter, setTfFilter] = useState<string>('ALL');
  const [indicatorFilter, setIndicatorFilter] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false);

  // Compare
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);

  // Detail modal
  const [detailId, setDetailId] = useState<string | null>(null);

  // Filter strategies
  const filtered = useMemo(() => {
    let list = [...STRATEGIES];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.indicators.some(i => i.toLowerCase().includes(q)));
    }
    if (catFilter !== 'ALL') list = list.filter(s => s.category === catFilter);
    if (styleFilter !== 'ALL') list = list.filter(s => s.style === styleFilter);
    if (diffFilter !== 'ALL') list = list.filter(s => s.difficulty === diffFilter);
    if (riskFilter !== 'ALL') list = list.filter(s => s.riskLevel === riskFilter);
    if (assetFilter !== 'ALL') list = list.filter(s => s.assets.includes(assetFilter));
    if (scoreFilter !== 'ALL') {
      const [min, max] = scoreFilter.split('-').map(Number);
      list = list.filter(s => s.reliabilityScore >= min && s.reliabilityScore <= max);
    }
    if (tfFilter !== 'ALL') list = list.filter(s => s.timeframes.includes(tfFilter));
    if (indicatorFilter !== 'ALL') list = list.filter(s => s.indicators.includes(indicatorFilter));
    return list;
  }, [search, catFilter, styleFilter, diffFilter, riskFilter, assetFilter, scoreFilter, tfFilter, indicatorFilter]);

  const comparedStrategies = useMemo(() => STRATEGIES.filter(s => compareIds.has(s.id)), [compareIds]);

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 4) next.add(id);
      return next;
    });
  };

  // Best strategies
  const top5 = useMemo(() => getTopStrategies(5), []);
  const priorityAssets = getPriority1Assets();
  const bestPerAsset = useMemo(() =>
    priorityAssets.map(a => ({ asset: a.symbol, strategy: getBestStrategyForAsset(a.symbol) })).filter(x => x.strategy),
    []);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* ─── HEADER ─────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Strategies de Trading</h1>
              <p className="text-xs text-slate-400">{STRATEGIES.length} strategies professionnelles — Bibliotheque IA</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-400 hover:text-white transition-colors">
              <Filter className="w-3.5 h-3.5" /> Filtres
            </button>
            {compareIds.size >= 2 && (
              <button onClick={() => setShowCompare(!showCompare)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-xs text-blue-400">
                <Layers className="w-3.5 h-3.5" /> Comparer ({compareIds.size})
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* ─── DISCLAIMER ─────────────────────────────── */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
        <p className="text-xs text-amber-400 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          Les strategies presentees sont des outils d'aide a la decision. Aucune strategie ne garantit un gain. Les resultats varient selon le marche, la volatilite, le spread, les news et la gestion du risque. Toujours tester avant utilisation reelle.
        </p>
      </div>

      {/* ─── MEILLEURES STRATEGIES DU MOMENT ────────── */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" /> Strategies les Plus Fiables
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {top5.map((s, i) => {
            const g = gradeFromScore(s.reliabilityScore);
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => setDetailId(s.id)}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 cursor-pointer hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${GRADE_COLORS[g.grade]?.bg} ${GRADE_COLORS[g.grade]?.text}`}>{g.grade}</span>
                  <span className="text-[10px] text-slate-500">{s.reliabilityScore}%</span>
                </div>
                <p className="text-sm font-semibold text-white">{s.shortName}</p>
                <p className="text-[10px] text-slate-400 mt-1">{CATEGORY_LABELS[s.category]}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ─── MEILLEURE STRATEGIE PAR ACTIF ──────────── */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-400" /> Meilleure Strategie par Actif Principal
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {bestPerAsset.slice(0, 8).map(({ asset, strategy }) => {
            const g = gradeFromScore(strategy!.reliabilityScore);
            return (
              <div key={asset} onClick={() => setDetailId(strategy!.id)}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 cursor-pointer hover:border-slate-700">
                <p className="text-xs font-bold text-white">{asset}</p>
                <p className="text-sm font-semibold text-blue-400">{strategy!.shortName}</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${GRADE_COLORS[g.grade]?.bg} ${GRADE_COLORS[g.grade]?.text}`}>{g.grade}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── FILTERS ────────────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une strategie ou indicateur..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <div>
                  <p className="text-[10px] text-slate-500 mb-1">Categorie</p>
                  <select value={catFilter} onChange={e => setCatFilter(e.target.value as StrategyCategory | 'ALL')}
                    className="w-full px-2 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-white">
                    <option value="ALL">Toutes</option>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 mb-1">Style</p>
                  <select value={styleFilter} onChange={e => setStyleFilter(e.target.value as TradingStyle | 'ALL')}
                    className="w-full px-2 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-white">
                    <option value="ALL">Tous</option>
                    {Object.entries(STYLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 mb-1">Niveau</p>
                  <select value={diffFilter} onChange={e => setDiffFilter(e.target.value as DifficultyLevel | 'ALL')}
                    className="w-full px-2 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-white">
                    <option value="ALL">Tous</option>
                    {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 mb-1">Risque</p>
                  <select value={riskFilter} onChange={e => setRiskFilter(e.target.value as RiskLevel | 'ALL')}
                    className="w-full px-2 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-white">
                    <option value="ALL">Tous</option>
                    <option value="faible">Faible</option>
                    <option value="moyen">Moyen</option>
                    <option value="eleve">Eleve</option>
                  </select>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 mb-1">Actif</p>
                  <select value={assetFilter} onChange={e => setAssetFilter(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-white">
                    <option value="ALL">Tous</option>
                    {priorityAssets.map(a => <option key={a.symbol} value={a.symbol}>{a.symbol}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 mb-1">Note</p>
                  <select value={scoreFilter} onChange={e => setScoreFilter(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-white">
                    <option value="ALL">Toutes</option>
                    <option value="85-100">A+ (85-100%)</option>
                    <option value="70-84">A (70-84%)</option>
                    <option value="55-69">B (55-69%)</option>
                    <option value="40-54">C (40-54%)</option>
                    <option value="0-39">D (&lt;40%)</option>
                  </select>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 mb-1">Timeframe</p>
                  <select value={tfFilter} onChange={e => setTfFilter(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-white">
                    <option value="ALL">Tous</option>
                    <option value="M5">M5</option>
                    <option value="M15">M15</option>
                    <option value="M30">M30</option>
                    <option value="H1">H1</option>
                    <option value="H4">H4</option>
                    <option value="D1">D1</option>
                  </select>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 mb-1">Indicateur</p>
                  <select value={indicatorFilter} onChange={e => setIndicatorFilter(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-white">
                    <option value="ALL">Tous</option>
                    <option value="RSI">RSI</option>
                    <option value="MACD">MACD</option>
                    <option value="EMA">EMA</option>
                    <option value="Ichimoku">Ichimoku</option>
                    <option value="Bollinger">Bollinger</option>
                    <option value="ATR">ATR</option>
                    <option value="ADX">ADX</option>
                    <option value="Fibonacci">Fibonacci</option>
                    <option value="VWAP">VWAP</option>
                    <option value="Smart Money">Smart Money</option>
                  </select>
                </div>
                <div>
                  <button onClick={() => { setSearch(''); setCatFilter('ALL'); setStyleFilter('ALL'); setDiffFilter('ALL'); setRiskFilter('ALL'); setAssetFilter('ALL'); setScoreFilter('ALL'); setTfFilter('ALL'); setIndicatorFilter('ALL'); }}
                    className="w-full px-2 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-slate-400 hover:text-white transition-colors">
                    Reinitialiser
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── COMPARISON TABLE ───────────────────────── */}
      <AnimatePresence>
        {showCompare && comparedStrategies.length >= 2 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <ComparisonTable strategies={comparedStrategies} onClose={() => { setShowCompare(false); setCompareIds(new Set()); }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── STRATEGIES TABLE ───────────────────────── */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-400" /> Tableau des Strategies ({filtered.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-800">
                <th className="text-left p-3 w-8"></th>
                <th className="text-left p-3">Strategie</th>
                <th className="text-center p-3">Cat.</th>
                <th className="text-center p-3">Style</th>
                <th className="text-center p-3">Niv.</th>
                <th className="text-center p-3">Risque</th>
                <th className="text-center p-3">Fiab.</th>
                <th className="text-center p-3">Note</th>
                <th className="text-center p-3">R/R</th>
                <th className="text-left p-3">Marches</th>
                <th className="text-center p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, idx) => {
                const g = gradeFromScore(s.reliabilityScore);
                const riskCfg = RISK_LABELS[s.riskLevel];
                const isCompared = compareIds.has(s.id);
                return (
                  <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="p-3">
                      <button onClick={() => toggleCompare(s.id)}
                        className={`w-5 h-5 rounded flex items-center justify-center ${isCompared ? 'bg-blue-500' : 'bg-slate-700'}`}>
                        {isCompared && <CheckCircle className="w-3 h-3 text-white" />}
                      </button>
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-white">{s.shortName}</p>
                      <p className="text-[10px] text-slate-500">{s.indicators.slice(0, 3).join(', ')}</p>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-[10px] text-slate-400">{CATEGORY_LABELS[s.category]}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-[10px] text-slate-400">{STYLE_LABELS[s.style]}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-[10px] text-slate-400">{DIFFICULTY_LABELS[s.difficulty]}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`text-[10px] ${riskCfg.color}`}>{riskCfg.label}</span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="w-10 mx-auto">
                        <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${s.reliabilityScore >= 75 ? 'bg-emerald-500' : s.reliabilityScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${s.reliabilityScore}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-500">{s.reliabilityScore}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${GRADE_COLORS[g.grade]?.bg} ${GRADE_COLORS[g.grade]?.text}`}>{g.grade}</span>
                    </td>
                    <td className="p-3 text-center text-xs text-emerald-400">{s.recommendedRR}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {s.markets.slice(0, 3).map(m => (
                          <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{m}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <button onClick={() => setDetailId(s.id)}
                        className="px-2 py-1 rounded-lg bg-violet-500/10 text-violet-400 text-[10px] font-medium hover:bg-violet-500/20 transition-colors">
                        Details
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── GRADE LEGEND ───────────────────────────── */}
      <div className="grid grid-cols-5 gap-2">
        {GRADE_LEGEND.map(g => (
          <div key={g.grade} className={`p-3 rounded-xl border ${GRADE_COLORS[g.grade]?.border || 'border-slate-700'} ${GRADE_COLORS[g.grade]?.bg || 'bg-slate-800/40'}`}>
            <p className={`text-sm font-bold ${GRADE_COLORS[g.grade]?.text || 'text-white'}`}>{g.grade}</p>
            <p className="text-[10px] text-slate-400">{g.label}</p>
          </div>
        ))}
      </div>

      {/* ─── DETAIL MODAL ───────────────────────────── */}
      <AnimatePresence>
        {detailId && (
          <StrategyDetailModal strategyId={detailId} onClose={() => setDetailId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Comparison Table ───────────────────────────────────

function ComparisonTable({ strategies, onClose }: { strategies: Strategy[]; onClose: () => void }) {
  return (
    <div className="bg-slate-900/60 border border-blue-500/20 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" /> Comparateur ({strategies.length} strategies)
        </h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800"><X className="w-4 h-4 text-slate-500" /></button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-500 border-b border-slate-800">
              <th className="text-left p-2">Critere</th>
              {strategies.map(s => <th key={s.id} className="text-center p-2">{s.shortName}</th>)}
            </tr>
          </thead>
          <tbody className="text-xs">
            {[
              { label: 'Fiabilite', key: 'reliabilityScore', fmt: (v: number) => `${v}%` },
              { label: 'Risque', key: 'riskLevel', fmt: (v: string) => v },
              { label: 'Difficulte', key: 'difficulty', fmt: (v: string) => v },
              { label: 'R/R Conseille', key: 'recommendedRR', fmt: (v: string) => v },
              { label: 'Style', key: 'style', fmt: (v: string) => STYLE_LABELS[v as TradingStyle] || v },
            ].map(row => (
              <tr key={row.label} className="border-b border-slate-800/50">
                <td className="p-2 text-slate-400 font-medium">{row.label}</td>
                {strategies.map(s => (
                  <td key={s.id} className="p-2 text-center text-slate-300">
                    {row.fmt((s as any)[row.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
