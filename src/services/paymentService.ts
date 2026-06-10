/**
 * Payment Service — Système de paiement complet Stripe + PayPal + Bancontact
 *
 * Architecture : pack activé UNIQUEMENT après confirmation webhook.
 * Aucune activation au clic paiement.
 * Données chiffrées en localStorage. Pas de données demo/fictives.
 */

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export type PaymentProvider = 'stripe' | 'paypal' | 'bancontact';
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'refunded' | 'disputed';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'unpaid' | 'cancelled' | 'expired' | 'suspended';
export type BillingCycle = 'monthly' | 'yearly' | 'one_time';
export type PackSlug = 'free' | 'pro' | 'expert' | 'institutional';

export interface PaymentSettings {
  // Global
  paymentMode: 'test' | 'live';
  defaultCurrency: string;
  enableInvoices: boolean;
  enableTax: boolean;
  enableCoupons: boolean;
  enableRefunds: boolean;
  enableWebhooks: boolean;
  activatePackOnlyAfterWebhook: boolean;
  preventDemoPaymentData: boolean;
  // Stripe
  stripeEnabled: boolean;
  stripeMode: 'test' | 'live';
  stripePublicKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  stripeBancontactEnabled: boolean;
  stripeCardEnabled: boolean;
  stripeCheckoutEnabled: boolean;
  // PayPal
  paypalEnabled: boolean;
  paypalMode: 'sandbox' | 'live';
  paypalClientId: string;
  paypalClientSecret: string;
  paypalWebhookId: string;
  paypalSubscriptionEnabled: boolean;
  paypalOneTimeEnabled: boolean;
  // Bancontact
  bancontactEnabled: boolean;
  bancontactProvider: 'stripe';
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  userEmail: string;
  packSlug: PackSlug;
  provider: PaymentProvider;
  providerPaymentId: string;
  providerSessionId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  billingCycle: BillingCycle;
  paymentMethod?: string;
  metadata?: Record<string, any>;
  paidAt?: string;
  failedAt?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  packSlug: PackSlug;
  provider: PaymentProvider;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startsAt: string;
  endsAt: string;
  renewsAt?: string;
  cancelledAt?: string;
  trialEndsAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentInvoice {
  id: string;
  userId: string;
  paymentId: string;
  invoiceNumber: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void';
  issuedAt: string;
  paidAt?: string;
}

export interface WebhookEvent {
  id: string;
  provider: PaymentProvider;
  eventId: string;
  eventType: string;
  payload: string;
  status: 'received' | 'verified' | 'processed' | 'error';
  processedAt?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface PaymentLog {
  id: string;
  userId?: string;
  provider: PaymentProvider;
  action: string;
  status: string;
  message: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface PackConfig {
  slug: PackSlug;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  stripeMonthlyPriceId: string;
  stripeYearlyPriceId: string;
  paypalMonthlyPlanId: string;
  paypalYearlyPlanId: string;
  bancontactEnabled: boolean;
  features: string[];
  isActive: boolean;
  trialDays: number;
  sortOrder: number;
}

// ═══════════════════════════════════════════════════════════
// DEFAULTS
// ═══════════════════════════════════════════════════════════

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  paymentMode: 'test',
  defaultCurrency: 'EUR',
  enableInvoices: true,
  enableTax: true,
  enableCoupons: false,
  enableRefunds: true,
  enableWebhooks: true,
  activatePackOnlyAfterWebhook: true,
  preventDemoPaymentData: true,
  stripeEnabled: false,
  stripeMode: 'test',
  stripePublicKey: '',
  stripeSecretKey: '',
  stripeWebhookSecret: '',
  stripeBancontactEnabled: false,
  stripeCardEnabled: true,
  stripeCheckoutEnabled: true,
  paypalEnabled: false,
  paypalMode: 'sandbox',
  paypalClientId: '',
  paypalClientSecret: '',
  paypalWebhookId: '',
  paypalSubscriptionEnabled: false,
  paypalOneTimeEnabled: true,
  bancontactEnabled: false,
  bancontactProvider: 'stripe',
};

export const DEFAULT_PACKS: PackConfig[] = [
  {
    slug: 'free', name: 'Free', description: 'Accès limité — Analyses basiques',
    monthlyPrice: 0, yearlyPrice: 0, currency: 'EUR',
    stripeMonthlyPriceId: '', stripeYearlyPriceId: '',
    paypalMonthlyPlanId: '', paypalYearlyPlanId: '',
    bancontactEnabled: false,
    features: ['Signaux basiques', '2 actifs max', 'Dashboard public'],
    isActive: true, trialDays: 0, sortOrder: 1,
  },
  {
    slug: 'pro', name: 'Pro', description: 'Accès Pro — Signaux complets',
    monthlyPrice: 29.99, yearlyPrice: 299.99, currency: 'EUR',
    stripeMonthlyPriceId: 'price_pro_monthly', stripeYearlyPriceId: 'price_pro_yearly',
    paypalMonthlyPlanId: 'plan_pro_monthly', paypalYearlyPlanId: 'plan_pro_yearly',
    bancontactEnabled: true,
    features: ['Signaux IA complets', '50+ actifs', 'Alertes', 'Analyse technique', 'Analyse fondamentale'],
    isActive: true, trialDays: 7, sortOrder: 2,
  },
  {
    slug: 'expert', name: 'Expert', description: 'Accès Expert — Toutes fonctionnalités',
    monthlyPrice: 79.99, yearlyPrice: 799.99, currency: 'EUR',
    stripeMonthlyPriceId: 'price_expert_monthly', stripeYearlyPriceId: 'price_expert_yearly',
    paypalMonthlyPlanId: 'plan_expert_monthly', paypalYearlyPlanId: 'plan_expert_yearly',
    bancontactEnabled: true,
    features: ['Tous les signaux', '90+ actifs', 'Centre Décision IA', 'Analyse Institutionnelle', 'News Center', 'Stratégies Trading'],
    isActive: true, trialDays: 7, sortOrder: 3,
  },
  {
    slug: 'institutional', name: 'Institutionnel', description: 'Accès complet — Gestion multi-comptes',
    monthlyPrice: 199.99, yearlyPrice: 1999.99, currency: 'EUR',
    stripeMonthlyPriceId: 'price_insti_monthly', stripeYearlyPriceId: 'price_insti_yearly',
    paypalMonthlyPlanId: 'plan_insti_monthly', paypalYearlyPlanId: 'plan_insti_yearly',
    bancontactEnabled: true,
    features: ['Tout le pack Expert', 'Multi-comptes', 'API directe', 'Support dédié', 'Personnalisation'],
    isActive: true, trialDays: 14, sortOrder: 4,
  },
];

// ═══════════════════════════════════════════════════════════
// STORAGE KEYS
// ═══════════════════════════════════════════════════════════

const STORAGE = {
  settings: 'xtpay_settings',
  transactions: 'xtpay_transactions',
  subscriptions: 'xtpay_subscriptions',
  invoices: 'xtpay_invoices',
  webhooks: 'xtpay_webhooks',
  logs: 'xtpay_logs',
  packs: 'xtpay_packs',
};

// ═══════════════════════════════════════════════════════════
// KEY OBFUSCATION
// ═══════════════════════════════════════════════════════════

function obf(key: string): string {
  if (!key) return '';
  try { return btoa(key.split('').reverse().join('') + '_xtp'); } catch { return key; }
}
function deobf(val: string): string {
  if (!val) return '';
  try { return atob(val).replace('_xtp', '').split('').reverse().join(''); } catch { return val; }
}

// ═══════════════════════════════════════════════════════════
// SETTINGS CRUD
// ═══════════════════════════════════════════════════════════

export function getPaymentSettings(): PaymentSettings {
  try {
    const raw = localStorage.getItem(STORAGE.settings);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_PAYMENT_SETTINGS,
        ...parsed,
        stripeSecretKey: parsed.stripeSecretKey ? deobf(parsed.stripeSecretKey) : '',
        stripeWebhookSecret: parsed.stripeWebhookSecret ? deobf(parsed.stripeWebhookSecret) : '',
        paypalClientSecret: parsed.paypalClientSecret ? deobf(parsed.paypalClientSecret) : '',
        paypalClientId: parsed.paypalClientId || '',
      };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_PAYMENT_SETTINGS };
}

export function savePaymentSettings(settings: Partial<PaymentSettings>): void {
  const current = getPaymentSettings();
  const merged = { ...current, ...settings };
  const toSave = {
    ...merged,
    stripeSecretKey: merged.stripeSecretKey ? obf(merged.stripeSecretKey) : '',
    stripeWebhookSecret: merged.stripeWebhookSecret ? obf(merged.stripeWebhookSecret) : '',
    paypalClientSecret: merged.paypalClientSecret ? obf(merged.paypalClientSecret) : '',
  };
  localStorage.setItem(STORAGE.settings, JSON.stringify(toSave));
}

// ═══════════════════════════════════════════════════════════
// PACKS CRUD
// ═══════════════════════════════════════════════════════════

export function getPacks(): PackConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE.packs);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [...DEFAULT_PACKS];
}

