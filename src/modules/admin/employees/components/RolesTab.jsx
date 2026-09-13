import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import Button from "@/shared/components/Button/Button";
import Input from "@/shared/components/Input/Input";
import { AsyncState, ConflictDialog } from "@/shared/components";
import { isConflict } from "@/api/apiError";
import { useAuthStore } from "@/store/authStore";
import { can } from "@/modules/auth/permissions/permission";
import { usePermissionsCatalog, useRoles } from "../hooks/employee.queries";
import { useCreateRole, useReplaceRolePermissions, useUpdateRole } from "../hooks/employee.mutations";
import { createRoleSchema, firstEmployeeFormError, rolePermissionsSchema, updateRoleSchema } from "../schemas/employee.schema";

function CatalogCheckboxes({ selected, onToggle, disabled = false }) {
  const catalog = usePermissionsCatalog();
  const groups = catalog.data?.byPage || [];
  if (catalog.isLoading) return <p className="employee-empty">جاري تحميل الصلاحيات...</p>;
  if (catalog.isError) return <p className="employee-alert error" role="alert">{catalog.error?.message || "تعذر تحميل الصلاحيات"}</p>;
  if (groups.length === 0) return <p className="employee-empty">لا توجد صلاحيات</p>;
  return (
    <div className="role-catalog">
      {groups.map((group) => (
        <fieldset key={group.pageKey} className="role-catalog__group">
          <legend>{group.pageKey}</legend>
          {(group.items || []).map((permission) => (
            <label key={permission.id || permission.key} className="role-catalog__item">
              <input
                type="checkbox"
                checked={selected.includes(permission.key)}
                disabled={disabled}
                onChange={() => onToggle(permission.key)}
              />
              <span>{permission.key}</span>
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  );
}

function CreateRoleForm({ canManage, onCreated }) {
  const [form, setForm] = useState({ name: "", level: "1", description: "" });
  const [keys, setKeys] = useState([]);
  const [formError, setFormError] = useState("");
  const mutation = useCreateRole({
    onSuccess: () => {
      setForm({ name: "", level: "1", description: "" });
      setKeys([]);
      setFormError("");
      onCreated?.();
    },
  });

  if (!canManage) return null;

  const toggle = (key) => {
    mutation.resetAttempt();
    setFormError("");
    setKeys((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  };

  const submit = (event) => {
    event.preventDefault();
    const parsed = createRoleSchema.safeParse({
      name: form.name,
      level: Number(form.level),
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
      permissionKeys: keys,
    });
    if (!parsed.success) {
      setFormError(firstEmployeeFormError(parsed));
      return;
    }
    mutation.mutate(parsed.data);
  };

  return (
    <form className="employee-form-card" onSubmit={submit} aria-label="إنشاء دور">
      <div className="employee-card-title">
        <h2>إنشاء دور جديد</h2>
      </div>
      <div className="employee-form-grid">
        <Input label="اسم الدور" name="name" required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
        <Input label="المستوى" name="level" type="number" min="0" max="1000" required value={form.level} onChange={(event) => setForm((current) => ({ ...current, level: event.target.value }))} />
        <Input label="الوصف" name="description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
      </div>
      <CatalogCheckboxes selected={keys} onToggle={toggle} disabled={mutation.isPending} />
      {(formError || mutation.isError) && (
        <p className="employee-alert error" role="alert">
          {formError || mutation.error?.message}
        </p>
      )}
      <Button type="submit" loading={mutation.isPending}>
        إنشاء الدور
      </Button>
    </form>
  );
}

function RoleCard({ role, canManage }) {
  const [form, setForm] = useState({ name: role.name || "", level: String(role.level ?? 0), description: role.description || "" });
  const [keys, setKeys] = useState(() => (Array.isArray(role.permissions) ? [...role.permissions] : []));
  const [formError, setFormError] = useState("");
  const update = useUpdateRole(String(role.id));
  const replacePermissions = useReplaceRolePermissions(String(role.id));
  const conflicted = (update.isError && isConflict(update.error)) || (replacePermissions.isError && isConflict(replacePermissions.error));
  const resetConflicts = () => {
    update.resetAttempt();
    replacePermissions.resetAttempt();
  };

  const roleVersion = useMemo(() => Number(role.version ?? 0), [role.version]);

  const toggle = (key) => {
    replacePermissions.resetAttempt();
    setFormError("");
    setKeys((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  };

  const submitEdit = (event) => {
    event.preventDefault();
    const parsed = updateRoleSchema.safeParse({
      ...(role.isSystem ? {} : { name: form.name }),
      level: Number(form.level),
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
      expectedVersion: roleVersion,
    });
    if (!parsed.success) {
      setFormError(firstEmployeeFormError(parsed));
      return;
    }
    setFormError("");
    update.mutate(parsed.data);
  };

  const submitPermissions = (event) => {
    event.preventDefault();
    const parsed = rolePermissionsSchema.safeParse({ permissionKeys: keys, expectedVersion: roleVersion });
    if (!parsed.success) {
      setFormError(firstEmployeeFormError(parsed));
      return;
    }
    setFormError("");
    replacePermissions.mutate(parsed.data);
  };

  return (
    <article className="employee-detail-card" aria-label={`الدور ${role.name}`}>
      <h2>
        <ShieldCheck size={17} />
        {role.name} (مستوى {role.level})
        {role.isSystem && <small className="employee-hint">دور نظام — الاسم مقفل</small>}
      </h2>
      {canManage ? (
        <>
          <form className="role-edit-grid" onSubmit={submitEdit}>
            <Input
              label="اسم الدور"
              name={`role-name-${role.id}`}
              value={form.name}
              disabled={Boolean(role.isSystem) || update.isPending}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
            <Input label="المستوى" name={`role-level-${role.id}`} type="number" min="0" max="1000" value={form.level} onChange={(event) => setForm((current) => ({ ...current, level: event.target.value }))} />
            <Input label="الوصف" name={`role-description-${role.id}`} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            <Button type="submit" loading={update.isPending}>
              حفظ الدور
            </Button>
          </form>
          <form onSubmit={submitPermissions} aria-label={`صلاحيات الدور ${role.name}`}>
            <CatalogCheckboxes selected={keys} onToggle={toggle} disabled={replacePermissions.isPending} />
            <Button type="submit" loading={replacePermissions.isPending}>
              استبدال صلاحيات الدور
            </Button>
          </form>
        </>
      ) : (
        <p className="employee-hint">صلاحيات الدور: {(role.permissions || []).join("، ") || "—"}</p>
      )}
      {(formError || update.isError || replacePermissions.isError) && !conflicted && (
        <p className="employee-alert error" role="alert">
          {formError || update.error?.message || replacePermissions.error?.message}
        </p>
      )}
      {(update.isSuccess || replacePermissions.isSuccess) && <p className="employee-alert success">تم حفظ الدور بنجاح</p>}
      <ConflictDialog open={conflicted} onClose={resetConflicts} onReload={resetConflicts} pending={false} />
    </article>
  );
}

export default function RolesTab() {
  const permissions = useAuthStore((state) => state.permissions);
  const canManage = can(permissions, "employees.permissions.manage");
  const query = useRoles();
  const roles = query.data?.roles || [];

  return (
    <div className="roles-tab">
      <CreateRoleForm canManage={canManage} onCreated={() => query.refetch()} />
      <AsyncState loading={query.isLoading} error={query.error} onRetry={query.refetch} empty={!query.isLoading && roles.length === 0} emptyText="لا توجد أدوار">
        <div className="roles-list">
          {roles.map((role) => (
            <RoleCard key={String(role.id)} role={role} canManage={canManage} />
          ))}
        </div>
      </AsyncState>
    </div>
  );
}
