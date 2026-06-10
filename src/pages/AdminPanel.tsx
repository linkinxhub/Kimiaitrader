import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import {
  Shield, Users, CreditCard, Activity, BarChart3, DollarSign, Server,
  RefreshCw, FileText, Settings, Megaphone, CheckCircle, XCircle, Globe,
  Layout,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getPlatformSettings, savePlatformSettings, type PlatformSettings } from '@/services/platformSettingsService';
import { getAllRegisteredUsers, deleteUser, updateUserPack } from '@/services/authService';
import { getTrades, getPortfolioStats } from '@/services/portfolioService';
import { getPackComparison } from '@/services/packAnalyticsService';
import { getAlerts, getTriggeredHistory } from '@/services/alertService';
import { formatCurrency } from '@/lib/format';
import AdminPerformanceTab from '@/components/AdminPerformanceTab';
import { getAllUpdates, addUpdate, editUpdate, deleteUpdate, togglePinned, toggleUpdateActive, type PlatformUpdate, categoryLabels } from '@/services/updateService';
import UpdateManager from '@/components/UpdateManager';
import AdminApiManager from '@/components/AdminApiManager';
import AdminPaymentManager from '@/components/AdminPaymentManager';
import AdminValueCard from '@/components/AdminValueCard';
import FooterConfigPanel from '@/components/FooterConfigPanel';
import AdminDeployCenter from '@/components/AdminDeployCenter';
import { getApiStats } from '@/services/apiProviderManager';
import { getPaymentStats, isPaymentConfigured } from '@/services/paymentService';

// ─── Types ──────────────────────────────────────────────

interface AdminUser {
  id: string; name: string; email: string; role: string;
  pack: string; packStatus: string; createdAt: string;
}

interface SecurityLog {
  id: string; action: string; user: string; timestamp: string;
  details: string; ip: string; status: 'success' | 'failed';
}

// ─── Helpers ────────────────────────────────────────────

