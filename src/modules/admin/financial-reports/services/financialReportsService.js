import apiClient from "@/services/apiClient";

export async function getFinancialOverview(filters = {}) {
  const response = await apiClient.get("/financial-reports/overview", { params: filters });
  return response.data || response;
}

export async function getInventoryFinancialReport() {
  const response = await apiClient.get("/financial-reports/inventory");
  return response.data || response;
}
