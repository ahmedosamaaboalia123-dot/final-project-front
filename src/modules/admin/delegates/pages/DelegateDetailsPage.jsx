import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Phone, Truck, User, MessageCircle, ClipboardList } from "lucide-react";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import apiClient from "@/services/apiClient";
import { getAdminSocket } from "@/services/realtime";
import "./DelegateDetailsPage.css";

const delegateStatusText = { AVAILABLE: "متاح", UNAVAILABLE: "غير متاح" };
const orderStatusText = {
  PENDING: "جديد",
  CONFIRMED: "تم التأكيد",
  PREPARING: "جاري التحضير",
  READY: "جاهز",
  ASSIGNED_TO_DELEGATE: "تم تعيين المندوب",
  OUT_FOR_DELIVERY: "خرج للتوصيل",
  DELIVERED: "تم التسليم",
  COMPLETED: "تم التسليم",
  CANCELLED: "ملغي",
};

const formatDate = (value) => {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return String(value);
  }
};

const formatMoney = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return `${num.toFixed(2)} ر.س`;
};

const orderAddress = (order) => {
  if (order?.deliveryAddress && typeof order.deliveryAddress === "object") {
    return order.deliveryAddress.address || order.deliveryAddress.street || "—";
  }
  return "—";
};

export default function DelegateDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [delegate, setDelegate] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/delegates/${id}`);
      setDelegate(res?.data || null);
      setError("");
    } catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    load();
    const socket = getAdminSocket();
    const onOrderUpdated = (payload) => { if (payload?.order?.delegateId === Number(id)) load(); };
    socket.on("order:updated", onOrderUpdated);
    return () => socket.off("order:updated", onOrderUpdated);
  }, [load, id]);

  const orders = Array.isArray(delegate?.orders) ? delegate.orders : [];

  const openOrder = (order) => {
    if (!order?.id) return;
    navigate(`/admin/orders/busy/online/${order.id}`);
  };

  return (
    <div className="delegate-details-page">
      <PageHeader
        title={delegate ? `${delegate.name} — المندوب` : "الصفحة الشخصية للمندوب"}
        breadcrumbs={["الإدارة", "المناديب", delegate?.name || ""]}
        icon={Truck}
      />

      <div className="delegate-details-content">
        <button className="dd-back" onClick={() => navigate("/admin/delegates")}>
          <ArrowRight size={18} /> العودة لقائمة المناديب
        </button>

        {error && <p className="dd-error" role="alert">{error}</p>}

        {loading && <p className="dd-hint">جاري التحميل...</p>}

        {!loading && !delegate && !error && <p className="dd-hint">لم يتم العثور على المندوب.</p>}

        {delegate && (
          <>
            <section className="dd-profile">
              <div className="dd-profile__avatar"><User size={30} /></div>
              <div className="dd-profile__main">
                <h2>{delegate.name}</h2>
                <span className={`delegate-status delegate-status--${(delegate.status || "").toLowerCase()}`}>
                  {delegateStatusText[delegate.status] || delegate.status}
                </span>
              </div>
              <div className="dd-profile__fields">
                <div className="dd-field"><Phone size={18} /><span className="dd-field__label">الهاتف</span><strong>{delegate.phone || "—"}</strong></div>
                <div className="dd-field"><MessageCircle size={18} /><span className="dd-field__label">واتساب</span><strong>{delegate.whatsapp || "—"}</strong></div>
                <div className="dd-field"><ClipboardList size={18} /><span className="dd-field__label">الطلبات</span><strong>{orders.length} طلب</strong></div>
              </div>
            </section>

            <section className="dd-orders">
              <div className="dd-orders__header">
                <h2>الطلبات المستلمة من قسم الطلبات</h2>
                <span>{orders.length} طلب</span>
              </div>

              <div className="dd-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>رقم الطلب</th>
                      <th>العميل</th>
                      <th>العنوان</th>
                      <th>الإجمالي</th>
                      <th>الحالة</th>
                      <th>التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan="6" className="dd-empty">لا توجد طلبات لهذا المندوب</td>
                      </tr>
                    )}
                    {orders.map((order) => (
                      <tr key={order.id} className="dd-order-row" onClick={() => openOrder(order)}>
                        <td>{order.orderNumber || `#${order.id}`}</td>
                        <td>{order.customerName || "—"}</td>
                        <td>{orderAddress(order)}</td>
                        <td>{formatMoney(order.total)}</td>
                        <td>
                          <span className={`dd-order-status dd-order-status--${(order.status || "").toLowerCase()}`}>
                            {orderStatusText[order.status] || order.status}
                          </span>
                        </td>
                        <td>{formatDate(order.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="dd-note">اضغط على أي طلب لفتحه في قسم الطلبات ومتابعة التوصيل.</p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
