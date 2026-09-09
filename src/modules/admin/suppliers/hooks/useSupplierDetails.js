import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSupplierTransaction,
  getSupplier,
  getSupplierTransactions,
  updateSupplier,
} from "../services/suppliersService";

export function useUpdateSupplier(supplierId, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => updateSupplier(supplierId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["supplier", String(supplierId)] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      options.onSuccess?.(...args);
    },
  });
}

export default function useSupplierDetails(id, transactionOptions = {}) {
  const queryClient = useQueryClient();
  const refreshSupplier = () => queryClient.invalidateQueries({ queryKey: ["supplier", id] });
  const refreshTransactions = () =>
    queryClient.invalidateQueries({ queryKey: ["supplier-transactions", id] });

  const supplierQuery = useQuery({
    queryKey: ["supplier", id],
    queryFn: async () => (await getSupplier(id)).data,
    enabled: Boolean(id),
  });

  const transactionsQuery = useQuery({
    queryKey: ["supplier-transactions", id],
    queryFn: () => getSupplierTransactions(id, { page: 1, pageSize: 100 }),
    enabled: Boolean(id),
  });

  const addTransaction = useMutation({
    mutationFn: (data) => createSupplierTransaction(id, data),
    onSuccess: (...args) => {
      refreshSupplier();
      refreshTransactions();
      transactionOptions.onSuccess?.(...args);
    },
  });

  return { supplierQuery, transactionsQuery, addTransaction, refreshSupplier };
}
