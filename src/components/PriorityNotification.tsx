// ─── Priority Notification System ───────────────────────
// Composant central d'alertes avec son, priorité visuelle,
// notifications desktop et historique complet

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, X, Volume2, VolumeX, Trash2,
  Check, CheckCheck, Settings, Filter,
  AlertTriangle, Zap, TrendingUp, TrendingDown,
  Search, DollarSign, Cpu, ChevronDown, ChevronUp,
  Pin, ExternalLink, Clock, MousePointerClick, Moon
} from 'lucide-react';
import type { Alert, AlertPriority, AlertSettings } from '@/services/alertService';
import {
  getPriorityAlerts,
  getSortedAlerts,
  getUnreadCount,
  getUnreadByPriority,
  markAlertAsRead,
  markAllAsRead,
  deleteAlert,
  clearAllAlerts,
  getAlertSettings,
  saveAlertSettings,
  createAlert,
  storeAlertContext,
  priorityConfig,
  categoryIcons,
  categoryLabels,
  subscribeToAlerts,
  requestNotificationPermission,
  playTestSound,
  generateDemoAlerts,
} from '@/services/alertService';

const priorityOrder: AlertPriority[] = ['critical', 'high', 'medium', 'low'];

// ─── Priority Badge ───────────────────────────────────────

function PriorityBadge({ priority, size = 'sm' }: { priority: AlertPriority; size?: 'sm' | 'md' | 'lg' }) {
  const config = priorityConfig[priority];
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-bold ${config.bg} ${config.border} border ${config.color} ${sizeClasses[size]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {config.label}
    </span>
  );
}

// ─── Category Icon ────────────────────────────────────────

function CategoryIcon({ category }: { category: string }) {
  switch (category) {
    case 'signal': return <Zap className="w-4 h-4" />;
    case 'price': return <DollarSign className="w-4 h-4" />;
    case 'scanner': return <Search className="w-4 h-4" />;
    case 'system': return <Cpu className="w-4 h-4" />;
    case 'trade': return <TrendingUp className="w-4 h-4" />;
    default: return <Bell className="w-4 h-4" />;
  }
}

// ─── Individual Alert Card ────────────────────────────────

