import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import { getAdminSocket } from "@/services/realtime";
import { getAdminOrder } from "../services/adminOrdersGateway";
import "../styles/TableOrderTrack.css";

const STATUS_LABELS = {
  PENDING: "لم يتم التأكيد",
  CONFIRMED: "لم يتم التأكيد",
  PREPARING: "جاري التحضير",
  READY: "جاهز",
};

export default function TableOrderTrackPage() {
  const { tableNumber, orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(
    () =>
      getAdminOrder(orderId)
        .then(setOrder)
        .catch((e) => setError(e.response?.data?.message || e.message)),
    [orderId]
  );

  useEffect(() => {
    load();
    const socket = getAdminSocket();
    const apply = (payload) => {
      const incoming = payload?.order;
      if (incoming && Number(incoming.id) === Number(orderId)) setOrder(incoming);
    };
    const patchItem = (payload) => {
      if (Number(payload?.orderId) !== Number(orderId)) return;
      setOrder((current) => current && ({ ...current, status: payload.orderStatus || current.status,
        items: current.items.map((item) => Number(item.id) === Number(payload.itemId) ? { ...item, status: payload.status } : item) }));
    };
    socket.on("order:updated", apply);
    socket.on("order:item:updated", patchItem);
    socket.on("connect", load);
    return () => {
      socket.off("order:updated", apply);
      socket.off("order:item:updated", patchItem);
      socket.off("connect", load);
    };
  }, [load, orderId]);

  if (!order && !error) return <p className="track-loading">جاري التحميل...</p>;
  if (error) return <p role="alert" className="track-error">{error}</p>;

  const orderStatus =
    order.status === "READY"
      ? "جاهز"
      : order.status === "COMPLETED"
      ? "مكتمل"
      : "جاري التحضير";

  const readyCount = (order.items || []).filter((i) => i.status === "READY").length;
  const totalItems = (order.items || []).length;

  return (
    <div className="track-page">
      <PageHeader
        title={`تتبع طلب ${order.orderNumber}`}
        breadcrumbs={["الطلبات", "الطاولات", `طاولة ${tableNumber}`, "تتبع"]}
      />

      <div className="track-header">
        <button
          className="btn-back"
          onClick={() => navigate(`/admin/orders/tables/${tableNumber}`)}
        >
          <ArrowRight size={14} /> رجوع
        </button>
        <div className="track-header__info">
          <span className="track-order-num">طلب {order.orderNumber}</span>
          <span className={`track-order-status track-order-status--${order.status}`}>
            {orderStatus}
          </span>
        </div>
        <span className="track-progress">{readyCount}/{totalItems} جاهز</span>
      </div>

      <div className="track-items">
        {(order.items || []).map((item) => {
          const isReady = item.status === "READY";
          return (
            <div className={`track-item ${isReady ? "track-item--ready" : ""}`} key={item.id}>
              <div className="track-item__info">
                <strong className="track-item__name">{item.product?.name}</strong>
                <span className="track-item__variant">{item.typeName} - {item.sizeName || item.productSize?.name}</span>
                <span className="track-item__qty">×{Number(item.quantity)}</span>
              </div>
              <span className={`track-item__badge ${isReady ? "track-item__badge--ready" : ""}`}>
                {isReady && <Check size={12} />}
                {isReady ? "جاهز" : "جاري التحضير"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="track-total">
        <span>الإجمالي</span>
        <strong>{Number(order.total || 0).toFixed(2)} ج.م</strong>
      </div>
    </div>
  );
}
