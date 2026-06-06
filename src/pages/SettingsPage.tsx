import { useState } from "react";
import { AppPageFrame } from "@/pages/page-helpers";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { usePWA } from "@/hooks/usePWA";
import { Button, Card, Input } from "@/components/ui/primitives";

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pwa = usePWA();
  const [displayName, setDisplayName] = useState(user?.name ?? "");

  return (
    <AppPageFrame
      title="Paramètres"
      description="Préférences de thème, état PWA et résumé de profil."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          <Button variant="secondary" onClick={toggleTheme}>Thème actuel: {theme}</Button>
        </Card>
        <Card className="space-y-3 text-slate-300">
          <p>Installée: {pwa.isInstalled ? "oui" : "non"}</p>
          <p>En ligne: {pwa.isOnline ? "oui" : "non"}</p>
          <Button onClick={() => pwa.install()} disabled={!pwa.canInstall}>Installer l’app</Button>
        </Card>
      </div>
    </AppPageFrame>
  );
}
