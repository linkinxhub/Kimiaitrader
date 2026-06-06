import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Pack } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { PACK_ORDER } from "@/lib/constants";

export function PackGuard({ minPack, adminOnly, children }: { minPack?: Pack; adminOnly?: boolean; children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-8 text-slate-300">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user.role === "admin") {
    return <>{children}</>;
  }

  if (adminOnly) {
    return <Navigate to="/subscription" replace />;
  }

  if (minPack) {
    const currentIndex = PACK_ORDER.indexOf(user.pack);
    const minimumIndex = PACK_ORDER.indexOf(minPack);
    if (currentIndex < minimumIndex) {
      return <Navigate to="/subscription" replace />;
    }
  }

  return <>{children}</>;
}
