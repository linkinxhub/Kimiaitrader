/**
 * Auth Service — Système d'authentification sécurisé
 *
 * Principe : Seuls les utilisateurs enregistrés par la plateforme peuvent se connecter.
 * Le Register crée un compte dans la liste des utilisateurs autorisés.
 * Le Login vérifie email + mot de passe contre cette liste.
 *
 * Les comptes de test/démo sont pré-enregistrés.
 * Le Super Admin est pré-enregistré.
 */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "user" | "admin";
  pack: "free" | "pro" | "expert" | "institutional";
  packStatus: string;
  packExpiresAt?: string;
  paymentPending: "yes" | "no";
  createdAt: string;
  createdBy: string;
}

const AUTH_USERS_KEY = "xtrendai_auth_users";
const AUTH_SESSION_KEY = "xtrendai_local_auth";
const LOGIN_ATTEMPTS_KEY = "xtrendai_login_attempts";
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// ─── SHA-256 hash for passwords ─────────────────────────

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message + "xtrendai_salt_2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── Login Attempt Tracking ─────────────────────────────

interface LoginAttempts {
  count: number;
  lastAttempt: number;
  locked: boolean;
}

function getLoginAttempts(): LoginAttempts {
  try {
    const raw = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    if (!raw) return { count: 0, lastAttempt: 0, locked: false };
    return JSON.parse(raw);
  } catch {
    return { count: 0, lastAttempt: 0, locked: false };
  }
}

function recordLoginAttempt(success: boolean): void {
  const attempts = getLoginAttempts();
  const now = Date.now();

  // Reset if lockout expired
  if (attempts.locked && now - attempts.lastAttempt > LOCKOUT_DURATION_MS) {
    attempts.count = 0;
    attempts.locked = false;
  }

  if (success) {
    attempts.count = 0;
    attempts.locked = false;
  } else {
    attempts.count++;
    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
      attempts.locked = true;
    }
  }
  attempts.lastAttempt = now;
  localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
}

function isAccountLocked(): boolean {
  const attempts = getLoginAttempts();
  if (!attempts.locked) return false;
  const now = Date.now();
  if (now - attempts.lastAttempt > LOCKOUT_DURATION_MS) {
    // Auto-unlock
    recordLoginAttempt(true);
    return false;
  }
  return true;
}

function getLockoutRemainingMinutes(): number {
  const attempts = getLoginAttempts();
  const remaining = LOCKOUT_DURATION_MS - (Date.now() - attempts.lastAttempt);
  return Math.max(0, Math.ceil(remaining / 60000));
}

// ─── Get all registered users ───────────────────────────

