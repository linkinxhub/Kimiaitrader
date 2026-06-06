import { getActivityLogs } from "@/services/activityLogService";
import { updatePlatformSettings } from "@/services/platformSettingsService";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { AppPageFrame } from "@/pages/page-helpers";
import { formatDate } from "@/lib/format";
import { Button, Card, Switch } from "@/components/ui/primitives";

export default function AdminSecurityPage() {
  const settings = usePlatformSettings();
  const logs = getActivityLogs().slice(0, 12);
  const securityRows: Array<{
    label: string;
    key: "enable2FA" | "enableOTP" | "limitLoginAttempts" | "detectSuspiciousIP";
    checked: boolean;
  }> = [
    { label: "2FA", key: "enable2FA", checked: settings.enable2FA },
    { label: "OTP", key: "enableOTP", checked: settings.enableOTP },
    { label: "Limit attempts", key: "limitLoginAttempts", checked: settings.limitLoginAttempts },
    { label: "Suspicious IP detection", key: "detectSuspiciousIP", checked: settings.detectSuspiciousIP },
  ];

  return (
    <AppPageFrame
      title="Admin Security"
      description="Ecran dedie a la securite: toggles, visibilite des controles et historique recent."
      action={
        <Button
          onClick={() =>
            updatePlatformSettings({
              enable2FA: !settings.enable2FA,
              enableOTP: !settings.enableOTP,
            })
          }
        >
          Basculer 2FA + OTP
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          {securityRows.map((item) => (
            <div key={item.key} className="flex items-center justify-between rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
              <p className="text-sm text-slate-300">{item.label}</p>
              <Switch
                checked={item.checked}
                onCheckedChange={(next) => updatePlatformSettings({ [item.key]: next })}
              />
            </div>
          ))}
        </Card>
        <Card className="space-y-4">
          <p className="font-display text-3xl tracking-[-0.05em] text-white">Recent logs</p>
          {logs.map((log) => (
            <div key={log.id} className="rounded-[22px] border border-white/8 bg-slate-950/35 p-4">
              <p className="text-sm text-slate-200">{log.action}</p>
              <p className="mt-1 text-sm text-slate-400">{log.actorEmail}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">{formatDate(log.createdAt)}</p>
            </div>
          ))}
        </Card>
      </div>
    </AppPageFrame>
  );
}
