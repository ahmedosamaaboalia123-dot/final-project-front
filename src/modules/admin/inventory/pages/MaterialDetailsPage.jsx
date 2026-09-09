import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Boxes, Plus, Save, Trash2 } from "lucide-react";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import { getSupplierOptions } from "@/modules/admin/suppliers/services/suppliersService";
import { MATERIAL_UNITS } from "../constants/inventoryConstants";
import { addMaterialBatch, deleteMaterialBatch, getMaterial, reorderMaterialBatches, updateMaterial, updateMaterialBatch, withdrawMaterial } from "../services/inventoryService";
import "./MaterialDetailsPage.css";

const dateValue = (value) => value ? String(value).slice(0, 10) : "";
const number = (value) => Number(value || 0);
const formatDate = (value) => value ? new Intl.DateTimeFormat("ar-EG").format(new Date(value)) : "—";
const apiMessage = (error, fallback) => error?.response?.data?.message || fallback;

function GeneralEditor({ material, onSaved }) {
  const [form, setForm] = useState({ name: material.name, unit: material.unit, supplierId: String(material.supplierId), minStockAlert: number(material.minStockAlert), expiryAlertDays: material.expiryAlertDays ?? "" });
  const suppliers = useQuery({ queryKey: ["suppliers", "options"], queryFn: getSupplierOptions, staleTime: 5 * 60 * 1000 });
  const mutation = useMutation({ mutationFn: (data) => updateMaterial(material.id, data), onSuccess: onSaved });
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  return <form className="edit-form-grid" onSubmit={(event) => { event.preventDefault(); mutation.mutate({ ...form, name:form.name.trim(), supplierId: Number(form.supplierId), minStockAlert: Number(form.minStockAlert), expiryAlertDays: form.expiryAlertDays === "" ? null : Number(form.expiryAlertDays) }); }}>
    <div className="edit-field"><label>اسم المادة</label><input className="mat-input" name="name" value={form.name} onChange={change} required /></div>
    <div className="edit-field"><label>وحدة القياس</label><select className="mat-input" name="unit" value={form.unit} onChange={change} disabled>{MATERIAL_UNITS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
    <div className="edit-field"><label>المورد</label><select className="mat-input" name="supplierId" value={form.supplierId} onChange={change} required>{(suppliers.data?.data || []).map((supplier) => <option value={supplier.id} key={supplier.id}>{supplier.name}</option>)}</select></div>
    <div className="edit-field"><label>الحد الأدنى للمخزون</label><input className="mat-input" name="minStockAlert" type="number" min="0" step="any" value={form.minStockAlert} onChange={change} required /></div>
    <div className="edit-field"><label>التنبيه قبل الصلاحية (أيام)</label><input className="mat-input" name="expiryAlertDays" type="number" min="0" value={form.expiryAlertDays} onChange={change} /></div>
    <div className="form-submit-cell"><button className="btn-save-edit" disabled={mutation.isPending}><Save size={15} />حفظ التعديلات</button></div>
    {mutation.isError && <p className="form-api-error grid-message">{apiMessage(mutation.error, "تعذر حفظ التعديلات")}</p>}
  </form>;
}

function BatchRow({ materialId, batch, unit, priorityCount, priorityPending, onPriorityChange, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ quantity: number(batch.quantity), pricePerUnit: number(batch.pricePerUnit), addedAt: dateValue(batch.addedAt), expiryDate: dateValue(batch.expiryDate), adjustmentReason: "" });
  const update = useMutation({ mutationFn: (data) => updateMaterialBatch(materialId, batch.id, data), onSuccess: () => { setEditing(false); onChanged(); } });
  const remove = useMutation({ mutationFn: () => deleteMaterialBatch(materialId, batch.id), onSuccess: onChanged });
  const consumed = Math.max(0, number(batch.initialQuantity) - number(batch.quantity));
  if (editing) return <tr className="batch-edit-row"><td colSpan="10"><div className="batch-edit-grid">
    <div className="edit-field"><label>الكمية المتاحة</label><input className="mat-input" type="number" min="0" step="any" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} /></div>
    <div className="edit-field"><label>سعر الوحدة</label><input className="mat-input" type="number" min="0" step="any" value={form.pricePerUnit} onChange={(e) => setForm((p) => ({ ...p, pricePerUnit: e.target.value }))} /></div>
    <div className="edit-field"><label>تاريخ الإضافة</label><input className="mat-input" type="date" value={form.addedAt} onChange={(e) => setForm((p) => ({ ...p, addedAt: e.target.value }))} /></div>
    <div className="edit-field"><label>تاريخ الصلاحية</label><input className="mat-input" type="date" value={form.expiryDate} onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))} /></div>
    {number(form.quantity) !== number(batch.quantity) && <div className="edit-field"><label>سبب تسوية الكمية</label><input className="mat-input" value={form.adjustmentReason} onChange={(e) => setForm((p) => ({ ...p, adjustmentReason: e.target.value }))} required /></div>}
    <div className="batch-edit-actions"><button className="btn-save-edit" onClick={() => update.mutate({ ...form, quantity: Number(form.quantity), pricePerUnit: Number(form.pricePerUnit), addedAt:form.addedAt || null, expiryDate:form.expiryDate || null, adjustmentReason:form.adjustmentReason.trim() })}>حفظ</button><button className="btn-cancel-edit" onClick={() => setEditing(false)}>إلغاء</button></div>
  </div>{update.isError && <p className="form-api-error">{apiMessage(update.error, "تعذر تعديل الدفعة")}</p>}</td></tr>;
  return <tr>
    <td data-label="الدفعة">#{batch.batchNumber || batch.id}</td><td data-label="الكمية الافتتاحية">{number(batch.initialQuantity)} {unit}</td><td data-label="الكمية المتاحة">{number(batch.quantity)} {unit}</td><td data-label="المستهلكة">{consumed} {unit}</td><td data-label="السعر">{number(batch.pricePerUnit).toFixed(2)}</td><td data-label="تاريخ الإضافة">{formatDate(batch.addedAt)}</td><td data-label="تاريخ الصلاحية">{formatDate(batch.expiryDate)}</td>
    <td data-label="أولوية السحب"><select aria-label={`أولوية سحب الدفعة ${batch.batchNumber || batch.id}`} className="priority-select" value={number(batch.withdrawalPriority)} disabled={priorityPending} onChange={(e) => onPriorityChange(batch.id, Number(e.target.value))}>{Array.from({ length: priorityCount }, (_, index) => index + 1).map((value) => <option value={value} key={value}>{value}</option>)}</select></td>
    <td data-label="الحالة"><span className={`stock-status ${number(batch.quantity) > 0 ? "available" : "empty"}`}>{number(batch.quantity) > 0 ? "متاحة" : "فارغة"}</span></td>
    <td data-label="الإجراءات" className="batch-actions-cell"><div className="action-buttons-group batch-actions"><button className="action-btn action-btn--blue text-action" onClick={() => setEditing(true)}>تعديل</button><button className="action-btn action-btn--red" aria-label="حذف الدفعة" onClick={() => window.confirm("حذف الدفعة؟") && remove.mutate()}><Trash2 size={14} /></button></div>{remove.isError && <small className="row-error">{apiMessage(remove.error, "تعذر الحذف")}</small>}</td>
  </tr>;
}

