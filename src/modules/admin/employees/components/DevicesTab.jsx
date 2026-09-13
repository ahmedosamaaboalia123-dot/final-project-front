import { useState } from "react";
import { Laptop } from "lucide-react";
import Button from "@/shared/components/Button/Button";
import Select from "@/shared/components/Select/Select";
import { AsyncState, ConflictDialog, ServerPagination } from "@/shared/components";
import { isConflict } from "@/api/apiError";
import { useAuthStore } from "@/store/authStore";
import { can } from "@/modules/auth/permissions/permission";
import { useEmployeeDevices } from "../hooks/employee.queries";
import { useApproveDevice, useBlockDevice, useRevokeDevice } from "../hooks/employee.mutations";
import { deviceDecisionSchema, firstEmployeeFormError } from "../schemas/employee.schema";

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("ar-EG");
};

function DeviceRow({ device, canDecide }) {
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");
  const approve = useApproveDevice();
  const block = useBlockDevice();
  const revoke = useRevokeDevice();
  const pending = approve.isPending || block.isPending || revoke.isPending;
  const conflict = (approve.isError && isConflict(approve.error)) || (block.isError && isConflict(block.error)) || (revoke.isError && isConflict(revoke.error));

  const buildPayload = (reasonRequired = false) => {
    const trimmed = reason.trim();
    if (reasonRequired && trimmed.length < 3) {
      setFormError("اكتب سببًا من 3 أحرف على الأقل");
      return null;
    }
    const parsed = deviceDecisionSchema.safeParse({
      ...(trimmed ? { reason: trimmed } : {}),
      expectedVersion: Number(device.version ?? 0),
    });
    if (!parsed.success) {
      setFormError(firstEmployeeFormError(parsed));
      return null;
    }
    setFormError("");
    return parsed.data;
  };

  const runApprove = () => {
    const payload = buildPayload();
    if (!payload) return;
    approve.resetAttempt();
    block.resetAttempt();
    revoke.resetAttempt();
    approve.mutate({ deviceId: String(device.id), ...payload });
  };

  const runBlock = () => {
    const payload = buildPayload(true);
    if (!payload) return;
    approve.resetAttempt();
    block.resetAttempt();
    revoke.resetAttempt();
    block.mutate({ deviceId: String(device.id), ...payload });
  };

  const runRevoke = () => {
    const payload = buildPayload(true);
    if (!payload) return;
    approve.resetAttempt();
    block.resetAttempt();
    revoke.resetAttempt();
    revoke.mutate({ deviceId: String(device.id), ...payload });
  };

  const clearConflict = () => {
    approve.resetAttempt();
    block.resetAttempt();
    revoke.resetAttempt();
  };

  return (
    <tr>
      <td>{device.name || "جهاز غير مسمى"}</td>
      <td dir="ltr">{String(device.employeeId || "—").slice(-6) || "—"}</td>
      <td>{device.browser || "—"}</td>
      <td>{device.os || "—"}</td>
      <td>
        <span className={`device-status device-status--${String(device.status || "PENDING").toLowerCase()}`}>{device.statusLabel || device.status}</span>
      </td>
      <td>{device.attemptCount ?? 0}</td>
      <td>{formatDateTime(device.lastSeenAt || device.lastLoginAt || device.firstSeenAt)}</td>
      <td>
        {canDecide ? (
          <div className="device-actions">
            <input
              aria-label="سبب قرار الجهاز"
              placeholder="السبب (اختياري، 3 أحرف على الأقل)"
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setFormError("");
              }}
              disabled={pending}
            />
            {device.status !== "APPROVED" && <Button variant="primary" disabled={pending} onClick={runApprove} loading={approve.isPending}>اعتماد</Button>}
            {device.status === "APPROVED" && <Button variant="secondary" disabled={pending} onClick={runRevoke} loading={revoke.isPending}>إلغاء الاعتماد</Button>}
            {device.status !== "BLOCKED" && <Button variant="secondary" disabled={pending} onClick={runBlock} loading={block.isPending}>حظر</Button>}
          </div>
        ) : (
          <span>—</span>
        )}
        {(formError || approve.isError || block.isError || revoke.isError) && !conflict && (
          <small className="row-error" role="alert">
            {formError || approve.error?.message || block.error?.message || revoke.error?.message}
          </small>
        )}
        <ConflictDialog open={conflict} onClose={clearConflict} onReload={clearConflict} pending={false} />
      </td>
    </tr>
  );
}

export default function DevicesTab() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const permissions = useAuthStore((state) => state.permissions);
  const canDecide = can(permissions, "employees.devices.decide");
  const query = useEmployeeDevices({ page, limit: 10, ...(status ? { status } : {}) });
  const items = query.data?.items || [];

  return (
    <section className="employee-table-card" aria-label="أجهزة الموظفين">
      <div className="employee-card-title">
        <Laptop size={17} />
        <h2>الأجهزة</h2>
      </div>
      <div className="employee-filters">
        <Select
          label="حالة الجهاز"
          name="deviceStatus"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          options={[
            { value: "PENDING", label: "بانتظار الاعتماد" },
            { value: "APPROVED", label: "معتمد" },
            { value: "BLOCKED", label: "محظور" },
          ]}
          placeholder="كل الحالات"
        />
        <Button variant="secondary" disabled={query.isFetching} onClick={() => query.refetch()}>
          تحديث
        </Button>
      </div>
      <AsyncState loading={query.isLoading} error={query.error} onRetry={query.refetch} empty={!query.isLoading && items.length === 0} emptyText="لا توجد أجهزة">
        <div className="employee-table-scroll">
          <table>
            <thead>
              <tr>
                <th>الجهاز</th>
                <th>الموظف</th>
                <th>المتصفح</th>
                <th>النظام</th>
                <th>الحالة</th>
                <th>المحاولات</th>
                <th>آخر ظهور</th>
                <th>القرار</th>
              </tr>
            </thead>
            <tbody>
              {items.map((device) => (
                <DeviceRow key={String(device.id)} device={device} canDecide={canDecide} />
              ))}
            </tbody>
          </table>
        </div>
      </AsyncState>
      <ServerPagination meta={query.data?.pageMeta} onPageChange={setPage} disabled={query.isFetching} label="جهاز" />
    </section>
  );
}
