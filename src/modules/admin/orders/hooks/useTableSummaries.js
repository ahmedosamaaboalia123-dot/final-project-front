import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getAdminSocket } from "@/services/realtime";
import { getAdminOrderSummaries } from "../services/adminOrdersGateway";

const SUMMARY_KEY = ["tables", "summary"];

// Lightweight active-table view backed by React Query.
// - staleTime: the summary endpoint is a single grouped query, but we still
//   avoid redundant refetches by keeping a short stale window.
// - Socket events invalidate ONLY this tiny query (no full /orders reload).
export function useTableSummaries() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getAdminSocket();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: SUMMARY_KEY });
    socket.on("order:created", invalidate);
    socket.on("order:updated", invalidate);
    socket.on("order:item:updated", invalidate);
    socket.on("connect", invalidate);
    return () => {
      socket.off("order:created", invalidate);
      socket.off("order:updated", invalidate);
      socket.off("order:item:updated", invalidate);
      socket.off("connect", invalidate);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: SUMMARY_KEY,
    queryFn: getAdminOrderSummaries,
    staleTime: 10_000,
    gcTime: 60_000,
    refetchOnWindowFocus: false,
  });
}