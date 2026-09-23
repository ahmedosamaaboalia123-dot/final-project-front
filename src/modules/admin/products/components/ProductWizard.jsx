import { useMemo, useState } from "react";
import { useProductsScreen } from "../hooks/product.queries";
import { useCreateProduct } from "../hooks/product.mutations";
import { firstProductFormError, productFormSchema } from "../schemas/product.schema";
import MediaPicker from "./MediaPicker";
import "./ProductWizard.css";

function extractId(data, keys = ["id"]) {
  if (!data || typeof data !== "object") return null;
  const nested = [data, data.product, data.type, data.size, data.recipe, data.addon].filter(Boolean);
  for (const source of nested) {
    for (const key of keys) {
      if (source?.[key] !== undefined && source?.[key] !== null && String(source[key]).trim() !== "") {
        return String(source[key]);
      }
    }
  }
  return null;
}

export default function ProductWizard({ onFinished }) {
  const [basic, setBasic] = useState({ name: "", categoryId: "", description: "", isVisibleInMenu: true, status: "ACTIVE", imageId: null });
  const [basicError, setBasicError] = useState("");

  const categoriesQuery = useProductsScreen({ page: 1, limit: 10 });
  const categories = useMemo(() => categoriesQuery.data?.filters?.categories || [], [categoriesQuery.data]);

  const createProduct = useCreateProduct();

  const categoryOptions = useMemo(
    () => categories.filter((item) => item.isActive !== false).map((item) => ({ value: String(item.id), label: item.name })),
    [categories],
  );

  const submitBasic = (event) => {
    event.preventDefault();
    createProduct.resetAttempt();
    setBasicError("");
    const payload = {
      name: basic.name.trim(),
      categoryId: String(basic.categoryId),
      description: basic.description.trim() ? basic.description.trim() : undefined,
      isVisibleInMenu: Boolean(basic.isVisibleInMenu),
      status: basic.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      ...(basic.imageId ? { imageId: String(basic.imageId) } : {}),
    };
    const parsed = productFormSchema.safeParse(payload);
    if (!parsed.success) {
      setBasicError(firstProductFormError(parsed));
      return;
    }
    createProduct.mutate(parsed.data, {
      onSuccess: (data) => {
        const id = extractId(data) || extractId(data?.data);
        if (!id) {
          setBasicError("تم الإنشاء لكن تعذر قراءة معرف المنتج — حدّث القائمة وافتح التفاصيل");
          return;
        }
        onFinished?.(String(id));
      },
    });
  };

  return (
    <div className="product-wizard">
      <form className="wizard-card" onSubmit={submitBasic}>
        <h2>البيانات الأساسية</h2>
        <div className="wizard-basic-row">
          <label>
            اسم المنتج
            <input className="wizard-input" value={basic.name} onChange={(event) => setBasic({ ...basic, name: event.target.value })} />
          </label>
          <label>
            القسم
            <select className="wizard-input" value={basic.categoryId} onChange={(event) => setBasic({ ...basic, categoryId: event.target.value })}>
              <option value="">اختر القسم</option>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          الوصف (اختياري)
          <textarea className="wizard-input" value={basic.description} onChange={(event) => setBasic({ ...basic, description: event.target.value })} />
        </label>
        <div className="wizard-row">
          <label className="wizard-check">
            <input
              type="checkbox"
              checked={basic.isVisibleInMenu}
              onChange={(event) => setBasic({ ...basic, isVisibleInMenu: event.target.checked })}
            />
            ظاهر في المنيو
          </label>
          <label>
            الحالة
            <select className="wizard-input" value={basic.status} onChange={(event) => setBasic({ ...basic, status: event.target.value })}>
              <option value="ACTIVE">نشط</option>
              <option value="INACTIVE">موقوف</option>
            </select>
          </label>
        </div>
        <div>
          <span className="wizard-label">صورة المنتج (اختياري)</span>
          <MediaPicker value={basic.imageId} onChange={(id) => setBasic((current) => ({ ...current, imageId: id }))} />
        </div>
        <p className="wizard-empty">بعد الإنشاء ستكمل باقي البيانات (الأنواع والأحجام والوصفات والإضافات) من صفحة المنتج.</p>
        {(basicError || createProduct.isError) && (
          <p className="wizard-error" role="alert">
            {basicError || createProduct.error?.message || "تعذر إنشاء المنتج"}
          </p>
        )}
        <div className="wizard-actions">
          <button type="submit" className="wizard-primary" disabled={createProduct.isPending}>
            {createProduct.isPending ? "جاري الإنشاء..." : "إنشاء وفتح التفاصيل"}
          </button>
        </div>
      </form>
    </div>
  );
}
