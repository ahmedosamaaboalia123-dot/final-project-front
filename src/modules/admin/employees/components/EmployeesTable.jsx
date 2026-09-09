import { Eye, Users } from "lucide-react";

export default function EmployeesTable({ employees, isLoading, onView }) {
  return <section className="employee-table-card">
    <div className="employee-card-title"><Users size={17}/><h2>قائمة الموظفين</h2><span>{employees.length}</span></div>
    <div className="employee-table-scroll"><table><thead><tr><th>الاسم</th><th>المنصب</th><th>بداية العمل</th><th>نهاية العمل</th><th>الحالة</th><th>الإجراء</th></tr></thead>
      <tbody>{employees.map((employee) => <tr key={employee.id}><td>{employee.name}</td><td>{employee.position}</td><td>{employee.workStart || "—"}</td><td>{employee.workEnd || "—"}</td><td><span className={`employee-status ${(employee.status || "SUSPENDED").toLowerCase()}`}>{employee.status === "ACTIVE" ? "نشط" : "موقوف"}</span></td><td><button className="employee-view" onClick={() => onView(employee.id)}><Eye size={15}/>عرض</button></td></tr>)}</tbody></table></div>
    {isLoading && <p className="employee-empty">جاري تحميل الموظفين...</p>}
    {!isLoading && !employees.length && <p className="employee-empty">لا يوجد موظفون</p>}
  </section>;
}
