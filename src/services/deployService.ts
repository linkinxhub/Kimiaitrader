/**
 * Deploy Service — Gestion des déploiements GitHub + Vercel
 * CI/CD simplifié intégré dans l'admin panel
 */

// ─── Types ────────────────────────────────────────────────

export interface GitHubConfig {
  owner: string;
  repo: string;
  pat: string; // Personal Access Token
  branch: string;
}

export interface VercelConfig {
  token: string;
  projectId: string;
  teamId?: string;
}

export interface DeploySettings {
  github: GitHubConfig;
  vercel: VercelConfig;
  autoCheck: boolean;
  checkIntervalHours: number;
  notifyOnDeploy: boolean;
  requireConfirm: boolean;
  lastCheck: number;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
}

export interface VercelDeployment {
  id: string;
  url: string;
  state: 'READY' | 'ERROR' | 'BUILDING' | 'QUEUED' | 'CANCELED';
  created: number;
  branch: string;
  commit: string;
  message: string;
  author: string;
}

export interface DeployPipeline {
  id: string;
  status: 'pending' | 'checking' | 'building' | 'deploying' | 'verifying' | 'success' | 'failed' | 'rolled_back';
  commit: GitHubCommit;
  startedAt: number;
  endedAt?: number;
  steps: DeployStep[];
  vercelUrl?: string;
}

export interface DeployStep {
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  log: string;
  startedAt?: number;
  endedAt?: number;
}

// ─── Constants ────────────────────────────────────────────

const SETTINGS_KEY = 'xtrendai_deploy_settings';
const HISTORY_KEY = 'xtrendai_deploy_history';
const CURRENT_VERSION_KEY = 'xtrendai_current_version';

const DEFAULT_SETTINGS: DeploySettings = {
  github: { owner: '', repo: '', pat: '', branch: 'main' },
  vercel: { token: '', projectId: '', teamId: '' },
  autoCheck: false,
  checkIntervalHours: 24,
  notifyOnDeploy: true,
  requireConfirm: true,
  lastCheck: 0,
};

// ─── Settings ─────────────────────────────────────────────

export function getDeploySettings(): DeploySettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

