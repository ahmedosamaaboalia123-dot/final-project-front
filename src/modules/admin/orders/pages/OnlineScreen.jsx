import PageHeader from "@/shared/components/PageHeader/PageHeader";
import CardGrid from "../components/CardGrid";
import { useRealtimeOrders } from "../hooks/useRealtimeOrders";
import "../styles/CardGrid.css";import "../styles/Screen.css";
export default function OnlineScreen(){const {orders,error}=useRealtimeOrders({});const cards=[{id:"new",isNew:true},...orders.filter(o=>o.fulfillmentType!=="DINE_IN"&&!["COMPLETED","CANCELLED"].includes(o.status)).map(o=>({id:o.id,orderId:o.id,orderNumber:o.orderNumber,status:o.status,channel:o.channel,itemsCount:o.items.length,total:o.total,fulfillmentType:o.fulfillmentType}))];return <div className="online-screen"><PageHeader title="طلبات الأونلاين" breadcrumbs={["الطلبات","الأونلاين"]}/><div className="screen-content">{error&&<p role="alert">{error}</p>}<CardGrid cards={cards} type="online"/></div></div>}
