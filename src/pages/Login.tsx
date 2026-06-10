import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import {
  Zap, Shield, Clock, Globe, Sparkles,
  User, Crown, Gem, Building2, ShieldCheck,
  ArrowRight, ChevronDown, ChevronUp, Eye, EyeOff,
  AlertTriangle, Check, LogOut, Lock, ShieldAlert,
  Timer
} from 'lucide-react';
import {
  getAttemptState,
  recordFailedAttempt,
  recordSuccessfulAttempt,
  formatLockoutTime,
  type AttemptState,
} from '@/services/pinSecurityService';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user, login, quickLogin, adminPinLogin, logout, loginError } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Show test accounts
  const [showAccounts, setShowAccounts] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // Admin PIN state
  const [adminPin, setAdminPin] = useState('');
  const [showPinPad, setShowPinPad] = useState(false);
  const [attemptState, setAttemptState] = useState<AttemptState>(getAttemptState);
  const [pinError, setPinError] = useState<string | null>(null);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);

  // Note: On ne redirige plus automatiquement pour permettre le changement de compte

  // Lockout countdown timer
  useEffect(() => {
    if (attemptState.isLocked && attemptState.remainingLockoutSeconds > 0) {
      setLockoutTimer(attemptState.remainingLockoutSeconds);
      const interval = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setAttemptState(getAttemptState());
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [attemptState.isLocked, attemptState.remainingLockoutSeconds]);

  // Sync loginError from hook
  useEffect(() => {
    if (loginError) setLocalError(loginError);
  }, [loginError]);

  // ─── Handle email/password login ────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim() || !email.includes('@')) {
      setLocalError("Veuillez entrer un email valide.");
      return;
    }
    if (!password.trim()) {
      setLocalError("Veuillez entrer votre mot de passe.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Handle quick test login ────────────────────────────
  const handleQuickLogin = async (account: 'free' | 'pro' | 'expert' | 'institutional' | 'admin') => {
    setLocalError(null);
    setIsSubmitting(true);
    try {
      await quickLogin(account);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Handle admin PIN ───────────────────────────────────
  const handlePinDigit = async (digit: string) => {
    // Check if locked
    const currentState = getAttemptState();
    if (currentState.isLocked) {
      setAttemptState(currentState);
      return;
    }

    if (adminPin.length < 6) {
      const newPin = adminPin + digit;
      setAdminPin(newPin);
      setPinError(null);

      if (newPin.length === 6) {
        setIsSubmitting(true);
        try {
          const success = await adminPinLogin(newPin);
          if (!success) {
            // Record failed attempt
            const newState = recordFailedAttempt(newPin);
            setAttemptState(newState);

            if (newState.isLocked) {
              setPinError(`3 tentatives échouées. Accès bloqué pendant ${formatLockoutTime(newState.remainingLockoutSeconds)}.`);
            } else {
              const remaining = 3 - newState.count;
              setPinError(`Code PIN incorrect. ${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}.`);
            }

            setAdminPin('');
          } else {
            // Success - clear attempts
            recordSuccessfulAttempt();
            setAttemptState(getAttemptState());
          }
        } finally {
          setIsSubmitting(false);
        }
      }
    }
  };

  const handlePinBackspace = () => {
    setAdminPin(adminPin.slice(0, -1));
    setPinError(null);
  };

  const handlePinClear = () => {
    setAdminPin('');
    setPinError(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600/10 to-purple-600/10 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1)_0%,transparent_70%)]" />
        <div className="relative max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Bienvenue sur<br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">XTrendAI Pro</span>
          </h2>
          <p className="text-slate-400 mb-8">La plateforme de trading propulsee par l'intelligence artificielle.</p>
          <div className="space-y-3">
            {[
              { icon: Shield, text: 'Authentification securisee avec validation' },
              { icon: Clock, text: 'Signaux IA 24h/24 en temps reel' },
              { icon: Globe, text: '4 APIs connectees (Binance, Frankfurter, Currency-API)' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                <item.icon className="w-4 h-4 text-blue-400" /> {item.text}
              </div>
            ))}
          </div>

          {/* Test accounts info */}
          <div className="mt-8 p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl">
            <p className="text-xs text-slate-500 mb-2 flex items-center gap-2">
              <Eye className="w-3 h-3" /> Comptes de test disponibles
            </p>
            <div className="flex flex-wrap gap-2">
              {['Free', 'Pro', 'Expert', 'Institutionnel', 'Admin'].map((label) => (
                <span key={label} className="px-2 py-1 rounded-md bg-slate-700/50 text-xs text-slate-400">{label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Login */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">XTrendAI Pro</span>
          </div>

          <h1 className="text-2xl font-bold mb-2">Portail de Connexion</h1>
          <p className="text-sm text-slate-400 mb-6">Connectez-vous avec vos identifiants valides</p>

          {/* ─── Already Connected ──────────────────────── */}
          {isAuthenticated && user && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20"
            >
              <div className="flex items-center gap-3 mb-2">
                <User className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-sm text-white font-medium">{user.name || 'Utilisateur'}</p>
                  <p className="text-xs text-slate-400">{user.email} — Pack: <span className="text-blue-400 capitalize">{user.pack}</span></p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/30 transition-colors"
                >
                  Aller au Dashboard
                </button>
                <button
                  onClick={() => { logout(); window.location.reload(); }}
                  className="py-2 px-3 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" /> Changer de compte
                </button>
              </div>
            </motion.div>
          )}

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

          {/* ─── Login Form ─────────────────────────────── */}
          <form onSubmit={handleLogin} className="space-y-3 mb-6">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
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
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-sm hover:shadow-xl hover:shadow-blue-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Se connecter
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-600">comptes de test</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* ─── Quick Access Test Accounts ───────────── */}
          <div className="space-y-2 mb-6">
            <button
              onClick={() => setShowAccounts(!showAccounts)}
              className="w-full flex items-center justify-between py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Acces Rapide — Comptes de Test
              </span>
              {showAccounts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {showAccounts && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  {[
                    { slug: 'free' as const, name: 'Free', color: 'from-slate-600 to-slate-700', icon: User, desc: 'Signaux de base, calendrier eco, analyse technique', email: 'free@xtrendai.demo', pass: 'Free2024' },
                    { slug: 'pro' as const, name: 'Pro', color: 'from-amber-500 to-orange-600', icon: Crown, desc: 'XAU/USD Premium, Radar, Simulateur', email: 'pro@xtrendai.demo', pass: 'Pro2024' },
                    { slug: 'expert' as const, name: 'Expert', color: 'from-purple-500 to-indigo-600', icon: Gem, desc: 'Smart Money, Assistant IA, Labo Strategies', email: 'expert@xtrendai.demo', pass: 'Expert2024' },
                    { slug: 'institutional' as const, name: 'Institutionnel', color: 'from-rose-500 to-pink-600', icon: Building2, desc: 'Tout + API Center, webhooks, support dedie', email: 'institutional@xtrendai.demo', pass: 'Institutional2024' },
                  ].map((p) => (
                    <button
                      key={p.slug}
                      onClick={() => handleQuickLogin(p.slug)}
                      className={`w-full py-3 px-4 rounded-xl bg-gradient-to-r ${p.color} text-white hover:shadow-lg hover:scale-[1.02] transition-all flex items-center gap-3 group text-left`}
                    >
                      <p.icon className="w-5 h-5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{p.name}</span>
                          <span className="text-[10px] opacity-60 bg-white/10 px-1.5 py-0.5 rounded-full">TEST</span>
                        </div>
                        <p className="text-[11px] opacity-70 mt-0.5">{p.desc}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ─── Admin Access (PIN Code) ────────────────── */}
          <div className="space-y-2 mb-6">
            <button
              onClick={() => { setShowAdmin(!showAdmin); setShowPinPad(false); setAdminPin(''); }}
              className="w-full flex items-center justify-between py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Acces Administrateur
              </span>
              {showAdmin ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {showAdmin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {!showPinPad ? (
                    <button
                      onClick={() => setShowPinPad(true)}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02] transition-all flex items-center gap-3 group text-left"
                    >
                      <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">Super Admin</span>
                          <span className="text-[10px] opacity-60 bg-white/10 px-1.5 py-0.5 rounded-full">FULL</span>
                        </div>
                        <p className="text-[11px] opacity-70 mt-0.5">Acces securise par code PIN a 6 chiffres</p>
                      </div>
                      <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </button>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/20">
                      <p className="text-xs text-slate-400 text-center mb-2">Entrez le code PIN a 6 chiffres</p>

                      {/* Attempt counter */}
                      {!attemptState.isLocked && attemptState.count > 0 && (
                        <div className="mb-2 flex justify-center">
                          <span className="px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            {3 - attemptState.count} tentative{(3 - attemptState.count) > 1 ? 's' : ''} restante{(3 - attemptState.count) > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}

                      {/* Lockout message */}
                      {attemptState.isLocked && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center"
                        >
                          <ShieldAlert className="w-5 h-5 text-red-400 mx-auto mb-1" />
                          <p className="text-xs text-red-400 font-semibold">Accès bloqué</p>
                          <p className="text-[11px] text-red-400/70">3 tentatives échouées</p>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <Timer className="w-3 h-3 text-amber-400" />
                            <span className="text-xs text-amber-400 font-mono">{formatLockoutTime(lockoutTimer)}</span>
                          </div>
                        </motion.div>
                      )}

                      {/* PIN Display */}
                      <div className="flex justify-center gap-2 mb-4">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`w-10 h-12 rounded-lg flex items-center justify-center text-lg font-bold transition-all ${
                              i < adminPin.length
                                ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                                : 'bg-slate-800 border-2 border-slate-700 text-slate-600'
                            }`}
                          >
                            {i < adminPin.length ? '*' : ''}
                          </div>
                        ))}
                      </div>
                      {/* PIN Pad */}
                      <div className="grid grid-cols-3 gap-2">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                          <button
                            key={digit}
                            onClick={() => handlePinDigit(digit)}
                            disabled={isSubmitting || adminPin.length >= 6 || attemptState.isLocked}
                            className="py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            {digit}
                          </button>
                        ))}
                        <button
                          onClick={handlePinClear}
                          disabled={attemptState.isLocked}
                          className="py-3 rounded-lg bg-slate-800 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-all disabled:opacity-30"
                        >
                          Effacer
                        </button>
                        <button
                          onClick={() => handlePinDigit('0')}
                          disabled={isSubmitting || adminPin.length >= 6 || attemptState.isLocked}
                          className="py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          0
                        </button>
                        <button
                          onClick={handlePinBackspace}
                          disabled={attemptState.isLocked}
                          className="py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-medium transition-all disabled:opacity-30"
                        >
                          Retour
                        </button>
                      </div>
                      {isSubmitting && adminPin.length === 6 && (
                        <div className="mt-3 flex justify-center">
                          <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                        </div>
                      )}
                      <button
                        onClick={() => { setShowPinPad(false); setAdminPin(''); }}
                        className="mt-3 w-full py-2 rounded-lg bg-slate-800/50 text-slate-500 text-xs hover:text-slate-300 transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ─── Links ───────────────────────────────────── */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/register')}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Creer un compte
            </button>
            <button
              onClick={() => navigate('/')}
              className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
            >
              Retour au site
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
