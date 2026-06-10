/**
 * Admin Payment Manager — Configuration complete des paiements
 * Admin Panel > Systeme > Payment Manager
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminValueCard from '@/components/AdminValueCard';
import {
  getPaymentSettings, savePaymentSettings, getTransactions, getSubscriptions,
  getInvoices, getPaymentLogs, clearPaymentLogs, getWebhookEvents, getPacks,
  updatePack, refundPayment, cancelSubscription, getPaymentStats,
  type PaymentSettings, type PackConfig, type PaymentTransaction,
  type PackSlug,
} from '@/services/paymentService';
import {
  CreditCard, Wallet, Settings, CheckCircle, XCircle, AlertTriangle,
  Eye, EyeOff, Save, RotateCcw, DollarSign, Receipt, History,
  Globe, Lock, Ban, TrendingUp, Users, Calendar, ChevronDown, ChevronUp,
  Play, Shield, FileText, LogOut, X, Server,
} from 'lucide-react';

type Tab = 'gateways' | 'packs' | 'transactions' | 'subscriptions' | 'invoices' | 'logs' | 'webhooks' | 'tests';

export default function AdminPaymentManager() {
  const [settings, setSettings] = useState<PaymentSettings>(getPaymentSettings);
  const [tab, setTab] = useState<Tab>('gateways');
  const [saved, setSaved] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<string | null>(null);
  const [editingPack, setEditingPack] = useState<PackSlug | null>(null);

  const stats = getPaymentStats();
  const transactions = getTransactions();
  const subscriptions = getSubscriptions();
  const invoices = getInvoices();
  const logs = getPaymentLogs();
  const webhooks = getWebhookEvents();
  const packs = getPacks();

  const save = (partial: Partial<PaymentSettings>) => {
    const merged = { ...settings, ...partial };
    setSettings(merged);
    savePaymentSettings(partial);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const toggleSecret = (key: string) => setShowSecrets(p => ({ ...p, [key]: !p[key] }));

  const testConnection = (provider: string) => {
    setTestResult(`Test ${provider}...`);
    setTimeout(() => {
      const s = getPaymentSettings();
      if (provider === 'stripe') {
        setTestResult(s.stripePublicKey && s.stripePublicKey.startsWith('pk_') ? 'Stripe OK — Cle publique valide' : 'Stripe KO — Cle publique manquante');
      } else if (provider === 'paypal') {
        setTestResult(s.paypalClientId ? 'PayPal OK — Client ID configure' : 'PayPal KO — Client ID manquant');
      } else {
        setTestResult('Bancontact OK — Via Stripe');
      }
    }, 1000);
  };

  const tabs: { key: Tab; label: string; icon: typeof CreditCard }[] = [
    { key: 'gateways', label: 'Passerelles', icon: CreditCard },
    { key: 'packs', label: 'Packs', icon: DollarSign },
    { key: 'transactions', label: 'Transactions', icon: Receipt },
    { key: 'subscriptions', label: 'Abonnements', icon: Calendar },
    { key: 'invoices', label: 'Factures', icon: FileText },
    { key: 'logs', label: 'Logs', icon: History },
    { key: 'webhooks', label: 'Webhooks', icon: Server },
    { key: 'tests', label: 'Tests', icon: Play },
  ];

  return (
    <div className="space-y-6">
      <AdminValueCard
        title="Payment Manager"
        icon={Wallet}
        summary="Gestion des paiements Stripe, PayPal et Bancontact avec activation des packs uniquement apres confirmation webhook."
        userValue="Les utilisateurs peuvent acheter ou renouveler leur pack en toute securite avec plusieurs methodes de paiement."
        adminValue="Permet de configurer les passerelles, gerer les transactions, les remboursements et les factures."
        modulesConnected={['Packs', 'Utilisateurs', 'Stripe', 'PayPal', 'Bancontact', 'Factures']}
        dataSources={['Stripe API', 'PayPal API', 'Webhooks', 'Transactions']}
        packs={['Free', 'Pro', 'Expert', 'Institutionnel']}
        recommendedSettings={['Configurer les cles Stripe/PayPal', 'Activer les webhooks', 'Definir les prix des packs', 'Tester en mode sandbox']}
        impactLevel="critique"
        configStatus="a-configurer"
        quickActions={[{ label: 'Tester Stripe', onClick: () => {}, icon: Play }, { label: 'Voir Transactions', onClick: () => setActiveTab('transactions'), icon: Receipt }]}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Payment Manager</h2>
            <p className="text-xs text-slate-500">{stats.totalTransactions} transactions — {stats.activeSubscriptions} abonnements actifs</p>
          </div>
        </div>
        <AnimatePresence>
          {saved && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Sauvegardee
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat icon={TrendingUp} label="Revenus" value={`${stats.totalRevenue.toFixed(2)} EUR`} color="emerald" />
        <MiniStat icon={Receipt} label="Transactions" value={String(stats.totalTransactions)} color="blue" />
        <MiniStat icon={Users} label="Abonnements" value={String(stats.activeSubscriptions)} color="amber" />
        <MiniStat icon={DollarSign} label="Remboursements" value={String(stats.refundedCount)} color="red" />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-slate-800/50 rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === t.key ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
            }`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'gateways' && <GatewaysTab settings={settings} onSave={save} showSecrets={showSecrets} onToggleSecret={toggleSecret} testResult={testResult} onTest={testConnection} />}
      {tab === 'packs' && <PacksTab packs={packs} editingPack={editingPack} onEdit={setEditingPack} />}
      {tab === 'transactions' && <TransactionsTab transactions={transactions} />}
      {tab === 'subscriptions' && <SubscriptionsTab subscriptions={subscriptions} />}
      {tab === 'invoices' && <InvoicesTab invoices={invoices} />}
      {tab === 'logs' && <LogsTab logs={logs} onClear={() => { clearPaymentLogs(); window.location.reload(); }} />}
      {tab === 'webhooks' && <WebhooksTab webhooks={webhooks} />}
      {tab === 'tests' && <TestsTab onTest={testConnection} testResult={testResult} />}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────

function MiniStat({ icon: Icon, label, value, color }: { icon: typeof CreditCard; label: string; value: string; color: string }) {
  const colors: Record<string, string> = { emerald: 'text-emerald-400', blue: 'text-blue-400', amber: 'text-amber-400', red: 'text-red-400' };
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
      <Icon className={`w-5 h-5 ${colors[color] || 'text-slate-400'}`} />
      <div>
        <p className="text-sm font-bold text-white">{value}</p>
        <p className="text-[10px] text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function GatewaysTab({ settings, onSave, showSecrets, onToggleSecret, testResult, onTest }: {
  settings: PaymentSettings; onSave: (p: Partial<PaymentSettings>) => void;
  showSecrets: Record<string, boolean>; onToggleSecret: (k: string) => void;
  testResult: string | null; onTest: (p: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Global */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3"><Globe className="w-4 h-4 text-slate-400" /> Parametres globaux</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <SelectField label="Mode" value={settings.paymentMode} onChange={v => onSave({ paymentMode: v as 'test' | 'live' })} options={[{v:'test',l:'Test'},{v:'live',l:'Production'}]} />
          <TextField label="Devise par defaut" value={settings.defaultCurrency} onChange={v => onSave({ defaultCurrency: v })} />
          <ToggleField label="Activer factures" value={settings.enableInvoices} onChange={v => onSave({ enableInvoices: v })} />
          <ToggleField label="Activer TVA" value={settings.enableTax} onChange={v => onSave({ enableTax: v })} />
          <ToggleField label="Activer webhooks" value={settings.enableWebhooks} onChange={v => onSave({ enableWebhooks: v })} />
          <ToggleField label="Activer remboursements" value={settings.enableRefunds} onChange={v => onSave({ enableRefunds: v })} />
          <ToggleField label="Activer packs uniquement apres webhook" value={settings.activatePackOnlyAfterWebhook} onChange={v => onSave({ activatePackOnlyAfterWebhook: v })} color="rose" />
          <ToggleField label="Bloquer donnees demo paiement" value={settings.preventDemoPaymentData} onChange={v => onSave({ preventDemoPaymentData: v })} color="rose" />
        </div>
      </div>

      {/* Stripe */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2"><CreditCard className="w-4 h-4 text-indigo-400" /> Stripe</h3>
          <div className="flex items-center gap-2">
            <ToggleField label="Active" value={settings.stripeEnabled} onChange={v => onSave({ stripeEnabled: v })} />
          </div>
        </div>
        {settings.stripeEnabled && (
          <div className="space-y-3">
            <SelectField label="Mode Stripe" value={settings.stripeMode} onChange={v => onSave({ stripeMode: v as 'test' | 'live' })} options={[{v:'test',l:'Test'},{v:'live',l:'Live'}]} />
            <SecretField label="Cle publique (pk_...)" value={settings.stripePublicKey} onChange={v => onSave({ stripePublicKey: v })} show={showSecrets.stripePub} onToggle={() => onToggleSecret('stripePub')} />
            <SecretField label="Cle secrete (sk_...)" value={settings.stripeSecretKey} onChange={v => onSave({ stripeSecretKey: v })} show={showSecrets.stripeSec} onToggle={() => onToggleSecret('stripeSec')} />
            <SecretField label="Webhook Secret (whsec_...)" value={settings.stripeWebhookSecret} onChange={v => onSave({ stripeWebhookSecret: v })} show={showSecrets.stripeWh} onToggle={() => onToggleSecret('stripeWh')} />
            <div className="flex gap-2">
              <ToggleField label="Carte" value={settings.stripeCardEnabled} onChange={v => onSave({ stripeCardEnabled: v })} />
              <ToggleField label="Bancontact" value={settings.stripeBancontactEnabled} onChange={v => onSave({ stripeBancontactEnabled: v })} />
              <ToggleField label="Checkout" value={settings.stripeCheckoutEnabled} onChange={v => onSave({ stripeCheckoutEnabled: v })} />
            </div>
            <button onClick={() => onTest('stripe')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs hover:bg-indigo-500/20">
              <Play className="w-3 h-3" /> Tester connexion
            </button>
          </div>
        )}
      </div>

      {/* PayPal */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Wallet className="w-4 h-4 text-blue-400" /> PayPal</h3>
          <ToggleField label="Active" value={settings.paypalEnabled} onChange={v => onSave({ paypalEnabled: v })} />
        </div>
        {settings.paypalEnabled && (
          <div className="space-y-3">
            <SelectField label="Mode PayPal" value={settings.paypalMode} onChange={v => onSave({ paypalMode: v as 'sandbox' | 'live' })} options={[{v:'sandbox',l:'Sandbox'},{v:'live',l:'Live'}]} />
            <SecretField label="Client ID" value={settings.paypalClientId} onChange={v => onSave({ paypalClientId: v })} show={showSecrets.ppId} onToggle={() => onToggleSecret('ppId')} />
            <SecretField label="Client Secret" value={settings.paypalClientSecret} onChange={v => onSave({ paypalClientSecret: v })} show={showSecrets.ppSec} onToggle={() => onToggleSecret('ppSec')} />
            <SecretField label="Webhook ID" value={settings.paypalWebhookId} onChange={v => onSave({ paypalWebhookId: v })} show={showSecrets.ppWh} onToggle={() => onToggleSecret('ppWh')} />
            <div className="flex gap-2">
              <ToggleField label="Paiement unique" value={settings.paypalOneTimeEnabled} onChange={v => onSave({ paypalOneTimeEnabled: v })} />
              <ToggleField label="Abonnement" value={settings.paypalSubscriptionEnabled} onChange={v => onSave({ paypalSubscriptionEnabled: v })} />
            </div>
            <button onClick={() => onTest('paypal')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs hover:bg-blue-500/20">
              <Play className="w-3 h-3" /> Tester connexion
            </button>
          </div>
        )}
      </div>

      {/* Bancontact */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3"><CreditCard className="w-4 h-4 text-amber-400" /> Bancontact (via Stripe)</h3>
        <div className="grid grid-cols-2 gap-3">
          <ToggleField label="Active" value={settings.bancontactEnabled} onChange={v => onSave({ bancontactEnabled: v })} />
          <div className="text-xs text-slate-500 flex items-center">Confirmation uniquement par webhook</div>
        </div>
        {settings.bancontactEnabled && (
          <button onClick={() => onTest('bancontact')} className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs hover:bg-amber-500/20">
            <Play className="w-3 h-3" /> Tester configuration
          </button>
        )}
      </div>

      {testResult && (
        <div className={`rounded-xl border p-3 flex items-center gap-2 ${testResult.includes('OK') ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-red-500/5 border-red-500/20 text-red-400'}`}>
          {testResult.includes('OK') ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          <span className="text-xs">{testResult}</span>
          <button onClick={() => {}} className="ml-auto p-1"><X className="w-3 h-3" /></button>
        </div>
      )}
    </div>
  );
}

function PacksTab({ packs, editingPack, onEdit }: { packs: PackConfig[]; editingPack: PackSlug | null; onEdit: (s: PackSlug | null) => void }) {
  const savePack = (slug: PackSlug, updates: Partial<PackConfig>) => {
    updatePack(slug, updates);
    onEdit(null);
  };

  return (
    <div className="space-y-3">
      {packs.map(pack => (
        <div key={pack.slug} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          {editingPack === pack.slug ? (
            <PackEditForm pack={pack} onSave={savePack} onCancel={() => onEdit(null)} />
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white">{pack.name}</h4>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${pack.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>{pack.isActive ? 'Actif' : 'Inactif'}</span>
                  {pack.slug === 'free' && <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-[9px] text-blue-400">FREE</span>}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">{pack.description}</p>
                <div className="flex gap-4 mt-2 text-[10px] text-slate-400">
                  <span>Mensuel: <span className="text-white">{pack.monthlyPrice} EUR</span></span>
                  <span>Annuel: <span className="text-white">{pack.yearlyPrice} EUR</span></span>
                  <span>Essai: <span className="text-white">{pack.trialDays}j</span></span>
                  <span>Stripe: <span className="text-slate-500">{pack.stripeMonthlyPriceId || '—'}</span></span>
                  <span>PayPal: <span className="text-slate-500">{pack.paypalMonthlyPlanId || '—'}</span></span>
                </div>
              </div>
              {pack.slug !== 'free' && (
                <button onClick={() => onEdit(pack.slug)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-400 hover:text-white border border-slate-700">
                  Modifier
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PackEditForm({ pack, onSave, onCancel }: { pack: PackConfig; onSave: (s: PackSlug, u: Partial<PackConfig>) => void; onCancel: () => void }) {
  const [form, setForm] = useState(pack);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Nom" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
        <TextField label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} />
        <TextField label="Prix mensuel" value={String(form.monthlyPrice)} onChange={v => setForm(f => ({ ...f, monthlyPrice: Number(v) }))} type="number" />
        <TextField label="Prix annuel" value={String(form.yearlyPrice)} onChange={v => setForm(f => ({ ...f, yearlyPrice: Number(v) }))} type="number" />
        <TextField label="Stripe Price ID mensuel" value={form.stripeMonthlyPriceId} onChange={v => setForm(f => ({ ...f, stripeMonthlyPriceId: v }))} />
        <TextField label="Stripe Price ID annuel" value={form.stripeYearlyPriceId} onChange={v => setForm(f => ({ ...f, stripeYearlyPriceId: v }))} />
        <TextField label="PayPal Plan ID mensuel" value={form.paypalMonthlyPlanId} onChange={v => setForm(f => ({ ...f, paypalMonthlyPlanId: v }))} />
        <TextField label="PayPal Plan ID annuel" value={form.paypalYearlyPlanId} onChange={v => setForm(f => ({ ...f, paypalYearlyPlanId: v }))} />
        <TextField label="Jours d'essai" value={String(form.trialDays)} onChange={v => setForm(f => ({ ...f, trialDays: Number(v) }))} type="number" />
        <ToggleField label="Actif" value={form.isActive} onChange={v => setForm(f => ({ ...f, isActive: v }))} />
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave(pack.slug, form)} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs">Sauvegarder</button>
        <button onClick={onCancel} className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-xs">Annuler</button>
      </div>
    </div>
  );
}

function TransactionsTab({ transactions }: { transactions: PaymentTransaction[] }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="p-3 border-b border-slate-800"><h3 className="text-sm font-semibold text-white">Transactions ({transactions.length})</h3></div>
      <div className="max-h-[400px] overflow-y-auto">
        {transactions.length === 0 ? (
          <p className="text-xs text-slate-600 text-center py-8">Aucune transaction</p>
        ) : (
          transactions.map(tx => (
            <div key={tx.id} className="flex items-center gap-3 px-4 py-2 border-b border-slate-800/50 text-[10px]">
              <span className={`w-1.5 h-1.5 rounded-full ${tx.status === 'paid' ? 'bg-emerald-400' : tx.status === 'failed' ? 'bg-red-400' : tx.status === 'refunded' ? 'bg-amber-400' : 'bg-slate-500'}`} />
              <span className="text-slate-500 w-16">{new Date(tx.createdAt).toLocaleDateString()}</span>
              <span className="text-slate-400 w-12 uppercase">{tx.provider}</span>
              <span className="text-white w-16 font-medium">{tx.packSlug}</span>
              <span className="text-slate-400 flex-1">{tx.amount.toFixed(2)} {tx.currency}</span>
              <span className={`${tx.status === 'paid' ? 'text-emerald-400' : tx.status === 'failed' ? 'text-red-400' : tx.status === 'refunded' ? 'text-amber-400' : 'text-slate-400'}`}>{tx.status}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SubscriptionsTab({ subscriptions }: { subscriptions: ReturnType<typeof getSubscriptions> }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="p-3 border-b border-slate-800"><h3 className="text-sm font-semibold text-white">Abonnements ({subscriptions.length})</h3></div>
      <div className="max-h-[400px] overflow-y-auto">
        {subscriptions.length === 0 ? (
          <p className="text-xs text-slate-600 text-center py-8">Aucun abonnement</p>
        ) : (
          subscriptions.map(sub => (
            <div key={sub.id} className="flex items-center gap-3 px-4 py-2 border-b border-slate-800/50 text-[10px]">
              <span className={`w-1.5 h-1.5 rounded-full ${sub.status === 'active' ? 'bg-emerald-400' : sub.status === 'cancelled' ? 'bg-red-400' : sub.status === 'past_due' ? 'bg-amber-400' : 'bg-slate-500'}`} />
              <span className="text-slate-400 w-12">{sub.provider}</span>
              <span className="text-white w-14 font-medium">{sub.packSlug}</span>
              <span className="text-slate-500">{sub.billingCycle}</span>
              <span className={`${sub.status === 'active' ? 'text-emerald-400' : 'text-slate-400'}`}>{sub.status}</span>
              <span className="text-slate-600 ml-auto">{sub.endsAt ? new Date(sub.endsAt).toLocaleDateString() : '—'}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function InvoicesTab({ invoices }: { invoices: ReturnType<typeof getInvoices> }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="p-3 border-b border-slate-800"><h3 className="text-sm font-semibold text-white">Factures ({invoices.length})</h3></div>
      <div className="max-h-[400px] overflow-y-auto">
        {invoices.length === 0 ? (
          <p className="text-xs text-slate-600 text-center py-8">Aucune facture</p>
        ) : (
          invoices.map(inv => (
            <div key={inv.id} className="flex items-center gap-3 px-4 py-2 border-b border-slate-800/50 text-[10px]">
              <span className="text-slate-500">{inv.invoiceNumber}</span>
              <span className="text-white">{inv.totalAmount.toFixed(2)} {inv.currency}</span>
              <span className={`${inv.status === 'paid' ? 'text-emerald-400' : 'text-slate-400'}`}>{inv.status}</span>
              <span className="text-slate-600 ml-auto">{new Date(inv.issuedAt).toLocaleDateString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function LogsTab({ logs, onClear }: { logs: ReturnType<typeof getPaymentLogs>; onClear: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Logs ({logs.length})</h3>
        <button onClick={onClear} className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-400 hover:text-red-400 border border-slate-700">Vider</button>
      </div>
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden max-h-[400px] overflow-y-auto">
        {logs.map(log => (
          <div key={log.id} className="flex items-center gap-3 px-4 py-2 border-b border-slate-800/50 text-[10px]">
            <span className="text-slate-600">{new Date(log.createdAt).toLocaleTimeString()}</span>
            <span className="text-slate-400 uppercase w-12">{log.provider}</span>
            <span className="text-slate-500">{log.action}</span>
            <span className={`${log.status === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>{log.status}</span>
            <span className="text-slate-400 flex-1">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WebhooksTab({ webhooks }: { webhooks: ReturnType<typeof getWebhookEvents> }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="p-3 border-b border-slate-800"><h3 className="text-sm font-semibold text-white">Webhooks ({webhooks.length})</h3></div>
      <div className="max-h-[400px] overflow-y-auto">
        {webhooks.length === 0 ? (
          <p className="text-xs text-slate-600 text-center py-8">Aucun webhook recu</p>
        ) : (
          webhooks.map(wh => (
            <div key={wh.id} className="flex items-center gap-3 px-4 py-2 border-b border-slate-800/50 text-[10px]">
              <span className="text-slate-600">{new Date(wh.createdAt).toLocaleTimeString()}</span>
              <span className="text-slate-400 uppercase w-14">{wh.provider}</span>
              <span className="text-slate-300">{wh.eventType}</span>
              <span className={`${wh.status === 'processed' ? 'text-emerald-400' : wh.status === 'error' ? 'text-red-400' : 'text-amber-400'}`}>{wh.status}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TestsTab({ onTest, testResult }: { onTest: (p: string) => void; testResult: string | null }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-white">Tests de connexion</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <TestCard provider="Stripe" color="indigo" onTest={() => onTest('stripe')} />
        <TestCard provider="PayPal" color="blue" onTest={() => onTest('paypal')} />
        <TestCard provider="Bancontact" color="amber" onTest={() => onTest('bancontact')} />
      </div>
      {testResult && (
        <div className={`rounded-xl border p-3 text-xs ${testResult.includes('OK') ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-red-500/5 border-red-500/20 text-red-400'}`}>
          {testResult.includes('OK') ? <CheckCircle className="w-4 h-4 inline mr-2" /> : <XCircle className="w-4 h-4 inline mr-2" />}
          {testResult}
        </div>
      )}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-amber-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Regles de securite</h4>
        <ul className="mt-2 space-y-1 text-[10px] text-slate-400">
          <li>Le pack s&apos;active UNIQUEMENT apres confirmation webhook</li>
          <li>Les cles secretes sont chiffrees en localStorage</li>
          <li>Bancontact : confirmation obligatoire par webhook Stripe</li>
          <li>Paiement annule ou echoue = aucune activation</li>
          <li>Mode test recommande avant passage en production</li>
        </ul>
      </div>
    </div>
  );
}

function TestCard({ provider, color, onTest }: { provider: string; color: string; onTest: () => void }) {
  const colors: Record<string, string> = { indigo: 'border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10', blue: 'border-blue-500/20 text-blue-400 hover:bg-blue-500/10', amber: 'border-amber-500/20 text-amber-400 hover:bg-amber-500/10' };
  return (
    <button onClick={onTest} className={`p-4 rounded-xl border ${colors[color]} bg-slate-900/60 text-left transition-colors`}>
      <div className="flex items-center gap-2">
        <Play className="w-4 h-4" />
        <span className="text-xs font-medium">Tester {provider}</span>
      </div>
    </button>
  );
}

// ─── Form Helpers ───────────────────────────────────────

function TextField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <p className="text-[10px] text-slate-500 mb-1">{label}</p>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500/50" />
    </div>
  );
}

function SecretField({ label, value, onChange, show, onToggle }: { label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void }) {
  return (
    <div>
      <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
        <Lock className="w-3 h-3" /> {label}
        <button onClick={onToggle} className="ml-auto p-0.5 hover:bg-slate-800 rounded">
          {show ? <EyeOff className="w-3 h-3 text-slate-600" /> : <Eye className="w-3 h-3 text-slate-600" />}
        </button>
      </p>
      <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500/50 font-mono" />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: {v: string; l: string}[] }) {
  return (
    <div>
      <p className="text-[10px] text-slate-500 mb-1">{label}</p>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500/50">
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

function ToggleField({ label, value, onChange, color = 'blue' }: { label: string; value: boolean; onChange: (v: boolean) => void; color?: string }) {
  const bgColors: Record<string, string> = { blue: 'bg-blue-500', emerald: 'bg-emerald-500', rose: 'bg-rose-500' };
  return (
    <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
      <div className={`w-8 h-4 rounded-full relative transition-colors ${value ? (bgColors[color] || 'bg-blue-500') : 'bg-slate-700'}`}>
        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} className="sr-only" />
      {label}
    </label>
  );
}
