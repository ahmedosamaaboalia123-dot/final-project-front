import { useState } from "react";
import Button from "@/shared/components/Button/Button";
import Input from "@/shared/components/Input/Input";
import Select from "@/shared/components/Select/Select";
import { ConflictDialog } from "@/shared/components";
import { isConflict } from "@/api/apiError";
import { useAuthStore } from "@/store/authStore";
import { can } from "@/modules/auth/permissions/permission";
import { useAdjustAttendance, useCheckOutAttendance, useForceCloseAttendance } from "../hooks/employee.mutations";
import { adjustAttendanceSchema, checkOutSchema, firstEmployeeFormError, forceCloseSchema } from "../schemas/employee.schema";

const toOffsetIso = (localValue) => {
  if (!localValue) return undefined;
  const date = new Date(localValue);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
};

const toLocalInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

function useConflictReset(...mutations) {
  return () => mutations.forEach((mutation) => mutation?.resetAttempt?.());
}

export default function AttendanceActions({ record }) {
  const permissions = useAuthStore((state) => state.permissions);
  const canCheckOut = can(permissions, "attendance.check-out");
  const canAdjust = can(permissions, "attendance.adjust");
  const canForceClose = can(permissions, "attendance.force-close");

  const [openForm, setOpenForm] = useState(null);
  const [notes, setNotes] = useState("");
  const [kind, setKind] = useState("BOTH");
  const [checkInAt, setCheckInAt] = useState("");
  const [checkOutAt, setCheckOutAt] = useState("");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");

  const attendanceId = String(record.id);
  const version = Number(record.version ?? 0);
  const checkOut = useCheckOutAttendance(attendanceId);
  const adjust = useAdjustAttendance(attendanceId);
  const forceClose = useForceCloseAttendance(attendanceId);
  const resetAll = useConflictReset(checkOut, adjust, forceClose);
  const conflicted = [checkOut, adjust, forceClose].some((mutation) => mutation.isError && isConflict(mutation.error));

  if (!canCheckOut && !canAdjust && !canForceClose) return <span>—</span>;

  const toggle = (name) => {
    resetAll();
    setFormError("");
    setOpenForm((current) => (current === name ? null : name));
  };

  const submitCheckOut = (event) => {
    event.preventDefault();
    const parsed = checkOutSchema.safeParse({ ...(notes.trim() ? { notes: notes.trim() } : {}), expectedVersion: version });
    if (!parsed.success) {
      setFormError(firstEmployeeFormError(parsed));
      return;
    }
    setFormError("");
    checkOut.mutate(parsed.data, { onSuccess: () => setOpenForm(null) });
  };

  const submitAdjust = (event) => {
    event.preventDefault();
    const changes = {};
    const inIso = toOffsetIso(checkInAt);
    const outIso = toOffsetIso(checkOutAt);
    if (inIso) changes.checkInAt = inIso;
    if (outIso) changes.checkOutAt = outIso;
    const parsed = adjustAttendanceSchema.safeParse({ kind, changes, reason: reason.trim(), expectedVersion: version });
    if (!parsed.success) {
      setFormError(firstEmployeeFormError(parsed));
      return;
    }
    setFormError("");
    adjust.mutate(parsed.data, { onSuccess: () => setOpenForm(null) });
  };

  const submitForceClose = (event) => {
    event.preventDefault();
    const outIso = toOffsetIso(checkOutAt);
    const parsed = forceCloseSchema.safeParse({ ...(outIso ? { checkOutAt: outIso } : {}), reason: reason.trim(), expectedVersion: version });
    if (!parsed.success) {
      setFormError(firstEmployeeFormError(parsed));
      return;
    }
    setFormError("");
    forceClose.mutate(parsed.data, { onSuccess: () => setOpenForm(null) });
  };

  const mutationError = checkOut.error?.message || adjust.error?.message || forceClose.error?.message;

  return (
    <div className="attendance-actions">
      <div className="attendance-actions__buttons">
        {canCheckOut && record.status === "OPEN" && (
          <Button variant="secondary" onClick={() => toggle("checkout")}>
            تسجيل انصراف
          </Button>
        )}
        {canAdjust && (
          <Button variant="secondary" onClick={() => toggle("adjust")}>
            تعديل
          </Button>
        )}
        {canForceClose && record.status === "OPEN" && (
          <Button variant="secondary" onClick={() => toggle("force")}>
            إغلاق جبري
          </Button>
        )}
      </div>

      {openForm === "checkout" && canCheckOut && (
        <form className="attendance-actions__form" onSubmit={submitCheckOut}>
          <Input label="ملاحظات" name="notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
          <Button type="submit" loading={checkOut.isPending}>
            تأكيد الانصراف
          </Button>
        </form>
      )}

      {openForm === "adjust" && canAdjust && (
        <form className="attendance-actions__form" onSubmit={submitAdjust}>
          <Select
            label="نوع التعديل"
            name="kind"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
            options={[
              { value: "CHECK_IN", label: "الحضور" },
              { value: "CHECK_OUT", label: "الانصراف" },
              { value: "BOTH", label: "الاثنان" },
            ]}
          />
          <Input label="الحضور الجديد" name="checkInAt" type="datetime-local" value={checkInAt || toLocalInput(record.checkInAt)} onChange={(event) => setCheckInAt(event.target.value)} />
          <Input label="الانصراف الجديد" name="checkOutAt" type="datetime-local" value={checkOutAt || toLocalInput(record.checkOutAt)} onChange={(event) => setCheckOutAt(event.target.value)} />
          <Input label="السبب" name="reason" required value={reason} onChange={(event) => setReason(event.target.value)} />
          <Button type="submit" loading={adjust.isPending}>
            حفظ التعديل
          </Button>
        </form>
      )}

      {openForm === "force" && canForceClose && (
        <form className="attendance-actions__form" onSubmit={submitForceClose}>
          <Input label="وقت الانصراف" name="forceCheckOutAt" type="datetime-local" value={checkOutAt} onChange={(event) => setCheckOutAt(event.target.value)} />
          <Input label="السبب" name="forceReason" required value={reason} onChange={(event) => setReason(event.target.value)} />
          <Button type="submit" loading={forceClose.isPending}>
            تأكيد الإغلاق الجبري
          </Button>
        </form>
      )}

      {(formError || (mutationError && !conflicted)) && (
        <small className="row-error" role="alert">
          {formError || mutationError}
        </small>
      )}
      <ConflictDialog open={conflicted} onClose={resetAll} onReload={resetAll} pending={false} />
    </div>
  );
}
