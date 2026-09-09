import apiClient from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";

export const authService = {
  async me() {
    const response = await apiClient.get(endpoints.auth.me);
    return response.data || response;
  },
  logout(refreshToken) {
    return apiClient.post(endpoints.auth.logout, { refreshToken });
  },
  logoutAll() {
    return apiClient.post(endpoints.auth.logoutAll);
  },
  async checkOut() {
    const response = await apiClient.post(endpoints.attendance.checkOut);
    return response?.data ?? response;
  },
};