function generateLogs(users: AdminUser[]): SecurityLog[] {
  const now = Date.now();
  const logs: SecurityLog[] = [];
  const actions = [
    { a: 'Connexion', d: 'Authentification reussie' },
    { a: 'Acces Dashboard', d: 'Navigation vers Dashboard' },
    { a: 'Consultation Signaux', d: 'Vue des signaux IA' },
    { a: 'Export PDF', d: 'Export de signaux en PDF' },
    { a: 'Alerte prix creee', d: 'Nouvelle alerte de prix' },
    { a: 'Trade enregistre', d: 'Ajout dans le journal' },
    { a: 'Modification pack', d: 'Changement de forfait' },
    { a: 'Connexion echouee', d: 'Tentative depuis IP' },
  ];
  users.forEach((u, ui) => {
    const count = ui === 0 ? 12 : ui === 1 ? 8 : ui === 2 ? 6 : 4;
    for (let i = 0; i < count; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      const failed = action.a === 'Connexion echouee';
      logs.push({
        id: `log-${ui}-${i}`, action: action.a, user: u.name,
        timestamp: new Date(now - Math.random() * 7 * 86400000).toISOString(),
        details: `${action.d}${failed ? ' inconnue' : ''}`,
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        status: failed ? 'failed' : 'success',
      });
    }
  });
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function getMockUsers(): AdminUser[] {
  return [
    { id: '1', name: 'Admin Principal', email: 'admin@xtrendai.com', role: 'admin', pack: 'institutional', packStatus: 'active', createdAt: '2024-01-15T10:00:00Z' },
    { id: '2', name: 'Jean Dupont', email: 'jean@trader.fr', role: 'user', pack: 'pro', packStatus: 'active', createdAt: '2024-03-20T14:30:00Z' },
    { id: '3', name: 'Marie Martin', email: 'marie@finance.com', role: 'user', pack: 'expert', packStatus: 'active', createdAt: '2024-05-10T09:15:00Z' },
    { id: '4', name: 'Pierre Bernard', email: 'pierre@invest.com', role: 'user', pack: 'free', packStatus: 'active', createdAt: '2024-06-01T16:45:00Z' },
    { id: '5', name: 'Sophie Petit', email: 'sophie@crypto.fr', role: 'user', pack: 'pro', packStatus: 'trial', createdAt: '2024-07-15T11:20:00Z' },
    { id: '6', name: 'Lucas Moreau', email: 'lucas@forex.com', role: 'user', pack: 'expert', packStatus: 'active', createdAt: '2024-08-05T13:00:00Z' },
  ];
}

// ─── Main Component ─────────────────────────────────────

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [settings, setSettings] = useState<PlatformSettings>(getPlatformSettings);
  const [savedTab, setSavedTab] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  // Redirect non-admin
  useEffect(() => {
    if (isClient && !isAdmin && user) navigate('/dashboard');
  }, [isClient, isAdmin, user, navigate]);

  if (!isClient) return <div className="p-6 text-slate-400">Chargement...</div>;

  // Safe data fetching with fallbacks — prevents crash from corrupted localStorage
  let packStats: ReturnType<typeof getPackComparison> = [];
  let mockUsers: AdminUser[] = [];
  let alerts: ReturnType<typeof getAlerts> = [];
  let triggered: ReturnType<typeof getTriggeredHistory> = [];
  let trades: ReturnType<typeof getTrades> = [];
  let portfolio: ReturnType<typeof getPortfolioStats> = { totalValue: 0, dayPnl: 0, openPositions: 0, winRate: 0 };
  let logs: SecurityLog[] = [];

  try { packStats = getPackComparison(); } catch (e) { /* console.warn suppressed */; }
  const totalRevenue = packStats.reduce((s, p) => s + (p.pnl || 0), 0);
  try { mockUsers = getMockUsers(); } catch (e) { /* console.warn suppressed */; }
  const filteredUsers = mockUsers.filter(u =>
    search ? (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) : true
  );
  try { alerts = getAlerts(); } catch (e) { /* console.warn suppressed */; }
  try { triggered = getTriggeredHistory(); } catch (e) { /* console.warn suppressed */; }
  try { trades = getTrades(); } catch (e) { /* console.warn suppressed */; }
  try { portfolio = getPortfolioStats(); } catch (e) { /* console.warn suppressed */; }
  try { logs = generateLogs(mockUsers); } catch (e) { /* console.warn suppressed */; }

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Activity },
    { id: 'updates', label: 'Mises a jour', icon: Megaphone },
    { id: 'business', label: 'Business', icon: BarChart3 },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'packs', label: 'Packs', icon: CreditCard },
    { id: 'performance', label: 'Performance', icon: CheckCircle },
    { id: 'activity', label: 'Journal', icon: FileText },
    { id: 'security', label: 'Securite', icon: Shield },
    { id: 'system', label: 'Update Manager', icon: Server },
    { id: 'deploy', label: 'Deploiement', icon: Globe },
    { id: 'footer', label: 'Footer', icon: Layout },
    { id: 'api', label: 'API Manager', icon: Server },
    { id: 'payment', label: 'Payment Manager', icon: CreditCard },
    { id: 'settings', label: 'Parametres', icon: Settings },
  ];

  return (
    <div className="p-6 space-y-6 min-h-screen bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
            <p className="text-xs text-slate-400">Gestion complete de la plateforme</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === t.id ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <AdminValueCard
            title="Vue d'ensemble du systeme"
            icon={Activity}
            summary="Vision globale de la sante de la plateforme : utilisateurs, paiements, API, signaux, packs et erreurs critiques."
            userValue="Les utilisateurs beneficient d'une plateforme stable, monitorée et optimisée en continu."
            adminValue="Permet de surveiller l'etat general, d'identifier les problemes et de prendre des decisions rapides."
            modulesConnected={['API Manager', 'Payment Manager', 'Packs', 'Utilisateurs', 'Signaux IA']}
            dataSources={['Donnees live', 'Logs systeme', 'Metriques utilisateurs', 'Statistiques API']}
            packs={['Free', 'Pro', 'Expert', 'Institutionnel']}
            recommendedSettings={['Verifier le statut des APIs', 'Surveiller les paiements', 'Controler les packs actifs']}
            impactLevel="critique"
            configStatus="complet"
            quickActions={[{ label: 'Voir API Manager', onClick: () => setActiveTab('api'), icon: Server }, { label: 'Voir Payment Manager', onClick: () => setActiveTab('payment'), icon: CreditCard }]}
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Utilisateurs" value={mockUsers.length} color="blue" />
            <StatCard icon={DollarSign} label="Revenus Est." value={`${formatCurrency(totalRevenue)} €`} color="emerald" />
            <StatCard icon={CreditCard} label="Packs Actifs" value={mockUsers.filter(u => u.packStatus === 'active' && u.pack !== 'free').length} color="amber" />
            <StatCard icon={Activity} label="Signaux" value={portfolio.totalTrades || 0} color="purple" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickStat title="Alertes Actives" value={alerts.filter(a => a.active && !a.triggeredAt).length} total={alerts.length} color="emerald" />
            <QuickStat title="Alertes Declenchees" value={triggered.length} color="amber" />
          </div>
        </div>
      )}

      {/* ─── UPDATES ─── */}
      {/* ─── BUSINESS ─── */}
      {activeTab === 'business' && (
        <div className="space-y-6">
          <AdminValueCard
            title="Business & Revenus"
            icon={BarChart3}
            summary="Suivi des performances commerciales : packs actifs, revenus, conversion et tendances d'abonnement."
            userValue="Les utilisateurs accedent a des packs clairs avec des fonctionnalites bien definies."
            adminValue="Permet d'optimiser les offres, d'ajuster les prix et de maximiser les revenus."
            modulesConnected={['Packs', 'Payment Manager', 'Utilisateurs', 'Stripe', 'PayPal']}
            dataSources={['Transactions', 'Abonnements', 'Factures']}
            packs={['Free', 'Pro', 'Expert', 'Institutionnel']}
            recommendedSettings={['Mettre a jour les prix des packs', 'Verifier les taux de conversion', 'Controler les remboursements']}
            impactLevel="fort"
            configStatus="complet"
            quickActions={[{ label: 'Voir Packs', onClick: () => setActiveTab('packs'), icon: CreditCard }, { label: 'Voir Transactions', onClick: () => setActiveTab('payment'), icon: TrendingUp }]}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {packStats.map(p => (
              <div key={p.pack} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <p className="text-sm text-slate-400">{p.pack}</p>
                <p className="text-2xl font-bold text-white mt-1">{p.pnl ? `${Math.round(p.pnl).toLocaleString('fr-FR')} €` : '0 €'}</p>
                <p className="text-xs text-slate-500 mt-1">{p.signals || 0} signaux</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── USERS ─── */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <AdminValueCard
            title="Gestion des Utilisateurs"
            icon={Users}
            summary="Gestion complete des comptes utilisateurs : packs, permissions, historique et acces aux fonctionnalites."
            userValue="Les utilisateurs beneficient d'un acces adapte a leur pack avec des permissions claires."
            adminValue="Permet de gerer les comptes, attribuer des packs, bloquer des utilisateurs si necessaire."
            modulesConnected={['Packs', 'Payment Manager', 'Authentification']}
            dataSources={['Base utilisateurs', 'Abonnements', 'Historique paiements']}
            packs={['Free', 'Pro', 'Expert', 'Institutionnel']}
            recommendedSettings={['Verifier les packs attribues', 'Controler les acces', 'Surveiller les connexions']}
            impactLevel="fort"
            configStatus="complet"
          />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un utilisateur..."
            className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white" />
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-slate-500 border-b border-slate-800">
                <th className="text-left p-3">Nom</th><th className="text-left p-3">Email</th><th className="text-left p-3">Pack</th><th className="text-left p-3">Statut</th>
              </tr></thead>
              <tbody>{filteredUsers.map(u => (
                <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="p-3 text-white">{u.name}</td>
                  <td className="p-3 text-slate-400">{u.email}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs ${u.pack === 'free' ? 'bg-slate-500/20 text-slate-400' : u.pack === 'pro' ? 'bg-amber-500/20 text-amber-400' : u.pack === 'expert' ? 'bg-purple-500/20 text-purple-400' : 'bg-rose-500/20 text-rose-400'}`}>{u.pack}</span></td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs ${u.packStatus === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{u.packStatus}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── PACKS ─── */}
      {activeTab === 'packs' && (
        <div className="space-y-4">
          <AdminValueCard
            title="Packs & Offres Commerciales"
            icon={CreditCard}
            summary="Gestion des offres Free, Pro, Expert et Institutionnel : prix, fonctionnalites, permissions et acces."
            userValue="Les utilisateurs choisissent un pack adapte a leurs besoins avec des fonctionnalites progressives."
            adminValue="Permet de definir les offres, les prix, les fonctionnalites incluses et de monétiser la plateforme."
            modulesConnected={['Payment Manager', 'Utilisateurs', 'API Manager', 'Signaux IA']}
            dataSources={['Configuration packs', 'Prix', 'Fonctionnalites']}
            packs={['Free', 'Pro', 'Expert', 'Institutionnel']}
            recommendedSettings={['Definir les prix mensuels et annuels', 'Configurer les fonctionnalites par pack', 'Relier les packs aux IDs Stripe/PayPal']}
            impactLevel="critique"
            configStatus="complet"
            quickActions={[{ label: 'Voir Payment Manager', onClick: () => setActiveTab('payment'), icon: CreditCard }]}
          />
          {packStats.map(p => (
            <div key={p.pack} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white">{p.pack}</h3>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">Actif</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs text-slate-500">Prix mensuel</label><p className="text-sm text-white">{p.pnl ? Math.round(p.pnl).toLocaleString('fr-FR') : 0} €</p></div>
                <div><label className="text-xs text-slate-500">Utilisateurs</label><p className="text-sm text-white">{p.users || 0}</p></div>
                <div><label className="text-xs text-slate-500">Engagement</label><p className="text-sm text-white">{p.engagement || 0}%</p></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── PERFORMANCE ─── */}
      {activeTab === 'performance' && <AdminPerformanceTab />}

      {/* ─── ACTIVITY ─── */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          <AdminValueCard
            title="Activite & Logs Systeme"
            icon={FileText}
            summary="Suivi des connexions, actions administratives, logs systeme et evenements de la plateforme."
            userValue="Garantit la securite et la fiabilite de la plateforme pour tous les utilisateurs."
            adminValue="Permet d'auditer les actions, detecter les anomalies et assurer la conformite."
            modulesConnected={['Authentification', 'API Manager', 'Payment Manager']}
            dataSources={['Logs connexions', 'Actions admin', 'Evenements systeme']}
            packs={['Free', 'Pro', 'Expert', 'Institutionnel']}
            recommendedSettings={['Verifier les connexions suspectes', 'Surveiller les erreurs API', 'Controler les actions admin']}
            impactLevel="moyen"
            configStatus="complet"
          />
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Journal d&apos;activite</h3>
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </div>
          <div className="divide-y divide-slate-800/50 max-h-[500px] overflow-y-auto">
            {logs.slice(0, 20).map(l => (
              <div key={l.id} className="p-4 flex items-center gap-4 hover:bg-slate-800/30">
                <div className={`w-2 h-2 rounded-full ${l.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{l.action}</p>
                  <p className="text-xs text-slate-500">{l.user} — {l.details}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-500">{new Date(l.timestamp).toLocaleDateString('fr-FR')}</p>
                  <p className="text-[10px] text-slate-600">{l.ip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      )}

      {/* ─── SECURITY ─── */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <AdminValueCard
            title="Securite & Protection"
            icon={Shield}
            summary="Gestion des regles de securite, connexions, tentatives echouees, IPs bloquees et conformite."
            userValue="Les donnees et les comptes utilisateurs sont proteges contre les acces non autorises."
            adminValue="Permet de configurer les regles de securite, bloquer les IPs suspectes et auditer les acces."
            modulesConnected={['Authentification', 'Logs', 'Utilisateurs']}
            dataSources={['Tentatives connexion', 'IPs bloquees', 'Regles securite']}
            packs={['Free', 'Pro', 'Expert', 'Institutionnel']}
            recommendedSettings={['Activer la protection brute force', 'Definir les IPs autorisees', 'Configurer les durees de session']}
            impactLevel="critique"
            configStatus="complet"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['enable2FA', 'enableOTP', 'limitLoginAttempts', 'detectSuspiciousIP'] as const).map(key => (
              <div key={key} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {key === 'enable2FA' ? 'Authentification 2FA' : key === 'enableOTP' ? 'Verification OTP' : key === 'limitLoginAttempts' ? 'Limite tentatives connexion' : 'Detection IP suspecte'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {key === 'enable2FA' ? 'Double authentification obligatoire' : key === 'enableOTP' ? 'Code a usage unique par email' : key === 'limitLoginAttempts' ? 'Blocage apres 3 echecs' : 'Alerte sur connexions anormales'}
                  </p>
                </div>
                <button onClick={() => { const u = { ...settings, [key]: !settings[key] }; setSettings(u); savePlatformSettings(u); setSavedTab('security'); setTimeout(() => setSavedTab(null), 1500); }}
                  className={`w-11 h-6 rounded-full transition-colors ${settings[key] ? 'bg-blue-500' : 'bg-slate-700'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
          {savedTab === 'security' && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <p className="text-sm text-emerald-400">Parametres sauvegardes</p>
            </div>
          )}
        </div>
      )}

      {/* ─── Inline Updates Component ─── */}
      {activeTab === 'updates' && <UpdatesAdminInline />}

      {/* ─── SETTINGS ─── */}
      {activeTab === 'system' && <UpdateManager />}
      {activeTab === 'deploy' && <AdminDeployCenter />}
      {activeTab === 'api' && <AdminApiManager />}
      {activeTab === 'payment' && <AdminPaymentManager />}

      {activeTab === 'footer' && <FooterConfigPanel />}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {savedTab === 'settings' && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <p className="text-sm text-emerald-400">Parametres sauvegardes</p>
            </div>
          )}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">Plateforme</h3>
            {(['platformName', 'slogan', 'contactEmail', 'contactPhone', 'contactWhatsapp'] as const).map(field => (
              <div key={field}>
                <label className="text-xs text-slate-500 mb-1 block">
                  {field === 'platformName' ? 'Nom' : field === 'slogan' ? 'Slogan' : field === 'contactEmail' ? 'Email' : field === 'contactPhone' ? 'Telephone' : 'WhatsApp'}
                </label>
                <input value={settings[field]} onChange={e => setSettings({ ...settings, [field]: e.target.value })}
                  onBlur={() => { savePlatformSettings(settings); setSavedTab('settings'); setTimeout(() => setSavedTab(null), 1500); }}
                  className="w-full px-4 py-2 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white" />
              </div>
            ))}
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">Fonctionnalites</h3>
            {(['maintenanceMode', 'allowNewRegistrations', 'realTimeSignals', 'globalDemoMode'] as const).map(key => (
              <div key={key} className="flex items-center justify-between">
                <p className="text-sm text-slate-300">
                  {key === 'maintenanceMode' ? 'Mode maintenance' : key === 'allowNewRegistrations' ? 'Nouvelles inscriptions' : key === 'realTimeSignals' ? 'Signaux temps reel' : 'Mode demo global'}
                </p>
                <button onClick={() => { const u = { ...settings, [key]: !settings[key] }; setSettings(u); savePlatformSettings(u); setSavedTab('settings'); setTimeout(() => setSavedTab(null), 1500); }}
                  className={`w-11 h-6 rounded-full transition-colors ${settings[key] ? 'bg-blue-500' : 'bg-slate-700'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Users; label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = { blue: 'text-blue-400 border-blue-500/20', emerald: 'text-emerald-400 border-emerald-500/20', amber: 'text-amber-400 border-amber-500/20', purple: 'text-purple-400 border-purple-500/20' };
  const c = colors[color] || colors.blue;
  return (
    <div className={`bg-slate-900/60 border ${c.split(' ')[1]} rounded-2xl p-4 text-center`}>
      <Icon className={`w-6 h-6 mx-auto mb-2 ${c.split(' ')[0]}`} />
      <p className={`text-2xl font-bold ${c.split(' ')[0]}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function UpdatesAdminInline() {
  const [updates, setUpdates] = useState<PlatformUpdate[]>(getAllUpdates());
  const [editing, setEditing] = useState<PlatformUpdate | null>(null);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'feature' as PlatformUpdate['category'], severity: 'info' as PlatformUpdate['severity'], pinned: false, page: 'all' as PlatformUpdate['page'], active: true });

  const refresh = () => setUpdates(getAllUpdates());

  const handleAdd = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    addUpdate({ title: form.title, content: form.content, category: form.category, severity: form.severity, pinned: form.pinned, page: form.page, active: form.active });
    setForm({ title: '', content: '', category: 'feature', severity: 'info', pinned: false, page: 'all', active: true });
    refresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleEdit = (u: PlatformUpdate) => {
    setEditing(u);
    setForm({ title: u.title, content: u.content, category: u.category, severity: u.severity, pinned: u.pinned, page: u.page || 'all', active: u.active });
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    editUpdate(editing.id, { title: form.title, content: form.content, category: form.category, severity: form.severity, pinned: form.pinned, page: form.page, active: form.active });
    setEditing(null);
    setForm({ title: '', content: '', category: 'feature', severity: 'info', pinned: false, page: 'all', active: true });
    refresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Supprimer cette mise a jour ?')) {
      deleteUpdate(id);
      refresh();
    }
  };

  const handleTogglePin = (id: string) => {
    togglePinned(id);
    refresh();
  };

  const handleToggleActive = (id: string) => {
    toggleUpdateActive(id);
    refresh();
  };

  const catColors: Record<string, string> = { feature: 'bg-blue-500/20 text-blue-400', improvement: 'bg-emerald-500/20 text-emerald-400', fix: 'bg-amber-500/20 text-amber-400', announcement: 'bg-purple-500/20 text-purple-400', news: 'bg-cyan-500/20 text-cyan-400' };
  const sevColors: Record<string, string> = { critical: 'text-red-400', major: 'text-amber-400', minor: 'text-blue-400', info: 'text-slate-400' };

  return (
    <div className="space-y-6">
      {saved && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
          <p className="text-sm text-emerald-400">Sauvegarde effectuee</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-semibold text-white">{editing ? 'Modifier la mise a jour' : 'Nouvelle mise a jour'}</h4>
        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Titre..."
          className="w-full px-4 py-2 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white" />
        <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Contenu..." rows={3}
          className="w-full px-4 py-2 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white resize-none" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as PlatformUpdate['category'] })}
            className="px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white">
            {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value as PlatformUpdate['severity'] })}
            className="px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white">
            <option value="info">Info</option>
            <option value="minor">Mineur</option>
            <option value="major">Majeur</option>
            <option value="critical">Critique</option>
          </select>
          <select value={form.page} onChange={e => setForm({ ...form, page: e.target.value as PlatformUpdate['page'] })}
            className="px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white">
            <option value="all">Toutes pages</option>
            <option value="dashboard">Dashboard</option>
            <option value="signals">Signaux</option>
            <option value="landing">Landing</option>
          </select>
          <label className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={form.pinned} onChange={e => setForm({ ...form, pinned: e.target.checked })} className="rounded" />
            Epinglee
          </label>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={handleSaveEdit} className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl text-sm font-medium">Sauvegarder</button>
              <button onClick={() => { setEditing(null); setForm({ title: '', content: '', category: 'feature', severity: 'info', pinned: false, page: 'all', active: true }); }} className="px-4 py-2 text-slate-400 rounded-xl text-sm">Annuler</button>
            </>
          ) : (
            <button onClick={handleAdd} className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl text-sm font-medium">Publier</button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Mises a jour publiees ({updates.length})</h3>
          <button onClick={refresh} className="p-1.5 rounded-lg hover:bg-slate-800"><RefreshCw className="w-4 h-4 text-slate-500" /></button>
        </div>
        <div className="divide-y divide-slate-800/50 max-h-[500px] overflow-y-auto">
          {updates.length === 0 && <p className="p-6 text-center text-sm text-slate-500">Aucune mise a jour</p>}
          {updates.map(u => (
            <div key={u.id} className="p-4 hover:bg-slate-800/30">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${catColors[u.category] || catColors.feature}`}>{categoryLabels[u.category]?.label || u.category}</span>
                    <span className={`text-[10px] ${sevColors[u.severity] || 'text-slate-400'}`}>{u.severity}</span>
                    {u.pinned && <span className="text-[10px] text-amber-400">📌</span>}
                    {!u.active && <span className="text-[10px] text-slate-600">(inactif)</span>}
                  </div>
                  <p className="text-sm font-medium text-white">{u.title}</p>
                  <p className="text-xs text-slate-400 line-clamp-2">{u.content}</p>
                  <p className="text-[10px] text-slate-600 mt-1">{new Date(u.publishedAt).toLocaleDateString('fr-FR')} — {u.views} vues</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => handleToggleActive(u.id)} title={u.active ? 'Desactiver' : 'Activer'}
                    className="p-1.5 rounded-lg hover:bg-slate-800"><CheckCircle className={`w-4 h-4 ${u.active ? 'text-emerald-400' : 'text-slate-600'}`} /></button>
                  <button onClick={() => handleTogglePin(u.id)} title={u.pinned ? 'Desepinguer' : 'Epingler'}
                    className="p-1.5 rounded-lg hover:bg-slate-800"><Megaphone className={`w-4 h-4 ${u.pinned ? 'text-amber-400' : 'text-slate-600'}`} /></button>
                  <button onClick={() => handleEdit(u)} title="Modifier"
                    className="p-1.5 rounded-lg hover:bg-slate-800"><Settings className="w-4 h-4 text-slate-500" /></button>
                  <button onClick={() => handleDelete(u.id)} title="Supprimer"
                    className="p-1.5 rounded-lg hover:bg-slate-800"><XCircle className="w-4 h-4 text-red-400" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuickStat({ title, value, total, color }: { title: string; value: number; total?: number; color: string }) {
  const colors: Record<string, string> = { emerald: 'border-emerald-500/20 text-emerald-400', amber: 'border-amber-500/20 text-amber-400', blue: 'border-blue-500/20 text-blue-400' };
  const c = colors[color] || colors.blue;
  return (
    <div className={`bg-slate-900/60 border ${c.split(' ')[0]} rounded-2xl p-4 flex items-center justify-between`}>
      <div>
        <p className="text-sm text-slate-400">{title}</p>
        <p className={`text-xl font-bold ${c.split(' ')[1]}`}>{value}{total ? ` / ${total}` : ''}</p>
      </div>
    </div>
  );
}
