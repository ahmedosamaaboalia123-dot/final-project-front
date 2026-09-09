import { useMutation } from "@tanstack/react-query";
import { createPublicOrder } from "../services/orderGateway";

export function useCreatePublicOrder(options = {}) {
  return useMutation({
    mutationFn: createPublicOrder,
    ...options,
  });
}
