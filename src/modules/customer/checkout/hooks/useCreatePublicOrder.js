import { useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { beginOperation, finishOperation } from "@/api/idempotency";
import { customerOrdersApi } from "@/modules/customer/api/customerOrders.api";
import { customerStorage } from "@/modules/customer/services/customerStorage";
import { normalizeCustomerAddress } from "../services/orderGateway";

export function useCreatePublicOrder(options = {}) {
  const scope = useRef(`customer:checkout:${globalThis.crypto?.randomUUID?.() || Date.now()}`);
  return useMutation({
    mutationFn: async ({ fulfillmentType, customer, items }) => { const address = fulfillmentType === "DELIVERY" ? normalizeCustomerAddress(customer) : ""; const body = { fulfillmentType, customer: { name: customer.name.trim(), phone: customer.phone.trim(), ...(address ? { address } : {}) }, items: items.map((item) => ({ productId: String(item.originalId || item.productId || item.id), productSizeId: String(item.productSizeId || item.customizations?.sizeId), quantity: Number(item.quantity) || 1, ...((item.customizations?.addons || item.addons || []).length ? { addonIds: (item.customizations?.addons || item.addons).map((a) => String(a.id || a.productAddonId || a)) } : {}), ...(item.customizations?.notes || item.notes ? { notes: item.customizations?.notes || item.notes } : {}) })) }; const result = await customerOrdersApi.checkout(body, beginOperation(scope.current)); finishOperation(scope.current); customerStorage.saveProfile({ ...customer, address }); customerStorage.saveOrderAccess(result.order.publicOrderNumber, { ...result.tracking, barcodeValue: result.tracking.barcodeValue }); return { ...result.order, orderNumber: result.order.publicOrderNumber, barcodeValue: result.tracking.barcodeValue, trackingToken: result.tracking.trackingReadToken, actionToken: result.tracking.orderActionToken, customer: result.customer }; },
    ...options,
  });
}
