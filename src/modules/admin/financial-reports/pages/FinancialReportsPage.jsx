import { useCallback, useEffect, useState } from "react";
import { BarChart3, Boxes, CircleDollarSign, ReceiptText, TrendingUp, Wallet } from "lucide-react";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import { getFinancialOverview, getInventoryFinancialReport } from "../services/financialReportsService";
import "../styles/FinancialReportsPage.css";

const money = (value) => `${Number(value || 0).toLocaleString("ar-EG", { maximumFractionDigits: 2 })} ج.م`;

export default function FinancialReportsPage() {
  const [tab, setTab] = useState("overview");
  const [filters, setFilters] = useState({ from: "", to: "" });
  const [overview, setOverview] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
      const [financial, stock] = await Promise.all([getFinancialOverview(params), getInventoryFinancialReport()]);
      setOverview(financial); setInventory(stock);
    } catch (reason) { setError(reason.response?.data?.message || reason.message); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);
  const sales = overview?.sales || {};
  const stock = inventory?.summary || overview?.inventory || {};

  const cards = [
    ["صافي المبيعات", money(sales.netSales), CircleDollarSign], ["تكلفة المبيعات", money(sales.cost), ReceiptText],
    ["الأرباح", money(sales.profit), TrendingUp], ["عدد الفواتير", sales.invoices || 0, BarChart3],
    ["قيمة المخزون", money(stock.stockValue), Boxes], ["أرباح الورديات", money(overview?.shifts?.profit), Wallet],
  ];

  return <div className="fr-page" dir="rtl">
    <PageHeader title="التقارير المالية" breadcrumbs={["الإدارة", "التقارير المالية"]} />
    <div className="fr-toolbar">
      <label><span>من</span><input type="date" value={filters.from} onChange={(e) => setFilters((x) => ({ ...x, from: e.target.value }))} /></label>
      <label><span>إلى</span><input type="date" value={filters.to} onChange={(e) => setFilters((x) => ({ ...x, to: e.target.value }))} /></label>
      <button onClick={load}>تحديث التقارير</button>
    </div>
    {error && <p className="fr-error" role="alert">{error}</p>}
    {loading ? <p className="fr-loading">جاري تحميل التقارير...</p> : <>
      <div className="fr-cards">{cards.map(([label, value, Icon]) => <article key={label}><Icon size={18}/><span>{label}</span><strong>{value}</strong></article>)}</div>
      <div className="fr-tabs">
        {[['overview','المبيعات اليومية'],['monthly','المبيعات الشهرية'],['inventory','المخزون'],['shifts','الورديات'],['invoices','الفواتير']].map(([key,label]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{label}</button>)}
      </div>
      {tab === "overview" && <ReportTable columns={["اليوم","الفواتير","المبيعات","التكلفة","الربح"]} rows={(overview?.daily || []).map((r) => [r.period,r.invoices,money(r.sales),money(r.cost),money(r.profit)])}/>} 
      {tab === "monthly" && <ReportTable columns={["الشهر","الفواتير","المبيعات","التكلفة","الربح"]} rows={(overview?.monthly || []).map((r) => [r.period,r.invoices,money(r.sales),money(r.cost),money(r.profit)])}/>} 
      {tab === "inventory" && <ReportTable columns={["المادة","المورد","الفعلية","المحجوزة","المتاحة","القيمة","الحالة"]} rows={(inventory?.materials || []).map((r) => [r.name,r.supplier?.name,r.quantity,r.reserved,r.available,money(r.value),r.status === "OUT" ? "نافد" : r.status === "LOW" ? "منخفض" : "طبيعي"])}/>} 
      {tab === "shifts" && <ReportTable columns={["الوردية","الموظف","الفواتير","المبيعات","التكلفة","الربح","الصافي"]} rows={(overview?.shiftRows || []).map((r) => [`#${r.id}`,r.openedByUser?.name,r.metrics?.invoices,money(r.metrics?.sales),money(r.metrics?.cost),money(r.metrics?.profit),money(r.metrics?.netShift)])}/>} 
      {tab === "invoices" && <ReportTable columns={["الفاتورة","الطلب","النوع","البيع","التكلفة","الربح","التاريخ"]} rows={(overview?.recentSales || []).map((r) => [r.invoiceNumber,r.order?.orderNumber,r.order?.fulfillmentType,money(r.total),money(r.costTotal),money(r.profitTotal),new Date(r.completedAt || r.createdAt).toLocaleString("ar-EG")])}/>} 
    </>}
  </div>;
}

function ReportTable({ columns, rows }) {
  return <div className="fr-table-wrap"><table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={index}>{row.map((value, cell) => <td key={cell}>{value ?? "—"}</td>)}</tr>) : <tr><td colSpan={columns.length} className="fr-empty">لا توجد بيانات في الفترة المحددة</td></tr>}</tbody></table></div>;
}
