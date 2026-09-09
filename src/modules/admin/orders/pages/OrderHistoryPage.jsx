import { useNavigate } from "react-router-dom";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import { useRealtimeOrders } from "../hooks/useRealtimeOrders";
import "../styles/OrderHistoryPage.css";

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const { orders, error } = useRealtimeOrders({ scope: "history" });

  return (
    <div className="history-page">
      <PageHeader title="سجل الطلبات" breadcrumbs={["الطلبات", "السجل"]} />
      {error && <p role="alert">{error}</p>}
      <div className="history-table-wrapper">
        <table className="history-table">
          <thead><tr><th>#</th><th>النوع</th><th>رقم الطلب</th><th>المنتجات</th><th>الإجمالي</th><th>التاريخ</th><th>الحالة</th></tr></thead>
          <tbody>
            {orders.map((order, index) => (
              <tr key={order.id} onClick={() => navigate(`/admin/orders/preparation/${order.id}`)}>
                <td>{index + 1}</td><td>{order.fulfillmentType}</td><td>{order.orderNumber}</td>
                <td>{order.items.length}</td><td>{Number(order.total).toFixed(2)} ج.م</td>
                <td>{new Date(order.createdAt).toLocaleString("ar-EG")}</td><td>{order.status === "PREPARING" ? "جاري التحضير" : order.status === "PENDING" || order.status === "CONFIRMED" ? "لم يتم التأكيد" : "جاهز"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
