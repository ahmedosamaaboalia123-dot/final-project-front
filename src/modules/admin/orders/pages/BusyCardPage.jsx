import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, Plus } from "lucide-react";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import { getAdminSocket } from "@/services/realtime";
import { getAdminOrder, getAvailableDelegates, handOverOrderToDelegate, updateAdminOrderStatus } from "../services/adminOrdersGateway";
import "../styles/BusyCardPage.css";

const statusText = { PENDING:"لم يتم التأكيد", CONFIRMED:"لم يتم التأكيد", PREPARING:"جاري التحضير", READY:"جاهز", ASSIGNED_TO_DELEGATE:"جاهز", OUT_FOR_DELIVERY:"جاهز", DELIVERED:"جاهز", COMPLETED:"جاهز", CANCELLED:"لم يتم التأكيد" };

export default function BusyCardPage() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("orders");
  const [error, setError] = useState("");
  const [delegates, setDelegates] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [confirmingItemId, setConfirmingItemId] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const load = useCallback(() => getAdminOrder(id).then(setOrder).catch((e) => setError(e.response?.data?.message || e.message)), [id]);

  useEffect(() => {
    load();
    const socket = getAdminSocket();
    // order:updated carries the full order — apply locally, no refetch.
    const apply = (payload) => { const incoming = payload?.order; if (incoming && Number(incoming.id) === Number(id)) { setOrder(incoming); setError(""); } };
    socket.on("order:updated", apply);
    const patchItem = (payload) => {
      if (Number(payload?.orderId) !== Number(id)) return;
      setOrder((current) => current && ({ ...current, status: payload.orderStatus || current.status,
        items: current.items.map((item) => Number(item.id) === Number(payload.itemId) ? { ...item, status: payload.status } : item) }));
    };
    socket.on("order:item:updated", patchItem);
    socket.on("connect", load);
    return () => { socket.off("order:updated", apply); socket.off("order:item:updated", patchItem); socket.off("connect", load); };
  }, [load, id]);

  const sectionPath = order?.fulfillmentType === "DINE_IN" ? `/admin/orders/tables/${order.table}`
    : type === "takeaway" ? "/admin/orders/takeaway" : "/admin/orders/online";

  const confirmCustomerOrder = async (item) => {
    if (order.channel !== "CUSTOMER_WEB" || order.status !== "PENDING" || item.status !== "PENDING" || confirmingItemId) return;
    setConfirmingItemId(item.id);
    try { setError(""); await updateAdminOrderStatus(order.id, "CONFIRMED"); navigate(sectionPath, { replace: true }); }
    catch (reason) { setError(reason.response?.data?.message || reason.message); }
    finally { setConfirmingItemId(null); }
  };

  const advance = async () => {
    if (advancing) return;
    setAdvancing(true);
    try {
      setError("");
      if (order.status === "READY" && order.fulfillmentType === "DELIVERY") {
        setDelegates(await getAvailableDelegates());
        setAssigning(true);
        return;
      }
      if (order.status === "READY" && order.fulfillmentType === "PICKUP") {
        await updateAdminOrderStatus(order.id, "COMPLETED");
        navigate("/admin/orders/online", { replace: true });
        return;
      }
      if (order.status === "PENDING") { await updateAdminOrderStatus(order.id, "CONFIRMED"); navigate(sectionPath, { replace: true }); }
    } catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setAdvancing(false); }
  };

  const assign = async (delegateId) => {
    try {
      await handOverOrderToDelegate(order.id, delegateId);
      setAssigning(false);
      navigate("/admin/orders/online", { replace: true });
    } catch (e) { setError(e.response?.data?.message || e.message); }
  };

  // إلغاء الطلب بالكامل: يعيد المخزون تلقائيًا ويشيله من كل القوائم عبر السوكيت
  const cancelOrder = async () => {
    if (cancelling) return;
    setCancelling(true);
    try {
      setError("");
      await updateAdminOrderStatus(order.id, "CANCELLED");
      navigate(-1);
    } catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setCancelling(false); setConfirmingCancel(false); }
  };

  if (!order) return <div className="busy-card-page">{error ? <p role="alert">{error}</p> : <p>جاري التحميل...</p>}</div>;

  const cardTitle = order.fulfillmentType === "DINE_IN" ? `طاولة ${order.table}` : `طلب ${order.orderNumber}`;
  const actionText = order.status === "READY"
    ? (order.fulfillmentType === "DELIVERY" ? "تسليم للمندوب" : "تسليم للعميل")
    : order.status === "PENDING" ? "تأكيد الطلب" : "تحديث الحالة";

  return (
    <div className="busy-card-page">
      <PageHeader title={`تفاصيل ${cardTitle}`} breadcrumbs={["الطلبات", cardTitle]} />
      {error && <p role="alert">{error}</p>}
      <div className="busy-card-header">
        <button className="btn-back" onClick={() => navigate(-1)}><ArrowRight />رجوع</button>
        <div className="card-title-box">
          <span className="card-title">{cardTitle}</span>
          {order.channel === "CUSTOMER_WEB" && <span className="card-badge-outside">من الخارج</span>}
          <span className="card-status">{statusText[order.status]}</span>
        </div>
      </div>

      <div className="busy-card-tabs">
        <button className={`tab-btn ${activeTab === "orders" ? "active" : ""}`} onClick={() => setActiveTab("orders")}>الطلبات ({order.items.length})</button>
        <button className={`tab-btn ${activeTab === "tracking" ? "active" : ""}`} onClick={() => setActiveTab("tracking")}>تتبع الطلب</button>
      </div>

      <div className="busy-card-content">
        {activeTab === "orders" ? (
          <div className="orders-list">
            <div className="order-card">
              <div className="order-card-header">
                <span className="order-number">طلب {order.orderNumber}</span>
                <span>{new Date(order.createdAt).toLocaleTimeString("ar-EG")}</span>
              </div>
              <div className="order-customer">{order.customerName || `طاولة ${order.table}`}</div>
              <div className="order-items">
                {order.items.map((item) => (
                  <div className="order-item" key={item.id}>
                    <div className="order-item-top">
                      <span className="item-qty">×{Number(item.quantity)}</span>
                      {order.channel === "CUSTOMER_WEB" && order.status === "PENDING" && item.status === "PENDING" && <button className="btn-toggle-status" disabled={Boolean(confirmingItemId)} onClick={() => confirmCustomerOrder(item)} aria-label="تأكيد الطلب الجديد" title="تأكيد الطلب"><CheckCircle2 /></button>}
                    </div>
                    <div className="order-item-info">
                      <span className="item-name">{item.product.name}</span>
                      <span className="item-variant">{item.typeName} - {item.sizeName || item.productSize.name}</span>
                    </div>
                    <div className="order-item-bottom">
                      <span className="item-price">{Number(item.totalPrice).toFixed(2)} ج.م</span>
                      <span className={`item-status ${item.status === "READY" ? "ready" : ""}`}>{statusText[item.status]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="tracking-card">
            <div className="tracking-grid">
              <div className="tracking-mini-card"><span>رقم الطلب</span><strong>{order.orderNumber}</strong></div>
              <div className="tracking-mini-card"><span>نوع الطلب</span><strong>{order.fulfillmentType === "DELIVERY" ? "توصيل" : order.fulfillmentType === "PICKUP" ? "تيك أواي" : "طاولة"}</strong></div>
              {order.channel === "CUSTOMER_WEB" && <div className="tracking-mini-card"><span>رقم الهاتف</span><strong>{order.phone || "—"}</strong></div>}
              <div className="tracking-mini-card"><span>الحالة</span><strong>{statusText[order.status]}</strong></div>
              {order.delegate && <div className="tracking-mini-card"><span>المندوب</span><strong>{order.delegate.name}</strong></div>}
            </div>
            {order.statusHistory?.length > 0 && (
              <div className="tracking-steps">
                {order.statusHistory.map((step) => (
                  <div className="tracking-step-card" key={step.id}>
                    <strong>{statusText[step.toStatus]}</strong>
                    <span>{new Date(step.createdAt).toLocaleString("ar-EG")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="busy-card-footer">
        {order.fulfillmentType === "DINE_IN" && (
          <button className="btn-create-order" onClick={() => navigate(`/admin/orders/sales/table/${order.table}`)}><Plus />إضافة طلب للطاولة</button>
        )}
        <div className="total-amount">
          <span>الإجمالي المستحق:</span>
          <strong>{Number(order.total).toFixed(2)} ج.م</strong>
        </div>
        {((order.channel === "CUSTOMER_WEB" && order.status === "PENDING") || order.status === "READY") && (
          <>
            <button className="btn-cancel-order" disabled={advancing || cancelling} onClick={() => setConfirmingCancel(true)}>{cancelling ? "جاري الإلغاء..." : "إلغاء الطلب"}</button>
            <button className="btn-finish" disabled={advancing} onClick={advance}>{advancing ? "جاري..." : actionText}</button>
          </>
        )}
      </div>

      {confirmingCancel && (
        <div className="delegate-dialog" role="dialog" aria-modal="true">
          <div className="delegate-dialog__content">
            <h3>تأكيد إلغاء الطلب</h3>
            <p>سيتم إرجاع كل المخزون المحجوز وحذف الطلب من جميع الشاشات. هل تريد المتابعة؟</p>
            <button onClick={cancelOrder} disabled={cancelling}>{cancelling ? "جاري الإلغاء..." : "نعم، إلغاء الطلب"}</button>
            <button onClick={() => setConfirmingCancel(false)} disabled={cancelling}>تراجع</button>
          </div>
        </div>
      )}

      {assigning && (
        <div className="delegate-dialog" role="dialog" aria-modal="true">
          <div className="delegate-dialog__content">
            <h3>تسليم الطلب للمندوب</h3>
            {delegates.length ? delegates.map((delegate) => (
              <button key={delegate.id} onClick={() => assign(delegate.id)}>{delegate.name} — {delegate.phone}</button>
            )) : <p>لا يوجد مندوب متاح للتسليم حاليًا</p>}
            <button onClick={() => setAssigning(false)}>إلغاء</button>
          </div>
        </div>
      )}

    </div>
  );
}
