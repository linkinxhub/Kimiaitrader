import { SectionHeading } from "@/components/SectionHeading";
import { useRemoteJson } from "@/hooks/useRemoteJson";
import type { MarketSnapshot } from "@/types/audit";

export default function CalendarPage() {
  const snapshot = useRemoteJson<MarketSnapshot>("/api/market/snapshot", 60000);

  return (
    <div className="page-grid">
      <section className="panel">
        <SectionHeading
          title="Data Quality Center"
          eyebrow="Priority 2"
          description="Every requested market must expose source, timestamp, quality, and latest update. This replaces any fake or unnamed quote layer."
        />
        <div className="calendar-table">
          <table>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Category</th>
                <th>Status</th>
                <th>Source</th>
                <th>Quality</th>
                <th>Timestamp</th>
                <th>Last update</th>
              </tr>
            </thead>
            <tbody>
              {(snapshot.data?.assets ?? []).map((asset) => (
                <tr key={asset.code}>
                  <td>{asset.code}</td>
                  <td>{asset.category}</td>
                  <td>{asset.status}</td>
                  <td>{asset.source}</td>
                  <td>{asset.quality}</td>
                  <td>{asset.asOf ?? "Unavailable"}</td>
                  <td>{asset.lastUpdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel split-panel">
        <div>
          <h3>Audit interpretation</h3>
          <ul className="reasoning-list">
            <li>A missing provider key no longer results in a silent blank widget.</li>
            <li>Yahoo Finance acts as the explicit public fallback when premium providers are unavailable.</li>
            <li>The source and timestamp are surfaced so stale data becomes visible immediately.</li>
          </ul>
        </div>
        <div className="macro-callout">
          <strong>Remaining gap</strong>
          <p>
            Economic calendar intelligence is not connected to a real provider in the current repository snapshot. The
            previous static calendar-style content has been removed from the trust narrative until a real feed is wired.
          </p>
        </div>
      </section>
    </div>
  );
}
