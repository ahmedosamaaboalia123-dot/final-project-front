import apiClient from "@/services/apiClient";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { endpoints } from "@/services/endpoints";

let fingerprintPromise;

const getDevice = async () => {
  fingerprintPromise ||= FingerprintJS.load();
  const agent = await fingerprintPromise;
  const result = await agent.get();
  const platform = navigator.userAgentData?.platform || navigator.platform || "Unknown OS";
  return {
    fingerprint: result.visitorId,
    name: `${platform} - ${navigator.userAgentData?.brands?.at(-1)?.brand || "Browser"}`,
    userAgent: navigator.userAgent,
  };
};

export const loginService = {
  async login(credentials) {
    const device = await getDevice();
    const response = await apiClient.post(endpoints.auth.login, { ...credentials, device });
    const data = response.data || response;
    if (!data.pendingDeviceApproval && (!data.employee || !data.auth?.access_token || !data.auth?.refresh_token)) {
      throw new Error("استجابة تسجيل الدخول غير مكتملة");
    }
    return data;
  },
};
