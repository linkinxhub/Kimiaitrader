import { Bell, LogOut, Menu, Moon, Sun } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { NAV_ITEMS } from "@/lib/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { PACK_LABELS } from "@/lib/constants";
import { Badge, Button } from "@/components/ui/primitives";

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const visibleItems = useMemo(
    () =>
      NAV_ITEMS.filter((item) => {
        if (item.adminOnly) {
          return user?.role === "admin";
        }
        return true;
      }),
    [user?.role],
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        <aside className={cn("border-r border-slate-800 bg-slate-950/95 p-4 transition-all", collapsed ? "w-[92px]" : "w-[290px]")}>
          <div className="flex items-center justify-between pb-6">
            <div className={cn("space-y-1", collapsed && "hidden")}>
              <p className="font-display text-xl font-semibold text-white">XTrendAI Pro</p>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Trading • IA • SaaS</p>
            </div>
            <Button variant="ghost" className="px-3" onClick={() => setCollapsed((current) => !current)}>
              <Menu className="size-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {visibleItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition",
                    isActive || location.pathname === item.path
                      ? "border-blue-500/40 bg-blue-500/10 text-white"
                      : "border-transparent text-slate-400 hover:border-slate-800 hover:bg-slate-900/70 hover:text-slate-100",
                  )
                }
              >
                <item.icon className="size-4 shrink-0" />
                {!collapsed ? (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? <Badge className="border-slate-700 px-2 py-0.5 text-[10px] tracking-[0.16em]">{item.badge}</Badge> : null}
                  </>
                ) : null}
              </NavLink>
            ))}
          </div>
        </aside>

        <main className="flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/75 px-6 py-4 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-display text-lg text-white">Pilotage marché</p>
                <p className="text-sm text-slate-400">
                  Connecté en {user?.role === "admin" ? "Super Admin" : PACK_LABELS[user?.pack ?? "free"]} • données {user?.role === "admin" || user?.pack !== "free" ? "LIVE" : "DEMO"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <motion.div whileHover={{ y: -1 }} className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm text-slate-300">
                  Solde suivi: 124 800€
                </motion.div>
                <Button variant="secondary" className="px-3" onClick={toggleTheme}>
                  {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </Button>
                <Button variant="secondary" className="px-3">
                  <Bell className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  className="px-3 text-slate-300"
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                >
                  <LogOut className="size-4" />
                </Button>
              </div>
            </div>
          </header>

          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
