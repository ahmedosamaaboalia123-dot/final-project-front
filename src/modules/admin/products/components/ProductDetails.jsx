import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { can } from "@/modules/auth/permissions/permission";
import { isConflict } from "@/api/apiError";
import { AsyncState, ConflictDialog, Money } from "@/shared/components";
import { useProductsScreen, useProductDetails } from "../hooks/product.queries";
import {
  useCreateProductAddon,
  useCreateProductSize,
  useCreateProductType,
  useReplaceRecipe,
  useUpdateProduct,
  useUpdateProductAddon,
} from "../hooks/product.mutations";
import {
  addonFormSchema,
  addonUpdateSchema,
  firstProductFormError,
  productSizeSchema,
  productTypeSchema,
  productUpdateSchema,
} from "../schemas/product.schema";
import MediaPicker, { ProductThumb } from "./MediaPicker";
import RecipeEditor from "./RecipeEditor";
import "./ProductDetails.css";

const COST_LABELS = {
  COMPLETE: "التكلفة مكتملة",
  MISSING_RECIPE: "لا توجد وصفة",
  MISSING_PRICES: "أسعار ناقصة",
  INCOMPLETE: "غير مكتملة",
};

function BasicEditor({ product, categories, canManage, onReload }) {
  const [form, setForm] = useState({
    name: product.name || "",
    categoryId: product.categoryId ? String(product.categoryId) : "",
    description: product.description || "",
    isVisibleInMenu: Boolean(product.isVisibleInMenu),
    status: product.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    imageId: product.imageId ? String(product.imageId) : null,
  });
  const [formError, setFormError] = useState("");
  const mutation = useUpdateProduct(product.id);

  const submit = (event) => {
    event.preventDefault();
    mutation.resetAttempt();
    setFormError("");
    const parsed = productUpdateSchema.safeParse({
      name: form.name.trim(),
      description: form.description.trim() ? form.description.trim() : undefined,
      imageId: form.imageId ? String(form.imageId) : null,
      categoryId: form.categoryId ? String(form.categoryId) : undefined,
      isVisibleInMenu: Boolean(form.isVisibleInMenu),
      status: form.status,
      expectedVersion: Number(product.version ?? 0),
    });
    if (!parsed.success) {
      setFormError(firstProductFormError(parsed));
      return;
    }
    mutation.mutate(parsed.data, { onSuccess: () => onReload?.() });
  };

  const quickPatch = (patch) => {
    mutation.resetAttempt();
    setFormError("");
    mutation.mutate({ ...patch, expectedVersion: Number(product.version ?? 0) }, { onSuccess: () => onReload?.() });
  };

  if (!canManage) {
    return (
      <dl className="details-readonly">
        <div><dt>الاسم</dt><dd>{product.name}</dd></div>
        <div><dt>القسم</dt><dd>{categories.find((item) => String(item.id) === String(product.categoryId))?.name || "—"}</dd></div>
        <div><dt>الوصف</dt><dd>{product.description || "—"}</dd></div>
        <div><dt>الحالة</dt><dd>{product.statusLabel}</dd></div>
        <div><dt>الظهور</dt><dd>{product.isVisibleInMenu ? "في المنيو" : "مخفي"}</dd></div>
      </dl>
    );
  }

  const conflict = mutation.isError && isConflict(mutation.error);

  return (
    <>
      <form className="details-form" onSubmit={submit}>
        <label>
          اسم المنتج
          <input value={form.name} disabled={mutation.isPending} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <label>
          القسم
          <select value={form.categoryId} disabled={mutation.isPending} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
            <option value="">اختر القسم</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </label>
        <label className="details-form__wide">
          الوصف
          <textarea value={form.description} disabled={mutation.isPending} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </label>
        <label className="details-check">
          <input
            type="checkbox"
            checked={form.isVisibleInMenu}
            disabled={mutation.isPending}
            onChange={(event) => setForm({ ...form, isVisibleInMenu: event.target.checked })}
          />
          ظاهر في المنيو
        </label>
        <label>
          الحالة
          <select value={form.status} disabled={mutation.isPending} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option value="ACTIVE">نشط</option>
            <option value="INACTIVE">موقوف</option>
          </select>
        </label>
        <div className="details-form__wide">
          <span className="details-label">الصورة</span>
          <MediaPicker value={form.imageId} onChange={(id) => setForm((current) => ({ ...current, imageId: id }))} />
        </div>
        <div className="details-form__actions">
          <button type="submit" className="details-primary" disabled={mutation.isPending}>
            {mutation.isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
          </button>
          <button
            type="button"
            className="details-secondary"
            disabled={mutation.isPending}
            onClick={() => quickPatch({ status: product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })}
          >
            {product.status === "ACTIVE" ? "إيقاف" : "تفعيل"}
          </button>
          <button
            type="button"
            className="details-secondary"
            disabled={mutation.isPending}
            onClick={() => quickPatch({ isVisibleInMenu: !product.isVisibleInMenu })}
          >
            {product.isVisibleInMenu ? "إخفاء من المنيو" : "إظهار في المنيو"}
          </button>
        </div>
        {(formError || (mutation.isError && !conflict)) && (
          <p className="details-error" role="alert">{formError || mutation.error?.message || "تعذر حفظ المنتج"}</p>
        )}
      </form>
      <ConflictDialog
        open={conflict}
        onClose={mutation.resetAttempt}
        onReload={async () => { mutation.resetAttempt(); await onReload?.(); }}
        pending={false}
      />
    </>
  );
}

function TypeAdder({ productId, canManage, onReload }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const mutation = useCreateProductType(productId);
  if (!canManage) return null;
  const submit = (event) => {
    event.preventDefault();
    mutation.resetAttempt();
    setError("");
    const parsed = productTypeSchema.safeParse({ name: name.trim(), allowedMaterialIds: [], sortOrder: 0 });
    if (!parsed.success) {
      setError(firstProductFormError(parsed));
      return;
    }
    mutation.mutate(parsed.data, { onSuccess: async () => { setName(""); await onReload?.(); } });
  };
  return (
    <form className="details-inline" onSubmit={submit}>
      <input placeholder="اسم نوع جديد" aria-label="اسم نوع جديد" value={name} disabled={mutation.isPending} onChange={(event) => setName(event.target.value)} />
      <button type="submit" className="details-primary" disabled={mutation.isPending}>
        {mutation.isPending ? "جاري الحفظ..." : "إضافة نوع"}
      </button>
      {(error || mutation.isError) && (
        <p className="details-error" role="alert">{error || mutation.error?.message || "تعذر إضافة النوع"}</p>
      )}
    </form>
  );
}

function SizeAdder({ productId, types, canManage, onReload }) {
  const [form, setForm] = useState({ typeId: "", name: "", sellingPrice: "" });
  const [error, setError] = useState("");
  const mutation = useCreateProductSize(productId);
  if (!canManage) return null;
  const submit = (event) => {
    event.preventDefault();
    mutation.resetAttempt();
    setError("");
    const parsed = productSizeSchema.safeParse({
      typeId: String(form.typeId),
      name: form.name.trim(),
      sellingPrice: String(form.sellingPrice).trim(),
      sortOrder: 0,
    });
    if (!parsed.success) {
      setError(firstProductFormError(parsed));
      return;
    }
    mutation.mutate(parsed.data, { onSuccess: async () => { setForm({ typeId: "", name: "", sellingPrice: "" }); await onReload?.(); } });
  };
  return (
    <form className="details-inline details-inline--size" onSubmit={submit}>
      <select aria-label="النوع" value={form.typeId} disabled={mutation.isPending} onChange={(event) => setForm({ ...form, typeId: event.target.value })}>
        <option value="">اختر النوع</option>
        {types.map((item) => (
          <option key={item.id} value={item.id}>{item.name}</option>
        ))}
      </select>
      <input placeholder="اسم الحجم" aria-label="اسم الحجم" value={form.name} disabled={mutation.isPending} onChange={(event) => setForm({ ...form, name: event.target.value })} />
      <input
        placeholder="سعر البيع"
        aria-label="سعر البيع"
        inputMode="decimal"
        value={form.sellingPrice}
        disabled={mutation.isPending}
        onChange={(event) => setForm({ ...form, sellingPrice: event.target.value })}
      />
      <button type="submit" className="details-primary" disabled={mutation.isPending}>
        {mutation.isPending ? "جاري الحفظ..." : "إضافة حجم"}
      </button>
      {(error || mutation.isError) && (
        <p className="details-error" role="alert">{error || mutation.error?.message || "تعذر إضافة الحجم"}</p>
      )}
    </form>
  );
}

function SizeBlock({ size, recipe, cost, canManage, productId, onReload }) {
  const mutation = useReplaceRecipe(productId);
  const initial = useMemo(
    () => (recipe?.ingredients || []).map((item) => ({ materialId: String(item.materialId), materialName: item.materialName || "", quantitySmall: String(item.quantitySmall) })),
    [recipe],
  );
  const submit = (ingredients) => {
    mutation.resetAttempt();
    mutation.mutate(
      {
        productSizeId: String(size.id),
        ingredients,
        ...(recipe ? { expectedVersion: Number(recipe.version ?? 0) } : {}),
      },
      { onSuccess: () => onReload?.() },
    );
  };
  const conflict = mutation.isError && isConflict(mutation.error);
  return (
    <article className="details-size">
      <header>
        <strong>{size.name}</strong>
        <span>سعر البيع: <Money value={size.sellingPrice} /></span>
      </header>
      {cost && (
        <div className="details-cost">
          <span>التكلفة: {cost.cost == null ? "—" : <Money value={cost.cost} />}</span>
          <span>الربح: {cost.profit == null ? "—" : <Money value={cost.profit} />}</span>
          <span>الهامش: {cost.margin == null ? "—" : `${cost.margin}%`}</span>
          <small>{COST_LABELS[cost.costCompleteness] || cost.costCompleteness}</small>
        </div>
      )}
      {!canManage && <p className="details-hint">عرض فقط — تحتاج صلاحية الإدارة لتعديل الوصفة.</p>}
      {canManage && <RecipeEditor initial={initial} onSubmit={submit} pending={mutation.isPending} />}
      {mutation.isError && !conflict && (
        <p className="details-error" role="alert">{mutation.error?.message || "تعذر حفظ الوصفة"}</p>
      )}
      <ConflictDialog
        open={conflict}
        onClose={mutation.resetAttempt}
        onReload={async () => { mutation.resetAttempt(); await onReload?.(); }}
        pending={false}
      />
    </article>
  );
}

function AddonEditor({ productId, addon, canManage, onReload }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: addon.name || "", sellingPrice: String(addon.sellingPrice ?? ""), notes: addon.notes || "" });
  const [error, setError] = useState("");
  const mutation = useUpdateProductAddon(productId);
  if (!canManage) {
    return (
      <li className="details-addon">
        <strong>{addon.name}</strong>
        <span><Money value={addon.sellingPrice} /></span>
        <span className={`status-badge ${addon.isActive ? "active" : "withdrawn"}`}>{addon.isActive ? "نشط" : "موقوف"}</span>
      </li>
    );
  }
  const submit = (event) => {
    event.preventDefault();
    mutation.resetAttempt();
    setError("");
    const parsed = addonUpdateSchema.safeParse({
      name: form.name.trim(),
      sellingPrice: String(form.sellingPrice).trim(),
      notes: form.notes.trim() ? form.notes.trim() : undefined,
      expectedVersion: Number(addon.version ?? 0),
    });
    if (!parsed.success) {
      setError(firstProductFormError(parsed));
      return;
    }
    mutation.mutate({ addonId: String(addon.id), ...parsed.data }, { onSuccess: async () => { setEditing(false); await onReload?.(); } });
  };
  const toggleActive = () => {
    mutation.resetAttempt();
    mutation.mutate(
      { addonId: String(addon.id), isActive: !addon.isActive, expectedVersion: Number(addon.version ?? 0) },
      { onSuccess: () => onReload?.() },
    );
  };
  const conflict = mutation.isError && isConflict(mutation.error);
  return (
    <li className="details-addon">
      <div className="details-addon__head">
        <strong>{addon.name}</strong>
        <span><Money value={addon.sellingPrice} /></span>
        <span className={`status-badge ${addon.isActive ? "active" : "withdrawn"}`}>{addon.isActive ? "نشط" : "موقوف"}</span>
        <button type="button" className="details-secondary" onClick={() => setEditing((current) => !current)}>
          {editing ? "إلغاء" : "تعديل"}
        </button>
        <button type="button" className="details-secondary" disabled={mutation.isPending} onClick={toggleActive}>
          {addon.isActive ? "إيقاف" : "تفعيل"}
        </button>
      </div>
      {editing && (
        <form className="details-inline" onSubmit={submit}>
          <input aria-label="اسم الإضافة" value={form.name} disabled={mutation.isPending} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <input aria-label="سعر الإضافة" inputMode="decimal" value={form.sellingPrice} disabled={mutation.isPending} onChange={(event) => setForm({ ...form, sellingPrice: event.target.value })} />
          <input aria-label="ملاحظات الإضافة" value={form.notes} disabled={mutation.isPending} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          <button type="submit" className="details-primary" disabled={mutation.isPending}>
            {mutation.isPending ? "جاري الحفظ..." : "حفظ"}
          </button>
          {(error || (mutation.isError && !conflict)) && (
            <p className="details-error" role="alert">{error || mutation.error?.message || "تعذر حفظ الإضافة"}</p>
          )}
        </form>
      )}
      <ConflictDialog
        open={conflict}
        onClose={mutation.resetAttempt}
        onReload={async () => { mutation.resetAttempt(); await onReload?.(); }}
        pending={false}
      />
    </li>
  );
}

