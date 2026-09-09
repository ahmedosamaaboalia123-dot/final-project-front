import { Bell, Check, Clock } from "lucide-react";

const typeText = { WAITER: "طلب جرسون", BILL: "طلب الحساب", WATER: "مياه إضافية", UTENSILS: "أدوات إضافية", CLEANING: "تنظيف الطاولة" };

export default function TableServiceRequestsList({ title, services, finished = false, pendingId, onStatusChange }) {
  return <section className="services-section"><h3>{title} ({services.length})</h3><div className="services-list">
    {services.length ? services.map((service) => <article key={service.id} className={`service-card ${finished ? "service-card--done" : "service-card--active"}`}>
      <div className={`service-icon ${finished ? "done" : ""}`}>{finished ? <Check size={20}/> : <Bell size={20}/>}</div>
      <div className="service-info"><span className="service-type">{typeText[service.type] || service.reason || service.type}</span><span className="service-table">طاولة {service.tableNumber}</span></div>
      <div className="service-time"><Clock size={14}/>{new Date(service.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</div>
      {!finished && <button className="btn-mark-done" disabled={pendingId === service.id} onClick={() => onStatusChange(service.id, service.status === "OPEN" ? "ACKNOWLEDGED" : "RESOLVED")}><Check size={16}/>{pendingId === service.id ? "جاري..." : service.status === "OPEN" ? "استلام" : "تم"}</button>}
    </article>) : <div className="empty-msg">لا توجد طلبات</div>}
  </div></section>;
}
