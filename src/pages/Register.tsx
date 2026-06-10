import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import {
  Zap, Shield, Check, CreditCard, Loader2, ArrowRight,
  User, Crown, Gem, Building2, AlertTriangle, Eye, EyeOff,
  ChevronLeft, Sparkles
} from 'lucide-react';

const PACKS = [
  {
    slug: 'free' as const,
    name: 'Free',
    color: 'from-slate-600 to-slate-700',
    border: 'border-slate-700',
    activeBorder: 'border-blue-500',
    icon: User,
    priceMonthly: '0',
    priceYearly: '0',
    description: 'Pour decouvrir la plateforme',
    features: ['Signaux IA de base', 'Calendrier economique', 'Analyse technique', '1 actif en simultane'],
  },
  {
    slug: 'pro' as const,
    name: 'Pro',
    color: 'from-amber-500 to-orange-600',
    border: 'border-amber-700/50',
    activeBorder: 'border-amber-500',
    icon: Crown,
    priceMonthly: '79',
    priceYearly: '790',
    description: 'Pour traders serieux',
    features: ['Tout Free +', 'XAU/USD Premium', 'Radar Opportunites', 'Simulateur Trading', '6 actifs simultanes'],
    recommended: true,
  },
  {
    slug: 'expert' as const,
    name: 'Expert',
    color: 'from-purple-500 to-indigo-600',
    border: 'border-purple-700/50',
    activeBorder: 'border-purple-500',
    icon: Gem,
    priceMonthly: '199',
    priceYearly: '1990',
    description: 'Pour traders avances',
    features: ['Tout Pro +', 'Smart Money Tracker', 'Assistant IA Trading', 'Labo Strategies (Backtest)', 'Tous les actifs'],
  },
  {
    slug: 'institutional' as const,
    name: 'Institutionnel',
    color: 'from-rose-500 to-pink-600',
    border: 'border-rose-700/50',
    activeBorder: 'border-rose-500',
    icon: Building2,
    priceMonthly: '499',
    priceYearly: '4990',
    description: 'Pour institutions',
    features: ['Tout Expert +', 'API Center & Webhooks', 'Support prioritaire', 'Multi-comptes', 'Export CSV/PDF'],
  },
];

export default function Register() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user, register, registerError } = useAuth();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPack, setSelectedPack] = useState<'free' | 'pro' | 'expert' | 'institutional'>('pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading && user) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  // Sync registerError from hook
  useEffect(() => {
    if (registerError) {
      setLocalError(registerError);
      setIsSubmitting(false);
    }
  }, [registerError]);

  // ─── Handle registration ────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Validation
    if (!name.trim() || name.trim().length < 2) {
      setLocalError("Le nom doit contenir au moins 2 caracteres.");
      return;
    }
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setLocalError("Veuillez entrer un email valide.");
      return;
    }
    if (!password || password.length < 6) {
      setLocalError("Le mot de passe doit contenir au moins 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password, selectedPack);
    } finally {
      setIsSubmitting(false);
    }
  };

  const packData = PACKS.find((p) => p.slug === selectedPack);
  const price = billingCycle === 'yearly' ? packData?.priceYearly : packData?.priceMonthly;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-blue-600/10 to-purple-600/10 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1)_0%,transparent_70%)]" />
        <div className="relative max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Rejoignez<br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">XTrendAI Pro</span>
          </h2>
          <p className="text-slate-400">Commencez votre parcours de trading avec l'intelligence artificielle.</p>
          <div className="mt-8 space-y-3">
            {['Signaux IA en temps reel', 'Analyse multi-timeframes', 'Gestion du risque avancee', 'Donnees marche 100% live'].map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                <Check className="w-4 h-4 text-emerald-400" /> {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-start justify-center p-6 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg py-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">XTrendAI Pro</span>
          </div>

          <button onClick={() => navigate('/')} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 mb-4 transition-colors">
            <ChevronLeft className="w-3 h-3" /> Retour au site
          </button>

          <h1 className="text-2xl font-bold mb-2">Creer votre compte</h1>
          <p className="text-sm text-slate-400 mb-6">Inscrivez-vous pour acceder a la plateforme</p>

          {/* ─── Error Message ──────────────────────────── */}
          <AnimatePresence>
            {localError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">{localError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Registration Form ──────────────────────── */}
          <form onSubmit={handleRegister} className="space-y-4 mb-6">
            {/* Name */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Nom complet</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jean Dupont"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jean@email.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Mot de passe (min. 6 caracteres)</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full px-4 py-3 pr-10 rounded-xl bg-slate-800/60 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Confirmer le mot de passe</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {/* ─── Pack Selection ─────────────────────── */}
            <div className="pt-2">
              <label className="text-xs text-slate-500 mb-2 block flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Choisir votre pack
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PACKS.map((p) => (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => setSelectedPack(p.slug)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedPack === p.slug
                        ? `bg-gradient-to-r ${p.color} ${p.activeBorder} border-2`
                        : `bg-slate-800/40 ${p.border} border hover:bg-slate-800/60`
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <p.icon className={`w-4 h-4 ${selectedPack === p.slug ? 'text-white' : 'text-slate-400'}`} />
                      <span className={`text-sm font-semibold ${selectedPack === p.slug ? 'text-white' : 'text-slate-300'}`}>
                        {p.name}
                      </span>
                      {p.recommended && (
                        <span className="ml-auto px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px]">TOP</span>
                      )}
                    </div>
                    <p className={`text-xs ${selectedPack === p.slug ? 'text-white/70' : 'text-slate-500'}`}>{p.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Billing cycle (paid packs only) ────── */}
            {selectedPack !== 'free' && (
              <div className="p-1 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    billingCycle === 'monthly' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400'
                  }`}
                >
                  Mensuel
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    billingCycle === 'yearly' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400'
                  }`}
                >
                  Annuel <span className="text-xs text-emerald-400">-17%</span>
                </button>
              </div>
            )}

            {/* ─── Summary ────────────────────────────── */}
            {selectedPack !== 'free' && packData && (
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Pack</span>
                  <span className="text-sm font-semibold text-white">{packData.name}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Cycle</span>
                  <span className="text-sm text-white capitalize">{billingCycle === 'yearly' ? 'Annuel' : 'Mensuel'}</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Total</span>
                  <span className="text-lg font-bold text-emerald-400">{price} EUR</span>
                </div>
              </div>
            )}

            {/* ─── Submit ─────────────────────────────── */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creation du compte...
                </>
              ) : selectedPack === 'free' ? (
                <>
                  <Shield className="w-5 h-5" />
                  Commencer Gratuitement
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  S'inscrire — {price} EUR
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="text-sm text-slate-500 text-center">
            Deja un compte ?{' '}
            <button onClick={() => navigate('/login')} className="text-blue-400 hover:text-blue-300 transition-colors">
              Se connecter
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
