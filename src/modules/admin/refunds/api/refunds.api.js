import { unwrapData } from "@/api/envelope";
import { operationHeaders } from "@/api/idempotency";
import { v1Client } from "@/api/v1Client";

export const REFUND_ENDPOINTS = Object.freeze({
  complete: (id) => `/cash-refunds/${encodeURIComponent(id)}/complete`,
  retry: (id) => `/cash-refunds/${encodeURIComponent(id)}/retry`,
  sweep: "/cash-refunds/sweep",
});

export const refundsApi = {
  async complete(id, body, idempotencyKey) { return unwrapData(await v1Client.post(REFUND_ENDPOINTS.complete(id), body, { headers: operationHeaders({ idempotencyKey }) })); },
  async retry(id, body, idempotencyKey) { return unwrapData(await v1Client.post(REFUND_ENDPOINTS.retry(id), body, { headers: operationHeaders({ idempotencyKey }) })); },
  async sweep(idempotencyKey) { return unwrapData(await v1Client.post(REFUND_ENDPOINTS.sweep, {}, { headers: operationHeaders({ idempotencyKey }) })); },
};
