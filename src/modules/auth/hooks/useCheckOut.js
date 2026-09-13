import { useMutation } from "@tanstack/react-query";
import { attendanceApi } from "@/modules/admin/employees/api/employees.api";

export function useCheckOut(attendanceIdOrOptions, maybeOptions) {
  const attendanceId =
    typeof attendanceIdOrOptions === "string" || typeof attendanceIdOrOptions === "number"
      ? String(attendanceIdOrOptions)
      : attendanceIdOrOptions?.attendanceId
        ? String(attendanceIdOrOptions.attendanceId)
        : null;
  const options = typeof attendanceIdOrOptions === "string" || typeof attendanceIdOrOptions === "number" ? (maybeOptions ?? {}) : (attendanceIdOrOptions ?? {});

  return useMutation({
    mutationFn: (idOrBody) => {
      const id =
        typeof idOrBody === "string" || typeof idOrBody === "number"
          ? String(idOrBody)
          : attendanceId ?? (idOrBody?.attendanceId ? String(idOrBody.attendanceId) : null);
      if (!id) throw new Error("معرف الحضور مطلوب لتسجيل الانصراف");
      return attendanceApi.checkOut(id, {});
    },
    ...options,
  });
}