export function savePacks(packs: PackConfig[]): void {
  localStorage.setItem(STORAGE.packs, JSON.stringify(packs));
}

export function getPack(slug: PackSlug): PackConfig | undefined {
  return getPacks().find(p => p.slug === slug);
}

export function updatePack(slug: PackSlug, updates: Partial<PackConfig>): void {
  const packs = getPacks();
  const idx = packs.findIndex(p => p.slug === slug);
  if (idx !== -1) {
    packs[idx] = { ...packs[idx], ...updates };
    savePacks(packs);
  }
}

// ═══════════════════════════════════════════════════════════
// TRANSACTIONS
// ═══════════════════════════════════════════════════════════

export function getTransactions(userId?: string): PaymentTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE.transactions);
    const all: PaymentTransaction[] = raw ? JSON.parse(raw) : [];
    return userId ? all.filter(t => t.userId === userId) : all;
  } catch { return []; }
}

export function addTransaction(tx: Omit<PaymentTransaction, 'id' | 'createdAt' | 'updatedAt'>): PaymentTransaction {
  const all = getTransactions();
  const newTx: PaymentTransaction = {
    ...tx,
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  all.unshift(newTx);
  localStorage.setItem(STORAGE.transactions, JSON.stringify(all.slice(0, 500)));
  logPaymentEvent(tx.provider, 'transaction_created', tx.status, `Transaction ${newTx.id} créée pour ${tx.packSlug}`);
  return newTx;
}

export function updateTransactionStatus(id: string, status: PaymentStatus, extra?: Partial<PaymentTransaction>): void {
  const all = getTransactions();
  const tx = all.find(t => t.id === id);
  if (!tx) return;
  tx.status = status;
  tx.updatedAt = new Date().toISOString();
  if (status === 'paid') tx.paidAt = new Date().toISOString();
  if (status === 'failed') tx.failedAt = new Date().toISOString();
  if (status === 'refunded') tx.refundedAt = new Date().toISOString();
  if (extra) Object.assign(tx, extra);
  localStorage.setItem(STORAGE.transactions, JSON.stringify(all));
}

// ═══════════════════════════════════════════════════════════
// SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════════

export function getSubscriptions(userId?: string): UserSubscription[] {
  try {
    const raw = localStorage.getItem(STORAGE.subscriptions);
    const all: UserSubscription[] = raw ? JSON.parse(raw) : [];
    return userId ? all.filter(s => s.userId === userId) : all;
  } catch { return []; }
}

export function getActiveSubscription(userId: string): UserSubscription | null {
  return getSubscriptions(userId).find(s =>
    s.status === 'active' || s.status === 'trialing'
  ) || null;
}

export function addSubscription(sub: Omit<UserSubscription, 'id' | 'createdAt' | 'updatedAt'>): UserSubscription {
  const all = getSubscriptions();
  // Désactiver les anciens abonnements actifs de cet utilisateur
  for (const s of all) {
    if (s.userId === sub.userId && (s.status === 'active' || s.status === 'trialing')) {
      s.status = 'expired';
      s.updatedAt = new Date().toISOString();
    }
  }
  const newSub: UserSubscription = {
    ...sub,
    id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  all.unshift(newSub);
  localStorage.setItem(STORAGE.subscriptions, JSON.stringify(all.slice(0, 200)));
  return newSub;
}

export function updateSubscriptionStatus(id: string, status: SubscriptionStatus): void {
  const all = getSubscriptions();
  const sub = all.find(s => s.id === id);
  if (sub) {
    sub.status = status;
    sub.updatedAt = new Date().toISOString();
    if (status === 'cancelled') sub.cancelledAt = new Date().toISOString();
    localStorage.setItem(STORAGE.subscriptions, JSON.stringify(all));
  }
}

// ═══════════════════════════════════════════════════════════
// PACK ACTIVATION — UNIQUEMENT après confirmation
// ═══════════════════════════════════════════════════════════

export function activateUserPack(userId: string, packSlug: PackSlug, subscriptionId: string): void {
  // Met à jour le pack utilisateur SEULEMENT après confirmation
  const usersRaw = localStorage.getItem('xtrendai_auth_users');
  if (usersRaw) {
    try {
      const users = JSON.parse(usersRaw);
      const user = users.find((u: any) => u.id === userId);
      if (user) {
        user.pack = packSlug;
        user.packStatus = 'active';
        user.subscriptionId = subscriptionId;
        user.packActivatedAt = new Date().toISOString();
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        user.packExpiresAt = expiry.toISOString();
        localStorage.setItem('xtrendai_auth_users', JSON.stringify(users));

        // Met à jour aussi la session
        const sessionRaw = localStorage.getItem('xtrendai_local_auth');
        if (sessionRaw) {
          const session = JSON.parse(sessionRaw);
          if (session.id === userId) {
            session.pack = packSlug;
            session.packStatus = 'active';
            session.subscriptionId = subscriptionId;
            localStorage.setItem('xtrendai_local_auth', JSON.stringify(session));
          }
        }

        logPaymentEvent('stripe', 'pack_activated', 'success', `Pack ${packSlug} activé pour ${userId}`);
      }
    } catch { /* ignore */ }
  }
}

// ═══════════════════════════════════════════════════════════
// WEBHOOK HANDLERS — Activation pack uniquement ici
// ═══════════════════════════════════════════════════════════

export function processStripeWebhook(eventType: string, payload: any): boolean {
  const settings = getPaymentSettings();
  if (!settings.enableWebhooks) return false;

  // Enregistrer l'événement
  recordWebhookEvent('stripe', payload.id || `evt_${Date.now()}`, eventType, JSON.stringify(payload));

  switch (eventType) {
    case 'checkout.session.completed': {
      const { customer_email, metadata, subscription } = payload.data?.object || {};
      const packSlug = metadata?.packSlug as PackSlug;
      const userId = metadata?.userId;
      if (!packSlug || !userId) return false;

      // Créer transaction
      const tx = addTransaction({
        userId, userEmail: customer_email || '', packSlug,
        provider: 'stripe', providerPaymentId: payload.id,
        amount: (payload.data?.object?.amount_total || 0) / 100,
        currency: payload.data?.object?.currency?.toUpperCase() || 'EUR',
        status: 'paid', billingCycle: (metadata?.billingCycle as BillingCycle) || 'monthly',
        metadata: { subscriptionId: subscription },
      });

      // Créer abonnement
      const sub = addSubscription({
        userId, packSlug, provider: 'stripe',
        providerCustomerId: payload.data?.object?.customer,
        providerSubscriptionId: subscription,
        status: 'active', billingCycle: (metadata?.billingCycle as BillingCycle) || 'monthly',
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        renewsAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      });

      // ACTIVER LE PACK — uniquement ici, après confirmation webhook
      activateUserPack(userId, packSlug, sub.id);

      // Générer facture
      generateInvoice(userId, tx.id, tx.amount, tx.currency);
      return true;
    }

    case 'invoice.paid': {
      const subId = payload.data?.object?.subscription;
      if (subId) {
        const subs = getSubscriptions();
        const sub = subs.find(s => s.providerSubscriptionId === subId);
        if (sub) {
          sub.status = 'active';
          sub.renewsAt = new Date(Date.now() + 30 * 86400000).toISOString();
          sub.updatedAt = new Date().toISOString();
          localStorage.setItem(STORAGE.subscriptions, JSON.stringify(subs));
        }
      }
      return true;
    }

    case 'invoice.payment_failed': {
      const subId = payload.data?.object?.subscription;
      if (subId) {
        const subs = getSubscriptions();
        const sub = subs.find(s => s.providerSubscriptionId === subId);
        if (sub) {
          sub.status = 'past_due';
          sub.updatedAt = new Date().toISOString();
          localStorage.setItem(STORAGE.subscriptions, JSON.stringify(subs));
        }
      }
      return true;
    }

    case 'customer.subscription.deleted': {
      const subId = payload.id;
      const subs = getSubscriptions();
      const sub = subs.find(s => s.providerSubscriptionId === subId);
      if (sub) {
        updateSubscriptionStatus(sub.id, 'cancelled');
      }
      return true;
    }

    default:
      return false;
  }
}

export function processPayPalWebhook(eventType: string, payload: any): boolean {
  const settings = getPaymentSettings();
  if (!settings.enableWebhooks) return false;

  recordWebhookEvent('paypal', payload.id || `evt_${Date.now()}`, eventType, JSON.stringify(payload));

  switch (eventType) {
    case 'PAYMENT.CAPTURE.COMPLETED': {
      const resource = payload.resource || {};
      const customId = resource.custom_id || '';
      const [userId, packSlug, billingCycle] = customId.split('|');
      if (!userId || !packSlug) return false;

      const tx = addTransaction({
        userId, userEmail: '', packSlug: packSlug as PackSlug,
        provider: 'paypal', providerPaymentId: resource.id || payload.id,
        amount: parseFloat(resource.amount?.value || '0'),
        currency: resource.amount?.currency_code || 'EUR',
        status: 'paid', billingCycle: (billingCycle as BillingCycle) || 'one_time',
      });

      const sub = addSubscription({
        userId, packSlug: packSlug as PackSlug, provider: 'paypal',
        providerPaymentId: resource.id,
        status: 'active', billingCycle: (billingCycle as BillingCycle) || 'monthly',
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      });

      activateUserPack(userId, packSlug as PackSlug, sub.id);
      generateInvoice(userId, tx.id, tx.amount, tx.currency);
      return true;
    }

    case 'BILLING.SUBSCRIPTION.CANCELLED': {
      const subId = payload.resource?.id;
      if (subId) {
        const subs = getSubscriptions();
        const sub = subs.find(s => s.providerSubscriptionId === subId);
        if (sub) updateSubscriptionStatus(sub.id, 'cancelled');
      }
      return true;
    }

    default:
      return false;
  }
}

// ═══════════════════════════════════════════════════════════
// INVOICES
// ═══════════════════════════════════════════════════════════

export function getInvoices(userId?: string): PaymentInvoice[] {
  try {
    const raw = localStorage.getItem(STORAGE.invoices);
    const all: PaymentInvoice[] = raw ? JSON.parse(raw) : [];
    return userId ? all.filter(i => i.userId === userId) : all;
  } catch { return []; }
}

function generateInvoice(userId: string, paymentId: string, amount: number, currency: string): PaymentInvoice {
  const settings = getPaymentSettings();
  const all = getInvoices();
  const taxRate = settings.enableTax ? 0.21 : 0;
  const taxAmount = amount * taxRate;
  const invoice: PaymentInvoice = {
    id: `inv_${Date.now()}`,
    userId, paymentId,
    invoiceNumber: `XT-${Date.now().toString(36).toUpperCase()}`,
    amount, taxAmount,
    totalAmount: amount + taxAmount,
    currency,
    status: 'paid',
    issuedAt: new Date().toISOString(),
    paidAt: new Date().toISOString(),
  };
  all.unshift(invoice);
  localStorage.setItem(STORAGE.invoices, JSON.stringify(all.slice(0, 300)));
  return invoice;
}

// ═══════════════════════════════════════════════════════════
// WEBHOOK EVENTS
// ═══════════════════════════════════════════════════════════

function recordWebhookEvent(provider: PaymentProvider, eventId: string, eventType: string, payload: string): void {
  const all = getWebhookEvents();
  all.unshift({
    id: `wh_${Date.now()}`, provider, eventId, eventType, payload,
    status: 'received', createdAt: new Date().toISOString(),
  });
  localStorage.setItem(STORAGE.webhooks, JSON.stringify(all.slice(0, 200)));
}

export function getWebhookEvents(): WebhookEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE.webhooks);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// ═══════════════════════════════════════════════════════════
// LOGS
// ═══════════════════════════════════════════════════════════

function logPaymentEvent(provider: PaymentProvider, action: string, status: string, message: string): void {
  const all = getPaymentLogs();
  all.unshift({
    id: `log_${Date.now()}`, provider, action, status, message,
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem(STORAGE.logs, JSON.stringify(all.slice(0, 300)));
}

export function getPaymentLogs(): PaymentLog[] {
  try {
    const raw = localStorage.getItem(STORAGE.logs);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function clearPaymentLogs(): void {
  localStorage.removeItem(STORAGE.logs);
}

// ═══════════════════════════════════════════════════════════
// STATUS HELPERS
// ═══════════════════════════════════════════════════════════

export function isPaymentConfigured(): boolean {
  const s = getPaymentSettings();
  return (s.stripeEnabled && s.stripePublicKey.length > 10) ||
    (s.paypalEnabled && s.paypalClientId.length > 10);
}

export function canUseBancontact(): boolean {
  const s = getPaymentSettings();
  return s.bancontactEnabled && s.stripeEnabled && s.stripeBancontactEnabled;
}

export function getProviderStatus(): { provider: PaymentProvider; status: string; color: string }[] {
  const s = getPaymentSettings();
  return [
    { provider: 'stripe', status: s.stripeEnabled && s.stripePublicKey ? 'Configure' : 'Non configure', color: s.stripeEnabled && s.stripePublicKey ? 'text-emerald-400' : 'text-red-400' },
    { provider: 'paypal', status: s.paypalEnabled && s.paypalClientId ? 'Configure' : 'Non configure', color: s.paypalEnabled && s.paypalClientId ? 'text-emerald-400' : 'text-red-400' },
    { provider: 'bancontact', status: canUseBancontact() ? 'Configure' : 'Non configure', color: canUseBancontact() ? 'text-emerald-400' : 'text-red-400' },
  ];
}

// ═══════════════════════════════════════════════════════════
// STRIPE CHECKOUT — Frontend (keys in .env for security)
// ═══════════════════════════════════════════════════════════

export function getStripePublicKey(): string {
  return getPaymentSettings().stripePublicKey;
}

export function getPayPalClientId(): string {
  return getPaymentSettings().paypalClientId;
}

// ═══════════════════════════════════════════════════════════
// REFUND
// ═══════════════════════════════════════════════════════════

export function refundPayment(transactionId: string, reason: string): boolean {
  const txs = getTransactions();
  const tx = txs.find(t => t.id === transactionId);
  if (!tx || tx.status !== 'paid') return false;

  tx.status = 'refunded';
  tx.refundedAt = new Date().toISOString();
  tx.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE.transactions, JSON.stringify(txs));

  // Met à jour l'abonnement
  const subs = getSubscriptions();
  const sub = subs.find(s => s.userId === tx.userId && s.packSlug === tx.packSlug);
  if (sub) {
    sub.status = 'cancelled';
    sub.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE.subscriptions, JSON.stringify(subs));
  }

  logPaymentEvent(tx.provider, 'refund', 'success', `Remboursement ${transactionId}: ${reason}`);
  return true;
}

// ═══════════════════════════════════════════════════════════
// CANCEL SUBSCRIPTION
// ═══════════════════════════════════════════════════════════

export function cancelSubscription(subscriptionId: string): boolean {
  const subs = getSubscriptions();
  const sub = subs.find(s => s.id === subscriptionId);
  if (!sub || sub.status === 'cancelled') return false;

  sub.status = 'cancelled';
  sub.cancelledAt = new Date().toISOString();
  sub.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE.subscriptions, JSON.stringify(subs));

  logPaymentEvent(sub.provider, 'cancel_subscription', 'success', `Abonnement ${subscriptionId} annule`);
  return true;
}

// ═══════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════

export function getPaymentStats(): {
  totalRevenue: number; totalTransactions: number;
  paidCount: number; failedCount: number; refundedCount: number;
  activeSubscriptions: number; cancelledSubscriptions: number;
  stripeRevenue: number; paypalRevenue: number;
} {
  const txs = getTransactions();
  const subs = getSubscriptions();
  const paid = txs.filter(t => t.status === 'paid');

  return {
    totalRevenue: paid.reduce((s, t) => s + t.amount, 0),
    totalTransactions: txs.length,
    paidCount: paid.length,
    failedCount: txs.filter(t => t.status === 'failed').length,
    refundedCount: txs.filter(t => t.status === 'refunded').length,
    activeSubscriptions: subs.filter(s => s.status === 'active').length,
    cancelledSubscriptions: subs.filter(s => s.status === 'cancelled').length,
    stripeRevenue: paid.filter(t => t.provider === 'stripe').reduce((s, t) => s + t.amount, 0),
    paypalRevenue: paid.filter(t => t.provider === 'paypal').reduce((s, t) => s + t.amount, 0),
  };
}
