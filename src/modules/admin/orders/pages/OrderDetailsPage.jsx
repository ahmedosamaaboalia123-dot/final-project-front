import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Check, Trash2 } from "lucide-react";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import { getAdminOrder, updateAdminOrderItemStatus, updateAdminOrderStatus } from "../services/adminOrdersGateway";
import { getAdminSocket } from "@/services/realtime";
import { getProductCatalog, buildMaterialsLookup, enrichOrderItemMaterials } from "../services/adminProductsService";
import useSafeTransition from "../hooks/useSafeTransition";
import "../styles/OrderDetailsPage.css";

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [confirmingCancel, setConfirmingCancel] = useState(null);
  const [confirmingOrderCancel, setConfirmingOrderCancel] = useState(false);
  const { guard, guardKeyed, isKeyed } = useSafeTransition(`item-${orderId}`);

  const load = useCallback(
    () =>
      getAdminOrder(orderId)
        .catch((e) => e.response?.data?.message || e.message)
        .then(async (result) => {
          if (typeof result === "string") {
            setError(result);
            return;
          }
          const catalog = await getProductCatalog({ includeMaterials: true });
          const lookup = buildMaterialsLookup(catalog.products, catalog.materials);
          setOrder(enrichOrderItemMaterials(result, lookup));
          setError("");
        }),
    [orderId]
  );

  useEffect(() => {
    load();
    const socket = getAdminSocket();
    const patchItem = (payload) => {
      if (Number(payload?.orderId) !== Number(orderId)) return;
      setOrder((current) => current && ({ ...current, status: payload.orderStatus || current.status,
        items: current.items.map((item) => Number(item.id) === Number(payload.itemId) ? { ...item, status: payload.status } : item) }));
    };
    // order:updated carries the full order — apply locally, no refetch.
    const applyUpdated = async (payload) => {
      if (Number(payload?.order?.id) !== Number(orderId)) return;
      if (payload.order.status === "CANCELLED") {
        navigate("/admin/orders/preparation");
        return;
      }
      const catalog = await getProductCatalog({ includeMaterials: true }).catch(() => null);
      const lookup = catalog ? buildMaterialsLookup(catalog.products, catalog.materials) : null;
      setOrder((current) => (lookup ? enrichOrderItemMaterials(payload.order, lookup) : payload.order));
      setError("");
    };
    socket.on("order:item:updated", patchItem);
    socket.on("order:updated", applyUpdated);
    socket.on("connect", load);
    return () => {
      socket.off("order:item:updated", patchItem);
      socket.off("order:updated", applyUpdated);
      socket.off("connect", load);
    };
  }, [load, orderId]);

  // تم التحضير: نضمن أن الطلب في مرحلة التحضير (مخزون مضمون) ثم نجهّز هذا العنصر
  const markReady = (item) => {
    guardKeyed(`ready-${item.id}`, async () => {
      if (item.status === "READY") return;
      const previous = order;
      setOrder((current) => ({ ...current, items: current.items.map((row) => row.id === item.id ? { ...row, status: "READY" } : row) }));
      try { await updateAdminOrderItemStatus(order.id, item.id, "READY"); }
      catch (error) {
        setOrder(previous);
        setError(error?.response?.data?.message || error?.message || "تعذر التحضير — تأكد من تأكيد الطلب");
      }
    });
  };

  // إلغاء المنتج: يحذفه نهائيًا (backend يرجع المخزون ويحدّث الإجماليات)
  const cancelItem = (item) => {
    guardKeyed(`cancel-${item.id}`, async () => {
      const previous = order;
      setOrder((current) => ({ ...current, items: current.items.map((row) => row.id === item.id ? { ...row, status: "CANCELLED" } : row) }));
      try {
        const result = await updateAdminOrderItemStatus(order.id, item.id, "CANCELLED");
        if (result?.data?.orderStatus === "CANCELLED") { navigate("/admin/orders/preparation"); return; }
      }
      catch (error) {
        setOrder(previous);
        setError(error?.response?.data?.message || error?.message || "تعذر إلغاء المنتج");
      }
      setConfirmingCancel(null);
    });
  };

  // إلغاء الطلب بالكامل (يعيد المخزون تلقائيًا ويشيله من كل القوائم)
  const cancelOrder = () => {
    guardKeyed("order-cancel", async () => {
      try {
        await updateAdminOrderStatus(order.id, "CANCELLED");
        navigate("/admin/orders/preparation");
      } catch (error) {
        setError(error?.response?.data?.message || error?.message || "تعذر إلغاء الطلب");
      }
    });
  };

  if (!order) return (
    <div className="od-page">
      <PageHeader title="تفاصيل الطلب" breadcrumbs={["التحضير", orderId]} />
      {error && <p role="alert" className="od-error">{error}</p>}
      {!error && <p className="od-loading">جاري التحميل...</p>}
      <button className="btn-back" onClick={() => navigate("/admin/orders/preparation")}><ArrowRight size={14} /> رجوع لقسم التحضير</button>
    </div>
  );

  const activeItems = (order.items || []).filter((i) => i.status !== "CANCELLED");
  const readyCount = activeItems.filter((i) => i.status === "READY").length;
  const totalItems = activeItems.length;

  return (
    <div className="od-page">
      <PageHeader title={`الطلب ${order.orderNumber}`} breadcrumbs={["التحضير", order.orderNumber]} />
      {error && <p role="alert" className="od-error">{error}</p>}

      <div className="od-toolbar">
        <button className="btn-back" onClick={() => navigate("/admin/orders/preparation")}>
          <ArrowRight size={14} /> رجوع
        </button>
        <span className="od-progress">{readyCount}/{totalItems} جاهز</span>
        {["PENDING", "CONFIRMED", "PREPARING", "READY"].includes(order.status) && (
          <button
            className="od-cancel-order"
            disabled={isKeyed("order-cancel")}
            onClick={() => setConfirmingOrderCancel(true)}
          >
            {isKeyed("order-cancel") ? "جاري الإلغاء..." : "إلغاء الطلب"}
          </button>
        )}
      </div>

      {confirmingOrderCancel && (
        <div className="od-card__cancel-confirm">
          <span>تأكيد إلغاء الطلب بالكامل وإرجاع مخزونه؟</span>
          <div className="od-card__cancel-actions">
            <button className="od-cancel-no" disabled={isKeyed("order-cancel")} onClick={() => setConfirmingOrderCancel(false)}>تراجع</button>
            <button className="od-cancel-yes" disabled={isKeyed("order-cancel")} onClick={cancelOrder}>{isKeyed("order-cancel") ? "جاري..." : "تأكيد الإلغاء"}</button>
          </div>
        </div>
      )}

      <div className="od-items">
        {activeItems.map((item) => {
          const isReady = item.status === "READY";
          const isConfirming = confirmingCancel === item.id;
          return (
            <article
              className={`od-card ${isReady ? "od-card--done" : ""}`}
              key={item.id}
            >
              <div className="od-card__top">
                <button
                  className="od-card__btn"
                  disabled={isReady || isKeyed(`ready-${item.id}`)}
                  onClick={() => markReady(item)}
                >
                  <Check size={14} />
                  {isReady ? "جاهز" : (isKeyed(`ready-${item.id}`) ? "جاري..." : "تم التحضير")}
                </button>
                <span className={`od-card__item-status ${isReady ? "done" : ""}`}>
                  {isReady ? "جاهز" : "جاري التحضير"}
                </span>
              </div>

              <div className="od-card__head">
                <div className="od-card__title">
                  <strong>{item.product?.name}</strong>
                  <span>{item.typeName} - {item.sizeName || item.productSize?.name}</span>
                </div>
                <span className="od-card__qty">×{Number(item.quantity)}</span>
                <button
                  className="od-card__cancel"
                  disabled={isKeyed(`cancel-${item.id}`)}
                  onClick={() => setConfirmingCancel(isConfirming ? null : item.id)}
                >
                  <Trash2 size={14} />
                  إلغاء
                </button>
              </div>

              {isConfirming && (
                <div className="od-card__cancel-confirm">
                  <span>تأكيد إلغاء هذا المنتج وإرجاع مخزونه؟</span>
                  <div className="od-card__cancel-actions">
                    <button className="od-cancel-no" disabled={isKeyed(`cancel-${item.id}`)} onClick={() => setConfirmingCancel(null)}>تراجع</button>
                    <button className="od-cancel-yes" disabled={isKeyed(`cancel-${item.id}`)} onClick={() => cancelItem(item)}>{isKeyed(`cancel-${item.id}`) ? "جاري..." : "إلغاء المنتج"}</button>
                  </div>
                </div>
              )}

              {/* المواد الخام */}
              <div className="od-materials">
                <span className="od-materials__label">المواد الخام والكميات</span>
                {item.materials && item.materials.length ? (
                  <div className="od-materials__list">
                    {item.materials.map((mat, idx) => (
                      <div className="od-material" key={idx}>
                        <span className="od-material__name">{mat.name}</span>
                        <span className="od-material__qty">
                          {Number(mat.quantity).toFixed(2)} {mat.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="od-materials__empty">لا توجد مواد مسجلة</span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="od-total">
        <span>الإجمالي</span>
        <strong>{Number(order.total || 0).toFixed(2)} ج.م</strong>
      </div>
    </div>
  );
}
