import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import { usePrepOrders } from "../hooks/usePrepOrders";
import "../styles/PreparationPage.css";

const STATUS_LABELS = {
  PENDING: "لم يتم التأكيد",
  CONFIRMED: "لم يتم التأكيد",
  PREPARING: "جاري التحضير",
  READY: "جاهز",
  COMPLETED: "مسلّم",
};

const tabs = [
  { key: "current", label: "جاري التحضير", statuses: ["PREPARING"] },
  { key: "ready", label: "الطلبات الجاهزة", statuses: ["READY"] },
];

export default function PreparationPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("current");
  const { data: orders = [], isLoading, error } = usePrepOrders();

  const shown = useMemo(() => {
    const tab = tabs.find((t) => t.key === activeTab);
    return orders.filter((o) => tab.statuses.includes(o.status));
  }, [orders, activeTab]);

  const tables = shown.filter((x) => x.fulfillmentType === "DINE_IN");
  const online = shown.filter((x) => x.fulfillmentType !== "DINE_IN");

  const openOrder = (order) => navigate(`/admin/orders/preparation/${order.id}`);

  const renderTable = (rows, emptyText) => (
    <div className="prep-table-wrapper">
      <table className="prep-table">
        <thead>
          <tr>
            <th>رقم الطلب</th>
            <th>{activeTab === "ready" ? "الطاولة/المصدر" : "المنتجات"}</th>
            <th>الحالة</th>
            <th>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan="4" className="prep-empty">{emptyText}</td></tr>
          ) : (
            rows.map((order) => (
              <tr key={order.id}>
                <td className="prep-order-num">{order.orderNumber}</td>
                <td className="prep-order-source">
                  {order.fulfillmentType === "DINE_IN" ? `طاولة ${order.table}` : `${order.itemCount ?? (order.items?.length ?? 0)} منتج`}
                </td>
                <td>
                  <span className={`prep-status prep-status--${order.status}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </td>
                <td className="prep-actions">
                  <button className="btn-open" onClick={() => openOrder(order)}>
                    فتح
                  </button>
                  {activeTab === "ready" && (
                    <button className="btn-deliver" onClick={() => navigate(`/admin/orders/busy/online/${order.id}`)}>
                      {order.fulfillmentType === "DELIVERY" ? "اختيار المندوب" : order.fulfillmentType === "PICKUP" ? "تسليم للعميل" : "فتح"}
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="prep-page">
      <PageHeader title="قسم التحضير" breadcrumbs={["الطلبات", "التحضير"]} />
      {error && <p role="alert" className="prep-error">{error?.response?.data?.message || error?.message}</p>}

      <div className="prep-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`prep-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="prep-loading">جاري تحميل الطلبات...</p>
      ) : (
        <div className="prep-cols">
          <div className="prep-col">
            <h4 className="prep-col-title">طلبات الطاولات</h4>
            {renderTable(tables, "لا توجد طلبات")}
          </div>
          <div className="prep-col">
            <h4 className="prep-col-title">الأونلاين والتيك أواي</h4>
            {renderTable(online, "لا توجد طلبات")}
          </div>
        </div>
      )}
    </div>
  );
}
