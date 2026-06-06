import { Bell, ChevronDown, Search } from "lucide-react";
import { useMemo } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { BrandMark } from "@/components/BrandMark";
import { useRemoteJson } from "@/hooks/useRemoteJson";
import { navItems } from "@/data/platform";
import { formatMarketPrice, formatPercent } from "@/lib/formatters";
import type { MarketSnapshot } from "@/types/audit";

function SidebarLink({ label, path, icon: Icon }: (typeof navItems)[number]) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) => `shell-nav__item${isActive ? " is-active" : ""}`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );
}

export function AppShell() {
  const location = useLocation();
  const currentLabel = navItems.find((item) => item.path === location.pathname)?.label ?? "Market Command";
  const snapshot = useRemoteJson<MarketSnapshot>("/api/market/snapshot", 60000);
  const tickerItems = useMemo(() => (snapshot.data?.assets ?? []).slice(0, 5), [snapshot.data?.assets]);
  const clock = useMemo(
    () =>
      new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "UTC",
      }).format(new Date()),
    [],
  );

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
          <button className="ghost-button">Settings</button>
          <button className="ghost-button">Collapse</button>
        </div>
      </aside>

      <div className="shell-main">
        <header className="shell-topbar">
          <div className="shell-topbar__title">
            <BrandMark compact />
            <span>{currentLabel}</span>
          </div>
          <div className="shell-topbar__actions">
            <span className="shell-topbar__clock">{clock} UTC+0</span>
            <button className="icon-button" aria-label="Search">
              <Search size={18} />
            </button>
            <button className="icon-button" aria-label="Notifications">
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
