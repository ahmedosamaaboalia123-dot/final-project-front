import { useMemo, useState } from "react";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { AsyncState, Money } from "@/shared/components";
import { useMaterialsScreen } from "@/modules/admin/inventory/hooks/inventory.queries";
import { useProductsScreen, useProductDetails } from "../hooks/product.queries";
import {
  useCreateProduct,
  useCreateProductAddon,
  useCreateProductSize,
  useCreateProductType,
  useReplaceRecipe,
} from "../hooks/product.mutations";
import {
  addonFormSchema,
  firstProductFormError,
  productFormSchema,
  productSizeSchema,
  productTypeSchema,
  recipeSchema,
} from "../schemas/product.schema";
import MediaPicker from "./MediaPicker";
import RecipeEditor from "./RecipeEditor";
import "./ProductWizard.css";

const STEPS = ["البيانات الأساسية", "الأنواع", "الأحجام", "الوصفات", "المراجعة"];

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

function TypeMaterialPicker({ selected, onChange, disabled }) {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 400);
  const query = useMaterialsScreen({ page: 1, limit: 10, search: debounced || undefined, status: "ACTIVE" });
  const materials = query.data?.materials || [];
  const toggle = (id) => {
    const next = String(id);
    onChange(selected.includes(next) ? selected.filter((item) => item !== next) : [...selected, next].slice(0, 100));
  };
  return (
    <div className="wizard-materials">
      <input
        className="wizard-input"
        placeholder="ابحث عن مادة مسموحة (اختياري)"
        value={search}
        disabled={disabled}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className="wizard-materials__list">
        {materials.map((material) => (
          <label key={material.id} className="wizard-materials__item">
            <input type="checkbox" checked={selected.includes(String(material.id))} disabled={disabled} onChange={() => toggle(material.id)} />
            <span>{material.name}</span>
          </label>
        ))}
        {!query.isLoading && materials.length === 0 && <small>لا توجد مواد مطابقة.</small>}
      </div>
      {selected.length > 0 && <small>المختار: {selected.length} مادة</small>}
    </div>
  );
}

