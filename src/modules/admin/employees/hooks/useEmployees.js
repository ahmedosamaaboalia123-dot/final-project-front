import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { employeesService } from "../services/employeesService";

export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: employeesService.list,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: employeesService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });
}