function MaterialDetailsPage() {
  const { id } = useParams(); const navigate = useNavigate(); const client = useQueryClient();
  const [batch, setBatch] = useState({ quantity: "", pricePerUnit: "", expiryDate: "", addedAt: new Date().toISOString().slice(0, 10) });
  const [withdraw, setWithdraw] = useState({ batchId: "", quantity: "", reason: "" });
  const query = useQuery({ queryKey: ["raw-material", id], queryFn: async () => (await getMaterial(id)).data });
  const material = query.data;
  const orderedBatches = useMemo(() => [...(material?.batches || [])].sort((a, b) => number(a.withdrawalPriority) - number(b.withdrawalPriority)), [material]);
  const displayedBatches = useMemo(() => [...(material?.batches || [])].sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt) || a.id - b.id), [material]);
  const refresh = () => { client.invalidateQueries({ queryKey: ["raw-material", id] }); client.invalidateQueries({ queryKey: ["raw-materials"] }); client.invalidateQueries({ queryKey: ["warnings"] }); client.invalidateQueries({ queryKey: ["withdrawals"] }); };
  const add = useMutation({ mutationFn: (data) => addMaterialBatch(id, data), onSuccess: () => { setBatch({ quantity: "", pricePerUnit: "", expiryDate: "", addedAt: new Date().toISOString().slice(0, 10) }); refresh(); } });
  const take = useMutation({ mutationFn: (data) => withdrawMaterial(id, data), onSuccess: () => { setWithdraw({ batchId: "", quantity: "", reason: "" }); refresh(); } });
  const reorder = useMutation({
    mutationFn: ({ batches }) => reorderMaterialBatches(id, batches),
    onSuccess: (response) => {
      const priorities = new Map((response.data || []).map((item) => [Number(item.id), Number(item.withdrawalPriority)]));
      client.setQueryData(["raw-material", id], (current) => current ? {
        ...current,
        batches: (current.batches || []).map((item) => priorities.has(Number(item.id))
          ? { ...item, withdrawalPriority: priorities.get(Number(item.id)) }
          : item),
      } : current);
      client.invalidateQueries({ queryKey: ["raw-materials"] });
    },
    onError: () => client.invalidateQueries({ queryKey: ["raw-material", id] }),
  });
  const changePriority = (batchId, nextPriority) => {
    const currentIndex = orderedBatches.findIndex((item) => item.id === batchId);
    const targetIndex = nextPriority - 1;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= orderedBatches.length || currentIndex === targetIndex || reorder.isPending) return;
    const next = [...orderedBatches];
    const [moved] = next.splice(currentIndex, 1);
    next.splice(targetIndex, 0, moved);
    const optimisticBatches = next.map((item, index) => ({ ...item, withdrawalPriority: index + 1 }));
    client.setQueryData(["raw-material", id], (current) => current ? { ...current, batches: optimisticBatches } : current);
    reorder.mutate({
      batches: optimisticBatches.map((item) => ({
        batchId: item.id,
        withdrawalPriority: item.withdrawalPriority,
      })),
    });
  };
  const selectedBatch = orderedBatches.find((item) => String(item.id) === String(withdraw.batchId));
  if (query.isLoading) return <div className="data-state">جاري التحميل...</div>;
  if (!material) return <div className="data-state data-state--error">تعذر تحميل المادة.</div>;
  return <div className="material-details-page"><PageHeader title={`تفاصيل المادة: ${material.name}`} breadcrumbs={["المخزون", "تفاصيل المادة"]} icon={Boxes} /><div className="material-details-container">
    <button className="btn-back-header" onClick={() => navigate("/admin/inventory")}><ArrowRight size={16} />رجوع</button>
    <section className="mat-general-card"><div className="mat-card-header"><div className="mat-card-title"><Boxes size={18} /><span>البيانات العامة</span></div></div><GeneralEditor material={material} onSaved={refresh} /></section>
    <section className="mat-general-card"><div className="mat-card-header"><div className="mat-card-title"><Plus size={18} /><span>إضافة دفعة</span></div></div><form className="edit-form-grid" onSubmit={(e) => { e.preventDefault(); add.mutate({ quantity: Number(batch.quantity), pricePerUnit: Number(batch.pricePerUnit), addedAt:batch.addedAt, expiryDate:batch.expiryDate || null }); }}>{[["quantity", "الكمية", "number"], ["pricePerUnit", "سعر الوحدة", "number"], ["addedAt", "تاريخ الإضافة", "date"], ["expiryDate", "تاريخ الصلاحية", "date"]].map(([name, label, type]) => <div className="edit-field" key={name}><label>{label}</label><input className="mat-input" type={type} min={type === "number" ? 0 : undefined} step={type === "number" ? "any" : undefined} value={batch[name]} onChange={(e) => setBatch((p) => ({ ...p, [name]: e.target.value }))} required={name !== "expiryDate"} /></div>)}<div className="form-submit-cell"><button className="btn-save-edit" disabled={add.isPending}>حفظ الدفعة</button></div>{add.isError && <p className="form-api-error grid-message">{apiMessage(add.error, "تعذر إضافة الدفعة")}</p>}</form></section>
    <section className="mat-general-card batches-card"><div className="mat-card-header"><div className="mat-card-title"><Boxes size={18} /><span>الدفعات وأولوية السحب</span></div><small className="priority-help">الصف ثابت للدفعة؛ غيّر الرقم وسيتم تحديث ترتيب الخصم، والأولوية 1 تُخصم أولًا</small></div><div className="table-scroll-hint">مرّر يمينًا أو يسارًا لعرض باقي الأعمدة</div><div className="table-responsive batches-responsive"><table className="custom-materials-table batches-table"><thead><tr><th>الدفعة</th><th>الافتتاحية</th><th>المتاحة</th><th>المستهلكة</th><th>السعر</th><th>الإضافة</th><th>الصلاحية</th><th>الأولوية</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody>{displayedBatches.map((item) => <BatchRow key={item.id} materialId={material.id} batch={item} unit={material.unit} priorityCount={orderedBatches.length} priorityPending={reorder.isPending} onPriorityChange={changePriority} onChanged={refresh} />)}</tbody></table></div>{reorder.isPending && <p className="priority-saving">جاري حفظ ترتيب السحب...</p>}{reorder.isError && <p className="form-api-error">{apiMessage(reorder.error, "تعذر حفظ ترتيب السحب")}</p>}</section>
    <section className="mat-general-card"><div className="mat-card-header"><div className="mat-card-title"><ArrowRight size={18} /><span>سحب يدوي من المخزون</span></div></div><form className="edit-form-grid" onSubmit={(e) => { e.preventDefault(); take.mutate({ batchId: Number(withdraw.batchId), quantity: Number(withdraw.quantity), reason:withdraw.reason.trim() }); }}>
      <div className="edit-field"><label>الدفعة</label><select className="mat-input" value={withdraw.batchId} onChange={(e) => setWithdraw((p) => ({ ...p, batchId: e.target.value }))} required><option value="">اختر الدفعة</option>{orderedBatches.filter((item) => number(item.quantity) > 0).map((item) => <option value={item.id} key={item.id}>#{item.batchNumber || item.id}</option>)}</select></div>
      <div className="edit-field"><label>الكمية المتاحة</label><input className="mat-input readonly-input" value={selectedBatch ? `${number(selectedBatch.quantity)} ${material.unit}` : "—"} readOnly /></div>
      <div className="edit-field"><label>الكمية المسحوبة</label><input className="mat-input" type="number" min="0.001" max={selectedBatch ? number(selectedBatch.quantity) : undefined} step="any" value={withdraw.quantity} onChange={(e) => setWithdraw((p) => ({ ...p, quantity: e.target.value }))} required /></div>
      <div className="edit-field"><label>سبب السحب</label><input className="mat-input" value={withdraw.reason} onChange={(e) => setWithdraw((p) => ({ ...p, reason: e.target.value }))} required /></div>
      <div className="form-submit-cell"><button className="btn-save-edit" disabled={take.isPending}>تأكيد السحب</button></div>{take.isError && <p className="form-api-error grid-message">{apiMessage(take.error, "تعذر تنفيذ السحب")}</p>}
    </form></section>
  </div></div>;
}
export default MaterialDetailsPage;
