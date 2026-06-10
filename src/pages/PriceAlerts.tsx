import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Plus, Trash2, TrendingUp, TrendingDown, Equal,
  AlertTriangle, BellRing, History, Target
} from 'lucide-react';
import {
  getAlerts, saveAlert, deleteAlert, toggleAlert,
  getTriggeredHistory, clearTriggeredHistory, checkAlerts,
  type PriceAlert
} from '@/services/alertService';
import { useMarketData } from '@/hooks/useMarketData';

const ASSETS = ['XAU/USD', 'BTC/USD', 'ETH/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'XAG/USD', 'NAS100', 'SPX500'];

function formatPrice(value: unknown, minimumFractionDigits = 2) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return value.toLocaleString('fr-FR', { minimumFractionDigits });
}

export default function PriceAlerts() {
  const { prices } = useMarketData();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [history, setHistory] = useState<PriceAlert[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [triggered, setTriggered] = useState<PriceAlert[]>([]);
  const [form, setForm] = useState({
    asset: 'XAU/USD',
    condition: 'ABOVE' as 'ABOVE' | 'BELOW' | 'EQUALS',
    targetPrice: '',
    message: '',
  });

  const refresh = useCallback(() => {
    setAlerts(getAlerts());
    setHistory(getTriggeredHistory());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const priceMap: Record<string, number> = {};
    Object.entries(prices).forEach(([k, v]) => {
      if (v.price > 0) priceMap[k] = v.price;
    });
    if (Object.keys(priceMap).length === 0) return;

    const newTriggered = checkAlerts(priceMap);
    if (newTriggered.length > 0) {
      setTriggered(prev => [...newTriggered, ...prev].slice(0, 10));
      refresh();
    }
  }, [prices, refresh]);

  const handleSubmit = () => {
    const price = parseFloat(form.targetPrice);
    if (!price || price <= 0) return;

    saveAlert({
      asset: form.asset,
      condition: form.condition,
      targetPrice: price,
      message: form.message || `Alerte ${form.asset} ${form.condition} ${price}`,
    });

    setForm({ asset: 'XAU/USD', condition: 'ABOVE', targetPrice: '', message: '' });
    setShowForm(false);
    refresh();
  };

  const activeAlerts = alerts.filter(a => a.active && !a.triggeredAt);
  const inactiveAlerts = alerts.filter(a => !a.active && !a.triggeredAt);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Alertes de Prix</h1>
            <p className="text-xs text-slate-400">
              {Object.keys(prices).length > 0
                ? `${Object.keys(prices).length} actifs surveillés — Prix temps réel disponibles`
                : 'Chargement des prix...'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl text-sm font-semibold text-white hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" /> Nouvelle Alerte
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4"
          >
            <h3 className="text-sm font-semibold text-white mb-2">Configurer une alerte</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Actif</label>
                <select
                  value={form.asset}
                  onChange={e => setForm(f => ({ ...f, asset: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white"
                >
                  {ASSETS.map((asset) => (
                    <option key={asset} value={asset}>
                      {asset} — {formatPrice(prices[asset]?.price)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Condition</label>
                <select
                  value={form.condition}
                  onChange={e => setForm(f => ({ ...f, condition: e.target.value as 'ABOVE' | 'BELOW' | 'EQUALS' }))}
                  className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white"
                >
                  <option value="ABOVE">Au-dessus de</option>
                  <option value="BELOW">En-dessous de</option>
                  <option value="EQUALS">Egal a</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Prix cible</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.targetPrice}
                  onChange={e => setForm(f => ({ ...f, targetPrice: e.target.value }))}
                  placeholder="Ex: 4500"
                  className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl text-sm font-semibold text-white"
              >
                Creer l&apos;alerte
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-slate-400"
              >
                Annuler
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-amber-500/20 rounded-2xl p-4 text-center">
          <Bell className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{alerts.length}</p>
          <p className="text-xs text-slate-500">Total alertes</p>
        </div>
        <div className="bg-slate-900/60 border border-emerald-500/20 rounded-2xl p-4 text-center">
          <BellRing className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-emerald-400">{activeAlerts.length}</p>
          <p className="text-xs text-slate-500">Actives</p>
        </div>
        <div className="bg-slate-900/60 border border-blue-500/20 rounded-2xl p-4 text-center">
          <History className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-400">{history.length}</p>
          <p className="text-xs text-slate-500">Declenchees</p>
        </div>
        <div className="bg-slate-900/60 border border-purple-500/20 rounded-2xl p-4 text-center">
          <AlertTriangle className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-purple-400">{inactiveAlerts.length}</p>
          <p className="text-xs text-slate-500">Inactives</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-400" /> Alertes Actives
        </h3>
        {activeAlerts.length > 0 ? (
          <div className="space-y-2">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-4 bg-slate-900/60 border border-slate-800 rounded-2xl"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      alert.condition === 'ABOVE' ? 'bg-emerald-500/10' :
                      alert.condition === 'BELOW' ? 'bg-red-500/10' : 'bg-blue-500/10'
                    }`}
                  >
                    {alert.condition === 'ABOVE' ? <TrendingUp className="w-5 h-5 text-emerald-400" /> :
                      alert.condition === 'BELOW' ? <TrendingDown className="w-5 h-5 text-red-400" /> :
                        <Equal className="w-5 h-5 text-blue-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{alert.asset}</p>
                    <p className="text-xs text-slate-400">
                      {alert.condition === 'ABOVE' ? 'Au-dessus de' :
                        alert.condition === 'BELOW' ? 'En-dessous de' : 'Egal a'}{' '}
                      {formatPrice(alert.targetPrice, 0)}
                      {prices[alert.asset] && (
                        <span className="ml-2 text-slate-500">
                          — Actuel: {formatPrice(prices[alert.asset].price)}
                          {typeof alert.targetPrice === 'number' && alert.condition === 'ABOVE' && prices[alert.asset].price >= alert.targetPrice && (
                            <span className="text-emerald-400 ml-1">(ATTEINT)</span>
                          )}
                          {typeof alert.targetPrice === 'number' && alert.condition === 'BELOW' && prices[alert.asset].price <= alert.targetPrice && (
                            <span className="text-red-400 ml-1">(ATTEINT)</span>
                          )}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { toggleAlert(alert.id); refresh(); }}
                    className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Desactiver"
                  >
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => { deleteAlert(alert.id); refresh(); }}
                    className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
            <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-sm text-slate-400">Aucune alerte active</p>
            <p className="text-xs text-slate-500 mt-1">Creez une alerte pour suivre vos niveaux de prix</p>
          </div>
        )}
      </div>

      {triggered.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <BellRing className="w-4 h-4 text-red-400" /> Recemment declenchees
          </h3>
          <div className="space-y-2">
            {triggered.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                <BellRing className="w-4 h-4 text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-sm text-slate-300">{alert.message}</p>
                  <p className="text-xs text-slate-500">{alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleString('fr-FR') : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" /> Historique
            </h3>
            <button
              onClick={() => { clearTriggeredHistory(); refresh(); }}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors"
            >
              Vider
            </button>
          </div>
          <div className="space-y-2">
            {history.slice(0, 10).map((alert) => (
              <div key={alert.id} className="flex items-center gap-3 p-3 bg-slate-900/40 border border-slate-800/50 rounded-xl">
                <BellRing className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-sm text-slate-300">{alert.asset} {alert.condition} {formatPrice(alert.targetPrice, 0)}</p>
                  <p className="text-xs text-slate-500">{alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleString('fr-FR') : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
