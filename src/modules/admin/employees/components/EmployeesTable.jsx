import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("ar-EG");
};

export default function EmployeesTable({ employees = [], roles = [], loading = false, isLoading = false, page = 1, onView }) {
  const navigate = useNavigate();
  const busy = Boolean(loading || isLoading);
  const rows = Array.isArray(employees) ? employees : [];

  const roleNameOf = (employee) => {
    if (employee?.roleName) return employee.roleName;
    const found = (Array.isArray(roles) ? roles : []).find((role) => String(role.id) === String(employee?.roleId));
    return found?.name || "—";
  };

  const open = (id) => {
    const sid = String(id);
    if (typeof onView === "function") onView(sid);
    else navigate(`/admin/employees/${sid}`);
  };

  return (
    <section className="employee-table-card" aria-label="قائمة الموظفين">
      <div className="employee-card-title">
        <h2>قائمة الموظفين</h2>
        <span>{rows.length}</span>
      </div>
      <div className="employee-table-scroll">
        <table>
          <thead>
            <tr>
              <th>الاسم</th>
              <th>المنصب</th>
              <th>الدور</th>
              <th>الحالة</th>
              <th>آخر دخول</th>
              <th>الإجراء</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((employee, index) => (
              <tr key={String(employee.id)}>
                <td>{employee.name || `موظف ${(page - 1) * 10 + index + 1}`}</td>
                <td>{employee.position || "—"}</td>
                <td>{roleNameOf(employee)}</td>
                <td>
                  <span className={`employee-status employee-status--${String(employee.status || "INACTIVE").toLowerCase()}`}>
                    {employee.statusLabel || (employee.status === "ACTIVE" ? "نشط" : "موقوف")}
                  </span>
                </td>
                <td>{formatDateTime(employee.lastLoginAt)}</td>
                <td>
                  <button type="button" className="employee-view" onClick={() => open(employee.id)}>
                    <Eye size={15} />
                    فتح
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {busy && <p className="employee-empty">جاري تحميل الموظفين...</p>}
      {!busy && rows.length === 0 && <p className="employee-empty">لا يوجد موظفون</p>}
    </section>
  );
}