function AddonAdder({ productId, canManage, onReload }) {
  const [form, setForm] = useState({ name: "", sellingPrice: "", notes: "" });
  const [error, setError] = useState("");
  const mutation = useCreateProductAddon(productId);
  if (!canManage) return null;
  const submit = (event) => {
    event.preventDefault();
    mutation.resetAttempt();
    setError("");
    const parsed = addonFormSchema.safeParse({
      name: form.name.trim(),
      sellingPrice: String(form.sellingPrice).trim(),
      notes: form.notes.trim() ? form.notes.trim() : undefined,
      isActive: true,
      sortOrder: 0,
    });
    if (!parsed.success) {
      setError(firstProductFormError(parsed));
      return;
    }
    mutation.mutate(parsed.data, { onSuccess: async () => { setForm({ name: "", sellingPrice: "", notes: "" }); await onReload?.(); } });
  };
  return (
    <form className="details-inline" onSubmit={submit}>
      <input placeholder="اسم الإضافة" aria-label="اسم الإضافة" value={form.name} disabled={mutation.isPending} onChange={(event) => setForm({ ...form, name: event.target.value })} />
      <input placeholder="سعر البيع" aria-label="سعر البيع" inputMode="decimal" value={form.sellingPrice} disabled={mutation.isPending} onChange={(event) => setForm({ ...form, sellingPrice: event.target.value })} />
      <input placeholder="ملاحظات (اختياري)" aria-label="ملاحظات" value={form.notes} disabled={mutation.isPending} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
      <button type="submit" className="details-primary" disabled={mutation.isPending}>
        {mutation.isPending ? "جاري الحفظ..." : "إضافة"}
      </button>
      {(error || mutation.isError) && (
        <p className="details-error" role="alert">{error || mutation.error?.message || "تعذر إضافة الإضافة"}</p>
      )}
    </form>
  );
}

