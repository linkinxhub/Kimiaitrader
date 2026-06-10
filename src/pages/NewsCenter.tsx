/**
 * NewsCenter — Centre News & Décisions IA
 * Page principale regroupant toutes les news du marché avec analyses parallèles,
 * décisions IA, liens vers les actifs concernés, et scoring d'impact.
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import {
  filterNews, generateDaySummary, generateNewsDecision,
  NEWS_CATEGORIES_UI, IMPACT_COLORS, DECISION_COLORS, STATUS_LABELS,
  NOTE_COLORS, DEFAULT_FILTER, getNewsAccess,
  type NewsItem, type NewsFilterState, type DecisionAction,
} from '@/services/newsEngine';
import { DEMO_NEWS, DEMO_NEWS_HISTORY } from '@/services/newsDemoData';
import {
  Newspaper, AlertTriangle, TrendingUp, TrendingDown, Minus,
  Clock, Calendar, Globe, Zap, Shield, Target, BarChart3,
  Filter, X, ChevronDown, ChevronUp, ExternalLink, Bell,
  Eye, History, Star, Ban, Search, Activity, ArrowRight,
  BookOpen, Layers, Crosshair, Wallet, Timer, Info,
  Flame, Landmark, LineChart, Bitcoin, Fuel, HelpCircle,
} from 'lucide-react';

// ─── Pack Access ────────────────────────────────────────
function useNewsAccess() {
  const { user } = useAuth();
  return getNewsAccess(user?.pack || 'free');
}

// ─── Main Component ─────────────────────────────────────
export default function NewsCenter() {
  const navigate = useNavigate();
  const access = useNewsAccess();
  const [filters, setFilters] = useState<NewsFilterState>(DEFAULT_FILTER);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedNews, setExpandedNews] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'history' | 'alerts'>('live');
  const [showLegend, setShowLegend] = useState(false);

  // Demo data
  const allNews = useMemo(() => DEMO_NEWS, []);
  const historyData = useMemo(() => DEMO_NEWS_HISTORY, []);

  // Filtered news
  const filteredNews = useMemo(() => filterNews(allNews, filters), [allNews, filters]);

  // Day summary
  const summary = useMemo(() => generateDaySummary(allNews), [allNews]);

  // Stats
  const stats = useMemo(() => {
    const critical = allNews.filter(n => n.impact === 'critical').length;
    const high = allNews.filter(n => n.impact === 'high').length;
    const upcoming = allNews.filter(n => n.status === 'upcoming' && (n.impact === 'high' || n.impact === 'critical')).length;
    const noTrade = allNews.filter(n => n.aiDecision === 'NO_TRADE').length;
    return { critical, high, upcoming, noTrade, total: allNews.length };
  }, [allNews]);

  // Expand/collapse
  const toggleExpand = useCallback((id: string) => {
    setExpandedNews(prev => prev === id ? null : id);
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* ─── HEADER ─────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-amber-600 flex items-center justify-center">
              <Newspaper className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Centre News &amp; Decisions IA</h1>
              <p className="text-xs text-slate-400">
                {stats.total} news — {stats.critical} critiques — {stats.high} haut impact — {stats.upcoming} a venir
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowLegend(!showLegend)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-400 hover:text-white transition-colors">
              <HelpCircle className="w-3.5 h-3.5" /> Guide
            </button>
            <button onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-400 hover:text-white transition-colors">
              <Filter className="w-3.5 h-3.5" /> Filtres
            </button>
          </div>
        </div>
      </motion.div>

      {/* ─── LEGEND ─────────────────────────────────── */}
      <AnimatePresence>
        {showLegend && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Guide du Centre News</h3>
                <button onClick={() => setShowLegend(false)} className="p-1 rounded-lg hover:bg-slate-800"><X className="w-4 h-4 text-slate-500" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"/> <span className="text-slate-300">Critique — Volatilite extreme</span></div>
                <div><span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1"/> <span className="text-slate-300">Haut — Forte influence</span></div>
                <div><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1"/> <span className="text-slate-300">Moyen — Influence moderee</span></div>
                <div><span className="inline-block w-2 h-2 rounded-full bg-slate-500 mr-1"/> <span className="text-slate-300">Faible — Influence limitee</span></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3">
                {Object.entries(DECISION_COLORS).map(([d]) => (
                  <div key={d} className={`px-2 py-1 rounded-lg text-xs font-medium text-center ${DECISION_COLORS[d as DecisionAction]}`}>{d.replace('_', ' ')}</div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── STATS CARDS ────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard icon={Newspaper} label="Total News" value={String(stats.total)} color="blue" />
        <StatCard icon={Flame} label="Critiques" value={String(stats.critical)} color="red" />
        <StatCard icon={AlertTriangle} label="Haut Impact" value={String(stats.high)} color="amber" />
        <StatCard icon={Timer} label="A venir" value={String(stats.upcoming)} color="emerald" />
        <StatCard icon={Ban} label="No Trade" value={String(stats.noTrade)} color="rose" />
      </div>

      {/* ─── DAILY SUMMARY ──────────────────────────── */}
      <DailySummaryCard summary={summary} />

      {/* ─── TABS ───────────────────────────────────── */}
      <div className="flex gap-2 border-b border-slate-800">
        {([
          { key: 'live' as const, label: 'News en Direct', icon: Activity },
          { key: 'history' as const, label: 'Historique', icon: History },
          { key: 'alerts' as const, label: 'Alertes', icon: Bell },
        ]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
              activeTab === tab.key
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}>
            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {/* ─── FILTERS ────────────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <NewsFilters filters={filters} onChange={setFilters} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── TAB CONTENT ────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === 'live' && (
          <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {filteredNews.length === 0 ? (
              <EmptyState message="Aucune news ne correspond aux filtres selectionnes" />
            ) : (
              filteredNews.map((news, i) => (
                <NewsCard
                  key={news.id}
                  news={news}
                  expanded={expandedNews === news.id}
                  onToggle={() => toggleExpand(news.id)}
                  index={i}
                  access={access}
                  onNavigate={navigate}
                />
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <HistoryTable data={historyData} />
          </motion.div>
        )}

        {activeTab === 'alerts' && (
          <motion.div key="alerts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AlertsPanel news={allNews} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-Components ─────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Newspaper; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-400', red: 'text-red-400', amber: 'text-amber-400',
    emerald: 'text-emerald-400', rose: 'text-rose-400',
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

function DailySummaryCard({ summary }: { summary: import('@/services/newsEngine').NewsDaySummary }) {
  const [expanded, setExpanded] = useState(false);
  if (!summary.topNews) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-slate-900/80 to-slate-800/60 border border-slate-700 rounded-2xl p-4 md:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">News du jour en un coup d&apos;oeil</h2>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-400 font-bold">
              {summary.totalCritical > 0 ? `${summary.totalCritical} CRITIQUE${summary.totalCritical > 1 ? 'S' : ''}` : `${summary.totalHighImpact} HAUT IMPACT`}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">{summary.aiSummary}</p>
          <div className="flex flex-wrap gap-2">
            {summary.mostImpactedAsset && (
              <span className="px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 flex items-center gap-1">
                <Target className="w-3 h-3" /> {summary.mostImpactedAsset}
              </span>
            )}
            {summary.mostImpactedCurrency && (
              <span className="px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-400 flex items-center gap-1">
                <Globe className="w-3 h-3" /> {summary.mostImpactedCurrency}
              </span>
            )}
            {summary.assetToAvoid && (
              <span className="px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-400 flex items-center gap-1">
                <Ban className="w-3 h-3" /> Eviter {summary.assetToAvoid}
              </span>
            )}
            <span className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Risque : {summary.riskiestMarket}
            </span>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-3">
              {summary.upcomingNews.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1.5 flex items-center gap-1"><Timer className="w-3 h-3" /> A venir</p>
                  <div className="flex flex-wrap gap-2">
                    {summary.upcomingNews.map(n => (
                      <span key={n.id} className={`px-2 py-1 rounded-lg text-[10px] font-medium border ${IMPACT_COLORS[n.impact].bg} ${IMPACT_COLORS[n.impact].text} ${IMPACT_COLORS[n.impact].border}`}>
                        {n.timeLabel} — {n.title.slice(0, 40)}...
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {summary.bestOpportunity && (
                <div className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs text-emerald-400">
                    Opportunite : {summary.bestOpportunity.title} — {summary.bestOpportunity.aiDecision}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function NewsCard({ news, expanded, onToggle, index, access, onNavigate }: {
  news: NewsItem; expanded: boolean; onToggle: () => void; index: number;
  access: string; onNavigate: (path: string) => void;
}) {
  const impact = IMPACT_COLORS[news.impact];
  const status = STATUS_LABELS[news.status];
  const decision = news.aiDecision ? { action: news.aiDecision, ...generateNewsDecision(news) } : null;

  const statusIcon = news.status === 'live' ? <Flame className="w-3 h-3 text-red-400" /> :
    news.status === 'upcoming' ? <Timer className="w-3 h-3 text-emerald-400" /> :
    <History className="w-3 h-3 text-slate-400" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`bg-slate-900/60 border rounded-2xl overflow-hidden transition-colors ${expanded ? 'border-slate-600' : 'border-slate-800 hover:border-slate-700'}`}
    >
      {/* ─── HEADER ROW ─────────────────────────── */}
      <div className="p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start gap-3">
          {/* Impact badge */}
          <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${impact.bg} border ${impact.border}`}>
            {news.impact === 'critical' ? <Flame className={`w-5 h-5 ${impact.text}`} /> :
             news.impact === 'high' ? <AlertTriangle className={`w-5 h-5 ${impact.text}`} /> :
             news.impact === 'medium' ? <BarChart3 className={`w-5 h-5 ${impact.text}`} /> :
             <Info className={`w-5 h-5 ${impact.text}`} />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${impact.badge}`}>{news.impact.toUpperCase()}</span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">{statusIcon} {status}</span>
              <span className="text-[10px] text-slate-600 flex items-center gap-1"><Clock className="w-3 h-3" /> {news.timeLabel}</span>
              <span className="text-[10px] text-slate-600 flex items-center gap-1"><Globe className="w-3 h-3" /> {news.country}</span>
              {news.currency && <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-medium">{news.currency}</span>}
            </div>
            <h3 className="text-sm font-semibold text-white mt-1.5 leading-snug">{news.title}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Source : {news.source} {news.impactScore > 0 && <span className="text-slate-600">| Score Impact : {news.impactScore}/100</span>}</p>
          </div>

          {/* Decision badge */}
          {decision && (
            <div className={`shrink-0 px-2.5 py-1.5 rounded-xl border text-xs font-bold ${DECISION_COLORS[decision.action]}`}>
              {decision.action.replace('_', ' ')}
            </div>
          )}

          {/* Expand icon */}
          <div className="shrink-0 self-center">
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </div>

        {/* Quick data row (visible when collapsed) */}
        {!expanded && news.previousValue && (
          <div className="flex items-center gap-4 mt-2 ml-[52px]">
            <span className="text-[10px] text-slate-500">Prev : <span className="text-slate-400">{news.previousValue}</span></span>
            <span className="text-[10px] text-slate-500">Prev. : <span className="text-blue-400">{news.forecastValue}</span></span>
            {news.actualValue && (
              <span className="text-[10px] text-slate-500">
                Reel : <span className={news.surprise === 'positive' ? 'text-emerald-400' : news.surprise === 'negative' ? 'text-red-400' : 'text-slate-300'}>{news.actualValue}</span>
                {news.surprise && (
                  <span className={`ml-1 ${news.surprise === 'positive' ? 'text-emerald-400' : news.surprise === 'negative' ? 'text-red-400' : 'text-slate-400'}`}>
                    ({news.surprise === 'positive' ? '+' : news.surprise === 'negative' ? '-' : '='})
                  </span>
                )}
              </span>
            )}
            {/* Affected assets quick pills */}
            {news.affectedAssets.slice(0, 4).map(a => (
              <span key={a} className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-slate-500">{a}</span>
            ))}
            {news.affectedAssets.length > 4 && <span className="text-[9px] text-slate-600">+{news.affectedAssets.length - 4}</span>}
          </div>
        )}
      </div>

      {/* ─── EXPANDED DETAILS ───────────────────── */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-4 border-t border-slate-800 pt-4">
              {/* Data Comparison */}
              <DataComparison news={news} />

              {/* Why Important + Market Reaction */}
              {(news.whyImportant || news.marketReaction) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {news.whyImportant && (
                    <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/50">
                      <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1 flex items-center gap-1"><Info className="w-3 h-3" /> Pourquoi c&apos;est important</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{news.whyImportant}</p>
                    </div>
                  )}
                  {news.marketReaction && (
                    <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/50">
                      <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1 flex items-center gap-1"><Activity className="w-3 h-3" /> Reaction attendue</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{news.marketReaction}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Decision Impact Panel */}
              {decision && access !== 'basic' && (
                <DecisionImpactPanel decision={decision} />
              )}

              {/* Affected Assets */}
              <AffectedAssets news={news} onNavigate={onNavigate} />

              {/* Quick Links */}
              <QuickLinks news={news} onNavigate={onNavigate} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DataComparison({ news }: { news: NewsItem }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="bg-slate-800/40 rounded-xl p-3 text-center border border-slate-700/30">
        <p className="text-[9px] text-slate-500 uppercase">Precedent</p>
        <p className="text-sm font-bold text-slate-300 mt-1">{news.previousValue || '—'}</p>
      </div>
      <div className="bg-blue-500/5 rounded-xl p-3 text-center border border-blue-500/20">
        <p className="text-[9px] text-blue-400 uppercase">Prevision</p>
        <p className="text-sm font-bold text-blue-300 mt-1">{news.forecastValue || '—'}</p>
      </div>
      <div className={`rounded-xl p-3 text-center border ${
        news.surprise === 'positive' ? 'bg-emerald-500/5 border-emerald-500/20' :
        news.surprise === 'negative' ? 'bg-red-500/5 border-red-500/20' :
        'bg-slate-800/40 border-slate-700/30'
      }`}>
        <p className={`text-[9px] uppercase ${
          news.surprise === 'positive' ? 'text-emerald-400' :
          news.surprise === 'negative' ? 'text-red-400' : 'text-slate-500'
        }`}>Reel</p>
        <p className={`text-sm font-bold mt-1 ${
          news.surprise === 'positive' ? 'text-emerald-300' :
          news.surprise === 'negative' ? 'text-red-300' : 'text-slate-300'
        }`}>{news.actualValue || 'En attente'}</p>
      </div>
    </div>
  );
}

function DecisionImpactPanel({ decision }: { decision: { action: DecisionAction; explanation: string; beforeSignal: string; afterSignal: string; invalidationLevel: string } }) {
  const isNoTrade = decision.action === 'NO_TRADE' || decision.action === 'EVITER';
  return (
    <div className={`rounded-xl border p-4 ${isNoTrade ? 'bg-rose-500/5 border-rose-500/20' : 'bg-slate-800/30 border-slate-700/40'}`}>
      <div className="flex items-center gap-2 mb-3">
        <Shield className={`w-4 h-4 ${isNoTrade ? 'text-rose-400' : 'text-blue-400'}`} />
        <h4 className="text-xs font-semibold text-white">Impact sur la Decision</h4>
        <span className={`ml-auto px-2 py-0.5 rounded-lg text-[10px] font-bold ${DECISION_COLORS[decision.action]}`}>{decision.action.replace('_', ' ')}</span>
      </div>
      <p className="text-xs text-slate-300 mb-3">{decision.explanation}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="bg-slate-900/40 rounded-lg p-2.5">
          <p className="text-[9px] text-slate-500 mb-0.5">Avant la news</p>
          <p className="text-[11px] text-slate-300">{decision.beforeSignal}</p>
        </div>
        <div className="bg-slate-900/40 rounded-lg p-2.5">
          <p className="text-[9px] text-slate-500 mb-0.5">Apres la news</p>
          <p className="text-[11px] text-slate-300">{decision.afterSignal}</p>
        </div>
        <div className="bg-slate-900/40 rounded-lg p-2.5">
          <p className="text-[9px] text-slate-500 mb-0.5">Invalidation</p>
          <p className="text-[11px] text-amber-400">{decision.invalidationLevel}</p>
        </div>
      </div>
    </div>
  );
}

function AffectedAssets({ news, onNavigate }: { news: NewsItem; onNavigate: (p: string) => void }) {
  return (
    <div>
      <p className="text-[10px] text-slate-500 uppercase font-semibold mb-2 flex items-center gap-1"><Target className="w-3 h-3" /> Actifs impactes ({news.affectedAssets.length})</p>
      <div className="flex flex-wrap gap-2">
        {news.affectedAssets.map(asset => (
          <button
            key={asset}
            onClick={() => {
              // Navigate to technical analysis with this asset pre-selected
              sessionStorage.setItem('news_selected_asset', asset);
              onNavigate('/technical');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white hover:border-blue-500/30 hover:bg-blue-500/5 transition-all"
          >
            <LineChart className="w-3 h-3" /> {asset}
          </button>
        ))}
      </div>
    </div>
  );
}

function QuickLinks({ news, onNavigate }: { news: NewsItem; onNavigate: (p: string) => void }) {
  const links = [
    { label: 'Analyse Technique', path: news.links.technicalAnalysis, icon: BarChart3 },
    { label: 'XAU Premium', path: news.links.fundamentalAnalysis, icon: Star },
    { label: 'Institutionnel', path: news.links.institutionalAnalysis, icon: Landmark },
    { label: 'Centre Decision', path: news.links.decisionCenter, icon: Target },
    { label: 'Alertes', path: news.links.createAlert, icon: Bell },
  ].filter(l => l.path);

  if (links.length === 0 && !news.links.externalSource) return null;

  return (
    <div>
      <p className="text-[10px] text-slate-500 uppercase font-semibold mb-2 flex items-center gap-1"><ArrowRight className="w-3 h-3" /> Actions rapides</p>
      <div className="flex flex-wrap gap-2">
        {links.map(link => (
          <button
            key={link.label}
            onClick={() => link.path && onNavigate(link.path)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-400 hover:bg-blue-500/10 transition-colors"
          >
            <link.icon className="w-3 h-3" /> {link.label}
          </button>
        ))}
        {news.links.externalSource && (
          <a href={news.links.externalSource} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-400 hover:text-white transition-colors">
            <ExternalLink className="w-3 h-3" /> Source
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Filters Component ──────────────────────────────────

function NewsFilters({ filters, onChange }: { filters: NewsFilterState; onChange: (f: NewsFilterState) => void }) {
  const update = (partial: Partial<NewsFilterState>) => onChange({ ...filters, ...partial });

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Filter className="w-4 h-4 text-slate-400" /> Filtres avances</h3>
        <button onClick={() => onChange(DEFAULT_FILTER)}
          className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1">
          <X className="w-3 h-3" /> Reinitialiser
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input type="text" value={filters.searchQuery} onChange={e => update({ searchQuery: e.target.value })}
          placeholder="Rechercher une news..."
          className="w-full pl-10 pr-4 py-2 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Impact */}
        <div>
          <p className="text-[10px] text-slate-500 mb-1.5">Impact</p>
          <select value={filters.impact} onChange={e => update({ impact: e.target.value as any })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500/50">
            <option value="ALL">Tous</option>
            <option value="critical">Critique</option>
            <option value="high">Haut</option>
            <option value="medium">Moyen</option>
            <option value="low">Faible</option>
          </select>
        </div>
        {/* Category */}
        <div>
          <p className="text-[10px] text-slate-500 mb-1.5">Categorie</p>
          <select value={filters.category} onChange={e => update({ category: e.target.value as any })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500/50">
            {NEWS_CATEGORIES_UI.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
        {/* Status */}
        <div>
          <p className="text-[10px] text-slate-500 mb-1.5">Statut</p>
          <select value={filters.status} onChange={e => update({ status: e.target.value as any })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500/50">
            <option value="ALL">Tous</option>
            <option value="upcoming">A venir</option>
            <option value="live">En cours</option>
            <option value="past">Passees</option>
          </select>
        </div>
        {/* Decision */}
        <div>
          <p className="text-[10px] text-slate-500 mb-1.5">Decision IA</p>
          <select value={filters.decision} onChange={e => update({ decision: e.target.value as any })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500/50">
            <option value="ALL">Toutes</option>
            <option value="ACHETER">Acheter</option>
            <option value="VENDRE">Vendre</option>
            <option value="ATTENDRE">Attendre</option>
            <option value="EVITER">Eviter</option>
            <option value="NO_TRADE">No Trade</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* Currency */}
        <div>
          <p className="text-[10px] text-slate-500 mb-1.5">Devise</p>
          <input type="text" value={filters.currency || ''} onChange={e => update({ currency: e.target.value || null })}
            placeholder="ex: USD, EUR..." className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50" />
        </div>
        {/* Asset */}
        <div>
          <p className="text-[10px] text-slate-500 mb-1.5">Actif</p>
          <input type="text" value={filters.asset || ''} onChange={e => update({ asset: e.target.value || null })}
            placeholder="ex: XAU/USD..." className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50" />
        </div>
        {/* Result */}
        <div>
          <p className="text-[10px] text-slate-500 mb-1.5">Resultat</p>
          <select value={filters.result} onChange={e => update({ result: e.target.value as any })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500/50">
            <option value="ALL">Tous</option>
            <option value="better">Mieux que prevu</option>
            <option value="worse">Moins bien</option>
            <option value="as_expected">Conforme</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ─── History Table ──────────────────────────────────────

function HistoryTable({ data }: { data: typeof DEMO_NEWS_HISTORY }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2"><History className="w-4 h-4 text-slate-400" /> Historique des reactions aux news</h3>
        <p className="text-[10px] text-slate-500 mt-0.5">Apprentissage IA — quelles news influencent le plus chaque actif</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[10px] text-slate-500 border-b border-slate-800 bg-slate-900/40">
              <th className="text-left p-3">News</th>
              <th className="text-center p-3">Impact</th>
              <th className="text-center p-3">Surprise</th>
              <th className="text-center p-3">XAU</th>
              <th className="text-center p-3">EUR/USD</th>
              <th className="text-center p-3">NAS</th>
              <th className="text-center p-3">BTC</th>
              <th className="text-center p-3">Vol 5m</th>
              <th className="text-left p-3">Decision</th>
              <th className="text-left p-3">Lecon IA</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.newsId} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                <td className="p-3">
                  <p className="font-medium text-white">{row.title}</p>
                  <span className="text-[9px] text-slate-600 uppercase">{row.category}</span>
                </td>
                <td className="p-3 text-center">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${IMPACT_COLORS[row.impact]?.badge || 'bg-slate-600'}`}>{row.impact}</span>
                </td>
                <td className="p-3 text-center">
                  <span className={row.surprise === 'positive' ? 'text-emerald-400' : row.surprise === 'negative' ? 'text-red-400' : 'text-slate-400'}>
                    {row.surprise === 'positive' ? '+' : row.surprise === 'negative' ? '-' : '='}
                  </span>
                </td>
                <td className="p-3 text-center text-slate-300">{row.xauReaction}</td>
                <td className="p-3 text-center text-slate-300">{row.eurUsdReaction}</td>
                <td className="p-3 text-center text-slate-300">{row.nasdaqReaction}</td>
                <td className="p-3 text-center text-slate-300">{row.btcReaction}</td>
                <td className="p-3 text-center text-slate-400">{row.volatility5m}</td>
                <td className="p-3">
                  <span className="text-slate-400">{row.beforeDecision}</span>
                  <ArrowRight className="w-3 h-3 text-slate-600 inline mx-1" />
                  <span className="text-slate-300">{row.afterDecision}</span>
                </td>
                <td className="p-3 text-slate-400 max-w-[200px]">{row.lesson}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Alerts Panel ───────────────────────────────────────

function AlertsPanel({ news }: { news: NewsItem[] }) {
  const upcomingHigh = news.filter(n => n.status === 'upcoming' && (n.impact === 'high' || n.impact === 'critical'));
  const noTradeAlerts = news.filter(n => n.aiDecision === 'NO_TRADE');
  const surpriseNews = news.filter(n => n.surprise === 'positive' || n.surprise === 'negative');

  return (
    <div className="space-y-4">
      {/* Upcoming high impact */}
      {upcomingHigh.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-3">
            <Timer className="w-4 h-4" /> News a fort impact a venir ({upcomingHigh.length})
          </h3>
          <div className="space-y-2">
            {upcomingHigh.map(n => (
              <div key={n.id} className="flex items-center gap-3 bg-slate-900/40 rounded-lg p-3">
                <span className="text-xs font-bold text-amber-400">{n.timeLabel}</span>
                <span className="text-xs text-slate-300 flex-1">{n.title}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${IMPACT_COLORS[n.impact].badge}`}>{n.impact}</span>
                {n.aiDecision === 'NO_TRADE' && <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-[9px] text-rose-400 font-bold">NO TRADE</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Trade alerts */}
      {noTradeAlerts.length > 0 && (
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-rose-400 flex items-center gap-2 mb-3">
            <Ban className="w-4 h-4" /> Alertes No Trade ({noTradeAlerts.length})
          </h3>
          <div className="space-y-2">
            {noTradeAlerts.map(n => (
              <div key={n.id} className="flex items-center gap-3 bg-slate-900/40 rounded-lg p-3">
                <span className="text-xs font-bold text-rose-400">{n.timeLabel}</span>
                <span className="text-xs text-slate-300 flex-1">{n.title}</span>
                <div className="flex gap-1">
                  {n.affectedAssets.slice(0, 3).map(a => (
                    <span key={a} className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-slate-500">{a}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Surprise results */}
      {surpriseNews.length > 0 && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4" /> Surprises detectees ({surpriseNews.length})
          </h3>
          <div className="space-y-2">
            {surpriseNews.map(n => (
              <div key={n.id} className="flex items-center gap-3 bg-slate-900/40 rounded-lg p-3">
                <span className={`text-xs font-bold ${n.surprise === 'positive' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {n.surprise === 'positive' ? 'Positif' : 'Negatif'}
                </span>
                <span className="text-xs text-slate-300 flex-1">{n.title}</span>
                <span className="text-xs text-slate-500">Prev: {n.forecastValue} → Reel: {n.actualValue}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {upcomingHigh.length === 0 && noTradeAlerts.length === 0 && surpriseNews.length === 0 && (
        <EmptyState message="Aucune alerte active pour le moment" />
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
      <Newspaper className="w-10 h-10 text-slate-600 mx-auto mb-3" />
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}
