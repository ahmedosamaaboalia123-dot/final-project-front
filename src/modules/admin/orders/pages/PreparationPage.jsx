import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import { usePreparation } from "../hooks/order.queries";
import ServerPagination from "@/shared/components/ServerPagination/ServerPagination";
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
  const [group, setGroup] = useState("online");
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = usePreparation({ group, tab: activeTab, page, limit: 10 });
  const shown = data?.items || [];

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
                      {order.fulfillmentType === "DELIVERY" ? "اختيار المندوب" : order.fulfillmentType === "TAKEAWAY" ? "تسليم للعميل" : "فتح"}
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
        <div className="prep-cols"><div className="prep-col"><h4 className="prep-col-title">{group === "tables" ? "طلبات الطاولات" : "الأونلاين والتيك أواي"}</h4>{renderTable(shown, "لا توجد طلبات")}</div></div>
      )}
      <div className="prep-tabs"><button className={group === "online" ? "prep-tab active" : "prep-tab"} onClick={() => { setGroup("online"); setPage(1); }}>أونلاين وتيك أواي</button><button className={group === "tables" ? "prep-tab active" : "prep-tab"} onClick={() => { setGroup("tables"); setPage(1); }}>الطاولات</button></div>
      <ServerPagination meta={data?.meta} onPageChange={setPage} disabled={isLoading} label="طلب" />
    </div>
  );
}