function getAllUsers(): AuthUser[] {
  try {
    const raw = localStorage.getItem(AUTH_USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AuthUser[];
  } catch {
    return [];
  }
}

function saveAllUsers(users: AuthUser[]) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

// ─── Initialize platform accounts ───────────────────────

export function initializePlatformAccounts(): void {
  const existing = getAllUsers();
  if (existing.length > 0) return; // Already initialized

  const now = new Date().toISOString();
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);
  const expiryStr = expiry.toISOString();

  // Use pre-computed SHA-256 hashes for platform accounts
  // hash = sha256(password + "xtrendai_salt_2024")
  const platformUsers: AuthUser[] = [
    {
      id: "admin-xtrendai-001",
      name: "Super Administrateur",
      email: "admin@xtrendai.com",
      passwordHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", // Will be re-hashed on first login
      role: "admin",
      pack: "institutional",
      packStatus: "active",
      packExpiresAt: expiryStr,
      paymentPending: "no",
      createdAt: now,
      createdBy: "platform",
    },
    {
      id: "test-free-001",
      name: "Trader Free",
      email: "free@xtrendai.demo",
      passwordHash: "free_hash_placeholder",
      role: "user",
      pack: "free",
      packStatus: "active",
      paymentPending: "no",
      createdAt: now,
      createdBy: "platform",
    },
    {
      id: "test-pro-001",
      name: "Trader Pro",
      email: "pro@xtrendai.demo",
      passwordHash: "pro_hash_placeholder",
      role: "user",
      pack: "pro",
      packStatus: "active",
      packExpiresAt: expiryStr,
      paymentPending: "no",
      createdAt: now,
      createdBy: "platform",
    },
    {
      id: "test-expert-001",
      name: "Trader Expert",
      email: "expert@xtrendai.demo",
      passwordHash: "expert_hash_placeholder",
      role: "user",
      pack: "expert",
      packStatus: "active",
      packExpiresAt: expiryStr,
      paymentPending: "no",
      createdAt: now,
      createdBy: "platform",
    },
    {
      id: "test-institutional-001",
      name: "Trader Institutionnel",
      email: "institutional@xtrendai.demo",
      passwordHash: "institutional_hash_placeholder",
      role: "user",
      pack: "institutional",
      packStatus: "active",
      packExpiresAt: expiryStr,
      paymentPending: "no",
      createdAt: now,
      createdBy: "platform",
    },
  ];

  // Hash all passwords asynchronously
  Promise.all(
    platformUsers.map(async (u) => {
      // Map placeholder hashes to real passwords
      const passwordMap: Record<string, string> = {
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855": "Admin2024!",
        "free_hash_placeholder": "Free2024",
        "pro_hash_placeholder": "Pro2024",
        "expert_hash_placeholder": "Expert2024",
        "institutional_hash_placeholder": "Institutional2024",
      };
      const pw = passwordMap[u.passwordHash] || "";
      if (pw) {
        u.passwordHash = await sha256(pw);
      }
    })
  ).then(() => {
    saveAllUsers(platformUsers);
  });

  // Save immediately with a sync hash fallback for first load
  const fallbackUsers: AuthUser[] = [
    { ...platformUsers[0], passwordHash: "sync_admin_hash_" + Date.now() },
    { ...platformUsers[1], passwordHash: "sync_free_hash_" + Date.now() },
    { ...platformUsers[2], passwordHash: "sync_pro_hash_" + Date.now() },
    { ...platformUsers[3], passwordHash: "sync_expert_hash_" + Date.now() },
    { ...platformUsers[4], passwordHash: "sync_insti_hash_" + Date.now() },
  ];
  saveAllUsers(fallbackUsers);

  // Then async hash
  setTimeout(() => {
    const users = getAllUsers();
    const pwMap: Record<string, string> = {
      [fallbackUsers[0].passwordHash]: "Admin2024!",
      [fallbackUsers[1].passwordHash]: "Free2024",
      [fallbackUsers[2].passwordHash]: "Pro2024",
      [fallbackUsers[3].passwordHash]: "Expert2024",
      [fallbackUsers[4].passwordHash]: "Institutional2024",
    };
    Promise.all(
      users.map(async (u) => {
        const pw = pwMap[u.passwordHash];
        if (pw) {
          u.passwordHash = await sha256(pw);
        }
      })
    ).then(() => saveAllUsers(users));
  }, 100);
}

// ─── Login ──────────────────────────────────────────────

export interface LoginResult {
  success: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    pack: string;
    packStatus: string;
    packExpiresAt?: string;
    paymentPending: string;
  };
  error?: string;
}

export async function loginUser(email: string, password: string): Promise<LoginResult> {
  initializePlatformAccounts();

  // Check lockout
  if (isAccountLocked()) {
    const mins = getLockoutRemainingMinutes();
    return {
      success: false,
      error: `Compte temporairement verrouillé. Réessayez dans ${mins} minute(s).`,
    };
  }

  const users = getAllUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    recordLoginAttempt(false);
    return { success: false, error: "Email non reconnu. Veuillez vous inscrire ou utiliser un compte de test." };
  }

  // Handle legacy simpleHash passwords (migration)
  const legacyHash = simpleHashLegacy(password);
  const sha256Hash = await sha256(password);

  let passwordValid = false;
  if (user.passwordHash === legacyHash) {
    // Migrate to SHA-256
    passwordValid = true;
    user.passwordHash = sha256Hash;
    saveAllUsers(users);
  } else if (user.passwordHash === sha256Hash) {
    passwordValid = true;
  } else {
    // Check sync fallback hashes
    const pwMap: Record<string, string> = {
      sync_admin: "Admin2024!",
      sync_free: "Free2024",
      sync_pro: "Pro2024",
      sync_expert: "Expert2024",
      sync_insti: "Institutional2024",
    };
    for (const [key, val] of Object.entries(pwMap)) {
      if (user.passwordHash.includes(key)) {
        const realHash = await sha256(val);
        if (realHash === sha256Hash) {
          passwordValid = true;
          user.passwordHash = realHash;
          saveAllUsers(users);
        }
        break;
      }
    }
  }

  if (!passwordValid) {
    recordLoginAttempt(false);
    const attempts = getLoginAttempts();
    const remaining = MAX_LOGIN_ATTEMPTS - attempts.count;
    return {
      success: false,
      error: `Mot de passe incorrect. ${remaining > 0 ? `${remaining} tentative(s) restante(s).` : "Compte verrouillé."}`,
    };
  }

  recordLoginAttempt(true);

  const sessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    pack: user.pack,
    packStatus: user.packStatus,
    packExpiresAt: user.packExpiresAt,
    paymentPending: user.paymentPending,
  };
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionUser));

  return { success: true, user: sessionUser };
}

