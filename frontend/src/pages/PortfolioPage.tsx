import { useState } from "react";
import { Download } from "lucide-react";
import { AppPageFrame } from "@/pages/page-helpers";
import { closeTrade, getPortfolioStats, getTrades, saveTrade } from "@/services/portfolioService";
import { exportTradeJournalToPDF } from "@/services/pdfExportService";
import { formatCurrency } from "@/lib/format";
import { Button, Card, Input, Select } from "@/components/ui/primitives";

export default function PortfolioPage() {
  const [, rerender] = useState(0);
  const [asset, setAsset] = useState("BTC/USD");
  const [type, setType] = useState("ACHAT");
  const [entryPrice, setEntryPrice] = useState("68000");
  const [size, setSize] = useState("0.2");
  const trades = getTrades();
  const stats = getPortfolioStats();

  return (
    <AppPageFrame
      title="Journal de trading"
      description="Suivi manuel des trades, clôture, calcul PnL, et export PDF du journal."
      action={
        <Button variant="secondary" onClick={() => exportTradeJournalToPDF(trades, stats)}>
          <Download className="mr-2 size-4" />
          Export journal
        </Button>
      }
    >
      <Card className="grid gap-4 lg:grid-cols-4">
        <Input value={asset} onChange={(event) => setAsset(event.target.value)} />
        <Select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="ACHAT">ACHAT</option>
          <option value="VENTE">VENTE</option>
        </Select>
        <Input value={entryPrice} onChange={(event) => setEntryPrice(event.target.value)} />
        <Input value={size} onChange={(event) => setSize(event.target.value)} />
        <Button
          className="lg:col-span-4"
          onClick={() => {
            saveTrade({
              asset,
              type: type as never,
              entryPrice: Number(entryPrice),
              size: Number(size),
            });
            rerender((value) => value + 1);
          }}
        >
          Ajouter le trade
        </Button>
      </Card>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="text-slate-300">Trades: {stats.totalTrades}</Card>
        <Card className="text-slate-300">Win rate: {stats.winRate.toFixed(1)}%</Card>
        <Card className="text-slate-300">Profit factor: {stats.profitFactor.toFixed(2)}</Card>
        <Card className="text-slate-300">PnL: {formatCurrency(stats.totalPnl)}</Card>
      </div>

      <div className="grid gap-4">
        {trades.length ? trades.map((trade) => (
          <Card key={trade.id} className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-display text-xl text-white">{trade.asset}</p>
              <p className="text-sm text-slate-400">{trade.type} • entrée {trade.entryPrice} • taille {trade.size}</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm text-slate-300">{trade.pnl ? formatCurrency(trade.pnl) : trade.status}</p>
              {trade.status === "open" ? (
                <Button variant="secondary" onClick={() => { closeTrade(trade.id, trade.entryPrice * 1.02); rerender((value) => value + 1); }}>
                  Clôturer +2%
                </Button>
              ) : null}
            </div>
          </Card>
        )) : <Card className="text-slate-400">Aucun trade journalisé.</Card>}
      </div>
    </AppPageFrame>
  );
}
