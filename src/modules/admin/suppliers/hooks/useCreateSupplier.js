import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSupplier } from "../services/suppliersService";

export default function useCreateSupplier(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSupplier,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      options.onSuccess?.(...args);
    },
  });
}
