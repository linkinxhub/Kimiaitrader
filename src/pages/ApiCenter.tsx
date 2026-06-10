import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Webhook, Key, Copy, Check, RefreshCw, Trash2, Play, CheckCircle,
  XCircle, AlertTriangle, Clock, Zap, TrendingUp, Globe, Bot,
  MessageSquare, CreditCard, ChevronDown, ChevronUp, Eye, EyeOff,
  Activity, BarChart3, Wifi, WifiOff, Timer, Database,
  TrendingDown, Layers, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  getAllProviderStatuses,
  getRecentCalls,
  getApiSummary,
  resetApiStats,
  type ApiProviderStatus,
  type ApiCall,
  type ApiSummary,
} from '@/services/apiMonitorService';
import { fetchBinanceAllPrices, fetchCoinGeckoPrices, fetchForexRate, fetchCurrencyRate } from '@/services/marketApi';

// ─── Icon Map ───────────────────────────────────────────

const iconMap: Record<string, React.ElementType> = {
  zap: Zap, globe: Globe, 'trending-up': TrendingUp, 'bar-chart': BarChart3,
  bot: Bot, 'message-square': MessageSquare, mail: MessageSquare,
  'credit-card': CreditCard,
};

const categoryLabels: Record<string, string> = {
  market: 'Données Marché', crypto: 'Crypto', forex: 'Forex',
  commodity: 'Matières Premières', ai: 'Intelligence Artificielle',
  notifications: 'Notifications', payments: 'Paiements',
};

const statusConfig = {
  connected: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle, label: 'Connecté' },
  disconnected: { color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: WifiOff, label: 'Déconnecté' },
  error: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle, label: 'Erreur' },
  limited: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle, label: 'Limité' },
};

// ─── Format helpers ─────────────────────────────────────

function timeAgo(ts: number): string {
  if (!ts || ts === 0) return 'Jamais';
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return 'À l\'instant';
  if (s < 60) return `Il y a ${s}s`;
  if (s < 3600) return `Il y a ${Math.floor(s / 60)}min`;
  return `Il y a ${Math.floor(s / 3600)}h`;
}

