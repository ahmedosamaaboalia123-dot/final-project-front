import React from "react";
import { Clock3, MapPin, Phone, ReceiptText, UserRound } from "lucide-react";
import "../styles/OrderQueue.css";

export default function OrderQueue({ orders = [], emptyText }) {
  if (orders.length === 0) {
    return <div className="admin-order-empty">{emptyText}</div>;
  }

  return (
    <div className="admin-order-queue">
      {orders.map((order) => (
        <article className="admin-order-card" key={order.id}>
          <header>
            <div>
              <span className="admin-order-code">{order.orderNumber || order.id}</span>
              <strong>{order.orderTypeText}</strong>
            </div>
            <span className="admin-order-status">{order.statusText || order.status}</span>
          </header>
          <div className="admin-order-meta">
            <span><UserRound size={15} />{order.customerInfo?.name || order.customerName || "عميل"}</span>
            <span><Phone size={15} />{order.customerInfo?.phone || order.phone || "—"}</span>
            <span><Clock3 size={15} />{order.dateFormatted || "الآن"}</span>
            {order.customerInfo?.address && order.orderType === "delivery" && (
              <span><MapPin size={15} />{order.customerInfo.address}</span>
            )}
          </div>
          <div className="admin-order-items">
            {order.items?.map((item) => (
              <span key={item.id}>{item.quantity}× {item.name}</span>
            ))}
          </div>
          <footer>
            <span><ReceiptText size={16} /> الإجمالي</span>
            <strong>{order.pricing?.total || order.total || 0} ج.م</strong>
          </footer>
        </article>
      ))}
    </div>
  );
}
