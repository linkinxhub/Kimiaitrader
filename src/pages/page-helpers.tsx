import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { ArrowRight, RefreshCw, ShieldCheck, Zap } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AISignal, AssetQuote, PackPrices } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { isDemoMode, mapDemoSignals } from "@/services/demoData";
import { generateSignals } from "@/services/aiSignalEngine";
import { fetchMarketOverview, getSourcesStatus } from "@/services/marketApi";
import { formatCompact, formatCurrency, formatDate, formatNumber, formatPercent } from "@/lib/format";
import { Badge, Button, Card, MetricPill, SectionHeader, StatCard } from "@/components/ui/primitives";

function buildSparkline(seed: number, direction: number) {
  return Array.from({ length: 7 }, (_, index) => ({
    step: `${index + 1}`,
    value: Number((seed + direction * index + Math.sin(index * 1.4) * (Math.abs(direction) + 1)).toFixed(2)),
  }));
}

export function useWorkspaceData() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<AssetQuote[]>([]);
  const [signals, setSignals] = useState<AISignal[]>([]);
  const [loading, setLoading] = useState(true);
  const demo = isDemoMode(user);

  async function refresh() {
    setLoading(true);
    try {
      const nextQuotes = await fetchMarketOverview(demo);
      const nextSignals = demo ? mapDemoSignals() : generateSignals(nextQuotes, user);
      startTransition(() => {
        setQuotes(nextQuotes);
        setSignals(nextSignals);
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [demo, user?.id]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      refresh();
    }, demo ? 180000 : 60000);
    return () => window.clearInterval(interval);
  }, [demo, user?.id]);

  const deferredQuotes = useDeferredValue(quotes);
  const deferredSignals = useDeferredValue(signals);

  const priceMap = useMemo(() => Object.fromEntries(deferredQuotes.map((quote) => [quote.symbol, quote.price])), [deferredQuotes]);
  const topSignal = deferredSignals[0] ?? null;
  const topMover = [...deferredQuotes].sort((left, right) => Math.abs(right.change24h) - Math.abs(left.change24h))[0] ?? null;
  const marketSplit = useMemo(
    () => ({
      crypto: deferredQuotes.filter((quote) => quote.market === "crypto").length,
      forex: deferredQuotes.filter((quote) => quote.market === "forex").length,
      metal: deferredQuotes.filter((quote) => quote.market === "metal").length,
    }),
    [deferredQuotes],
  );

  return {
    quotes: deferredQuotes,
    signals: deferredSignals,
    loading,
    refresh,
    isDemo: demo,
    priceMap,
    topSignal,
    topMover,
    marketSplit,
    sources: getSourcesStatus(demo),
  };
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
    <div className="space-y-8">
      <SectionHeader title={title} description={description} action={action} />
      {children}
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

