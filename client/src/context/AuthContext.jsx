import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

function isProfileComplete(user) {
  if (!user) return false;
  const hasCompany = user.company_id !== null && user.company_id !== undefined;
  const hasRole = Boolean(user.role_designation);
  const hasExperience =
    user.years_experience !== null && user.years_experience !== undefined;

  if (user.is_referral_provider) {
    const hasVerifiedCompanyEmail = Boolean(user.is_company_email_verified);
    return hasCompany && hasRole && hasExperience && hasVerifiedCompanyEmail;
  }

  return hasCompany && hasRole && hasExperience;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    let mounted = true;
    async function hydrate() {
      if (!token) {
        setUser(null);
        setCompany(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await api.me();
        if (!mounted) return;
        setUser(data.user);
        setCompany(data.company);
      } catch {
        // Token invalid/expired
        if (!mounted) return;
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        setCompany(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    hydrate();
    return () => {
      mounted = false;
    };
  }, [token]);

  const value = useMemo(() => {
    return {
      token,
      user,
      company,
      loading,
      isAuthenticated: Boolean(token),
      isProfileComplete: isProfileComplete(user),
      async loginWithGoogle(idToken) {
        const data = await api.authGoogle(idToken);
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setUser(data.user);
        setCompany(data.company);
        return data;
      },
      logout() {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        setCompany(null);
      },
      async updateMe(payload) {
        const data = await api.patchMe(payload);
        setUser(data.user);
        setCompany(data.company);
        return data;
      },
      async refreshUser() {
        const data = await api.me();
        setUser(data.user);
        setCompany(data.company);
        return data;
      },
    };
  }, [token, user, company, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
