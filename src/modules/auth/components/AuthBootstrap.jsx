import { useEffect } from "react";
import { appConfig } from "@/app/config";
import { useAuthStore } from "@/store/authStore";
import { authService } from "../services/authService";
import { toAuthSession } from "../adapters/auth.adapter";

export default function AuthBootstrap({ children }) {
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setAuthChecking = useAuthStore((state) => state.setAuthChecking);

  useEffect(() => {
    const token = localStorage.getItem(appConfig.tokenKey);
    if (!token) {
      setAuthChecking(false);
      return;
    }
    authService.bootstrap()
      .then((data) => {
        setAuth(toAuthSession(data, token));
      })
      .catch(() => {
        localStorage.removeItem(appConfig.tokenKey);
        localStorage.removeItem(appConfig.refreshTokenKey);
        clearAuth();
      })
      .finally(() => setAuthChecking(false));
  }, [clearAuth, setAuth, setAuthChecking]);

  return children;
}
