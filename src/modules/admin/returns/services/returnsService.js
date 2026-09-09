import apiClient from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";

export const getRawMaterialReturns = (params) => apiClient.get(endpoints.rawMaterialReturns.list, { params });
export const getRawMaterialReturn = (id) => apiClient.get(endpoints.rawMaterialReturns.byId(id));
export const createRawMaterialReturn = (data) => apiClient.post(endpoints.rawMaterialReturns.create, data);
