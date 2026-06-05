import type { PriceAlert, TriggeredAlert } from "@/types";
import { createId, readStorage, writeStorage } from "@/lib/utils";

const ALERTS_KEY = "xtrendai_price_alerts";
const ALERT_HISTORY_KEY = "xtrendai_triggered_alerts";

export function getAlerts() {
  return readStorage<PriceAlert[]>(ALERTS_KEY, []);
}

export function getTriggeredAlerts() {
  return readStorage<TriggeredAlert[]>(ALERT_HISTORY_KEY, []);
}

export function createAlert(payload: Omit<PriceAlert, "id" | "createdAt" | "active">) {
  const next: PriceAlert = {
    id: createId("alert"),
    createdAt: new Date().toISOString(),
    active: true,
    ...payload,
  };

  writeStorage(ALERTS_KEY, [next, ...getAlerts()]);
  return next;
}

export function updateAlert(id: string, payload: Partial<PriceAlert>) {
  const alerts = getAlerts().map((alert) => (alert.id === id ? { ...alert, ...payload } : alert));
  writeStorage(ALERTS_KEY, alerts);
  return alerts.find((alert) => alert.id === id) ?? null;
}

export function deleteAlert(id: string) {
  writeStorage(
    ALERTS_KEY,
    getAlerts().filter((alert) => alert.id !== id),
  );
}

export function checkAlerts(prices: Record<string, number>) {
  const alerts = getAlerts();
  const triggered = alerts
    .filter((alert) => alert.active)
    .filter((alert) => {
      const currentPrice = prices[alert.asset];
      if (currentPrice === undefined) {
        return false;
      }

      if (alert.condition === "ABOVE") return currentPrice > alert.targetPrice;
      if (alert.condition === "BELOW") return currentPrice < alert.targetPrice;
      return currentPrice === alert.targetPrice;
    })
    .map<TriggeredAlert>((alert) => ({
      ...alert,
      active: false,
      triggeredAt: new Date().toISOString(),
      marketPrice: prices[alert.asset],
    }));

  if (!triggered.length) {
    return [];
  }

  writeStorage(
    ALERTS_KEY,
    alerts.map((alert) => (triggered.some((item) => item.id === alert.id) ? { ...alert, active: false } : alert)),
  );
  writeStorage(ALERT_HISTORY_KEY, [...triggered, ...getTriggeredAlerts()].slice(0, 100));
  return triggered;
}
