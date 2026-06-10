/**
 * Packs Hook - Version statique (sans backend)
 * Les données de packs sont servies depuis localStorage ou valeurs par défaut
 * Le Super Admin peut modifier les prix via Admin Panel > Packs
 */

import { useMemo } from 'react';
import { getPlatformSettings } from '@/services/platformSettingsService';
import { isDemoMode } from '@/services/demoData';

export interface Pack {
  id: number;
  slug: 'free' | 'pro' | 'expert' | 'institutional';
  name: string;
  description: string;
  priceMonthly: string;
  priceYearly: string;
  features: string[];
  limitations?: string[];
  order: number;
  recommended: 'yes' | 'no';
  active: 'yes' | 'no';
  stripePriceIdMonthly: null;
  stripePriceIdYearly: null;
  createdAt: Date;
}

const DEFAULT_PACKS: Pack[] = [
  {
    id: 1, slug: 'free', name: 'Free',
    description: 'Accès limité pour découvrir la plateforme',
    priceMonthly: '0.00', priceYearly: '0.00',
    features: ['1 signal IA par jour', 'Analyse M15', 'Dashboard basique', 'Support email', 'Alertes Prix', 'Journal de Trading'],
    limitations: ['Pas d\'accès XAU/USD Premium', 'Pas de Smart Money', 'Pas de Scanner Marché', 'Pas de Multi-Actifs', 'Pas d\'Assistant IA', 'Pas d\'Export MT4/5'],
    order: 1, recommended: 'no', active: 'yes',
    stripePriceIdMonthly: null, stripePriceIdYearly: null,
    createdAt: new Date(),
  },
  {
    id: 2, slug: 'pro', name: 'Pro',
    description: 'Pour les traders actifs cherchant des signaux précis',
    priceMonthly: '79.00', priceYearly: '790.00',
    features: ['Signaux IA illimités', 'Module XAU/USD Premium', 'Calendrier économique', 'Analyse multi-timeframes', 'Simulateur trading', 'Gestion du risque avancée', 'Scanner de Marché', 'Comparatif Multi-Actifs', 'Support prioritaire'],
    limitations: ['Pas de Smart Money Tracker', 'Pas de Laboratoire de Stratégies', 'Pas d\'Assistant IA expert', 'Pas d\'Export MT4/5'],
    order: 2, recommended: 'yes', active: 'yes',
    stripePriceIdMonthly: null, stripePriceIdYearly: null,
    createdAt: new Date(),
  },
  {
    id: 3, slug: 'expert', name: 'Expert',
    description: 'Outils professionnels pour traders confirmés',
    priceMonthly: '199.00', priceYearly: '1990.00',
    features: ['Tout le pack Pro', 'Smart Money Tracker', 'Laboratoire de Stratégies (backtest)', 'Assistant IA Trading', 'Radar d\'opportunités IA', 'Intelligence Center', 'Export MetaTrader (MQL4/5/CSV/JSON)', 'API privée'],
    limitations: [],
    order: 3, recommended: 'no', active: 'yes',
    stripePriceIdMonthly: null, stripePriceIdYearly: null,
    createdAt: new Date(),
  },
  {
    id: 4, slug: 'institutional', name: 'Institutionnel',
    description: 'Solution complète pour les institutions',
    priceMonthly: '499.00', priceYearly: '4990.00',
    features: ['Tout le pack Expert', 'Multi-comptes (10 traders)', 'API dédiée avec rate limit élevé', 'White label possible', 'Support dédié 24/7', 'Onboarding personnalisé', 'Rapports mensuels custom', 'SLA garanti'],
    limitations: [],
    order: 4, recommended: 'no', active: 'yes',
    stripePriceIdMonthly: null, stripePriceIdYearly: null,
    createdAt: new Date(),
  },
];

// Load pack prices from admin-configured settings
function loadPacksWithAdminPrices(): Pack[] {
  const settings = getPlatformSettings();
  const prices = settings.packPrices;
  const yearly = settings.packPricesYearly;

  return DEFAULT_PACKS.map(p => ({
    ...p,
    priceMonthly: p.slug === 'free' ? '0.00' : String(prices[p.slug]),
    priceYearly: p.slug === 'free' ? '0.00' : String(yearly[p.slug]),
  }));
}

export function usePacks() {
  const packs = useMemo(() => {
    return loadPacksWithAdminPrices();
  }, []);

  return { packs, isLoading: false };
}

export function getPackBySlug(slug: string): Pack | undefined {
  return loadPacksWithAdminPrices().find(p => p.slug === slug);
}
