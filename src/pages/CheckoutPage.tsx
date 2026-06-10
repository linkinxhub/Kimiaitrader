/**
 * Checkout Page — Page de paiement utilisateur professionnelle
 * Packs : Free / Pro / Expert / Institutionnel
 * Paiement : Stripe (Carte + Bancontact), PayPal
 * Activation UNIQUEMENT apres confirmation webhook
 */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import {
  getPacks, getPaymentSettings, isPaymentConfigured, canUseBancontact,
  addTransaction, getActiveSubscription,
  type PackSlug, type BillingCycle,
} from '@/services/paymentService';
import {
  CreditCard, Wallet, Shield, Check, ChevronLeft, Lock,
  AlertTriangle, Zap, Star, Building2, Crown, Info,
} from 'lucide-react';

const PACK_ICONS: Record<PackSlug, typeof Crown> = {
  free: Star,
  pro: Zap,
  expert: Crown,
  institutional: Building2,
};

const PACK_COLORS: Record<PackSlug, string> = {
  free: 'from-slate-600 to-slate-700',
  pro: 'from-amber-500 to-orange-600',
  expert: 'from-purple-500 to-violet-600',
  institutional: 'from-rose-500 to-red-600',
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const packs = getPacks().filter(p => p.isActive);
  const settings = getPaymentSettings();
  const [selectedPack, setSelectedPack] = useState<PackSlug>((searchParams.get('pack') as PackSlug) || 'pro');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [selectedProvider, setSelectedProvider] = useState<'stripe' | 'paypal' | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const pack = packs.find(p => p.slug === selectedPack);
  const activeSub = user ? getActiveSubscription(user.id) : null;
  const price = billingCycle === 'monthly' ? (pack?.monthlyPrice || 0) : (pack?.yearlyPrice || 0);
  const taxRate = settings.enableTax ? 0.21 : 0;
  const taxAmount = price * taxRate;
  const totalAmount = price + taxAmount;

  const handlePayment = async () => {
    if (!pack || pack.slug === 'free') return;
    if (!selectedProvider) return;
    if (!user) { navigate('/login'); return; }

    setLoading(true);
    setStatus('pending');

    // Creer transaction en etat pending
    addTransaction({
      userId: user.id, userEmail: user.email || '', packSlug: pack.slug,
      provider: selectedProvider,
      providerPaymentId: `pending_${Date.now()}`,
      amount: totalAmount, currency: settings.defaultCurrency,
      status: 'pending', billingCycle,
      metadata: { initiatedAt: new Date().toISOString() },
    });

    if (settings.paymentMode === 'test') {
      // Mode test : simulation du flux complet
      setTimeout(() => {
        setStatus('success');
        setLoading(false);
      }, 2000);
      return;
    }

    // Mode production : redirection vers le provider
    try {
      if (selectedProvider === 'stripe') {
        const { redirectToCheckout } = await import('@/services/stripeService');
        await redirectToCheckout({
          packSlug: pack.slug as any,
          billingCycle,
          customerEmail: user.email,
          successUrl: `${window.location.origin}/#/checkout?status=success`,
          cancelUrl: `${window.location.origin}/#/checkout?status=cancel`,
        });
      } else if (selectedProvider === 'paypal') {
        // PayPal checkout
        window.open(`https://www.paypal.com/paypalme/xtrendai/${totalAmount}${settings.defaultCurrency}`, '_blank');
        setStatus('pending');
      }
    } catch (e) {
      setStatus('error');
      setErrorMessage(e instanceof Error ? e.message : 'Erreur de paiement');
      setLoading(false);
    }
  };

  const providers = [
    ...(settings.stripeEnabled ? [{ id: 'stripe' as const, name: 'Carte bancaire', icon: CreditCard, color: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' }] : []),
    ...(settings.paypalEnabled ? [{ id: 'paypal' as const, name: 'PayPal', icon: Wallet, color: 'bg-blue-500/10 border-blue-500/30 text-blue-400' }] : []),
  ];

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Paiement en cours de traitement</h1>
          <p className="text-sm text-slate-400">Votre paiement a ete initie. Votre pack sera active apres confirmation par notre systeme securise.</p>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-left">
            <p className="text-xs text-amber-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Important</p>
            <p className="text-xs text-slate-400 mt-1">L&apos;activation du pack se fait automatiquement apres confirmation du paiement. Cela peut prendre quelques instants.</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors">
            Retour au Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-slate-800/60 border border-slate-700 hover:border-slate-600 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Paiement securise</h1>
            <p className="text-xs text-slate-500">Choisissez votre pack et votre methode de paiement</p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
            <Lock className="w-3.5 h-3.5" /> SSL 256-bit
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Pack Selection */}
          <div className="lg:col-span-2 space-y-4">
            {/* Pack cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {packs.map(p => {
                const Icon = PACK_ICONS[p.slug];
                const isSelected = selectedPack === p.slug;
                return (
                  <button key={p.slug} onClick={() => setSelectedPack(p.slug)}
                    className={`relative p-4 rounded-2xl border-2 transition-all text-left ${
                      isSelected ? `border-blue-500 bg-blue-500/5` : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}>
                    {isSelected && <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${PACK_COLORS[p.slug]} flex items-center justify-center mb-3`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">{p.name}</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">{p.description}</p>
                    {p.slug !== 'free' && (
                      <p className="text-xs text-white font-medium mt-2">
                        {billingCycle === 'monthly' ? `${p.monthlyPrice} EUR/mois` : `${p.yearlyPrice} EUR/an`}
                      </p>
                    )}
                    {p.slug === 'free' && <p className="text-xs text-emerald-400 font-medium mt-2">Gratuit</p>}
                  </button>
                );
              })}
            </div>

            {/* Billing cycle */}
            {pack && pack.slug !== 'free' && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Frequence de facturation</h3>
                <div className="flex gap-3">
                  <button onClick={() => setBillingCycle('monthly')}
                    className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${billingCycle === 'monthly' ? 'border-blue-500 bg-blue-500/5' : 'border-slate-800 bg-slate-800/40'}`}>
                    <p className="text-sm font-medium text-white">Mensuel</p>
                    <p className="text-xs text-slate-400 mt-1">{pack.monthlyPrice} EUR/mois</p>
                  </button>
                  <button onClick={() => setBillingCycle('yearly')}
                    className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${billingCycle === 'yearly' ? 'border-blue-500 bg-blue-500/5' : 'border-slate-800 bg-slate-800/40'}`}>
                    <p className="text-sm font-medium text-white">Annuel</p>
                    <p className="text-xs text-slate-400 mt-1">{pack.yearlyPrice} EUR/an</p>
                    <p className="text-[10px] text-emerald-400 mt-1">Economisez 2 mois</p>
                  </button>
                </div>
              </div>
            )}

            {/* Payment methods */}
            {pack && pack.slug !== 'free' && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Methode de paiement</h3>
                {!isPaymentConfigured() ? (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                    <p className="text-xs text-amber-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Mode de paiement non configure</p>
                    <p className="text-xs text-slate-400 mt-1">Veuillez configurer les cles API dans l&apos;admin panel pour activer les paiements.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {providers.map(p => (
                      <button key={p.id} onClick={() => setSelectedProvider(p.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                          selectedProvider === p.id ? p.color : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                        }`}>
                        <p.icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{p.name}</span>
                        {selectedProvider === p.id && <Check className="w-4 h-4 ml-auto" />}
                      </button>
                    ))}
                    {canUseBancontact() && (
                      <button onClick={() => setSelectedProvider('stripe')}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                          selectedProvider === 'stripe' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                        }`}>
                        <CreditCard className="w-5 h-5" />
                        <span className="text-sm font-medium">Bancontact</span>
                        {selectedProvider === 'stripe' && <Check className="w-4 h-4 ml-auto" />}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {status === 'error' && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <p className="text-xs text-red-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {errorMessage}</p>
              </div>
            )}
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sticky top-4">
              <h3 className="text-sm font-semibold text-white mb-4">Recapitulatif</h3>

              {pack && (
                <>
                  <div className="flex items-center justify-between py-2 border-b border-slate-800">
                    <span className="text-xs text-slate-400">Pack</span>
                    <span className="text-xs text-white font-medium">{pack.name}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-800">
                    <span className="text-xs text-slate-400">Periode</span>
                    <span className="text-xs text-white">{billingCycle === 'monthly' ? 'Mensuel' : 'Annuel'}</span>
                  </div>
                  {pack.slug !== 'free' && (
                    <>
                      <div className="flex items-center justify-between py-2 border-b border-slate-800">
                        <span className="text-xs text-slate-400">Prix</span>
                        <span className="text-xs text-white">{price.toFixed(2)} {settings.defaultCurrency}</span>
                      </div>
                      {settings.enableTax && (
                        <div className="flex items-center justify-between py-2 border-b border-slate-800">
                          <span className="text-xs text-slate-400">TVA (21%)</span>
                          <span className="text-xs text-white">{taxAmount.toFixed(2)} {settings.defaultCurrency}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between py-3">
                        <span className="text-sm font-semibold text-white">Total</span>
                        <span className="text-lg font-bold text-white">{totalAmount.toFixed(2)} {settings.defaultCurrency}</span>
                      </div>
                    </>
                  )}
                  {pack.slug === 'free' && (
                    <div className="py-3 text-center">
                      <span className="text-lg font-bold text-emerald-400">Gratuit</span>
                    </div>
                  )}
                </>
              )}

              {/* Features */}
              {pack && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <p className="text-[10px] text-slate-500 mb-2">Fonctionnalites incluses</p>
                  {pack.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] text-slate-400">{f}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action button */}
              {pack && pack.slug !== 'free' ? (
                <button
                  onClick={handlePayment}
                  disabled={!selectedProvider || loading || !isPaymentConfigured()}
                  className="w-full mt-4 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-sm hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Traitement...</>
                  ) : (
                    <><Lock className="w-4 h-4" /> Payer {totalAmount.toFixed(2)} {settings.defaultCurrency}</>
                  )}
                </button>
              ) : (
                <button onClick={() => navigate('/dashboard')} className="w-full mt-4 px-4 py-3 rounded-xl bg-slate-800 text-slate-400 font-medium text-sm hover:bg-slate-700 transition-colors">
                  Continuer gratuitement
                </button>
              )}

              {/* Active subscription warning */}
              {activeSub && (
                <div className="mt-3 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-[10px] text-amber-400 flex items-center gap-1.5"><Info className="w-3 h-3" /> Vous avez deja un abonnement actif ({activeSub.packSlug}). Le nouveau pack remplacera l&apos;ancien.</p>
                </div>
              )}

              {/* Security note */}
              <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-600 justify-center">
                <Shield className="w-3 h-3" /> Paiement securise — Donnees chiffrees
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