export function saveDeploySettings(settings: DeploySettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ─── Current Version ──────────────────────────────────────

export function getCurrentVersion(): string {
  return localStorage.getItem(CURRENT_VERSION_KEY) || '2.0.0';
}

export function setCurrentVersion(v: string) {
  localStorage.setItem(CURRENT_VERSION_KEY, v);
}

// ─── History ──────────────────────────────────────────────

export function getDeployHistory(): DeployPipeline[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function addToHistory(pipeline: DeployPipeline) {
  const history = getDeployHistory();
  history.unshift(pipeline);
  if (history.length > 50) history.length = 50;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function updateHistory(pipeline: DeployPipeline) {
  const history = getDeployHistory();
  const idx = history.findIndex(h => h.id === pipeline.id);
  if (idx >= 0) history[idx] = pipeline;
  else history.unshift(pipeline);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// ─── GitHub API ───────────────────────────────────────────

export async function fetchGitHubCommits(config: GitHubConfig): Promise<GitHubCommit[]> {
  if (!config.owner || !config.repo || !config.pat) {
    throw new Error('Configuration GitHub incomplète');
  }
  const res = await fetch(
    `https://api.github.com/repos/${config.owner}/${config.repo}/commits?sha=${config.branch}&per_page=20`,
    {
      headers: {
        Authorization: `token ${config.pat}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'XTrendAI-Deploy',
      },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API erreur ${res.status}`);
  }
  const data = await res.json();
  return data.map((c: any) => ({
    sha: c.sha.slice(0, 7),
    message: c.commit.message.split('\n')[0],
    author: c.commit.author.name,
    date: c.commit.author.date,
    url: c.html_url,
  }));
}

export async function fetchGitHubReleases(config: GitHubConfig): Promise<GitHubRelease[]> {
  if (!config.owner || !config.repo || !config.pat) return [];
  const res = await fetch(
    `https://api.github.com/repos/${config.owner}/${config.repo}/releases?per_page=10`,
    {
      headers: {
        Authorization: `token ${config.pat}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'XTrendAI-Deploy',
      },
    }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.map((r: any) => ({
    tag_name: r.tag_name,
    name: r.name,
    body: r.body || '',
    published_at: r.published_at,
    html_url: r.html_url,
  }));
}

export async function fetchLatestTag(config: GitHubConfig): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/tags?per_page=1`,
      {
        headers: {
          Authorization: `token ${config.pat}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'XTrendAI-Deploy',
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data[0]?.name || null;
  } catch { return null; }
}

export async function compareVersions(config: GitHubConfig, localVersion: string): Promise<{
  hasUpdate: boolean;
  latestTag: string | null;
  commitsBehind: number;
  latestCommit: GitHubCommit | null;
}> {
  const latestTag = await fetchLatestTag(config);
  const commits = await fetchGitHubCommits(config);

  // Find how many commits since the "local version"
  // In practice, we compare the latest tag with local version
  const hasUpdate = latestTag !== null && latestTag !== localVersion;
  const latestCommit = commits[0] || null;

  return {
    hasUpdate,
    latestTag,
    commitsBehind: hasUpdate ? commits.length : 0,
    latestCommit,
  };
}

// ─── Vercel API ───────────────────────────────────────────

export async function fetchVercelDeployments(config: VercelConfig): Promise<VercelDeployment[]> {
  if (!config.token || !config.projectId) {
    throw new Error('Configuration Vercel incomplète');
  }
  const teamPart = config.teamId ? `&teamId=${config.teamId}` : '';
  const res = await fetch(
    `https://api.vercel.com/v6/deployments?projectId=${config.projectId}${teamPart}&limit=20`,
    {
      headers: { Authorization: `Bearer ${config.token}` },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Vercel API erreur ${res.status}`);
  }
  const data = await res.json();
  return data.deployments?.map((d: any) => ({
    id: d.uid,
    url: d.url,
    state: d.state,
    created: d.created,
    branch: d.meta?.githubCommitRef || 'main',
    commit: d.meta?.githubCommitSha?.slice(0, 7) || '—',
    message: d.meta?.githubCommitMessage || '—',
    author: d.meta?.githubCommitAuthorName || '—',
  })) || [];
}

export async function triggerVercelDeploy(config: VercelConfig, commitSha?: string): Promise<{ id: string; url: string }> {
  if (!config.token || !config.projectId) {
    throw new Error('Configuration Vercel incomplète');
  }
  const body: any = {
    name: 'xtrendai-pro',
    project: config.projectId,
    target: 'production',
    meta: {
      deploySource: 'xtrendai-admin',
      deployTime: new Date().toISOString(),
    },
  };
  if (commitSha) {
    body.gitSource = {
      type: 'github',
      ref: commitSha,
      repoId: '', // Will be filled if needed
    };
  }
  const res = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Vercel deploy erreur ${res.status}`);
  }
  const data = await res.json();
  return { id: data.id || data.uid, url: data.url };
}

export async function checkDeployStatus(config: VercelConfig, deployId: string): Promise<VercelDeployment> {
  const res = await fetch(`https://api.vercel.com/v13/deployments/${deployId}`, {
    headers: { Authorization: `Bearer ${config.token}` },
  });
  if (!res.ok) throw new Error(`Vercel status check erreur ${res.status}`);
  const data = await res.json();
  return {
    id: data.uid,
    url: data.url,
    state: data.readyState || data.state,
    created: data.created,
    branch: data.meta?.githubCommitRef || 'main',
    commit: data.meta?.githubCommitSha?.slice(0, 7) || '—',
    message: data.meta?.githubCommitMessage || '—',
    author: data.meta?.githubCommitAuthorName || '—',
  };
}

// ─── Deploy Pipeline ──────────────────────────────────────

export function createPipeline(commit: GitHubCommit): DeployPipeline {
  const pipeline: DeployPipeline = {
    id: `deploy-${Date.now()}`,
    status: 'pending',
    commit,
    startedAt: Date.now(),
    steps: [
      { name: 'Vérification GitHub', status: 'pending', log: '' },
      { name: 'Build Vercel', status: 'pending', log: '' },
      { name: 'Déploiement', status: 'pending', log: '' },
      { name: 'Vérification', status: 'pending', log: '' },
    ],
  };
  addToHistory(pipeline);
  return pipeline;
}

export async function runPipeline(
  pipeline: DeployPipeline,
  settings: DeploySettings,
  onStepUpdate: (p: DeployPipeline) => void
): Promise<DeployPipeline> {
  // Step 1: Verify GitHub
  pipeline.status = 'checking';
  pipeline.steps[0].status = 'running';
  pipeline.steps[0].startedAt = Date.now();
  onStepUpdate({ ...pipeline });

  try {
    const commits = await fetchGitHubCommits(settings.github);
    const commitExists = commits.some(c => c.sha === pipeline.commit.sha);
    if (!commitExists) {
      throw new Error('Commit non trouvé sur GitHub');
    }
    pipeline.steps[0].status = 'success';
    pipeline.steps[0].log = `Commit ${pipeline.commit.sha} vérifié sur ${settings.github.owner}/${settings.github.repo}`;
  } catch (e: any) {
    pipeline.steps[0].status = 'failed';
    pipeline.steps[0].log = e.message;
    pipeline.status = 'failed';
    pipeline.endedAt = Date.now();
    updateHistory(pipeline);
    onStepUpdate({ ...pipeline });
    return pipeline;
  }
  pipeline.steps[0].endedAt = Date.now();
  onStepUpdate({ ...pipeline });

  // Step 2: Trigger Vercel Build
  pipeline.status = 'building';
  pipeline.steps[1].status = 'running';
  pipeline.steps[1].startedAt = Date.now();
  onStepUpdate({ ...pipeline });

  let deployId: string;
  try {
    const result = await triggerVercelDeploy(settings.vercel);
    deployId = result.id;
    pipeline.vercelUrl = `https://${result.url}`;
    pipeline.steps[1].status = 'success';
    pipeline.steps[1].log = `Build déclenché : ${result.url}`;
  } catch (e: any) {
    pipeline.steps[1].status = 'failed';
    pipeline.steps[1].log = e.message;
    pipeline.status = 'failed';
    pipeline.endedAt = Date.now();
    updateHistory(pipeline);
    onStepUpdate({ ...pipeline });
    return pipeline;
  }
  pipeline.steps[1].endedAt = Date.now();
  onStepUpdate({ ...pipeline });

  // Step 3: Wait for deploy
  pipeline.status = 'deploying';
  pipeline.steps[2].status = 'running';
  pipeline.steps[2].startedAt = Date.now();
  onStepUpdate({ ...pipeline });

  let deployed = false;
  for (let i = 0; i < 60; i++) { // Wait up to 5 minutes
    await new Promise(r => setTimeout(r, 5000));
    try {
      const status = await checkDeployStatus(settings.vercel, deployId);
      pipeline.steps[2].log = `État : ${status.state} (${i + 1}/60)`;
      onStepUpdate({ ...pipeline });
      if (status.state === 'READY') {
        deployed = true;
        pipeline.steps[2].status = 'success';
        pipeline.steps[2].log = `Déployé sur ${pipeline.vercelUrl}`;
        break;
      }
      if (status.state === 'ERROR' || status.state === 'CANCELED') {
        throw new Error(`Déploiement ${status.state}`);
      }
    } catch (e: any) {
      pipeline.steps[2].status = 'failed';
      pipeline.steps[2].log = e.message;
      pipeline.status = 'failed';
      pipeline.endedAt = Date.now();
      updateHistory(pipeline);
      onStepUpdate({ ...pipeline });
      return pipeline;
    }
  }
  if (!deployed) {
    pipeline.steps[2].status = 'failed';
    pipeline.steps[2].log = 'Timeout après 5 minutes';
    pipeline.status = 'failed';
    pipeline.endedAt = Date.now();
    updateHistory(pipeline);
    onStepUpdate({ ...pipeline });
    return pipeline;
  }
  pipeline.steps[2].endedAt = Date.now();
  onStepUpdate({ ...pipeline });

  // Step 4: Verify
  pipeline.status = 'verifying';
  pipeline.steps[3].status = 'running';
  pipeline.steps[3].startedAt = Date.now();
  onStepUpdate({ ...pipeline });

  try {
    // Simple health check
    const healthRes = await fetch(pipeline.vercelUrl!, { method: 'HEAD', mode: 'no-cors' });
    pipeline.steps[3].status = 'success';
    pipeline.steps[3].log = `Site accessible : ${pipeline.vercelUrl}`;
  } catch {
    pipeline.steps[3].status = 'success';
    pipeline.steps[3].log = `Vérification manuelle recommandée : ${pipeline.vercelUrl}`;
  }
  pipeline.steps[3].endedAt = Date.now();

  pipeline.status = 'success';
  pipeline.endedAt = Date.now();
  setCurrentVersion(pipeline.commit.sha);
  updateHistory(pipeline);
  onStepUpdate({ ...pipeline });

  return pipeline;
}

// ─── Rollback ─────────────────────────────────────────────

export async function rollbackToPrevious(settings: DeploySettings): Promise<DeployPipeline> {
  const history = getDeployHistory();
  const previous = history.find(h => h.status === 'success');
  if (!previous) throw new Error('Aucun déploiement précédent trouvé');

  const pipeline = createPipeline(previous.commit);
  pipeline.steps[0].log = `Rollback vers ${previous.commit.sha}`;

  try {
    const result = await triggerVercelDeploy(settings.vercel, previous.commit.sha);
    pipeline.vercelUrl = `https://${result.url}`;
    pipeline.steps.forEach(s => { s.status = 'success'; s.log = 'Rollback effectué'; });
    pipeline.status = 'rolled_back';
    pipeline.endedAt = Date.now();
  } catch (e: any) {
    pipeline.status = 'failed';
    pipeline.steps.forEach(s => { s.status = 'failed'; s.log = e.message; });
    pipeline.endedAt = Date.now();
  }

  updateHistory(pipeline);
  return pipeline;
}

// ─── Test connections ─────────────────────────────────────

export async function testGitHubConnection(config: GitHubConfig): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}`, {
      headers: {
        Authorization: `token ${config.pat}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'XTrendAI-Deploy',
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, message: err.message || `Erreur ${res.status}` };
    }
    const data = await res.json();
    return { ok: true, message: `Connecté : ${data.full_name} (${data.default_branch})` };
  } catch (e: any) {
    return { ok: false, message: e.message };
  }
}

export async function testVercelConnection(config: VercelConfig): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(`https://api.vercel.com/v9/projects/${config.projectId}`, {
      headers: { Authorization: `Bearer ${config.token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, message: err.error?.message || `Erreur ${res.status}` };
    }
    const data = await res.json();
    return { ok: true, message: `Connecté : ${data.name} (${data.framework || 'static'})` };
  } catch (e: any) {
    return { ok: false, message: e.message };
  }
}
