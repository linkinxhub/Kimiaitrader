import type { ActivityLog, AuthUser } from "@/types";
import { createId, nowIso, readStorage, writeStorage } from "@/lib/utils";

const ACTIVITY_LOGS_KEY = "xtrendai_activity_logs";

const DEFAULT_LOGS: ActivityLog[] = [
  {
    id: "log_1",
    action: "Plateforme initialisée",
    actorEmail: "system@xtrendai.local",
    ip: "127.0.0.1",
    createdAt: "2026-06-01T07:00:00.000Z",
  },
];

export function getActivityLogs() {
  return readStorage<ActivityLog[]>(ACTIVITY_LOGS_KEY, DEFAULT_LOGS);
}

export function recordActivity(action: string, user?: AuthUser | null, ip = "127.0.0.1") {
  const logs = getActivityLogs();
  const nextLog: ActivityLog = {
    id: createId("log"),
    action,
    actorEmail: user?.email ?? "system@xtrendai.local",
    ip,
    createdAt: nowIso(),
  };

  writeStorage(ACTIVITY_LOGS_KEY, [nextLog, ...logs].slice(0, 200));
  return nextLog;
}
