import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { beginOperation, finishOperation } from "@/api/idempotency";
import { queryKeys } from "@/api/queryKeys";
import { refundsApi } from "../api/refunds.api";

const uniqueScope = (name) => `${name}:${globalThis.crypto?.randomUUID?.() || Math.random()}`;

function useRefundMutation(name, mutation, { onSuccess } = {}) {
  const queryClient = useQueryClient();
  const scope = useRef(uniqueScope(name));
  const result = useMutation({
    mutationFn: (variables) => mutation(variables, beginOperation(scope.current)),
    onSuccess: async (data, variables) => {
      finishOperation(scope.current);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.payments.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.drawer.screen }),
        queryClient.invalidateQueries({ queryKey: queryKeys.reports.financial({}) }),
      ]);
      onSuccess?.(data, variables);
    },
  });
  return { ...result, resetAttempt() { finishOperation(scope.current); result.reset(); } };
}

export const useCompleteCashRefund = (options) =>
  useRefundMutation("refund:complete", (body, key) => refundsApi.complete(body.refundId, { expectedRefundVersion: body.expectedRefundVersion }, key), options);

export const useRetryCashRefund = (options) =>
  useRefundMutation("refund:retry", (body, key) => refundsApi.retry(body.refundId, { expectedRefundVersion: body.expectedRefundVersion }, key), options);

export const useSweepCashRefunds = (options) =>
  useRefundMutation("refund:sweep", (_body, key) => refundsApi.sweep(key), options);
