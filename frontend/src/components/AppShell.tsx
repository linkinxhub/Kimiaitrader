import { Bell, ChevronDown, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { BrandMark } from "@/components/BrandMark";
import { useRemoteJson } from "@/hooks/useRemoteJson";
import { navItems } from "@/data/platform";
import { formatMarketPrice, formatPercent } from "@/lib/formatters";
import type { MarketSnapshot } from "@/types/audit";

const routeDescriptions: Record<string, string> = {
  "/dashboard": "Real-time market intelligence and operational health",
  "/signals": "Signal readiness, provenance, and model trust posture",
  "/gold": "Institutional gold desk with live source visibility",
  "/quality": "Source quality, freshness, and fallback audit",
  "/admin": "Provider, payment, and pack governance operations",
};

function SidebarLink({ label, path, icon: Icon }: (typeof navItems)[number]) {
  return (
    <NavLink to={path} className={({ isActive }) => `shell-nav__item${isActive ? " is-active" : ""}`}>
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );
}

export function AppShell() {
  const location = useLocation();
  const currentLabel = navItems.find((item) => item.path === location.pathname)?.label ?? "Market Command";
  const currentDescription = routeDescriptions[location.pathname] ?? "Operational visibility across the platform";
  const snapshot = useRemoteJson<MarketSnapshot>("/api/market/snapshot", 60000);
  const [clock, setClock] = useState(() =>
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "UTC",
    }).format(new Date()),
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setClock(
        new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "UTC",
        }).format(new Date()),
      );
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const tickerItems = useMemo(() => (snapshot.data?.assets ?? []).slice(0, 6), [snapshot.data?.assets]);
  const liveCount = snapshot.data?.assets.filter((asset) => asset.status === "live").length ?? 0;

  return (
    <div className="shell">
      <aside className="shell-sidebar">
        <div className="shell-sidebar__brand">
          <BrandMark />
        </div>

        <nav className="shell-nav">
          {navItems.map((item) => (
            <SidebarLink key={item.path} {...item} />
          ))}
        </nav>

        <div className="shell-sidebar__footer">
          <button className="ghost-button ghost-button--sidebar">
            <SlidersHorizontal size={16} />
            Settings
          </button>
          <button className="ghost-button ghost-button--sidebar">
            <ShieldCheck size={16} />
            Collapse
          </button>

          <div className="shell-status-card">
            <div className="shell-status-card__head">
              <span className="shell-status-card__dot" />
              <strong>System status</strong>
            </div>
            <p>{liveCount ? "All systems operational" : "Awaiting live market snapshot"}</p>
          </div>
        </div>
      </aside>

      <div className="shell-main">
        <header className="shell-topbar">
          <div className="shell-topbar__title">
            <h1>{currentLabel}</h1>
            <p>{currentDescription}</p>
          </div>

          <div className="shell-topbar__actions">
            <span className="shell-topbar__clock">{clock} UTC+0</span>
            <button className="icon-button" aria-label="Search">
              <Search size={18} />
            </button>
            <button className="icon-button icon-button--alert" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <button className="profile-pill">
              <span className="profile-pill__avatar">A</span>
              <span>Admin</span>
              <strong>Pro</strong>
              <ChevronDown size={16} />
            </button>
          </div>
        </header>

        <div className="ticker-strip">
          {tickerItems.length ? (
            tickerItems.map((item) => (
              <div className="ticker-chip" key={item.code}>
                <span>{item.code}</span>
                <strong>{formatMarketPrice(item.price, item.code)}</strong>
                <em className={(item.changePercent ?? 0) >= 0 ? "is-up" : "is-down"}>
                  {item.changePercent == null ? item.quality : formatPercent(item.changePercent)}
                </em>
              </div>
            ))
          ) : (
            <div className="ticker-chip">
              <span>Market feed</span>
              <strong>{snapshot.isLoading ? "Loading..." : "Unavailable locally"}</strong>
              <em className="is-down">{snapshot.error ?? "Serverless market endpoint not responding"}</em>
            </div>
          )}
        </div>

        <main className="shell-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
