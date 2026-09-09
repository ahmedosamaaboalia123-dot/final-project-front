import apiClient from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";

export const ORDER_FULFILLMENT = { ONLINE_DELIVERY: "DELIVERY", TAKEAWAY_PICKUP: "PICKUP" };
const makeIdempotencyKey = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const normalizeItem = (item) => ({
  productId: Number(item.originalId || item.productId || item.id),
  productSizeId: Number(item.productSizeId || item.customizations?.sizeId),
  typeName: item.customizations?.type || item.type,
  addonIds: (item.customizations?.addons || item.addons || []).map((addon) => Number(addon.id || addon.productAddonId || addon)),
  quantity: Number(item.quantity) || 1,
});

export function buildPublicOrderPayload({ fulfillmentType, customer, items }) {
  const deliveryAddress = fulfillmentType === "DELIVERY" ? {
    city: customer.city?.trim(), area: customer.area?.trim(), street: customer.street?.trim(),
    building: customer.building?.trim(), floor: customer.floor?.trim(), landmark: customer.landmark?.trim(),
  } : null;
  return { channel: "CUSTOMER_WEB", fulfillmentType, customer: { name: customer.name.trim(), phone: customer.phone.trim() }, deliveryAddress, items: items.map(normalizeItem) };
}

export async function createPublicOrder(input, idempotencyKey = makeIdempotencyKey()) {
  const payload = await apiClient.post(endpoints.publicOrders.create, buildPublicOrderPayload(input), {
    headers: { "Idempotency-Key": idempotencyKey },
  });
  // apiClient unwraps response.data -> { success, data }; return the real order.
  return payload?.data ?? payload;
}
export const isPublicOrdersApiEnabled = () => true;
export async function getPublicOrderTracking(code, token) {
  const payload = await apiClient.get(endpoints.publicOrders.track(code), { params: { token } });
  return payload?.data ?? payload;
}

// Look up an order for customer tracking by order number + phone (manual search).
// The backend returns a SAFE projection: no ingredients/cost, no trackingToken.
// `response` is already response.data (axios interceptor) -> { success, data }.
export async function lookupOrderByPhone({ orderNumber, phone }) {
  const payload = await apiClient.get(endpoints.publicOrders.lookup, {
    params: { orderNumber: String(orderNumber || "").trim(), phone: String(phone || "").trim() },
  });
  return payload?.data ?? payload;
}

// List the customer's real orders from the backend by phone (safe projection).
// Used by the "My Orders" page so it shows live server data, not stale local copies.
export async function listMyOrdersByPhone(phone) {
  const payload = await apiClient.get(endpoints.publicOrders.byPhone, {
    params: { phone: String(phone || "").trim() },
  });
  return Array.isArray(payload?.data) ? payload.data : [];
}
