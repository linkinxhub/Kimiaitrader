import { AppPageFrame } from "@/pages/page-helpers";
import { useAuth } from "@/hooks/useAuth";
import { getPlatformSettings } from "@/services/platformSettingsService";
import { redirectToCheckout } from "@/services/stripeService";
import { formatCurrency } from "@/lib/format";
import { Button, Card } from "@/components/ui/primitives";

export default function BillingPage() {
  const { user } = useAuth();
  const settings = getPlatformSettings();

  return (
    <AppPageFrame
      title="Billing"
      description="Activation locale immédiate si Stripe n’est pas configuré, ou redirection vers vos payment links."
    >
      <div className="grid gap-4 xl:grid-cols-4">
        {(["free", "pro", "expert", "institutional"] as const).map((pack) => (
          <Card key={pack} className="space-y-4">
            <p className="font-display text-2xl text-white">{pack}</p>
            <p className="font-display text-4xl text-white">{formatCurrency(settings.packPrices[pack])}</p>
            <Button onClick={() => redirectToCheckout(pack)} disabled={user?.pack === pack}>Activer</Button>
          </Card>
        ))}
      </div>
    </AppPageFrame>
  );
}
