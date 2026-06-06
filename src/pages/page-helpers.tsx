import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, RefreshCw } from "lucide-react";
import type { AISignal, AssetQuote } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { isDemoMode, mapDemoSignals } from "@/services/demoData";
import { fetchMarketOverview } from "@/services/marketApi";
import { generateSignals } from "@/services/aiSignalEngine";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/format";
import { Badge, Button, Card, SectionHeader, StatCard } from "@/components/ui/primitives";

export function useWorkspaceData() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<AssetQuote[]>([]);
  const [signals, setSignals] = useState<AISignal[]>([]);
  const [loading, setLoading] = useState(true);

  const demo = isDemoMode(user);

  const refresh = async () => {
    setLoading(true);
    try {
      const nextQuotes = await fetchMarketOverview(demo);
      setQuotes(nextQuotes);
      setSignals(demo ? mapDemoSignals() : generateSignals(nextQuotes, user));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [user?.id, demo]);

  const priceMap = useMemo(
    () =>
      Object.fromEntries(
        quotes.map((quote) => [
          quote.symbol,
          quote.price,
        ]),
      ),
    [quotes],
  );

  return { quotes, signals, loading, refresh, priceMap, isDemo: demo };
}

export function AppPageFrame({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader title={title} description={description} action={action} />
      {children}
    </div>
  );
}

export function QuoteGrid({ quotes }: { quotes: AssetQuote[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {quotes.map((quote) => (
        <Card key={quote.symbol} className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-lg text-white">{quote.label}</p>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{quote.source}</p>
            </div>
            <Badge className={quote.change24h >= 0 ? "border-emerald-400/20 text-emerald-200" : "border-red-400/20 text-red-200"}>
              {formatPercent(quote.change24h)}
            </Badge>
          </div>
          <p className="font-display text-3xl font-semibold text-white">{formatNumber(quote.price, quote.price > 100 ? 2 : 4)}</p>
          <p className="text-sm text-slate-400">
            {quote.high24h ? `Haut ${formatNumber(quote.high24h, 2)} • ` : null}
            {quote.low24h ? `Bas ${formatNumber(quote.low24h, 2)}` : null}
          </p>
        </Card>
      ))}
    </div>
  );
}

export function SignalGrid({ signals }: { signals: AISignal[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {signals.map((signal) => (
        <Card key={signal.id} className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-lg text-white">{signal.asset}</p>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{signal.timeframe} • {signal.source}</p>
            </div>
            <Badge
              className={
                signal.direction === "ACHAT"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                  : signal.direction === "VENTE"
                    ? "border-red-500/20 bg-red-500/10 text-red-200"
                    : "border-amber-500/20 bg-amber-500/10 text-amber-200"
              }
            >
              {signal.direction}
            </Badge>
          </div>
          <p className="text-sm text-slate-300">Confiance {signal.confidence}% • RR {signal.riskRewardRatio}</p>
          <div className="space-y-1 text-sm text-slate-400">
            <p>Entrée {formatNumber(signal.entryPoint, 4)}</p>
            <p>SL {formatNumber(signal.stopLoss, 4)}</p>
            <p>TP {signal.takeProfits.map((value) => formatNumber(value, 4)).join(" / ")}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function SignalInsightList({ signals }: { signals: AISignal[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {signals.map((signal) => (
        <Card key={`${signal.id}-insight`} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg text-white">{signal.asset}</h3>
            <Badge>{signal.riskLevel}</Badge>
          </div>
          <div className="space-y-2 text-sm text-slate-300">
            {signal.explanation.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

export function DataRefreshButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <Button variant="secondary" onClick={onClick} disabled={loading}>
      <RefreshCw className="mr-2 size-4" />
      Actualiser
    </Button>
  );
}

export function PublicCtaStrip() {
  return (
    <Card className="flex flex-col items-start justify-between gap-4 border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 md:flex-row md:items-center">
      <div>
        <h3 className="font-display text-2xl text-white">Prêt à passer d'une lecture marché à un vrai système de décision ?</h3>
        <p className="mt-2 text-sm text-slate-300">Créez votre compte, testez le mode démo Free, puis activez les flux live quand vous êtes prêt.</p>
      </div>
      <Link to="/register">
        <Button>
          Commencer
          <ArrowRight className="ml-2 size-4" />
        </Button>
      </Link>
    </Card>
  );
}

export function DashboardStats({ quotes, signals, isDemo }: { quotes: AssetQuote[]; signals: AISignal[]; isDemo: boolean }) {
  const topSignal = signals[0];
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <StatCard label="Mode" value={isDemo ? "Demo" : "Live"} tone={isDemo ? "text-slate-200" : "text-blue-300"} helper={isDemo ? "Pack Free" : "APIs réelles"} />
      <StatCard label="Actifs Suivis" value={String(quotes.length)} helper="Crypto, Forex, Métaux" />
      <StatCard label="Signaux IA" value={String(signals.length)} helper={topSignal ? `${topSignal.asset} en tête` : "Aucun signal"} />
      <StatCard label="Risque" value={topSignal?.riskLevel ?? "Stable"} helper={topSignal ? `Confiance ${topSignal.confidence}%` : "Veille active"} />
    </div>
  );
}
