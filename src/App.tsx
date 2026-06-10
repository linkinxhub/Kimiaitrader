import { Routes, Route, Navigate } from 'react-router';
import NotFound from '@/pages/NotFound';
import { Layout } from '@/components/Layout';
import { AuthenticatedRouteGuard, AdminGuard, PackAccessGuard } from '@/components/RouteGuards';

// Public pages (no sidebar)
import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Updates from '@/pages/Updates';

// Billing (special — auth needed but payment may be pending)
import Billing from '@/pages/Billing';

// App pages (with sidebar)
import Dashboard from '@/pages/Dashboard';
import XAUPremium from '@/pages/XAUPremium';
import Signals from '@/pages/Signals';
import Technical from '@/pages/Technical';
import CalendarPage from '@/pages/CalendarPage';
import History from '@/pages/History';
import RiskPage from '@/pages/RiskPage';
import Subscription from '@/pages/Subscription';
import SettingsPage from '@/pages/SettingsPage';
import RadarOpportunities from '@/pages/RadarOpportunities';
import SmartMoneyTracker from '@/pages/SmartMoneyTracker';
import AIAssistant from '@/pages/AIAssistant';
import IntelligenceCenter from '@/pages/IntelligenceCenter';
import StrategyLab from '@/pages/StrategyLab';
import AdminPanel from '@/pages/AdminPanel';
import AdminSettings from '@/pages/AdminSettings';
import ApiCenter from '@/pages/ApiCenter';
import Simulator from '@/pages/Simulator';

// NEW: High priority features
import PriceAlerts from '@/pages/PriceAlerts';
import Portfolio from '@/pages/Portfolio';

// NEW: Medium priority features
import MultiAsset from '@/pages/MultiAsset';
import MarketScanner from '@/pages/MarketScanner';

// NEW: Low priority features
import MTExport from '@/pages/MTExport';

// NEW: Institutional Comparator (Centre de Decision Institutionnel IA)
import InstitutionalComparator from '@/pages/InstitutionalComparator';

// NEW: Profitability Decision Center (Centre de Decision Rentabilite IA)
import ProfitabilityDecisionCenter from '@/pages/ProfitabilityDecisionCenter';

// NEW: Strategy Library (Bibliotheque des Strategies)
import Strategies from '@/pages/Strategies';

// NEW: News Center (Centre News & Decisions IA)
import NewsCenter from '@/pages/NewsCenter';

// NEW: Checkout Page (Paiement securise)
import CheckoutPage from '@/pages/CheckoutPage';

// OANDA API (alternative to XTB)
import OandaSettings from '@/pages/OandaSettings';

// Market Sentiment & Volatility
import MarketSentimentPage from '@/components/MarketSentimentPanel';

// AI Configuration
import AIConfigPage from '@/pages/AIConfigPage';

import './App.css';

// Guards from RouteGuards.tsx — centralized, auditable
const ProtectedRoute = AuthenticatedRouteGuard;
const AdminRoute = AdminGuard;
function PackRoute({ requiredPack, children }: { requiredPack: 'free' | 'pro' | 'expert' | 'institutional'; children: React.ReactNode }) {
  return <PackAccessGuard requiredPack={requiredPack}>{children}</PackAccessGuard>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes — NO sidebar */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/nouveautes" element={<Updates />} />

      {/* App routes — WITH sidebar */}
      <Route element={<Layout />}>
        {/* Free pack — all authenticated users */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/signals" element={<ProtectedRoute><Signals /></ProtectedRoute>} />
        <Route path="/technical" element={<ProtectedRoute><Technical /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/risk" element={<ProtectedRoute><RiskPage /></ProtectedRoute>} />
        <Route path="/intelligence" element={<ProtectedRoute><IntelligenceCenter /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

        {/* News Center — Centre News & Decisions IA (all packs) */}
        <Route path="/news-center" element={<ProtectedRoute><NewsCenter /></ProtectedRoute>} />

        {/* Market Sentiment & Volatility (all packs) */}
        <Route path="/sentiment" element={<ProtectedRoute><MarketSentimentPage /></ProtectedRoute>} />

        {/* AI Configuration (all users) */}
        <Route path="/ai-config" element={<ProtectedRoute><AIConfigPage /></ProtectedRoute>} />

        {/* Checkout — Paiement securise (accessible a tous les utilisateurs authentifies) */}
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />

        {/* Pro pack required */}
        <Route path="/xauusd" element={<PackRoute requiredPack="pro"><XAUPremium /></PackRoute>} />
        <Route path="/radar" element={<PackRoute requiredPack="pro"><RadarOpportunities /></PackRoute>} />
        <Route path="/simulator" element={<PackRoute requiredPack="pro"><Simulator /></PackRoute>} />

        {/* Pro+ — Strategy Library */}
        <Route path="/strategies" element={<PackRoute requiredPack="pro"><Strategies /></PackRoute>} />

        {/* Pro+ — Institutional Comparator (basic for Pro, full for Expert) */}
        <Route path="/institutional-comparator" element={<PackRoute requiredPack="pro"><InstitutionalComparator /></PackRoute>} />

        {/* Pro+ — Profitability Decision Center */}
        <Route path="/decision-center" element={<PackRoute requiredPack="pro"><ProfitabilityDecisionCenter /></PackRoute>} />

        {/* Expert pack required */}
        <Route path="/smart-money" element={<PackRoute requiredPack="expert"><SmartMoneyTracker /></PackRoute>} />
        <Route path="/ai-assistant" element={<PackRoute requiredPack="expert"><AIAssistant /></PackRoute>} />
        <Route path="/strategy-lab" element={<PackRoute requiredPack="expert"><StrategyLab /></PackRoute>} />

        {/* Billing & Subscription (accessible to all) */}
        <Route path="/billing" element={<Billing />} />
        <Route path="/subscription" element={<Subscription />} />

        {/* NEW: High priority — Price Alerts & Portfolio (Free pack) */}
        <Route path="/alerts" element={<ProtectedRoute><PriceAlerts /></ProtectedRoute>} />
        <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />

        {/* NEW: Medium priority — Multi-Asset & Market Scanner (Pro pack) */}
        <Route path="/multi-asset" element={<PackRoute requiredPack="pro"><MultiAsset /></PackRoute>} />
        <Route path="/scanner" element={<PackRoute requiredPack="pro"><MarketScanner /></PackRoute>} />

        {/* NEW: Low priority — MT4/MT5 Export (Expert pack) */}
        <Route path="/mt-export" element={<PackRoute requiredPack="expert"><MTExport /></PackRoute>} />

        {/* OANDA API Settings (accessible a tous) */}
        <Route path="/oanda" element={<ProtectedRoute><OandaSettings /></ProtectedRoute>} />

        {/* Admin only */}
        <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
        <Route path="/admin/security" element={<AdminRoute><AdminSettings /></AdminRoute>} />
        <Route path="/api-center" element={<AdminRoute><ApiCenter /></AdminRoute>} />
      </Route>

      {/* 404 — Catch all unmatched routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return <AppRoutes />;
}

export default App;
