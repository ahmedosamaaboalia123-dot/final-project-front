import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, KeyRound, Laptop, ShieldCheck } from "lucide-react";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import Button from "@/shared/components/Button/Button";
import Input from "@/shared/components/Input/Input";
import Select from "@/shared/components/Select/Select";
import { AsyncState, ConfirmAction, ConflictDialog } from "@/shared/components";
import { isConflict } from "@/api/apiError";
import { useAuthStore } from "@/store/authStore";
import { can } from "@/modules/auth/permissions/permission";
import { useEmployeeDetails, usePermissionsCatalog, useRoles } from "../hooks/employee.queries";
import { useApproveDevice, useBlockDevice, useReplacePermissionMatrix, useUpdateEmployee } from "../hooks/employee.mutations";
import { toRoleOptions } from "../adapters/employee.adapter";
import {
  deviceDecisionSchema,
  firstEmployeeFormError,
  permissionMatrixSchema,
  updateEmployeeSchema,
} from "../schemas/employee.schema";
import AttendanceActions from "../components/AttendanceActions";
import "./EmployeeDetailsPage.css";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("ar-EG");
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("ar-EG");
};

const asItems = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

function EmployeeDeviceRow({ device, canDecide }) {
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");
  const approve = useApproveDevice();
  const block = useBlockDevice();
  const pending = approve.isPending || block.isPending;
  const conflicted = (approve.isError && isConflict(approve.error)) || (block.isError && isConflict(block.error));
  const reset = () => {
    approve.resetAttempt();
    block.resetAttempt();
  };

  const payload = () => {
    const trimmed = reason.trim();
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

  const run = (mutation) => {
    const body = payload();
    if (!body) return;
    reset();
    mutation.mutate({ deviceId: String(device.id), ...body });
  };

  return (
    <tr>
      <td>{device.name || "جهاز غير مسمى"}</td>
      <td>{device.browser || "—"}</td>
      <td>{device.os || "—"}</td>
      <td>
        <span className={`device-status device-status--${String(device.status || "PENDING").toLowerCase()}`}>{device.statusLabel || device.status}</span>
      </td>
      <td>{formatDateTime(device.lastSeenAt || device.lastLoginAt || device.firstSeenAt)}</td>
      <td>
        {canDecide ? (
          <div className="device-actions">
            <input aria-label="سبب قرار الجهاز" placeholder="السبب (اختياري)" value={reason} disabled={pending} onChange={(event) => { setReason(event.target.value); setFormError(""); }} />
            <Button variant="secondary" disabled={pending} loading={approve.isPending} onClick={() => run(approve)}>
              اعتماد
            </Button>
            <Button variant="secondary" disabled={pending} loading={block.isPending} onClick={() => run(block)}>
              حظر
            </Button>
          </div>
        ) : (
          <span>—</span>
        )}
        {(formError || approve.isError || block.isError) && !conflicted && (
          <small className="row-error" role="alert">
            {formError || approve.error?.message || block.error?.message}
          </small>
        )}
        <ConflictDialog open={conflicted} onClose={reset} onReload={reset} pending={false} />
      </td>
    </tr>
  );
}

function BasicInfoSection({ employee, roles, canUpdate, onSaved }) {
  const [form, setForm] = useState({ name: "", position: "", roleId: "", status: "ACTIVE", passwordPlainText: "", workStart: "08:00", workEnd: "16:00", crossesMidnight: false, graceMinutes: "0" });
  const [formError, setFormError] = useState("");
  const mutation = useUpdateEmployee(String(employee.id), { onSuccess: () => { setForm((current) => ({ ...current, passwordPlainText: "" })); setFormError(""); onSaved?.(); } });
  const conflicted = mutation.isError && isConflict(mutation.error);

  useEffect(() => {
    setForm({
      name: employee.name || "",
      position: employee.position || "",
      roleId: employee.roleId ? String(employee.roleId) : "",
      status: employee.status || "ACTIVE",
      passwordPlainText: "",
      workStart: employee.schedule?.workStart || "08:00",
      workEnd: employee.schedule?.workEnd || "16:00",
      crossesMidnight: Boolean(employee.schedule?.crossesMidnight),
      graceMinutes: String(employee.schedule?.graceMinutes ?? 0),
    });
  }, [employee]);

  if (!canUpdate) {
    return (
      <section className="employee-detail-card" aria-label="البيانات الأساسية">
        <h2>البيانات الأساسية</h2>
        <dl className="employee-readonly">
          <div><dt>الاسم</dt><dd>{employee.name || "—"}</dd></div>
          <div><dt>المنصب</dt><dd>{employee.position || "—"}</dd></div>
          <div><dt>الحالة</dt><dd>{employee.statusLabel || employee.status}</dd></div>
          <div><dt>الوردية</dt><dd>{employee.schedule ? `${employee.schedule.workStart || "—"} – ${employee.schedule.workEnd || "—"}` : "—"}</dd></div>
        </dl>
      </section>
    );
  }

  const set = (name, value) => {
    mutation.resetAttempt();
    setFormError("");
    setForm((current) => ({ ...current, [name]: value }));
  };

  const save = (deactivationReason) => {
    const parsed = updateEmployeeSchema.safeParse({
      name: form.name,
      position: form.position,
      roleId: form.roleId || undefined,
      status: form.status,
      ...(form.passwordPlainText ? { passwordPlainText: form.passwordPlainText } : {}),
      schedule: {
        workStart: form.workStart,
        workEnd: form.workEnd,
        crossesMidnight: Boolean(form.crossesMidnight),
        timezone: "Africa/Cairo",
        graceMinutes: Number(form.graceMinutes),
      },
      ...(deactivationReason ? { reason: deactivationReason } : {}),
      expectedVersion: Number(employee.version ?? 0),
    });
    if (!parsed.success) {
      setFormError(firstEmployeeFormError(parsed));
      return Promise.reject(new Error(firstEmployeeFormError(parsed)));
    }
    setFormError("");
    return mutation.mutateAsync(parsed.data);
  };

  const deactivating = form.status === "INACTIVE";

  return (
    <section className="employee-detail-card" aria-label="البيانات الأساسية">
      <h2>البيانات الأساسية</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!deactivating) save().catch(() => {});
        }}
      >
        <div className="employee-detail-grid">
          <Input label="الاسم" name="name" required value={form.name} onChange={(event) => set("name", event.target.value)} />
          <Input label="المنصب" name="position" required value={form.position} onChange={(event) => set("position", event.target.value)} />
          <Input label="كلمة مرور جديدة" name="passwordPlainText" type="password" autoComplete="new-password" placeholder="اتركها فارغة بدون تغيير" value={form.passwordPlainText} onChange={(event) => set("passwordPlainText", event.target.value)} />
          <Select label="الدور" name="roleId" value={form.roleId} onChange={(event) => set("roleId", event.target.value)} options={toRoleOptions(roles)} placeholder="بدون تغيير" />
          <Select
            label="الحالة"
            name="status"
            value={form.status}
            onChange={(event) => set("status", event.target.value)}
            options={[
              { value: "ACTIVE", label: "نشط" },
              { value: "INACTIVE", label: "موقوف" },
            ]}
          />
          <Input label="بداية العمل (HH:MM)" name="workStart" type="time" required value={form.workStart} onChange={(event) => set("workStart", event.target.value)} />
          <Input label="نهاية العمل (HH:MM)" name="workEnd" type="time" required value={form.workEnd} onChange={(event) => set("workEnd", event.target.value)} />
          <Input label="مهلة التأخير (دقيقة)" name="graceMinutes" type="number" min="0" max="180" value={form.graceMinutes} onChange={(event) => set("graceMinutes", event.target.value)} />
        </div>
        <label className="employee-check">
          <input type="checkbox" checked={form.crossesMidnight} onChange={(event) => set("crossesMidnight", event.target.checked)} />
          <span>الوردية تتجاوز منتصف الليل</span>
        </label>
        {(formError || mutation.isError) && !conflicted && (
          <p className="employee-alert error" role="alert">
            {formError || mutation.error?.message}
          </p>
        )}
        {mutation.isSuccess && <p className="employee-alert success">تم حفظ بيانات الموظف</p>}
        {deactivating ? (
          <ConfirmAction danger requireReason pending={mutation.isPending} title="إيقاف الموظف" message="سيتم إيقاف الموظف. اكتب سببًا من 3 أحرف على الأقل." confirmLabel="إيقاف الموظف" onConfirm={(reason) => save(reason)}>
            إيقاف وحفظ
          </ConfirmAction>
        ) : (
          <Button type="submit" loading={mutation.isPending}>
            حفظ البيانات
          </Button>
        )}
      </form>
      <ConflictDialog open={conflicted} onClose={() => mutation.resetAttempt()} onReload={() => { mutation.resetAttempt(); onSaved?.(); }} pending={false} />
    </section>
  );
}

