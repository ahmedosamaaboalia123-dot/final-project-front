import apiClient from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";

const unwrap = (response) => response?.data ?? response;
const makeKey = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export async function getTableServiceRequests(scope = "all") {
  return unwrap(await apiClient.get(endpoints.tableSessions.allServiceRequests, { params: { scope } })) || [];
}

export async function updateTableServiceRequest(requestId, status, reason) {
  return unwrap(await apiClient.patch(
    endpoints.tableSessions.serviceRequestById(requestId),
    { status, ...(reason ? { reason } : {}) },
    { headers: { "Idempotency-Key": makeKey() } },
  ));
}
