import { useEffect, useMemo, useState } from "react";
import type { AuthUser, PackAnalytics, SiteUpdate } from "@/types";
import { getAllRegisteredUsers } from "@/services/authService";
import { getActivityLogs } from "@/services/activityLogService";
import { createSiteUpdate, deleteSiteUpdate } from "@/services/siteUpdatesService";
import { getAnalytics } from "@/services/packAnalyticsService";
import { resetPlatformSettings, updatePackPrices, updatePlatformSettings } from "@/services/platformSettingsService";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { useSiteUpdates } from "@/hooks/useSiteUpdates";
import { AppPageFrame } from "@/pages/page-helpers";
import { formatCurrency, formatDate } from "@/lib/format";
import { Badge, Button, Card, Input, Select, Switch, Textarea } from "@/components/ui/primitives";

const tabs = ["Overview", "Brand", "Pricing", "Updates", "Users", "Performance", "Security", "Journal"] as const;

export default function AdminPanelPage() {
  const { user } = useAuth();
  const settings = usePlatformSettings();
  const updates = useSiteUpdates();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");
  const [draftSettings, setDraftSettings] = useState(settings);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [analytics, setAnalytics] = useState<PackAnalytics[]>([]);
  const [newUpdate, setNewUpdate] = useState<Omit<SiteUpdate, "id" | "publishedAt">>({
    title: "",
    description: "",
    category: "Produit",
  });

  useEffect(() => {
    setDraftSettings(settings);
  }, [settings]);

  useEffect(() => {
    getAllRegisteredUsers().then(setUsers);
    getAnalytics(user).then(setAnalytics);
  }, [user]);

  const logs = useMemo(() => getActivityLogs().slice(0, 10), []);

  function saveBrand() {
    updatePlatformSettings({
      platformName: draftSettings.platformName,
      slogan: draftSettings.slogan,
      heroTitle: draftSettings.heroTitle,
      heroDescription: draftSettings.heroDescription,
      primaryCtaLabel: draftSettings.primaryCtaLabel,
      secondaryCtaLabel: draftSettings.secondaryCtaLabel,
      finalCtaTitle: draftSettings.finalCtaTitle,
      finalCtaDescription: draftSettings.finalCtaDescription,
      contactEmail: draftSettings.contactEmail,
      contactPhone: draftSettings.contactPhone,
      contactWhatsApp: draftSettings.contactWhatsApp,
      heroMetrics: draftSettings.heroMetrics,
      liveStatusLabel: draftSettings.liveStatusLabel,
      controlPanelLabel: draftSettings.controlPanelLabel,
    });
  }

  function saveSecurity() {
    updatePlatformSettings({
      maintenanceMode: draftSettings.maintenanceMode,
      allowNewRegistrations: draftSettings.allowNewRegistrations,
      realTimeSignals: draftSettings.realTimeSignals,
      globalDemoMode: draftSettings.globalDemoMode,
      enable2FA: draftSettings.enable2FA,
      enableOTP: draftSettings.enableOTP,
      limitLoginAttempts: draftSettings.limitLoginAttempts,
      detectSuspiciousIP: draftSettings.detectSuspiciousIP,
    });
  }

  function publishUpdate() {
    if (!newUpdate.title.trim() || !newUpdate.description.trim()) {
      return;
    }
    createSiteUpdate(newUpdate);
    setNewUpdate({ title: "", description: "", category: "Produit" });
  }

  return (
    <AppPageFrame
      title="Admin Panel"
      description="Ce panneau pilote maintenant la vitrine, les packs, les messages publics et les reglages produit depuis la meme couche."
      action={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setActiveTab("Overview")}>
            Retour vue globale
          </Button>
          <Button variant="danger" onClick={() => resetPlatformSettings()}>
            Reset settings
          </Button>
        </div>
      }
    >
      <Card className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button key={tab} variant={activeTab === tab ? "primary" : "secondary"} onClick={() => setActiveTab(tab)}>
            {tab}
          </Button>
        ))}
      </Card>

      {activeTab === "Overview" ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <Card className="space-y-4">
            <p className="font-display text-3xl tracking-[-0.05em] text-white">Etat de la plateforme</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                <p className="text-sm text-slate-500">Brand live</p>
                <p className="mt-2 font-display text-2xl text-white">{settings.platformName}</p>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                <p className="text-sm text-slate-500">Live label</p>
                <p className="mt-2 font-display text-2xl text-white">{settings.liveStatusLabel}</p>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                <p className="text-sm text-slate-500">Utilisateurs</p>
                <p className="mt-2 font-display text-2xl text-white">{users.length}</p>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                <p className="text-sm text-slate-500">Updates publiques</p>
                <p className="mt-2 font-display text-2xl text-white">{updates.length}</p>
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <p className="font-display text-3xl tracking-[-0.05em] text-white">Vue business rapide</p>
            <div className="space-y-3">
              {analytics.map((item) => (
                <div key={item.pack} className="rounded-[22px] border border-white/8 bg-slate-950/35 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-display text-2xl tracking-[-0.04em] text-white">{item.pack}</p>
                    <Badge>{item.winRate}% WR</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-400 md:grid-cols-4">
                    <p>Signals {item.signals}</p>
                    <p>Trades {item.trades}</p>
                    <p>PnL {item.pnl} EUR</p>
                    <p>Engagement {item.engagement}%</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === "Brand" ? (
        <Card className="space-y-5">
          <p className="font-display text-3xl tracking-[-0.05em] text-white">Brand sync</p>
          <div className="grid gap-4 xl:grid-cols-2">
            <Input value={draftSettings.platformName} onChange={(event) => setDraftSettings((current) => ({ ...current, platformName: event.target.value }))} placeholder="Platform name" />
            <Input value={draftSettings.slogan} onChange={(event) => setDraftSettings((current) => ({ ...current, slogan: event.target.value }))} placeholder="Slogan" />
            <Input value={draftSettings.heroTitle} onChange={(event) => setDraftSettings((current) => ({ ...current, heroTitle: event.target.value }))} placeholder="Hero title" />
            <Input value={draftSettings.liveStatusLabel} onChange={(event) => setDraftSettings((current) => ({ ...current, liveStatusLabel: event.target.value }))} placeholder="Live status label" />
            <Input value={draftSettings.primaryCtaLabel} onChange={(event) => setDraftSettings((current) => ({ ...current, primaryCtaLabel: event.target.value }))} placeholder="Primary CTA" />
            <Input value={draftSettings.secondaryCtaLabel} onChange={(event) => setDraftSettings((current) => ({ ...current, secondaryCtaLabel: event.target.value }))} placeholder="Secondary CTA" />
            <Input value={draftSettings.finalCtaTitle} onChange={(event) => setDraftSettings((current) => ({ ...current, finalCtaTitle: event.target.value }))} placeholder="Final CTA title" />
            <Input value={draftSettings.controlPanelLabel} onChange={(event) => setDraftSettings((current) => ({ ...current, controlPanelLabel: event.target.value }))} placeholder="Control panel label" />
            <Input value={draftSettings.contactEmail} onChange={(event) => setDraftSettings((current) => ({ ...current, contactEmail: event.target.value }))} placeholder="Contact email" />
            <Input value={draftSettings.contactPhone} onChange={(event) => setDraftSettings((current) => ({ ...current, contactPhone: event.target.value }))} placeholder="Contact phone" />
          </div>
          <Textarea value={draftSettings.heroDescription} onChange={(event) => setDraftSettings((current) => ({ ...current, heroDescription: event.target.value }))} placeholder="Hero description" />
          <Textarea value={draftSettings.finalCtaDescription} onChange={(event) => setDraftSettings((current) => ({ ...current, finalCtaDescription: event.target.value }))} placeholder="Final CTA description" />
          <div className="grid gap-4 md:grid-cols-3">
            {draftSettings.heroMetrics.map((metric, index) => (
              <Card key={`${metric.label}-${index}`} className="space-y-3">
                <Input
                  value={metric.label}
                  onChange={(event) =>
                    setDraftSettings((current) => ({
                      ...current,
                      heroMetrics: current.heroMetrics.map((item, itemIndex) => (itemIndex === index ? { ...item, label: event.target.value } : item)),
                    }))
                  }
                />
                <Input
                  value={metric.value}
                  onChange={(event) =>
                    setDraftSettings((current) => ({
                      ...current,
                      heroMetrics: current.heroMetrics.map((item, itemIndex) => (itemIndex === index ? { ...item, value: event.target.value } : item)),
                    }))
                  }
                />
                <Input
                  value={metric.note}
                  onChange={(event) =>
                    setDraftSettings((current) => ({
                      ...current,
                      heroMetrics: current.heroMetrics.map((item, itemIndex) => (itemIndex === index ? { ...item, note: event.target.value } : item)),
                    }))
                  }
                />
              </Card>
            ))}
          </div>
          <Button onClick={saveBrand}>Save brand sync</Button>
        </Card>
      ) : null}

      {activeTab === "Pricing" ? (
        <Card className="space-y-5">
          <p className="font-display text-3xl tracking-[-0.05em] text-white">Pricing control</p>
          <div className="grid gap-4 lg:grid-cols-2">
            {(["free", "pro", "expert", "institutional"] as const).map((pack) => (
              <div key={pack} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                <p className="font-display text-2xl tracking-[-0.04em] text-white">{pack}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <Input
                    type="number"
                    value={draftSettings.packPrices[pack]}
                    onChange={(event) =>
                      setDraftSettings((current) => ({
                        ...current,
                        packPrices: { ...current.packPrices, [pack]: Number(event.target.value) },
                      }))
                    }
                  />
                  <Input
                    type="number"
                    value={draftSettings.packPricesYearly[pack]}
                    onChange={(event) =>
                      setDraftSettings((current) => ({
                        ...current,
                        packPricesYearly: { ...current.packPricesYearly, [pack]: Number(event.target.value) },
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <Button onClick={() => updatePackPrices(draftSettings.packPrices, draftSettings.packPricesYearly)}>Save pricing</Button>
        </Card>
      ) : null}

      {activeTab === "Updates" ? (
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="space-y-4">
            <p className="font-display text-3xl tracking-[-0.05em] text-white">Publier une update</p>
            <Input value={newUpdate.title} onChange={(event) => setNewUpdate((current) => ({ ...current, title: event.target.value }))} placeholder="Titre" />
            <Textarea value={newUpdate.description} onChange={(event) => setNewUpdate((current) => ({ ...current, description: event.target.value }))} placeholder="Description" />
            <Select value={newUpdate.category} onChange={(event) => setNewUpdate((current) => ({ ...current, category: event.target.value as SiteUpdate["category"] }))}>
              <option value="Produit">Produit</option>
              <option value="Trading">Trading</option>
              <option value="Securite">Securite</option>
              <option value="Business">Business</option>
            </Select>
            <Button onClick={publishUpdate}>Publier</Button>
          </Card>
          <Card className="space-y-3">
            <p className="font-display text-3xl tracking-[-0.05em] text-white">Flux public actuel</p>
            {updates.map((update) => (
              <div key={update.id} className="rounded-[22px] border border-white/8 bg-slate-950/35 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-display text-2xl tracking-[-0.04em] text-white">{update.title}</p>
                  <Button variant="danger" onClick={() => deleteSiteUpdate(update.id)}>
                    Supprimer
                  </Button>
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-400">{update.description}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-500">{update.category}</p>
              </div>
            ))}
          </Card>
        </div>
      ) : null}

      {activeTab === "Users" ? (
        <Card className="space-y-4">
          <p className="font-display text-3xl tracking-[-0.05em] text-white">Registered users</p>
          <div className="grid gap-3">
            {users.map((entry) => (
              <div key={entry.id} className="grid gap-3 rounded-[22px] border border-white/8 bg-white/[0.03] p-4 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
                <div>
                  <p className="font-display text-2xl tracking-[-0.04em] text-white">{entry.name}</p>
                  <p className="text-sm text-slate-400">{entry.email}</p>
                </div>
                <p className="text-sm text-slate-300">Pack {entry.pack}</p>
                <p className="text-sm text-slate-300">Status {entry.packStatus}</p>
                <p className="text-sm text-slate-300">{entry.role}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {activeTab === "Performance" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {analytics.map((item) => (
            <Card key={`${item.pack}-perf`} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-3xl tracking-[-0.05em] text-white">{item.pack}</p>
                <Badge>{item.engagement}% engagement</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-white/8 bg-slate-950/35 p-4">
                  <p className="text-sm text-slate-500">Signals</p>
                  <p className="mt-2 font-display text-3xl text-white">{item.signals}</p>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-slate-950/35 p-4">
                  <p className="text-sm text-slate-500">Win rate</p>
                  <p className="mt-2 font-display text-3xl text-white">{item.winRate}%</p>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-slate-950/35 p-4">
                  <p className="text-sm text-slate-500">PnL projete</p>
                  <p className="mt-2 font-display text-3xl text-white">{formatCurrency(item.pnl)}</p>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-slate-950/35 p-4">
                  <p className="text-sm text-slate-500">Trades</p>
                  <p className="mt-2 font-display text-3xl text-white">{item.trades}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {activeTab === "Security" ? (
        <Card className="space-y-5">
          <p className="font-display text-3xl tracking-[-0.05em] text-white">Security switches</p>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["Maintenance mode", "maintenanceMode"],
              ["Allow registrations", "allowNewRegistrations"],
              ["Real time signals", "realTimeSignals"],
              ["Global demo", "globalDemoMode"],
              ["2FA", "enable2FA"],
              ["OTP", "enableOTP"],
              ["Limit login attempts", "limitLoginAttempts"],
              ["Detect suspicious IP", "detectSuspiciousIP"],
            ].map(([label, key]) => (
              <div key={key} className="flex items-center justify-between rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                <p className="text-sm text-slate-300">{label}</p>
                <Switch
                  checked={Boolean(draftSettings[key as keyof typeof draftSettings])}
                  onCheckedChange={(checked) => setDraftSettings((current) => ({ ...current, [key]: checked }))}
                />
              </div>
            ))}
          </div>
          <Button onClick={saveSecurity}>Save security</Button>
        </Card>
      ) : null}

      {activeTab === "Journal" ? (
        <Card className="space-y-4">
          <p className="font-display text-3xl tracking-[-0.05em] text-white">Recent activity</p>
          {logs.map((log) => (
            <div key={log.id} className="grid gap-2 rounded-[22px] border border-white/8 bg-slate-950/35 p-4 md:grid-cols-[1.2fr_1fr_0.8fr]">
              <p className="text-sm text-slate-200">{log.action}</p>
              <p className="text-sm text-slate-400">{log.actorEmail}</p>
              <p className="text-sm text-slate-500">{formatDate(log.createdAt)}</p>
            </div>
          ))}
        </Card>
      ) : null}
    </AppPageFrame>
  );
}
