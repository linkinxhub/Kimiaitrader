/**
 * Admin API Manager — Configuration centralisee des providers
 * Admin Panel > Systeme > API & Donnees Live
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getProviders, saveProviders, addProvider, removeProvider, updateProvider, resetProviders,
  getApiSettings, saveApiSettings, resetApiSettings,
  getApiLogs, clearApiLogs, getApiStats,
  fallbackFetch,
  type ApiProvider, type ProviderType, type ApiSettings, type ProviderStatus,
  DEFAULT_API_SETTINGS,
} from '@/services/apiProviderManager';
import { cacheClearAll } from '@/services/cacheManager';
import AdminValueCard from '@/components/AdminValueCard';
import {
  Server, Key, RefreshCw, Trash2, Plus, Play, AlertTriangle,
  CheckCircle, XCircle, Clock, Zap, Shield, Activity, Database,
  Eye, EyeOff, Save, RotateCcw, ChevronDown, ChevronUp,
  Globe, Wifi, WifiOff, TrendingUp, X, Settings, Terminal,
  BarChart3, Layers, AlertOctagon,
} from 'lucide-react';

const PROVIDER_TYPES: { key: ProviderType; label: string }[] = [
  { key: 'crypto', label: 'Crypto' },
  { key: 'forex', label: 'Forex' },
  { key: 'metals', label: 'Metaux' },
  { key: 'stocks', label: 'Actions' },
  { key: 'indices', label: 'Indices' },
  { key: 'news', label: 'News' },
  { key: 'calendar', label: 'Calendrier' },
  { key: 'websocket', label: 'WebSocket' },
];

export default function AdminApiManager() {
  const [providers, setProviders] = useState<ApiProvider[]>(getProviders);
  const [settings, setSettings] = useState<ApiSettings>(getApiSettings);
  const [logs] = useState(() => getApiLogs());
  const [stats] = useState(() => getApiStats());
  const [activeTab, setActiveTab] = useState<'providers' | 'settings' | 'logs' | 'stats'>('providers');
  const [editingProvider, setEditingProvider] = useState<ApiProvider | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [testResult, setTestResult] = useState<{ provider: string; status: string; latency: number; message: string } | null>(null);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [savedToast, setSavedToast] = useState(false);

  const saveAll = () => {
    saveProviders(providers);
    saveApiSettings(settings);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const toggleProvider = (id: string) => {
    setProviders(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive, status: p.isActive ? 'disabled' as ProviderStatus : 'active' as ProviderStatus } : p));
  };

  const testProvider = async (provider: ApiProvider) => {
    setTestResult({ provider: provider.name, status: 'testing', latency: 0, message: 'Test en cours...' });
    const start = performance.now();
    try {
      let success = false;
      if (provider.type.includes('crypto')) {
        const res = await fetch(`${provider.baseUrl}/ticker/price?symbol=BTCUSDT`, { signal: AbortSignal.timeout(8000) });
        success = res.ok;
      } else if (provider.type.includes('forex')) {
        const res = await fetch(`${provider.baseUrl}/latest?from=EUR&to=USD`, { signal: AbortSignal.timeout(8000) });
        success = res.ok;
      } else if (provider.type.includes('stocks') || provider.type.includes('indices')) {
        const key = provider.apiKey || '';
        const res = await fetch(`${provider.baseUrl}/quote?symbol=AAPL&token=${key}`, { signal: AbortSignal.timeout(8000) });
        success = res.ok || res.status === 401; // 401 = key issue but endpoint valid
      } else {
        const res = await fetch(provider.baseUrl, { signal: AbortSignal.timeout(8000), method: 'HEAD' });
        success = res.ok || res.status < 500;
      }
      const latency = Math.round(performance.now() - start);
      setTestResult({ provider: provider.name, status: success ? 'success' : 'error', latency, message: success ? `Connecte (${latency}ms)` : 'Erreur de connexion' });
    } catch (e) {
      setTestResult({ provider: provider.name, status: 'error', latency: Math.round(performance.now() - start), message: e instanceof Error ? e.message : 'Echec' });
    }
  };

  return (
    <div className="space-y-6">
      <AdminValueCard
        title="API Manager"
        icon={Server}
        summary="Connecte la plateforme a des donnees reelles et live : prix, news, signaux, decisions IA et alertes."
        userValue="Les utilisateurs beneficient de donnees fiables, fraiches et transparentes sur toutes les rubriques."
        adminValue="Permet de gerer les providers, configurer les fallbacks, monitorer la sante des APIs et les quotas."
        modulesConnected={['Dashboard', 'Analyse Technique', 'Signaux IA', 'News Center', 'Radar Opportunites']}
        dataSources={['Binance', 'CoinGecko', 'Finnhub', 'Frankfurter', 'Alpha Vantage']}
        packs={['Free', 'Pro', 'Expert', 'Institutionnel']}
        recommendedSettings={['Configurer l\'API principale', 'Activer le fallback automatique', 'Verifier les quotas et latences', 'Tester les connexions']}
        impactLevel="critique"
        configStatus="incomplet"
        quickActions={[{ label: 'Tester connexions', onClick: () => setTestResult(null), icon: Play }, { label: 'Vider cache', onClick: () => cacheClearAll(), icon: Trash2 }]}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
            <Server className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">API Manager</h2>
            <p className="text-xs text-slate-500">{stats.activeProviders} actives / {stats.totalProviders} configurees — Latence moy : {stats.avgLatency}ms</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={saveAll} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors">
            <Save className="w-3.5 h-3.5" /> Sauvegarder
          </button>
        </div>
      </div>

      {/* Saved toast */}
      <AnimatePresence>
        {savedToast && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-4 right-4 z-50 px-4 py-2 bg-emerald-500 text-white text-xs font-medium rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Configuration sauvegardee
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <AdminStat icon={Server} label="API Actives" value={String(stats.activeProviders)} color="emerald" />
        <AdminStat icon={AlertTriangle} label="En Erreur" value={String(stats.providersInError)} color="red" />
        <AdminStat icon={Activity} label="Requetes" value={String(stats.totalRequestsToday)} color="blue" />
        <AdminStat icon={Clock} label="Latence Moy." value={`${stats.avgLatency}ms`} color="amber" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 rounded-xl p-1">
        {([
          { key: 'providers' as const, label: 'Providers', icon: Layers },
          { key: 'settings' as const, label: 'Parametres', icon: Settings },
          { key: 'logs' as const, label: 'Logs', icon: Terminal },
          { key: 'stats' as const, label: 'Stats', icon: BarChart3 },
        ]).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all flex-1 justify-center ${
              activeTab === t.key ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
            }`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Test result banner */}
      <AnimatePresence>
        {testResult && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className={`rounded-xl border p-3 flex items-center gap-3 ${
              testResult.status === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' :
              testResult.status === 'testing' ? 'bg-blue-500/5 border-blue-500/20' :
              'bg-red-500/5 border-red-500/20'
            }`}>
              {testResult.status === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> :
               testResult.status === 'testing' ? <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" /> :
               <XCircle className="w-4 h-4 text-red-400" />}
              <div>
                <p className="text-xs text-white font-medium">{testResult.provider} — {testResult.message}</p>
                {testResult.latency > 0 && <p className="text-[10px] text-slate-500">{testResult.latency}ms</p>}
              </div>
              <button onClick={() => setTestResult(null)} className="ml-auto p-1 hover:bg-slate-800 rounded"><X className="w-3 h-3 text-slate-500" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab content */}
      {activeTab === 'providers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Providers configures</h3>
            <button onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 hover:text-white transition-colors border border-slate-700">
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </button>
          </div>

          <AnimatePresence>
            {showAddForm && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <AddProviderForm onAdd={(p) => { addProvider(p); setProviders(getProviders()); setShowAddForm(false); }} onCancel={() => setShowAddForm(false)} />
              </motion.div>
            )}
          </AnimatePresence>

          {providers.map(provider => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              showKey={showKey[provider.id] || false}
              onToggleKey={() => setShowKey(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}
              onToggleActive={() => toggleProvider(provider.id)}
              onTest={() => testProvider(provider)}
              onEdit={() => setEditingProvider(editingProvider?.id === provider.id ? null : provider)}
              onDelete={() => { removeProvider(provider.id); setProviders(getProviders()); }}
              isEditing={editingProvider?.id === provider.id}
              onSaveEdit={(updates) => { updateProvider(provider.id, updates); setProviders(getProviders()); setEditingProvider(null); }}
            />
          ))}
        </div>
      )}

      {activeTab === 'settings' && (
        <ApiSettingsPanel settings={settings} onChange={setSettings} onReset={() => { resetApiSettings(); setSettings(getApiSettings()); }} />
      )}

      {activeTab === 'logs' && (
        <ApiLogsPanel logs={logs} onClear={() => { clearApiLogs(); }} />
      )}

      {activeTab === 'stats' && (
        <ApiStatsPanel stats={stats} />
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────

function AdminStat({ icon: Icon, label, value, color }: { icon: typeof Server; label: string; value: string; color: string }) {
  const colors: Record<string, string> = { emerald: 'text-emerald-400', red: 'text-red-400', blue: 'text-blue-400', amber: 'text-amber-400' };
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
      <Icon className={`w-5 h-5 ${colors[color] || 'text-slate-400'}`} />
      <div>
        <p className="text-base font-bold text-white">{value}</p>
        <p className="text-[10px] text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function ProviderCard({ provider, showKey, onToggleKey, onToggleActive, onTest, onEdit, onDelete, isEditing, onSaveEdit }: {
  provider: ApiProvider; showKey: boolean; onToggleKey: () => void; onToggleActive: () => void;
  onTest: () => void; onEdit: () => void; onDelete: () => void; isEditing: boolean;
  onSaveEdit: (u: Partial<ApiProvider>) => void;
}) {
  const statusColors: Record<ProviderStatus, { bg: string; dot: string; label: string }> = {
    active: { bg: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400', label: 'Active' },
    error: { bg: 'bg-red-500/10 border-red-500/20', dot: 'bg-red-400', label: 'Erreur' },
    'quota_exceeded': { bg: 'bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400', label: 'Quota' },
    disabled: { bg: 'bg-slate-500/10 border-slate-600/20', dot: 'bg-slate-500', label: 'Desactivee' },
    unconfigured: { bg: 'bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-400', label: 'A configurer' },
  };
  const sc = statusColors[provider.status] || statusColors.unconfigured;

  const [editForm, setEditForm] = useState(provider);

  if (isEditing) {
    return (
      <div className="bg-slate-900/80 border border-blue-500/30 rounded-xl p-4 space-y-3">
        <h4 className="text-xs font-semibold text-blue-400">Modifier {provider.name}</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-slate-500 mb-1">URL Base</p>
            <input value={editForm.baseUrl} onChange={e => setEditForm(p => ({ ...p, baseUrl: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 mb-1">WebSocket URL</p>
            <input value={editForm.wsUrl || ''} onChange={e => setEditForm(p => ({ ...p, wsUrl: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 mb-1">Cle API</p>
            <input value={editForm.apiKey || ''} onChange={e => setEditForm(p => ({ ...p, apiKey: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white" placeholder="Entrer la cle API" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 mb-1">Priorite (1=plus haute)</p>
            <input type="number" value={editForm.priority} onChange={e => setEditForm(p => ({ ...p, priority: Number(e.target.value) }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 mb-1">Rate limit/min</p>
            <input type="number" value={editForm.rateLimitPerMinute} onChange={e => setEditForm(p => ({ ...p, rateLimitPerMinute: Number(e.target.value) }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white" />
          </div>
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={editForm.isPrimary} onChange={e => setEditForm(p => ({ ...p, isPrimary: e.target.checked }))}
                className="rounded border-slate-600" /> Primaire
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={editForm.isFallback} onChange={e => setEditForm(p => ({ ...p, isFallback: e.target.checked }))}
                className="rounded border-slate-600" /> Fallback
            </label>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onSaveEdit(editForm)} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs">Sauvegarder</button>
          <button onClick={onEdit} className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-xs">Annuler</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-4 transition-colors ${sc.bg} ${provider.isActive ? '' : 'opacity-50'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full ${sc.dot} ${provider.isActive ? 'animate-pulse' : ''}`} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-white">{provider.name}</h4>
            {provider.isPrimary && <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-[9px] text-blue-400 font-medium">PRIMARY</span>}
            {provider.isFallback && <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-[9px] text-amber-400 font-medium">FALLBACK</span>}
            <span className="text-[10px] text-slate-500 ml-auto">{sc.label}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">{provider.baseUrl}</p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {provider.type.map(t => (
              <span key={t} className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-slate-400 uppercase">{t}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {provider.supportsWs && (provider.status === 'active' ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-slate-600" />)}
          <button onClick={onToggleActive} className={`p-1.5 rounded-lg transition-colors ${provider.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
            {provider.isActive ? <Zap className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onTest} className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">
            <Play className="w-3.5 h-3.5" />
          </button>
          <button onClick={onEdit} className="p-1.5 rounded-lg bg-slate-700 text-slate-400 hover:text-white">
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Key display */}
      {provider.apiKey && (
        <div className="mt-2 flex items-center gap-2">
          <Key className="w-3 h-3 text-slate-600" />
          <code className="text-[10px] text-slate-500 font-mono">
            {showKey ? provider.apiKey : `${provider.apiKey.slice(0, 4)}****${provider.apiKey.slice(-4)}`}
          </code>
          <button onClick={onToggleKey} className="p-0.5 hover:bg-slate-800 rounded">
            {showKey ? <EyeOff className="w-3 h-3 text-slate-500" /> : <Eye className="w-3 h-3 text-slate-500" />}
          </button>
        </div>
      )}

      {provider.lastError && (
        <p className="mt-2 text-[10px] text-red-400 flex items-center gap-1"><AlertOctagon className="w-3 h-3" /> {provider.lastError}</p>
      )}

      {provider.latencyMs && provider.status === 'active' && (
        <p className="mt-1 text-[10px] text-slate-600 flex items-center gap-1"><Clock className="w-3 h-3" /> Derniere latence : {provider.latencyMs}ms {provider.lastSuccessAt && `— ${new Date(provider.lastSuccessAt).toLocaleTimeString()}`}</p>
      )}
    </div>
  );
}

function AddProviderForm({ onAdd, onCancel }: { onAdd: (p: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    name: '', slug: '', baseUrl: '', wsUrl: '', apiKey: '',
    type: [] as ProviderType[], isPrimary: false, isFallback: true,
    priority: 3, rateLimitPerMinute: 60, supportsRest: true, supportsWs: false,
  });

  const toggleType = (t: ProviderType) => {
    setForm(f => ({ ...f, type: f.type.includes(t) ? f.type.filter(x => x !== t) : [...f.type, t] }));
  };

  return (
    <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 space-y-3">
      <h4 className="text-xs font-semibold text-white">Nouveau Provider</h4>
      <div className="grid grid-cols-2 gap-3">
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nom" className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white" />
        <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="Slug" className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white" />
        <input value={form.baseUrl} onChange={e => setForm(f => ({ ...f, baseUrl: e.target.value }))} placeholder="URL Base" className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white col-span-2" />
        <input value={form.wsUrl} onChange={e => setForm(f => ({ ...f, wsUrl: e.target.value }))} placeholder="WebSocket URL (optionnel)" className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white col-span-2" />
        <input value={form.apiKey} onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))} placeholder="Cle API" className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white col-span-2" />
      </div>
      <div>
        <p className="text-[10px] text-slate-500 mb-1">Types</p>
        <div className="flex flex-wrap gap-2">
          {PROVIDER_TYPES.map(t => (
            <button key={t.key} onClick={() => toggleType(t.key)}
              className={`px-2 py-1 rounded-lg text-[10px] border transition-colors ${form.type.includes(t.key) ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onAdd(form)} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs">Ajouter</button>
        <button onClick={onCancel} className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-xs">Annuler</button>
      </div>
    </div>
  );
}