function formatMs(ms: number): string {
  if (ms === 0) return '—';
  if (ms < 100) return `${ms}ms`;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ─── Component ──────────────────────────────────────────

export default function ApiCenter() {
  const [activeTab, setActiveTab] = useState<'live' | 'providers' | 'logs' | 'keys'>('live');
  const [providers, setProviders] = useState<ApiProviderStatus[]>([]);
  const [summary, setSummary] = useState<ApiSummary>(getApiSummary());
  const [recentCalls, setRecentCalls] = useState<ApiCall[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['crypto', 'forex', 'commodity']);
  const [testResult, setTestResult] = useState<Record<string, { status: string; time: number }>>({});
  const [showKey, setShowKey] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const refresh = useCallback(() => {
    setProviders(getAllProviderStatuses());
    setSummary(getApiSummary());
    setRecentCalls(getRecentCalls(undefined, 30));
    setRefreshTick(t => t + 1);
  }, []);

  // Auto-refresh every 3 seconds for live feel
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const testProvider = async (provider: ApiProviderStatus) => {
    const key = provider.id;
    setTestResult(prev => ({ ...prev, [key]: { status: 'testing', time: 0 } }));
    const start = performance.now();

    try {
      let res: Response | null = null;
      switch (key) {
        case 'binance':
          res = await fetch(`${provider.baseUrl}/ticker/price?symbol=BTCUSDT`, { cache: 'no-store' });
          break;
        case 'coingecko':
          res = await fetch(`${provider.baseUrl}/simple/price?ids=bitcoin&vs_currencies=usd`, { cache: 'no-store' });
          break;
        case 'frankfurter':
          res = await fetch(`${provider.baseUrl}/latest?from=EUR&to=USD`, { cache: 'no-store' });
          break;
        case 'currencyapi':
          res = await fetch(`${provider.baseUrl}@latest/v1/currencies/usd.json`, { cache: 'no-store' });
          break;
        case 'alphavantage':
          res = await fetch(`${provider.baseUrl}?function=TIME_SERIES_INTRADAY&symbol=IBM&interval=5min&apikey=demo`, { cache: 'no-store' });
          break;
        case 'twelvedata':
          res = await fetch(`${provider.baseUrl}/quote?symbol=AAPL&apikey=demo`, { cache: 'no-store' });
          break;
        case 'yahoo':
          res = await fetch(`${provider.baseUrl}/v8/finance/chart/^GSPC?interval=1d&range=1d`, { cache: 'no-store' });
          break;
        default:
          res = { ok: false, status: 0, statusText: 'No test endpoint' } as Response;
      }

      const ms = Math.round(performance.now() - start);
      if (res && res.ok) {
        setTestResult(prev => ({ ...prev, [key]: { status: `Connecté — ${res.status} en ${ms}ms`, time: ms } }));
      } else {
        const statusText = res ? `${res.status} ${res.statusText}` : 'No response';
        setTestResult(prev => ({ ...prev, [key]: { status: `Erreur — ${statusText} (${ms}ms)`, time: ms } }));
      }
      refresh();
    } catch (e) {
      const ms = Math.round(performance.now() - start);
      setTestResult(prev => ({ ...prev, [key]: { status: `Échec — ${e instanceof Error ? e.message : 'Network error'} (${ms}ms)`, time: ms } }));
    }
  };

  // Force a live data refresh
  const forceRefresh = async () => {
    // Trigger real API calls
    await Promise.allSettled([
      fetchBinanceAllPrices(),
      fetchCoinGeckoPrices(['bitcoin', 'ethereum', 'solana']),
      fetchForexRate('EUR', 'USD'),
      fetchCurrencyRate('usd', 'xau'),
    ]);
    refresh();
  };

  const handleReset = () => {
    if (confirm('Réinitialiser toutes les statistiques API ?')) {
      resetApiStats();
      refresh();
    }
  };

  const categories = [...new Set(providers.map(p => p.category))];
  const totalCalls = providers.reduce((s, p) => s + p.totalCalls, 0);

  // Live pulse chart data
  const liveProviders = providers.filter(p => p.status === 'connected');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Webhook className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">API Center</h1>
            <p className="text-xs text-slate-400">Monitoring temps réel des APIs externes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={forceRefresh} className="flex items-center gap-2 px-3 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-sm text-cyan-400 hover:bg-cyan-500/20 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Rafraîchir Live
          </button>
          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/20">ADMIN</span>
        </div>
      </motion.div>

      {/* ─── LIVE DASHBOARD ─── */}
      {activeTab === 'live' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Live Status Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-900/60 border border-emerald-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wifi className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-400">Connectés</span>
              </div>
              <p className="text-2xl font-bold text-emerald-400">{summary.connected}</p>
              <p className="text-xs text-slate-500">/ {summary.totalProviders} fournisseurs</p>
            </div>
            <div className="bg-slate-900/60 border border-blue-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-slate-400">Appels aujourd'hui</span>
              </div>
              <p className="text-2xl font-bold text-blue-400">{summary.totalCallsToday}</p>
              <p className="text-xs text-slate-500">{summary.totalCallsThisHour} cette heure</p>
            </div>
            <div className="bg-slate-900/60 border border-amber-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Timer className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-slate-400">Latence moyenne</span>
              </div>
              <p className="text-2xl font-bold text-amber-400">{formatMs(summary.avgResponseTime)}</p>
              <p className="text-xs text-slate-500">Sur {totalCalls} appels</p>
            </div>
            <div className="bg-slate-900/60 border border-purple-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-slate-400">Taux d'erreur</span>
              </div>
              <p className="text-2xl font-bold text-purple-400">{summary.overallErrorRate.toFixed(1)}%</p>
              <p className="text-xs text-slate-500">Global</p>
            </div>
          </div>

          {/* Live API Status Grid */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" /> Statut des APIs en Temps Réel
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {providers.filter(p => ['binance', 'coingecko', 'frankfurter', 'currencyapi', 'alphavantage', 'twelvedata', 'yahoo'].includes(p.id)).map(p => {
                const cfg = statusConfig[p.status];
                const Icon = iconMap[p.icon] || Globe;
                const StatusIcon = cfg.icon;
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`bg-slate-900/60 border ${p.status === 'connected' ? 'border-emerald-500/20' : 'border-slate-800'} rounded-2xl p-4`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg.bg}`}>
                          <Icon className={`w-4 h-4 ${cfg.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.baseUrl.replace('https://', '')}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${cfg.bg}`}>
                        <StatusIcon className={`w-3 h-3 ${cfg.color}`} />
                        <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                      </div>
                    </div>

                    {/* Live metrics */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-slate-800/40 rounded-lg p-2 text-center">
                        <p className="text-xs text-slate-500">Dernier appel</p>
                        <p className="text-xs font-medium text-white">{timeAgo(p.lastCallTime)}</p>
                      </div>
                      <div className="bg-slate-800/40 rounded-lg p-2 text-center">
                        <p className="text-xs text-slate-500">Latence</p>
                        <p className={`text-xs font-medium ${p.lastResponseTime > 500 ? 'text-amber-400' : p.lastResponseTime > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {formatMs(p.lastResponseTime)}
                        </p>
                      </div>
                      <div className="bg-slate-800/40 rounded-lg p-2 text-center">
                        <p className="text-xs text-slate-500">Moyenne</p>
                        <p className="text-xs font-medium text-blue-400">{formatMs(p.avgResponseTime)}</p>
                      </div>
                    </div>

                    {/* Usage bar */}
                    {p.rateLimitPerMinute > 0 && (
                      <div className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500">Usage/min</span>
                          <span className={`${p.callsThisMinute > p.rateLimitPerMinute * 0.8 ? 'text-amber-400' : 'text-slate-400'}`}>
                            {p.callsThisMinute}/{p.rateLimitPerMinute}
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${p.callsThisMinute > p.rateLimitPerMinute * 0.8 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            animate={{ width: `${Math.min(100, (p.callsThisMinute / p.rateLimitPerMinute) * 100)}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Error rate */}
                    {p.totalCalls > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">{p.totalCalls} appels — {p.errorRate.toFixed(1)}% erreurs</span>
                        <button onClick={() => testProvider(p)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors">
                          <Play className="w-3 h-3" /> Tester
                        </button>
                      </div>
                    )}

                    {testResult[p.id] && (
                      <p className={`text-xs mt-2 ${testResult[p.id].status.includes('Connecté') ? 'text-emerald-400' : 'text-red-400'}`}>
                        {testResult[p.id].status}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Recent Calls Stream */}
          {recentCalls.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" /> Flux d'Appels Récents
              </h3>
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  {recentCalls.slice(0, 15).map((call, idx) => (
                    <motion.div
                      key={call.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className={`flex items-center gap-3 px-4 py-2.5 border-b border-slate-800/50 ${idx === 0 ? 'bg-cyan-500/5' : ''}`}
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${call.success ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="text-xs text-slate-400 w-24 flex-shrink-0">{call.provider}</span>
                      <span className="text-xs text-slate-500 flex-1 truncate">{call.endpoint}</span>
                      <span className={`text-xs font-medium w-12 text-right ${call.success ? 'text-emerald-400' : 'text-red-400'}`}>
                        {call.status}
                      </span>
                      <span className="text-xs text-blue-400 w-14 text-right">{formatMs(call.responseTime)}</span>
                      <span className="text-xs text-slate-600 w-16 text-right">{timeAgo(call.timestamp)}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ─── PROVIDERS TAB ─── */}
      {activeTab === 'providers' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {categories.map(cat => {
            const catProviders = providers.filter(p => p.category === cat);
            const isExpanded = expandedCategories.includes(cat);
            return (
              <div key={cat} className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
                <button onClick={() => toggleCategory(cat)} className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{categoryLabels[cat] || cat}</span>
                    <span className="text-xs text-slate-500">({catProviders.length})</span>
                    {catProviders.filter(p => p.status === 'connected').length > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs">
                        <Wifi className="w-3 h-3" /> {catProviders.filter(p => p.status === 'connected').length} actif
                      </span>
                    )}
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2">
                    {catProviders.map(p => {
                      const cfg = statusConfig[p.status];
                      const Icon = iconMap[p.icon] || Globe;
                      const StatusIcon = cfg.icon;
                      return (
                        <div key={p.id} className={`flex items-center gap-4 p-4 rounded-xl border ${cfg.border} ${cfg.bg}`}>
                          <Icon className={`w-5 h-5 ${cfg.color} flex-shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-white">{p.name}</p>
                              <StatusIcon className={`w-3 h-3 ${cfg.color}`} />
                              <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo(p.lastCallTime)}</span>
                              {p.lastResponseTime > 0 && <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> {formatMs(p.lastResponseTime)}</span>}
                              <span>Limite: {p.rateLimitPerMinute}/min</span>
                              <span>Erreurs: {p.errorRate.toFixed(1)}%</span>
                            </div>
                            {p.callsThisMinute > 0 && (
                              <div className="mt-2">
                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${p.callsThisMinute > p.rateLimitPerMinute * 0.8 ? 'bg-red-500' : p.callsThisMinute > p.rateLimitPerMinute * 0.5 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (p.callsThisMinute / p.rateLimitPerMinute) * 100)}%` }} />
                                </div>
                              </div>
                            )}
                          </div>
                          <button onClick={() => testProvider(p)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-300 transition-colors flex items-center gap-1 flex-shrink-0">
                            <Play className="w-3 h-3" /> Tester
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          <button onClick={handleReset} className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 hover:bg-red-500/20 transition-colors">
            Réinitialiser les statistiques
          </button>
        </motion.div>
      )}

      {/* ─── LOGS TAB ─── */}
      {activeTab === 'logs' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Journal d'Appels API</h3>
            <span className="text-xs text-slate-500">{recentCalls.length} entrées</span>
          </div>
          {recentCalls.length > 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs text-slate-500 border-b border-slate-800">
                <span className="col-span-1">Statut</span>
                <span className="col-span-2">Provider</span>
                <span className="col-span-4">Endpoint</span>
                <span className="col-span-1 text-center">HTTP</span>
                <span className="col-span-2 text-right">Latence</span>
                <span className="col-span-2 text-right">Heure</span>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {recentCalls.map(call => (
                  <div key={call.id} className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors items-center">
                    <div className="col-span-1 flex justify-center">
                      {call.success ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                    </div>
                    <span className="col-span-2 text-xs text-slate-300 truncate">{call.provider}</span>
                    <span className="col-span-4 text-xs text-slate-500 truncate">{call.endpoint}</span>
                    <span className={`col-span-1 text-center text-xs ${call.success ? 'text-emerald-400' : 'text-red-400'}`}>{call.status}</span>
                    <span className="col-span-2 text-right text-xs text-blue-400">{formatMs(call.responseTime)}</span>
                    <span className="col-span-2 text-right text-xs text-slate-600">{timeAgo(call.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
              <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Aucun appel enregistré</p>
              <p className="text-xs text-slate-500 mt-1">Naviguez sur les pages pour déclencher des appels API</p>
            </div>
          )}
        </motion.div>
      )}

      {/* ─── KEYS TAB ─── */}
      {activeTab === 'keys' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-slate-900/60 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-400">Clés API</p>
              <p className="text-xs text-slate-400">Cette plateforme utilise des APIs publiques qui ne nécessitent pas de clé API (Binance, CoinGecko, Frankfurter, Currency-API). Les clés ci-dessous sont simulées pour démonstration.</p>
            </div>
          </div>
          {[
            { id: 'k1', name: 'Production', key: 'xt_live_binance_coingecko_frankfurter', created: '2026-01-15', lastUsed: 'À l\'instant', status: 'active' as const },
            { id: 'k2', name: 'Dev — Public APIs', key: 'xt_dev_public_free_tier', created: '2026-03-10', lastUsed: 'Il y a 2min', status: 'active' as const },
          ].map(k => (
            <motion.div key={k.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-white">{k.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${k.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{k.status}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setShowKey(showKey === k.id ? null : k.id)} className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
                    {showKey === k.id ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                  </button>
                  <button onClick={() => navigator.clipboard?.writeText(k.key)} className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
                    <Copy className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 rounded-lg p-3">
                <code className="text-xs text-slate-300 font-mono">{showKey === k.id ? k.key : `${k.key.slice(0, 16)}••••••••`}</code>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                <span>Créée: {k.created}</span>
                <span>Dernière utilisation: {k.lastUsed}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Bottom Tabs */}
      <div className="flex gap-2 border-t border-slate-800 pt-4">
        {[
          { id: 'live' as const, label: 'Live', icon: Activity },
          { id: 'providers' as const, label: 'Fournisseurs', icon: Globe },
          { id: 'logs' as const, label: 'Logs', icon: Layers },
          { id: 'keys' as const, label: 'Clés API', icon: Key },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === t.id ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-800/60'
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
