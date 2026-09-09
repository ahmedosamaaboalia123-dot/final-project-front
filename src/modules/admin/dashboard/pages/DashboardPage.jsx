import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, ArrowLeft, Banknote, Boxes, CalendarClock, CheckCircle2,
  ClipboardList, Clock3, PackageOpen, RefreshCw, ShoppingBag, TrendingUp,
  Truck, Users, WalletCards,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import { getDashboardData } from "../services/dashboardService";
import "./DashboardPage.css";

const money = new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("ar-EG");
const date = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", year: "numeric" });

function MetricCard({ title, value, note, icon: Icon, tone }) {
  return (
    <article className={`dashboard-metric dashboard-metric--${tone}`}>
      <span className="dashboard-metric__icon"><Icon size={22} /></span>
      <div><p>{title}</p><strong>{value}</strong><span>{note}</span></div>
    </article>
  );
}

function EmptyState({ children }) {
  return <div className="dashboard-empty"><CheckCircle2 size={28} /><p>{children}</p></div>;
}

function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await getDashboardData()); }
    catch { setError("تعذّر تحميل بيانات لوحة التحكم. تأكد من تشغيل الخادم ثم حاول مرة أخرى."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const todayLabel = useMemo(() => date.format(new Date()), []);
  const summary = data?.summary;
  const chartData = summary ? [{ day: "اليوم", sales: summary.todaySales.total, orders: summary.todayOrders.count }] : [];
  const inventory = data?.inventory;
  const shift = summary?.activeShift;

  return (
    <div className="dashboard-page" dir="rtl">
      <PageHeader title="لوحة التحكم" breadcrumbs={["الإدارة", "لوحة التحكم"]} icon={TrendingUp} />

      <div className="dashboard-content">
        <section className="dashboard-welcome">
          <div>
            <span className="dashboard-welcome__eyebrow"><CalendarClock size={16} /> {todayLabel}</span>
            <h2>صباح الخير، تابع شغلك من مكان واحد</h2>
            <p>ملخص سريع للمبيعات والطلبات والمخزون خلال اليوم.</p>
          </div>
          <button type="button" onClick={loadDashboard} disabled={loading} className="dashboard-refresh">
            <RefreshCw size={18} className={loading ? "is-spinning" : ""} /> تحديث البيانات
          </button>
        </section>

        {error && <div className="dashboard-error"><AlertTriangle size={20} /><span>{error}</span><button onClick={loadDashboard}>إعادة المحاولة</button></div>}

        {loading && !data ? <div className="dashboard-loading"><RefreshCw className="is-spinning" /><p>جاري تحميل لوحة التحكم...</p></div> : data && <>
          <section className="dashboard-metrics" aria-label="ملخص اليوم">
            <MetricCard title="مبيعات اليوم" value={money.format(summary.todaySales.total)} note={`${number.format(summary.todaySales.count)} فاتورة مكتملة`} icon={Banknote} tone="brown" />
            <MetricCard title="طلبات اليوم" value={number.format(summary.todayOrders.count)} note={`بقيمة ${money.format(summary.todayOrders.total)}`} icon={ShoppingBag} tone="blue" />
            <MetricCard title="طلبات قيد الانتظار" value={number.format(summary.pendingOrders)} note="تحتاج متابعة من الفريق" icon={Clock3} tone="orange" />
            <MetricCard title="تنبيهات المخزون" value={number.format(inventory.lowStockCount + inventory.expiringSoonCount)} note={`${number.format(inventory.lowStockCount)} منخفض · ${number.format(inventory.expiringSoonCount)} صلاحية`} icon={PackageOpen} tone="red" />
          </section>

          <section className="dashboard-main-grid">
            <article className="dashboard-card dashboard-chart-card">
              <div className="dashboard-card__heading"><div><h3>أداء المبيعات</h3><p>آخر 7 أيام</p></div><span className="dashboard-trend"><TrendingUp size={16} /> أداء مستقر</span></div>
              <div className="dashboard-chart" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 12, right: 4, left: -22, bottom: 0 }}>
                    <defs><linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6B3F1D" stopOpacity={0.28}/><stop offset="95%" stopColor="#6B3F1D" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#ede3da" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#6f6258", fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#998b80", fontSize: 11 }} />
                    <Tooltip formatter={(value) => [money.format(value), "المبيعات"]} contentStyle={{ borderRadius: 12, border: "1px solid #ede3da", direction: "rtl" }} />
                    <Area type="monotone" dataKey="sales" stroke="#6B3F1D" strokeWidth={3} fill="url(#salesFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="dashboard-card dashboard-shift">
              <div className="dashboard-card__heading"><div><h3>الوردية الحالية</h3><p>{shift ? `بدأت بواسطة ${shift.openedBy?.name || "الموظف"}` : "لا توجد وردية مفتوحة"}</p></div><span className={`dashboard-status ${shift ? "is-open" : ""}`}>{shift ? "مفتوحة" : "مغلقة"}</span></div>
              {shift ? <>
                <div className="dashboard-shift__balance"><span>الرصيد المتوقع</span><strong>{money.format(shift.expectedBalance)}</strong></div>
                <div className="dashboard-shift__rows">
                  <div><span><WalletCards size={17} /> رصيد البداية</span><strong>{money.format(shift.openingBalance)}</strong></div>
                  <div><span><TrendingUp size={17} /> إجمالي الداخل</span><strong className="positive">+ {money.format(shift.cashIn)}</strong></div>
                  <div><span><ArrowLeft size={17} /> إجمالي الخارج</span><strong className="negative">- {money.format(shift.cashOut)}</strong></div>
                </div>
              </> : <EmptyState>ابدأ وردية لعرض حركة الخزينة.</EmptyState>}
            </article>
          </section>

          <section className="dashboard-lower-grid">
            <article className="dashboard-card">
              <div className="dashboard-card__heading"><div><h3>تنبيهات المخزون</h3><p>أصناف تحتاج تدخل سريع</p></div><Link to="/admin/inventory">عرض المخزون <ArrowLeft size={16}/></Link></div>
              <div className="dashboard-alert-list">
                {inventory.lowStock.length ? inventory.lowStock.slice(0, 4).map(item => <div className="dashboard-alert-item" key={item.id}><span className="dashboard-alert-item__icon"><Boxes size={18}/></span><div><strong>{item.name}</strong><small>الحد الأدنى {number.format(item.minStockAlert)} {item.unit}</small></div><b>{number.format(item.currentStock)} {item.unit}</b></div>) : <EmptyState>كل كميات المخزون بحالة جيدة.</EmptyState>}
              </div>
            </article>

            <article className="dashboard-card">
              <div className="dashboard-card__heading"><div><h3>نظرة عامة</h3><p>أرقام النظام المسجلة</p></div></div>
              <div className="dashboard-counts">
                <div><span><ClipboardList size={20}/></span><strong>{number.format(summary.totalOrders.count)}</strong><small>إجمالي الطلبات</small></div>
                <div><span><Boxes size={20}/></span><strong>{number.format(data.counts.products)}</strong><small>المنتجات</small></div>
                <div><span><Users size={20}/></span><strong>{number.format(data.counts.customers)}</strong><small>العملاء</small></div>
                <div><span><Truck size={20}/></span><strong>{number.format(data.counts.suppliers)}</strong><small>الموردون</small></div>
              </div>
            </article>
          </section>
        </>}
      </div>
    </div>
  );
}

export default DashboardPage;
