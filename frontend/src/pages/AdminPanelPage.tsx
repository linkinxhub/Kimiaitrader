import { useEffect, useMemo, useState } from "react";
import { AdminPerformanceTab } from "@/components/AdminPerformanceTab";
import { AppPageFrame } from "@/pages/page-helpers";
import { createSiteUpdate, deleteSiteUpdate, getSiteUpdates } from "@/services/siteUpdatesService";
import { getPlatformSettings, resetPlatformSettings, updatePackPrices, updatePlatformSettings } from "@/services/platformSettingsService";
import { getActivityLogs } from "@/services/activityLogService";
import { getAllRegisteredUsers } from "@/services/authService";
import { getAnalytics } from "@/services/packAnalyticsService";
import { getPortfolioStats } from "@/services/portfolioService";
import { formatCurrency } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import { Badge, Button, Card, Input, Select, Switch, Textarea } from "@/components/ui/primitives";

const tabs = ["Vue d'ensemble", "Mises à jour", "Business", "Utilisateurs", "Packs", "Performance", "Journal", "Sécurité", "Paramètres"] as const;

export default function AdminPanelPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Vue d'ensemble");
  const [updates, setUpdates] = useState(getSiteUpdates());
  const [settings, setSettings] = useState(getPlatformSettings());
  const [users, setUsers] = useState<Array<Awaited<ReturnType<typeof getAllRegisteredUsers>>[number]>>([]);
  const [analytics, setAnalytics] = useState<Array<Awaited<ReturnType<typeof getAnalytics>>[number]>>([]);
  const [newUpdateTitle, setNewUpdateTitle] = useState("");
  const [newUpdateDescription, setNewUpdateDescription] = useState("");
  const [newUpdateCategory, setNewUpdateCategory] = useState("Produit");
  const logs = getActivityLogs();
  const portfolioStats = getPortfolioStats();

  useEffect(() => {
    getAllRegisteredUsers().then(setUsers);
    getAnalytics(user).then(setAnalytics);
  }, [user]);

  const business = useMemo(() => {
    const payingUsers = users.filter((member) => member.pack !== "free" || member.role === "admin");
    const mrr = payingUsers.reduce((total, member) => total + settings.packPrices[member.pack], 0);
    return {
      mrr,
      arr: mrr * 12,
      conversion: users.length ? (payingUsers.length / users.length) * 100 : 0,
      churn: 2.8,
    };
  }, [settings.packPrices, users]);

  const renderTab = () => {
    if (activeTab === "Vue d'ensemble") {
      return (
        <div className="grid gap-4 lg:grid-cols-4">
          <Card className="text-slate-300">MRR: {formatCurrency(business.mrr)}</Card>
          <Card className="text-slate-300">Utilisateurs: {users.length}</Card>
          <Card className="text-slate-300">Trades: {portfolioStats.totalTrades}</Card>
          <Card className="text-slate-300">Mode maintenance: {settings.maintenanceMode ? "actif" : "off"}</Card>
        </div>
      );
    }

    if (activeTab === "Mises à jour") {
      return (
        <div className="space-y-4">
          <Card className="grid gap-4 lg:grid-cols-4">
            <Input value={newUpdateTitle} onChange={(event) => setNewUpdateTitle(event.target.value)} placeholder="Titre" />
            <Input value={newUpdateDescription} onChange={(event) => setNewUpdateDescription(event.target.value)} placeholder="Description" />
            <Select value={newUpdateCategory} onChange={(event) => setNewUpdateCategory(event.target.value)}>
              <option value="Produit">Produit</option>
              <option value="Trading">Trading</option>
              <option value="Sécurité">Sécurité</option>
              <option value="Business">Business</option>
            </Select>
            <Button onClick={() => { createSiteUpdate({ title: newUpdateTitle, description: newUpdateDescription, category: newUpdateCategory as never }); setUpdates(getSiteUpdates()); }}>Publier</Button>
          </Card>
          {updates.map((update) => (
            <Card key={update.id} className="flex items-center justify-between gap-4">
              <div>
                <p className="font-display text-lg text-white">{update.title}</p>
                <p className="text-sm text-slate-400">{update.description}</p>
              </div>
              <Button variant="ghost" onClick={() => { deleteSiteUpdate(update.id); setUpdates(getSiteUpdates()); }}>Supprimer</Button>
            </Card>
          ))}
        </div>
      );
    }

    if (activeTab === "Business") {
      return (
        <div className="grid gap-4 lg:grid-cols-4">
          <Card className="text-slate-300">MRR {formatCurrency(business.mrr)}</Card>
          <Card className="text-slate-300">ARR {formatCurrency(business.arr)}</Card>
          <Card className="text-slate-300">Conversion {business.conversion.toFixed(1)}%</Card>
          <Card className="text-slate-300">Churn {business.churn}%</Card>
        </div>
      );
    }

    if (activeTab === "Utilisateurs") {
      return (
        <div className="grid gap-4">
          {users.map((member) => (
            <Card key={member.id} className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-display text-lg text-white">{member.name}</p>
                <p className="text-sm text-slate-400">{member.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge>{member.role}</Badge>
                <Badge>{member.pack}</Badge>
                <Badge>{member.packStatus}</Badge>
              </div>
            </Card>
          ))}
        </div>
      );
    }

    if (activeTab === "Packs") {
      return (
        <Card className="grid gap-4 lg:grid-cols-4">
          {(["free", "pro", "expert", "institutional"] as const).map((pack) => (
            <Input
              key={pack}
              value={settings.packPrices[pack]}
              onChange={(event) => {
                const nextMonthly = { ...settings.packPrices, [pack]: Number(event.target.value) };
                const nextYearly = { ...settings.packPricesYearly, [pack]: Number(event.target.value) * 10 };
                const next = updatePackPrices(nextMonthly, nextYearly);
                setSettings(next);
              }}
            />
          ))}
        </Card>
      );
    }

    if (activeTab === "Performance") {
      return <AdminPerformanceTab />;
    }

    if (activeTab === "Journal") {
      return (
        <div className="grid gap-4">
          {logs.map((log) => (
            <Card key={log.id} className="text-sm text-slate-300">
              <p className="text-white">{log.action}</p>
              <p className="text-slate-500">{log.actorEmail} • {log.ip}</p>
            </Card>
          ))}
        </div>
      );
    }

    if (activeTab === "Sécurité") {
      return (
        <Card className="space-y-4">
          {[
            ["enable2FA", "2FA"],
            ["enableOTP", "OTP"],
            ["limitLoginAttempts", "Limit Login Attempts"],
            ["detectSuspiciousIP", "Detect Suspicious IP"],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center justify-between border-b border-slate-800 pb-3 text-sm text-slate-300 last:border-b-0 last:pb-0">
              <span>{label}</span>
              <Switch
                checked={settings[key as keyof typeof settings] as boolean}
                onCheckedChange={(checked) => {
                  const next = updatePlatformSettings({ [key]: checked });
                  setSettings(next);
                }}
              />
            </div>
          ))}
        </Card>
      );
    }

    return (
      <Card className="space-y-4">
        <Input value={settings.platformName} onChange={(event) => setSettings((current) => ({ ...current, platformName: event.target.value }))} />
        <Textarea value={settings.slogan} onChange={(event) => setSettings((current) => ({ ...current, slogan: event.target.value }))} />
        <Input value={settings.contactEmail} onChange={(event) => setSettings((current) => ({ ...current, contactEmail: event.target.value }))} />
        <Input value={settings.contactPhone} onChange={(event) => setSettings((current) => ({ ...current, contactPhone: event.target.value }))} />
        <Input value={settings.contactWhatsApp} onChange={(event) => setSettings((current) => ({ ...current, contactWhatsApp: event.target.value }))} />
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setSettings(updatePlatformSettings(settings))}>Sauvegarder</Button>
          <Button variant="danger" onClick={() => setSettings(resetPlatformSettings())}>Réinitialiser</Button>
        </div>
      </Card>
    );
  };

  return (
    <AppPageFrame
      title="Admin Panel"
      description="Centre de commande business, sécurité, utilisateurs, pricing et performance."
    >
      <div className="flex flex-wrap gap-3">
        {tabs.map((tab) => (
          <Button key={tab} variant={activeTab === tab ? "primary" : "secondary"} onClick={() => setActiveTab(tab)}>
            {tab}
          </Button>
        ))}
      </div>
      {renderTab()}
      {analytics.length && activeTab === "Vue d'ensemble" ? (
        <div className="grid gap-4 lg:grid-cols-4">
          {analytics.map((item) => (
            <Card key={item.pack} className="text-slate-300">
              {item.pack}: {item.signals} signaux • {item.winRate.toFixed(1)}%
            </Card>
          ))}
        </div>
      ) : null}
    </AppPageFrame>
  );
}
