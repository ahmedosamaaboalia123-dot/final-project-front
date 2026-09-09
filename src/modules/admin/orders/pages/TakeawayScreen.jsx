import React from "react";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import OrderQueue from "../components/OrderQueue";
import { useRealtimeOrders } from "../hooks/useRealtimeOrders";
import "../styles/Screen.css";

export default function TakeawayScreen() {
  const { orders, error } = useRealtimeOrders({ fulfillmentType: "PICKUP" });

  return (
    <div className="online-screen">
      <PageHeader title="طلبات التيك أواي" breadcrumbs={["الرئيسية", "الطلبات", "تيك أواي"]} />
      <div className="screen-content">
        {error && <p role="alert">{error}</p>}
        <OrderQueue orders={orders} emptyText="لا توجد طلبات تيك أواي حاليًا" />
      </div>
    </div>
  );
}
