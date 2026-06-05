import type { AuthUser, Pack, PackAnalytics, SignalRecord } from "@/types";
import { getAllRegisteredUsers } from "@/services/authService";
import { getPortfolioStats } from "@/services/portfolioService";
import { createId, readStorage, writeStorage } from "@/lib/utils";

const SIGNAL_RECORDS_KEY = "xtrendai_signal_records";
const PROJECTIONS: Record<Exclude<Pack, "free">, { signals: number; winRate: number; pnl: number }> = {
  pro: { signals: 89, winRate: 66.7, pnl: 2850 },
  expert: { signals: 156, winRate: 71.4, pnl: 6240 },
  institutional: { signals: 312, winRate: 76.8, pnl: 18950 },
};

export function getSignalRecords() {
  return readStorage<SignalRecord[]>(SIGNAL_RECORDS_KEY, []);
}

export function recordSignalGenerated(payload: Omit<SignalRecord, "id">) {
  const next: SignalRecord = {
    id: createId("record"),
    ...payload,
  };

  writeStorage(SIGNAL_RECORDS_KEY, [next, ...getSignalRecords()].slice(0, 500));
  return next;
}

export async function getAnalytics(currentUser: AuthUser | null): Promise<PackAnalytics[]> {
  const records = getSignalRecords();
  const users = await getAllRegisteredUsers();
  const stats = getPortfolioStats();

  const makeTrends = (base: number) => Array.from({ length: 7 }, (_, index) => Number((base + Math.sin(index) * 4 + index * 0.8).toFixed(1)));

  const packs: Pack[] = ["free", "pro", "expert", "institutional"];
  return packs.map((pack) => {
    const packUsers = users.filter((user) => user.pack === pack || (pack === "institutional" && user.role === "admin"));
    const recentRecords = records.filter((record) => record.pack === pack);
    const recordBoost = recentRecords.length;

    if (pack === "free") {
      return {
        pack,
        signals: 3,
        winRate: 0,
        pnl: 0,
        trades: 0,
        engagement: 38,
        trends7d: makeTrends(32),
      };
    }

    const projection = PROJECTIONS[pack];
    const weightedSignals = projection.signals + recordBoost;
    return {
      pack,
      signals: weightedSignals,
      winRate: Number((projection.winRate + packUsers.length * 0.2).toFixed(1)),
      pnl: Number((projection.pnl + stats.totalPnl * 0.45).toFixed(0)),
      trades: Math.max(12, stats.closedTrades + packUsers.length * 3),
      engagement: Math.min(96, 58 + packUsers.length * 4 + recordBoost),
      trends7d: makeTrends(projection.winRate),
    };
  });
}
