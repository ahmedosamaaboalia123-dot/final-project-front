import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Printer, Loader2, Check, Ban, Pencil, Trash2, AlertTriangle, Building2, CalendarDays, Hash, Wallet
} from "lucide-react";
import {
  getPurchase, approvePurchase, cancelPurchase, deletePurchase, receivePurchaseItem
} from "../services/purchasesService";
const visibleStatus = (status) => status === "DRAFT" ? "مسودة" : "جاهزة";

const fmt = (v) => Number(v || 0).toLocaleString("ar-EG", { minimumFractionDigits: 2 });

function ReceiptItemPanel({ purchaseId, item, onReceived }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    quantity: Number(item.stockQuantity || item.quantity || 0),
    pricePerUnit: Number(item.stockPricePerUnit || item.pricePerUnit || 0),
    addedAt: new Date().toISOString().slice(0, 10), expiryDate: "", batchNumber: "",
  });
  const mutation = useMutation({ mutationFn: () => receivePurchaseItem(purchaseId, item.id, { ...form, quantity: Number(form.quantity), pricePerUnit: Number(form.pricePerUnit) }), onSuccess: onReceived });
  if (item.createdBatchId) return <div className="received-item-state"><Check size={14} />تم الإدخال<br/><small>دفعة #{item.createdBatch?.batchNumber || item.createdBatchId}</small></div>;
  if (!open) return <button type="button" className="receive-item-btn" onClick={() => setOpen(true)}>إدخال للمخزون</button>;
  return <div className="receipt-item-panel"><div className="receipt-grid">
    <label>الكمية<input type="number" min="0.001" step="any" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} /></label>
    <label>سعر الوحدة<input type="number" min="0" step="any" value={form.pricePerUnit} onChange={(e) => setForm((p) => ({ ...p, pricePerUnit: e.target.value }))} /></label>
    <label>تاريخ الإضافة<input type="date" value={form.addedAt} onChange={(e) => setForm((p) => ({ ...p, addedAt: e.target.value }))} /></label>
    <label>تاريخ الصلاحية<input type="date" value={form.expiryDate} onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))} /></label>
    <label>رقم الدفعة<input value={form.batchNumber} onChange={(e) => setForm((p) => ({ ...p, batchNumber: e.target.value }))} required /></label>
  </div><div className="receipt-actions"><button type="button" className="receive-confirm-btn" disabled={mutation.isPending || !form.batchNumber.trim()} onClick={() => mutation.mutate()}>تأكيد الإدخال</button><button type="button" className="receive-cancel-btn" onClick={() => setOpen(false)}>إلغاء</button></div>{mutation.isError && <small className="receipt-error">{mutation.error?.response?.data?.message || "تعذر إدخال البند"}</small>}</div>;
}

