import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import {
  CreditCard, Check, X, Star, Zap, Crown, Building2,
  Shield, Clock, RefreshCw, ChevronDown, ChevronUp,
  Lock, ArrowRight, Sparkles, HelpCircle, BadgeCheck,
  TrendingUp, Bell, BookOpen, BarChart3, Scan, Brain,
  Globe, MessageSquare, Wallet
} from 'lucide-react';

// ─── Plan Definitions ───────────────────────────────────

interface Plan {
  id: 'free' | 'pro' | 'expert' | 'institutional';
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  gradient: string;
  borderColor: string;
  badge?: string;
  features: string[];
  limitations: string[];
}

const PLANS: Plan[] = [
  {
    id: 'free', name: 'Free', monthlyPrice: 0, yearlyPrice: 0,
    description: 'Pour découvrir la plateforme',
    icon: Zap, iconColor: 'text-slate-400', gradient: 'from-slate-600 to-slate-500',
    borderColor: 'border-slate-700',
    features: ['Dashboard temps réel', '3 signaux IA/jour', 'Calendrier économique', 'Gestion risque basique'],
    limitations: ['Pas d\'analyse multi-timeframes', 'Pas de XAU/USD Premium', 'Pas de notifications', 'Pas de Smart Money', 'Données démo uniquement'],
  },
  {
    id: 'pro', name: 'Pro', monthlyPrice: 79, yearlyPrice: 790,
    description: 'Le plus populaire — Pour traders actifs',
    icon: Crown, iconColor: 'text-amber-400', gradient: 'from-amber-500 to-orange-500',
    borderColor: 'border-amber-500/30',
    badge: 'RECOMMANDÉ',
    features: ['Tout le pack Free', 'Signaux IA illimités', 'XAU/USD Premium', 'Radar Opportunités', 'Simulateur de trading', 'Alertes de prix', 'Journal de trading', 'Multi-Actifs comparatif', 'Scanner de marché', 'Analyse technique avancée', 'Notifications Email', 'Données LIVE réelles'],
    limitations: [],
  },
  {
    id: 'expert', name: 'Expert', monthlyPrice: 199, yearlyPrice: 1990,
    description: 'Pour traders professionnels',
    icon: Star, iconColor: 'text-purple-400', gradient: 'from-purple-600 to-pink-600',
    borderColor: 'border-purple-500/30',
    features: ['Tout le pack Pro', 'Smart Money Tracker', 'Assistant IA conversationnel', 'Labo Stratégies (backtest)', 'Export MT4/MT5', 'API Trading', 'Support prioritaire', 'Stratégies personnalisées IA'],
    limitations: [],
  },
  {
    id: 'institutional', name: 'Institutionnel', monthlyPrice: 499, yearlyPrice: 4990,
    description: 'Pour hedge funds et prop firms',
    icon: Building2, iconColor: 'text-rose-400', gradient: 'from-rose-600 to-red-600',
    borderColor: 'border-rose-500/30',
    features: ['Tout le pack Expert', 'Multi-comptes (10)', 'White label possible', 'Account manager dédié', 'Formation équipe incluse', 'SLA 99.9% garanti', 'Intégration sur mesure'],
    limitations: [],
  },
];

// ─── Feature Matrix ─────────────────────────────────────

