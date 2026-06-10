/**
 * Formate un montant en devise avec le symbole approprié
 * @param amount - Le montant à formater
 * @param currency - La devise (EUR, USD, GBP) - défaut: EUR
 * @returns string formaté: "79 €" ou "$ 129.00"
 */
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  const symbols: Record<string, string> = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    JPY: '¥',
    CHF: 'CHF',
  };

  const symbol = symbols[currency] || currency;
  const formatted = amount.toLocaleString('fr-FR', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });

  // Position du symbole: après pour EUR, avant pour USD/GBP
  if (currency === 'EUR' || currency === 'CHF') {
    return `${formatted} ${symbol}`;
  }
  return `${symbol}${formatted}`;
}

/**
 * Formate un prix avec symbole € propre
 * @param price - Le prix à formater
 * @returns string: "3 380,50 €"
 */
export function formatPrice(price: number): string {
  return price.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' €';
}

/**
 * Formate un pourcentage
 * @param value - La valeur à formater
 * @param decimals - Nombre de décimales
 * @returns string: "+12,4%" ou "-0,37%"
 */
export function formatPercent(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`;
}

/**
 * Formate un nombre de pips
 * @param pips - Le nombre de pips
 * @returns string: "+150 pips" ou "-45 pips"
 */
export function formatPips(pips: number): string {
  const sign = pips >= 0 ? '+' : '';
  return `${sign}${pips.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} pips`;
}

/**
 * Formate une date en format français
 * @param date - La date à formater
 * @returns string: "04/06/2026 14:30"
 */
export function formatDateTime(date: Date): string {
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formate un timeframe pour l'affichage
 * @param tf - Le timeframe (M1, H1, D1...)
 * @returns string formaté
 */
export function formatTimeFrame(tf: string): string {
  return tf;
}