export default function ProductWizard({ onFinished }) {
  const [step, setStep] = useState(0);
  const [productId, setProductId] = useState(null);
  const [createdTypes, setCreatedTypes] = useState([]);
  const [createdSizes, setCreatedSizes] = useState([]);
  const [doneRecipes, setDoneRecipes] = useState([]);

  const [basic, setBasic] = useState({ name: "", categoryId: "", description: "", isVisibleInMenu: true, status: "ACTIVE", imageId: null });
  const [basicError, setBasicError] = useState("");
  const [typeForm, setTypeForm] = useState({ name: "", sortOrder: "0", allowedMaterialIds: [] });
  const [typeError, setTypeError] = useState("");
  const [sizeForm, setSizeForm] = useState({ typeId: "", name: "", sellingPrice: "", sortOrder: "0" });
  const [sizeError, setSizeError] = useState("");
  const [addonForm, setAddonForm] = useState({ name: "", sellingPrice: "", notes: "" });
  const [addonError, setAddonError] = useState("");

  const categoriesQuery = useProductsScreen({ page: 1, limit: 10 });
  const categories = useMemo(() => categoriesQuery.data?.filters?.categories || [], [categoriesQuery.data]);
  const detailsQuery = useProductDetails(productId || undefined);

  const createProduct = useCreateProduct();
  const createType = useCreateProductType(productId || "pending");
  const createSize = useCreateProductSize(productId || "pending");
  const replaceRecipe = useReplaceRecipe(productId || "pending");
  const createAddon = useCreateProductAddon(productId || "pending");

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
        setProductId(String(id));
        setStep(1);
      },
    });
  };

  const submitType = (event) => {
    event.preventDefault();
    if (!productId) return;
    createType.resetAttempt();
    setTypeError("");
    const parsed = productTypeSchema.safeParse({
      name: typeForm.name.trim(),
      allowedMaterialIds: typeForm.allowedMaterialIds.map(String),
      sortOrder: typeForm.sortOrder === "" ? 0 : Number(typeForm.sortOrder),
    });
    if (!parsed.success) {
      setTypeError(firstProductFormError(parsed));
      return;
    }
    createType.mutate(parsed.data, {
      onSuccess: (data) => {
        const id = extractId(data) || `local-${Date.now()}`;
        setCreatedTypes((current) => [...current, { id: String(id), name: typeForm.name.trim() }]);
        setTypeForm({ name: "", sortOrder: "0", allowedMaterialIds: [] });
        setSizeForm((current) => ({ ...current, typeId: current.typeId || String(id) }));
      },
    });
  };

  const submitSize = (event) => {
    event.preventDefault();
    if (!productId) return;
    createSize.resetAttempt();
    setSizeError("");
    const parsed = productSizeSchema.safeParse({
      typeId: String(sizeForm.typeId),
      name: sizeForm.name.trim(),
      sellingPrice: String(sizeForm.sellingPrice).trim(),
      sortOrder: sizeForm.sortOrder === "" ? 0 : Number(sizeForm.sortOrder),
    });
    if (!parsed.success) {
      setSizeError(firstProductFormError(parsed));
      return;
    }
    createSize.mutate(parsed.data, {
      onSuccess: (data) => {
        const id = extractId(data) || `local-${Date.now()}`;
        setCreatedSizes((current) => [
          ...current,
          { id: String(id), typeId: String(sizeForm.typeId), name: sizeForm.name.trim(), sellingPrice: String(sizeForm.sellingPrice).trim() },
        ]);
        setSizeForm((current) => ({ ...current, name: "", sellingPrice: "" }));
      },
    });
  };

  const submitRecipe = (sizeId, ingredients) => {
    const parsed = recipeSchema.safeParse({ ingredients });
    if (!parsed.success) return;
    replaceRecipe.mutate(
      { productSizeId: String(sizeId), ingredients: parsed.data.ingredients },
      { onSuccess: () => setDoneRecipes((current) => [...new Set([...current, String(sizeId)])]) },
    );
  };

  const submitAddon = (event) => {
    event.preventDefault();
    if (!productId) return;
    createAddon.resetAttempt();
    setAddonError("");
    const parsed = addonFormSchema.safeParse({
      name: addonForm.name.trim(),
      sellingPrice: String(addonForm.sellingPrice).trim(),
      notes: addonForm.notes.trim() ? addonForm.notes.trim() : undefined,
      isActive: true,
      sortOrder: 0,
    });
    if (!parsed.success) {
      setAddonError(firstProductFormError(parsed));
      return;
    }
    createAddon.mutate(parsed.data, {
      onSuccess: () => setAddonForm({ name: "", sellingPrice: "", notes: "" }),
    });
  };

  const typeOptions = createdTypes.length > 0 ? createdTypes : (detailsQuery.data?.types || []).map((item) => ({ id: String(item.id), name: item.name }));
  const sizeList = createdSizes.length > 0 ? createdSizes : (detailsQuery.data?.sizes || []).map((item) => ({
    id: String(item.id),
    typeId: String(item.typeId),
    name: item.name,
    sellingPrice: String(item.sellingPrice),
  }));

  return (
    <div className="product-wizard">
      <ol className="wizard-steps">
        {STEPS.map((label, index) => (
          <li key={label} className={index === step ? "active" : index < step ? "done" : ""}>
            <span>{index + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      {productId && (
        <p className="wizard-progress">
          مسودة المنتج: {productId} — أنواع: {typeOptions.length} — أحجام: {sizeList.length} — وصفات مكتملة: {doneRecipes.length}
        </p>
      )}

      {step === 0 && (
        <form className="wizard-card" onSubmit={submitBasic}>
          <h2>البيانات الأساسية</h2>
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
          {(basicError || createProduct.isError) && (
            <p className="wizard-error" role="alert">
              {basicError || createProduct.error?.message || "تعذر إنشاء المنتج"}
            </p>
          )}
          <div className="wizard-actions">
            <button type="submit" className="wizard-primary" disabled={createProduct.isPending}>
              {createProduct.isPending ? "جاري الإنشاء..." : "إنشاء والمتابعة"}
            </button>
          </div>
        </form>
      )}

      {step === 1 && (
        <section className="wizard-card">
          <h2>أنواع المنتج</h2>
          <form onSubmit={submitType} className="wizard-inline-form">
            <label>
              اسم النوع
              <input className="wizard-input" value={typeForm.name} onChange={(event) => setTypeForm({ ...typeForm, name: event.target.value })} />
            </label>
            <label>
              الترتيب
              <input
                className="wizard-input"
                type="number"
                min="0"
                step="1"
                value={typeForm.sortOrder}
                onChange={(event) => setTypeForm({ ...typeForm, sortOrder: event.target.value })}
              />
            </label>
            <TypeMaterialPicker
              selected={typeForm.allowedMaterialIds}
              disabled={createType.isPending}
              onChange={(next) => setTypeForm((current) => ({ ...current, allowedMaterialIds: next }))}
            />
            {(typeError || createType.isError) && (
              <p className="wizard-error" role="alert">
                {typeError || createType.error?.message || "تعذر إضافة النوع"}
              </p>
            )}
            <button type="submit" className="wizard-primary" disabled={createType.isPending || !productId}>
              {createType.isPending ? "جاري الحفظ..." : "إضافة نوع"}
            </button>
          </form>
          <ul className="wizard-list">
            {typeOptions.map((item) => (
              <li key={item.id}>{item.name}</li>
            ))}
            {typeOptions.length === 0 && <li className="wizard-empty">لم تُضف أنواع بعد.</li>}
          </ul>
          <div className="wizard-actions">
            <button type="button" className="wizard-secondary" onClick={() => setStep(0)}>
              رجوع
            </button>
            <button type="button" className="wizard-primary" disabled={typeOptions.length === 0} onClick={() => setStep(2)}>
              متابعة للأحجام
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="wizard-card">
          <h2>أحجام المنتج</h2>
          <form onSubmit={submitSize} className="wizard-inline-form">
            <label>
              النوع
              <select className="wizard-input" value={sizeForm.typeId} onChange={(event) => setSizeForm({ ...sizeForm, typeId: event.target.value })}>
                <option value="">اختر النوع</option>
                {typeOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              اسم الحجم
              <input className="wizard-input" value={sizeForm.name} onChange={(event) => setSizeForm({ ...sizeForm, name: event.target.value })} />
            </label>
            <label>
              سعر البيع
              <input
                className="wizard-input"
                inputMode="decimal"
                placeholder="مثال: 45.00"
                value={sizeForm.sellingPrice}
                onChange={(event) => setSizeForm({ ...sizeForm, sellingPrice: event.target.value })}
              />
            </label>
            {(sizeError || createSize.isError) && (
              <p className="wizard-error" role="alert">
                {sizeError || createSize.error?.message || "تعذر إضافة الحجم"}
              </p>
            )}
            <button type="submit" className="wizard-primary" disabled={createSize.isPending || !productId}>
              {createSize.isPending ? "جاري الحفظ..." : "إضافة حجم"}
            </button>
          </form>
          <ul className="wizard-list">
            {sizeList.map((item) => (
              <li key={item.id}>
                {item.name} — <Money value={item.sellingPrice} />
              </li>
            ))}
            {sizeList.length === 0 && <li className="wizard-empty">لم تُضف أحجام بعد.</li>}
          </ul>
          <div className="wizard-actions">
            <button type="button" className="wizard-secondary" onClick={() => setStep(1)}>
              رجوع
            </button>
            <button type="button" className="wizard-primary" disabled={sizeList.length === 0} onClick={() => setStep(3)}>
              متابعة للوصفات
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="wizard-card">
          <h2>وصفات الأحجام</h2>
          {sizeList.length === 0 && <p className="wizard-empty">أضف حجمًا أولًا.</p>}
          {sizeList.map((size) => (
            <article key={size.id} className="wizard-size-block">
              <h3>
                {size.name} {doneRecipes.includes(String(size.id)) && <span className="wizard-done">✓ مكتملة</span>}
              </h3>
              <RecipeEditor initial={[]} onSubmit={(ingredients) => submitRecipe(size.id, ingredients)} pending={replaceRecipe.isPending} />
            </article>
          ))}
          {replaceRecipe.isError && (
            <p className="wizard-error" role="alert">
              {replaceRecipe.error?.message || "تعذر حفظ الوصفة"}
            </p>
          )}
          <div className="wizard-actions">
            <button type="button" className="wizard-secondary" onClick={() => setStep(2)}>
              رجوع
            </button>
            <button type="button" className="wizard-primary" onClick={() => setStep(4)}>
              متابعة للمراجعة
            </button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="wizard-card">
          <h2>المراجعة والإضافات</h2>
          <AsyncState loading={detailsQuery.isLoading} error={detailsQuery.error} onRetry={detailsQuery.refetch} empty={!detailsQuery.data?.product} emptyText="تعذر تحميل المراجعة">
            <div className="wizard-review">
              <strong>{detailsQuery.data?.product?.name}</strong>
              {(detailsQuery.data?.costPreview || []).map((preview) => (
                <div key={preview.sizeId} className="wizard-review__row">
                  <span>مقاس: {preview.sizeId.slice(-6)}</span>
                  <span>
                    التكلفة: {preview.cost == null ? "—" : <Money value={preview.cost} />}
                  </span>
                  <span>
                    الربح: {preview.profit == null ? "—" : <Money value={preview.profit} />}
                  </span>
                  <span>الهامش: {preview.margin == null ? "—" : `${preview.margin}%`}</span>
                  <small>{preview.costCompleteness}</small>
                </div>
              ))}
              {(detailsQuery.data?.costPreview || []).length === 0 && <p className="wizard-empty">لا توجد بيانات تكلفة بعد — احفظ الوصفات أولًا.</p>}
            </div>
          </AsyncState>
          <form onSubmit={submitAddon} className="wizard-inline-form">
            <h3>إضافة سريعة (اختياري)</h3>
            <label>
              اسم الإضافة
              <input className="wizard-input" value={addonForm.name} onChange={(event) => setAddonForm({ ...addonForm, name: event.target.value })} />
            </label>
            <label>
              سعر البيع
              <input
                className="wizard-input"
                inputMode="decimal"
                value={addonForm.sellingPrice}
                onChange={(event) => setAddonForm({ ...addonForm, sellingPrice: event.target.value })}
              />
            </label>
            <label>
              ملاحظات (اختياري)
              <input className="wizard-input" value={addonForm.notes} onChange={(event) => setAddonForm({ ...addonForm, notes: event.target.value })} />
            </label>
            {(addonError || createAddon.isError) && (
              <p className="wizard-error" role="alert">
                {addonError || createAddon.error?.message || "تعذر إضافة الإضافة"}
              </p>
            )}
            <button type="submit" className="wizard-secondary" disabled={createAddon.isPending || !productId}>
              {createAddon.isPending ? "جاري الحفظ..." : "إضافة الإضافة"}
            </button>
          </form>
          <div className="wizard-actions">
            <button type="button" className="wizard-secondary" onClick={() => setStep(3)}>
              رجوع
            </button>
            <button type="button" className="wizard-primary" disabled={!productId} onClick={() => productId && onFinished?.(String(productId))}>
              إنهاء وفتح التفاصيل
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
