import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useMaterialsScreen } from "@/modules/admin/inventory/hooks/inventory.queries";
import { firstProductFormError, recipeSchema } from "../schemas/product.schema";
import "./RecipeEditor.css";

const newKey = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function toLines(initial) {
  return (initial || []).map((item) => ({
    key: newKey(),
    materialId: item?.materialId ? String(item.materialId) : "",
    materialName: item?.materialName || item?.material?.name || "",
    quantitySmall: item?.quantitySmall !== undefined && item?.quantitySmall !== null ? String(item.quantitySmall) : "",
  }));
}

function MaterialSearchSelect({ line, onPick, disabled }) {
  const [search, setSearch] = useState(line.materialName || "");
  const debounced = useDebounce(search, 400);
  const query = useMaterialsScreen({
    page: 1,
    limit: 10,
    search: debounced || undefined,
    status: "ACTIVE",
  });
  const materials = query.data?.materials || [];

  useEffect(() => {
    setSearch(line.materialName || "");
  }, [line.materialName]);

  const options = useMemo(() => {
    const list = materials.map((item) => ({ value: String(item.id), label: item.name }));
    if (line.materialId && line.materialName && !list.some((option) => option.value === line.materialId)) {
      list.unshift({ value: line.materialId, label: line.materialName });
    }
    return list;
  }, [materials, line.materialId, line.materialName]);

  return (
    <div className="recipe-line__material">
      <input
        className="recipe-input"
        placeholder="ابحث باسم المادة"
        aria-label="بحث عن مادة"
        value={search}
        disabled={disabled}
        onChange={(event) => {
          const next = event.target.value;
          setSearch(next);
          const match = materials.find((item) => item.name === next.trim());
          if (match) {
            onPick({ materialId: String(match.id), materialName: match.name });
          } else if (!next.trim()) {
            onPick({ materialId: "", materialName: "" });
          } else {
            onPick({ materialName: next });
          }
        }}
      />
      <select
        className="recipe-input"
        aria-label="اختيار المادة"
        value={line.materialId}
        disabled={disabled}
        onChange={(event) => {
          const selected = materials.find((item) => String(item.id) === event.target.value);
          onPick({
            materialId: event.target.value,
            materialName: selected ? selected.name : line.materialName,
          });
        }}
      >
        <option value="">اختر المادة</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {query.isError && (
        <small className="recipe-hint recipe-hint--error" role="alert">
          تعذر تحميل المواد
        </small>
      )}
    </div>
  );
}

export default function RecipeEditor({ initial, onSubmit, pending = false }) {
  const [lines, setLines] = useState(() => toLines(initial));
  const [formError, setFormError] = useState("");
  const initialKey = useMemo(() => JSON.stringify(initial || []), [initial]);

  useEffect(() => {
    setLines(toLines(JSON.parse(initialKey)));
    setFormError("");
  }, [initialKey]);

  const patchLine = (key, patch) => {
    setFormError("");
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  };

  const addLine = () => {
    setFormError("");
    setLines((current) => [...current, { key: newKey(), materialId: "", materialName: "", quantitySmall: "" }]);
  };

  const removeLine = (key) => {
    setFormError("");
    setLines((current) => current.filter((line) => line.key !== key));
  };

  const submit = (event) => {
    event?.preventDefault?.();
    setFormError("");
    const ids = lines.map((line) => String(line.materialId).trim()).filter(Boolean);
    if (lines.length === 0 || ids.length !== lines.length) {
      setFormError("اختر المادة لكل سطر من نتائج البحث");
      return;
    }
    if (new Set(ids).size !== ids.length) {
      setFormError("المادة مكررة في الوصفة");
      return;
    }
    const payload = {
      ingredients: lines.map((line) => ({
        materialId: String(line.materialId),
        quantitySmall: String(line.quantitySmall).trim(),
      })),
    };
    const parsed = recipeSchema.safeParse(payload);
    if (!parsed.success) {
      setFormError(firstProductFormError(parsed));
      return;
    }
    onSubmit?.(parsed.data.ingredients);
  };

  return (
    <form className="recipe-editor" onSubmit={submit}>
      <div className="recipe-editor__head">
        <span>مكونات الوصفة (الكميات بالوحدة الصغيرة)</span>
        <button type="button" onClick={addLine} disabled={pending}>
          <Plus size={13} />
          سطر
        </button>
      </div>
      {lines.length === 0 && <p className="recipe-hint">لا توجد مكونات — أضف سطرًا واحدًا على الأقل.</p>}
      {lines.map((line, index) => (
        <div className="recipe-line" key={line.key}>
          <span className="recipe-line__index">{index + 1}</span>
          <MaterialSearchSelect line={line} disabled={pending} onPick={(patch) => patchLine(line.key, patch)} />
          <input
            className="recipe-input recipe-input--qty"
            placeholder="الكمية (صغيرة)"
            aria-label={`كمية السطر ${index + 1} بالوحدة الصغيرة`}
            inputMode="decimal"
            value={line.quantitySmall}
            disabled={pending}
            onChange={(event) => patchLine(line.key, { quantitySmall: event.target.value })}
          />
          <button
            type="button"
            className="recipe-line__remove"
            aria-label={`حذف السطر ${index + 1}`}
            disabled={pending || lines.length <= 1}
            onClick={() => removeLine(line.key)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      {formError && (
        <p className="recipe-hint recipe-hint--error" role="alert">
          {formError}
        </p>
      )}
      <div className="recipe-editor__actions">
        <button type="submit" className="recipe-save" disabled={pending}>
          {pending ? "جاري الحفظ..." : "حفظ الوصفة"}
        </button>
      </div>
    </form>
  );
}
