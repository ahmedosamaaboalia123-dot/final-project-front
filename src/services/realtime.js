import { io } from "socket.io-client";
import { useAuthStore } from "@/store/authStore";
import { appConfig } from "@/app/config";

const socketUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
let adminSocket;

export function getAdminSocket() {
  if (!adminSocket) {
    const token = useAuthStore.getState().token || localStorage.getItem(appConfig.tokenKey);
    adminSocket = io(socketUrl, { auth: { token }, transports: ["websocket", "polling"] });
  }
  return adminSocket;
}

export function updateAdminSocketToken(token) {
  if (!adminSocket) return;
  adminSocket.auth = { ...adminSocket.auth, token };
  adminSocket.disconnect().connect();
}

export function disconnectAdminSocket() {
  adminSocket?.disconnect();
  adminSocket = undefined;
}

export function createTrackingSocket(trackingToken) {
  return io(socketUrl, { auth: { trackingToken }, transports: ["websocket", "polling"] });
}
