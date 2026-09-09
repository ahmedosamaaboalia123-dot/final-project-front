import { useEffect, useState } from "react";
import { Save, ShieldCheck } from "lucide-react";
import { useSaveEmployeeAccess } from "../hooks/useEmployeeDetails";

export const EMPLOYEE_PAGES = [
  ["suppliers","الموردون"],["inventory","المخزون"],["warnings","التحذيرات"],["purchases","المشتريات"],
  ["returns","المرتجعات"],["products","المنتجات"],["orders_online","طلبات الأونلاين"],["orders_tables","الطاولات"],
  ["orders_table_services","خدمات الطاولات"],["orders_history","سجل الطلبات"],["orders_preparation","التحضير"],
  ["customers","العملاء"],["delegates","المندوبون"],["drawer","الدرج"],["employees","الموظفون"],
];

export default function EmployeePageAccess({ employeeId, pageAccess, onMessage }) {
  const [access, setAccess] = useState({});
  useEffect(() => { const saved = new Map(pageAccess.map((page) => [page.pageKey, page.visible])); setAccess(Object.fromEntries(EMPLOYEE_PAGES.map(([key]) => [key, saved.get(key) ?? true]))); }, [pageAccess]);
  const save = useSaveEmployeeAccess(employeeId, { onSuccess: () => onMessage("تم حفظ صلاحيات ظهور الصفحات") });
  return <section className="employee-detail-card"><h2><ShieldCheck size={17}/>صلاحيات ظهور الصفحات</h2>
    <div className="page-access-grid">{EMPLOYEE_PAGES.map(([key, label]) => <label className="page-access-item" key={key}><span>{label}</span><input type="checkbox" checked={access[key] ?? true} onChange={(event) => setAccess((current) => ({ ...current, [key]: event.target.checked }))}/><b>{access[key] !== false ? "يظهر" : "مخفي"}</b></label>)}</div>
    {save.isError && <p className="employee-alert error" role="alert">{save.error?.response?.data?.message || save.error.message}</p>}
    <button className="employee-primary" onClick={() => save.mutate(EMPLOYEE_PAGES.map(([pageKey]) => ({ pageKey, visible: access[pageKey] })))} disabled={save.isPending}><Save size={16}/>حفظ الصلاحيات</button>
  </section>;
}
