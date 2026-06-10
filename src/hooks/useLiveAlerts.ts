/**
 * useLiveAlerts — Hook de surveillance temps réel des données marché
 * Génère des alertes automatiques quand :
 * - Un nouveau signal de haute confiance apparaît
 * - Un prix fait un mouvement significatif (>2% en 1h)
 * - Le WebSocket se déconnecte/reconnecte
 * - Une opportunité scanner émerge
 * 
 * Ce hook est conçu pour être utilisé UNE SEULE FOIS dans l'app (dans Layout)
 * pour éviter les doublons.
 */

import { useEffect, useRef } from 'react';
import {
  alertSignalGenerated,
  alertSystem,
  alertScannerOpportunity,
  alertPriceTarget,
} from '@/services/alertService';

interface PriceSnapshot {
  price: number;
  timestamp: number;
}

// ─── Price Movement Detector ──────────────────────────────
const priceHistory = new Map<string, PriceSnapshot[]>();
const MAX_HISTORY = 20; // Keep last 20 snapshots per asset
const SIGNIFICANT_MOVE_PCT = 2.0; // Alert on >2% move
const PRICE_CHECK_INTERVAL_MS = 30000; // Check every 30s

function recordPrice(asset: string, price: number): void {
  const history = priceHistory.get(asset) || [];
  history.push({ price, timestamp: Date.now() });
  if (history.length > MAX_HISTORY) history.shift();
  priceHistory.set(asset, history);
}

function detectSignificantMove(asset: string, currentPrice: number): { move: number; direction: 'UP' | 'DOWN' } | null {
  const history = priceHistory.get(asset);
  if (!history || history.length < 3) return null;

  // Compare against price from ~5 minutes ago
  const baseline = history[Math.max(0, history.length - 5)];
  if (!baseline || baseline.price === 0) return null;

  const movePct = ((currentPrice - baseline.price) / baseline.price) * 100;

  if (Math.abs(movePct) >= SIGNIFICANT_MOVE_PCT) {
    return {
      move: Math.abs(movePct),
      direction: movePct > 0 ? 'UP' : 'DOWN',
    };
  }
  return null;
}

// ─── Signal Deduplication ─────────────────────────────────
const alertedSignalIds = new Set<string>();
const alertedPriceMoves = new Map<string, number>(); // asset -> last alerted timestamp
const PRICE_ALERT_COOLDOWN_MS = 5 * 60 * 1000; // 5 min between price alerts for same asset

// ─── Hook ─────────────────────────────────────────────────

export function useLiveAlerts() {
  // Track WebSocket status
  const wsWasConnected = useRef(false);

  // ─── 1. Watch live prices for significant moves ─────────
  useEffect(() => {
    const checkPrices = () => {
      try {
        // Try to get prices from multiple sources
        const prices: Record<string, number> = {};

        // From useMarketData (global state)
        if ((window as any).__LIVE_PRICES__) {
          Object.entries((window as any).__LIVE_PRICES__).forEach(([asset, data]: [string, any]) => {
            if (data && typeof data.price === 'number') {
              prices[asset] = data.price;
            }
          });
        }

        // From websocket service
        if ((window as any).__WS_PRICES__) {
          Object.entries((window as any).__WS_PRICES__).forEach(([asset, price]: [string, any]) => {
            if (typeof price === 'number') {
              prices[asset] = price;
            }
          });
        }

        // Process each price
        Object.entries(prices).forEach(([asset, price]) => {
          if (!price || price <= 0) return;

          recordPrice(asset, price);

          const move = detectSignificantMove(asset, price);
          if (move) {
            const lastAlert = alertedPriceMoves.get(asset);
            const now = Date.now();
            if (!lastAlert || (now - lastAlert) > PRICE_ALERT_COOLDOWN_MS) {
              alertedPriceMoves.set(asset, now);
              alertPriceTarget(
                asset,
                price,
                price * (1 - move.move / 100),
                move.direction === 'UP' ? 'au-dessus' : 'en-dessous'
              );
            }
          }
        });
      } catch {
        // Silently fail — alert system should never crash the app
      }
    };

    // Check immediately and then every 30s
    checkPrices();
    const interval = setInterval(checkPrices, PRICE_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // ─── 2. Watch for new signals ───────────────────────────
  useEffect(() => {
    const checkSignals = () => {
      try {
        const signals = (window as any).__LIVE_SIGNALS__;
        if (!signals || !Array.isArray(signals)) return;

        signals.forEach((sig: any) => {
          if (!sig || !sig.id) return;
          if (alertedSignalIds.has(sig.id)) return;

          // Only alert for high-confidence signals
          if (sig.confidence >= 80) {
            alertedSignalIds.add(sig.id);
            alertSignalGenerated(sig.asset, sig.signal, sig.confidence);
          }
        });

        // Cleanup old IDs to prevent memory leak
        if (alertedSignalIds.size > 200) {
          const toDelete = Array.from(alertedSignalIds).slice(0, 100);
          toDelete.forEach(id => alertedSignalIds.delete(id));
        }
      } catch {
        // Silently fail
      }
    };

    checkSignals();
    const interval = setInterval(checkSignals, 20000); // Check every 20s
    return () => clearInterval(interval);
  }, []);

  // ─── 3. Watch WebSocket connection status ────────────────
  useEffect(() => {
    const checkWs = () => {
      try {
        const wsStatus = (window as any).__WS_STATUS__;
        if (!wsStatus) return;

        if (wsStatus === 'connected' && !wsWasConnected.current) {
          wsWasConnected.current = true;
          // Optional: alert on reconnect
          // alertSystem('Connexion WebSocket restaurée', 'La connexion temps réel à Binance est de nouveau active.', 'low');
        }

        if (wsStatus === 'disconnected' && wsWasConnected.current) {
          wsWasConnected.current = false;
          alertSystem(
            'Connexion temps réel perdue',
            'La connexion WebSocket à Binance est interrompue. Les prix passent en mode fallback API (30s).',
            'high'
          );
        }
      } catch {
        // Silently fail
      }
    };

    checkWs();
    const interval = setInterval(checkWs, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, []);

  // ─── 4. Watch scanner results ────────────────────────────
  useEffect(() => {
    const checkScanner = () => {
      try {
        const scannerResults = (window as any).__SCANNER_RESULTS__;
        if (!scannerResults || !Array.isArray(scannerResults)) return;

        scannerResults.forEach((result: any) => {
          if (!result || !result.asset) return;
          if (result.confidence >= 85 && result.alert) {
            // Use asset+confidence as dedup key
            const key = `scanner-${result.asset}-${result.confidence}`;
            if (!alertedSignalIds.has(key)) {
              alertedSignalIds.add(key);
              alertScannerOpportunity(result.signal || 'opportunité', result.asset, result.confidence);
            }
          }
        });
      } catch {
        // Silently fail
      }
    };

    checkScanner();
    const interval = setInterval(checkScanner, 25000); // Check every 25s
    return () => clearInterval(interval);
  }, []);
}

// ─── Data Publishers (re-exported from pricePublisher for backward compat) ───

export {
  publishPrices,
  publishWsPrices,
  publishWsStatus,
  publishSignals,
  publishScannerResults,
} from '@/services/pricePublisher';
