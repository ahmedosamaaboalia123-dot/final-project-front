import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  PlusCircle, Trash2, Package, FileText, XCircle, Archive, Check,
  Eye, Ban, Printer, Loader2, AlertTriangle, Building2, CalendarDays, CreditCard
} from "lucide-react";
import SearchableMaterialSelect from "./SearchableMaterialSelect";
import {
  getSupplierOptions, getMaterialOptions, getPurchase,
  createPurchase, createGroupedPurchase, updatePurchase, getPurchasePreview, approvePurchase, cancelPurchase
} from "../services/purchasesService";

const round2 = (v) => Math.round((Number(v || 0) + Number.EPSILON) * 100) / 100;

const fmt = (v) => Number(v || 0).toLocaleString("ar-EG", { minimumFractionDigits: 2 });

function CreateInvoiceTab({ editId, onDoneEdit, onSaved }) {
  const queryClient = useQueryClient();
  const isEditing = Boolean(editId);

  const [supplierId, setSupplierId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [shippingCost, setShippingCost] = useState("0");
  const [paidAmount, setPaidAmount] = useState("0");
  const [items, setItems] = useState([]);

  const [openRowId, setOpenRowId] = useState(null);
  const [message, setMessage] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [confirmApprove, setConfirmApprove] = useState(false);

  const suppliersQuery = useQuery({
    queryKey: ["purchase-suppliers"],
    queryFn: getSupplierOptions,
    staleTime: 5 * 60 * 1000,
  });
  const suppliers = suppliersQuery.data?.data || [];

  const materialsQuery = useQuery({
    queryKey: ["purchase-materials"],
    queryFn: getMaterialOptions,
    staleTime: 5 * 60 * 1000,
  });
  const materials = materialsQuery.data?.data || [];

  const materialsForSelect = useMemo(() => materials
    .filter((m) => !supplierId || Number(m.supplierId) === Number(supplierId))
    .map((m) => ({
    id: m.id,
    name: m.name,
    unit: m.unit,
    unitPrice: 0,
  })), [materials, supplierId]);
  const supplierBreakdown = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      const material = materials.find((entry) => entry.id === item.rawMaterialId);
      const supplier = suppliers.find((entry) => entry.id === material?.supplierId);
      const key = supplier?.id || 0;
      if (!map.has(key)) map.set(key, { supplierName: supplier?.name || "بدون مورد", items: 0, total: 0 });
      const row = map.get(key); row.items += 1; row.total += Number(item.quantity || 0) * Number(item.pricePerUnit || 0);
    });
    return [...map.values()];
  }, [items, materials, suppliers]);

  const editQuery = useQuery({
    queryKey: ["purchase", editId],
    queryFn: () => getPurchase(editId),
    enabled: isEditing,
  });

  useEffect(() => {
    if (!editQuery.data) return;
    const p = editQuery.data.data;
    setSupplierId(String(p.supplierId));
    setInvoiceNo(p.invoiceNo);
    setInvoiceDate((p.invoiceDate || "").split("T")[0]);
    setPaymentMethod(p.paymentMethod || "CASH");
    setNotes(p.notes || "");
    setDiscount(String(p.discount ?? 0));
    setTax(String(p.tax ?? 0));
    setShippingCost(String(p.shippingCost ?? 0));
    setPaidAmount(String(p.paidAmount ?? 0));
    setItems((p.items || []).map((it) => ({
      id: it.id,
      rawMaterialId: it.rawMaterialId,
      name: it.rawMaterial?.name || "",
      unit: it.purchaseUnit ? "BUNDLE" : "",
      bundleUnits: it.purchaseUnit ? Number(it.unitsPerPurchaseUnit || 1) : "",
      quantity: Number(it.quantity),
      pricePerUnit: Number(it.pricePerUnit),
      expiryDate: it.expiryDate ? (it.expiryDate || "").split("T")[0] : "",
      addedAt: it.addedAt ? (it.addedAt || "").split("T")[0] : new Date().toISOString().split("T")[0],
      batchNumber: it.batchNumber || "",
      batchNotes: it.batchNotes || "",
      idKey: it.id,
    })));
  }, [editQuery.data]);

  const totals = useMemo(() => {
    const subtotal = round2(items.reduce((s, it) => s + Number(it.quantity || 0) * Number(it.pricePerUnit || 0), 0));
    const d = round2(Math.max(Number(discount || 0), 0));
    const t = round2(Math.max(Number(tax || 0), 0));
    const sh = round2(Math.max(Number(shippingCost || 0), 0));
    const total = round2(subtotal - d + t + sh);
    const finalTotal = round2(Math.max(total, 0));
    const paid = round2(Math.max(Number(paidAmount || 0), 0));
    const remaining = round2(finalTotal - paid);
    return { subtotal, total, finalTotal, paid, remaining };
  }, [items, discount, tax, shippingCost, paidAmount]);

  const showError = (err) => setMessage({ type: "error", text: err?.response?.data?.message || err?.message || "حدث خطأ" });
  const showOk = (text) => setMessage({ type: "ok", text });

  const saveDraft = useMutation({
    mutationFn: (payload) => (isEditing ? updatePurchase(editId, payload) : createGroupedPurchase(payload)),
    onSuccess: (res) => {
      showOk("تم حفظ المسودة بنجاح");
      onSaved?.(isEditing ? res.data.id : null);
      if (!isEditing) queryClient.invalidateQueries({ queryKey: ["purchases"] });
      else queryClient.invalidateQueries({ queryKey: ["purchase", editId] });
    },
    onError: showError,
  });

  const doPreview = useMutation({
    mutationFn: () => getPurchasePreview(editId),
    onSuccess: (res) => setPreviewData(res.data),
    onError: showError,
  });

  const doApprove = useMutation({
    mutationFn: () => approvePurchase(editId),
    onSuccess: (res) => {
      showOk("تم اعتماد الفاتورة وأصبحت بانتظار إدخال المخزون");
      setConfirmApprove(false);
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-groups"] });
      queryClient.invalidateQueries({ queryKey: ["raw-materials"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      onDoneEdit?.();
    },
    onError: showError,
  });

  const doCancel = useMutation({
    mutationFn: () => cancelPurchase(editId),
    onSuccess: (res) => {
      showOk("تم إلغاء الفاتورة");
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      onDoneEdit?.();
    },
    onError: showError,
  });

  const unitOptionsFor = (material) => {
    if (!material) return [{ value: "", label: "—" }];
    if (material.unit) {
      return [{ value: material.unit, label: material.unit }, { value: "BUNDLE", label: `باقة (كل باقة ${material.unit})` }];
    }
    return [{ value: "", label: "وحدة" }];
  };

  const startNew = () => {
    if (items.length > 0 && !window.confirm("سيتم مسح بيانات الفاتورة الحالية. متابعة؟")) return;
    onDoneEdit?.();
    setSupplierId("");
    setInvoiceNo("");
    setItems([]);
    setDiscount("0"); setTax("0"); setShippingCost("0"); setPaidAmount("0");
    setNotes(""); setMessage(null); setPreviewData(null);
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    const rowId = openRowId;
    if (!rowId) { showError(new Error("اختر مادة خام أولاً")); return; }
    const material = materials.find((m) => m.id === Number(rowId));
    if (!material) return;
    setItems((prev) => [
      ...prev,
      { id: `r${Date.now()}`, rawMaterialId: material.id, name: material.name, unit: material.unit, bundleUnits: "", quantity: 1, pricePerUnit: 0, addedAt: new Date().toISOString().split("T")[0], expiryDate: "", batchNumber: "", batchNotes: "", unitOptions: unitOptionsFor(material) },
    ]);
    setOpenRowId(null);
  };

  const updateItem = (id, field, value) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));

  const buildPayload = () => {
    if (!invoiceNo.trim()) throw new Error("رقم الفاتورة مطلوب");
    if (items.length === 0) throw new Error("أضف مادة واحدة على الأقل");
    if (Number(paidAmount || 0) > totals.finalTotal) throw new Error("المدفوع لا يمكن أن يتجاوز الإجمالي النهائي");

    const mapped = items.map((it) => ({
      rawMaterialId: it.rawMaterialId,
      quantity: Number(it.quantity) || 0,
      pricePerUnit: Number(it.pricePerUnit) || 0,
      ...(it.unit === "BUNDLE" ? { purchaseUnit: materials.find((m) => m.id === it.rawMaterialId)?.unit || "piece", unitsPerPurchaseUnit: Number(it.bundleUnits) || 1 } : {}),
    }));

    return {
      invoiceNo: invoiceNo.trim(),
      ...(isEditing ? { supplierId: Number(supplierId) } : {}),
      invoiceDate,
      paymentMethod,
      notes,
      discount: Number(discount || 0),
      tax: Number(tax || 0),
      shippingCost: Number(shippingCost || 0),
      paidAmount: Number(paidAmount || 0),
      items: mapped,
    };
  };

  const handleSave = () => {
    try { saveDraft.mutate(buildPayload()); } catch (err) { showError(err); }
  };

  const unitLabel = (it) => {
    const m = materials.find((mm) => mm.id === it.rawMaterialId);
    return it.unit === "BUNDLE" ? `باقة (${Number(it.bundleUnits || 1)}×${m?.unit || "unit"})` : (m?.unit || "unit");
  };

  return (
    <div className="create-invoice-tab">
      {message && (
        <div className={`form-feedback ${message.type === "ok" ? "ok" : "error"}`}>
          {message.type === "ok" ? <Check size={16} /> : <AlertTriangle size={16} />}
          <span>{message.text}</span>
          <button type="button" className="feedback-close" onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      <div className="top-action-bar">
        <button type="button" className="create-invoice-main-btn" onClick={startNew}>
          <PlusCircle size={18} />
          <span>فاتورة جديدة</span>
        </button>
        {isEditing && (
          <span className="editing-badge">
            <FileText size={16} />
            تعديل فاتورة {editQuery.data?.data?.invoiceNo}
          </span>
        )}
      </div>

      <div className="active-invoice-container">
        <div className="invoice-top-side-by-side">
          <div className="invoice-input-card">
            <div className="card-section-title"><FileText size={18} /><h3>بيانات الفاتورة</h3></div>

            <div className="form-row-grid invoice-header-grid">
              <div className="form-group flex-1">
                <label className="form-label"><Building2 size={13} /> المورد</label>
                <select className="purchases-input purchases-select" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} disabled={isEditing}>
                  <option value="">كل الموردين</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group flex-1">
                <label className="form-label"><FileText size={13} /> رقم الفاتورة</label>
                <input type="text" className="purchases-input" placeholder="INV-..." value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
              </div>
              <div className="form-group flex-1">
                <label className="form-label"><CalendarDays size={13} /> التاريخ</label>
                <input type="date" className="purchases-input" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
              </div>
              <div className="form-group flex-1">
                <label className="form-label"><CreditCard size={13} /> طريقة الدفع</label>
                <select className="purchases-input purchases-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="CASH">كاش</option>
                  <option value="CARD">بطاقة</option>
                  <option value="BANK_TRANSFER">تحويل بنكي</option>
                  <option value="TRANSFER">تحويل بنكي</option>
                </select>
              </div>
              <div className="form-group flex-1 invoice-notes-group">
                <label className="form-label">ملاحظات</label>
                <input type="text" className="purchases-input" placeholder="ملاحظات اختيارية" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>

            <div className="card-section-title"><Package size={18} /><h3>إدخال المواد</h3></div>
            <form onSubmit={handleAddItem} className="search-material-form">
              <div className="form-row-grid">
                <div className="form-group flex-2">
                  <label className="form-label">المادة الخام</label>
                  <SearchableMaterialSelect
                    materials={materialsForSelect}
                    selectedMaterialId={openRowId ? String(openRowId) : ""}
                    onSelectMaterial={(id) => setOpenRowId(id || null)}
                  />
                </div>
                <div className="form-group flex-btn">
                  <button type="submit" className="add-material-btn"><PlusCircle size={16} /><span>إضافة</span></button>
                </div>
              </div>
            </form>
          </div>

          <div className="invoice-summary-card">
            <div className="card-section-title"><Package size={18} /><h3>ملخص الفاتورة</h3></div>
            <div className="summary-metrics">
              <div className="metric-item"><span className="metric-label">عدد المواد:</span><span className="metric-value">{items.length} مادة</span></div>
              <div className="metric-item"><span className="metric-label">الإجمالي (البنود):</span><span className="metric-value">{fmt(totals.subtotal)} ج.م</span></div>
              <div className="metric-item"><span className="metric-label">الخصم:</span><span className="metric-value">- {fmt(totals.total <= totals.subtotal ? Number(discount || 0) : 0)} ج.م</span></div>
              <div className="metric-item"><span className="metric-label">الضريبة + النقل:</span><span className="metric-value">+ {fmt(Number(tax || 0) + Number(shippingCost || 0))} ج.م</span></div>
              <div className="metric-item highlight-item"><span className="metric-label">الإجمالي النهائي:</span><span className="metric-value amount">{fmt(totals.finalTotal)} ج.م</span></div>
              <div className="metric-item"><span className="metric-label">المدفوع:</span><span className="metric-value">{fmt(totals.paid)} ج.م</span></div>
              <div className="metric-item"><span className="metric-label">المتبقي:</span><span className={`metric-value ${totals.remaining > 0 ? "remaining-negative" : ""}`}>{fmt(totals.remaining)} ج.م</span></div>
            </div>
          </div>
        </div>

        <div className="invoice-items-table-card">
          <div className="table-header-title">
            <h3>المواد المضافـة</h3>
            <span className="items-count-badge">{items.length} عنصر</span>
          </div>

          <div className="table-responsive">
            <table className="purchases-table invoice-items-editable">
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>م</th>
                  <th className="text-right">المادة</th>
                  <th className="text-right">المورد</th>
                  <th style={{ minWidth: "90px" }}>الكمية</th>
                  <th style={{ minWidth: "120px" }}>الوحدة</th>
                  <th style={{ minWidth: "90px" }}>سعر الوحدة</th>
                  <th>الإجمالي</th>
                  <th style={{ width: "60px" }}></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan="8" className="empty-table-cell">لا توجد مواد مضافة بعد. اختر مادة من الأعلى لإضافتها.</td></tr>
                ) : items.map((it, idx) => (
                  <tr key={it.id}>
                    <td>{idx + 1}</td>
                    <td className="text-right font-bold-name">{it.name}</td>
                    <td className="text-right">{suppliers.find((supplier) => supplier.id === materials.find((material) => material.id === it.rawMaterialId)?.supplierId)?.name || "—"}</td>
                    <td>
                      <input type="number" min="0.01" step="any" className="purchases-input cell-input" value={it.quantity}
                        onChange={(e) => updateItem(it.id, "quantity", e.target.value)} />
                    </td>
                    <td>
                      <div className="cell-unit-wrap">
                        <select className="purchases-input purchases-select cell-input" value={it.unit}
                          onChange={(e) => updateItem(it.id, "unit", e.target.value)}>
                          {unitOptionsFor(materials.find((m) => m.id === it.rawMaterialId)).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        {it.unit === "BUNDLE" && (
                          <input type="number" min="1" step="1" className="purchases-input cell-input bundle-input" placeholder="عدد الوحدات/باقة"
                            value={it.bundleUnits} onChange={(e) => updateItem(it.id, "bundleUnits", e.target.value)} title="عدد الوحدات في كل باقة" />
                        )}
                      </div>
                    </td>
                    <td>
                      <input type="number" min="0" step="any" className="purchases-input cell-input" value={it.pricePerUnit}
                        onChange={(e) => updateItem(it.id, "pricePerUnit", e.target.value)} />
                    </td>
                    <td className="font-bold">{fmt(Number(it.quantity || 0) * Number(it.pricePerUnit || 0))}</td>
                    <td>
                      <button type="button" className="action-btn cancel-item-btn" title="حذف المادة" onClick={() => removeItem(it.id)}>
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {supplierBreakdown.length > 0 && <div className="supplier-breakdown"><div className="supplier-breakdown-title">الفواتير التي سيتم إنشاؤها تلقائيًا</div><div className="supplier-breakdown-grid">{supplierBreakdown.map((row) => <div className="supplier-breakdown-card" key={row.supplierName}><strong>{row.supplierName}</strong><span>{row.items} مادة</span><b>{fmt(row.total)} ج.م</b></div>)}</div></div>}

          <div className="invoice-financial-grid">
            <div className="form-group">
              <label className="form-label">الخصم</label>
              <input type="number" min="0" step="any" className="purchases-input" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">الضريبة</label>
              <input type="number" min="0" step="any" className="purchases-input" value={tax} onChange={(e) => setTax(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">مصاريف النقل</label>
              <input type="number" min="0" step="any" className="purchases-input" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">المدفوع الآن</label>
              <input type="number" min="0" step="any" className="purchases-input" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} />
            </div>
          </div>

          <div className="invoice-bottom-actions">
            <button type="button" className="invoice-action-btn cancel-invoice-btn" onClick={startNew}>
              <XCircle size={18} /><span>إغلاق</span>
            </button>

            <button type="button" className="invoice-action-btn archive-invoice-btn" onClick={handleSave} disabled={saveDraft.isPending}>
              {saveDraft.isPending ? <Loader2 size={18} className="spin" /> : <Archive size={18} />}
              <span>{isEditing ? "حفظ التعديلات" : "حفظ المسودة"}</span>
            </button>

            {isEditing && (
              <>
                <button type="button" className="invoice-action-btn preview-invoice-btn" onClick={() => doPreview.mutate()} disabled={doPreview.isPending}>
                  <Eye size={18} /><span>معاينة الأثر</span>
                </button>
                <button type="button" className="invoice-action-btn approve-invoice-btn" onClick={() => setConfirmApprove(true)} disabled={doApprove.isPending}>
                  <Check size={18} /><span>اعتماد الفاتورة</span>
                </button>
                <button type="button" className="invoice-action-btn cancel-invoice-red-btn"
                  onClick={() => { if (window.confirm("إلغاء الفاتورة؟")) doCancel.mutate(); }} disabled={doCancel.isPending}>
                  <Ban size={18} /><span>إلغاء الفاتورة</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {previewData && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setPreviewData(null); }}>
          <div className="preview-modal-content">
            <div className="modal-header">
              <div className="modal-header-title"><Eye size={18} /><h2>معاينة أثر الاعتماد</h2></div>
              <button type="button" className="close-modal-btn" onClick={() => setPreviewData(null)}>×</button>
            </div>
            <div className="modal-body">
              {!previewData.valid ? (
                <div className="form-feedback error"><AlertTriangle size={16} /><span>لا يمكن الاعتماد حالياً:</span>
                  <ul>{previewData.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                </div>
              ) : (
                <>
                  <p className="preview-ok-line"><Check size={16} /> الفاتورة جاهزة للاعتماد ولا توجد مشاكل.</p>
                  <div className="preview-section-title">الدفعات التي ستُضاف للمخزون</div>
                  {previewData.impact.inventory.map((b, i) => (
                    <div className="preview-batch-row" key={i}>
                      <span className="font-bold-name">{b.material}</span>
                      <span>{fmt(b.quantity)} {previewData.purchase.materialUnit || "وحدة"}</span>
                      <span>{fmt(b.pricePerUnit)} ج.م</span>
                      {b.batchNumber && <span>دفعة #{b.batchNumber}</span>}
                      {b.expiryDate && <span>حتى {b.expiryDate.split("T")[0]}</span>}
                    </div>
                  ))}
                  <div className="preview-section-title">أثر حساب المورد</div>
                  <div className="preview-batch-row">
                    <span>يُضاف للمديونية:</span><span className="amount">{fmt(previewData.impact.supplier.addition)} ج.م</span>
                  </div>
                  <div className="preview-batch-row">
                    <span>المدفوع:</span><span className="amount">{fmt(previewData.impact.supplier.paid)} ج.م</span>
                  </div>
                  <div className="preview-batch-row">
                    <span>المتبقي:</span><span className="amount">{fmt(previewData.impact.supplier.remaining)} ج.م</span>
                  </div>
                  <button type="button" className="invoice-action-btn approve-invoice-btn preview-confirm-btn"
                    onClick={() => { setPreviewData(null); setConfirmApprove(true); }}>
                    <Check size={18} /><span>تأكيد الاعتماد</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmApprove && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setConfirmApprove(false); }}>
          <div className="preview-modal-content">
            <div className="modal-header">
              <div className="modal-header-title"><AlertTriangle size={18} /><h2>تأكيد الاعتماد</h2></div>
              <button type="button" className="close-modal-btn" onClick={() => setConfirmApprove(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="preview-ok-line">سيتم أرشفة الفاتورة وترحيل المديونية لحساب المورد، وبعدها تُدخل البنود للمخزون كل بند على حدة.</p>
              <div className="confirm-actions-row">
                <button type="button" className="invoice-action-btn approve-invoice-btn" onClick={() => doApprove.mutate()} disabled={doApprove.isPending}>
                  {doApprove.isPending ? <Loader2 size={18} className="spin" /> : <Check size={18} />}
                  <span>{doApprove.isPending ? "جارٍ الاعتماد..." : "اعتماد نهائي"}</span>
                </button>
                <button type="button" className="invoice-action-btn cancel-invoice-btn" onClick={() => setConfirmApprove(false)}>تراجع</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="print-area" style={{ display: "none" }}>
          <button type="button" onClick={() => window.print()}><Printer size={16} /> طباعة</button>
        </div>
      )}
    </div>
  );
}

export default CreateInvoiceTab;
