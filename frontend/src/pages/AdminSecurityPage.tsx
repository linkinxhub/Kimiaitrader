import { AppPageFrame } from "@/pages/page-helpers";
import { getActivityLogs } from "@/services/activityLogService";
import { getPlatformSettings, updatePlatformSettings } from "@/services/platformSettingsService";
import { Switch, Card } from "@/components/ui/primitives";
import { useState } from "react";

export default function AdminSecurityPage() {
  const [settings, setSettings] = useState(getPlatformSettings());
  const logs = getActivityLogs().slice(0, 6);

  const setToggle = (key: "enable2FA" | "enableOTP" | "limitLoginAttempts" | "detectSuspiciousIP", value: boolean) => {
    const next = updatePlatformSettings({ [key]: value });
    setSettings(next);
  };

  return (
    <AppPageFrame
      title="Admin Security"
      description="Pilotage des protections globales et lecture des dernières traces d’activité."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          {[
            ["enable2FA", "2FA"],
            ["enableOTP", "OTP"],
            ["limitLoginAttempts", "Limite tentatives"],
            ["detectSuspiciousIP", "Détection IP"],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center justify-between border-b border-slate-800 pb-3 text-sm text-slate-300 last:border-b-0 last:pb-0">
              <span>{label}</span>
              <Switch checked={settings[key as keyof typeof settings] as boolean} onCheckedChange={(value) => setToggle(key as never, value)} />
            </div>
          ))}
        </Card>
        <Card className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="border-b border-slate-800 pb-3 text-sm text-slate-300 last:border-b-0 last:pb-0">
              <p className="text-white">{log.action}</p>
              <p className="text-slate-500">{log.actorEmail} • {log.ip}</p>
            </div>
          ))}
        </Card>
      </div>
    </AppPageFrame>
  );
}
