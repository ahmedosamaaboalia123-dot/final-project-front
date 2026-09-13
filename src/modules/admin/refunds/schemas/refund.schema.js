import { z } from "zod";

export const refundVersionSchema = z.object({
  expectedRefundVersion: z.number().int().min(0),
}).strict();

export function firstRefundFormError(result) {
  return result.success ? null : result.error.issues[0]?.message || "راجع البيانات";
}
