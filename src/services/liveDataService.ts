/**
 * LiveDataService — Service centralisé de données live pour toute la plateforme
 * 
 * PRINCIPE: Non-bloquant par design
 * 1. Retourne immédiatement les données en cache / fallback (0ms)
 * 2. Démarre un fetch complet en arrière-plan après 1s
 * 3. Notifie les abonnés quand les données live arrivent
 * 4. Refreshe toutes les 30s
 * 5. Jamais de throw, jamais de blocage
 */

import { fetchAllPrices } from './marketApi';
import type { PriceData } from './marketApi';

export type { PriceData };

// Fallback prices — displayed immediately before live data arrives
const FALLBACK_PRICES: Record<string, PriceData> = {
  'XAU/USD': { price: 4470.00, change24h: 5.36, change24hPercent: 0.12, high24h: 4485.00, low24h: 4455.00, source: 'fallback', lastUpdate: Date.now() },
  'XAG/USD': { price: 30.20, change24h: 0.13, change24hPercent: 0.45, high24h: 30.50, low24h: 29.90, source: 'fallback', lastUpdate: Date.now() },
  'BTC/USD': { price: 67500.00, change24h: 1552.00, change24hPercent: 2.35, high24h: 68500.00, low24h: 66000.00, source: 'fallback', lastUpdate: Date.now() },
  'ETH/USD': { price: 3520.00, change24h: 64.00, change24hPercent: 1.85, high24h: 3600.00, low24h: 3450.00, source: 'fallback', lastUpdate: Date.now() },
  'SOL/USD': { price: 145.00, change24h: 4.50, change24hPercent: 3.20, high24h: 150.00, low24h: 140.00, source: 'fallback', lastUpdate: Date.now() },
  'BNB/USD': { price: 590.00, change24h: 8.50, change24hPercent: 1.46, high24h: 600.00, low24h: 580.00, source: 'fallback', lastUpdate: Date.now() },
  'EUR/USD': { price: 1.0850, change24h: -0.0027, change24hPercent: -0.25, high24h: 1.0880, low24h: 1.0820, source: 'fallback', lastUpdate: Date.now() },
  'GBP/USD': { price: 1.2750, change24h: 0.0019, change24hPercent: 0.15, high24h: 1.2780, low24h: 1.2720, source: 'fallback', lastUpdate: Date.now() },
  'USD/JPY': { price: 149.50, change24h: -0.52, change24hPercent: -0.35, high24h: 150.20, low24h: 149.00, source: 'fallback', lastUpdate: Date.now() },
  'USD/CHF': { price: 0.9050, change24h: 0.0027, change24hPercent: 0.30, high24h: 0.9080, low24h: 0.9020, source: 'fallback', lastUpdate: Date.now() },
  'NAS100': { price: 19500.00, change24h: 212.00, change24hPercent: 1.10, high24h: 19650.00, low24h: 19300.00, source: 'fallback', lastUpdate: Date.now() },
  'SPX500': { price: 5500.00, change24h: 46.00, change24hPercent: 0.85, high24h: 5550.00, low24h: 5450.00, source: 'fallback', lastUpdate: Date.now() },
  'DE40': { price: 18500.00, change24h: 120.00, change24hPercent: 0.65, high24h: 18650.00, low24h: 18350.00, source: 'fallback', lastUpdate: Date.now() },
  'WTI': { price: 78.50, change24h: 1.16, change24hPercent: 1.50, high24h: 79.50, low24h: 77.20, source: 'fallback', lastUpdate: Date.now() },
  'BRENT': { price: 82.30, change24h: 1.10, change24hPercent: 1.35, high24h: 83.30, low24h: 81.00, source: 'fallback', lastUpdate: Date.now() },
};

type Subscriber = (data: Record<string, PriceData>, isLive: boolean) => void;

class LiveDataService {
  private data: Record<string, PriceData> = { ...FALLBACK_PRICES };
  private subscribers: Subscriber[] = [];
  private isLive = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private interval: ReturnType<typeof setInterval> | null = null;
  private started = false;
  private fetching = false;

  /** Démarre le service — appelé une seule fois au montage de l'app */
  start() {
    if (this.started) return;
    this.started = true;

    // Première tentative après 1s (la page est déjà rendue)
    this.timer = setTimeout(() => this.fetchLiveData(), 1000);

    // Puis toutes les 30s
    this.interval = setInterval(() => this.fetchLiveData(), 30000);
  }

  /** Arrête le service */
  stop() {
    if (this.timer) clearTimeout(this.timer);
    if (this.interval) clearInterval(this.interval);
    this.started = false;
  }

  /** S'abonne aux mises à jour */
  subscribe(cb: Subscriber): () => void {
    this.subscribers.push(cb);
    // Notifie immédiatement avec les données actuelles
    cb(this.data, this.isLive);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== cb);
    };
  }

  /** Retourne les données actuelles (synchrone) */
  getData(): Record<string, PriceData> {
    return this.data;
  }

  getIsLive(): boolean {
    return this.isLive;
  }

  /** Âge des données en secondes */
  getDataAge(): number {
    const timestamps = Object.values(this.data).map(d => d.lastUpdate).filter(t => t > 0);
    if (timestamps.length === 0) return Infinity;
    const newest = Math.max(...timestamps);
    return (Date.now() - newest) / 1000;
  }

  private async fetchLiveData() {
    if (this.fetching) return; // Évite les appels parallèles
    this.fetching = true;

    try {
      // Timeout 10s — jamais de blocage
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const data = await Promise.race([
        fetchAllPrices(),
        new Promise<Record<string, PriceData>>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 10000);
        }),
      ]);

      clearTimeout(timeoutId);

      const hasNewData = Object.keys(data).length > 0;
      if (!hasNewData) {
        this.fetching = false;
        return;
      }

      // Fusionne : garde les données live, complète avec fallback pour les manquants
      const merged: Record<string, PriceData> = {};
      const allKeys = new Set([...Object.keys(this.data), ...Object.keys(data)]);
      
      for (const key of allKeys) {
        const live = data[key];
        const fallback = FALLBACK_PRICES[key];
        const current = this.data[key];
        
        if (live && live.price > 0) {
          // Donnée live disponible
          merged[key] = { ...live, lastUpdate: Date.now() };
        } else if (current && current.price > 0 && current.source !== 'fallback') {
          // Donnée live précédente encore valide
          merged[key] = current;
        } else if (fallback) {
          // Fallback
          merged[key] = { ...fallback };
        }
      }

      // Vérifie si les données ont réellement changé avant de notifier
      const hasChanged = Object.keys(merged).some(key => {
        const old = this.data[key];
        const neu = merged[key];
        return !old || old.price !== neu.price;
      });

      if (hasChanged) {
        this.data = merged;
        this.isLive = true;
        this.notify();
      }
    } catch {
      // Silencieux — on garde les données précédentes
    } finally {
      this.fetching = false;
    }
  }

  private notify() {
    this.subscribers.forEach(cb => {
      try { cb(this.data, this.isLive); } catch { /* ignore */ }
    });
  }
}

// Singleton — partagé par toute l'application
export const liveDataService = new LiveDataService();
