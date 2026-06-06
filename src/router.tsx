import { lazy } from "react";
import { createHashRouter, Navigate, Outlet } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { PackGuard } from "@/components/PackGuard";

const LandingPage = lazy(() => import("@/pages/LandingPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const UpdatesPage = lazy(() => import("@/pages/UpdatesPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const XAUPremiumPage = lazy(() => import("@/pages/XAUPremiumPage"));
const SignalsPage = lazy(() => import("@/pages/SignalsPage"));
const RadarOpportunitiesPage = lazy(() => import("@/pages/RadarOpportunitiesPage"));
const SmartMoneyPage = lazy(() => import("@/pages/SmartMoneyPage"));
const AIAssistantPage = lazy(() => import("@/pages/AIAssistantPage"));
const IntelligenceCenterPage = lazy(() => import("@/pages/IntelligenceCenterPage"));
const StrategyLabPage = lazy(() => import("@/pages/StrategyLabPage"));
const SimulatorPage = lazy(() => import("@/pages/SimulatorPage"));
const TechnicalPage = lazy(() => import("@/pages/TechnicalPage"));
const CalendarPage = lazy(() => import("@/pages/CalendarPage"));
const HistoryPage = lazy(() => import("@/pages/HistoryPage"));
const RiskPage = lazy(() => import("@/pages/RiskPage"));
const PriceAlertsPage = lazy(() => import("@/pages/PriceAlertsPage"));
const PortfolioPage = lazy(() => import("@/pages/PortfolioPage"));
const MultiAssetPage = lazy(() => import("@/pages/MultiAssetPage"));
const MarketScannerPage = lazy(() => import("@/pages/MarketScannerPage"));
const MTExportPage = lazy(() => import("@/pages/MTExportPage"));
const BillingPage = lazy(() => import("@/pages/BillingPage"));
const SubscriptionPage = lazy(() => import("@/pages/SubscriptionPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const AdminPanelPage = lazy(() => import("@/pages/AdminPanelPage"));
const AdminSecurityPage = lazy(() => import("@/pages/AdminSecurityPage"));
const ApiCenterPage = lazy(() => import("@/pages/ApiCenterPage"));
const OandaSettingsPage = lazy(() => import("@/pages/OandaSettingsPage"));

function AppLayout() {
  return <Layout />;
}

export const router = createHashRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/updates", element: <UpdatesPage /> },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { path: "dashboard", element: <PackGuard><DashboardPage /></PackGuard> },
      { path: "xauusd", element: <PackGuard minPack="pro"><XAUPremiumPage /></PackGuard> },
      { path: "signals", element: <PackGuard><SignalsPage /></PackGuard> },
      { path: "radar", element: <PackGuard minPack="pro"><RadarOpportunitiesPage /></PackGuard> },
      { path: "smart-money", element: <PackGuard minPack="expert"><SmartMoneyPage /></PackGuard> },
      { path: "ai-assistant", element: <PackGuard minPack="expert"><AIAssistantPage /></PackGuard> },
      { path: "intelligence", element: <PackGuard><IntelligenceCenterPage /></PackGuard> },
      { path: "strategy-lab", element: <PackGuard minPack="expert"><StrategyLabPage /></PackGuard> },
      { path: "simulator", element: <PackGuard minPack="pro"><SimulatorPage /></PackGuard> },
      { path: "technical", element: <PackGuard><TechnicalPage /></PackGuard> },
      { path: "calendar", element: <PackGuard><CalendarPage /></PackGuard> },
      { path: "history", element: <PackGuard><HistoryPage /></PackGuard> },
      { path: "risk", element: <PackGuard><RiskPage /></PackGuard> },
      { path: "alerts", element: <PackGuard><PriceAlertsPage /></PackGuard> },
      { path: "portfolio", element: <PackGuard><PortfolioPage /></PackGuard> },
      { path: "multi-asset", element: <PackGuard minPack="pro"><MultiAssetPage /></PackGuard> },
      { path: "scanner", element: <PackGuard minPack="pro"><MarketScannerPage /></PackGuard> },
      { path: "mt-export", element: <PackGuard minPack="expert"><MTExportPage /></PackGuard> },
      { path: "billing", element: <PackGuard><BillingPage /></PackGuard> },
      { path: "subscription", element: <PackGuard><SubscriptionPage /></PackGuard> },
      { path: "settings", element: <PackGuard><SettingsPage /></PackGuard> },
      { path: "admin", element: <PackGuard adminOnly><AdminPanelPage /></PackGuard> },
      { path: "admin/security", element: <PackGuard adminOnly><AdminSecurityPage /></PackGuard> },
      { path: "api-center", element: <PackGuard adminOnly><ApiCenterPage /></PackGuard> },
      { path: "oanda", element: <PackGuard><OandaSettingsPage /></PackGuard> },
      { path: "", element: <Navigate to="/dashboard" replace /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