function PermissionMatrixSection({ employeeId, employee, roles, canManage, onSaved }) {
  const permissions = useAuthStore((state) => state.permissions);
  const catalog = usePermissionsCatalog();
  const [roleId, setRoleId] = useState("");
  const [allowed, setAllowed] = useState([]);
  const [pagesVisible, setPagesVisible] = useState({});
  const [formError, setFormError] = useState("");
  const mutation = useReplacePermissionMatrix(String(employeeId), { onSuccess: () => { setFormError(""); onSaved?.(); } });
  const conflicted = mutation.isError && isConflict(mutation.error);
  void permissions;

  const stored = employee?.matrix ?? employee?.permissionsMatrix ?? null;

  useEffect(() => {
    const matrix = stored || {};
    const initialRole = matrix.roleId ? String(matrix.roleId) : "";
    const rawPermissions = Array.isArray(matrix.permissions) ? matrix.permissions : [];
    const initialAllowed = rawPermissions
      .filter((entry) => (typeof entry === "string" ? true : entry?.effect === "ALLOW"))
      .map((entry) => (typeof entry === "string" ? entry : String(entry.permissionKey)));
    const rawPages = Array.isArray(matrix.pages) ? matrix.pages : [];
    const initialPages = {};
    for (const page of rawPages) {
      if (page?.pageKey) initialPages[String(page.pageKey)] = page.visible !== false;
    }
    setRoleId(initialRole);
    setAllowed(initialAllowed);
    setPagesVisible(initialPages);
  }, [stored]);

  const groups = useMemo(() => catalog.data?.byPage || [], [catalog.data]);

  if (!canManage) return null;

  const toggleKey = (key) => {
    mutation.resetAttempt();
    setFormError("");
    setAllowed((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  };

  const togglePage = (pageKey) => {
    mutation.resetAttempt();
    setPagesVisible((current) => ({ ...current, [pageKey]: (current[pageKey] ?? true) === false }));
  };

  const submit = (event) => {
    event.preventDefault();
    const parsed = permissionMatrixSchema.safeParse({
      roleId,
      permissions: allowed.map((permissionKey) => ({ permissionKey, effect: "ALLOW" })),
      pages: groups.map((group) => ({ pageKey: group.pageKey, visible: pagesVisible[group.pageKey] ?? true })),
      expectedPermissionsVersion: Math.max(1, Number(employee?.permissionsVersion ?? 0)),
    });
    if (!parsed.success) {
      setFormError(firstEmployeeFormError(parsed));
      return;
    }
    setFormError("");
    mutation.mutate(parsed.data);
  };

  return (
    <section className="employee-detail-card" aria-label="مصفوفة الصلاحيات">
      <h2>
        <ShieldCheck size={17} />
        مصفوفة الصلاحيات
      </h2>
      <form onSubmit={submit}>
        <Select label="الدور" name="matrixRoleId" required value={roleId} onChange={(event) => setRoleId(event.target.value)} options={toRoleOptions(roles)} placeholder="اختر الدور" />
        {catalog.isLoading && <p className="employee-empty">جاري تحميل الصلاحيات...</p>}
        {catalog.isError && <p className="employee-alert error" role="alert">{catalog.error?.message || "تعذر تحميل الصلاحيات"}</p>}
        {groups.map((group) => (
          <fieldset key={group.pageKey} className="matrix-group">
            <legend>
              <label className="matrix-page-toggle">
                <input type="checkbox" checked={pagesVisible[group.pageKey] ?? true} onChange={() => togglePage(group.pageKey)} />
                <span>{group.pageKey} — {pagesVisible[group.pageKey] ?? true ? "ظاهر" : "مخفي"}</span>
              </label>
            </legend>
            {(group.items || []).map((permission) => (
              <label key={permission.id || permission.key} className="matrix-item">
                <input type="checkbox" checked={allowed.includes(permission.key)} onChange={() => toggleKey(permission.key)} />
                <span>{permission.key} — سماح</span>
              </label>
            ))}
          </fieldset>
        ))}
        {(formError || mutation.isError) && !conflicted && (
          <p className="employee-alert error" role="alert">
            {formError || mutation.error?.message}
          </p>
        )}
        {mutation.isSuccess && <p className="employee-alert success">تم حفظ مصفوفة الصلاحيات</p>}
        <Button type="submit" loading={mutation.isPending}>
          حفظ المصفوفة
        </Button>
      </form>
      <ConflictDialog open={conflicted} onClose={() => mutation.resetAttempt()} onReload={() => { mutation.resetAttempt(); onSaved?.(); }} pending={false} />
    </section>
  );
}

export default function EmployeeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const permissions = useAuthStore((state) => state.permissions);
  const canViewPassword = can(permissions, "employees.password.view");
  const canUpdate = can(permissions, "employees.update");
  const canDecide = can(permissions, "employees.devices.decide");
  const canManageMatrix = can(permissions, "employees.permissions.manage");

  const include = useMemo(
    () => (canViewPassword ? ["password", "devices", "attendance", "permissions"] : ["devices", "attendance", "permissions"]),
    [canViewPassword],
  );
  const details = useEmployeeDetails(id, include);
  const rolesQuery = useRoles();
  const roles = rolesQuery.data?.roles || [];

  const refetchAll = async () => {
    await details.refetch();
  };

  if (details.isLoading) return <p className="employee-details-state">جاري تحميل الموظف...</p>;
  const employee = details.data?.employee;
  if (details.isError || !employee) {
    return (
      <div className="employee-details-page" dir="rtl">
        <PageHeader title="الموظف" breadcrumbs={["الموظفون", "التفاصيل"]} />
        <div className="employee-details-shell">
          <button type="button" className="employee-back" onClick={() => navigate("/admin/employees")}>
            <ArrowRight size={16} />
            رجوع
          </button>
          <AsyncState loading={false} error={details.error} onRetry={details.refetch} empty={!details.error} emptyText="الموظف غير موجود">
            <span />
          </AsyncState>
        </div>
      </div>
    );
  }

  const devices = asItems(details.data?.devices);
  const attendance = asItems(details.data?.attendance);
  const passwordPlainText = details.data?.passwordPlainText ?? null;

  return (
    <div className="employee-details-page" dir="rtl">
      <PageHeader title={`الموظف: ${employee.name || "—"}`} breadcrumbs={["الموظفون", employee.name || "التفاصيل"]} />
      <div className="employee-details-shell">
        <button type="button" className="employee-back" onClick={() => navigate("/admin/employees")}>
          <ArrowRight size={16} />
          رجوع
        </button>

        <BasicInfoSection employee={employee} roles={roles} canUpdate={canUpdate} onSaved={refetchAll} />

        {passwordPlainText && (
          <section className="employee-detail-card" aria-label="كلمة المرور">
            <h2>
              <KeyRound size={17} />
              كلمة المرور
            </h2>
            <p className="password-reveal" dir="ltr">{passwordPlainText}</p>
          </section>
        )}

        <section className="employee-detail-card" aria-label="أجهزة الموظف">
          <h2>
            <Laptop size={17} />
            أجهزة الموظف
          </h2>
          <div className="employee-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>الجهاز</th>
                  <th>المتصفح</th>
                  <th>النظام</th>
                  <th>الحالة</th>
                  <th>آخر ظهور</th>
                  <th>القرار</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <EmployeeDeviceRow key={String(device.id)} device={device} canDecide={canDecide} />
                ))}
              </tbody>
            </table>
          </div>
          {devices.length === 0 && <p className="employee-empty">لم يسجل أي جهاز بعد</p>}
        </section>

        <PermissionMatrixSection employeeId={String(employee.id)} employee={{ ...employee, matrix: details.data?.permissions }} roles={roles} canManage={canManageMatrix} onSaved={refetchAll} />

        <section className="employee-detail-card" aria-label="الحضور الأخير">
          <h2>الحضور الأخير</h2>
          <div className="employee-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>الحضور</th>
                  <th>الانصراف</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {attendance.slice(0, 10).map((record) => (
                  <tr key={String(record.id || record.attendanceDate)}>
                    <td>{formatDate(record.attendanceDate)}</td>
                    <td>{formatDateTime(record.checkInAt)}</td>
                    <td>{formatDateTime(record.checkOutAt)}</td>
                    <td>{record.statusLabel || record.status || "—"}</td>
                    <td>{record.id ? <AttendanceActions record={record} /> : <span>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {attendance.length === 0 && <p className="employee-empty">لا يوجد حضور مسجل</p>}
          <Button variant="secondary" onClick={() => navigate("/admin/employees?tab=attendance")}>
            فتح سجل الحضور الكامل
          </Button>
        </section>
      </div>
    </div>
  );
}
