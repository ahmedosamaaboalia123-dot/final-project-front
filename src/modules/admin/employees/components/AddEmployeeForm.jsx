import { useState } from "react";
import { Plus, Save } from "lucide-react";
import { useCreateEmployee } from "../hooks/useEmployees";

const emptyForm = { name: "", password: "", position: "", workStart: "08:00", workEnd: "16:00" };

export default function AddEmployeeForm() {
  const [form, setForm] = useState(emptyForm);
  const create = useCreateEmployee();
  const change = (name) => (event) => setForm((current) => ({ ...current, [name]: event.target.value }));

  return <form className="employee-form-card" onSubmit={(event) => {
    event.preventDefault();
    create.mutate({ ...form, role: "CASHIER" }, { onSuccess: () => setForm(emptyForm) });
  }}>
    <div className="employee-card-title"><Plus size={17}/><h2>إضافة موظف</h2></div>
    <div className="employee-form-grid">
      <label><span>اسم الموظف</span><input required value={form.name} onChange={change("name")}/></label>
      <label><span>كلمة المرور</span><input required minLength={6} type="text" autoComplete="new-password" value={form.password} onChange={change("password")}/></label>
      <label><span>اسم المنصب</span><input required value={form.position} onChange={change("position")}/></label>
      <label><span>بداية العمل</span><input required type="time" value={form.workStart} onChange={change("workStart")}/></label>
      <label><span>نهاية العمل</span><input required type="time" value={form.workEnd} onChange={change("workEnd")}/></label>
    </div>
    {create.isError && <p className="employee-alert error" role="alert">{create.error?.response?.data?.message || create.error.message}</p>}
    {create.isSuccess && <p className="employee-alert success">تم حفظ الموظف بنجاح</p>}
    <button className="employee-primary" disabled={create.isPending}><Save size={16}/>{create.isPending ? "جاري الحفظ..." : "حفظ الموظف"}</button>
  </form>;
}