function AlertCard({
  alert,
  onRead,
  onDelete,
  onNavigate,
  compact = false,
}: {
  alert: Alert;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate?: (alert: Alert) => void;
  compact?: boolean;
}) {
  const config = priorityConfig[alert.priority];
  const [expanded, setExpanded] = useState(false);
  const isClickable = !!onNavigate && !!alert.route;

  if (compact) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className={`flex items-start gap-3 p-3 rounded-xl border ${
          alert.read
            ? 'bg-slate-900/30 border-slate-800/50 opacity-60'
            : `${config.bg} ${config.border} border`
        } ${isClickable ? 'cursor-pointer' : ''} hover:opacity-100 transition-all`}
        onClick={() => {
          if (isClickable) onNavigate(alert);
          else if (!alert.read) onRead(alert.id);
        }}
        title={isClickable ? `${alert.actionLabel || 'Voir'} — ${alert.route?.path}` : undefined}
      >
        <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
          <CategoryIcon category={alert.category} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <PriorityBadge priority={alert.priority} size="sm" />
            {!alert.read && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
            {isClickable && <MousePointerClick className="w-3 h-3 text-blue-400" />}
          </div>
          <p className="text-xs font-medium text-white truncate">{alert.title}</p>
          <p className="text-[10px] text-slate-500">{new Date(alert.createdAt).toLocaleTimeString('fr-FR')}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(alert.id); }}
          className="p-1 rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0"
        >
          <X className="w-3 h-3 text-slate-600" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`rounded-xl border ${
        alert.read
          ? 'bg-slate-900/30 border-slate-800/50'
          : `${config.bg} ${config.border} border`
      } overflow-hidden transition-all ${isClickable ? 'hover:border-blue-500/40 cursor-pointer' : 'hover:border-opacity-60'}`}
      onClick={() => {
        if (isClickable) onNavigate(alert);
      }}
      title={isClickable ? `Cliquez pour ${alert.actionLabel || 'ouvrir'}` : undefined}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center flex-shrink-0`}>
            <CategoryIcon category={alert.category} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <PriorityBadge priority={alert.priority} size="md" />
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <CategoryIcon category={alert.category} />
                {categoryLabels[alert.category]}
              </span>
              {!alert.read && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> NOUVEAU
                </span>
              )}
              {isClickable && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400">
                  <MousePointerClick className="w-3 h-3" /> CLIQUABLE
                </span>
              )}
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">{alert.title}</h4>
            <p className={`text-xs text-slate-400 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
              {alert.message}
            </p>
            {alert.message.length > 100 && (
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                className="text-xs text-blue-400 hover:text-blue-300 mt-1 flex items-center gap-0.5"
              >
                {expanded ? <><ChevronUp className="w-3 h-3" /> Voir moins</> : <><ChevronDown className="w-3 h-3" /> Voir plus</>}
              </button>
            )}
            {alert.metadata && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {alert.metadata.confidence && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-400">
                    Confiance: {alert.metadata.confidence}%
                  </span>
                )}
                {alert.metadata.asset && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400">
                    {alert.metadata.asset}
                  </span>
                )}
                {alert.metadata.direction && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    alert.metadata.direction === 'ACHAT'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`}>
                    {alert.metadata.direction === 'ACHAT' ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
                    {' '}{alert.metadata.direction}
                  </span>
                )}
                {alert.metadata.pnl !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    alert.metadata.pnl >= 0
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`}>
                    P&L: {alert.metadata.pnl >= 0 ? '+' : ''}{alert.metadata.pnl.toFixed(2)}€
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action bar: clickable CTA + read/delete buttons */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/30">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-600 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(alert.createdAt).toLocaleString('fr-FR')}
            </span>
            {isClickable && (
              <button
                onClick={(e) => { e.stopPropagation(); onNavigate?.(alert); }}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${config.bg} ${config.color} ${config.border} border hover:brightness-125`}
              >
                <ExternalLink className="w-3 h-3" />
                {alert.actionLabel || 'Voir'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!alert.read && (
              <button
                onClick={(e) => { e.stopPropagation(); onRead(alert.id); }}
                className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-slate-500 hover:text-emerald-400 transition-colors"
                title="Marquer comme lu"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(alert.id); }}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Settings Panel ───────────────────────────────────────

function AlertSettingsPanel({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState<AlertSettings>(getAlertSettings());

  const update = (partial: Partial<AlertSettings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    saveAlertSettings(next);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Settings className="w-4 h-4 text-blue-400" /> Paramètres d&apos;alertes
        </h4>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ─── Sound Section ─────────────────────────── */}
      <div className="space-y-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Audio</p>

        {/* Sound toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-300 flex items-center gap-2">
            {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            Sons d&apos;alerte
          </span>
          <button
            onClick={() => update({ soundEnabled: !settings.soundEnabled })}
            className={`w-10 h-5 rounded-full transition-all ${settings.soundEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
          >
            <motion.div animate={{ x: settings.soundEnabled ? 20 : 2 }} className="w-4 h-4 rounded-full bg-white shadow" />
          </button>
        </div>

        {/* Sound Volume */}
        <div className={`flex items-center gap-3 ${!settings.soundEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
          <VolumeX className="w-3 h-3 text-slate-500" />
          <input
            type="range" min="0" max="100"
            value={Math.round(settings.soundVolume * 100)}
            onChange={(e) => update({ soundVolume: Number(e.target.value) / 100 })}
            className="flex-1 h-1.5 bg-slate-700 rounded-full appearance-none accent-blue-500"
          />
          <Volume2 className="w-3 h-3 text-slate-400" />
          <span className="text-[10px] text-slate-400 font-mono w-8 text-right">{Math.round(settings.soundVolume * 100)}%</span>
        </div>

        {/* Vibration */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            Vibration
          </span>
          <button
            onClick={() => update({ vibrationEnabled: !settings.vibrationEnabled })}
            className={`w-10 h-5 rounded-full transition-all ${settings.vibrationEnabled ? 'bg-purple-500' : 'bg-slate-700'}`}
          >
            <motion.div animate={{ x: settings.vibrationEnabled ? 20 : 2 }} className="w-4 h-4 rounded-full bg-white shadow" />
          </button>
        </div>
      </div>

      {/* ─── Sound Type by Priority ────────────────── */}
      <div className="space-y-2 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Type de son par priorité</p>
        {priorityOrder.map(p => (
          <div key={p} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${p === 'critical' ? 'bg-red-400' : p === 'high' ? 'bg-orange-400' : p === 'medium' ? 'bg-amber-400' : 'bg-blue-400'}`} />
              <span className="text-xs text-slate-400">{priorityConfig[p].label}</span>
            </div>
            <select
              value={settings.soundsByPriority[p]}
              onChange={(e) => update({ soundsByPriority: { ...settings.soundsByPriority, [p]: e.target.value as any } })}
              disabled={!settings.soundEnabled}
              className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[10px] text-white focus:outline-none focus:border-blue-500 disabled:opacity-30"
            >
              <option value="pulse">Pulse (Urgent)</option>
              <option value="sweep">Sweep (Montant)</option>
              <option value="ding">Ding (Net)</option>
              <option value="chime">Chime (Doux)</option>
              <option value="none">Silencieux</option>
            </select>
          </div>
        ))}
        {/* Test sound */}
        <button
          onClick={() => playTestSound('medium')}
          disabled={!settings.soundEnabled}
          className="w-full mt-1 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold hover:bg-blue-500/20 transition-colors disabled:opacity-30"
        >
          Tester le son
        </button>
      </div>

      {/* ─── Do Not Disturb ────────────────────────── */}
      <div className="space-y-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ne Pas Déranger</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-300 flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-400" />
            Mode DND
          </span>
          <button
            onClick={() => update({ doNotDisturb: !settings.doNotDisturb })}
            className={`w-10 h-5 rounded-full transition-all ${settings.doNotDisturb ? 'bg-indigo-500' : 'bg-slate-700'}`}
          >
            <motion.div animate={{ x: settings.doNotDisturb ? 20 : 2 }} className="w-4 h-4 rounded-full bg-white shadow" />
          </button>
        </div>
        {settings.doNotDisturb && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-500">De</span>
              <input type="time" value={settings.doNotDisturbStart}
                onChange={(e) => update({ doNotDisturbStart: e.target.value })}
                className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-mono" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-500">À</span>
              <input type="time" value={settings.doNotDisturbEnd}
                onChange={(e) => update({ doNotDisturbEnd: e.target.value })}
                className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-mono" />
            </div>
          </div>
        )}
      </div>

      {/* ─── Notifications ─────────────────────────── */}
      <div className="space-y-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Notifications</p>

        {/* Desktop notifications */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-300 flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-400" />
            Notifications bureau
          </span>
          <button
            onClick={() => {
              if (!settings.desktopNotifications) requestNotificationPermission();
              update({ desktopNotifications: !settings.desktopNotifications });
            }}
            className={`w-10 h-5 rounded-full transition-all ${settings.desktopNotifications ? 'bg-blue-500' : 'bg-slate-700'}`}
          >
            <motion.div animate={{ x: settings.desktopNotifications ? 20 : 2 }} className="w-4 h-4 rounded-full bg-white shadow" />
          </button>
        </div>

        {/* Toast */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-300 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            Toast flottant
          </span>
          <button
            onClick={() => update({ toastEnabled: !settings.toastEnabled })}
            className={`w-10 h-5 rounded-full transition-all ${settings.toastEnabled ? 'bg-amber-500' : 'bg-slate-700'}`}
          >
            <motion.div animate={{ x: settings.toastEnabled ? 20 : 2 }} className="w-4 h-4 rounded-full bg-white shadow" />
          </button>
        </div>
      </div>

      {/* ─── Filtering ─────────────────────────────── */}
      <div className="space-y-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Filtrage</p>

        {/* Minimum priority */}
        <div>
          <span className="text-xs text-slate-400 mb-1.5 block">Priorité minimale</span>
          <div className="grid grid-cols-4 gap-1">
            {priorityOrder.map(p => (
              <button key={p} onClick={() => update({ minPriority: p })}
                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  settings.minPriority === p
                    ? `${priorityConfig[p].bg} ${priorityConfig[p].color} ${priorityConfig[p].border} border`
                    : 'bg-slate-900 text-slate-500 hover:bg-slate-700'
                }`}
              >
                {priorityConfig[p].label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <span className="text-xs text-slate-400 mb-1.5 block">Catégories</span>
          <div className="space-y-1.5">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={settings.categories.includes(key)}
                  onChange={(e) => {
                    const cats = e.target.checked
                      ? [...settings.categories, key]
                      : settings.categories.filter(c => c !== key);
                    update({ categories: cats });
                  }}
                  className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <CategoryIcon category={key} /> {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Auto mark read */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-300">Marquer auto lu</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => update({ autoMarkRead: !settings.autoMarkRead })}
              className={`w-10 h-5 rounded-full transition-all ${settings.autoMarkRead ? 'bg-slate-500' : 'bg-slate-700'}`}
            >
              <motion.div animate={{ x: settings.autoMarkRead ? 20 : 2 }} className="w-4 h-4 rounded-full bg-white shadow" />
            </button>
            {settings.autoMarkRead && (
              <select value={settings.autoMarkReadDelay}
                onChange={(e) => update({ autoMarkReadDelay: Number(e.target.value) })}
                className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[10px] text-white"
              >
                <option value={10}>10s</option>
                <option value={30}>30s</option>
                <option value={60}>1min</option>
                <option value={300}>5min</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="w-full py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold hover:bg-blue-500/20 transition-colors"
      >
        Retour aux alertes
      </button>
    </motion.div>
  );
}

// ─── Main Notification Panel ──────────────────────────────

export default function PriorityNotification() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeFilter, setActiveFilter] = useState<AlertPriority | 'all'>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadByPriority, setUnreadByPriority] = useState<Record<AlertPriority, number>>({ critical: 0, high: 0, medium: 0, low: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const navigateToAlert = useCallback((alert: Alert, closePanel?: () => void) => {
    if (!alert.route) return;
    storeAlertContext(alert.route);
    markAlertAsRead(alert.id);
    closePanel?.();
    navigate(alert.route.path);
  }, [navigate]);

  const refreshAlerts = useCallback(() => {
    setAlerts(getSortedAlerts());
    setUnreadCount(getUnreadCount());
    setUnreadByPriority(getUnreadByPriority());
  }, []);

  // Initialize demo alerts on first load
  useEffect(() => {
    try {
      generateDemoAlerts();
    } catch (e) { /* silent */ }
    refreshAlerts();
  }, [refreshAlerts]);

  // Subscribe to new alerts
  useEffect(() => {
    const unsub = subscribeToAlerts({
      onNewAlert: () => refreshAlerts(),
      onAlertRead: () => refreshAlerts(),
      onAlertsCleared: () => refreshAlerts(),
    });
    return unsub;
  }, [refreshAlerts]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowSettings(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Keyboard shortcut: 'A' to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'a' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = e.target as HTMLElement;
        if (tag.tagName === 'INPUT' || tag.tagName === 'TEXTAREA') return;
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleRead = (id: string) => {
    markAlertAsRead(id);
    refreshAlerts();
  };

  const handleDelete = (id: string) => {
    deleteAlert(id);
    refreshAlerts();
  };

  const handleClearAll = () => {
    clearAllAlerts();
    refreshAlerts();
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    refreshAlerts();
  };

  // Filter alerts
  const filtered = alerts.filter(a => {
    if (activeFilter !== 'all' && a.priority !== activeFilter) return false;
    if (showUnreadOnly && a.read) return false;
    return true;
  });

  // Group by priority for the summary
  const criticalUnread = unreadByPriority.critical;
  const highUnread = unreadByPriority.high;

  return (
    <div className="relative" ref={panelRef}>
      {/* ─── TRIGGER BUTTON ─────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 transition-all group"
        title="Alertes (A)"
      >
        <Bell className={`w-5 h-5 transition-colors ${unreadCount > 0 ? 'text-amber-400' : 'text-slate-400 group-hover:text-white'}`} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-lg shadow-red-500/30"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
        {/* Priority indicator dots */}
        {criticalUnread > 0 && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-slate-900 animate-pulse" />
        )}
        {!criticalUnread && highUnread > 0 && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-orange-500 border-2 border-slate-900" />
        )}
      </button>

      {/* ─── BACKDROP OVERLAY ───────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[150]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ─── DROPDOWN PANEL ─────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed right-4 top-14 mt-2 w-[360px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden z-[200] flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Centre d&apos;Alertes</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-bold">
                      {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleMarkAllRead}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-emerald-400 transition-colors"
                    title="Tout marquer comme lu"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-red-400 transition-colors"
                    title="Tout supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-blue-400 transition-colors relative"
                    title="Paramètres"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Priority summary bar — hidden in settings mode */}
              {!showSettings && <div className="flex items-center gap-1.5 mb-3">
                {priorityOrder.map(p => {
                  const count = unreadByPriority[p];
                  const config = priorityConfig[p];
                  return (
                    <button
                      key={p}
                      onClick={() => setActiveFilter(activeFilter === p ? 'all' : p)}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        activeFilter === p
                          ? `${config.bg} ${config.color} ${config.border} border`
                          : count > 0
                            ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            : 'bg-slate-800/50 text-slate-600'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {config.label}
                      {count > 0 && <span className="ml-0.5">({count})</span>}
                    </button>
                  );
                })}
              </div>}

              {/* Filter row — hidden in settings mode */}
              {!showSettings && <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                  className={`text-xs flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
                    showUnreadOnly ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Filter className="w-3 h-3" />
                  {showUnreadOnly ? 'Non lus uniquement' : 'Toutes les alertes'}
                </button>
                <span className="text-[10px] text-slate-600">{filtered.length} alerte{filtered.length > 1 ? 's' : ''}</span>
              </div>}

            </div>

            {/* Alerts list OR Settings */}
            <AnimatePresence mode="wait">
              {showSettings ? (
                <AlertSettingsPanel key="settings" onClose={() => setShowSettings(false)} />
              ) : (
                <motion.div
                  key="alerts-list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0"
                >
                  <AnimatePresence mode="popLayout">
                    {filtered.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-10"
                      >
                        <Bell className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">Aucune alerte</p>
                        <p className="text-xs text-slate-600 mt-1">Les alertes apparaîtront ici automatiquement</p>
                      </motion.div>
                    ) : (
                      filtered.map(alert => (
                        <AlertCard
                          key={alert.id}
                          alert={alert}
                          onRead={handleRead}
                          onDelete={handleDelete}
                          onNavigate={(a) => navigateToAlert(a, () => setIsOpen(false))}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <div className="p-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-600">
                Raccourci: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">A</kbd>
              </span>
              <button
                onClick={() => {
                  createAlert(
                    'Test — Système opérationnel',
                    'Le système d\'alertes fonctionne correctement.',
                    'medium',
                    'system'
                  );
                  refreshAlerts();
                }}
                className="text-[10px] text-slate-500 hover:text-blue-400 flex items-center gap-1 transition-colors"
              >
                <Zap className="w-3 h-3" /> Tester
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Floating Alert Toast ─────────────────────────────────
// Shows the most recent critical/high alert as a floating toast
// CLICKABLE — navigates to the relevant module on click

export function AlertToast() {
  const [latestAlert, setLatestAlert] = useState<Alert | null>(null);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  const navigateToAlert = useCallback((alert: Alert) => {
    if (!alert.route) return;
    storeAlertContext(alert.route);
    markAlertAsRead(alert.id);
    navigate(alert.route.path);
  }, [navigate]);

  useEffect(() => {
    const unsub = subscribeToAlerts({
      onNewAlert: (alert: Alert) => {
        if (alert.priority === 'critical' || alert.priority === 'high') {
          setLatestAlert(alert);
          setVisible(true);
          const delay = alert.priority === 'critical' ? 15000 : 8000;
          setTimeout(() => setVisible(false), delay);
        }
      },
    });
    return unsub;
  }, []);

  if (!visible || !latestAlert) return null;

  const config = priorityConfig[latestAlert.priority];
  const isClickable = !!latestAlert.route;

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className={`fixed bottom-6 right-6 z-[210] max-w-sm w-full ${config.bg} ${config.border} border rounded-2xl p-4 shadow-2xl backdrop-blur-xl ${
        isClickable ? 'cursor-pointer hover:ring-2 hover:ring-blue-500/50 transition-all' : ''
      }`}
      onClick={() => {
        if (isClickable) {
          setVisible(false);
          navigateToAlert(latestAlert);
        }
      }}
      title={isClickable ? `Cliquez pour ${latestAlert.actionLabel || 'ouvrir'}` : undefined}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center flex-shrink-0`}>
          {latestAlert.priority === 'critical' ? <AlertTriangle className="w-5 h-5 text-red-400" /> : <Zap className="w-5 h-5 text-orange-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <PriorityBadge priority={latestAlert.priority} size="sm" />
            <span className="text-[10px] text-slate-500">{categoryLabels[latestAlert.category]}</span>
            {isClickable && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 font-bold">
                <MousePointerClick className="w-2.5 h-2.5" /> CLIQUER
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-white mb-1">{latestAlert.title}</h4>
          <p className="text-xs text-slate-400 line-clamp-2">{latestAlert.message}</p>
          {isClickable && (
            <span className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold ${config.color}`}>
              <ExternalLink className="w-3 h-3" />
              {latestAlert.actionLabel || 'Voir'} — {latestAlert.route?.path}
            </span>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setVisible(false); markAlertAsRead(latestAlert.id); }}
          className="p-1 rounded-lg hover:bg-slate-800/50 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>
      {/* Progress bar */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: latestAlert.priority === 'critical' ? 15 : 8, ease: 'linear' }}
        className={`h-0.5 rounded-full mt-3 ${latestAlert.priority === 'critical' ? 'bg-red-500/50' : 'bg-orange-500/50'}`}
      />
    </motion.div>
  );
}

// ─── Compact Alert Badge for Nav ──────────────────────────

export function AlertBadge({ className = '' }: { className?: string }) {
  const [count, setCount] = useState(getUnreadCount());
  const [prio, setPrio] = useState(getUnreadByPriority());

  useEffect(() => {
    const unsub = subscribeToAlerts({
      onNewAlert: () => { setCount(getUnreadCount()); setPrio(getUnreadByPriority()); },
      onAlertRead: () => { setCount(getUnreadCount()); setPrio(getUnreadByPriority()); },
    });
    return unsub;
  }, []);

  if (count === 0) return null;

  const hasCritical = prio.critical > 0;
  const hasHigh = prio.high > 0;

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
      hasCritical ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
      hasHigh ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
    } ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${hasCritical ? 'bg-red-400 animate-pulse' : hasHigh ? 'bg-orange-400' : 'bg-amber-400'}`} />
      {count}
    </span>
  );
}
