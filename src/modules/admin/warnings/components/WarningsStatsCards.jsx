import { AlertTriangle, Ban, Clock, PackageX } from "lucide-react";
import "./WarningsStatsCards.css";
function WarningsStatsCards({ warnings }) {
  const summary = warnings?.summary || {};
  const stats = [
    { id: "low", title: "مخزون منخفض", value: summary.lowStockCount || 0, icon: AlertTriangle, color: "#e67e22" },
    { id: "out", title: "نفد من المخزون", value: summary.outOfStockCount || 0, icon: PackageX, color: "#d9383a" },
    { id: "soon", title: "قرب انتهاء الصلاحية", value: summary.expiringSoonCount || 0, icon: Clock, color: "#d48806" },
    { id: "expired", title: "انتهت الصلاحية", value: summary.expiredCount || 0, icon: Ban, color: "#7c3aed" },
  ];
  return <div className="warnings-stats-grid">{stats.map((stat) => { const Icon = stat.icon; return <div className="warnings-stat-card" key={stat.id}><div className="stat-card-header"><span className="stat-card-title">{stat.title}</span><div className="stat-card-icon-wrapper"><Icon size={22} color={stat.color} /></div></div><div className="stat-card-value" style={{ color: stat.color }}>{stat.value}</div><div className="stat-card-subtitle">بيانات مباشرة من المخزون</div></div>; })}</div>;
}
export default WarningsStatsCards;
