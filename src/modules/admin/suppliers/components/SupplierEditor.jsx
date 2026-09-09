import { useState } from "react";
import { useUpdateSupplier } from "../hooks/useSupplierDetails";

const fieldLabels = {
  name: "اسم المورد",
  contactPerson: "اسم المسؤول",
  phone: "رقم الهاتف",
  supplierType: "نوع المورد",
  city: "المدينة",
};

export default function SupplierEditor({ supplier, onSaved }) {
  const fields = Object.keys(fieldLabels);
  const [form, setForm] = useState(
    Object.fromEntries(fields.map((key) => [key, supplier[key] ?? ""])),
  );
  const mutation = useUpdateSupplier(supplier.id, { onSuccess: onSaved });

  return (
    <form
      className="supplier-compact-form"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate(form);
      }}
    >
      {fields.map((name) => (
        <label className="compact-field" key={name}>
          <span>{fieldLabels[name]} *</span>
          <input
            type={name === "phone" ? "tel" : "text"}
            value={form[name]}
            onChange={(event) =>
              setForm((current) => ({ ...current, [name]: event.target.value }))
            }
            required
          />
        </label>
      ))}
      <div className="compact-form-actions">
        <button disabled={mutation.isPending}>
          {mutation.isPending ? "جاري الحفظ..." : "حفظ تعديلات المورد"}
        </button>
        {mutation.isError && (
          <span role="alert">
            {mutation.error?.response?.data?.message || "تعذر حفظ التعديلات"}
          </span>
        )}
        {mutation.isSuccess && <span className="success-text">تم حفظ التعديلات</span>}
      </div>
    </form>
  );
}
