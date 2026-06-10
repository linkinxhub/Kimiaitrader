import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import {
  Shield, AlertTriangle, Check, Bell, Mail, Phone,
  Lock, Timer, ShieldCheck, ShieldAlert,
  Save, RotateCcw, ArrowLeft
} from 'lucide-react';
import {
  getSecuritySettings,
  saveSecuritySettings,
  getIntrusionAlerts,
  resolveAlert,
  resolveAllAlerts,
  resetAttempts,
  requestNotificationPermission,
  type SecuritySettings,
  type IntrusionAlert,
  formatLockoutTime,
} from '@/services/pinSecurityService';

export default function AdminSettings() {
  const navigate = useNavigate();
  const { isAuthenticated, user, isAdmin } = useAuth();
  const [settings, setSettings] = useState<SecuritySettings>(getSecuritySettings());
  const [alerts, setAlerts] = useState<IntrusionAlert[]>([]);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadAlerts();
    requestNotificationPermission();
  }, [isAuthenticated, isAdmin, navigate]);

  const loadAlerts = () => {
    setAlerts(getIntrusionAlerts());
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};

    if (settings.alertEmail && !settings.alertEmail.includes('@')) {
      newErrors.email = "Email invalide";
    }
    if (settings.alertPhone && !/^\+?[0-9]{8,15}$/.test(settings.alertPhone.replace(/\s/g, ''))) {
      newErrors.phone = "Numéro de téléphone invalide";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    saveSecuritySettings(settings);
    setErrors({});
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleResolveAlert = (id: string) => {
    resolveAlert(id);
    loadAlerts();
  };

  const handleResolveAll = () => {
    resolveAllAlerts();
    loadAlerts();
  };

  const handleResetLockout = () => {
    resetAttempts();
    loadAlerts();
  };

  if (!isAuthenticated || !isAdmin) return null;

  const unresolvedCount = alerts.filter((a) => !a.resolved).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> Retour au Admin Panel
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Paramètres de Sécurité</h1>
              <p className="text-xs text-slate-400">Configuration de l'accès Super Admin et alertes d'intrusion</p>
            </div>
          </div>
        </div>

        {/* ─── Security Status Card ─────────────────────── */}
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">État de la sécurité</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-xl bg-slate-900/50">
              <p className="text-[10px] text-slate-500">Tentatives max</p>
              <p className="text-lg font-bold text-white">{settings.maxAttempts}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/50">
              <p className="text-[10px] text-slate-500">Durée blocage</p>
              <p className="text-lg font-bold text-white">{settings.lockoutDurationMinutes} min</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/50">
              <p className="text-[10px] text-slate-500">Notifications</p>
              <p className="text-lg font-bold text-emerald-400">{settings.notificationsEnabled ? 'ON' : 'OFF'}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/50">
              <p className="text-[10px] text-slate-500">Alertes actives</p>
              <p className="text-lg font-bold text-red-400">{unresolvedCount}</p>
            </div>
          </div>
        </div>

        {/* ─── Notification Settings ────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-5 rounded-2xl bg-slate-900/40 border border-slate-800"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Bell className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Alertes de notification</h2>
              <p className="text-[11px] text-slate-500">En cas de 3 tentatives échouées, une alerte sera envoyée</p>
            </div>
          </div>

          {/* Enable notifications */}
          <div className="mb-4 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-300">Activer les notifications</span>
            </div>
            <button
              onClick={() => setSettings({ ...settings, notificationsEnabled: !settings.notificationsEnabled })}
              className={`w-11 h-6 rounded-full transition-all ${
                settings.notificationsEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.notificationsEnabled ? 'translate-x-5.5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="text-xs text-slate-500 mb-1.5 block flex items-center gap-1.5">
              <Mail className="w-3 h-3" /> Email d'alerte
            </label>
            <input
              type="email"
              value={settings.alertEmail}
              onChange={(e) => setSettings({ ...settings, alertEmail: e.target.value })}
              placeholder="admin@entreprise.com"
              className={`w-full px-4 py-3 rounded-xl bg-slate-800/60 border ${
                errors.email ? 'border-red-500/50' : 'border-slate-700'
              } text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-all`}
            />
            {errors.email && <p className="mt-1 text-[10px] text-red-400">{errors.email}</p>}
            <p className="mt-1 text-[10px] text-slate-600">L'adresse email qui recevra les alertes d'intrusion</p>
          </div>

          {/* Phone */}
          <div className="mb-4">
            <label className="text-xs text-slate-500 mb-1.5 block flex items-center gap-1.5">
              <Phone className="w-3 h-3" /> Téléphone d'alerte (optionnel)
            </label>
            <input
              type="tel"
              value={settings.alertPhone}
              onChange={(e) => setSettings({ ...settings, alertPhone: e.target.value })}
              placeholder="+33 6 12 34 56 78"
              className={`w-full px-4 py-3 rounded-xl bg-slate-800/60 border ${
                errors.phone ? 'border-red-500/50' : 'border-slate-700'
              } text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-all`}
            />
            {errors.phone && <p className="mt-1 text-[10px] text-red-400">{errors.phone}</p>}
            <p className="mt-1 text-[10px] text-slate-600">Format international recommandé (+33...)</p>
          </div>

          {/* Save button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-sm hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Enregistrer les paramètres
            </button>
            {saved && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Sauvegardé
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* ─── PIN Policy ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 p-5 rounded-2xl bg-slate-900/40 border border-slate-800"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Lock className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Politique d'accès PIN</h2>
              <p className="text-[11px] text-slate-500">Configuration du code PIN et du verrouillage</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-3 rounded-xl bg-slate-800/40">
              <p className="text-[10px] text-slate-500 mb-1">Tentatives avant blocage</p>
              <select
                value={settings.maxAttempts}
                onChange={(e) => setSettings({ ...settings, maxAttempts: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n} tentative{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40">
              <p className="text-[10px] text-slate-500 mb-1">Durée du blocage (minutes)</p>
              <select
                value={settings.lockoutDurationMinutes}
                onChange={(e) => setSettings({ ...settings, lockoutDurationMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm"
              >
                {[5, 10, 15, 30, 60].map((n) => (
                  <option key={n} value={n}>{n} minutes</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-purple-400 font-medium">Code PIN actuel</p>
                <p className="text-[11px] text-slate-500">Le code PIN est défini dans le système. Pour le modifier, contactez le développeur.</p>
                <p className="text-[10px] text-slate-600 mt-1">Format : 6 chiffres • Actuel : ••••••</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── Reset Lockout ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 p-5 rounded-2xl bg-slate-900/40 border border-slate-800"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Timer className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Déverrouillage manuel</h2>
              <p className="text-[11px] text-slate-500">Réinitialiser le compteur de tentatives et le blocage</p>
            </div>
          </div>
          <button
            onClick={handleResetLockout}
            className="w-full py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser le verrouillage PIN
          </button>
        </motion.div>

        {/* ─── Intrusion Alerts ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Journal d'intrusion</h2>
                <p className="text-[11px] text-slate-500">Historique des tentatives échouées d'accès Admin</p>
              </div>
            </div>
            {unresolvedCount > 0 && (
              <button
                onClick={handleResolveAll}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-colors"
              >
                Tout résoudre
              </button>
            )}
          </div>

          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Aucune alerte d'intrusion</p>
              <p className="text-[11px] text-slate-600 mt-1">Le système est sécurisé</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              <AnimatePresence>
                {alerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className={`p-3 rounded-xl border ${
                      alert.resolved
                        ? 'bg-slate-800/30 border-slate-700/30'
                        : 'bg-red-500/5 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        {alert.resolved ? (
                          <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        ) : (
                          <ShieldAlert className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        )}
                        <div>
                          <p className={`text-xs ${alert.resolved ? 'text-slate-500' : 'text-white'}`}>
                            Tentative échouée • PIN saisi : <span className="font-mono">{alert.pinAttempted}</span>
                          </p>
                          <p className="text-[10px] text-slate-600 mt-0.5">
                            {new Date(alert.timestamp).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      {!alert.resolved && (
                        <button
                          onClick={() => handleResolveAlert(alert.id)}
                          className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] hover:bg-emerald-500/20 transition-colors"
                        >
                          Résoudre
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
  );
}
