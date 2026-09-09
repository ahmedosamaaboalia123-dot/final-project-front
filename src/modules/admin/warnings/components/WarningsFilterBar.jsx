import { Search, RotateCw } from "lucide-react";
import "./WarningsFilterBar.css";

function WarningsFilterBar({ searchTerm, setSearchTerm, warningType, setWarningType, dateRange, setDateRange, onReset }) {
  return <div className="warnings-filter-card"><div className="filter-card-content">
    <div className="filter-search-box"><input type="text" className="filter-search-input" placeholder="ابحث باسم المادة أو تفاصيل التحذير أو رقم الدفعة" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /><Search size={18} className="search-icon" /></div>
    <div className="filter-select-group"><label className="filter-label">نوع التحذير</label><select className="filter-select" value={warningType} onChange={(e) => setWarningType(e.target.value)}><option value="all">كل الأنواع</option><option value="low_stock">مخزون منخفض</option><option value="out_of_stock">نفد من المخزون</option><option value="expiring_soon">قرب انتهاء الصلاحية</option><option value="expired">انتهت الصلاحية</option></select></div>
    <div className="filter-select-group"><label className="filter-label">تاريخ إنشاء التحذير</label><select className="filter-select" value={dateRange} onChange={(e) => setDateRange(e.target.value)}><option value="all">كل الفترات</option><option value="today">اليوم</option><option value="week">آخر 7 أيام</option><option value="month">هذا الشهر</option></select></div>
    <div className="filter-buttons-group"><button type="button" className="filter-reset-btn" onClick={onReset}><RotateCw size={16} /><span>إعادة تعيين</span></button></div>
  </div></div>;
}
export default WarningsFilterBar;