const ALL_FEATURES = [
  { label: 'Signaux IA', free: '3/jour', pro: true, expert: true, inst: true },
  { label: 'Dashboard temps réel', free: true, pro: true, expert: true, inst: true },
  { label: 'Calendrier économique', free: true, pro: true, expert: true, inst: true },
  { label: 'Gestion risque', free: 'Basique', pro: 'Avancée', expert: 'Avancée', inst: 'Avancée' },
  { label: 'XAU/USD Premium', free: false, pro: true, expert: true, inst: true },
  { label: 'Analyse multi-timeframes', free: false, pro: true, expert: true, inst: true },
  { label: 'Radar Opportunités', free: false, pro: true, expert: true, inst: true },
  { label: 'Simulateur', free: false, pro: true, expert: true, inst: true },
  { label: 'Alertes de prix', free: false, pro: true, expert: true, inst: true },
  { label: 'Journal de trading', free: false, pro: true, expert: true, inst: true },
  { label: 'Multi-Actifs', free: false, pro: true, expert: true, inst: true },
  { label: 'Scanner marché', free: false, pro: true, expert: true, inst: true },
  { label: 'Smart Money', free: false, pro: false, expert: true, inst: true },
  { label: 'Assistant IA', free: false, pro: false, expert: true, inst: true },
  { label: 'Labo Stratégies', free: false, pro: false, expert: true, inst: true },
  { label: 'Export MT4/5', free: false, pro: false, expert: true, inst: true },
  { label: 'Support', free: 'Email', pro: 'Email+Chat', expert: '24/7 prioritaire', inst: 'Account manager' },
  { label: 'Données', free: 'Démo', pro: 'LIVE', expert: 'LIVE', inst: 'LIVE' },
];

// ─── FAQ Data ───────────────────────────────────────────

const FAQS = [
  { q: 'Puis-je changer de pack à tout moment ?', a: 'Oui, vous pouvez upgrader ou downgrader à tout moment. La différence est calculée au prorata.' },
  { q: 'Les données sont-elles vraiment en temps réel ?', a: 'Oui ! Pro, Expert et Institutionnel accèdent aux données LIVE via Binance, CoinGecko, Frankfurter et Currency-API.' },
  { q: 'Puis-je annuler mon abonnement ?', a: 'Oui, annulation sans frais à tout moment. Vous gardez l\'accès jusqu\'à la fin de la période payée.' },
  { q: 'Le pack Free est-il vraiment gratuit ?', a: 'Oui, sans carte bancaire et sans limite de temps. Parfait pour tester la plateforme.' },
  { q: 'Comment fonctionne le mode démo ?', a: 'Le pack Free affiche des données fixes pour protéger nos quotas API. Dès que vous passez Pro, vous voyez les vraies données.' },
];

// ─── Payment Modal ──────────────────────────────────────

