/**
 * Portfolio / Trading Journal Service
 * Suivi des trades réels avec calcul de P&L
 */

export interface Trade {
  id: string;
  asset: string;
  type: 'ACHAT' | 'VENTE';
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  takeProfit: number;
  size: number; // nombre de lots/unités
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  openedAt: string;
  closedAt?: string;
  pnl?: number; // profit/loss en devise
  pnlPercent?: number;
  notes?: string;
  signalId?: string; // lien vers le signal IA
  strategy?: string;
}

export interface PortfolioStats {
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  totalPnl: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  bestTrade: number;
  worstTrade: number;
  currentExposure: number;
}

const TRADES_KEY = 'xtrendai_trades';

// ─── CRUD ───────────────────────────────────────────────

export function getTrades(): Trade[] {
  try {
    const raw = localStorage.getItem(TRADES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addTrade(trade: Omit<Trade, 'id' | 'openedAt' | 'status'>): Trade {
  const trades = getTrades();
  const newTrade: Trade = {
    ...trade,
    id: `trade-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    openedAt: new Date().toISOString(),
    status: 'OPEN',
  };
  trades.unshift(newTrade);
  localStorage.setItem(TRADES_KEY, JSON.stringify(trades));
  return newTrade;
}

export function closeTrade(id: string, exitPrice: number, notes?: string): Trade | null {
  const trades = getTrades();
  const trade = trades.find(t => t.id === id);
  if (!trade || trade.status !== 'OPEN') return null;

  const pnl = trade.type === 'ACHAT'
    ? (exitPrice - trade.entryPrice) * trade.size
    : (trade.entryPrice - exitPrice) * trade.size;

  const pnlPercent = trade.type === 'ACHAT'
    ? ((exitPrice - trade.entryPrice) / trade.entryPrice) * 100
    : ((trade.entryPrice - exitPrice) / trade.entryPrice) * 100;

  const updated = trades.map(t =>
    t.id === id
      ? { ...t, status: 'CLOSED' as const, exitPrice, closedAt: new Date().toISOString(), pnl, pnlPercent, notes: notes || t.notes }
      : t
  );
  localStorage.setItem(TRADES_KEY, JSON.stringify(updated));
  return updated.find(t => t.id === id) || null;
}

export function cancelTrade(id: string): void {
  const trades = getTrades().map(t =>
    t.id === id ? { ...t, status: 'CANCELLED' as const } : t
  );
  localStorage.setItem(TRADES_KEY, JSON.stringify(trades));
}

export function updateTradeNotes(id: string, notes: string): void {
  const trades = getTrades().map(t =>
    t.id === id ? { ...t, notes } : t
  );
  localStorage.setItem(TRADES_KEY, JSON.stringify(trades));
}

export function deleteTrade(id: string): void {
  const trades = getTrades().filter(t => t.id !== id);
  localStorage.setItem(TRADES_KEY, JSON.stringify(trades));
}

// ─── Stats ──────────────────────────────────────────────

export function getPortfolioStats(): PortfolioStats {
  const trades = getTrades();
  const closed = trades.filter(t => t.status === 'CLOSED');
  const open = trades.filter(t => t.status === 'OPEN');
  const wins = closed.filter(t => (t.pnl || 0) > 0);
  const losses = closed.filter(t => (t.pnl || 0) <= 0);

  const totalPnl = closed.reduce((s, t) => s + (t.pnl || 0), 0);
  const winPnl = wins.reduce((s, t) => s + (t.pnl || 0), 0);
  const lossPnl = Math.abs(losses.reduce((s, t) => s + (t.pnl || 0), 0));

  const exposure = open.reduce((s, t) => s + t.entryPrice * t.size, 0);

  return {
    totalTrades: trades.length,
    openTrades: open.length,
    closedTrades: closed.length,
    winCount: wins.length,
    lossCount: losses.length,
    winRate: closed.length > 0 ? (wins.length / closed.length) * 100 : 0,
    totalPnl,
    avgWin: wins.length > 0 ? winPnl / wins.length : 0,
    avgLoss: losses.length > 0 ? lossPnl / losses.length : 0,
    profitFactor: lossPnl > 0 ? winPnl / lossPnl : winPnl > 0 ? 999 : 0,
    bestTrade: closed.length > 0 ? Math.max(...closed.map(t => t.pnl || 0)) : 0,
    worstTrade: closed.length > 0 ? Math.min(...closed.map(t => t.pnl || 0)) : 0,
    currentExposure: exposure,
  };
}

// ─── Monthly Performance ────────────────────────────────

export interface MonthlyPerformance {
  month: string;
  trades: number;
  wins: number;
  losses: number;
  pnl: number;
  winRate: number;
}

export function getMonthlyPerformance(): MonthlyPerformance[] {
  const trades = getTrades().filter(t => t.status === 'CLOSED');
  const grouped: Record<string, Trade[]> = {};

  trades.forEach(t => {
    const month = t.closedAt ? t.closedAt.slice(0, 7) : 'unknown';
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(t);
  });

  return Object.entries(grouped)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, ts]) => {
      const wins = ts.filter(t => (t.pnl || 0) > 0);
      return {
        month,
        trades: ts.length,
        wins: wins.length,
        losses: ts.length - wins.length,
        pnl: ts.reduce((s, t) => s + (t.pnl || 0), 0),
        winRate: ts.length > 0 ? (wins.length / ts.length) * 100 : 0,
      };
    });
}
