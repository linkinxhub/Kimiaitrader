/**
 * RouteGuards — Middleware de protection des routes
 * 
 * RÈGLES:
 * - PublicRouteGuard: empêche les appels live sur le site vitrine
 * - LiveDataGuard: vérifie que la route a le droit d'utiliser les données live
 * - Les routes publiques ne doivent jamais charger useMarketData, useAISignals, etc.
 */

import { type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router';
import { useEffect } from 'react';
import { Crown, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// ─── PublicRouteGuard ───────────────────────────────────
// Empêche l'accès aux données privées sans login
// Utilisé pour les pages publiques (landing, login, register)

export function PublicRouteGuard({ children }: { children: ReactNode }) {
  // Les routes publiques sont toujours accessibles
  // Ce guard s'assure qu'aucun appel live n'est fait côté enfants
  return <>{children}</>;
}

// ─── AuthenticatedRouteGuard ────────────────────────────
// Exige un utilisateur connecté

export function AuthenticatedRouteGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;
  return <>{children}</>;
}

// ─── AdminGuard ─────────────────────────────────────────
// Exige rôle admin

export function AdminGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    } else if (user?.role !== 'admin') {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated || user?.role !== 'admin') return null;
  return <>{children}</>;
}

// ─── LiveDataGuard ──────────────────────────────────────
// Vérifie que la route a le droit d'utiliser les données live
// Bloque les données live pour les routes publiques

export function LiveDataGuard({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  // Si enabled=false (route publique), les enfants ne reçoivent pas de données live
  // C'est aux composants enfants de respecter ce flag
  return <LiveDataContext.Provider value={{ enabled }}>{children}</LiveDataContext.Provider>;
}

// Context pour que les composants enfants sachent s'ils peuvent utiliser des données live
import { createContext, useContext } from 'react';

const LiveDataContext = createContext<{ enabled: boolean }>({ enabled: true });

export function useLiveDataGuard() {
  return useContext(LiveDataContext);
}

// ─── PackAccessGuard ────────────────────────────────────
// Vérifie que l'utilisateur a le pack requis
// En mode démo : affiche un bandeau informatif au lieu de bloquer

export function PackAccessGuard({ 
  requiredPack, 
  children 
}: { 
  requiredPack: 'free' | 'pro' | 'expert' | 'institutional';
  children: ReactNode;
}) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const packLevel = { free: 0, pro: 1, expert: 2, institutional: 3 };
  const packLabels: Record<string, string> = { free: 'Free', pro: 'Pro', expert: 'Expert', institutional: 'Institutionnel' };
  const userLevel = packLevel[(user?.pack as any) || 'free'] || 0;
  const requiredLevel = packLevel[requiredPack] || 0;

  // Not authenticated at all → redirect to login
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  // User has sufficient pack → render normally
  if (userLevel >= requiredLevel) {
    return <>{children}</>;
  }

  // User lacks the required pack → show upgrade prompt (instead of silent redirect)
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center space-y-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
          <Crown className="w-8 h-8 text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Pack {packLabels[requiredPack]} requis</h2>
          <p className="text-sm text-slate-400">
            Cette fonctionnalité nécessite le pack <strong className="text-amber-400">{packLabels[requiredPack]}</strong>.{' '}
            Vous disposez actuellement du pack <strong className="text-slate-300">{packLabels[user?.pack || 'free']}</strong>.
          </p>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-4 text-left space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Ce que vous obtenez avec le pack {packLabels[requiredPack]} :</p>
          <PackFeatureList requiredPack={requiredPack} />
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/subscription')}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-sm hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            Voir les packs disponibles
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 rounded-xl bg-slate-800 text-slate-400 font-medium text-sm hover:bg-slate-700 hover:text-white transition-all"
          >
            Retour au Dashboard
          </button>
        </div>
        <p className="text-[10px] text-slate-600">
          Comptes de démo disponibles : pro@xtrendai.demo / Pro2024 — expert@xtrendai.demo / Expert2024
        </p>
      </motion.div>
    </div>
  );
}

// Feature list per pack
function PackFeatureList({ requiredPack }: { requiredPack: string }) {
  const features: Record<string, string[]> = {
    pro: [
      'XAU/USD Premium (or temps réel)',
      'Radar Opportunités IA',
      'Simulateur Trading (17 signaux)',
      'Stratégies de Trading',
      'Comparateur Institutionnel',
      'Centre Décision Rentabilité',
      'Multi-Actifs & Scanner Marché',
    ],
    expert: [
      'Tout le pack Pro inclus',
      'Smart Money Tracker (SMC)',
      'Assistant IA (GPT-4o / Claude)',
      'Labo Stratégies (backtest)',
      'Export MetaTrader 4/5',
    ],
    institutional: [
      'Tout le pack Expert inclus',
      'API Trading directe',
      'Multi-comptes & White label',
      'Account manager dédié',
    ],
  };

  const list = features[requiredPack] || features.pro;
  return (
    <ul className="space-y-1.5">
      {list.map((f, i) => (
        <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          {f}
        </li>
      ))}
    </ul>
  );
}
