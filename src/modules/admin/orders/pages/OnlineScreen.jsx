import { useState } from "react";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import { ServerPagination } from "@/shared/components";
import CardGrid from "../components/CardGrid";
import { useOnlineOrders } from "../hooks/order.queries";
import "../styles/CardGrid.css"; import "../styles/Screen.css";
export default function OnlineScreen() { const [page, setPage] = useState(1); const query = useOnlineOrders({ tab: "active", page, limit: 10 }); const cards = [{ id: "new", isNew: true }, ...(query.data?.items || []).map((o) => ({ id: o.id, orderId: o.id, orderNumber: o.orderNumber, status: o.status, channel: o.channel, itemsCount: o.progress.total, total: o.total, fulfillmentType: o.fulfillmentType }))]; return <div className="online-screen"><PageHeader title="طلبات الأونلاين والتيك أواي" breadcrumbs={["الطلبات", "الأونلاين"]}/><div className="screen-content">{query.error && <p role="alert">{query.error?.response?.data?.error?.messageAr || query.error.message}</p>}<CardGrid cards={cards} type="online"/><ServerPagination meta={query.data?.meta} onPageChange={setPage} disabled={query.isFetching} label="طلب"/></div></div>; }
