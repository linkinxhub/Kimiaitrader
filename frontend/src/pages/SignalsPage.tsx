import { SectionHeading } from "@/components/SectionHeading";
import { useRemoteJson } from "@/hooks/useRemoteJson";
import { formatPercent, formatTimestamp } from "@/lib/formatters";
import type { MarketSnapshot } from "@/types/audit";

export default function SignalsPage() {
  const snapshot = useRemoteJson<MarketSnapshot>("/api/market/snapshot", 60000);

  return (
    <div className="page-grid">
      <section className="panel">
        <SectionHeading
          title="Signal Readiness Audit"
          eyebrow="Priority 1 and 2"
          description="The platform should not present fictional AI trade calls. This center highlights live market readiness and what remains to be connected."
        />
        <div className="signal-table">
          {(snapshot.data?.assets ?? []).slice(0, 8).map((asset) => (
            <article key={asset.code} className="signal-card">
              <div className="signal-card__header">
                <div>
                  <span>{asset.code}</span>
                  <strong>{asset.category}</strong>
                </div>
                <div className="signal-score">{asset.source}</div>
              </div>
              <div className="signal-card__grid">
                <div>
                  <small>Status</small>
                  <strong>{asset.status}</strong>
                </div>
                <div>
                  <small>Quality</small>
                  <strong>{asset.quality}</strong>
                </div>
                <div>
                  <small>Timestamp</small>
                  <strong>{formatTimestamp(asset.asOf)}</strong>
                </div>
                <div>
                  <small>Change</small>
                  <strong>{asset.changePercent == null ? "Unavailable" : formatPercent(asset.changePercent)}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel split-panel">
        <div>
          <SectionHeading
            title="What was removed"
            description="Static trade narratives and hard-coded execution levels were treated as blocking issues for a professional SaaS posture."
          />
          <ul className="reasoning-list">
            <li>Hard-coded entry, stop, and target values are no longer presented as live trading intelligence.</li>
            <li>Confidence scores are no longer shown without a verifiable backend model and storage layer.</li>
            <li>Live market provenance is now the prerequisite before any signal engine can be considered trustworthy.</li>
          </ul>
        </div>
        <div className="macro-callout">
          <strong>Next requirement</strong>
          <p>
            A real signal center needs secure API credentials, historical storage, model execution, audit logs, and
            entitlement-aware delivery. The current repository is not yet there on the backend side.
          </p>
        </div>
      </section>
    </div>
  );
}