function PaymentModal({
  plan, isYearly, onClose, onConfirm
}: {
  plan: Plan; isYearly: boolean; onClose: () => void; onConfirm: () => void;
}) {
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  const period = isYearly ? 'an' : 'mois';

  const handlePay = () => {
    setStep('processing');
    setTimeout(() => {
      setStep('success');
      setTimeout(() => onConfirm(), 1500);
    }, 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {step === 'form' && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center`}>
                <plan.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="text-sm text-slate-400">{isYearly ? 'Paiement annuel' : 'Paiement mensuel'}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-2xl font-bold text-white">{price}€</p>
                <p className="text-xs text-slate-500">/{period}</p>
              </div>
            </div>

            {isYearly && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-400">Vous économisez {plan.monthlyPrice * 12 - plan.yearlyPrice}€ par an ({Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100)}% de réduction)</span>
              </div>
            )}

            {/* Simulated card form */}
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Nom sur la carte</label>
                <input type="text" placeholder="Jean Dupont" defaultValue="Jean Dupont"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Numéro de carte</label>
                <div className="relative">
                  <input type="text" placeholder="4242 4242 4242 4242" defaultValue="4242 4242 4242 4242"
                    className="w-full px-4 py-3 pl-11 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50" />
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Expiration</label>
                  <input type="text" placeholder="12/27" defaultValue="12/27"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">CVC</label>
                  <input type="text" placeholder="123" defaultValue="123"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-6 text-xs text-slate-500">
              <Lock className="w-3 h-3" /> Paiement sécurisé SSL — Données chiffrées
            </div>

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors">
                Annuler
              </button>
              <button onClick={handlePay} className={`flex-1 py-3 bg-gradient-to-r ${plan.gradient} text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2`}>
                Payer {price}€ <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {step === 'processing' && (
          <div className="py-8 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full mx-auto mb-4"
            />
            <p className="text-lg font-semibold text-white">Traitement du paiement...</p>
            <p className="text-sm text-slate-400 mt-1">Veuillez patienter, ne fermez pas cette fenêtre</p>
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 text-center">
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
              className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4"
            >
              <BadgeCheck className="w-8 h-8 text-emerald-400" />
            </motion.div>
            <p className="text-lg font-semibold text-white">Paiement confirmé !</p>
            <p className="text-sm text-slate-400 mt-1">Votre pack {plan.name} est maintenant actif</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────

export default function Subscription() {
  const { user, updatePack } = useAuth();
  const [isYearly, setIsYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const currentPack = (user?.pack || 'free') as string;

  const handleSubscribe = (plan: Plan) => {
    if (plan.id === currentPack) return;
    setSelectedPlan(plan);
  };

  const handlePaymentSuccess = () => {
    if (!selectedPlan) return;
    updatePack(selectedPlan.id, 'active');
    setSelectedPlan(null);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 4000);
  };

  const getPlanPrice = (plan: Plan) => isYearly ? plan.yearlyPrice : plan.monthlyPrice;

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Success Toast */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[70] px-6 py-3 bg-emerald-500/90 backdrop-blur-sm rounded-2xl text-white font-medium text-sm flex items-center gap-2 shadow-xl"
          >
            <BadgeCheck className="w-5 h-5" /> Pack mis à jour avec succès ! Redémarrage...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {selectedPlan && (
          <PaymentModal
            plan={selectedPlan}
            isYearly={isYearly}
            onClose={() => setSelectedPlan(null)}
            onConfirm={handlePaymentSuccess}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
          <Crown className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Choisissez votre Pack</h1>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          4 packs conçus pour chaque étape de votre parcours trading. Passez à la vitesse supérieure avec l'IA.
        </p>

        {/* Current Plan Badge */}
        {user && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/60 border border-slate-700">
            <BadgeCheck className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-slate-300">Votre plan actuel : <span className="font-bold text-white capitalize">{currentPack}</span></span>
          </div>
        )}

        {/* Monthly/Yearly Toggle */}
        <div className="mt-6 inline-flex items-center gap-3 p-1.5 bg-slate-800/60 rounded-2xl border border-slate-700">
          <button
            onClick={() => setIsYearly(false)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${!isYearly ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${isYearly ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Annuel <span className="px-1.5 py-0.5 bg-emerald-500/30 rounded text-xs">-20%</span>
          </button>
        </div>
      </motion.div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {PLANS.map((plan, idx) => {
          const Icon = plan.icon;
          const price = getPlanPrice(plan);
          const isCurrent = plan.id === currentPack;
          const isUpgrade = ['free', 'pro', 'expert', 'institutional'].indexOf(plan.id) > ['free', 'pro', 'expert', 'institutional'].indexOf(currentPack as any);
          const isDowngrade = ['free', 'pro', 'expert', 'institutional'].indexOf(plan.id) < ['free', 'pro', 'expert', 'institutional'].indexOf(currentPack as any);

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative bg-slate-900/60 border rounded-2xl p-6 flex flex-col transition-all hover:shadow-xl ${
                isCurrent ? 'ring-2 ring-blue-500/40 border-blue-500/30' : plan.borderColor
              } ${plan.id === 'pro' ? 'xl:-mt-4 xl:mb-4' : ''}`}
            >
              {/* Badge */}
              {plan.badge && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-xs font-bold text-white">
                  {plan.badge}
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full text-xs font-bold text-white flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3" /> VOTRE PLAN
                </div>
              )}

              {/* Icon & Name */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-500">{plan.description}</p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">{price}€</span>
                  <span className="text-sm text-slate-500">/{isYearly ? 'an' : 'mois'}</span>
                </div>
                {isYearly && price > 0 && (
                  <p className="text-xs text-emerald-400 mt-1">
                    Soit {Math.round(price / 12)}€/mois — Vous économisez {plan.monthlyPrice * 12 - plan.yearlyPrice}€
                  </p>
                )}
                {price === 0 && <p className="text-xs text-slate-500 mt-1">Gratuit, sans limite</p>}
              </div>

              {/* Features */}
              <div className="flex-1 space-y-2.5 mb-6">
                {plan.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">{feat}</span>
                  </div>
                ))}
                {plan.limitations.map((lim, i) => (
                  <div key={`lim-${i}`} className="flex items-start gap-2">
                    <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-500">{lim}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button
                onClick={() => !isCurrent && handleSubscribe(plan)}
                disabled={isCurrent}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                  isCurrent
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 cursor-default'
                    : isUpgrade
                    ? `bg-gradient-to-r ${plan.gradient} text-white hover:shadow-lg hover:scale-[1.02]`
                    : isDowngrade
                    ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                    : `bg-gradient-to-r ${plan.gradient} text-white hover:shadow-lg`
                }`}
              >
                {isCurrent ? 'Plan actuel' : isUpgrade ? `Upgrader vers ${plan.name}` : isDowngrade ? `Downgrader vers ${plan.name}` : `Choisir ${plan.name}`}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Guarantees */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Shield, label: 'Paiement sécurisé', desc: 'SSL 256-bit' },
          { icon: Clock, label: '30 jours', desc: 'Satisfait ou remboursé' },
          { icon: RefreshCw, label: 'Annulation', desc: 'À tout moment' },
          { icon: Sparkles, label: 'Mise à niveau', desc: 'Instantanée' },
        ].map((g, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.05 }}
            className="flex items-center gap-3 p-4 bg-slate-900/40 border border-slate-800 rounded-2xl">
            <g.icon className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">{g.label}</p>
              <p className="text-xs text-slate-500">{g.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Feature Comparison Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 overflow-hidden">
        <h2 className="text-lg font-semibold text-white mb-4 text-center">Comparatif Complet des Fonctionnalités</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="pb-3 pr-4 text-left text-slate-400 min-w-[200px]">Fonctionnalité</th>
                {PLANS.map(p => (
                  <th key={p.id} className={`pb-3 px-3 text-center min-w-[100px] ${p.id === currentPack ? 'text-blue-400' : p.id === 'pro' ? 'text-amber-400' : 'text-slate-400'}`}>
                    <div className="flex flex-col items-center gap-1">
                      <p.icon className={`w-4 h-4 ${p.iconColor}`} />
                      <span>{p.name}</span>
                      {p.id === currentPack && <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 rounded text-blue-400">Actif</span>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_FEATURES.map((feat, idx) => (
                <motion.tr key={feat.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                  className="border-b border-slate-800/50 hover:bg-slate-800/20">
                  <td className="py-2.5 pr-4 text-slate-300 text-xs">{feat.label}</td>
                  {(['free', 'pro', 'expert', 'institutional'] as const).map(pid => {
                    const val = feat[pid === 'institutional' ? 'inst' : pid];
                    const isCurrentCol = pid === currentPack;
                    return (
                      <td key={pid} className={`py-2.5 px-3 text-center ${isCurrentCol ? 'bg-blue-500/5' : ''}`}>
                        {val === true ? (
                          <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                        ) : val === false ? (
                          <X className="w-4 h-4 text-slate-600 mx-auto" />
                        ) : (
                          <span className={`text-xs ${pid === 'free' ? 'text-slate-400' : 'text-amber-400'}`}>{val}</span>
                        )}
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* FAQ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
        <h2 className="text-lg font-semibold text-white mb-4 text-center flex items-center justify-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber-400" /> Questions Fréquentes
        </h2>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
              <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/30 transition-colors">
                <span className="text-sm font-medium text-white">{faq.q}</span>
                {expandedFaq === i ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
              </button>
              <AnimatePresence>
                {expandedFaq === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    <div className="px-4 pb-4 text-sm text-slate-400">{faq.a}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
