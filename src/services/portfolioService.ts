import type { PortfolioStats, Trade } from "@/types";
import { average, createId, readStorage, sum, writeStorage } from "@/lib/utils";

const TRADES_KEY = "xtrendai_trades";

export function getTrades() {
  return readStorage<Trade[]>(TRADES_KEY, []);
}

export function saveTrade(trade: Omit<Trade, "id" | "openedAt" | "status">) {
  const nextTrade: Trade = {
    id: createId("trd"),
    openedAt: new Date().toISOString(),
    status: "open",
    ...trade,
  };

  writeStorage(TRADES_KEY, [nextTrade, ...getTrades()]);
  return nextTrade;
}

export function closeTrade(tradeId: string, exitPrice: number) {
  const trades = getTrades();
  const updatedTrades = trades.map((trade) => {
    if (trade.id !== tradeId || trade.status === "closed") {
      return trade;
    }

    const pnlDirection = trade.type === "ACHAT" ? exitPrice - trade.entryPrice : trade.entryPrice - exitPrice;
    const pnl = pnlDirection * trade.size;
    return {
      ...trade,
      exitPrice,
      closedAt: new Date().toISOString(),
      status: "closed" as const,
      pnl,
    };
  });

  writeStorage(TRADES_KEY, updatedTrades);
  return updatedTrades.find((trade) => trade.id === tradeId) ?? null;
}

export function deleteTrade(tradeId: string) {
  writeStorage(
    TRADES_KEY,
    getTrades().filter((trade) => trade.id !== tradeId),
  );
}

export function getPortfolioStats(): PortfolioStats {
  const trades = getTrades();
  const closedTrades = trades.filter((trade) => trade.status === "closed" && typeof trade.pnl === "number");
  const wins = closedTrades.filter((trade) => (trade.pnl ?? 0) > 0);
  const losses = closedTrades.filter((trade) => (trade.pnl ?? 0) < 0);
  const grossProfit = sum(wins.map((trade) => trade.pnl ?? 0));
  const grossLoss = Math.abs(sum(losses.map((trade) => trade.pnl ?? 0)));
  const totalPnl = sum(closedTrades.map((trade) => trade.pnl ?? 0));
  const monthlyMap = new Map<string, number>();

  closedTrades.forEach((trade) => {
    const month = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" }).format(new Date(trade.closedAt ?? trade.openedAt));
    monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + (trade.pnl ?? 0));
  });

  return {
    totalTrades: trades.length,
    closedTrades: closedTrades.length,
    winRate: closedTrades.length ? (wins.length / closedTrades.length) * 100 : 0,
    profitFactor: grossLoss ? grossProfit / grossLoss : grossProfit,
    totalPnl,
    avgWin: average(wins.map((trade) => trade.pnl ?? 0)),
    avgLoss: average(losses.map((trade) => trade.pnl ?? 0)),
    monthlyPerformance: Array.from(monthlyMap.entries()).map(([month, pnl]) => ({ month, pnl })),
  };
}
