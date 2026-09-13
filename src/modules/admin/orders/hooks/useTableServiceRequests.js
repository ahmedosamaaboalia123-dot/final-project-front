import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { beginOperation, finishOperation } from "@/api/idempotency";
import { useRealtimeRoom } from "@/realtime/useRealtimeRoom";
import { queryKeys } from "@/api/queryKeys";
import { TABLE_SERVICE_ENDPOINTS, getTableServiceRequests, updateTableServiceRequest } from "../services/tableServicesService";

const keyOf = (tab, page) => [...queryKeys.tableServices.list({ tab, page })];

export function useTableServiceRequests(tab = "open", page = 1) {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState("");
  const query = useQuery({
    queryKey: keyOf(tab, page),
    queryFn: () => getTableServiceRequests(tab, page),
    placeholderData: (previous) => previous,
  });
  useRealtimeRoom({ scope: "table-services:list", rooms: ["admin:orders"], enabled: true, onEvent: () => query.refetch() });
  const mutation = useMutation({
    mutationFn: ({ id, expectedVersion, resolutionNote }) => updateTableServiceRequest(id, expectedVersion, resolutionNote, beginOperation(`table-service:${id}`)),
    onSuccess: async (_data, variables) => {
      finishOperation(`table-service:${variables.id}`);
      setActionError("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.tableServices.all });
    },
    onError: (e) => { setActionError(e?.response?.data?.error?.messageAr || e.message); },
  });
  const data = query.data || {};
  const services = tab === "completed" ? data.completedRequests || [] : data.openRequests || [];
  const changeStatus = async (id, expectedVersion, resolutionNote) => {
    if (mutation.isPending) return;
    await mutation.mutateAsync({ id, expectedVersion, resolutionNote });
  };
  return {
    services,
    loading: query.isLoading,
    error: actionError || (query.error ? query.error?.response?.data?.error?.messageAr || query.error.message : ""),
    pendingId: mutation.isPending ? mutation.variables?.id ?? true : null,
    changeStatus,
    refresh: query.refetch,
    meta: data.pageMeta || {},
  };
}

export { TABLE_SERVICE_ENDPOINTS };
