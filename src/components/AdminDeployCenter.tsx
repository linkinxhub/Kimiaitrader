/**
 * AdminDeployCenter — Centre de Déploiement GitHub + Vercel
 * Gestion complète du pipeline CI/CD depuis l'admin panel
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Github, Server, Play, RotateCcw, CheckCircle, XCircle,
  Clock, ChevronDown, ChevronUp, ExternalLink, RefreshCw,
  Settings, Shield, AlertTriangle, Zap, Globe, GitBranch,
  Tag, History, Radio, Loader2, Eye, Download, CircleDot,
  ArrowUp, ArrowDown, Wifi, WifiOff, Save, Key,
} from 'lucide-react';
import {
  getDeploySettings, saveDeploySettings, getDeployHistory,
  getCurrentVersion, setCurrentVersion, createPipeline, runPipeline,
  rollbackToPrevious, testGitHubConnection, testVercelConnection,
  fetchGitHubCommits, fetchGitHubReleases, compareVersions,
  fetchVercelDeployments,
  type DeploySettings, type GitHubCommit, type GitHubRelease,
  type VercelDeployment, type DeployPipeline,
} from '@/services/deployService';
import { alertSystem } from '@/services/alertService';

// ─── Helpers ──────────────────────────────────────────────

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}j`;
}

const STEP_ICONS = [GitBranch, Zap, Server, CheckCircle];

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  pending:     { bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700', label: 'En attente' },
  checking:    { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: 'Vérification' },
  building:    { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', label: 'Build' },
  deploying:   { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', label: 'Déploiement' },
  verifying:   { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', label: 'Vérification' },
  success:     { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'Succès' },
  failed:      { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'Échec' },
  rolled_back: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', label: 'Rollback' },
};

// ─── Sub-components ───────────────────────────────────────

function ConfigPanel({ settings, onChange }: { settings: DeploySettings; onChange: (s: DeploySettings) => void }) {
  const [testingGh, setTestingGh] = useState(false);
  const [testingVc, setTestingVc] = useState(false);
  const [ghResult, setGhResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [vcResult, setVcResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showPat, setShowPat] = useState(false);
  const [showVcToken, setShowVcToken] = useState(false);

  const testGh = async () => {
    setTestingGh(true);
    setGhResult(null);
    const r = await testGitHubConnection(settings.github);
    setGhResult(r);
    setTestingGh(false);
  };

  const testVc = async () => {
    setTestingVc(true);
    setVcResult(null);
    const r = await testVercelConnection(settings.vercel);
    setVcResult(r);
    setTestingVc(false);
  };

  return (
    <div className="space-y-6">
      {/* GitHub */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
            <Github className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">GitHub Repository</h3>
            <p className="text-xs text-slate-500">Connexion au dépôt source</p>
          </div>
          {ghResult && (
            <span className={`ml-auto px-2 py-1 rounded-full text-[10px] font-bold ${ghResult.ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              {ghResult.ok ? 'Connecté' : 'Erreur'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Propriétaire (owner)</label>
            <input
              value={settings.github.owner}
              onChange={e => onChange({ ...settings, github: { ...settings.github, owner: e.target.value } })}
              placeholder="mon-org"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Repository</label>
            <input
              value={settings.github.repo}
              onChange={e => onChange({ ...settings, github: { ...settings.github, repo: e.target.value } })}
              placeholder="mon-projet"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Branch</label>
            <input
              value={settings.github.branch}
              onChange={e => onChange({ ...settings, github: { ...settings.github, branch: e.target.value } })}
              placeholder="main"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Personal Access Token</label>
            <div className="relative">
              <input
                type={showPat ? 'text' : 'password'}
                value={settings.github.pat}
                onChange={e => onChange({ ...settings, github: { ...settings.github, pat: e.target.value } })}
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full px-3 py-2 pr-16 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
              <button onClick={() => setShowPat(!showPat)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white">
                {showPat ? 'Cacher' : 'Voir'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={testGh}
            disabled={testingGh}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors disabled:opacity-50"
          >
            {testingGh ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
            Tester GitHub
          </button>
          {ghResult && (
            <span className={`text-xs ${ghResult.ok ? 'text-emerald-400' : 'text-red-400'}`}>
              {ghResult.message}
            </span>
          )}
        </div>
      </div>

      {/* Vercel */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
            <Server className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Vercel Project</h3>
            <p className="text-xs text-slate-500">Connexion au projet de déploiement</p>
          </div>
          {vcResult && (
            <span className={`ml-auto px-2 py-1 rounded-full text-[10px] font-bold ${vcResult.ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              {vcResult.ok ? 'Connecté' : 'Erreur'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Project ID</label>
            <input
              value={settings.vercel.projectId}
              onChange={e => onChange({ ...settings, vercel: { ...settings.vercel, projectId: e.target.value } })}
              placeholder="prj_xxxxxxxx"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Team ID (optionnel)</label>
            <input
              value={settings.vercel.teamId || ''}
              onChange={e => onChange({ ...settings, vercel: { ...settings.vercel, teamId: e.target.value } })}
              placeholder="team_xxxxxxxx"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-slate-500 mb-1 block">Token API</label>
            <div className="relative">
              <input
                type={showVcToken ? 'text' : 'password'}
                value={settings.vercel.token}
                onChange={e => onChange({ ...settings, vercel: { ...settings.vercel, token: e.target.value } })}
                placeholder="vercel_token_xxxxxxxx"
                className="w-full px-3 py-2 pr-16 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
              <button onClick={() => setShowVcToken(!showVcToken)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white">
                {showVcToken ? 'Cacher' : 'Voir'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={testVc}
            disabled={testingVc}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors disabled:opacity-50"
          >
            {testingVc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
            Tester Vercel
          </button>
          {vcResult && (
            <span className={`text-xs ${vcResult.ok ? 'text-emerald-400' : 'text-red-400'}`}>
              {vcResult.message}
            </span>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-slate-400" /> Options
        </h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-slate-300">Vérification auto des mises à jour</span>
            <button
              onClick={() => onChange({ ...settings, autoCheck: !settings.autoCheck })}
              className={`w-10 h-5 rounded-full transition-all ${settings.autoCheck ? 'bg-blue-500' : 'bg-slate-700'}`}
            >
              <motion.div animate={{ x: settings.autoCheck ? 20 : 2 }} className="w-4 h-4 rounded-full bg-white shadow" />
            </button>
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-slate-300">Confirmer avant chaque déploiement</span>
            <button
              onClick={() => onChange({ ...settings, requireConfirm: !settings.requireConfirm })}
              className={`w-10 h-5 rounded-full transition-all ${settings.requireConfirm ? 'bg-blue-500' : 'bg-slate-700'}`}
            >
              <motion.div animate={{ x: settings.requireConfirm ? 20 : 2 }} className="w-4 h-4 rounded-full bg-white shadow" />
            </button>
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-slate-300">Notifier après déploiement</span>
            <button
              onClick={() => onChange({ ...settings, notifyOnDeploy: !settings.notifyOnDeploy })}
              className={`w-10 h-5 rounded-full transition-all ${settings.notifyOnDeploy ? 'bg-blue-500' : 'bg-slate-700'}`}
            >
              <motion.div animate={{ x: settings.notifyOnDeploy ? 20 : 2 }} className="w-4 h-4 rounded-full bg-white shadow" />
            </button>
          </label>
        </div>
      </div>
    </div>
  );
}

// ─── Pipeline Visual ──────────────────────────────────────

function PipelineVisual({ pipeline }: { pipeline: DeployPipeline }) {
  const cfg = STATUS_COLORS[pipeline.status] || STATUS_COLORS.pending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-slate-900/60 border ${cfg.border} rounded-2xl p-6`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
          </span>
          <span className="text-xs text-slate-500 font-mono">{pipeline.id.slice(-8)}</span>
        </div>
        <div className="flex items-center gap-2">
          {pipeline.vercelUrl && (
            <a href={pipeline.vercelUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs hover:bg-blue-500/20 transition-colors">
              <ExternalLink className="w-3 h-3" /> Voir
            </a>
          )}
          <span className="text-xs text-slate-500">
            {pipeline.endedAt ? timeAgo(pipeline.endedAt) + ' ago' : 'En cours...'}
          </span>
        </div>
      </div>

      {/* Commit info */}
      <div className="flex items-center gap-2 mb-4 text-xs text-slate-400">
        <GitBranch className="w-3.5 h-3.5" />
        <span className="font-mono text-slate-300">{pipeline.commit.sha}</span>
        <span>—</span>
        <span className="truncate">{pipeline.commit.message}</span>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-4 gap-3">
        {pipeline.steps.map((step, i) => {
          const Icon = STEP_ICONS[i];
          const colors = {
            pending: 'bg-slate-800 border-slate-700 text-slate-600',
            running: 'bg-blue-500/10 border-blue-500/30 text-blue-400 animate-pulse',
            success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
            failed: 'bg-red-500/10 border-red-500/30 text-red-400',
          }[step.status];

          return (
            <div key={i} className={`relative rounded-xl border p-3 ${colors}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">{step.name}</span>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-2">{step.log || '...'}</p>
              {step.startedAt && step.endedAt && (
                <p className="text-[9px] text-slate-600 mt-1">{Math.round((step.endedAt - step.startedAt) / 1000)}s</p>
              )}
              {/* Connector line */}
              {i < 3 && (
                <div className={`absolute -right-2 top-1/2 w-4 h-0.5 ${
                  step.status === 'success' ? 'bg-emerald-500/30' : 'bg-slate-700'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────

export default function AdminDeployCenter() {
  const [settings, setSettings] = useState<DeploySettings>(getDeploySettings);
  const [currentVersion, setCurrentVersionState] = useState(getCurrentVersion);
  const [activeTab, setActiveTab] = useState<'status' | 'commits' | 'deployments' | 'history' | 'config'>('status');

  // Data states
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [vercelDeploys, setVercelDeploys] = useState<VercelDeployment[]>([]);
  const [history, setHistory] = useState<DeployPipeline[]>(getDeployHistory);
  const [versionCheck, setVersionCheck] = useState<{ hasUpdate: boolean; latestTag: string | null; commitsBehind: number } | null>(null);

  // Loading states
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [loadingVercel, setLoadingVercel] = useState(false);
  const [checkingVersion, setCheckingVersion] = useState(false);

  // Pipeline state
  const [activePipeline, setActivePipeline] = useState<DeployPipeline | null>(null);
  const [deploying, setDeploying] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);

  // Refs for interval
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Load data ──────────────────────────────────────────

  const loadCommits = useCallback(async () => {
    if (!settings.github.owner || !settings.github.repo || !settings.github.pat) return;
    setLoadingCommits(true);
    try {
      const [c, r] = await Promise.all([
        fetchGitHubCommits(settings.github),
        fetchGitHubReleases(settings.github),
      ]);
      setCommits(c);
      setReleases(r);
    } catch (e: any) {
      console.error('[Deploy] Commits error:', e.message);
    }
    setLoadingCommits(false);
  }, [settings.github]);

  const loadVercel = useCallback(async () => {
    if (!settings.vercel.token || !settings.vercel.projectId) return;
    setLoadingVercel(true);
    try {
      const d = await fetchVercelDeployments(settings.vercel);
      setVercelDeploys(d);
    } catch (e: any) {
      console.error('[Deploy] Vercel error:', e.message);
    }
    setLoadingVercel(false);
  }, [settings.vercel]);

  const checkVersion = useCallback(async () => {
    if (!settings.github.owner || !settings.github.repo || !settings.github.pat) return;
    setCheckingVersion(true);
    try {
      const result = await compareVersions(settings.github, currentVersion);
      setVersionCheck(result);
      if (result.hasUpdate && settings.notifyOnDeploy) {
        alertSystem(
          `Mise à jour disponible`,
          `Nouvelle version ${result.latestTag} disponible sur GitHub (${result.commitsBehind} commits en avance).`,
          'medium',
          'system'
        );
      }
    } catch (e: any) {
      console.error('[Deploy] Version check error:', e.message);
    }
    setCheckingVersion(false);
  }, [settings.github, currentVersion, settings.notifyOnDeploy]);

  // Load on mount
  useEffect(() => {
    loadCommits();
    loadVercel();
    checkVersion();
  }, [loadCommits, loadVercel, checkVersion]);

  // ─── Deploy ─────────────────────────────────────────────

  const handleDeploy = async (commit: GitHubCommit) => {
    if (settings.requireConfirm) {
      if (!window.confirm(`Déployer le commit ${commit.sha} ?\n\n${commit.message}`)) return;
    }

    const pipeline = createPipeline(commit);
    setActivePipeline(pipeline);
    setDeploying(true);

    await runPipeline(pipeline, settings, (updated) => {
      setActivePipeline({ ...updated });
      setHistory(getDeployHistory());
    });

    setDeploying(false);
    if (settings.notifyOnDeploy) {
      alertSystem('Déploiement terminé', `Le commit ${commit.sha} a été déployé.`, 'low', 'system');
    }
    loadVercel();
  };

  // ─── Rollback ───────────────────────────────────────────

  const handleRollback = async () => {
    if (!window.confirm('Rollback vers le dernier déploiement stable ?')) return;
    setRollingBack(true);
    try {
      const pipeline = await rollbackToPrevious(settings);
      setActivePipeline(pipeline);
      setHistory(getDeployHistory());
      alertSystem('Rollback effectué', 'Retour au dernier déploiement stable.', 'high', 'system');
      loadVercel();
    } catch (e: any) {
      alert(e.message);
    }
    setRollingBack(false);
  };

  // ─── Save settings ──────────────────────────────────────

  const handleSettingsChange = (s: DeploySettings) => {
    setSettings(s);
    saveDeploySettings(s);
  };

  // ─── Tabs ───────────────────────────────────────────────

  const tabs = [
    { id: 'status' as const, label: 'Statut', icon: Radio },
    { id: 'commits' as const, label: 'Commits', icon: GitBranch },
    { id: 'deployments' as const, label: 'Déploiements', icon: Server },
    { id: 'history' as const, label: 'Historique', icon: History },
    { id: 'config' as const, label: 'Configuration', icon: Settings },
  ];

  // ─── Render ─────────────────────────────────────────────

  const isConnected = !!(settings.github.pat && settings.github.owner && settings.github.repo &&
    settings.vercel.token && settings.vercel.projectId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Centre de Déploiement</h2>
            <p className="text-xs text-slate-400">GitHub + Vercel — Pipeline CI/CD</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
            isConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isConnected ? 'Connecté' : 'Non configuré'}
          </div>
          <span className="px-3 py-1.5 rounded-full bg-slate-800 text-xs text-slate-400 font-mono">
            <Tag className="w-3 h-3 inline mr-1" />
            v{currentVersion}
          </span>
        </div>
      </div>

      {/* Version alert */}
      {versionCheck?.hasUpdate && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-400">
              Mise à jour disponible : {versionCheck.latestTag}
            </p>
            <p className="text-xs text-slate-400">
              {versionCheck.commitsBehind} commits en avance par rapport à la version locale (v{currentVersion})
            </p>
          </div>
          <button
            onClick={() => { setActiveTab('commits'); }}
            className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors"
          >
            Voir les commits
          </button>
        </motion.div>
      )}

      {/* Active pipeline */}
      {activePipeline && (
        <PipelineVisual pipeline={activePipeline} />
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === t.id
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* ═══ TAB: STATUS ═══ */}
      {activeTab === 'status' && (
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={checkVersion}
              disabled={checkingVersion}
              className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-left hover:bg-blue-500/20 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-6 h-6 text-blue-400 ${checkingVersion ? 'animate-spin' : ''}`} />
              <div>
                <p className="text-sm font-bold text-white">Vérifier les MAJ</p>
                <p className="text-xs text-slate-400">Comparer avec GitHub</p>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('commits')}
              className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-left hover:bg-emerald-500/20 transition-colors"
            >
              <Play className="w-6 h-6 text-emerald-400" />
              <div>
                <p className="text-sm font-bold text-white">Nouveau déploiement</p>
                <p className="text-xs text-slate-400">Choisir un commit</p>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRollback}
              disabled={rollingBack}
              className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-left hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              <RotateCcw className={`w-6 h-6 text-red-400 ${rollingBack ? 'animate-spin' : ''}`} />
              <div>
                <p className="text-sm font-bold text-white">Rollback</p>
                <p className="text-xs text-slate-400">Revenir en arrière</p>
              </div>
            </motion.button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-500 mb-1">Version locale</p>
              <p className="text-lg font-bold text-white font-mono">{currentVersion}</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-500 mb-1">Dernière version</p>
              <p className="text-lg font-bold text-white font-mono">{versionCheck?.latestTag || '—'}</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-500 mb-1">Commits distants</p>
              <p className="text-lg font-bold text-white">{commits.length}</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-500 mb-1">Déploiements Vercel</p>
              <p className="text-lg font-bold text-white">{vercelDeploys.length}</p>
            </div>
          </div>

          {/* Last deploy */}
          {history[0] && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-500 mb-2">Dernier déploiement</p>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${STATUS_COLORS[history[0].status]?.bg} ${STATUS_COLORS[history[0].status]?.text}`}>
                  {STATUS_COLORS[history[0].status]?.label}
                </span>
                <span className="text-sm text-white font-mono">{history[0].commit.sha}</span>
                <span className="text-xs text-slate-400 truncate">{history[0].commit.message}</span>
                <span className="text-xs text-slate-600 ml-auto">{history[0].endedAt ? timeAgo(history[0].endedAt) + ' ago' : '...'}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: COMMITS ═══ */}
      {activeTab === 'commits' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-blue-400" /> Commits récents — {settings.github.branch}
            </h3>
            <button
              onClick={loadCommits}
              disabled={loadingCommits}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${loadingCommits ? 'animate-spin' : ''}`} /> Rafraîchir
            </button>
          </div>

          {commits.length === 0 && !loadingCommits && (
            <div className="text-center py-10 text-slate-500">
              <Github className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Aucun commit chargé</p>
              <p className="text-xs">Configurez GitHub dans l'onglet Configuration</p>
            </div>
          )}

          <div className="space-y-2">
            {commits.map((commit, i) => (
              <motion.div
                key={commit.sha}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-3 hover:border-slate-700 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <GitBranch className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">{commit.sha}</span>
                    <span className="text-xs text-slate-500">{commit.author}</span>
                    <span className="text-[10px] text-slate-600">{new Date(commit.date).toLocaleString('fr-FR')}</span>
                  </div>
                  <p className="text-sm text-white truncate">{commit.message}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a href={commit.url} target="_blank" rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDeploy(commit)}
                    disabled={deploying}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                  >
                    <Play className="w-3 h-3" /> Déployer
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Releases */}
          {releases.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-400" /> Releases
              </h3>
              <div className="space-y-2">
                {releases.map(r => (
                  <div key={r.tag_name} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold">{r.tag_name}</span>
                      <span className="text-xs text-slate-400">{r.name}</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{r.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: DEPLOYMENTS ═══ */}
      {activeTab === 'deployments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-400" /> Déploiements Vercel
            </h3>
            <button
              onClick={loadVercel}
              disabled={loadingVercel}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${loadingVercel ? 'animate-spin' : ''}`} /> Rafraîchir
            </button>
          </div>

          {vercelDeploys.length === 0 && !loadingVercel && (
            <div className="text-center py-10 text-slate-500">
              <Server className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Aucun déploiement</p>
              <p className="text-xs">Configurez Vercel dans l'onglet Configuration</p>
            </div>
          )}

          <div className="space-y-2">
            {vercelDeploys.map((d, i) => {
              const stateColors: Record<string, string> = {
                READY: 'bg-emerald-500/10 text-emerald-400',
                ERROR: 'bg-red-500/10 text-red-400',
                BUILDING: 'bg-purple-500/10 text-purple-400 animate-pulse',
                QUEUED: 'bg-amber-500/10 text-amber-400',
                CANCELED: 'bg-slate-500/10 text-slate-400',
              };
              return (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-3"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    d.state === 'READY' ? 'bg-emerald-400' :
                    d.state === 'ERROR' ? 'bg-red-400' :
                    d.state === 'BUILDING' ? 'bg-purple-400 animate-pulse' :
                    'bg-amber-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${stateColors[d.state] || 'bg-slate-500/10 text-slate-400'}`}>
                        {d.state}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{d.commit}</span>
                      <span className="text-xs text-slate-500">{d.branch}</span>
                    </div>
                    <p className="text-sm text-white truncate">{d.message}</p>
                    <p className="text-[10px] text-slate-600">{d.author} — {timeAgo(d.created * 1000)} ago</p>
                  </div>
                  <a href={`https://${d.url}`} target="_blank" rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors flex-shrink-0">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ TAB: HISTORY ═══ */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" /> Historique des déploiements
          </h3>

          {history.length === 0 && (
            <div className="text-center py-10 text-slate-500">
              <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Aucun déploiement dans l'historique</p>
            </div>
          )}

          <div className="space-y-2">
            {history.map((h, i) => {
              const sc = STATUS_COLORS[h.status] || STATUS_COLORS.pending;
              return (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-3"
                >
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.bg} ${sc.text}`}>
                    {sc.label}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{h.commit.sha}</span>
                  <span className="text-sm text-white truncate flex-1">{h.commit.message}</span>
                  {h.vercelUrl && (
                    <a href={h.vercelUrl} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-blue-400 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <span className="text-xs text-slate-600">{h.endedAt ? timeAgo(h.endedAt) + ' ago' : '...'}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ TAB: CONFIG ═══ */}
      {activeTab === 'config' && (
        <ConfigPanel settings={settings} onChange={handleSettingsChange} />
      )}
    </div>
  );
}
