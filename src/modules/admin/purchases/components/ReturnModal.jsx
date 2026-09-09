import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  X, Loader2, Check, AlertTriangle, RotateCcw, PackageX
} from "lucide-react";
import {
  getPurchaseReturnContext, getPurchaseReturns, createPurchaseReturn
} from "../services/purchasesService";

const fmt = (v) => Number(v || 0).toLocaleString("ar-EG", { minimumFractionDigits: 2 });

function ReturnModal({ purchaseId, onClose }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);
  const [generalReason, setGeneralReason] = useState("");
  const [qtyInputs, setQtyInputs] = useState({});
  const [reasons, setReasons] = useState({});

  const contextQuery = useQuery({
    queryKey: ["purchase-return-context", purchaseId],
    queryFn: () => getPurchaseReturnContext(purchaseId),
  });

  const returnsQuery = useQuery({
    queryKey: ["purchase-returns", purchaseId],
    queryFn: () => getPurchaseReturns(purchaseId),
  });

  const items = contextQuery.data?.data?.items || [];
  const purchase = contextQuery.data?.data?.purchase;

  useEffect(() => {
    if (contextQuery.data) {
      const init = {};
      items.forEach((it) => { init[it.purchaseItemId] = ""; });
      setQtyInputs(init);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextQuery.data]);

  const totals = useMemo(() => {
    let qty = 0;
    let value = 0;
    items.forEach((it) => {
      const q = Number(qtyInputs[it.purchaseItemId] || 0);
      if (q > 0) {
        qty += q;
        value += q * (Number(it.stockPricePerUnit) || 0);
      }
    });
    return { qty, value };
  }, [items, qtyInputs]);

  const submitted = useMutation({
    mutationFn: () => {
      const payloadItems = items
        .map((it) => ({
          purchaseItemId: it.purchaseItemId,
          quantity: Number(qtyInputs[it.purchaseItemId] || 0),
          reason: reasons[it.purchaseItemId]?.trim() || undefined,
        }))
        .filter((it) => it.quantity > 0);

      return createPurchaseReturn(purchaseId, {
        generalReason: generalReason.trim() || undefined,
        items: payloadItems,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["purchase", purchaseId] });
      queryClient.invalidateQueries({ queryKey: ["raw-materials"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      onClose();
    },
    onError: (e) => setError(`err:${e?.response?.data?.message || e?.message}`),
  });

  const handleSubmit = () => {
    if (totals.qty <= 0) { setError("err:أدخل كمية مرتجع واحدة على الأقل"); return; }
    if (window.confirm(`تأكيد إرجاع ${fmt(totals.qty)} بوحدات بقيمة ${fmt(totals.value)} ج.م؟ سينقص المخزون ويُرصد استرداد للمورد.`)) {
      submitted.mutate();
    }
  };

  const isLoading = contextQuery.isLoading || returnsQuery.isLoading;

  if (isLoading) {
    return (
      <div className="modal-overlay">
        <div className="preview-modal-content loading-box"><Loader2 size={22} className="spin" /> جارٍ تحميل بيانات المرتجع...</div>
      </div>
    );
  }

  const hasReturns = (returnsQuery.data?.data?.returns || []).length > 0;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="preview-modal-content invoice-view-modal">
        <div className="modal-header">
          <div className="modal-header-title">
            <RotateCcw size={16} />
            <h2>مرتجع فاتورة {purchase?.invoiceNo || ""}</h2>
            <span className="inv-status-pill draft">مرتجع</span>
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
          {contextQuery.isError ? (
            <div className="form-feedback error"><AlertTriangle size={16} /><span>{contextQuery.error?.response?.data?.message || "تعذر تحميل بيانات المرتجع"}</span></div>
          ) : (
            <>
              {(purchase?.status === "FULLY_RETURNED" || items.every((it) => it.returnableQuantity <= 0)) && (
                <div className="form-feedback error"><AlertTriangle size={16} /><span>لا توجد كميات قابلة للإرجاع في هذه الفاتورة</span></div>
              )}

              <div className="preview-section-title">البنود القابلة للإرجاع</div>
              <div className="modal-table-container">
                <table className="purchases-table return-table">
                  <thead>
                    <tr>
                      <th>م</th>
                      <th className="text-right">المادة</th>
                      <th>الدفعة</th>
                      <th>تم إرجاعه</th>
                      <th>المتاح</th>
                      <th>القيمة</th>
                      <th>المرتجع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, i) => (
                      <tr key={it.purchaseItemId}>
                        <td>{i + 1}</td>
                        <td className="text-right font-bold-name">{it.materialName || "—"}</td>
                        <td>{it.batchNumber || "—"}</td>
                        <td>{fmt(it.returnedQuantity)} {it.unit}</td>
                        <td className="font-bold">{fmt(it.returnableQuantity)} {it.unit}</td>
                        <td>{fmt(it.stockPricePerUnit)} / {it.unit}</td>
                        <td>
                          <div className="return-qty-cell">
                            <input
                              type="number"
                              className="form-input return-qty-input"
                              min="0"
                              max={it.returnableQuantity}
                              step="any"
                              value={qtyInputs[it.purchaseItemId] || ""}
                              onChange={(e) => setQtyInputs((s) => ({ ...s, [it.purchaseItemId]: e.target.value }))}
                              placeholder="0"
                            />
                          </div>
                          <input
                            type="text"
                            className="form-input return-reason-input"
                            value={reasons[it.purchaseItemId] || ""}
                            onChange={(e) => setReasons((s) => ({ ...s, [it.purchaseItemId]: e.target.value }))}
                            placeholder="سبب المرتجع"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="form-group">
                <label className="form-label">سبب عام للإرجاع</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={generalReason}
                  onChange={(e) => setGeneralReason(e.target.value)}
                  placeholder="سبب عام (اختياري)"
                />
              </div>

              <div className="invoice-view-totals">
                <div className="summary-metrics">
                  <div className="metric-item highlight-item"><span className="metric-label">إجمالي الكمية المرتجعة:</span><span className="metric-value amount">{fmt(totals.qty)}</span></div>
                  <div className="metric-item highlight-item"><span className="metric-label">قيمة الاسترداد:</span><span className="metric-value amount">{fmt(totals.value)} ج.م</span></div>
                </div>
              </div>

              {hasReturns && (
                <>
                  <div className="preview-section-title">مرتجعات سابقة</div>
                  {(returnsQuery.data?.data?.returns || []).map((r) => (
                    <div className="preview-batch-row" key={r.id}>
                      <span className="font-bold-name">{r.returnNo}</span>
                      <span>{fmt(r.totalQuantity)}</span>
                      <span>{fmt(r.totalValue)} ج.م</span>
                      <span>{r.returnDate?.split("T")[0]}</span>
                      {r.generalReason && <span>{r.generalReason}</span>}
                    </div>
                  ))}
                </>
              )}

              <div className="invoice-view-actions">
                <button type="button" className="invoice-action-btn preview-invoice-btn" onClick={onClose}>
                  <X size={16} /><span>إغلاق</span>
                </button>
                <button
                  type="button"
                  className="invoice-action-btn approve-invoice-btn"
                  onClick={handleSubmit}
                  disabled={submitted.isPending || items.every((it) => it.returnableQuantity <= 0)}
                >
                  {submitted.isPending ? <Loader2 size={16} className="spin" /> : <PackageX size={16} />}
                  <span>تسجيل المرتجع {submitted.isPending ? "..." : ""}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReturnModal;