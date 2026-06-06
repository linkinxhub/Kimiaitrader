export const packMatrix = [
  {
    pack: "FREE",
    frontend: "Visible but not enforced by authenticated entitlement checks",
    backend: "No active pack middleware found in current backend snapshot",
    api: "No token tier gating implemented",
    mobile: "No mobile entitlement layer found",
  },
  {
    pack: "PRO",
    frontend: "Marketing present, enforcement absent in current rebuilt frontend",
    backend: "Missing subscription state and server-side authorization",
    api: "No per-plan rate-limit or endpoint gating",
    mobile: "No mobile project present in repository",
  },
  {
    pack: "EXPERT",
    frontend: "UI references possible, access control absent",
    backend: "Permissions framework exists but no pack model or billing link",
    api: "No feature-flag gating by plan",
    mobile: "No mobile entitlement layer found",
  },
  {
    pack: "INSTITUTIONNEL",
    frontend: "No dedicated institutional access path currently enforced",
    backend: "No tenant, desk, or institutional SLA model found",
    api: "No partner API governance found",
    mobile: "No enterprise mobile segmentation found",
  },
];

export const auditModules = [
  "Centre Santé Plateforme",
  "Centre Qualité Données",
  "Monitoring Temps Réel",
  "API Health Monitor",
  "Centre Consommation IA",
  "Centre Conformité Packs",
  "Audit Paiements",
  "Audit Permissions",
  "Audit Site Vitrine",
];
