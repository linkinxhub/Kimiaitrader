import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Calendar,
  History,
  Settings,
  Shield,
  ShieldAlert,
  CreditCard,
  LogOut,
  Menu,
  X,
  Diamond,
  Radar,
  Scan,
  MessageSquare,
  Newspaper,
  FlaskConical,
  Building2,
  Target,
  Globe,
  Webhook,
  Gamepad2,
  Zap,
  Bell,
  BookOpen,
  Split,
  ScanLine,
  Download,
  Moon,
  Sun,
  Link2,
  Activity,
  Clock,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { useMarketData } from '@/hooks/useMarketData';
import { useAISignals } from '@/hooks/useAISignals';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/useToast';
import { useLiveAlerts } from '@/hooks/useLiveAlerts';
import PriorityNotification, { AlertToast } from '@/components/PriorityNotification';
import SmartFooter from '@/components/SmartFooter';

interface NavItem {
  icon: React.ElementType;
  label: string;
  id: string;
  path: string;
  badge?: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard', path: '/dashboard' },
  { icon: Diamond, label: 'XAU/USD Premium', id: 'xauusd', path: '/xauusd', badge: 'PRO' },
  { icon: TrendingUp, label: 'Signaux IA', id: 'signals', path: '/signals' },
  { icon: Radar, label: 'Radar Opportunités', id: 'radar', path: '/radar', badge: 'PRO' },
  { icon: Scan, label: 'Smart Money', id: 'smartmoney', path: '/smart-money', badge: 'EXPERT' },
  { icon: MessageSquare, label: 'Assistant IA', id: 'aiassistant', path: '/ai-assistant', badge: 'EXPERT' },
  { icon: Newspaper, label: 'Centre Intelligence', id: 'intelligence', path: '/intelligence' },
  { icon: BookOpen, label: 'Strategies de Trading', id: 'strategies', path: '/strategies', badge: 'PRO' },
  { icon: Building2, label: 'Comparateur Institutionnel', id: 'institutional', path: '/institutional-comparator', badge: 'PRO' },
  { icon: Target, label: 'Centre Decision Rentabilite', id: 'decisioncenter', path: '/decision-center', badge: 'PRO' },
  { icon: FlaskConical, label: 'Labo Stratégies', id: 'strategylab', path: '/strategy-lab', badge: 'EXPERT' },
  { icon: Gamepad2, label: 'Simulateur', id: 'simulator', path: '/simulator', badge: 'PRO' },
  { icon: BarChart3, label: 'Analyse Technique', id: 'technical', path: '/technical' },
  { icon: Activity, label: 'Sentiment & Volatilité', id: 'sentiment', path: '/sentiment', badge: 'NEW' },
  { icon: Calendar, label: 'Calendrier Éco', id: 'calendar', path: '/calendar' },
  { icon: Newspaper, label: 'Centre News IA', id: 'newscenter', path: '/news-center', badge: 'NEW' },
  { icon: History, label: 'Historique', id: 'history', path: '/history' },
  { icon: Shield, label: 'Gestion Risque', id: 'risk', path: '/risk' },
  // NEW: High priority features
  { icon: Bell, label: 'Alertes Prix', id: 'alerts', path: '/alerts', badge: 'NEW' },
  { icon: BookOpen, label: 'Journal Trading', id: 'portfolio', path: '/portfolio', badge: 'NEW' },
  // NEW: Medium priority features
  { icon: Split, label: 'Multi-Actifs', id: 'multiasset', path: '/multi-asset', badge: 'PRO' },
  { icon: ScanLine, label: 'Scanner Marché', id: 'scanner', path: '/scanner', badge: 'PRO' },
  // NEW: Low priority features
  { icon: Download, label: 'Export MT4/5', id: 'mtexport', path: '/mt-export', badge: 'EXPERT' },
  { icon: CreditCard, label: 'Abonnement', id: 'subscription', path: '/subscription' },
  { icon: ShieldAlert, label: 'Admin Panel', id: 'admin', path: '/admin', badge: 'ADMIN', adminOnly: true },
  { icon: Shield, label: 'Sécurité', id: 'security', path: '/admin/security', badge: 'ADMIN', adminOnly: true },
  { icon: Webhook, label: 'API Center', id: 'apicenter', path: '/api-center', badge: 'ADMIN', adminOnly: true },
  { icon: Link2, label: 'OANDA API', id: 'oanda', path: '/oanda', badge: 'BROKER' },
  { icon: Settings, label: 'Paramètres', id: 'settings', path: '/settings' },
];

