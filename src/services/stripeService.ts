/**
 * Stripe Checkout Service (Frontend)
 * Intégration Stripe Checkout sans backend
 * Utilise Stripe.js pour créer des sessions de paiement côté client
 *
 * En production, il faudrait un backend pour créer les sessions.
 * Ici, on utilise une redirection vers Stripe Checkout avec des prix pré-configurés.
 */

import { loadStripe, type Stripe } from '@stripe/stripe-js';

// Clé publique Stripe — configuree dans Parametres > Paiements
// Sans cle, le systeme bascule en mode simulation avec activation manuelle
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';

export interface StripeCheckoutConfig {
  packSlug: 'pro' | 'expert' | 'institutional';
  billingCycle: 'monthly' | 'yearly';
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}

// ─── Price IDs (à configurer dans le Dashboard Stripe) ──
const PRICE_IDS: Record<string, { monthly: string; yearly: string }> = {
  pro: {
    monthly: 'price_pro_monthly',
    yearly: 'price_pro_yearly',
  },
  expert: {
    monthly: 'price_expert_monthly',
    yearly: 'price_expert_yearly',
  },
  institutional: {
    monthly: 'price_institutional_monthly',
    yearly: 'price_institutional_yearly',
  },
};

let stripePromise: Promise<Stripe | null> | null = null;

function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
}

// ─── Checkout via Stripe.js ─────────────────────────────

export async function redirectToCheckout(config: StripeCheckoutConfig): Promise<void> {
  const stripe = await getStripe();
  if (!stripe) {
    // Fallback : activation locale sans Stripe
    activatePackLocally(config.packSlug);
    return;
  }

  const priceId = PRICE_IDS[config.packSlug]?.[config.billingCycle];
  if (!priceId || priceId.startsWith('price_')) {
    // Pas de price ID réel configuré → activation locale
    activatePackLocally(config.packSlug);
    return;
  }

  // Redirection vers Stripe Checkout
  const { error } = await stripe.redirectToCheckout({
    lineItems: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    successUrl: config.successUrl,
    cancelUrl: config.cancelUrl,
    customerEmail: config.customerEmail,
  });

  if (error) {
    throw new Error(error.message);
  }
}

// ─── Activation locale (fallback sans Stripe) ───────────

function activatePackSlug(pack: 'pro' | 'expert' | 'institutional') {
  // Met à jour le pack de l'utilisateur en session
  const sessionRaw = localStorage.getItem('xtrendai_local_auth');
  if (sessionRaw) {
    try {
      const session = JSON.parse(sessionRaw);
      session.pack = pack;
      session.packStatus = 'active';
      session.paymentPending = 'no';
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      session.packExpiresAt = expiry.toISOString();
      localStorage.setItem('xtrendai_local_auth', JSON.stringify(session));
    } catch {
      // ignore
    }
  }

  // Met à jour aussi dans auth_users
  const usersRaw = localStorage.getItem('xtrendai_auth_users');
  if (usersRaw) {
    try {
      const users = JSON.parse(usersRaw);
      const session = JSON.parse(sessionRaw || '{}');
      const user = users.find((u: any) => u.id === session.id);
      if (user) {
        user.pack = pack;
        user.packStatus = 'active';
        user.paymentPending = 'no';
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        user.packExpiresAt = expiry.toISOString();
        localStorage.setItem('xtrendai_auth_users', JSON.stringify(users));
      }
    } catch {
      // ignore
    }
  }
}

export function activatePackLocally(packSlug: 'pro' | 'expert' | 'institutional'): void {
  activatePackSlug(packSlug);
}

export function isStripeConfigured(): boolean {
  return !STRIPE_PUBLIC_KEY.startsWith('pk_test_') || STRIPE_PUBLIC_KEY.length > 20;
}

// ─── Payment Link Generator ─────────────────────────────
// Génère un lien de paiement Stripe sans backend

export function getStripePaymentLink(packSlug: string, cycle: 'monthly' | 'yearly'): string {
  // En production, remplacer par vos vrais liens de paiement Stripe
  const links: Record<string, Record<string, string>> = {
    pro: {
      monthly: 'https://buy.stripe.com/test_pro_monthly',
      yearly: 'https://buy.stripe.com/test_pro_yearly',
    },
    expert: {
      monthly: 'https://buy.stripe.com/test_expert_monthly',
      yearly: 'https://buy.stripe.com/test_expert_yearly',
    },
    institutional: {
      monthly: 'https://buy.stripe.com/test_insti_monthly',
      yearly: 'https://buy.stripe.com/test_insti_yearly',
    },
  };
  return links[packSlug]?.[cycle] || '';
}
