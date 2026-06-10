import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import { useUpdates } from '@/hooks/useUpdates';
import { categoryLabels, severityConfig } from '@/services/updateService';
import {
  Sparkles, ArrowLeft, Pin, Wifi, Check, Calendar,
  TrendingUp, Zap, Clock, BarChart3
} from 'lucide-react';

const categoryIcons: Record<string, string> = {
  feature: '✨', improvement: '⬆️', fix: '🔧', announcement: '📢', data: '📊',
};

export default function Updates() {
  const navigate = useNavigate();
  const { updates, pinned, recent, hasUnread, unreadCount, markAsSeen } = useUpdates();

  // Mark as seen on mount
  useMemo(() => { if (hasUnread) markAsSeen(); }, []);

  // Real counts
  const featureCount = updates.filter(u => u.category === 'feature').length;
  const improvementCount = updates.filter(u => u.category === 'improvement').length;
  const fixCount = updates.filter(u => u.category === 'fix').length;
  const announcementCount = updates.filter(u => u.category === 'announcement').length;
  const totalActive = updates.length;
  const pinnedCount = pinned.length;

  // Count by severity
  const criticalCount = updates.filter(u => u.severity === 'critical').length;
  const majorCount = updates.filter(u => u.severity === 'major').length;

  // Recent (last 7 days)
  const now = new Date();
  const last7Days = updates.filter(u => {
    const d = new Date(u.publishedAt);
    return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
  });

  // Group by month
  const byMonth = useMemo(() => {
    const groups: Record<string, typeof updates> = {};
    updates.forEach(u => {
      const key = new Date(u.publishedAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(u);
    });
    return groups;
  }, [updates]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white">Nouveautés</h1>
              <p className="text-xs text-slate-500">Changelog & mises à jour</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasUnread && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400 font-bold">
                <Wifi className="w-3 h-3" /> {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
              </span>
            )}
            <button onClick={markAsSeen} className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1">
              <Check className="w-3 h-3" /> Tout lu
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Hero Stats — REAL COUNTS */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">{totalActive}</span> fonctionnalités actives
            </h2>
            <p className="text-sm text-slate-400">
              {featureCount} nouveautés · {improvementCount} améliorations · {fixCount} corrections
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-2xl">✨</span>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{featureCount}</p>
              <p className="text-xs text-slate-500">Nouveautés</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-2xl">⬆️</span>
              <p className="text-2xl font-bold text-blue-400 mt-1">{improvementCount}</p>
              <p className="text-xs text-slate-500">Améliorations</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-2xl">🔧</span>
              <p className="text-2xl font-bold text-amber-400 mt-1">{fixCount}</p>
              <p className="text-xs text-slate-500">Corrections</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-2xl">📢</span>
              <p className="text-2xl font-bold text-purple-400 mt-1">{announcementCount}</p>
              <p className="text-xs text-slate-500">Annonces</p>
            </div>
          </div>
        </motion.div>

        {/* Severity + Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-semibold text-white">Par sévérité</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Critique</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${(criticalCount/totalActive)*100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-red-400 w-4">{criticalCount}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Majeur</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(majorCount/totalActive)*100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-orange-400 w-4">{majorCount}</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Cette semaine</h3>
            </div>
            <p className="text-3xl font-bold text-blue-400">{last7Days.length}</p>
            <p className="text-xs text-slate-500">mise{last7Days.length > 1 ? 's' : ''} à jour ajoutée{last7Days.length > 1 ? 's' : ''} ces 7 derniers jours</p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Pin className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-white">Épinglées</h3>
            </div>
            <p className="text-3xl font-bold text-purple-400">{pinnedCount}</p>
            <p className="text-xs text-slate-500">mise{pinnedCount > 1 ? 's' : ''} épinglée{pinnedCount > 1 ? 's' : ''} en haut de la page</p>
          </motion.div>
        </div>

        {/* Pinned Updates */}
        {pinned.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Pin className="w-5 h-5 text-purple-400" /> Mises à jour épinglées
            </h3>
            <div className="space-y-3">
              {pinned.map((u, idx) => {
                const cat = categoryLabels[u.category] || categoryLabels.feature;
                return (
                  <motion.div key={u.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                    className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{categoryIcons[u.category] || '✨'}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cat.bg} ${cat.color}`}>{cat.label}</span>
                      <Pin className="w-3 h-3 text-purple-400" />
                    </div>
                    <h4 className="text-base font-semibold text-white mb-1">{u.title}</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">{u.description}</p>
                    {u.featureTag && (
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400">{u.featureTag}</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* All Updates by Month */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Historique complet</h3>
            <span className="text-xs text-slate-500">{updates.length} entrée{updates.length > 1 ? 's' : ''}</span>
          </div>

          {Object.entries(byMonth).map(([month, monthUpdates]) => (
            <div key={month} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-4 h-4 text-slate-500" />
                <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">{month}</h4>
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-xs text-slate-500">{monthUpdates.length}</span>
              </div>

              <div className="space-y-3">
                {monthUpdates.map((u, idx) => {
                  const cat = categoryLabels[u.category] || categoryLabels.feature;
                  const sev = severityConfig[u.severity] || severityConfig.info;
                  const isNew = (now.getTime() - new Date(u.publishedAt).getTime()) < 7 * 24 * 60 * 60 * 1000;

                  return (
                    <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                      className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg flex-shrink-0">
                          {categoryIcons[u.category] || '✨'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cat.bg} ${cat.color}`}>{cat.label}</span>
                            <span className={`text-xs ${sev.color}`}>{sev.label}</span>
                            {isNew && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-bold">
                                <Zap className="w-3 h-3" /> NOUVEAU
                              </span>
                            )}
                            {u.pinned && <Pin className="w-3 h-3 text-purple-400" />}
                          </div>
                          <h5 className="text-sm font-semibold text-white mb-1">{u.title}</h5>
                          <p className="text-xs text-slate-400 leading-relaxed">{u.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-slate-600">
                              {new Date(u.publishedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </span>
                            {u.featureTag && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400">{u.featureTag}</span>
                            )}
                            <span className="text-xs text-slate-600">{u.views} vues</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Empty state */}
        {updates.length === 0 && (
          <div className="text-center py-16">
            <Info className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-sm text-slate-400">Aucune mise à jour pour le moment</p>
            <p className="text-xs text-slate-600 mt-2">Revenez bientôt pour découvrir les nouvelles fonctionnalités</p>
          </div>
        )}
      </div>
    </div>
  );
}
