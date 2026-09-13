import { AlertTriangle } from "lucide-react";
import "./WarningsTable.css";

const severityClass = (severity) => ({ CRITICAL: "high", WARNING: "medium" }[severity] || "medium");

function WarningsTable({ items }) {
  if (!items?.length) return <div className="no-warnings-state"><AlertTriangle size={48} className="no-warnings-icon" /><p>لا توجد تحذيرات مطابقة — الوضع مطمئن.</p></div>;
  return <div className="warnings-table-card"><div className="table-card-header"><div className="table-card-title"><AlertTriangle size={20} /><span>التحذيرات النشطة</span></div></div>
    <div className="table-responsive"><table className="custom-warnings-table"><thead><tr><th>م</th><th>النوع</th><th>الخطورة</th><th>المادة</th><th>التفاصيل</th></tr></thead><tbody>{items.map((item, index) => <tr key={item.id || index}><td>{index + 1}</td><td>{item.typeLabel}</td><td data-label="الخطورة"><span className={`severity-badge ${severityClass(item.severity)}`}>{item.severityLabel}</span></td><td data-label="المادة">{item.materialName || "—"}</td><td data-label="التفاصيل">{item.detail}</td></tr>)}</tbody></table></div>
  </div>;
}
export default WarningsTable;
