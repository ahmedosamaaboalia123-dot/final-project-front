import apiClient from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";

export const getSuppliers = ({ page = 1, pageSize = 10, search = "" } = {}) =>
  apiClient.get(endpoints.suppliers.list, { params: { page, pageSize, search } });
export const getSupplierOptions = () => apiClient.get(endpoints.suppliers.options);
export const getSupplier = (id) => apiClient.get(endpoints.suppliers.byId(id));
export const createSupplier = (data) => apiClient.post(endpoints.suppliers.list, data);
export const updateSupplier = (id, data) => apiClient.put(endpoints.suppliers.byId(id), data);
export const deleteSupplier = (id) => apiClient.delete(endpoints.suppliers.byId(id));
export const getSupplierTransactions = (
  id,
  { page = 1, pageSize = 100 } = {},
) => apiClient.get(endpoints.suppliers.transactions(id), { params: { page, pageSize } });
export const createSupplierTransaction = (id, data) =>
  apiClient.post(endpoints.suppliers.createTransaction(id), data);
