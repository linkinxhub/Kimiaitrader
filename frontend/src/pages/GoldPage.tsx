import { Crown } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { SectionHeading } from "@/components/SectionHeading";
import { useRemoteJson } from "@/hooks/useRemoteJson";
import type { MarketSnapshot } from "@/types/audit";

function formatPrice(value: number | null) {
  if (value == null) return "Unavailable";
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export default function GoldPage() {
  const snapshot = useRemoteJson<MarketSnapshot>("/api/market/snapshot", 60000);
  const gold = snapshot.data?.assets.find((asset) => asset.code === "XAU/USD") ?? null;

  return (
    <div className="page-grid">
      <section className="panel">
        <SectionHeading
          title="Institutional Gold Desk"
          eyebrow="XAU/USD live"
          description="Dedicated gold monitoring with real source, timestamp, quality, and fallback awareness."
        />
        <div className="gold-desk-grid">
          <div className="gold-desk-chart">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={snapshot.data?.charts["XAU/USD"] ?? []}>
                <defs>
                  <linearGradient id="goldDeskArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#7f8ea3", fontSize: 11 }} />
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Area type="monotone" dataKey="price" stroke="#fbbf24" strokeWidth={2.4} fill="url(#goldDeskArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="gold-desk-stack">
            {[
              ["Live price", formatPrice(gold?.price ?? null)],
              ["Source", gold?.source ?? "Unavailable"],
              ["Quality", gold?.quality ?? "unavailable"],
              ["Last update", gold?.asOf ?? "Unavailable"],
            ].map(([label, value]) => (
              <article key={label} className="stat-card">
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="panel split-panel">
        <div>
          <h3>Gold desk audit</h3>
          <ul className="reasoning-list">
            <li>The gold module now surfaces a real source and timestamp instead of fixed example levels.</li>
            <li>Fallback is explicit, so a missing premium provider key does not silently break the desk.</li>
            <li>Production-grade entry, stop, and take-profit logic still requires backend strategy storage.</li>
          </ul>
        </div>
        <div className="premium-badge-card">
          <Crown size={22} />
          <strong>Premium module baseline</strong>
          <p>The design is ready, the live quote layer is real, and the next missing step is secure server-side trade logic.</p>
        </div>
      </section>
    </div>
  );
}