// ─── Market Status Bar ────────────────────────────────────
// Replaces fake balance with real-time market indicators

function MarketStatusBar() {
  const { prices } = useMarketData();
  const { signals } = useAISignals();
  const [now, setNow] = useState(new Date());

  // Update clock every minute
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Market open/close (Forex: open Sun 22h GMT, close Fri 22h GMT)
  const day = now.getDay(); // 0=Sun, 6=Sat
  const hour = now.getUTCHours();
  const isWeekend = day === 6 || (day === 0 && hour < 22) || (day === 5 && hour >= 22);
  const isOpen = !isWeekend;

  // Sentiment: count buy vs sell signals
  const buySignals = signals.filter(s => s.signal === 'ACHAT').length;
  const sellSignals = signals.filter(s => s.signal === 'VENTE').length;
  const totalSignals = buySignals + sellSignals;
  const sentimentPct = totalSignals > 0 ? Math.round((buySignals / totalSignals) * 100) : 50;
  const sentimentLabel = sentimentPct > 55 ? 'Haussier' : sentimentPct < 45 ? 'Baissier' : 'Neutre';
  const sentimentColor = sentimentPct > 55 ? 'text-emerald-400' : sentimentPct < 45 ? 'text-red-400' : 'text-amber-400';
  const sentimentBg = sentimentPct > 55 ? 'bg-emerald-500/10 border-emerald-500/20' : sentimentPct < 45 ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20';

  // Average volatility from price changes
  const priceEntries = Object.entries(prices);
  const avgChange = priceEntries.length > 0
    ? priceEntries.reduce((sum, [, p]) => sum + (Math.abs(p.change24hPercent || 0)), 0) / priceEntries.length
    : 0;
  const volLabel = avgChange > 3 ? 'Élevée' : avgChange > 1.5 ? 'Modérée' : 'Faible';
  const volColor = avgChange > 3 ? 'text-red-400' : avgChange > 1.5 ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div className="flex items-center gap-2">
      {/* Market Open/Closed */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700">
        <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
        <span className="text-xs text-slate-400">
          {isOpen ? 'Marché Ouvert' : 'Marché Fermé'}
        </span>
        <Clock className="w-3 h-3 text-slate-500" />
        <span className="text-[10px] text-slate-500 font-mono">
          {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Sentiment */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${sentimentBg}`}>
        {sentimentPct > 55 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> :
         sentimentPct < 45 ? <TrendingDown className="w-3.5 h-3.5 text-red-400" /> :
         <Minus className="w-3.5 h-3.5 text-amber-400" />}
        <span className={`text-xs font-bold ${sentimentColor}`}>{sentimentLabel}</span>
        <span className="text-[10px] text-slate-500">{sentimentPct}%</span>
      </div>

      {/* Volatility */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700">
        <Activity className={`w-3.5 h-3.5 ${volColor}`} />
        <span className="text-xs text-slate-400">Vol</span>
        <span className={`text-xs font-bold ${volColor}`}>{volLabel}</span>
      </div>

      {/* Signal count */}
      {totalSignals > 0 && (
        <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700">
          <span className="text-xs text-slate-400">Signaux</span>
          <span className="text-xs font-bold text-white">{totalSignals}</span>
          <span className="text-[10px] text-emerald-400">{buySignals}</span>
          <span className="text-[10px] text-slate-600">/</span>
          <span className="text-[10px] text-red-400">{sellSignals}</span>
        </div>
      )}
    </div>
  );
}

export const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();
  useLiveAlerts(); // Global live alert monitoring — runs once for entire app
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isAdmin = user?.role === "admin";

  // Get user pack for display
  const userPack = (user?.pack || 'free') as string;
  const packLabels: Record<string, string> = {
    free: 'Free', pro: 'Pro', expert: 'Expert', institutional: 'Institutionnel'
  };
  const packColors: Record<string, string> = {
    free: 'text-slate-400', pro: 'text-amber-400', expert: 'text-purple-400', institutional: 'text-rose-400'
  };
  const packBgColors: Record<string, string> = {
    free: 'bg-slate-500/20', pro: 'bg-amber-500/20', expert: 'bg-purple-500/20', institutional: 'bg-rose-500/20'
  };
  const initials = (user?.name || 'TR').slice(0, 2).toUpperCase();

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const isAdminPage = location.pathname === '/admin';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // ─── Scroll to top on route change ────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Also scroll the main content area
    const mainContent = document.getElementById('main-content');
    if (mainContent) mainContent.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const visibleNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  const handleNavClick = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const mainContent = document.getElementById('main-content');
    if (mainContent) mainContent.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-900/90 border-r border-slate-800 flex flex-col overflow-hidden z-30"
          >
            <div className="p-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  AITrade Pro
                </h1>
                <p className="text-xs text-slate-500">Plateforme IA</p>
              </div>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
              {visibleNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                    isActive(item.path)
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  {isActive(item.path) && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-r-full" />
                  )}
                  <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'text-blue-400' : 'text-slate-500 group-hover:text-white'}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400 font-medium">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-slate-800">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/60">
                <div className={`w-8 h-8 rounded-full ${packBgColors[userPack] || 'bg-slate-500/20'} flex items-center justify-center text-xs font-bold`}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.name || 'Trader'}</p>
                  <p className={`text-xs ${packColors[userPack] || 'text-slate-400'}`}>
                    Plan {packLabels[userPack] || 'Free'}
                    {!isAuthenticated && <span className="text-slate-500 ml-1">(Local)</span>}
                  </p>
                </div>
              </div>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 mt-2 text-slate-500 hover:text-red-400 transition-colors">
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Déconnexion</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <div id="main-content" className="flex-1 flex flex-col overflow-y-auto scroll-smooth">
        <header className="h-16 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between px-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5 text-slate-400" /> : <Menu className="w-5 h-5 text-slate-400" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm text-emerald-400 font-medium">Marché Ouvert</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Priority Alert Notification */}
            <PriorityNotification />

            {/* Theme Toggle */}
            <button
              onClick={() => {
                toggleTheme();
                addToast(`Mode ${theme === 'dark' ? 'clair' : 'sombre'} activé`, 'info', 2000);
              }}
              className="p-2 rounded-xl bg-slate-800/60 border border-slate-700 hover:bg-slate-700 transition-colors"
              title={`Mode ${theme === 'dark' ? 'sombre' : 'clair'}`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
            </button>
            {isAdminPage && (
              <button
                onClick={() => window.open('/', '_blank')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400 hover:bg-blue-500/20 transition-colors"
              >
                <Globe className="w-4 h-4" /> Voir le site
              </button>
            )}
            {/* Market Status — replaces fake balance with real market info */}
            <MarketStatusBar />
            {/* User Avatar with Pack Badge — Dropdown */}
            <div className="relative group">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white cursor-pointer hover:scale-110 transition-transform ring-2 ${
                (user?.pack as string) === 'pro' ? 'ring-amber-400/60' :
                (user?.pack as string) === 'expert' ? 'ring-purple-400/60' :
                'ring-slate-400/40'
              } ${packBgColors[(user?.pack as string) || 'free']}`}>
                {initials}
              </div>
              {/* Dropdown on hover */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[300]">
                <div className="p-3 border-b border-slate-800">
                  <p className="text-sm font-bold text-white truncate">{user?.name || 'Trader Pro'}</p>
                  <p className="text-xs text-slate-500">{user?.email || ''}</p>
                </div>
                <div className="p-2 space-y-1">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${packBgColors[(user?.pack as string) || 'free']}`}>
                    <span className={`w-2 h-2 rounded-full ${
                      (user?.pack as string) === 'pro' ? 'bg-amber-400' :
                      (user?.pack as string) === 'expert' ? 'bg-purple-400' :
                      'bg-slate-400'
                    }`} />
                    <span className={`text-xs font-bold ${packColors[(user?.pack as string) || 'free']}`}>
                      Pack {packLabels[(user?.pack as string) || 'free']}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Se déconnecter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* Smart Footer — configurable via admin */}
        <SmartFooter />

        {/* Floating Alert Toast for Critical/High alerts */}
        <AlertToast />
      </div>
    </div>
  );
};
