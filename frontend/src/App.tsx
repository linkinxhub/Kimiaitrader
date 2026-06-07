import { Suspense, lazy } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { AppShell } from "@/components/AppShell";

const LandingPage = lazy(() => import("@/pages/LandingPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const SignalsPage = lazy(() => import("@/pages/SignalsPage"));
const GoldPage = lazy(() => import("@/pages/GoldPage"));
const QualityPage = lazy(() => import("@/pages/CalendarPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));

const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  {
    path: "/",
    element: <AppShell />,
    children: [
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/signals", element: <SignalsPage /> },
      { path: "/gold", element: <GoldPage /> },
      { path: "/quality", element: <QualityPage /> },
      { path: "/admin", element: <AdminPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

export function App() {
  return (
    <Suspense fallback={<div className="app-loading">Loading XTrendAI Pro...</div>}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
