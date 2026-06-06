import { Bell, ChevronLeft, ChevronRight, LogOut, Moon, ShieldCheck, Sun } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { NAV_GROUPS } from "@/lib/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { cn } from "@/lib/utils";
import { PACK_LABELS } from "@/lib/constants";
import { Badge, Button } from "@/components/ui/primitives";

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const settings = usePlatformSettings();
  const navigate = useNavigate();

  const visibleGroups = useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.adminOnly || user?.role === "admin"),
      })).filter((group) => group.items.length > 0),
    [user?.role],
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(111,231,221,0.12),transparent_26%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.07),transparent_22%),#050915] text-slate-100">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "border-r border-white/8 bg-[#07111dcc] px-4 py-5 backdrop-blur-2xl transition-all duration-300",
            collapsed ? "w-[96px]" : "w-[308px]",
          )}
        >
          <div className="flex items-center justify-between">
            <div className={cn("space-y-2", collapsed && "hidden")}>
              <p className="font-display text-[30px] font-semibold tracking-[-0.05em] text-white">{settings.platformName}</p>
              <p className="max-w-[210px] text-sm leading-6 text-slate-400">{settings.slogan}</p>
            </div>
            <Button variant="ghost" className="px-3" onClick={() => setCollapsed((current) => !current)}>
              {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            </Button>
          </div>

          <div className={cn("mt-6 rounded-[28px] border border-white/8 bg-white/[0.03] p-4", collapsed && "px-2")}>
            <div className={cn("space-y-3", collapsed && "hidden")}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{settings.controlPanelLabel}</span>
                <Badge className="border-emerald-400/20 bg-emerald-500/10 text-emerald-200">{settings.realTimeSignals ? settings.liveStatusLabel : "PAUSE"}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-[20px] border border-white/8 bg-slate-950/45 p-3">
                  <p className="text-slate-500">Pack</p>
                  <p className="mt-2 font-display text-xl text-white">{user?.role === "admin" ? "Admin" : PACK_LABELS[user?.pack ?? "free"]}</p>
                </div>
                <div className="rounded-[20px] border border-white/8 bg-slate-950/45 p-3">
                  <p className="text-slate-500">Flux</p>
                  <p className="mt-2 font-display text-xl text-[#6fe7dd]">{settings.realTimeSignals ? "Actif" : "Pause"}</p>
                </div>
              </div>
            </div>
            {collapsed ? (
              <div className="flex justify-center">
                <ShieldCheck className="size-5 text-[#6fe7dd]" />
              </div>
            ) : null}
          </div>

          <div className="mt-6 space-y-6">
            {visibleGroups.map((group) => (
              <div key={group.label} className="space-y-2">
                {!collapsed ? <p className="px-3 text-[11px] uppercase tracking-[0.28em] text-slate-500">{group.label}</p> : null}
                <div className="space-y-1.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-[22px] border px-3 py-3 text-sm transition",
                          isActive
                            ? "border-[#6fe7dd]/30 bg-[linear-gradient(135deg,rgba(111,231,221,0.15),rgba(59,130,246,0.12))] text-white"
                            : "border-transparent text-slate-400 hover:border-white/8 hover:bg-white/[0.04] hover:text-slate-100",
                        )
                      }
                    >
                      <item.icon className="size-4 shrink-0" />
                      {!collapsed ? (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {item.badge ? (
                            <Badge className="border-white/10 px-2 py-0.5 text-[9px] tracking-[0.16em]">{item.badge}</Badge>
                          ) : null}
                        </>
                      ) : null}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1">
          <header className="sticky top-0 z-20 border-b border-white/8 bg-[#08111dcc] px-5 py-4 backdrop-blur-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-display text-2xl tracking-[-0.05em] text-white">Trading command center</p>
                <p className="text-sm text-slate-400">
                  Connecte en {user?.role === "admin" ? "Super Admin" : PACK_LABELS[user?.pack ?? "free"]} avec {settings.realTimeSignals ? settings.liveStatusLabel : "Flux en pause"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <motion.div whileHover={{ y: -1 }} className="rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
                  Session capital: 124 800 EUR
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

          <div className="p-5 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
