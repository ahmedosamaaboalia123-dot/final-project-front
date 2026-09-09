import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, ExternalLink, RefreshCw, XCircle } from "lucide-react";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import { useRealtimeOrders } from "../hooks/useRealtimeOrders";
import { updateAdminOrderStatus } from "../services/adminOrdersGateway";
import "../styles/IncomingOnlineOrdersPage.css";
import "../styles/Screen.css";

const statusText = { PENDING: "لم يتم التأكيد" };

export default function IncomingOnlineOrdersPage() {
  const navigate = useNavigate();
  const { orders, loading, error, refresh } = useRealtimeOrders({ channel: "CUSTOMER_WEB", status: "PENDING", pageSize: 50 });
  const [confirmingId, setConfirmingId] = useState(null);
  const [confirmError, setConfirmError] = useState("");

  const confirm = async (order) => {
    if (confirmingId) return;
    setConfirmingId(order.id);
    setConfirmError("");
    try {
      await updateAdminOrderStatus(order.id, "CONFIRMED");
      // On success the order moves to PREPARING; realtime filters remove it from this screen.
    } catch (e) {
      setConfirmError(e.response?.data?.message || e.message);
    } finally {
      setConfirmingId(null);
    }
  };

  const cancel = async (order) => {
    if (confirmingId) return;
    if (!window.confirm(`إلغاء الطلب رقم ${order.orderNumber}؟`)) return;
    setConfirmingId(order.id);
    setConfirmError("");
    try {
      await updateAdminOrderStatus(order.id, "CANCELLED");
    } catch (e) {
      setConfirmError(e.response?.data?.message || e.message);
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="online-screen incoming-screen">
      <PageHeader title="طلبات من الخارج (بانتظار التأكيد)" breadcrumbs={["الطلبات", "من الخارج"]} />
      <div className="screen-content">
        {(error || confirmError) && <p role="alert">{error || confirmError}</p>}
        <div className="incoming-toolbar">
          <span className="incoming-count">{orders.length} طلب وارد</span>
          <button className="incoming-refresh" onClick={refresh} disabled={loading}><RefreshCw />تحديث</button>
        </div>

        {orders.length === 0 ? (
          <div className="incoming-empty">
            <Clock size={40} />
            <p>{loading ? "جاري التحميل..." : "لا توجد طلبات واردة بانتظار التأكيد حالياً"}</p>
          </div>
        ) : (
          <div className="incoming-grid">
            {orders.map((order) => (
              <div className="incoming-card" key={order.id}>
                <div className="incoming-card__head">
                  <span className="incoming-badge">من الخارج</span>
                  <span className="incoming-status">{statusText[order.status] || order.status}</span>
                </div>
                <div className="incoming-card__title">
                  <strong>طلب {order.orderNumber}</strong>
                  <button
                    className="incoming-open"
                    title="عرض التفاصيل"
                    onClick={() => navigate(`/admin/orders/busy/online/${order.id}`)}
                  >
                    <ExternalLink size={16} />
                  </button>
                </div>
                <div className="incoming-row">
                  <span>{order.customerName || "عميل"}</span>
                  <span className="incoming-phone">{order.phone || "—"}</span>
                </div>
                <div className="incoming-meta">
                  <span>{order.fulfillmentType === "DELIVERY" ? "توصيل" : "تيك أواي"}</span>
                  <span>{order.items?.length || 0} منتج</span>
                  <span>{Number(order.total || 0).toFixed(2)} ج.م</span>
                </div>
                <div className="incoming-meta incoming-time">
                  <span>{new Date(order.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</span>
                  <span>{new Date(order.createdAt).toLocaleDateString("ar-EG")}</span>
                </div>
                <div className="incoming-actions">
                  <button
                    className="incoming-confirm"
                    disabled={confirmingId === order.id}
                    onClick={() => confirm(order)}
                  >
                    <CheckCircle2 size={18} />{confirmingId === order.id ? "جاري التأكيد..." : "تأكيد الطلب"}
                  </button>
                  <button
                    className="incoming-cancel"
                    disabled={confirmingId === order.id}
                    onClick={() => cancel(order)}
                  >
                    <XCircle size={18} />إلغاء
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}