function ApiSettingsPanel({ settings, onChange, onReset }: { settings: ApiSettings; onChange: (s: ApiSettings) => void; onReset: () => void }) {
  const update = (partial: Partial<ApiSettings>) => onChange({ ...settings, ...partial });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Settings className="w-4 h-4 text-slate-400" /> Parametres globaux</h3>
        <button onClick={onReset} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-400 hover:text-white border border-slate-700">
          <RotateCcw className="w-3 h-3" /> Defauts
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {([
          { key: 'enableLiveData' as const, label: 'Activer donnees live', icon: Zap },
          { key: 'enableWebsocket' as const, label: 'Activer WebSocket', icon: Wifi },
          { key: 'enableFallback' as const, label: 'Activer fallback auto', icon: Layers },
          { key: 'enableCache' as const, label: 'Activer cache', icon: Database },
          { key: 'showDataSource' as const, label: 'Afficher source donnee', icon: Globe },
          { key: 'showLastUpdate' as const, label: 'Afficher derniere mise a jour', icon: Clock },
          { key: 'preventFakeData' as const, label: 'Bloquer donnees fictives', icon: Shield },
          { key: 'autoDisableFailed' as const, label: 'Auto-desactiver API en erreur', icon: AlertTriangle },
          { key: 'notifyAdminOnError' as const, label: 'Notifier admin sur erreur', icon: AlertOctagon },
          { key: 'disableDemoData' as const, label: 'Desactiver donnees demo', icon: BanIcon },
          { key: 'allowMockData' as const, label: 'Autoriser donnees mock (fallback)', icon: Activity },
          { key: 'requireSourceUrl' as const, label: 'Exiger URL source (news)', icon: Globe },
          { key: 'requireTimestamp' as const, label: 'Exiger timestamp (news)', icon: Clock },
          { key: 'preventAIDecisionFromDemo' as const, label: 'Bloquer decisions IA sur demo', icon: Shield },
        ]).map(item => (
          <label key={item.key} className="flex items-center gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
            <item.icon className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-300 flex-1">{item.label}</span>
            <div className={`w-10 h-5 rounded-full transition-colors relative ${settings[item.key] ? 'bg-blue-500' : 'bg-slate-700'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${settings[item.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <input type="checkbox" checked={settings[item.key]} onChange={e => update({ [item.key]: e.target.checked })}
              className="sr-only" />
          </label>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] text-slate-500 mb-1">Refresh (secondes)</p>
          <input type="number" value={settings.refreshInterval} onChange={e => update({ refreshInterval: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white" />
        </div>
        <div>
          <p className="text-[10px] text-slate-500 mb-1">Cache (secondes)</p>
          <input type="number" value={settings.cacheDuration} onChange={e => update({ cacheDuration: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white" />
        </div>
        <div>
          <p className="text-[10px] text-slate-500 mb-1">Seuil stale (secondes)</p>
          <input type="number" value={settings.staleThreshold} onChange={e => update({ staleThreshold: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white" />
        </div>
      </div>

      <div>
        <p className="text-[10px] text-slate-500 mb-1">Fuseau horaire</p>
        <input value={settings.timezone} onChange={e => update({ timezone: e.target.value })}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white" />
      </div>
    </div>
  );
}

function ApiLogsPanel({ logs, onClear }: { logs: import('@/services/apiProviderManager').ApiCallLog[]; onClear: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Terminal className="w-4 h-4 text-slate-400" /> Logs API ({logs.length})</h3>
        <button onClick={onClear} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-400 hover:text-red-400 border border-slate-700">
          <Trash2 className="w-3 h-3" /> Vider
        </button>
      </div>
      {logs.length === 0 ? (
        <p className="text-xs text-slate-600 text-center py-8">Aucun log pour le moment</p>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto">
            {logs.slice(0, 50).map(log => (
              <div key={log.id} className="flex items-center gap-3 px-4 py-2 border-b border-slate-800/50 text-[10px]">
                <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'success' ? 'bg-emerald-400' : log.status === 'quota_exceeded' ? 'bg-amber-400' : 'bg-red-400'}`} />
                <span className="text-slate-500 w-16">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span className="text-slate-400 w-20 truncate">{log.providerId.replace('prov-', '')}</span>
                <span className="text-slate-500 flex-1 truncate">{log.endpoint}</span>
                <span className={`${log.status === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>{log.status}</span>
                <span className="text-slate-600">{log.responseTimeMs}ms</span>
                {log.errorMessage && <span className="text-red-400 truncate max-w-[150px]">{log.errorMessage}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ApiStatsPanel({ stats }: { stats: ReturnType<typeof getApiStats> }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2"><BarChart3 className="w-4 h-4 text-slate-400" /> Statistiques</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard icon={Server} label="Providers Total" value={String(stats.totalProviders)} />
        <StatCard icon={CheckCircle} label="Actives" value={String(stats.activeProviders)} />
        <StatCard icon={XCircle} label="En Erreur" value={String(stats.providersInError)} />
        <StatCard icon={Clock} label="Latence Moy." value={`${stats.avgLatency}ms`} />
        <StatCard icon={Activity} label="Requetes Auj." value={String(stats.totalRequestsToday)} />
        <StatCard icon={Wifi} label="WebSocket" value={stats.wsConnected ? 'OK' : 'Off'} />
        <StatCard icon={Database} label="Derniere Donnee" value={stats.lastDataAt ? new Date(stats.lastDataAt).toLocaleTimeString() : '—'} />
        <StatCard icon={Layers} label="Fallback Utilise" value={String(stats.fallbackUsed)} />
        <StatCard icon={TrendingUp} label="Taux Succes" value={stats.totalRequestsToday > 0 ? `${Math.round((stats.totalRequestsToday - stats.fallbackUsed) / stats.totalRequestsToday * 100)}%` : '—'} />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Server; label: string; value: string }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
      <Icon className="w-4 h-4 text-slate-500 mb-1.5" />
      <p className="text-sm font-bold text-white">{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}

// ─── Icons helpers ──────────────────────────────────────

function BanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>
    </svg>
  );
}
