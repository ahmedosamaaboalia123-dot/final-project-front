import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PackageCheck, PlusCircle, XCircle } from "lucide-react";
import Input from "@/shared/components/Input/Input";
import Select from "@/shared/components/Select/Select";
import Button from "@/shared/components/Button/Button";
import { getSupplierOptions } from "@/modules/admin/suppliers/services/suppliersService";
import { useUnitsQuery } from "../hooks/inventory.queries";
import { useCreateMaterial } from "../hooks/inventory.mutations";
import { firstInventoryFormError, materialFormSchema } from "../schemas/inventory.schema";
import "./AddMaterialForm.css";

const emptyForm = { name: "", supplierId: "", largeUnitId: "", smallUnitId: "", conversionFactor: "", smallQuantityStep: "1", referenceLargeUnitPrice: "", minStockSmall: "", expiryAlertDays: "" };
export default function AddMaterialForm() {
  const [form, setForm] = useState(emptyForm); const [validationError, setValidationError] = useState("");
  const mutation = useCreateMaterial({ onSuccess: () => { setForm(emptyForm); setValidationError(""); } });
  const suppliersQuery = useQuery({ queryKey: ["suppliers", "options"], queryFn: getSupplierOptions, staleTime: 5 * 60 * 1000 });
  const unitsQuery = useUnitsQuery();
  const supplierOptions = (suppliersQuery.data?.data || []).map((item) => ({ value: String(item.id), label: item.name }));
  const unitOptions = (unitsQuery.data || []).map((item) => ({ value: item.value, label: item.label }));
  const change = (event) => {
    mutation.resetAttempt();
    setValidationError("");
    const { name, value } = event.target;
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "largeUnitId" || name === "smallUnitId") {
        const large = (unitsQuery.data || []).find((unit) => String(unit.value) === String(next.largeUnitId));
        const small = (unitsQuery.data || []).find((unit) => String(unit.value) === String(next.smallUnitId));
        const largeFactor = Number(large?.physicalFactor);
        const smallFactor = Number(small?.physicalFactor);
        if (largeFactor > 0 && smallFactor > 0) next.conversionFactor = String(largeFactor / smallFactor);
      }
      return next;
    });
  };
  const submit = (event) => {
    event.preventDefault();
    const parsed = materialFormSchema.safeParse({
      ...form, referenceLargeUnitPrice: form.referenceLargeUnitPrice || undefined,
      expiryAlertDays: form.expiryAlertDays === "" ? undefined : Number(form.expiryAlertDays),
    });
    if (!parsed.success) { setValidationError(firstInventoryFormError(parsed)); return; }
    mutation.mutate(parsed.data);
  };
  return <form className="material-form" onSubmit={submit}><div className="form-card-title"><PlusCircle size={20} className="title-icon" /><span>إضافة مادة خام</span></div>
    <div className="form-row form-row--4">
      <Input label="اسم المادة" name="name" value={form.name} onChange={change} required />
      <Select label="المورد" name="supplierId" value={form.supplierId} onChange={change} options={supplierOptions} placeholder={suppliersQuery.isLoading ? "جاري تحميل الموردين" : "اختر المورد"} required />
      <Select label="الوحدة الكبيرة" name="largeUnitId" value={form.largeUnitId} onChange={change} options={unitOptions} placeholder="اختر الوحدة" required />
      <Select label="الوحدة الصغيرة" name="smallUnitId" value={form.smallUnitId} onChange={change} options={unitOptions} placeholder="اختر الوحدة" required />
    </div>
    <div className="form-row form-row--4">
      <Input label="معامل التحويل (تلقائي)" name="conversionFactor" type="number" min="0.000001" step="any" value={form.conversionFactor} onChange={change} readOnly required />
      <Input label="خطوة الكمية الصغيرة" name="smallQuantityStep" type="number" min="0.000001" step="any" value={form.smallQuantityStep} onChange={change} required />
      <Input label="السعر المرجعي للكبيرة" name="referenceLargeUnitPrice" type="number" min="0" step="any" value={form.referenceLargeUnitPrice} onChange={change} />
      <Input label="حد التنبيه (صغيرة)" name="minStockSmall" type="number" min="0" step="any" value={form.minStockSmall} onChange={change} required />
    </div>
    <div className="form-row form-row--4"><Input label="التنبيه قبل الصلاحية (أيام)" name="expiryAlertDays" type="number" min="0" value={form.expiryAlertDays} onChange={change} /></div>
    {supplierOptions.length === 0 && !suppliersQuery.isLoading && <p className="form-api-error">لا يوجد موردون، أضف موردًا أولًا.</p>}
    {(validationError || mutation.isError) && <p className="form-api-error" role="alert">{validationError || mutation.error?.message || "تعذر حفظ المادة"}</p>}
    {mutation.isSuccess && <p className="form-api-success">تم حفظ المادة بنجاح.</p>}
    <div className="form-actions"><Button type="submit" icon={PackageCheck} loading={mutation.isPending} disabled={!supplierOptions.length}>حفظ المادة</Button><Button type="button" variant="secondary" icon={XCircle} onClick={() => { mutation.resetAttempt(); setForm(emptyForm); setValidationError(""); }}>إلغاء</Button></div></form>;
}
