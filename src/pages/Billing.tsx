import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { usePacks } from '@/hooks/usePacks';
import { updateUserPack } from '@/services/authService';
import { formatCurrency } from '@/lib/format';
import {
  CreditCard, Shield, Check, ArrowRight,
  Zap, Crown, Diamond, Building2, AlertTriangle, Loader2
} from 'lucide-react';

/**
 * Billing Page - Version statique (sans backend Stripe)
 * Les paiements sont simulés. En production, il faudrait connecter Stripe/PayPal.
 * Pour l'instant : sélection du pack + activation immédiate.
 */
export default function Billing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { packs } = usePacks();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const currentPackSlug = (user?.pack || 'free') as string;
  const currentPack = packs.find(p => p.slug === currentPackSlug);

  const packIcons: Record<string, React.ElementType> = {
    free: Zap, pro: Diamond, expert: Crown, institutional: Building2,
  };

  const handleActivate = async (packSlug: string) => {
    if (!user) {
      navigate('/register');
      return;
    }
    setSelectedPack(packSlug);
    setIsProcessing(true);

    // Simulate processing delay
    await new Promise(r => setTimeout(r, 1500));

    // Activate pack locally (no backend needed)
    const packId = packs.find(p => p.slug === packSlug)?.id;
    if (packId !== undefined) {
      updateUserPack(user.id as string, packSlug as any, 'active');
    }

    setIsProcessing(false);
    // Redirect to dashboard with success
    navigate('/dashboard');
    // Force reload to refresh auth state
    setTimeout(() => window.location.reload(), 300);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Paiement &amp; Abonnement</h1>
          <p className="text-xs text-slate-400">Choisissez votre pack et activez-le immédiatement</p>
        </div>
      </motion.div>

      {/* Warning simulation */}
      <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-400">Mode démonstration</p>
          <p className="text-xs text-slate-400">Les paiements sont simulés. Aucun prélèvement réel n&apos;est effectué. En production, Stripe/PayPal serait connecté.</p>
        </div>
      </div>

      {/* Current subscription */}
      {currentPack && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Votre Pack Actuel</h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              {(() => {
                const Icon = packIcons[currentPack.slug] || Zap;
                return <Icon className="w-7 h-7 text-blue-400" />;
              })()}
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-white">{currentPack.name}</p>
              <p className="text-sm text-slate-400">{currentPack.description}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  user?.packStatus === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                  user?.packStatus === 'trial' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-amber-500/20 text-amber-400'
                }`}>
                  {(user?.packStatus || 'ACTIVE').toUpperCase()}
                </span>
                {user?.packExpiresAt && (
                  <span className="text-xs text-slate-500">
                    Expire le {new Date(user.packExpiresAt).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-2 p-1 bg-slate-900/60 border border-slate-800 rounded-xl w-fit mx-auto">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            billingCycle === 'monthly' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          Mensuel
        </button>
        <button
          onClick={() => setBillingCycle('yearly')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            billingCycle === 'yearly' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          Annuel <span className="text-xs text-emerald-400">-17%</span>
        </button>
      </div>

      {/* Available packs */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Choisir ou Changer de Pack</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packs.filter(p => p.slug !== 'free').map((pack, idx) => {
            const Icon = packIcons[pack.slug] || Zap;
            const isCurrent = currentPackSlug === pack.slug;
            const price = billingCycle === 'monthly' ? pack.priceMonthly : pack.priceYearly;

            return (
              <motion.div key={pack.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                className={`rounded-2xl border p-6 ${
                  isCurrent ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 bg-slate-900/60'
                }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{pack.name}</h3>
                    {pack.recommended === 'yes' && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">RECOMMANDÉ</span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-400 mb-4">{pack.description}</p>

                {/* Features */}
                <div className="space-y-2 mb-4">
                  {pack.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-sm text-slate-300">{f}</span>
                    </div>
                  ))}
                  {pack.limitations?.map((f, i) => (
                    <div key={`lim-${i}`} className="flex items-center gap-2 opacity-50">
                      <span className="w-4 h-4 rounded-full border border-slate-600 flex-shrink-0" />
                      <span className="text-sm text-slate-500 line-through">{f}</span>
                    </div>
                  ))}
                </div>

                {/* Price & CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <div>
                    <p className="text-2xl font-bold text-white">{formatCurrency(parseFloat(price))}<span className="text-sm text-slate-500 font-normal">/{billingCycle === 'monthly' ? 'mois' : 'an'}</span></p>
                  </div>
                  {isCurrent ? (
                    <span className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Actif
                    </span>
                  ) : (
                    <button
                      onClick={() => handleActivate(pack.slug)}
                      disabled={isProcessing}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-sm text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {isProcessing && selectedPack === pack.slug ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Activation...</>
                      ) : (
                        <><CreditCard className="w-4 h-4" /> Activer</>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Security note */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-slate-300">Paiement sécurisé</p>
          <p className="text-xs text-slate-500">En production, Stripe/PayPal serait utilisé. Vos données bancaires ne transiteraient jamais par nos serveurs.</p>
        </div>
      </div>
    </div>
  );
}
