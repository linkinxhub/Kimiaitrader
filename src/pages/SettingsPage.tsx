/**
 * SettingsPage — Paramètres complets et opérationnels
 * Tous les réglages sont persistés dans localStorage et connectés au système
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Bell, Eye, Gauge, User, Moon, Sun, Volume2, VolumeX,
  Smartphone, Mail, MessageCircle, Shield, Clock, Globe, Palette,
  Sliders, Radio, Zap, AlertTriangle, Check, Trash2, Download,
  Upload, RefreshCw, ChevronRight, Headphones, Vibrate, BellOff,
  Monitor, Type, CircleDollarSign, Timer, Save, Info,
  Play, Square, AlertOctagon, Megaphone, Sparkles,
  Database, LogOut, TrendingUp, Filter,
} from 'lucide-react';
import { ParametresGuide } from '@/components/FeatureGuide';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import {
  getAlertSettings,
  saveAlertSettings,
  playTestSound,
  requestNotificationPermission,
  clearAllAlerts,
  type AlertSettings,
  type AlertPriority,
  type SoundType,
  priorityConfig,
} from '@/services/alertService';

// ─── Types ────────────────────────────────────────────────

interface AppSettings {
  language: 'fr' | 'en';
  currency: 'EUR' | 'USD' | 'GBP';
  defaultRiskPercent: number;
  compactMode: boolean;
  showConfirmDialogs: boolean;
  dataRefreshRate: number;
}

const DEFAULT_APP_SETTINGS: AppSettings = {
  language: 'fr',
  currency: 'EUR',
  defaultRiskPercent: 1,
  compactMode: false,
  showConfirmDialogs: true,
  dataRefreshRate: 5,
};

const APP_SETTINGS_KEY = 'xtrendai_app_settings';

// ─── Sound type options ───────────────────────────────────

const soundTypeOptions: { value: SoundType; label: string; icon: React.ElementType }[] = [
  { value: 'pulse', label: 'Pulse (Urgent)', icon: AlertOctagon },
  { value: 'sweep', label: 'Sweep (Montant)', icon: Zap },
  { value: 'ding', label: 'Ding (Net)', icon: Bell },
  { value: 'chime', label: 'Chime (Doux)', icon: Sparkles },
  { value: 'none', label: 'Silencieux', icon: BellOff },
];

const priorityOrder: AlertPriority[] = ['critical', 'high', 'medium', 'low'];

// ─── Helpers ──────────────────────────────────────────────

function loadAppSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(APP_SETTINGS_KEY);
    return stored ? { ...DEFAULT_APP_SETTINGS, ...JSON.parse(stored) } : DEFAULT_APP_SETTINGS;
  } catch { return DEFAULT_APP_SETTINGS; }
}

function saveAppSettings(settings: AppSettings) {
  localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
}

// ─── Components ───────────────────────────────────────────

function Toggle({ enabled, onToggle, disabled = false }: { enabled: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={disabled ? undefined : onToggle}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      } ${enabled ? 'bg-blue-500 shadow-lg shadow-blue-500/30' : 'bg-slate-700'}`}
    >
      <motion.div
        animate={{ x: enabled ? 24 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
      />
    </button>
  );
}

function Section({ title, icon: Icon, children, delay = 0 }: { title: string; icon: React.ElementType; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-slate-800/60 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
          <Icon className="w-4 h-4 text-blue-400" />
        </div>
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h2>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </motion.div>
  );
}

function SettingRow({ icon: Icon, iconColor = 'text-slate-400', label, description, children, className = '' }: {
  icon: React.ElementType; iconColor?: string; label: string; description?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{label}</p>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// ─── Volume Slider ────────────────────────────────────────

function VolumeSlider({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${disabled ? 'opacity-40' : ''}`}>
      <VolumeX className="w-4 h-4 text-slate-500" />
      <input
        type="range"
        min="0"
        max="100"
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        disabled={disabled}
        className="w-24 h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-lg"
      />
      <Volume2 className="w-4 h-4 text-slate-400" />
      <span className="text-xs text-slate-400 font-mono w-8 text-right">{Math.round(value * 100)}%</span>
    </div>
  );
}

// ─── Sound Selector ───────────────────────────────────────

function SoundSelector({ value, onChange, disabled }: { value: SoundType; onChange: (v: SoundType) => void; disabled: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      {soundTypeOptions.map(opt => {
        const OptIcon = opt.icon;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            title={opt.label}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
              value === opt.value
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300 border border-transparent'
            }`}
          >
            <OptIcon className="w-3 h-3" />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
      <button
        onClick={() => playTestSound(value === 'none' ? 'medium' : value)}
        disabled={disabled || value === 'none'}
        className="ml-1 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Tester le son"
      >
        <Play className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Time Input ───────────────────────────────────────────

function TimeInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled: boolean }) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white font-mono focus:outline-none focus:border-blue-500 disabled:opacity-40"
    />
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // Alert settings from service
  const [alertSettings, setAlertSettings] = useState<AlertSettings>(getAlertSettings);
  const [appSettings, setAppSettings] = useState<AppSettings>(loadAppSettings);
  const [notifPermission, setNotifPermission] = useState<string>('default');
  const [activeTab, setActiveTab] = useState<'alerts' | 'display' | 'account' | 'trading'>('alerts');
  const [saveIndicator, setSaveIndicator] = useState(false);

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  // Show save indicator briefly when settings change
  const showSaved = useCallback(() => {
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 1500);
  }, []);

  // Update alert settings
  const updateAlert = useCallback((partial: Partial<AlertSettings>) => {
    setAlertSettings(prev => {
      const next = { ...prev, ...partial };
      saveAlertSettings(next);
      return next;
    });
    showSaved();
  }, [showSaved]);

  // Update app settings
  const updateApp = useCallback((partial: Partial<AppSettings>) => {
    setAppSettings(prev => {
      const next = { ...prev, ...partial };
      saveAppSettings(next);
      return next;
    });
    showSaved();
  }, [showSaved]);

  // Request desktop notification permission
  const handleRequestNotif = async () => {
    const granted = await requestNotificationPermission();
    setNotifPermission(granted ? 'granted' : 'denied');
    if (granted) {
      updateAlert({ desktopNotifications: true });
    }
  };

  // Clear all alerts
  const handleClearAlerts = () => {
    if (appSettings.showConfirmDialogs) {
      if (!window.confirm('Supprimer toutes les alertes ? Cette action est irréversible.')) return;
    }
    clearAllAlerts();
    showSaved();
  };

  // Export settings
  const handleExport = () => {
    const data = {
      alertSettings,
      appSettings,
      exportDate: new Date().toISOString(),
      version: '2.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xtrendai-settings-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showSaved();
  };

  // Import settings
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.alertSettings) {
          setAlertSettings(data.alertSettings);
          saveAlertSettings(data.alertSettings);
        }
        if (data.appSettings) {
          setAppSettings(data.appSettings);
          saveAppSettings(data.appSettings);
        }
        showSaved();
      } catch {
        alert('Fichier de configuration invalide');
      }
    };
    reader.readAsText(file);
  };

  // Reset all settings
  const handleReset = () => {
    if (!window.confirm('Réinitialiser TOUS les paramètres aux valeurs par défaut ?')) return;
    const defaultAlert = getAlertSettings();
    setAlertSettings(defaultAlert);
    saveAlertSettings(defaultAlert);
    setAppSettings(DEFAULT_APP_SETTINGS);
    saveAppSettings(DEFAULT_APP_SETTINGS);
    showSaved();
  };

  // ─── Tabs ───────────────────────────────────────────────

  const tabs = [
    { id: 'alerts' as const, label: 'Alertes & Son', icon: Bell },
    { id: 'display' as const, label: 'Affichage', icon: Palette },
    { id: 'trading' as const, label: 'Trading', icon: Sliders },
    { id: 'account' as const, label: 'Compte', icon: User },
  ];

  // ─── Render ─────────────────────────────────────────────

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <ParametresGuide />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Paramètres</h1>
            <p className="text-xs text-slate-400">Personnalisez votre expérience XTrendAI Pro</p>
          </div>
        </div>

        {/* Save indicator */}
        <AnimatePresence>
          {saveIndicator && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold"
            >
              <Check className="w-3.5 h-3.5" /> Sauvegardé
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 overflow-x-auto pb-1">
        {tabs.map(tab => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </motion.div>

      {/* ═══ TAB: ALERTES & SON ═══ */}
      <AnimatePresence mode="wait">
        {activeTab === 'alerts' && (
          <motion.div
            key="alerts"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Son principal */}
            <Section title="Alertes Sonores" icon={Headphones} delay={0}>
              <SettingRow
                icon={alertSettings.soundEnabled ? Volume2 : VolumeX}
                iconColor={alertSettings.soundEnabled ? 'text-emerald-400' : 'text-slate-500'}
                label="Son d'alerte"
                description="Émet un son lorsqu'une alerte est reçue"
              >
                <Toggle enabled={alertSettings.soundEnabled} onToggle={() => updateAlert({ soundEnabled: !alertSettings.soundEnabled })} />
              </SettingRow>

              <SettingRow
                icon={Volume2}
                iconColor="text-blue-400"
                label="Volume"
                description="Intensité du son d'alerte"
              >
                <VolumeSlider
                  value={alertSettings.soundVolume}
                  onChange={(v) => updateAlert({ soundVolume: v })}
                  disabled={!alertSettings.soundEnabled}
                />
              </SettingRow>

              <SettingRow
                icon={Vibrate}
                iconColor="text-purple-400"
                label="Vibration"
                description="Vibrer sur mobile lors des alertes"
              >
                <Toggle enabled={alertSettings.vibrationEnabled} onToggle={() => updateAlert({ vibrationEnabled: !alertSettings.vibrationEnabled })} />
              </SettingRow>

              <div className="border-t border-slate-800/60 pt-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Type de son par priorité</p>
                <div className="space-y-3">
                  {priorityOrder.map(p => {
                    const config = priorityConfig[p];
                    return (
                      <div key={p} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${p === 'critical' ? 'bg-red-400' : p === 'high' ? 'bg-orange-400' : p === 'medium' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                          <span className="text-sm text-white font-medium">{config.label}</span>
                        </div>
                        <SoundSelector
                          value={alertSettings.soundsByPriority[p]}
                          onChange={(sound) =>
                            updateAlert({
                              soundsByPriority: { ...alertSettings.soundsByPriority, [p]: sound },
                            })
                          }
                          disabled={!alertSettings.soundEnabled}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </Section>

            {/* Ne Pas Déranger */}
            <Section title="Ne Pas Déranger" icon={BellOff} delay={0.1}>
              <SettingRow
                icon={Moon}
                iconColor="text-indigo-400"
                label="Mode Ne Pas Déranger"
                description="Désactive les sons et notifications pendant une plage horaire"
              >
                <Toggle enabled={alertSettings.doNotDisturb} onToggle={() => updateAlert({ doNotDisturb: !alertSettings.doNotDisturb })} />
              </SettingRow>

              {alertSettings.doNotDisturb && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="flex items-center gap-4 pl-8">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">De</span>
                    <TimeInput value={alertSettings.doNotDisturbStart} onChange={(v) => updateAlert({ doNotDisturbStart: v })} disabled={false} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">À</span>
                    <TimeInput value={alertSettings.doNotDisturbEnd} onChange={(v) => updateAlert({ doNotDisturbEnd: v })} disabled={false} />
                  </div>
                </motion.div>
              )}
            </Section>

            {/* Notifications Bureau */}
            <Section title="Notifications Bureau" icon={Monitor} delay={0.15}>
              <SettingRow
                icon={Monitor}
                iconColor="text-blue-400"
                label="Notifications Desktop"
                description="Afficher des notifications système pour les alertes"
              >
                <div className="flex items-center gap-2">
                  {notifPermission === 'denied' && (
                    <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-1 rounded-full">Bloqué</span>
                  )}
                  <Toggle
                    enabled={alertSettings.desktopNotifications && notifPermission === 'granted'}
                    onToggle={() => {
                      if (notifPermission !== 'granted') {
                        handleRequestNotif();
                      } else {
                        updateAlert({ desktopNotifications: !alertSettings.desktopNotifications });
                      }
                    }}
                    disabled={notifPermission === 'denied'}
                  />
                </div>
              </SettingRow>

              {notifPermission === 'default' && (
                <button
                  onClick={handleRequestNotif}
                  className="w-full mt-2 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors"
                >
                  Autoriser les notifications du navigateur
                </button>
              )}

              <SettingRow
                icon={Megaphone}
                iconColor="text-amber-400"
                label="Toast flottant"
                description="Afficher un toast pour les alertes critiques/hautes"
              >
                <Toggle enabled={alertSettings.toastEnabled} onToggle={() => updateAlert({ toastEnabled: !alertSettings.toastEnabled })} />
              </SettingRow>
            </Section>

            {/* Priorité minimale */}
            <Section title="Filtrage des Alertes" icon={Filter} delay={0.2}>
              <SettingRow
                icon={AlertTriangle}
                iconColor="text-red-400"
                label="Priorité minimale"
                description="N'afficher que les alertes à partir de ce niveau"
              >
                <div className="flex items-center gap-1">
                  {priorityOrder.map(p => (
                    <button
                      key={p}
                      onClick={() => updateAlert({ minPriority: p })}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        alertSettings.minPriority === p
                          ? `${priorityConfig[p].bg} ${priorityConfig[p].color} ${priorityConfig[p].border} border`
                          : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                      }`}
                    >
                      {priorityConfig[p].label}
                    </button>
                  ))}
                </div>
              </SettingRow>

              <SettingRow
                icon={Check}
                iconColor="text-slate-400"
                label="Marquage auto lu"
                description="Marquer les alertes comme lues après un délai"
              >
                <div className="flex items-center gap-2">
                  <Toggle enabled={alertSettings.autoMarkRead} onToggle={() => updateAlert({ autoMarkRead: !alertSettings.autoMarkRead })} />
                  {alertSettings.autoMarkRead && (
                    <select
                      value={alertSettings.autoMarkReadDelay}
                      onChange={(e) => updateAlert({ autoMarkReadDelay: Number(e.target.value) })}
                      className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                    >
                      <option value={10}>10s</option>
                      <option value={30}>30s</option>
                      <option value={60}>1m</option>
                      <option value={300}>5m</option>
                    </select>
                  )}
                </div>
              </SettingRow>
            </Section>

            {/* Actions */}
            <Section title="Actions" icon={RefreshCw} delay={0.25}>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleClearAlerts}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Supprimer toutes les alertes
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
                >
                  <Download className="w-4 h-4" /> Exporter
                </button>
                <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" /> Importer
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-sm hover:bg-slate-700 hover:text-red-400 transition-colors ml-auto"
                >
                  <RefreshCw className="w-4 h-4" /> Réinitialiser
                </button>
              </div>
            </Section>
          </motion.div>
        )}

        {/* ═══ TAB: AFFICHAGE ═══ */}
        {activeTab === 'display' && (
          <motion.div
            key="display"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Section title="Thème" icon={Palette} delay={0}>
              <SettingRow
                icon={isDark ? Moon : Sun}
                iconColor={isDark ? 'text-blue-400' : 'text-amber-400'}
                label={isDark ? 'Mode Sombre' : 'Mode Clair'}
                description="Basculer entre le thème sombre et clair"
              >
                <Toggle enabled={isDark} onToggle={toggleTheme} />
              </SettingRow>
            </Section>

            <Section title="Langue & Région" icon={Globe} delay={0.1}>
              <SettingRow
                icon={Globe}
                iconColor="text-green-400"
                label="Langue"
                description="Langue de l'interface"
              >
                <select
                  value={appSettings.language}
                  onChange={(e) => updateApp({ language: e.target.value as 'fr' | 'en' })}
                  className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </SettingRow>

              <SettingRow
                icon={CircleDollarSign}
                iconColor="text-emerald-400"
                label="Devise"
                description="Devise d'affichage des montants"
              >
                <select
                  value={appSettings.currency}
                  onChange={(e) => updateApp({ currency: e.target.value as 'EUR' | 'USD' | 'GBP' })}
                  className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </SettingRow>
            </Section>

            <Section title="Interface" icon={Eye} delay={0.15}>
              <SettingRow
                icon={Type}
                iconColor="text-purple-400"
                label="Mode compact"
                description="Réduire l'espacement pour plus d'informations"
              >
                <Toggle enabled={appSettings.compactMode} onToggle={() => updateApp({ compactMode: !appSettings.compactMode })} />
              </SettingRow>

              <SettingRow
                icon={Shield}
                iconColor="text-amber-400"
                label="Dialogues de confirmation"
                description="Demander confirmation avant les actions importantes"
              >
                <Toggle enabled={appSettings.showConfirmDialogs} onToggle={() => updateApp({ showConfirmDialogs: !appSettings.showConfirmDialogs })} />
              </SettingRow>
            </Section>

            <Section title="Rafraîchissement" icon={Timer} delay={0.2}>
              <SettingRow
                icon={Radio}
                iconColor="text-cyan-400"
                label="Intervalle de rafraîchissement"
                description="Fréquence de mise à jour des données marché"
              >
                <select
                  value={appSettings.dataRefreshRate}
                  onChange={(e) => updateApp({ dataRefreshRate: Number(e.target.value) })}
                  className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value={1}>1s (Direct)</option>
                  <option value={3}>3s (Rapide)</option>
                  <option value={5}>5s (Normal)</option>
                  <option value={10}>10s (Économique)</option>
                  <option value={30}>30s (Lent)</option>
                </select>
              </SettingRow>
            </Section>
          </motion.div>
        )}

        {/* ═══ TAB: TRADING ═══ */}
        {activeTab === 'trading' && (
          <motion.div
            key="trading"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Section title="Gestion du Risque" icon={Shield} delay={0}>
              <SettingRow
                icon={Gauge}
                iconColor="text-red-400"
                label="Risque par défaut"
                description="Pourcentage de risque par trade par défaut"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={appSettings.defaultRiskPercent}
                    onChange={(e) => updateApp({ defaultRiskPercent: Number(e.target.value) })}
                    className="w-24 h-1.5 bg-slate-700 rounded-full appearance-none accent-blue-500"
                  />
                  <span className="text-sm text-white font-mono w-12 text-right">{appSettings.defaultRiskPercent}%</span>
                </div>
              </SettingRow>
            </Section>

            <Section title="Préférences de Signaux" icon={Radio} delay={0.1}>
              {(['signal', 'price', 'system', 'scanner', 'trade'] as const).map((cat, i) => {
                const catLabels: Record<string, { label: string; desc: string; icon: React.ElementType; color: string }> = {
                  signal: { label: 'Signaux IA', desc: 'Alertes sur les signaux de trading', icon: Zap, color: 'text-emerald-400' },
                  price: { label: 'Prix', desc: 'Alertes de prix personnalisées', icon: CircleDollarSign, color: 'text-amber-400' },
                  system: { label: 'Système', desc: 'Mises à jour et maintenance', icon: Settings, color: 'text-slate-400' },
                  scanner: { label: 'Scanner', desc: 'Opportunités détectées', icon: Radio, color: 'text-purple-400' },
                  trade: { label: 'Trades', desc: 'Exécutions et résultats', icon: TrendingUp, color: 'text-blue-400' },
                };
                const c = catLabels[cat];
                const CatIcon = c.icon;
                return (
                  <SettingRow
                    key={cat}
                    icon={CatIcon}
                    iconColor={c.color}
                    label={c.label}
                    description={c.desc}
                  >
                    <Toggle
                      enabled={alertSettings.categories.includes(cat)}
                      onToggle={() => {
                        const cats = alertSettings.categories.includes(cat)
                          ? alertSettings.categories.filter(x => x !== cat)
                          : [...alertSettings.categories, cat];
                        updateAlert({ categories: cats });
                      }}
                    />
                  </SettingRow>
                );
              })}
            </Section>
          </motion.div>
        )}

        {/* ═══ TAB: COMPTE ═══ */}
        {activeTab === 'account' && (
          <motion.div
            key="account"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Section title="Profil" icon={User} delay={0}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-xl font-bold text-white">
                  {user?.name?.slice(0, 2).toUpperCase() || 'TR'}
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{user?.name || 'Trader Pro'}</p>
                  <p className="text-sm text-slate-400">{user?.email || 'trader@xtrendai.com'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 font-bold uppercase">
                      {user?.pack || 'Free'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold">
                      {user?.role === 'admin' ? 'Admin' : 'Membre'}
                    </span>
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Stockage" icon={Database} delay={0.1}>
              <SettingRow
                icon={Info}
                iconColor="text-blue-400"
                label="Données locales"
                description="Alertes, paramètres et historique stockés dans le navigateur"
              >
                <button
                  onClick={() => {
                    const used = Object.values(localStorage).join('').length;
                    const total = 5 * 1024 * 1024;
                    const pct = ((used / total) * 100).toFixed(1);
                    alert(`Stockage utilisé: ${(used / 1024).toFixed(1)} KB / ${(total / 1024 / 1024).toFixed(0)} MB (${pct}%)`);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs hover:bg-slate-700 transition-colors"
                >
                  Vérifier
                </button>
              </SettingRow>
            </Section>

            <Section title="Session" icon={Shield} delay={0.15}>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Se déconnecter
              </button>
            </Section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── End of imports ──────────────────────────────────────
