/**
 * pricePublisher — Publie les prix vers les variables globales
 * pour useLiveAlerts et d'autres consommateurs.
 * 
 * Séparé de useLiveAlerts.ts pour éviter les imports cross-hook.
 */

export function publishPrices(prices: Record<string, { price: number; change24hPercent?: number }>) {
  (window as any).__LIVE_PRICES__ = prices;
}

export function publishWsPrices(prices: Record<string, number>) {
  (window as any).__WS_PRICES__ = prices;
}

export function publishWsStatus(status: string) {
  (window as any).__WS_STATUS__ = status;
}

export function publishSignals(signals: any[]) {
  (window as any).__LIVE_SIGNALS__ = signals;
}

export function publishScannerResults(results: any[]) {
  (window as any).__SCANNER_RESULTS__ = results;
}
