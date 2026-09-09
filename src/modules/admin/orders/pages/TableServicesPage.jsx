import PageHeader from "@/shared/components/PageHeader/PageHeader";
import TableServiceRequestsList from "../components/TableServiceRequestsList";
import { useTableServiceRequests } from "../hooks/useTableServiceRequests";
import "../styles/TableServices.css";

export default function TableServicesPage() {
  const { services, loading, error, pendingId, changeStatus } = useTableServiceRequests();
  const active = services.filter((item) => ["OPEN", "ACKNOWLEDGED"].includes(item.status));
  const done = services.filter((item) => ["RESOLVED", "CANCELLED"].includes(item.status));
  return <div className="table-services-page">
    <PageHeader title="خدمات الطاولات" breadcrumbs={["الطلبات", "خدمات الطاولات"]}/>
    {error && <p role="alert">{error}</p>}
    {loading && <p>جاري تحميل طلبات الخدمات...</p>}
    <div className="table-services-content">
      <TableServiceRequestsList title="الطلبات النشطة" services={active} pendingId={pendingId} onStatusChange={changeStatus}/>
      <TableServiceRequestsList title="الطلبات المنتهية" services={done} finished pendingId={pendingId} onStatusChange={changeStatus}/>
    </div>
  </div>;
}
