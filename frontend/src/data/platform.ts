import {
  Activity,
  BellRing,
  Bot,
  BriefcaseBusiness,
  CalendarClock,
  CandlestickChart,
  Crown,
  Gauge,
  ShieldCheck,
  Sparkles,
  Target,
  TowerControl,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import type { ComponentType } from "react";
import { formatCompactCurrency, formatCurrency } from "@/lib/formatters";

type LucideIcon = ComponentType<{ size?: number; className?: string }>;

export type Tone = "bullish" | "bearish" | "neutral" | "premium";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export interface MarketTicker {
  symbol: string;
  price: string;
  change: string;
  direction: "up" | "down";
}

export interface FeatureCard {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface TimeframeSignal {
  timeframe: string;
  verdict: string;
  confidence: number;
  tone: Tone;
}

export interface PricePoint {
  label: string;
  price: number;
  rsi: number;
  momentum: number;
}

export interface PerformancePoint {
  label: string;
  equity: number;
  drawdown: number;
}

export interface SignalRow {
  asset: string;
  timeframe: string;
  setup: string;
  direction: Tone;
  confidence: number;
  entry: string;
  stopLoss: string;
  targets: string;
}

export interface EconomicEvent {
  time: string;
  currency: string;
  title: string;
  impact: "High" | "Medium" | "Low";
  actual: string;
  forecast: string;
  previous: string;
}

export interface AlertItem {
  time: string;
  asset: string;
  message: string;
  tone: Tone;
}

export interface Plan {
  name: string;
  price: number | null;
  priceLabel?: string;
  description: string;
  featured?: boolean;
  bullets: string[];
}

export interface AdminStat {
  label: string;
  value: string;
  delta: string;
}

export interface AuditRow {
  actor: string;
  action: string;
  scope: string;
  amount: string;
  time: string;
}

export const navItems: NavItem[] = [
  { label: "Market Command", path: "/dashboard", icon: CandlestickChart },
  { label: "Signals", path: "/signals", icon: Sparkles },
  { label: "Gold Desk", path: "/gold", icon: Crown },
  { label: "Data Quality", path: "/quality", icon: CalendarClock },
  { label: "Admin Ops", path: "/admin", icon: TowerControl },
];

export const heroTicker: MarketTicker[] = [
  { symbol: "EUR/USD", price: "1.08124", change: "+0.18%", direction: "up" },
  { symbol: "XAU/USD", price: "2,341.56", change: "+0.72%", direction: "up" },
  { symbol: "US30", price: "39,512.6", change: "+0.43%", direction: "up" },
  { symbol: "BTC/USD", price: "67,842.1", change: "-0.31%", direction: "down" },
  { symbol: "WTI", price: "78.26", change: "-0.19%", direction: "down" },
  { symbol: "AAPL", price: "192.35", change: "+0.41%", direction: "up" },
];

export const dashboardTicker: MarketTicker[] = [
  { symbol: "EUR/USD", price: "1.08562", change: "+0.24%", direction: "up" },
  { symbol: "XAU/USD", price: "2,341.56", change: "+0.72%", direction: "up" },
  { symbol: "GBP/USD", price: "1.27134", change: "-0.11%", direction: "down" },
  { symbol: "USD/JPY", price: "156.83", change: "+0.05%", direction: "up" },
  { symbol: "USOIL", price: "78.62", change: "-0.36%", direction: "down" },
];

export const featureCards: FeatureCard[] = [
  {
    title: "Multi-Timeframe Engine",
    description: "AI aligns M1 to MN to surface only the setups that survive cross-timeframe confirmation.",
    icon: Gauge,
  },
  {
    title: "Institutional Gold Module",
    description: "Dedicated XAU/USD order-flow view with liquidity zones, key levels, and premium execution context.",
    icon: Crown,
  },
  {
    title: "Risk Command Center",
    description: "Entry, stop, take profits, drawdown limits, and real-time exposure mapped in one decision layer.",
    icon: ShieldCheck,
  },
  {
    title: "Economic Calendar Intelligence",
    description: "News impact translated into trade context, volatility posture, and timing warnings.",
    icon: CalendarClock,
  },
  {
    title: "Admin Control Tower",
    description: "Subscriptions, users, alerts, licenses, and system health monitored in one operational cockpit.",
    icon: BriefcaseBusiness,
  },
];

export const timeframeSignals: TimeframeSignal[] = [
  { timeframe: "M5", verdict: "Accumulation", confidence: 68, tone: "neutral" },
  { timeframe: "M15", verdict: "Strong Buy", confidence: 89, tone: "bullish" },
  { timeframe: "H1", verdict: "Confirmed Buy", confidence: 92, tone: "bullish" },
  { timeframe: "H4", verdict: "Moderate Bullish", confidence: 81, tone: "bullish" },
  { timeframe: "D1", verdict: "Wait Pullback", confidence: 58, tone: "neutral" },
  { timeframe: "W1", verdict: "Bullish Bias", confidence: 73, tone: "bullish" },
  { timeframe: "MN", verdict: "Trend Intact", confidence: 77, tone: "premium" },
];

export const primaryChart: PricePoint[] = [
  { label: "13", price: 1.0789, rsi: 42, momentum: 18 },
  { label: "14", price: 1.0804, rsi: 49, momentum: 22 },
  { label: "15", price: 1.0812, rsi: 53, momentum: 28 },
  { label: "16", price: 1.0835, rsi: 61, momentum: 35 },
  { label: "17", price: 1.0846, rsi: 65, momentum: 41 },
  { label: "18", price: 1.0838, rsi: 58, momentum: 33 },
  { label: "19", price: 1.0857, rsi: 67, momentum: 44 },
  { label: "20", price: 1.0865, rsi: 71, momentum: 48 },
  { label: "21", price: 1.0848, rsi: 55, momentum: 29 },
  { label: "22", price: 1.0869, rsi: 66, momentum: 43 },
  { label: "23", price: 1.0856, rsi: 56, momentum: 31 },
];

export const goldChart: PricePoint[] = [
  { label: "06:00", price: 2322, rsi: 48, momentum: 22 },
  { label: "09:00", price: 2328, rsi: 55, momentum: 28 },
  { label: "12:00", price: 2336, rsi: 61, momentum: 35 },
  { label: "15:00", price: 2334, rsi: 58, momentum: 33 },
  { label: "18:00", price: 2341, rsi: 64, momentum: 42 },
  { label: "21:00", price: 2345, rsi: 69, momentum: 47 },
];

export const performanceData: PerformancePoint[] = [
  { label: "Week 1", equity: 105000, drawdown: 2.4 },
  { label: "Week 2", equity: 108200, drawdown: 2.1 },
  { label: "Week 3", equity: 110500, drawdown: 2.6 },
  { label: "Week 4", equity: 109900, drawdown: 1.8 },
  { label: "Week 5", equity: 113400, drawdown: 1.9 },
  { label: "Week 6", equity: 115200, drawdown: 2.2 },
  { label: "Week 7", equity: 118100, drawdown: 1.7 },
  { label: "Week 8", equity: 121400, drawdown: 1.4 },
  { label: "Week 9", equity: 123500, drawdown: 1.8 },
  { label: "Week 10", equity: 127900, drawdown: 1.3 },
];

export const signalRows: SignalRow[] = [
  {
    asset: "EUR/USD",
    timeframe: "H1",
    setup: "Support retest after bullish BOS",
    direction: "bullish",
    confidence: 92,
    entry: "1.08580",
    stopLoss: "1.07920",
    targets: "1.09450 / 1.10320",
  },
  {
    asset: "XAU/USD",
    timeframe: "M15",
    setup: "Liquidity sweep into premium demand",
    direction: "bullish",
    confidence: 90,
    entry: "2,338.40",
    stopLoss: "2,331.90",
    targets: "2,347.60 / 2,355.40",
  },
  {
    asset: "USD/JPY",
    timeframe: "H4",
    setup: "Bearish divergence under H4 resistance",
    direction: "bearish",
    confidence: 84,
    entry: "156.42",
    stopLoss: "157.18",
    targets: "155.80 / 155.10",
  },
  {
    asset: "BTC/USD",
    timeframe: "H1",
    setup: "Wait for reclaim above VWAP cluster",
    direction: "neutral",
    confidence: 58,
    entry: "67,980",
    stopLoss: "66,740",
    targets: "69,150 / 70,420",
  },
];

export const eventRows: EconomicEvent[] = [
  {
    time: "10:30",
    currency: "USD",
    title: "Initial Jobless Claims",
    impact: "High",
    actual: "215K",
    forecast: "220K",
    previous: "217K",
  },
  {
    time: "12:00",
    currency: "EUR",
    title: "ECB President Lagarde Speaks",
    impact: "High",
    actual: "-",
    forecast: "-",
    previous: "-",
  },
  {
    time: "13:30",
    currency: "USD",
    title: "Philadelphia Fed Manufacturing Index",
    impact: "Medium",
    actual: "6.5",
    forecast: "8.0",
    previous: "5.7",
  },
  {
    time: "15:00",
    currency: "USD",
    title: "Existing Home Sales",
    impact: "Medium",
    actual: "4.11M",
    forecast: "4.20M",
    previous: "4.28M",
  },
  {
    time: "17:30",
    currency: "USD",
    title: "Fed Waller Speaks",
    impact: "Low",
    actual: "-",
    forecast: "-",
    previous: "-",
  },
];

export const alertItems: AlertItem[] = [
  { time: "10:14:32", asset: "EUR/USD", message: "Price above 1.08550 with H1 confirmation", tone: "bullish" },
  { time: "10:13:07", asset: "XAU/USD", message: "Breakout above 2,340.00", tone: "bullish" },
  { time: "10:12:10", asset: "GBP/USD", message: "RSI oversold on H1", tone: "neutral" },
  { time: "10:10:45", asset: "USD/JPY", message: "Price below 156.80 resistance shelf", tone: "bearish" },
];

export const plans: Plan[] = [
  {
    name: "FREE",
    price: 0,
    description: "Monitor the live market fallback layer and discover the platform foundations.",
    bullets: ["Live market board", "Provider fallback visibility", "1 workspace", "Audit overview"],
  },
  {
    name: "PRO",
    price: 79,
    description: "Operational live data, premium gold monitoring, and advanced workspace access.",
    featured: true,
    bullets: ["Everything in FREE", "Gold desk access", "Advanced watchlists", "Priority support"],
  },
  {
    name: "EXPERT",
    price: 199,
    description: "Expanded monitoring and control surfaces for serious operators and teams.",
    bullets: ["Everything in PRO", "Operational audit center", "Advanced API oversight", "Dedicated onboarding"],
  },
  {
    name: "INSTITUTIONNEL",
    price: null,
    priceLabel: "Custom",
    description: "Custom governance, provider strategy, and enterprise operating requirements.",
    bullets: ["Everything in EXPERT", "Institutional governance", "Custom compliance flows", "Shared success planning"],
  },
];

export const adminStats: AdminStat[] = [
  { label: "Total users", value: "1,248", delta: "+12.9%" },
  { label: "Active traders", value: "842", delta: "+8.3%" },
  { label: "Monthly recurring revenue", value: formatCompactCurrency(24600), delta: "+15.7%" },
  { label: "Signal deliveries", value: "9.3M", delta: "+11.2%" },
];

export const auditRows: AuditRow[] = [
  { actor: "John Doe", action: "Deposit approved", scope: "USDT", amount: formatCurrency(10000, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), time: "2m ago" },
  { actor: "System", action: "Pro renewal processed", scope: "Stripe", amount: formatCurrency(79, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), time: "8m ago" },
  { actor: "Risk Bot", action: "Drawdown lock triggered", scope: "Expert plan", amount: "-", time: "13m ago" },
  { actor: "Admin", action: "Telegram alerts enabled", scope: "Workspace 18", amount: "-", time: "27m ago" },
];

export const trustedStats = [
  { label: "Tracked live instruments", value: "14" },
  { label: "Provider tiers", value: "4" },
  { label: "Audit modules", value: "9" },
  { label: "Fallback objective", value: "No blanks" },
];

export const landingHighlights = [
  "Provider fallback across four market data tiers",
  "Source, timestamp, quality, and update visibility",
  "Operational oversight from the admin audit center",
  "Removal of deceptive demo and fake platform claims",
];

export const aiReasoning = [
  "RSI remains constructive on M15 with no bearish divergence.",
  "MACD bullish cross was confirmed after a clean support retest.",
  "H1 trend structure stays intact with higher lows across London session.",
  "Upcoming USD events do not invalidate the current setup window.",
];

export const dashboardCards = [
  { label: "Account Balance", value: formatCurrency(125430.68, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), icon: WalletCards },
  { label: "Daily Risk", value: "0.45%", icon: ShieldCheck },
  { label: "Sharpe Ratio", value: "1.78", icon: TrendingUp },
  { label: "AI Modules Online", value: "12", icon: Bot },
];

export const landingQuickBadges = [
  { label: "AI-driven insights", icon: Sparkles },
  { label: "Multi-timeframe confidence", icon: Activity },
  { label: "Institutional risk controls", icon: Target },
  { label: "Alerts, one platform", icon: BellRing },
];
