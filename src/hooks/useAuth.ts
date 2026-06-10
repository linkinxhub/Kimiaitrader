import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  loginUser,
  registerUser,
  quickLoginTestAccount,
  logoutUser,
  getSessionUser,
  updateUserPack,
  verifyAdminPIN,
  type LoginResult,
  type RegisterResult,
  initializePlatformAccounts,
  getSecurityStatus,
} from "@/services/authService";

// ─── Unified User Type ──────────────────────────────────

export interface UnifiedUser {
  id: number | string;
  name: string | null;
  email: string | null;
  avatar?: string | null;
  role: string;
  pack: string;
  packStatus: string;
  packExpiresAt?: string | Date | null;
  paymentPending: string;
}

// Initialize platform accounts on first load
initializePlatformAccounts();

export function useAuth() {
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [securityStatus, setSecurityStatus] = useState(() => getSecurityStatus());

  // Read current session
  const user: UnifiedUser | null = useMemo(() => {
    const session = getSessionUser();
    if (!session) return null;
    return {
      id: session.id,
      name: session.name,
      email: session.email,
      role: session.role,
      pack: session.pack,
      packStatus: session.packStatus,
      packExpiresAt: session.packExpiresAt,
      paymentPending: session.paymentPending,
    };
  }, []);

  const isLoading = false;
  const isAuthenticated = !!user;
  const isAdmin = user?.role === "admin";

  // ─── Login with email/password ──────────────────────────
  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setLoginError(null);
      const result = await loginUser(email, password);
      setSecurityStatus(getSecurityStatus());
      if (result.success) {
        window.location.href = "/#/dashboard";
        return true;
      }
      setLoginError(result.error || "Erreur de connexion.");
      return false;
    },
    []
  );

  // ─── Quick login for test accounts ──────────────────────
  const quickLogin = useCallback(
    async (account: "free" | "pro" | "expert" | "institutional" | "admin"): Promise<boolean> => {
      setLoginError(null);
      const result = await quickLoginTestAccount(account);
      setSecurityStatus(getSecurityStatus());
      if (result.success) {
        window.location.href = "/#/dashboard";
        return true;
      }
      setLoginError(result.error || "Erreur de connexion rapide.");
      return false;
    },
    []
  );

  // ─── Admin PIN login ────────────────────────────────────
  const adminPinLogin = useCallback(
    async (pin: string): Promise<boolean> => {
      setLoginError(null);
      const result = await verifyAdminPIN(pin);
      if (result.success) {
        window.location.href = "/#/dashboard";
        return true;
      }
      setLoginError(result.error || "Code PIN incorrect.");
      return false;
    },
    []
  );

  // ─── Register new account ───────────────────────────────
  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      pack: "free" | "pro" | "expert" | "institutional" = "free"
    ): Promise<boolean> => {
      setRegisterError(null);
      const result = await registerUser(name, email, password, pack);
      if (result.success) {
        if (pack !== "free") {
          window.location.href = "/#/billing";
        } else {
          window.location.href = "/#/dashboard";
        }
        return true;
      }
      setRegisterError(result.error || "Erreur d'inscription.");
      return false;
    },
    []
  );

  // ─── Logout ─────────────────────────────────────────────
  const logout = useCallback(() => {
    logoutUser();
    window.location.href = "/";
  }, []);

  // ─── Update pack ────────────────────────────────────────
  const updatePack = useCallback(
    (pack: string, status?: string) => {
      if (!user) return;
      const updated = updateUserPack(
        user.id as string,
        pack as "free" | "pro" | "expert" | "institutional",
        status
      );
      if (updated) {
        window.location.reload();
      }
    },
    [user]
  );

  const downgradeToFree = useCallback(() => {
    updatePack("free", "active");
  }, [updatePack]);

  // ─── Get all test accounts info ─────────────────────────
  const getTestAccounts = useCallback(
    () => ({
      free: { email: "free@xtrendai.demo", password: "Free2024" },
      pro: { email: "pro@xtrendai.demo", password: "Pro2024" },
      expert: { email: "expert@xtrendai.demo", password: "Expert2024" },
      institutional: {
        email: "institutional@xtrendai.demo",
        password: "Institutional2024",
      },
      admin: { email: "admin@xtrendai.com", password: "Admin2024!" },
    }),
    []
  );

  return useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      isAdmin,
      login,
      loginError,
      quickLogin,
      adminPinLogin,
      register,
      registerError,
      logout,
      updatePack,
      downgradeToFree,
      getTestAccounts,
      securityStatus,
      refresh: () => setSecurityStatus(getSecurityStatus()),
    }),
    [
      user,
      isAuthenticated,
      isLoading,
      isAdmin,
      login,
      loginError,
      quickLogin,
      adminPinLogin,
      register,
      registerError,
      logout,
      updatePack,
      downgradeToFree,
      getTestAccounts,
      securityStatus,
    ]
  );
}
