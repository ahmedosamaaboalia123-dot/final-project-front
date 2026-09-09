import apiClient from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";

export const getPurchases = (params) =>
  apiClient.get(endpoints.purchases.list, { params });

export const getPurchaseGroups = (params) =>
  apiClient.get(endpoints.purchases.groups, { params });

export const getPurchaseGroup = (id) =>
  apiClient.get(endpoints.purchases.groupById(id));

export const createGroupedPurchase = (data) =>
  apiClient.post(endpoints.purchases.createGrouped, data);

export const getPurchase = (id) =>
  apiClient.get(endpoints.purchases.byId(id));

export const createPurchase = (data) =>
  apiClient.post(endpoints.purchases.create, data);

export const updatePurchase = (id, data) =>
  apiClient.put(endpoints.purchases.update(id), data);

export const getPurchasePreview = (id) =>
  apiClient.get(endpoints.purchases.preview(id));

export const approvePurchase = (id) =>
  apiClient.patch(endpoints.purchases.approve(id));

export const receivePurchaseItem = (id, itemId, data) =>
  apiClient.post(endpoints.purchases.receiveItem(id, itemId), data);

export const cancelPurchase = (id) =>
  apiClient.patch(endpoints.purchases.cancel(id));

export const deletePurchase = (id) =>
  apiClient.delete(endpoints.purchases.remove(id));

export const getPurchaseReturnContext = (id) =>
  apiClient.get(endpoints.purchases.returnContext(id));

export const getPurchaseReturns = (id, params) =>
  apiClient.get(endpoints.purchases.returns(id), { params });

export const createPurchaseReturn = (id, data) =>
  apiClient.post(endpoints.purchases.createReturn(id), data);

export const getSuppliers = (params) =>
  apiClient.get(endpoints.suppliers.list, { params });

export const getSupplierOptions = () =>
  apiClient.get(endpoints.suppliers.options);

export const getMaterials = (params) =>
  apiClient.get(endpoints.inventory.list, { params });

export const getMaterialOptions = () =>
  apiClient.get(endpoints.inventory.options);

export const getSupplierAccount = (id, params) =>
  apiClient.get(endpoints.suppliers.transactions(id), { params });
