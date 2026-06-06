import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { AppPageFrame, PricingSummary } from "@/pages/page-helpers";
import { Button, Card } from "@/components/ui/primitives";

export default function BillingPage() {
  const { user, updatePack } = useAuth();
  const settings = usePlatformSettings();
  const [mode, setMode] = useState<"monthly" | "yearly">("monthly");

  const priceSet = mode === "monthly" ? settings.packPrices : settings.packPricesYearly;

  return (
    <AppPageFrame
      title="Billing"
      description="La facturation reprend exactement les prix du panneau admin, sans divergence entre la vitrine et l'espace utilisateur."
      action={
        <div className="flex gap-2">
          <Button variant={mode === "monthly" ? "primary" : "secondary"} onClick={() => setMode("monthly")}>
            Mensuel
          </Button>
          <Button variant={mode === "yearly" ? "primary" : "secondary"} onClick={() => setMode("yearly")}>
            Annuel
          </Button>
        </div>
      }
    >
      <Card className="space-y-4">
        <p className="font-display text-3xl tracking-[-0.05em] text-white">Pack actif</p>
        <p className="text-sm leading-7 text-slate-400">
          Compte courant: {user?.role === "admin" ? "Admin" : user?.pack ?? "free"}. Les mises a niveau se repercutent instantanement en local.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => updatePack("pro", "active")}>Activer Pro</Button>
          <Button variant="secondary" onClick={() => updatePack("expert", "active")}>
            Activer Expert
          </Button>
          <Button variant="secondary" onClick={() => updatePack("institutional", "active")}>
            Activer Institutional
          </Button>
        </div>
      </Card>
      <PricingSummary prices={priceSet} yearlyPrices={settings.packPricesYearly} />
    </AppPageFrame>
  );
}
