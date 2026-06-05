import { AppPageFrame } from "@/pages/page-helpers";
import { useAuth } from "@/hooks/useAuth";
import { PACK_LABELS } from "@/lib/constants";
import { getPlatformSettings } from "@/services/platformSettingsService";
import { formatCurrency } from "@/lib/format";
import { Card } from "@/components/ui/primitives";

export default function SubscriptionPage() {
  const { user } = useAuth();
  const settings = getPlatformSettings();

  return (
    <AppPageFrame
      title="Abonnement"
      description="Résumé du pack courant, statut et tarifs synchronisés depuis l’admin panel."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="text-slate-300">Pack actif: {user ? PACK_LABELS[user.pack] : "Aucun"}</Card>
        <Card className="text-slate-300">Statut: {user?.packStatus ?? "inactif"}</Card>
        <Card className="text-slate-300">Expiration: {user?.packExpiresAt ?? "n/a"}</Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-4">
        {(["free", "pro", "expert", "institutional"] as const).map((pack) => (
          <Card key={pack} className="text-slate-300">
            {PACK_LABELS[pack]}: {formatCurrency(settings.packPrices[pack])} / mois
          </Card>
        ))}
      </div>
    </AppPageFrame>
  );
}
