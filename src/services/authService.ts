import type { AuthSession, AuthUser, Pack } from "@/types";
import { createId, nowIso, readStorage, sha256, writeStorage } from "@/lib/utils";
import { recordActivity } from "@/services/activityLogService";

export const AUTH_USERS_KEY = "xtrendai_auth_users";
export const AUTH_SESSION_KEY = "xtrendai_local_auth";
const AUTH_ADMIN_PIN_KEY = "xtrendai_admin_pin_state";
const PASSWORD_SALT = "xtrendai_pro_2026";
const ADMIN_PIN = "202406";

interface PinState {
  attempts: number;
  lockedUntil?: string;
}

const TEST_ACCOUNTS = [
  { name: "Demo Free", email: "free@xtrendai.com", password: "Free2024!", pack: "free" as Pack, role: "user" as const },
  { name: "Alpha Pro", email: "pro@xtrendai.com", password: "Pro2024!", pack: "pro" as Pack, role: "user" as const },
  { name: "Sigma Expert", email: "expert@xtrendai.com", password: "Expert2024!", pack: "expert" as Pack, role: "user" as const },
  {
    name: "Titan Institutionnel",
    email: "institutional@xtrendai.com",
    password: "Institutional2024!",
    pack: "institutional" as Pack,
    role: "user" as const,
  },
  { name: "Super Admin", email: "admin@xtrendai.com", password: "Admin2024!", pack: "institutional" as Pack, role: "admin" as const },
];

function getUsers() {
  return readStorage<AuthUser[]>(AUTH_USERS_KEY, []);
}

function writeUsers(users: AuthUser[]) {
  writeStorage(AUTH_USERS_KEY, users);
}

async function buildPasswordHash(password: string) {
  return sha256(`${PASSWORD_SALT}:${password}`);
}

export async function initializeAuthService() {
  const users = getUsers();
  if (users.length) {
    return users;
  }

  const seededUsers = await Promise.all(
    TEST_ACCOUNTS.map(async (account) => ({
      id: createId("usr"),
      name: account.name,
      email: account.email,
      passwordHash: await buildPasswordHash(account.password),
      role: account.role,
      pack: account.pack,
      packStatus: "active" as const,
      paymentPending: "no" as const,
      createdAt: nowIso(),
      createdBy: "system",
      packExpiresAt: account.role === "admin" ? undefined : new Date(Date.now() + 30 * 86400000).toISOString(),
    })),
  );

  writeUsers(seededUsers);
  recordActivity("Comptes de démonstration initialisés");
  return seededUsers;
}

function createSession(userId: string) {
  const session: AuthSession = {
    userId,
    loggedInAt: nowIso(),
  };
  writeStorage(AUTH_SESSION_KEY, session);
  return session;
}

export async function loginUser(email: string, password: string) {
  await initializeAuthService();
  const users = getUsers();
  const passwordHash = await buildPasswordHash(password);
  const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase() && item.passwordHash === passwordHash);

  if (!user) {
    return { ok: false as const, message: "Email ou mot de passe incorrect." };
  }

  createSession(user.id);
  recordActivity("Connexion utilisateur", user);
  return { ok: true as const, user };
}

export async function registerUser(name: string, email: string, password: string, pack: Pack) {
  await initializeAuthService();
  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();

  if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    return { ok: false as const, message: "Un compte existe déjà avec cet email." };
  }

  const nextUser: AuthUser = {
    id: createId("usr"),
    name,
    email: normalizedEmail,
    passwordHash: await buildPasswordHash(password),
    role: "user",
    pack,
    packStatus: pack === "free" ? "trial" : "active",
    paymentPending: pack === "free" ? "no" : "yes",
    createdAt: nowIso(),
    createdBy: "self-service",
    packExpiresAt: pack === "free" ? undefined : new Date(Date.now() + 30 * 86400000).toISOString(),
  };

  writeUsers([nextUser, ...users]);
  createSession(nextUser.id);
  recordActivity("Inscription utilisateur", nextUser);
  return { ok: true as const, user: nextUser };
}

export function logoutUser() {
  window.localStorage.removeItem(AUTH_SESSION_KEY);
}

export function getSessionUser() {
  const session = readStorage<AuthSession | null>(AUTH_SESSION_KEY, null);
  if (!session) {
    return null;
  }

  const users = getUsers();
  return users.find((user) => user.id === session.userId) ?? null;
}

function getPinState() {
  return readStorage<PinState>(AUTH_ADMIN_PIN_KEY, { attempts: 0 });
}

function writePinState(state: PinState) {
  writeStorage(AUTH_ADMIN_PIN_KEY, state);
}

export function verifyAdminPIN(pin: string) {
  const pinState = getPinState();
  const now = Date.now();

  if (pinState.lockedUntil && new Date(pinState.lockedUntil).getTime() > now) {
    return {
      ok: false as const,
      message: `Accès admin verrouillé jusqu'au ${new Date(pinState.lockedUntil).toLocaleTimeString("fr-FR")}.`,
    };
  }

  if (pin !== ADMIN_PIN) {
    const attempts = pinState.attempts + 1;
    if (attempts >= 3) {
      const lockedUntil = new Date(now + 15 * 60 * 1000).toISOString();
      writePinState({ attempts, lockedUntil });
      return { ok: false as const, message: "PIN incorrect. Verrouillage pendant 15 minutes." };
    }

    writePinState({ attempts });
    return { ok: false as const, message: `PIN incorrect. Tentative ${attempts}/3.` };
  }

  writePinState({ attempts: 0 });
  const admin = getUsers().find((user) => user.role === "admin");
  if (!admin) {
    return { ok: false as const, message: "Compte admin introuvable." };
  }

  createSession(admin.id);
  recordActivity("Connexion admin via PIN", admin);
  return { ok: true as const, user: admin };
}

export async function quickLoginTestAccount(account: "free" | "pro" | "expert" | "institutional" | "admin") {
  await initializeAuthService();
  const users = getUsers();
  const user =
    account === "admin"
      ? users.find((item) => item.role === "admin")
      : users.find((item) => item.pack === account && item.role !== "admin");

  if (!user) {
    return { ok: false as const, message: "Compte de test indisponible." };
  }

  createSession(user.id);
  recordActivity(`Quick login ${account}`, user);
  return { ok: true as const, user };
}

export function updateUserPack(userId: string, pack: Pack, status: AuthUser["packStatus"] = "active") {
  const users = getUsers();
  const updatedUsers: AuthUser[] = users.map((user) =>
    user.id === userId
      ? {
          ...user,
          pack,
          packStatus: status,
          paymentPending: pack === "free" ? ("no" as const) : ("yes" as const),
          packExpiresAt: pack === "free" ? undefined : new Date(Date.now() + 30 * 86400000).toISOString(),
        }
      : user,
  );

  writeUsers(updatedUsers);
  const updatedUser = updatedUsers.find((user) => user.id === userId) ?? null;
  recordActivity(`Pack mis à jour vers ${pack}`, updatedUser);
  return updatedUser;
}

export async function deleteUser(userId: string) {
  await initializeAuthService();
  const users = getUsers();
  const target = users.find((user) => user.id === userId);
  if (!target || target.role === "admin") {
    return false;
  }

  writeUsers(users.filter((user) => user.id !== userId));
  recordActivity("Utilisateur supprimé", target);
  return true;
}

export async function getAllRegisteredUsers() {
  await initializeAuthService();
  return getUsers();
}
