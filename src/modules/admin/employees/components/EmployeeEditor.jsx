import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { useUpdateEmployee } from "../hooks/useEmployeeDetails";

export default function EmployeeEditor({ employee, onMessage }) {
  const [form, setForm] = useState({ name: "", position: "", workStart: "", workEnd: "", password: "" });
  useEffect(() => setForm({ name: employee.name, position: employee.position, workStart: employee.workStart || "", workEnd: employee.workEnd || "", password: "" }), [employee]);
  const update = useUpdateEmployee(employee.id, { onSuccess: () => onMessage("تم حفظ بيانات الموظف") });
  const change = (name) => (event) => setForm((current) => ({ ...current, [name]: event.target.value }));

  return <form className="employee-detail-card" onSubmit={(event) => { event.preventDefault(); update.mutate(form); }}>
    <h2>البيانات الأساسية</h2><div className="employee-detail-grid">
      <label><span>الاسم</span><input value={form.name} onChange={change("name")}/></label>
      <label><span>كلمة مرور جديدة</span><input type="text" autoComplete="new-password" placeholder="اتركها فارغة بدون تغيير" value={form.password} onChange={change("password")}/></label>
      <label><span>اسم المنصب</span><input value={form.position} onChange={change("position")}/></label>
      <label><span>بداية العمل</span><input type="time" value={form.workStart} onChange={change("workStart")}/></label>
      <label><span>نهاية العمل</span><input type="time" value={form.workEnd} onChange={change("workEnd")}/></label>
    </div>
    {update.isError && <p className="employee-alert error" role="alert">{update.error?.response?.data?.message || update.error.message}</p>}
    <button className="employee-primary" disabled={update.isPending}><Save size={16}/>حفظ البيانات</button>
  </form>;
}
