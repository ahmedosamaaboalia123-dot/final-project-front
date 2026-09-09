import { useState } from "react";
import { X, FileText, Check } from "lucide-react";
import { closeAdminTable } from "../services/adminOrdersGateway";
import useSafeTransition from "../hooks/useSafeTransition";
import "../styles/TableInvoiceModal.css";

const STATUS_LABELS = {
  PENDING: "لم يتم التأكيد",
  CONFIRMED: "لم يتم التأكيد",
  PREPARING: "جاري التحضير",
  READY: "جاهز",
  ASSIGNED_TO_DELEGATE: "جاهز",
  OUT_FOR_DELIVERY: "جاهز",
  DELIVERED: "جاهز",
  COMPLETED: "جاهز",
  CANCELLED: "لم يتم التأكيد",
};

export default function TableInvoiceModal({ orders, allItems, total, tableNumber, onClose, onDone }) {
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState("");
  const { guard, inFlight } = useSafeTransition("table-invoice");

  const activeItems = (allItems || []).filter((it) => it.status !== "CANCELLED");
  const allReady = activeItems.length > 0 && activeItems.every((it) => it.status === "READY");
  const notReadyCount = activeItems.filter((it) => it.status !== "READY").length;

  const confirmInvoice = () => {
    if (!allReady) return;
    guard(async () => {
      setClosing(true);
      setError("");
      try {
        await closeAdminTable(tableNumber);
        onDone();
      } catch (e) {
        setError(e.response?.data?.message || e.message);
        setClosing(false);
      }
    });
  };

  return (
    <div className="tiv-overlay" onClick={onClose}>
      <div className="tiv-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tiv-modal__header">
          <div className="tiv-modal__title">
            <FileText size={16} />
            <h3>فاتورة طاولة {tableNumber}</h3>
          </div>
          <button className="tiv-modal__close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {error && <p role="alert" className="tiv-error">{error}</p>}

        {!allReady && (
          <p className="tiv-warning">لا يمكن تأكيد الطاولة قبل تجهيز كل المنتجات ({notReadyCount} منتج لم يُجهّز)</p>
        )}

        <div className="tiv-modal__body">
          {/* ملخص الطلبات */}
          <div className="tiv-section">
            <span className="tiv-section__label">الطلبات ({orders.length})</span>
            {orders.map((o) => (
              <div className="tiv-order-row" key={o.id}>
                <span className="tiv-order-row__num">طلب {o.orderNumber}</span>
                <span className={`tiv-order-row__status tiv-order-row__status--${o.status}`}>
                  {STATUS_LABELS[o.status] || o.status}
                </span>
              </div>
            ))}
          </div>

          {/* جميع المنتجات */}
          <div className="tiv-section">
            <span className="tiv-section__label">المنتجات ({activeItems.length})</span>
            <div className="tiv-items-list">
              {activeItems.map((item, idx) => {
                const isReady = item.status === "READY";
                return (
                  <div className={`tiv-item ${isReady ? "tiv-item--ready" : ""}`} key={item.id || idx}>
                    <div className="tiv-item__info">
                      <strong className="tiv-item__name">{item.product?.name || item.name}</strong>
                      <span className="tiv-item__variant">{item.typeName || ""}</span>
                    </div>
                    <span className="tiv-item__qty">×{Number(item.quantity)}</span>
                    <span className={`tiv-item__badge ${isReady ? "tiv-item__badge--ready" : ""}`}>
                      {isReady && <Check size={12} />}
                      {isReady ? "جاهز" : "جاري التحضير"}
                    </span>
                    <span className="tiv-item__price">{Number(item.totalPrice).toFixed(2)} ج.م</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* الإجمالي */}
          <div className="tiv-total">
            <span>الإجمالي</span>
            <strong>{total.toFixed(2)} ج.م</strong>
          </div>
        </div>

        <div className="tiv-modal__footer">
          <button className="tiv-cancel" onClick={onClose}>إلغاء</button>
          <button
            className="tiv-confirm"
            disabled={!allReady || inFlight || closing}
            onClick={confirmInvoice}
            title={allReady ? "" : "جهّز كل المنتجات أولًا"}
          >
            {closing ? "جاري الإغلاق..." : allReady ? "تأكيد وإغلاق الطاولة" : "بانتظار تجهيز المنتجات"}
          </button>
        </div>
      </div>
    </div>
  );
}
