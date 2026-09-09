import { useCallback, useEffect, useRef, useState } from "react";
import { getAdminSocket } from "@/services/realtime";
import { getAdminOrders } from "../services/adminOrdersGateway";

export function useRealtimeOrders(filters = {}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const inFlightRef = useRef(false);
  const refresh = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try { setOrders(await getAdminOrders(filters)); setError(""); }
    catch (e) { setError(e.response?.data?.message || e.message); }
    finally { inFlightRef.current = false; setLoading(false); }
  }, [filters.fulfillmentType, filters.status, filters.scope, filters.channel, filters.pageSize]);
  const matchesFilters = useCallback((order) => {
    if (!order) return false;
    if (filters.fulfillmentType && order.fulfillmentType !== filters.fulfillmentType) return false;
    if (filters.channel && order.channel !== filters.channel) return false;
    if (filters.status && order.status !== filters.status) return false;
    if (filters.scope === "history") return ["COMPLETED", "CANCELLED"].includes(order.status);
    if ((filters.scope || "active") === "active") return !["COMPLETED", "CANCELLED"].includes(order.status);
    return true;
  }, [filters.fulfillmentType, filters.status, filters.channel, filters.scope]);
  useEffect(() => {
    refresh();
    const socket = getAdminSocket();
    const upsertOrder = (payload) => {
      const order = payload?.order;
      if (!order) return;
      setOrders((current) => {
        const withoutOrder = current.filter((item) => item.id !== order.id);
        if (!matchesFilters(order)) return withoutOrder;
        return [order, ...withoutOrder].slice(0, filters.pageSize || 30);
      });
    };
    socket.on("order:created", upsertOrder);
    socket.on("order:updated", upsertOrder);
    const patchItem = (payload) => setOrders((current) => current.map((order) => {
      if (Number(order.id) !== Number(payload?.orderId)) return order;
      const next = { ...order, status: payload.orderStatus || order.status,
        items: (order.items || []).map((item) => Number(item.id) === Number(payload.itemId) ? { ...item, status: payload.status } : item) };
      return matchesFilters(next) ? next : null;
    }).filter(Boolean));
    socket.on("order:item:updated", patchItem);
    // Re-sync full list only on reconnect, not on every event.
    socket.on("connect", refresh);
    return () => {
      socket.off("order:created", upsertOrder);
      socket.off("order:updated", upsertOrder);
      socket.off("order:item:updated", patchItem);
      socket.off("connect", refresh);
    };
  }, [refresh, matchesFilters, filters.pageSize]);
  return { orders, loading, error, refresh };
}
