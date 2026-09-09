import { AlertTriangle, Ban, Bell, Clock, PackageX, RefreshCw } from "lucide-react";
import "./WarningsTable.css";

const TYPES = {
  low_stock: { label: "مخزون منخفض", icon: AlertTriangle, className: "about-to-run-out" },
  out_of_stock: { label: "نفد من المخزون", icon: PackageX, className: "run-out" },
  expiring_soon: { label: "قرب انتهاء الصلاحية", icon: Clock, className: "about-to-expire" },
  expired: { label: "انتهت الصلاحية", icon: Ban, className: "expired" },
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const matchesDateRange = (value, range) => {
  if (range === "all") return true;
  const warningDate = new Date(value); const now = new Date();
  if (range === "today") return warningDate >= startOfDay(now);
  if (range === "week") return warningDate >= new Date(startOfDay(now).getTime() - 6 * 86400000);
  if (range === "month") return warningDate >= new Date(now.getFullYear(), now.getMonth(), 1);
  return true;
};

function WarningsTable({ warnings, searchTerm, warningType, dateRange, onRefresh, isFetching }) {
  const rows = (warnings?.warnings || []).filter((warning) => {
    const query = searchTerm.trim().toLowerCase();
    return (warningType === "all" || warning.type === warningType)
      && matchesDateRange(warning.createdAt, dateRange)
      && (!query || warning.name.toLowerCase().includes(query) || warning.details.toLowerCase().includes(query) || String(warning.batchNumber || "").includes(query));
  });
  return <div className="warnings-table-card"><div className="table-card-header"><div className="table-card-title"><div className="title-bell-badge"><Bell size={18} /></div><span>قائمة التحذيرات</span></div><button className="refresh-icon-btn" onClick={onRefresh} aria-label="تحديث"><RefreshCw size={16} className={isFetching ? "is-spinning" : ""} /></button></div><div className="table-responsive"><table className="custom-warnings-table"><thead><tr><th>النوع</th><th>المادة</th><th>التفاصيل</th><th>الكمية</th><th>تاريخ إنشاء التحذير</th></tr></thead><tbody>{rows.length === 0 ? <tr><td colSpan="5">لا توجد تحذيرات مطابقة.</td></tr> : rows.map((row) => { const type = TYPES[row.type]; const Icon = type.icon; return <tr key={row.id}><td><span className={`warning-type-badge badge-${type.className}`}><Icon size={13} />{type.label}</span></td><td className="font-semibold">{row.name}</td><td className="warning-details-cell">{row.details}</td><td>{Number(row.quantity)} {row.unit}</td><td>{new Date(row.createdAt).toLocaleString("ar-EG")}</td></tr>; })}</tbody></table></div></div>;
}
export default WarningsTable;
