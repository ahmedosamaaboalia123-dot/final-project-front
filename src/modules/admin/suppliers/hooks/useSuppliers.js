import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteSupplier, getSuppliers } from "../services/suppliersService";

export function useSuppliers(params) {
  return useQuery({
    queryKey: ["suppliers", params.page, params.pageSize, params.search],
    queryFn: () => getSuppliers(params),
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}
