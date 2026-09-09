import apiClient from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";

const unwrap = (response) => response?.data ?? response;
const idempotencyConfig = (key) => key ? { headers: { "Idempotency-Key": key } } : undefined;

export async function getAdminOrders({ fulfillmentType, status, channel, scope = "active", pageSize = 30 } = {}) {
  const response = await apiClient.get(endpoints.adminOrders.list, { params: { fulfillmentType, status, channel, scope, page: 1, pageSize } });
  return unwrap(response);
}
export async function getAdminOrderSummaries() {
  return unwrap(await apiClient.get(endpoints.adminOrders.tableSummaries)) || [];
}
export async function getPrepOrders() {
  const response = unwrap(await apiClient.get(endpoints.adminOrders.prep));
  return response?.items || response || [];
}
export async function createAdminTableOrder({ tableNumber, items }, idempotencyKey) {
  const response = await apiClient.post(endpoints.adminOrders.list, {
    channel: "TABLE_WAITER", fulfillmentType: "DINE_IN", orderType: "tables", table: String(tableNumber),
    items: items.map((item) => ({ productId: Number(item.productId), productSizeId: Number(item.productSizeId), quantity: Number(item.qty || item.quantity), typeName: item.variant, addonIds: item.addons || [] })),
  }, idempotencyConfig(idempotencyKey));
  return unwrap(response);
}
export async function createAdminOnlineOrder({ customerName, phone, address, fulfillmentType, items }, idempotencyKey) {
  const response = await apiClient.post(endpoints.adminOrders.list, { channel:"ADMIN_POS", fulfillmentType, customerName, phone, ...(fulfillmentType === "DELIVERY" ? { deliveryAddress:{address} } : {}), items:items.map(item=>({productId:Number(item.productId),productSizeId:Number(item.productSizeId),quantity:Number(item.qty||item.quantity),typeName:item.variant,addonIds:item.addons||[]})) }, idempotencyConfig(idempotencyKey));
  return unwrap(response);
}

export async function getAvailableDelegates(){return unwrap(await apiClient.get(endpoints.adminOrders.availableDelegates))||[]}
export async function handOverOrderToDelegate(orderId,delegateId,idempotencyKey){return unwrap(await apiClient.patch(endpoints.adminOrders.handOverDelegate(orderId),{delegateId},idempotencyConfig(idempotencyKey)))}
export async function updateAdminOrderStatus(id, status, reason, idempotencyKey) {
  return unwrap(await apiClient.patch(endpoints.adminOrders.status(id), { status, ...(reason ? { reason } : {}) }, idempotencyConfig(idempotencyKey)));
}
export async function closeAdminTable(tableNumber, payment = {}, idempotencyKey) {
  return unwrap(await apiClient.patch(endpoints.adminOrders.closeTable(tableNumber), payment, idempotencyConfig(idempotencyKey)));
}
export async function getAdminOrder(id) { return unwrap(await apiClient.get(endpoints.adminOrders.byId(id))); }
export async function updateAdminOrderItemStatus(orderId, itemId, status, reason, idempotencyKey) { return unwrap(await apiClient.patch(endpoints.adminOrders.itemStatus(orderId,itemId), { status, ...(reason ? { reason } : {}) }, idempotencyConfig(idempotencyKey))); }
export async function payAdminOrder(orderId, payment, idempotencyKey) { return unwrap(await apiClient.post(endpoints.adminOrders.payments(orderId), payment, idempotencyConfig(idempotencyKey))); }
