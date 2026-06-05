import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthUser, Pack } from "@/types";
import {
  getSessionUser,
  initializeAuthService,
  loginUser,
  logoutUser,
  quickLoginTestAccount,
  registerUser,
  updateUserPack,
  verifyAdminPIN,
} from "@/services/authService";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  loginError: string | null;
  registerError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  quickLogin: (account: "free" | "pro" | "expert" | "institutional" | "admin") => Promise<boolean>;
  adminPinLogin: (pin: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, pack: Pack) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => void;
  updatePack: (pack: Pack, status?: AuthUser["packStatus"]) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const refreshUser = () => {
    setUser(getSessionUser());
  };

  useEffect(() => {
    initializeAuthService().finally(() => {
      refreshUser();
      setLoading(false);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      loginError,
      registerError,
      login: async (email, password) => {
        const result = await loginUser(email, password);
        if (!result.ok) {
          setLoginError(result.message);
          return false;
        }
        setLoginError(null);
        setUser(result.user);
        return true;
      },
      quickLogin: async (account) => {
        const result = await quickLoginTestAccount(account);
        if (!result.ok) {
          setLoginError(result.message);
          return false;
        }
        setLoginError(null);
        setUser(result.user);
        return true;
      },
      adminPinLogin: async (pin) => {
        const result = verifyAdminPIN(pin);
        if (!result.ok) {
          setLoginError(result.message);
          return false;
        }
        setLoginError(null);
        setUser(result.user);
        return true;
      },
      register: async (name, email, password, pack) => {
        const result = await registerUser(name, email, password, pack);
        if (!result.ok) {
          setRegisterError(result.message);
          return false;
        }
        setRegisterError(null);
        setUser(result.user);
        return true;
      },
      logout: () => {
        logoutUser();
        setUser(null);
      },
      refreshUser,
      updatePack: (pack, status) => {
        if (!user) return;
        const updatedUser = updateUserPack(user.id, pack, status);
        if (updatedUser) {
          setUser(updatedUser);
        }
      },
    }),
    [loading, loginError, registerError, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
