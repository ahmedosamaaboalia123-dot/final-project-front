import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Plus, FileText } from "lucide-react";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import { useRealtimeOrders } from "../hooks/useRealtimeOrders";
import TableInvoiceModal from "../components/TableInvoiceModal";
import "../styles/TableSummary.css";

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

export default function TableSummaryPage() {
  const { tableNumber } = useParams();
  const navigate = useNavigate();
  const { orders, error, refresh } = useRealtimeOrders({ fulfillmentType: "DINE_IN" });

  const [showInvoice, setShowInvoice] = useState(false);

  const tableOrders = useMemo(() => {
    return orders.filter(
      (o) => Number(o.table) === Number(tableNumber) && !["COMPLETED", "CANCELLED"].includes(o.status)
    );
  }, [orders, tableNumber]);

  const allItems = useMemo(() => tableOrders.flatMap((o) => o.items || []), [tableOrders]);
  const total = allItems.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);

  return (
    <div className="table-summary-page">
      <PageHeader
        title={`طاولة ${tableNumber}`}
        breadcrumbs={["الطلبات", "الطاولات", `طاولة ${tableNumber}`]}
      />

      {error && <p role="alert" className="table-summary-error">{error}</p>}

      <div className="table-summary-header">
        <button className="btn-back" onClick={() => navigate("/admin/orders/tables")}>
          <ArrowRight size={14} /> رجوع
        </button>
        <span className="table-summary-count">{tableOrders.length} طلب نشط</span>
      </div>

      <div className="table-summary-orders">
        {tableOrders.length === 0 ? (
          <div className="table-summary-empty">لا توجد طلبات نشطة — الطاولة فارغة</div>
        ) : (
          tableOrders.map((order) => (
            <div className="table-order-card" key={order.id}>
              <div className="table-order-card__top">
                <span className="table-order-card__number">طلب {order.orderNumber}</span>
                <span className={`table-order-card__status table-order-card__status--${order.status}`}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>
              <div className="table-order-card__meta">
                <span>{(order.items || []).length} منتج</span>
                <span>{Number(order.total || 0).toFixed(2)} ج.م</span>
              </div>
              <button
                className="btn-track"
                onClick={() => navigate(`/admin/orders/tables/${tableNumber}/order/${order.id}/track`)}
              >
                تتبع الطلب
              </button>
            </div>
          ))
        )}
      </div>

      <div className="table-summary-actions">
        <button
          className="btn-table-action btn-table-action--invoice"
          disabled={tableOrders.length === 0}
          onClick={() => setShowInvoice(true)}
        >
          <FileText size={15} /> تأكيد
        </button>
        <button
          className="btn-table-action btn-table-action--new"
          onClick={() => navigate(`/admin/orders/sales/table/${tableNumber}`)}
        >
          <Plus size={15} /> إنشاء طلب آخر
        </button>
      </div>

      {showInvoice && (
        <TableInvoiceModal
          orders={tableOrders}
          allItems={allItems}
          total={total}
          tableNumber={tableNumber}
          onClose={() => setShowInvoice(false)}
          onDone={() => {
            setShowInvoice(false);
            refresh();
            navigate("/admin/orders/tables");
          }}
        />
      )}
    </div>
  );
}
