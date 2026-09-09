import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/authService";

export function useCheckOut(options = {}) {
  return useMutation({
    mutationFn: authService.checkOut,
    ...options,
  });
}