export default function ProductDetails({ productId, onBack }) {
  const permissions = useAuthStore((state) => state.permissions);
  const canManage = can(permissions, "products.manage");
  const query = useProductDetails(productId);
  const categoriesQuery = useProductsScreen({ page: 1, limit: 10 });

  const data = query.data;
  const product = data?.product;
  const types = data?.types || [];
  const sizes = data?.sizes || [];
  const recipeBySize = data?.recipeBySize || {};
  const costBySize = data?.costBySize || {};
  const addons = data?.addons || [];
  const categories = categoriesQuery.data?.filters?.categories || [];

  return (
    <div className="product-details">
      <button type="button" className="details-back" onClick={onBack}>
        <ArrowRight size={16} />
        رجوع للقائمة
      </button>
      <AsyncState loading={query.isLoading} error={query.error} onRetry={query.refetch} empty={!query.isLoading && !product} emptyText="تعذر تحميل المنتج">
        {product && (
          <>
            <section className="details-card">
              <header className="details-head">
                <ProductThumb imageId={product.imageId} />
                <div>
                  <h2>{product.name}</h2>
                  <small>الإصدار: {product.version} — {product.statusLabel} — {product.isVisibleInMenu ? "في المنيو" : "مخفي"}</small>
                </div>
              </header>
              <BasicEditor key={String(product.id) + String(product.version)} product={product} categories={categories} canManage={canManage} onReload={query.refetch} />
            </section>

            <section className="details-card">
              <h2>الأنواع ({types.length})</h2>
              <TypeAdder productId={String(product.id)} canManage={canManage} onReload={query.refetch} />
              <ul className="details-list">
                {types.map((type) => (
                  <li key={type.id}>{type.name}</li>
                ))}
                {types.length === 0 && <li className="details-empty">لا توجد أنواع بعد.</li>}
              </ul>
            </section>

            <section className="details-card">
              <h2>الأحجام والوصفات</h2>
              <SizeAdder productId={String(product.id)} types={types} canManage={canManage} onReload={query.refetch} />
              {types.map((type) => {
                const typeSizes = sizes.filter((size) => String(size.typeId) === String(type.id));
                return (
                  <div key={type.id} className="details-type-group">
                    <h3>{type.name} ({typeSizes.length})</h3>
                    {typeSizes.length === 0 && <p className="details-empty">لا توجد أحجام لهذا النوع.</p>}
                    {typeSizes.map((size) => (
                      <SizeBlock
                        key={size.id}
                        size={size}
                        recipe={recipeBySize[String(size.id)]}
                        cost={costBySize[String(size.id)]}
                        canManage={canManage}
                        productId={String(product.id)}
                        onReload={query.refetch}
                      />
                    ))}
                  </div>
                );
              })}
              {types.length === 0 && <p className="details-empty">أضف نوعًا أولًا ثم أضف الأحجام.</p>}
            </section>

            <section className="details-card">
              <h2>الإضافات ({addons.length})</h2>
              <AddonAdder productId={String(product.id)} canManage={canManage} onReload={query.refetch} />
              <ul className="details-addons">
                {addons.map((addon) => (
                  <AddonEditor key={addon.id} productId={String(product.id)} addon={addon} canManage={canManage} onReload={query.refetch} />
                ))}
                {addons.length === 0 && <li className="details-empty">لا توجد إضافات بعد.</li>}
              </ul>
            </section>
          </>
        )}
      </AsyncState>
    </div>
  );
}
