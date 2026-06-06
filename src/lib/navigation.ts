import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  Brain,
  BriefcaseBusiness,
  CandlestickChart,
  CreditCard,
  Gauge,
  Globe,
  History,
  LayoutDashboard,
  Lock,
  Radar,
  ScanSearch,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Wallet,
  Waypoints,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Pack } from "@/types";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  minPack?: Pack;
  badge?: string;
  adminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Signaux IA", path: "/signals", icon: Sparkles },
  { label: "XAU/USD Premium", path: "/xauusd", icon: CandlestickChart, minPack: "pro", badge: "PRO" },
  { label: "Radar Opportunités", path: "/radar", icon: Radar, minPack: "pro", badge: "PRO" },
  { label: "Smart Money", path: "/smart-money", icon: Brain, minPack: "expert", badge: "EXPERT" },
  { label: "Assistant IA", path: "/ai-assistant", icon: Bot, minPack: "expert", badge: "EXPERT" },
  { label: "Intelligence Center", path: "/intelligence", icon: Globe, badge: "NEW" },
  { label: "Strategy Lab", path: "/strategy-lab", icon: Waypoints, minPack: "expert", badge: "EXPERT" },
  { label: "Simulateur", path: "/simulator", icon: Activity, minPack: "pro", badge: "PRO" },
  { label: "Analyse Technique", path: "/technical", icon: Gauge },
  { label: "Calendrier", path: "/calendar", icon: BarChart3 },
  { label: "Historique", path: "/history", icon: History },
  { label: "Risk Manager", path: "/risk", icon: ShieldCheck },
  { label: "Alertes", path: "/alerts", icon: Bell },
  { label: "Portfolio", path: "/portfolio", icon: Wallet },
  { label: "Multi-Asset", path: "/multi-asset", icon: BriefcaseBusiness, minPack: "pro", badge: "PRO" },
  { label: "Scanner Marché", path: "/scanner", icon: ScanSearch, minPack: "pro", badge: "PRO" },
  { label: "Export MT4/5", path: "/mt-export", icon: Target, minPack: "expert", badge: "EXPERT" },
  { label: "Billing", path: "/billing", icon: CreditCard },
  { label: "Abonnement", path: "/subscription", icon: CreditCard },
  { label: "OANDA", path: "/oanda", icon: CandlestickChart, badge: "BROKER" },
  { label: "Paramètres", path: "/settings", icon: Settings },
  { label: "Admin Panel", path: "/admin", icon: Lock, adminOnly: true, badge: "ADMIN" },
  { label: "Admin Security", path: "/admin/security", icon: AlertTriangle, adminOnly: true, badge: "ADMIN" },
  { label: "API Center", path: "/api-center", icon: Globe, adminOnly: true, badge: "ADMIN" },
];
