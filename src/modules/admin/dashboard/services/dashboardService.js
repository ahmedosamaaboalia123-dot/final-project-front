import apiClient from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";

export async function getDashboardData() {
  const response = await apiClient.get(endpoints.dashboard);
  return response?.data ?? response;
}
