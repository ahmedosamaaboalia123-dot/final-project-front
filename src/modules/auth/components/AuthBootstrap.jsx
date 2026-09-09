import { useEffect } from "react";
import { appConfig } from "@/app/config";
import { useAuthStore } from "@/store/authStore";
import { authService } from "../services/authService";

const publicSession = (data) => ({
  employee: data.employee,
  role: data.role,
  permissions: data.permissions || [],
  notifications: data.notifications || [],
  shift: data.shift ?? data.employee?.shift ?? null,
});

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
    authService.me()
      .then((data) => {
        const session = publicSession(data);
        setAuth(session);
        localStorage.setItem("auth_session", JSON.stringify(session));
      })
      .catch(() => {
        localStorage.removeItem(appConfig.tokenKey);
        localStorage.removeItem(appConfig.refreshTokenKey);
        localStorage.removeItem("auth_session");
        clearAuth();
      })
      .finally(() => setAuthChecking(false));
  }, [clearAuth, setAuth, setAuthChecking]);

  return children;
}
