import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getAdminSocket } from "@/services/realtime";
import { getPrepOrders } from "../services/adminOrdersGateway";

const PREP_KEY = ["orders", "prep"];

// Lightweight preparation list backed by React Query.
// Socket events invalidate ONLY this tiny query (item counts, no full order bodies).
export function usePrepOrders() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getAdminSocket();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: PREP_KEY });
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
    queryKey: PREP_KEY,
    queryFn: getPrepOrders,
    staleTime: 5000,
    gcTime: 60_000,
    refetchOnWindowFocus: false,
  });
}