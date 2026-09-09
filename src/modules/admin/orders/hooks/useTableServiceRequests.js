import { useCallback, useEffect, useState } from "react";
import { getAdminSocket } from "@/services/realtime";
import { getTableServiceRequests, updateTableServiceRequest } from "../services/tableServicesService";

export function useTableServiceRequests() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState(null);
  const upsert = useCallback((incoming) => setServices((current) => incoming?.id ? [incoming, ...current.filter((item) => item.id !== incoming.id)] : current), []);
  const load = useCallback(async () => {
    try { setServices(await getTableServiceRequests("all")); setError(""); }
    catch (reason) { setError(reason?.response?.data?.message || reason.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const socket = getAdminSocket();
    socket.on("table-service:created", upsert);
    socket.on("table-service:updated", upsert);
    socket.on("connect", load);
    return () => { socket.off("table-service:created", upsert); socket.off("table-service:updated", upsert); socket.off("connect", load); };
  }, [load, upsert]);

  const changeStatus = async (id, status) => {
    if (pendingId) return;
    setPendingId(id);
    try { upsert(await updateTableServiceRequest(id, status)); setError(""); }
    catch (reason) { setError(reason?.response?.data?.message || reason.message); }
    finally { setPendingId(null); }
  };
  return { services, loading, error, pendingId, changeStatus, refresh: load };
}