export function WorkspaceHero({
  eyebrow,
  title,
  description,
  quotes,
  signals,
  loading,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  quotes: AssetQuote[];
  signals: AISignal[];
  loading?: boolean;
}) {
  const dominant = signals[0];
  const heroQuote = quotes[0];
  const chartData = buildSparkline(heroQuote?.price ?? 100, heroQuote?.change24h ?? 0.5);

  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="overflow-hidden p-0">
        <div className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
          <div className="space-y-5">
            {eyebrow ? <p className="text-sm uppercase tracking-[0.3em] text-[#6fe7dd]">{eyebrow}</p> : null}
            <div className="space-y-4">
              <h1 className="max-w-3xl font-display text-4xl leading-none tracking-[-0.06em] text-white md:text-6xl">{title}</h1>
              <p className="max-w-2xl text-base leading-8 text-slate-300">{description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-slate-500">Signal fort</p>
                <p className="mt-2 font-display text-2xl tracking-[-0.04em] text-white">{dominant?.asset ?? "En cours"}</p>
                <p className="mt-1 text-sm text-slate-400">{dominant ? `${dominant.direction} a ${dominant.confidence}%` : "Generation IA"}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-slate-500">Source dominante</p>
                <p className="mt-2 font-display text-2xl tracking-[-0.04em] text-white">{heroQuote?.source ?? "Live"}</p>
                <p className="mt-1 text-sm text-slate-400">{heroQuote?.label ?? "Multi-actifs"}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-slate-500">Etat desk</p>
                <p className="mt-2 font-display text-2xl tracking-[-0.04em] text-white">{loading ? "Sync..." : "Active"}</p>
                <p className="mt-1 text-sm text-slate-400">Refresh live toutes les 60s</p>
              </div>
            </div>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,17,29,0.85),rgba(7,17,29,0.5))] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Market pulse</p>
                <p className="mt-2 font-display text-3xl tracking-[-0.05em] text-white">{heroQuote?.label ?? "XAU/USD"}</p>
              </div>
              <Badge className={heroQuote && heroQuote.change24h >= 0 ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200" : "border-rose-400/20 bg-rose-500/10 text-rose-200"}>
                {heroQuote ? formatPercent(heroQuote.change24h) : "0.0%"}
              </Badge>
            </div>
            <p className="mt-4 font-display text-5xl tracking-[-0.06em] text-white">{heroQuote ? formatNumber(heroQuote.price, heroQuote.price > 100 ? 2 : 4) : "--"}</p>
            <div className="mt-5 h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="heroPulse" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#6fe7dd" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#6fe7dd" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="step" stroke="#64748b" tickLine={false} axisLine={false} />
                  <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                  <Tooltip cursor={{ stroke: "rgba(255,255,255,0.1)" }} contentStyle={{ background: "#07111d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18 }} />
                  <Area type="monotone" dataKey="value" stroke="#6fe7dd" fill="url(#heroPulse)" strokeWidth={2.4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Card>

      <Card className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Execution brief</p>
            <h3 className="mt-2 font-display text-3xl tracking-[-0.05em] text-white">{dominant?.asset ?? "Signal board"}</h3>
          </div>
          <Badge className="border-[#6fe7dd]/20 bg-[#6fe7dd]/10 text-[#b4fff7]">{dominant?.timeframe ?? "H1"}</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[22px] border border-white/10 bg-slate-950/40 p-4">
            <p className="text-sm text-slate-500">Direction</p>
            <p className="mt-2 font-display text-2xl text-white">{dominant?.direction ?? "ATTENTE"}</p>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-slate-950/40 p-4">
            <p className="text-sm text-slate-500">Risk reward</p>
            <p className="mt-2 font-display text-2xl text-white">{dominant ? dominant.riskRewardRatio.toFixed(2) : "--"}</p>
          </div>
        </div>
        <div className="space-y-3 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <ShieldCheck className="size-4 text-[#6fe7dd]" />
            Lecture rapide du setup IA
          </div>
          {dominant?.explanation?.slice(0, 3).map((item) => (
            <p key={item} className="text-sm leading-7 text-slate-400">
              {item}
            </p>
          )) ?? <p className="text-sm text-slate-400">Les signaux se chargeront ici.</p>}
        </div>
      </Card>
    </div>
  );
}

export function DashboardStats({ quotes, signals, isDemo }: { quotes: AssetQuote[]; signals: AISignal[]; isDemo: boolean }) {
  const totalVolume = quotes.reduce((sum, quote) => sum + (quote.volume ?? 0), 0);
  const highestConviction = signals.reduce((best, signal) => Math.max(best, signal.confidence), 0);

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <StatCard label="Mode" value={isDemo ? "Demo" : "Live"} tone={isDemo ? "text-slate-100" : "text-[#6fe7dd]"} helper={isDemo ? "Free sandbox" : "API en direct"} />
      <StatCard label="Actifs suivis" value={String(quotes.length)} helper="Crypto, forex, metal" />
      <StatCard label="Conviction max" value={`${highestConviction}%`} helper={`${signals.length} signaux actifs`} />
      <StatCard label="Volume observe" value={formatCompact(totalVolume)} helper="Donnees 24h agrégées" />
    </div>
  );
}

export function QuoteGrid({ quotes }: { quotes: AssetQuote[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {quotes.map((quote) => (
        <Card key={quote.symbol} className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-2xl tracking-[-0.04em] text-white">{quote.label}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">{quote.source}</p>
            </div>
            <Badge className={quote.change24h >= 0 ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200" : "border-rose-400/20 bg-rose-500/10 text-rose-200"}>
              {formatPercent(quote.change24h)}
            </Badge>
          </div>
          <p className="font-display text-4xl tracking-[-0.05em] text-white">{formatNumber(quote.price, quote.price > 100 ? 2 : 4)}</p>
          <div className="grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
            <p>High {quote.high24h ? formatNumber(quote.high24h, 2) : "--"}</p>
            <p>Low {quote.low24h ? formatNumber(quote.low24h, 2) : "--"}</p>
            <p>Volume {quote.volume ? formatCompact(quote.volume) : "--"}</p>
            <p>Update {formatDate(quote.updatedAt)}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function SignalGrid({ signals }: { signals: AISignal[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {signals.map((signal) => (
        <Card key={signal.id} className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-2xl tracking-[-0.04em] text-white">{signal.asset}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">
                {signal.timeframe} - {signal.source}
              </p>
            </div>
            <Badge
              className={
                signal.direction === "ACHAT"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                  : signal.direction === "VENTE"
                    ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
                    : "border-amber-500/20 bg-amber-500/10 text-amber-200"
              }
            >
              {signal.direction}
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[20px] border border-white/8 bg-slate-950/35 p-3">
              <p className="text-sm text-slate-500">Entry</p>
              <p className="mt-1 font-display text-2xl text-white">{formatNumber(signal.entryPoint, 4)}</p>
            </div>
            <div className="rounded-[20px] border border-white/8 bg-slate-950/35 p-3">
              <p className="text-sm text-slate-500">SL</p>
              <p className="mt-1 font-display text-2xl text-white">{formatNumber(signal.stopLoss, 4)}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-slate-400">
            <p>TP {signal.takeProfits.map((value) => formatNumber(value, 4)).join(" / ")}</p>
            <p>Confidence {signal.confidence}% - RR {signal.riskRewardRatio}</p>
            <p>Risk {signal.riskLevel}</p>
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
        <Card key={`${signal.id}-insight`} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl tracking-[-0.04em] text-white">{signal.asset}</h3>
            <Badge>{signal.riskLevel}</Badge>
          </div>
          <div className="space-y-2 text-sm leading-7 text-slate-300">
            {signal.explanation.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

export function SourceStatusGrid({
  sources,
}: {
  sources: Array<{ name: string; latency: string; status: string }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {sources.map((source) => (
        <Card key={source.name} className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-display text-xl tracking-[-0.04em] text-white">{source.name}</p>
            <Badge>{source.status}</Badge>
          </div>
          <p className="text-sm text-slate-400">Latence {source.latency}</p>
        </Card>
      ))}
    </div>
  );
}

export function MarketSnapshotRail({ quotes }: { quotes: AssetQuote[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {quotes.slice(0, 3).map((quote) => (
        <Card key={`${quote.symbol}-snapshot`} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{quote.market}</p>
              <p className="mt-2 font-display text-3xl tracking-[-0.05em] text-white">{quote.label}</p>
            </div>
            <Zap className="size-5 text-[#6fe7dd]" />
          </div>
          <p className="text-sm leading-7 text-slate-300">
            {quote.change24h >= 0 ? "Flux acheteur encore en place." : "Pression vendeuse a surveiller."} Source {quote.source}, mise a jour {formatDate(quote.updatedAt)}.
          </p>
        </Card>
      ))}
    </div>
  );
}

export function PublicCtaStrip() {
  const settings = usePlatformSettings();

  return (
    <Card className="flex flex-col items-start justify-between gap-5 border-[#6fe7dd]/20 bg-[linear-gradient(135deg,rgba(111,231,221,0.12),rgba(245,158,11,0.05))] md:flex-row md:items-center">
      <div>
        <h3 className="font-display text-3xl tracking-[-0.05em] text-white">{settings.finalCtaTitle}</h3>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">{settings.finalCtaDescription}</p>
      </div>
      <Link to="/register">
        <Button>
          {settings.primaryCtaLabel}
          <ArrowRight className="ml-2 size-4" />
        </Button>
      </Link>
    </Card>
  );
}

export function MarketingMetricStrip() {
  const settings = usePlatformSettings();

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {settings.heroMetrics.map((metric) => (
        <MetricPill key={metric.label} label={metric.label} value={metric.value} helper={metric.note} />
      ))}
    </div>
  );
}

export function PricingSummary({
  prices,
  yearlyPrices,
}: {
  prices: PackPrices;
  yearlyPrices: PackPrices;
}) {
  const rows = [
    {
      pack: "Free",
      monthly: prices.free,
      yearly: yearlyPrices.free,
      features: ["Dashboard", "Signals demo", "Alerts", "Journal"],
    },
    {
      pack: "Pro",
      monthly: prices.pro,
      yearly: yearlyPrices.pro,
      features: ["Live data", "Gold room", "Radar", "Scanner"],
    },
    {
      pack: "Expert",
      monthly: prices.expert,
      yearly: yearlyPrices.expert,
      features: ["AI assistant", "Strategy lab", "MT export", "Smart money"],
    },
    {
      pack: "Institutional",
      monthly: prices.institutional,
      yearly: yearlyPrices.institutional,
      features: ["Admin scale", "API center", "Multi-account", "Priority support"],
    },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {rows.map((row) => (
        <Card key={row.pack} className="flex h-full flex-col gap-4">
          <div className="space-y-2">
            <p className="font-display text-3xl tracking-[-0.05em] text-white">{row.pack}</p>
            <p className="text-sm text-slate-400">{row.features.join(" - ")}</p>
          </div>
          <div className="space-y-1">
            <p className="font-display text-4xl tracking-[-0.05em] text-white">{row.monthly === 0 ? "0 EUR" : formatCurrency(row.monthly)}</p>
            <p className="text-sm text-slate-400">ou {row.yearly === 0 ? "0 EUR" : formatCurrency(row.yearly)} / an</p>
          </div>
          <div className="mt-auto space-y-2 text-sm text-slate-300">
            {row.features.map((feature) => (
              <p key={feature}>- {feature}</p>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
