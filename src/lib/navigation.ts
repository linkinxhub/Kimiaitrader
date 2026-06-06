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
  Globe2,
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

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Market Desk",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { label: "Signals", path: "/signals", icon: Sparkles },
      { label: "Gold Room", path: "/xauusd", icon: CandlestickChart, minPack: "pro", badge: "PRO" },
      { label: "Radar", path: "/radar", icon: Radar, minPack: "pro", badge: "PRO" },
      { label: "Intelligence", path: "/intelligence", icon: Globe2, badge: "LIVE" },
      { label: "Technical", path: "/technical", icon: Gauge },
      { label: "Calendar", path: "/calendar", icon: BarChart3 },
      { label: "History", path: "/history", icon: History },
    ],
  },
  {
    label: "Execution",
    items: [
      { label: "Risk", path: "/risk", icon: ShieldCheck },
      { label: "Alerts", path: "/alerts", icon: Bell },
      { label: "Portfolio", path: "/portfolio", icon: Wallet },
      { label: "Multi-Asset", path: "/multi-asset", icon: BriefcaseBusiness, minPack: "pro", badge: "PRO" },
      { label: "Scanner", path: "/scanner", icon: ScanSearch, minPack: "pro", badge: "PRO" },
      { label: "Simulator", path: "/simulator", icon: Activity, minPack: "pro", badge: "PRO" },
      { label: "MT Export", path: "/mt-export", icon: Target, minPack: "expert", badge: "EXPERT" },
      { label: "OANDA", path: "/oanda", icon: CandlestickChart, badge: "BROKER" },
    ],
  },
  {
    label: "Research",
    items: [
      { label: "Smart Money", path: "/smart-money", icon: Brain, minPack: "expert", badge: "EXPERT" },
      { label: "AI Assistant", path: "/ai-assistant", icon: Bot, minPack: "expert", badge: "EXPERT" },
      { label: "Strategy Lab", path: "/strategy-lab", icon: Waypoints, minPack: "expert", badge: "EXPERT" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Billing", path: "/billing", icon: CreditCard },
      { label: "Subscription", path: "/subscription", icon: CreditCard },
      { label: "Settings", path: "/settings", icon: Settings },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Admin Panel", path: "/admin", icon: Lock, adminOnly: true, badge: "ADMIN" },
      { label: "Admin Security", path: "/admin/security", icon: AlertTriangle, adminOnly: true, badge: "ADMIN" },
      { label: "API Center", path: "/api-center", icon: Globe2, adminOnly: true, badge: "ADMIN" },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);
