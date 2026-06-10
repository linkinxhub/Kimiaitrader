/**
 * Update Manager — Module professionnel de mise à jour par importation ZIP
 * Intégré dans l'Admin Panel. Permet : upload ZIP, simulation, backup, rollback.
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';
import {
  FileArchive, Shield, AlertTriangle, CheckCircle, XCircle,
  Play, RotateCcw, Eye, Download, FileText, Clock,
  Settings, Ban, Zap, Lock, History,
  X, Server, FileCode,
  Layers, RefreshCw, Star
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import AdminValueCard from '@/components/AdminValueCard';
import {
  getUpdateSettings, saveUpdateSettings, getUpdateHistory, getCurrentVersion,
  applyUpdate, rollbackUpdate, runAutoTests, runSimulation, analyzeZip,
  generateUpdateReportPDF,
  type UpdateSettings, type UpdateReport, type BackupEntry, type FileChange,
} from '@/services/updateManagerService';

const CAT_COLORS: Record<string, string> = {
  frontend: 'bg-blue-500/10 text-blue-400',
  backend: 'bg-purple-500/10 text-purple-400',
  config: 'bg-amber-500/10 text-amber-400',
  asset: 'bg-emerald-500/10 text-emerald-400',
  api: 'bg-cyan-500/10 text-cyan-400',
  database: 'bg-red-500/10 text-red-400',
  other: 'bg-slate-500/10 text-slate-400',
};

const RISK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  high: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  critical: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
};

export default function UpdateManager() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UpdateSettings>(getUpdateSettings);
  const [history, setHistory] = useState<BackupEntry[]>(getUpdateHistory);
  const [currentVersion] = useState(getCurrentVersion);

  // Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<UpdateReport | null>(null);
  const [simResult, setSimResult] = useState<{ canProceed: boolean; warnings: string[]; protectedFiles: string[] } | null>(null);

  // Apply state
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<{ success: boolean; backupId: string; errors: string[] } | null>(null);
  const [autoTests, setAutoTests] = useState<{ passed: string[]; failed: string[] } | null>(null);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'files' | 'recommendations'>('overview');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Handlers ─────────────────────────────────────────

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.zip')) await processFile(file);
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  }, []);

  const processFile = async (file: File) => {
    setAnalyzing(true);
    setReport(null);
    setSimResult(null);
    setApplyResult(null);
    setAutoTests(null);
    try {
      const { report: r } = await analyzeZip(file);
      setReport(r);
      const sim = runSimulation(r, settings);
      setSimResult(sim);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApply = async () => {
    if (!report) return;
    setApplying(true);
    const result = await applyUpdate(report, settings, user?.email || 'admin');
    setApplyResult(result);
    if (result.success) {
      const tests = runAutoTests();
      setAutoTests(tests);
    }
    setHistory(getUpdateHistory());
    setApplying(false);
  };

  const handleRollback = (backupId: string) => {
    const result = rollbackUpdate(backupId);
    if (result.success) {
      setHistory(getUpdateHistory());
      setApplyResult(null);
      setReport(null);
    }
  };

  const toggleSetting = (key: keyof UpdateSettings) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    saveUpdateSettings(next);
  };

  const formatBytes = (b: number) => b < 1024 ? `${b}B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)}KB` : `${(b / (1024 * 1024)).toFixed(1)}MB`;

  return (
    <div className="space-y-6">
      {/* ─── HEADER ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-400" /> Update Manager
          </h2>
          <p className="text-xs text-slate-400">Version actuelle: {currentVersion} — Mise a jour par importation ZIP</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-400 hover:text-white">
            <History className="w-3.5 h-3.5" /> Historique
          </button>
          <button onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-400 hover:text-white">
            <Settings className="w-3.5 h-3.5" /> Parametres
          </button>
        </div>
      </div>

      <AdminValueCard
        title="Update Manager"
        icon={Server}
        summary="Gestion des mises a jour du projet via importation ZIP avec simulation, sauvegarde et rollback securise."
        userValue="Les utilisateurs beneficient d'une plateforme toujours a jour avec les dernieres fonctionnalites et corrections."
        adminValue="Permet de deployer des mises a jour en toute securite avec simulation prealable et possibilite de rollback."
        modulesConnected={['Toute la plateforme']}
        dataSources={['Fichiers ZIP', 'Manifest', 'Sauvegardes']}
        packs={['Free', 'Pro', 'Expert', 'Institutionnel']}
        recommendedSettings={['Toujours faire une simulation avant', 'Verifier le manifest', 'Conserver une sauvegarde']}
        impactLevel="critique"
        configStatus="complet"
      />

      {/* ─── SECURITY NOTICE ────────────────────────── */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">
        <Lock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-400">
          Ce module permet d'importer une nouvelle version du projet. Les fichiers sensibles (.env, clés API, base de données) sont automatiquement protégés. Toujours faire une simulation avant d'installer.
        </p>
      </div>

      {/* ─── DROP ZONE ──────────────────────────────── */}
      {!report && (
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
            isDragging ? 'border-blue-500 bg-blue-500/5' : 'border-slate-700 hover:border-slate-600'
          }`}
        >
          <input ref={fileInputRef} type="file" accept=".zip" onChange={handleFileSelect} className="hidden" />
          <FileArchive className={`w-12 h-12 mx-auto mb-3 ${isDragging ? 'text-blue-400' : 'text-slate-600'}`} />
          <p className="text-sm font-medium text-white">
            {isDragging ? 'Deposez le fichier ZIP ici' : 'Glissez un fichier ZIP ou cliquez pour importer'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Fichier ZIP avec update-manifest.json recommande</p>
        </div>
      )}

      {/* ─── ANALYZING ──────────────────────────────── */}
      {analyzing && (
        <div className="text-center p-10">
          <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Analyse du package en cours...</p>
          <p className="text-xs text-slate-600">Lecture du manifest, detection des fichiers, analyse des risques</p>
        </div>
      )}

      {/* ─── REPORT ─────────────────────────────────── */}
      {report && !applying && !applyResult && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Risk badge */}
          <div className={`flex items-center justify-between p-4 rounded-xl border ${RISK_COLORS[report.riskLevel].bg} ${RISK_COLORS[report.riskLevel].border}`}>
            <div className="flex items-center gap-3">
              {report.riskLevel === 'low' ? <Shield className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-amber-400" />}
              <div>
                <p className={`text-sm font-bold ${RISK_COLORS[report.riskLevel].text}`}>
                  Risque: {report.riskLevel.toUpperCase()}
                </p>
                <p className="text-xs text-slate-400">
                  {report.filesAnalyzed} fichiers — {report.sensitiveFiles.length} sensibles — {report.conflicts.length} conflits
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Temps estime</p>
              <p className="text-sm font-bold text-white">{report.estimatedTime} min</p>
            </div>
          </div>

          {/* Manifest info */}
          {report.manifest && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" /> Update Manifest
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <InfoItem label="Projet" value={report.manifest.project} />
                <InfoItem label="Version" value={report.manifest.version} />
                <InfoItem label="Type" value={report.manifest.update_type} color="amber" />
                <InfoItem label="Modules" value={String(report.manifest.modules.length)} />
              </div>
              {report.manifest.notes && (
                <p className="text-xs text-slate-400 mt-2 bg-slate-800/40 p-2 rounded-lg">{report.manifest.notes}</p>
              )}
            </div>
          )}

          {/* Simulation warnings */}
          {simResult && simResult.warnings.length > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
                <Eye className="w-4 h-4" /> Resultat Simulation (Dry Run)
              </h4>
              <div className="space-y-1">
                {simResult.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-400 flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" /> {w}
                  </p>
                ))}
              </div>
              {simResult.protectedFiles.length > 0 && (
                <div className="mt-2 pt-2 border-t border-amber-500/20">
                  <p className="text-[10px] text-amber-500 mb-1">Fichiers proteges (seront conserves):</p>
                  <div className="flex flex-wrap gap-1">
                    {simResult.protectedFiles.map(f => (
                      <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">{f}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-800">
            {([['overview', 'Vue d\'ensemble'], ['files', 'Fichiers'], ['recommendations', 'Recommandations']] as const).map(([key, label]) => (
              <button key={key} onClick={() => setSelectedTab(key)}
                className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                  selectedTab === key ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500'
                }`}>
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {selectedTab === 'overview' && <OverviewTab report={report} />}
          {selectedTab === 'files' && <FilesTab report={report} formatBytes={formatBytes} />}
          {selectedTab === 'recommendations' && <RecommendationsTab report={report} />}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button onClick={handleApply}
              disabled={simResult?.canProceed === false}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 font-medium text-sm hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              <Play className="w-4 h-4" /> Appliquer la mise a jour
            </button>
            <button onClick={() => { setReport(null); setSimResult(null); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-slate-400 font-medium text-sm hover:text-white">
              <Ban className="w-4 h-4" /> Annuler
            </button>
            <button onClick={() => {
              const txt = generateUpdateReportPDF(report, 'before');
              const blob = new Blob([txt], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `rapport-avant-update-${new Date().toISOString().split('T')[0]}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-sm hover:text-white">
              <Download className="w-4 h-4" /> Rapport
            </button>
          </div>
        </motion.div>
      )}

      {/* ─── APPLYING ───────────────────────────────── */}
      {applying && (
        <div className="text-center p-10">
          <div className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Application de la mise a jour...</p>
          <div className="max-w-md mx-auto mt-4 space-y-1">
            {settings.backup_enabled && <Step text="Sauvegarde en cours" active />}
            <Step text="Application des fichiers" active />
            {settings.run_migrations && <Step text="Migrations base de donnees" />}
            {settings.clear_cache && <Step text="Nettoyage cache" />}
            <Step text="Tests automatiques" />
          </div>
        </div>
      )}

      {/* ─── APPLY RESULT ───────────────────────────── */}
      {applyResult && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className={`p-4 rounded-xl border ${applyResult.success ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
            <div className="flex items-center gap-3">
              {applyResult.success ? <CheckCircle className="w-6 h-6 text-emerald-400" /> : <XCircle className="w-6 h-6 text-red-400" />}
              <div>
                <p className={`text-sm font-bold ${applyResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                  {applyResult.success ? 'Mise a jour appliquee avec succes' : 'Des erreurs sont survenues'}
                </p>
                <p className="text-xs text-slate-400">Backup ID: {applyResult.backupId}</p>
              </div>
            </div>
          </div>

          {/* Auto tests */}
          {autoTests && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-400" /> Tests automatiques ({autoTests.passed.length} OK / {autoTests.failed.length} KO)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                {autoTests.passed.map(t => (
                  <p key={t} className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {t}</p>
                ))}
                {autoTests.failed.map(t => (
                  <p key={t} className="text-xs text-red-400 flex items-center gap-1"><XCircle className="w-3 h-3" /> {t}</p>
                ))}
              </div>
            </div>
          )}

          {applyResult.errors.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-red-400 mb-2">Erreurs</h4>
              {applyResult.errors.map((e, i) => <p key={i} className="text-xs text-red-400">{e}</p>)}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => handleRollback(applyResult.backupId)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20">
              <RotateCcw className="w-4 h-4" /> Rollback
            </button>
            <button onClick={() => { setReport(null); setApplyResult(null); setAutoTests(null); }}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-sm hover:text-white">
              Nouvelle mise a jour
            </button>
          </div>
        </motion.div>
      )}

      {/* ─── SETTINGS PANEL ─────────────────────────── */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Settings className="w-4 h-4" /> Parametres de mise a jour</h3>
                <button onClick={() => setShowSettings(false)} className="p-1 rounded hover:bg-slate-800"><X className="w-4 h-4 text-slate-500" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Toggle label="Sauvegarde automatique" value={settings.backup_enabled} onChange={() => toggleSetting('backup_enabled')} recommended />
                <Toggle label="Preserver .env" value={settings.preserve_env} onChange={() => toggleSetting('preserve_env')} locked />
                <Toggle label="Preserver base de donnees" value={settings.preserve_database} onChange={() => toggleSetting('preserve_database')} locked />
                <Toggle label="Preserver uploads" value={settings.preserve_uploads} onChange={() => toggleSetting('preserve_uploads')} locked />
                <Toggle label="Preserver cles API" value={settings.preserve_api_keys} onChange={() => toggleSetting('preserve_api_keys')} locked />
                <Toggle label="Mode maintenance" value={settings.maintenance_mode} onChange={() => toggleSetting('maintenance_mode')} />
                <Toggle label="Lancer migrations" value={settings.run_migrations} onChange={() => toggleSetting('run_migrations')} />
                <Toggle label="Lancer seeders" value={settings.run_seeders} onChange={() => toggleSetting('run_seeders')} />
                <Toggle label="Nettoyer cache" value={settings.clear_cache} onChange={() => toggleSetting('clear_cache')} />
                <Toggle label="Rollback active" value={settings.rollback_enabled} onChange={() => toggleSetting('rollback_enabled')} recommended />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── HISTORY PANEL ──────────────────────────── */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2"><History className="w-4 h-4" /> Historique des mises a jour ({history.length})</h3>
                <button onClick={() => setShowHistory(false)} className="p-1 rounded hover:bg-slate-800"><X className="w-4 h-4 text-slate-500" /></button>
              </div>
              {history.length === 0 && <p className="text-xs text-slate-500 text-center py-4">Aucune mise a jour effectuee</p>}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.map(h => (
                  <div key={h.id} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-white">{h.versionFrom} → {h.versionTo}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${h.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : h.status === 'rolled_back' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                          {h.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">{new Date(h.createdAt).toLocaleString('fr-FR')} — {h.adminEmail}</p>
                    </div>
                    {h.status === 'completed' && settings.rollback_enabled && (
                      <button onClick={() => handleRollback(h.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-[10px] hover:bg-red-500/20">
                        <RotateCcw className="w-3 h-3 inline" /> Rollback
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────

function InfoItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-slate-800/40 rounded-lg p-2.5 text-center">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className={`text-sm font-bold ${color ? 'text-' + color + '-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}

function Toggle({ label, value, onChange, locked, recommended }: { label: string; value: boolean; onChange: () => void; locked?: boolean; recommended?: boolean }) {
  return (
    <label className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-lg cursor-pointer">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-300">{label}</span>
        {locked && <Lock className="w-3 h-3 text-amber-400" />}
        {recommended && <Star className="w-3 h-3 text-emerald-400" />}
      </div>
      <div onClick={e => { e.preventDefault(); if (!locked) onChange(); }}
        className={`w-9 h-5 rounded-full transition-colors relative ${value ? 'bg-blue-500' : 'bg-slate-600'} ${locked ? 'opacity-50' : ''}`}>
        <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
    </label>
  );
}

function Step({ text, active }: { text: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-xs ${active ? 'text-blue-400' : 'text-slate-600'}`}>
      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${active ? 'bg-blue-500/20' : 'bg-slate-800'}`}>
        {active ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Clock className="w-2.5 h-2.5" />}
      </div>
      {text}
    </div>
  );
}

function OverviewTab({ report }: { report: UpdateReport }) {
  const counts: Record<string, number> = {};
  report.filesAdded.forEach(f => { counts[f.category] = (counts[f.category] || 0) + 1; });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard icon={FileCode} label="Fichiers" value={String(report.filesAnalyzed)} color="blue" />
      <StatCard icon={Shield} label="Sensibles" value={String(report.sensitiveFiles.length)} color="amber" />
      <StatCard icon={AlertTriangle} label="Conflits" value={String(report.conflicts.length)} color="red" />
      <StatCard icon={Clock} label="Estimation" value={`${report.estimatedTime}min`} color="purple" />
      {Object.entries(counts).map(([cat, count]) => (
        <StatCard key={cat} icon={Layers} label={cat} value={String(count)} color="slate" />
      ))}
    </div>
  );
}

function FilesTab({ report, formatBytes }: { report: UpdateReport; formatBytes: (b: number) => string }) {
  const [filterCat, setFilterCat] = useState<string>('ALL');
  const files = filterCat === 'ALL' ? report.filesAdded : report.filesAdded.filter(f => f.category === filterCat);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button onClick={() => setFilterCat('ALL')} className={`text-[10px] px-2 py-1 rounded-lg ${filterCat === 'ALL' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>Tous</button>
        {Object.keys(CAT_COLORS).map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className={`text-[10px] px-2 py-1 rounded-lg ${filterCat === cat ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
            {cat}
          </button>
        ))}
      </div>
      <div className="max-h-64 overflow-y-auto space-y-1">
        {files.slice(0, 50).map((f, i) => (
          <div key={i} className={`flex items-center justify-between p-2 rounded-lg ${f.sensitive ? 'bg-amber-500/5' : 'bg-slate-800/30'}`}>
            <div className="flex items-center gap-2 min-w-0">
              {f.sensitive && <Lock className="w-3 h-3 text-amber-400 flex-shrink-0" />}
              <span className="text-xs text-slate-300 truncate">{f.path}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${CAT_COLORS[f.category] || CAT_COLORS.other}`}>{f.category}</span>
              <span className="text-[10px] text-slate-500">{formatBytes(f.size)}</span>
            </div>
          </div>
        ))}
        {files.length > 50 && <p className="text-xs text-slate-600 text-center">...et {files.length - 50} fichiers supplementaires</p>}
      </div>
    </div>
  );
}

function RecommendationsTab({ report }: { report: UpdateReport }) {
  return (
    <div className="space-y-2">
      {report.recommendations.map((r, i) => (
        <div key={i} className="flex items-start gap-2 p-3 bg-slate-800/30 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300">{r}</p>
        </div>
      ))}
      {report.recommendations.length === 0 && <p className="text-xs text-slate-500 text-center py-4">Aucune recommandation particuliere</p>}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof FileCode; label: string; value: string; color: string }) {
  const colors: Record<string, string> = { blue: 'text-blue-400', amber: 'text-amber-400', red: 'text-red-400', purple: 'text-purple-400', slate: 'text-slate-400' };
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
      <Icon className={`w-5 h-5 mx-auto mb-1 ${colors[color] || 'text-slate-400'}`} />
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}
