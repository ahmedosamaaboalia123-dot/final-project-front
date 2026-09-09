import apiClient from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";

export const getWarnings = (params) => apiClient.get(endpoints.warnings, { params });