// Legacy hash for backward compatibility during migration
function simpleHashLegacy(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).padStart(12, "0");
}

// ─── Register ───────────────────────────────────────────

export interface RegisterResult {
  success: boolean;
  user?: LoginResult["user"];
  error?: string;
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
  pack: "free" | "pro" | "expert" | "institutional" = "free"
): Promise<RegisterResult> {
  if (!name || name.trim().length < 2) {
    return { success: false, error: "Le nom doit contenir au moins 2 caractères." };
  }
  if (!email || !email.includes("@")) {
    return { success: false, error: "Email invalide." };
  }
  if (!password || password.length < 6) {
    return { success: false, error: "Le mot de passe doit contenir au moins 6 caractères." };
  }

  initializePlatformAccounts();
  const users = getAllUsers();

  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: "Un compte existe déjà avec cet email." };
  }

  const now = new Date();
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);

  const passwordHash = await sha256(password);

  const newUser: AuthUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    role: "user",
    pack,
    packStatus: pack === "free" ? "active" : "trial",
    packExpiresAt: expiry.toISOString(),
    paymentPending: pack === "free" ? "no" : "yes",
    createdAt: now.toISOString(),
    createdBy: "self",
  };

  users.push(newUser);
  saveAllUsers(users);

  const sessionUser = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    pack: newUser.pack,
    packStatus: newUser.packStatus,
    packExpiresAt: newUser.packExpiresAt,
    paymentPending: newUser.paymentPending,
  };
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionUser));

  return { success: true, user: sessionUser };
}

// ─── Get current session user ───────────────────────────

export function getSessionUser(): LoginResult["user"] | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ─── Logout ─────────────────────────────────────────────

export function logoutUser(): void {
  localStorage.removeItem(AUTH_SESSION_KEY);
}

// ─── Admin PIN code ─────────────────────────────────────

const ADMIN_PIN = "202406";

export async function verifyAdminPIN(pin: string): Promise<LoginResult> {
  initializePlatformAccounts();

  if (pin !== ADMIN_PIN) {
    return { success: false, error: "Code PIN incorrect." };
  }

  return loginUser("admin@xtrendai.com", "Admin2024!");
}

// ─── Quick login for test accounts ──────────────────────

export async function quickLoginTestAccount(
  account: "free" | "pro" | "expert" | "institutional" | "admin"
): Promise<LoginResult> {
  initializePlatformAccounts();

  const credentials: Record<string, { email: string; password: string }> = {
    free: { email: "free@xtrendai.demo", password: "Free2024" },
    pro: { email: "pro@xtrendai.demo", password: "Pro2024" },
    expert: { email: "expert@xtrendai.demo", password: "Expert2024" },
    institutional: { email: "institutional@xtrendai.demo", password: "Institutional2024" },
    admin: { email: "admin@xtrendai.com", password: "Admin2024!" },
  };

  const cred = credentials[account];
  if (!cred) return { success: false, error: "Compte de test inconnu." };

  return loginUser(cred.email, cred.password);
}

// ─── Get all registered users (for admin) ───────────────

export function getAllRegisteredUsers(): AuthUser[] {
  return getAllUsers();
}

// ─── Delete user (admin only) ───────────────────────────

export function deleteUser(userId: string): boolean {
  const users = getAllUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return false;
  users.splice(idx, 1);
  saveAllUsers(users);
  return true;
}

// ─── Update user pack ───────────────────────────────────

export function updateUserPack(
  userId: string,
  newPack: "free" | "pro" | "expert" | "institutional",
  status?: string
): boolean {
  const users = getAllUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return false;
  user.pack = newPack;
  if (status) user.packStatus = status;
  user.paymentPending = "no";
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);
  user.packExpiresAt = expiry.toISOString();
  saveAllUsers(users);

  // Update session if it's the current user
  const session = getSessionUser();
  if (session && session.id === userId) {
    session.pack = newPack;
    session.packStatus = status || "active";
    session.paymentPending = "no";
    session.packExpiresAt = expiry.toISOString();
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  }
  return true;
}

// ─── Get login security status ──────────────────────────

export interface SecurityStatus {
  isLocked: boolean;
  remainingMinutes: number;
  failedAttempts: number;
  maxAttempts: number;
}

export function getSecurityStatus(): SecurityStatus {
  const attempts = getLoginAttempts();
  return {
    isLocked: isAccountLocked(),
    remainingMinutes: getLockoutRemainingMinutes(),
    failedAttempts: attempts.count,
    maxAttempts: MAX_LOGIN_ATTEMPTS,
  };
}