function InvoiceViewModal({ purchaseId, onClose, onEditRequest }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);

  const purchaseQuery = useQuery({
    queryKey: ["purchase", purchaseId],
    queryFn: () => getPurchase(purchaseId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["purchases"] });
    queryClient.invalidateQueries({ queryKey: ["purchase-groups"] });
    queryClient.invalidateQueries({ queryKey: ["purchase", purchaseId] });
    queryClient.invalidateQueries({ queryKey: ["raw-materials"] });
    queryClient.invalidateQueries({ queryKey: ["suppliers"] });
  };

  const approve = useMutation({
    mutationFn: () => approvePurchase(purchaseId),
    onSuccess: () => { invalidate(); setError("ok:تم اعتماد الفاتورة وأصبحت بانتظار إدخال المخزون"); },
    onError: (e) => setError(`err:${e?.response?.data?.message || e?.message}`),
  });

  const cancel = useMutation({
    mutationFn: () => cancelPurchase(purchaseId),
    onSuccess: () => { invalidate(); setError("ok:تم إلغاء الفاتورة"); },
    onError: (e) => setError(`err:${e?.response?.data?.message || e?.message}`),
  });

  const remove = useMutation({
    mutationFn: () => deletePurchase(purchaseId),
    onSuccess: () => { invalidate(); onClose(); },
    onError: (e) => setError(`err:${e?.response?.data?.message || e?.message}`),
  });
  const handleReceived = () => { invalidate(); purchaseQuery.refetch(); };

  if (purchaseQuery.isLoading) {
    return (
      <div className="modal-overlay">
        <div className="preview-modal-content loading-box"><Loader2 size={22} className="spin" /> جارٍ تحميل الفاتورة...</div>
      </div>
    );
  }

  if (purchaseQuery.isError) {
    return (
      <div className="modal-overlay">
        <div className="preview-modal-content">
          <div className="form-feedback error"><AlertTriangle size={16} /><span>{purchaseQuery.error?.response?.data?.message || "تعذر تحميل الفاتورة"}</span></div>
          <button type="button" className="invoice-action-btn cancel-invoice-btn" onClick={onClose}>إغلاق</button>
        </div>
      </div>
    );
  }

  const p = purchaseQuery.data.data;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="preview-modal-content invoice-view-modal">
        <div className="modal-header">
          <div className="modal-header-title">
            <Hash size={16} />
            <h2>فاتورة {p.invoiceNo}</h2>
            <span className={`inv-status-pill ${p.status === "DRAFT" ? "draft" : "ready"}`}>{visibleStatus(p.status)}</span>
          </div>
          <button type="button" className="close-modal-btn" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className={`form-feedback ${error.startsWith("ok:") ? "ok" : "error"}`}>
            {error.startsWith("ok:") ? <Check size={16} /> : <AlertTriangle size={16} />}
            <span>{error.replace(/^(ok|err):/, "")}</span>
          </div>
        )}

        <div className="modal-body">
          <div className="invoice-view-meta">
            <div className="meta-item"><Building2 size={15} /><span>المورد:</span><strong>{p.supplier?.name}</strong></div>
            <div className="meta-item"><CalendarDays size={15} /><span>التاريخ:</span><strong>{(p.invoiceDate || "").split("T")[0]}</strong></div>
            <div className="meta-item"><Wallet size={15} /><span>الدفع:</span><strong>{p.paymentMethod || "CASH"}</strong></div>
            {p.notes && <div className="meta-item"><span>ملاحظات:</span><strong>{p.notes}</strong></div>}
          </div>

          <div className="modal-table-container">
            <table className="purchases-table">
              <thead>
                <tr>
                  <th>م</th>
                  <th className="text-right">المادة</th>
                  <th>الكمية</th>
                  <th>سعر الوحدة</th>
                  <th>الإجمالي</th>
                  <th>الدفعة</th>
                  <th>الانتهاء</th>
                  <th>إدخال المخزون</th>
                </tr>
              </thead>
              <tbody>
                {(p.items || []).map((it, i) => (
                  <tr key={it.id}>
                    <td>{i + 1}</td>
                    <td className="text-right font-bold-name">{it.rawMaterial?.name || it.name || "—"}</td>
                    <td>{fmt(it.quantity)} {it.unit || ""}</td>
                    <td>{fmt(it.pricePerUnit)}</td>
                    <td className="font-bold">{fmt(it.totalPrice)}</td>
                    <td>{it.batchNumber || "—"}</td>
                    <td>{it.expiryDate ? it.expiryDate.split("T")[0] : "—"}</td>
                    <td className="receipt-cell">{["PENDING_RECEIPT", "PARTIALLY_RECEIVED", "RECEIVED"].includes(p.status) ? <ReceiptItemPanel purchaseId={p.id} item={it} onReceived={handleReceived} /> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="invoice-view-totals">
            <div className="summary-metrics">
              <div className="metric-item"><span className="metric-label">الإجمالي:</span><span className="metric-value">{fmt(p.total)} ج.م</span></div>
              <div className="metric-item"><span className="metric-label">الضريبة:</span><span className="metric-value">{fmt(p.tax)} ج.م</span></div>
              <div className="metric-item"><span className="metric-label">النقل:</span><span className="metric-value">{fmt(p.shippingCost)} ج.م</span></div>
              <div className="metric-item highlight-item"><span className="metric-label">الإجمالي النهائي:</span><span className="metric-value amount">{fmt(p.finalTotal)} ج.م</span></div>
              <div className="metric-item"><span className="metric-label">المدفوع:</span><span className="metric-value">{fmt(p.paidAmount)} ج.م</span></div>
              <div className="metric-item"><span className="metric-label">المتبقي:</span><span className="metric-value">{fmt(p.remainingBalance)} ج.م</span></div>
            </div>
          </div>

          {["APPROVED", "RECEIVED", "PARTIALLY_RETURNED", "FULLY_RETURNED"].includes(p.status) && p.inventoryMovements?.length > 0 && (
            <>
              <div className="preview-section-title">دفعات المخزون المسجلة</div>
              {(p.inventoryMovements || []).map((mv) => (
                <div className="preview-batch-row" key={mv.id}>
                  <span className="font-bold-name">{mv.rawMaterial?.name || "—"}</span>
                  <span>+{fmt(mv.quantity)} {mv.batch?.unit || ""}</span>
                  <span>{fmt(mv.totalCost)} ج.م</span>
                  {mv.batch?.expiryDate && <span>حتى {mv.batch.expiryDate.split("T")[0]}</span>}
                </div>
              ))}
            </>
          )}

          {p.statusHistory?.length > 0 && (
            <>
              <div className="preview-section-title">مسار الحالة</div>
              <div className="status-timeline">
                {p.statusHistory.map((h, i) => (
                  <div className="status-timeline-item" key={i}>
                    <span className="timeline-check"><Check size={13} /></span>
                    <div>
                      <strong>{visibleStatus(h.toStatus)}</strong>
                      <span className="timeline-meta">
                        {h.fromStatus ? `من ${visibleStatus(h.fromStatus)}` : "بداية"} · {new Date(h.createdAt).toLocaleString("ar-EG")}
                        {h.userName ? ` · ${h.userName}` : ""}
                      </span>
                      {h.notes && <span className="timeline-meta"> · {h.notes}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="invoice-view-actions">
            <button type="button" className="invoice-action-btn preview-invoice-btn" onClick={() => window.print()}>
              <Printer size={16} /><span>طباعة</span>
            </button>

            {p.status === "DRAFT" && (
              <>
                {!p.groupId && <button type="button" className="invoice-action-btn preview-invoice-btn" onClick={() => onEditRequest(p.id)}>
                  <Pencil size={16} /><span>تعديل</span>
                </button>}
                <button type="button" className="invoice-action-btn approve-invoice-btn"
                  onClick={() => { if (window.confirm("اعتماد الفاتورة وأرشفتها؟ سيتم ترحيل المديونية ثم إدخال البنود للمخزون بشكل منفصل.")) approve.mutate(); }}>
                  <Check size={16} /><span>اعتماد</span>
                </button>
                {!p.groupId && <button type="button" className="invoice-action-btn cancel-invoice-btn"
                  onClick={() => { if (window.confirm("إلغاء الفاتورة؟")) cancel.mutate(); }}>
                  <Ban size={16} /><span>إلغاء</span>
                </button>}
                {!p.groupId && <button type="button" className="invoice-action-btn cancel-invoice-red-btn"
                  onClick={() => { if (window.confirm("حذف الفاتورة نهائيًا؟")) remove.mutate(); }}>
                  <Trash2 size={16} /><span>حذف</span>
                </button>}
              </>
            )}

          </div>
        </div>
      </div>

    </div>
  );
}

export default InvoiceViewModal;
