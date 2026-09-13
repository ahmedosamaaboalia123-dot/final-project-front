import { useMemo, useState } from "react";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import { AsyncState, Money, ServerPagination } from "@/shared/components";
import Button from "@/shared/components/Button/Button";
import Input from "@/shared/components/Input/Input";
import Select from "@/shared/components/Select/Select";
import { getArabicErrorMessage } from "@/api/apiError";
import { can } from "@/modules/auth/permissions/permission";
import { useAuthStore } from "@/store/authStore";
import { EXPORT_FORMATS, REPORT_TYPES } from "../adapters/report.adapter";
import {
  useDelegateReport,
  useDrawerReport,
  useExportStatus,
  useInventoryReport,
  useReportScreen,
  useSalesReport,
  useSupplierReport,
} from "../hooks/report.queries";
import { useRequestExport } from "../hooks/report.mutations";
import {
  delegateReportFilterSchema,
  exportRequestSchema,
  firstReportFormError,
  reportRangeSchema,
  salesFilterSchema,
  supplierReportFilterSchema,
} from "../schemas/report.schema";
import RefundsSection from "../components/RefundsSection";
import "../styles/FinancialReportsPage.css";

const TABS = [
  { id: "overview", label: "نظرة عامة" },
  { id: "sales", label: "المبيعات" },
  { id: "inventory", label: "المخزون" },
  { id: "drawer", label: "الدرج" },
  { id: "suppliers", label: "الموردين" },
  { id: "delegates", label: "المناديب" },
  { id: "exports", label: "التصدير" },
  { id: "refunds", label: "الاستردادات" },
];

const COMPARE_OPTIONS = [
  { value: "previous_period", label: "مقارنة بالفترة السابقة" },
  { value: "none", label: "بدون مقارنة" },
];

const CHANNEL_OPTIONS = [
  { value: "ADMIN", label: "الإدارة" },
  { value: "CUSTOMER_WEB", label: "موقع العملاء" },
  { value: "TABLE", label: "الطاولات" },
];

const SUMMARY_LABELS = {
  totalSales: "إجمالي المبيعات",
  netSales: "صافي المبيعات",
  grossSales: "إجمالي المبيعات",
  sales: "المبيعات",
  total: "الإجمالي",
  totalAmount: "إجمالي المبلغ",
  revenue: "الإيراد",
  totalRevenue: "إجمالي الإيراد",
  cost: "التكلفة",
  costTotal: "إجمالي التكلفة",
  totalCost: "إجمالي التكلفة",
  profit: "الربح",
  profitTotal: "إجمالي الربح",
  totalProfit: "إجمالي الربح",
  net: "الصافي",
  netShift: "صافي الوردية",
  netTotal: "الصافي الإجمالي",
  discount: "الخصم",
  tax: "الضريبة",
  invoices: "عدد الفواتير",
  invoiceCount: "عدد الفواتير",
  orders: "عدد الطلبات",
  orderCount: "عدد الطلبات",
  transactions: "عدد الحركات",
  transactionCount: "عدد الحركات",
  movements: "عدد الحركات",
  stockValue: "قيمة المخزون",
  totalValue: "إجمالي القيمة",
  inventoryValue: "قيمة المخزون",
  quantity: "الكمية",
  totalQuantity: "إجمالي الكمية",
  debtBalance: "الدين الحالي",
  receivableBalance: "المستحق الحالي",
  totalDebt: "إجمالي الديون",
  totalReceivable: "إجمالي المستحقات",
  paid: "المدفوع",
  totalPaid: "إجمالي المدفوع",
  due: "المستحق",
  balance: "الرصيد",
  closingBalance: "رصيد الإغلاق",
  openingBalance: "رصيد الافتتاح",
  cashIn: "الوارد النقدي",
  cashOut: "الصادر النقدي",
  refunds: "الاستردادات",
  refundTotal: "إجمالي الاستردادات",
  delegates: "عدد المناديب",
  suppliers: "عدد الموردين",
  count: "العدد",
};

const COUNT_KEYS = new Set([
  "invoices",
  "invoiceCount",
  "orders",
  "orderCount",
  "transactions",
  "transactionCount",
  "movements",
  "count",
  "totalCount",
  "quantity",
  "totalQuantity",
  "delegates",
  "suppliers",
]);

function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== null && value !== undefined),
  );
}

function labelFor(key) {
  return SUMMARY_LABELS[key] || key;
}

function isCountKey(key) {
  return COUNT_KEYS.has(key);
}

function MoneyCell({ value }) {
  if (value === null || value === undefined || value === "") return <span>—</span>;
  return <Money value={value} />;
}

function summaryEntries(summary) {
  if (!summary || typeof summary !== "object") return [];
  return Object.entries(summary);
}

function SummaryGrid({ summary }) {
  const entries = summaryEntries(summary);
  if (entries.length === 0) return <p className="fr-empty">لا يوجد ملخص لهذه الفترة.</p>;
  return (
    <div className="fr-summary-grid">
      {entries.map(([key, value]) => (
        <article key={key} className="fr-summary-card">
          <span>{labelFor(key)}</span>
          <strong>
            {value === null || value === undefined || value === "" ? (
              "—"
            ) : isCountKey(key) || typeof value === "boolean" ? (
              String(value)
            ) : typeof value === "number" || !Number.isNaN(Number(value)) ? (
              <Money value={value} />
            ) : (
              String(value)
            )}
          </strong>
        </article>
      ))}
    </div>
  );
}

function QualityBanner({ dataQuality, failedSources }) {
  const failed = Array.isArray(failedSources) ? failedSources : [];
  if (dataQuality !== "ERROR" && failed.length === 0) return null;
  return (
    <p className="fr-quality-banner" role="alert">
      جودة البيانات: غير مكتملة{failed.length > 0 ? ` — مصادر متعثرة: ${failed.join("، ")}` : ""}.
      القيم المتأثرة تظهر بعلامة (—).
    </p>
  );
}

function DataTable({ columns, rows, emptyText = "لا توجد بيانات في الفترة المحددة" }) {
  return (
    <div className="fr-table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="fr-empty">
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={row.key || index}>
                {row.cells.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const rowDate = (row) => row.date || row.day || row.period || row.occurredOn || row.createdAt || "—";
const rowInvoices = (row) => row.invoices ?? row.invoiceCount ?? row.count ?? "—";
const rowChannel = (row) =>
  row.channel === "ADMIN" ? "الإدارة" : row.channel === "CUSTOMER_WEB" ? "موقع العملاء" : row.channel === "TABLE" ? "الطاولات" : row.channel || "—";

function OverviewTab() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [compare, setCompare] = useState("previous_period");
  const [formError, setFormError] = useState("");

  const parsed = useMemo(
    () => reportRangeSchema.safeParse(cleanParams({ from, to, compare })),
    [from, to, compare],
  );
  const params = useMemo(() => (parsed.success ? parsed.data : { compare }), [parsed, compare]);
  const query = useReportScreen(params);

  const apply = (event) => {
    event.preventDefault();
    const result = reportRangeSchema.safeParse(cleanParams({ from, to, compare }));
    if (!result.success) {
      setFormError(firstReportFormError(result));
      return;
    }
    setFormError("");
    query.refetch();
  };

  const screen = query.data;
  const cards = screen?.cards ? summaryEntries(screen.cards) : [];
  const trend = screen?.charts?.salesTrend || [];
  const mix = screen?.charts?.channelMix || [];
  const topProducts = screen?.topProducts || [];
  const alerts = screen?.alerts || [];

  return (
    <section className="fr-section" aria-label="نظرة عامة">
      <form className="fr-toolbar" onSubmit={apply}>
        <Input label="من" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        <Input label="إلى" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        <Select label="المقارنة" value={compare} onChange={(event) => setCompare(event.target.value)} options={COMPARE_OPTIONS} />
        <Button type="submit" loading={query.isFetching}>
          تحديث
        </Button>
      </form>
      {formError && (
        <p className="fr-error" role="alert">
          {formError}
        </p>
      )}
      <AsyncState loading={query.isLoading} error={query.error} onRetry={query.refetch} empty={false}>
        <QualityBanner dataQuality={screen?.dataQuality} failedSources={screen?.failedSources} />
        {screen?.period && (
          <p className="fr-period">
            الفترة: {screen.period.from || "—"} إلى {screen.period.to || "—"}
            {screen.comparisonPeriod ? ` — مقارنة: ${screen.comparisonPeriod.from || "—"} إلى ${screen.comparisonPeriod.to || "—"}` : " — بدون مقارنة"}
          </p>
        )}
        <div className="fr-cards">
          {cards.length === 0 ? (
            <p className="fr-empty">لا توجد بطاقات لهذه الفترة.</p>
          ) : (
            cards.map(([key, value]) => (
              <article key={key}>
                <span>{labelFor(key)}</span>
                <strong>
                  {value === null || value === undefined || value === "" ? (
                    "—"
                  ) : isCountKey(key) ? (
                    String(value)
                  ) : (
                    <Money value={value} />
                  )}
                </strong>
              </article>
            ))
          )}
        </div>

        <h3>التنبيهات</h3>
        {alerts.length === 0 ? (
          <p className="fr-empty">لا توجد تنبيهات.</p>
        ) : (
          <ul className="fr-alerts">
            {alerts.map((alert, index) => (
              <li key={alert.id || index}>{typeof alert === "string" ? alert : alert.message || alert.title || JSON.stringify(alert)}</li>
            ))}
          </ul>
        )}

        <h3>اتجاه المبيعات</h3>
        <DataTable
          columns={["الفترة", "المبيعات", "الطلبات", "الفواتير"]}
          rows={trend.map((row, index) => ({
            key: row.id || index,
            cells: [
              rowDate(row),
              <MoneyCell key="s" value={row.sales ?? row.total ?? row.netSales} />,
              row.orders ?? row.orderCount ?? "—",
              rowInvoices(row),
            ],
          }))}
        />

        <h3>مزيج القنوات</h3>
        {mix.length === 0 ? (
          <p className="fr-empty">لا توجد بيانات قنوات.</p>
        ) : (
          <ul className="fr-mix-list">
            {mix.map((entry, index) => (
              <li key={entry.channel || index}>
                <span>{rowChannel(entry)}</span>
                <span>
                  <MoneyCell value={entry.sales ?? entry.total ?? entry.revenue} />
                  {entry.share !== null && entry.share !== undefined && entry.share !== "" ? ` — الحصة ${entry.share}%` : ""}
                  {entry.count !== null && entry.count !== undefined && entry.count !== "" ? ` — العدد ${entry.count}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}

        <h3>الأصناف الأعلى مبيعًا</h3>
        <DataTable
          columns={["الصنف", "الكمية", "الإيراد"]}
          rows={topProducts.map((row, index) => ({
            key: row.productId || row.id || index,
            cells: [
              row.productName || row.name || "—",
              row.quantity ?? row.qty ?? "—",
              <MoneyCell key="r" value={row.revenue ?? row.total ?? row.netSales} />,
            ],
          }))}
        />
      </AsyncState>
    </section>
  );
}

function RangeFilters({ from, to, onFrom, onTo, extra, onApply, loading }) {
  return (
    <form className="fr-toolbar" onSubmit={onApply}>
      <Input label="من" type="date" value={from} onChange={(event) => onFrom(event.target.value)} />
      <Input label="إلى" type="date" value={to} onChange={(event) => onTo(event.target.value)} />
      {extra}
      <Button type="submit" loading={loading}>
        تحديث
      </Button>
    </form>
  );
}

function SalesTab() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [channel, setChannel] = useState("");
  const [page, setPage] = useState(1);
  const [formError, setFormError] = useState("");

  const params = useMemo(
    () => cleanParams({ from, to, channel: channel || undefined, page, limit: 10 }),
    [from, to, channel, page],
  );
  const query = useSalesReport(params);

  const apply = (event) => {
    event.preventDefault();
    if (from && to && from > to) {
      setFormError("تاريخ البداية يجب أن يسبق تاريخ النهاية");
      return;
    }
    const result = salesFilterSchema.safeParse(cleanParams({ from, to, channel: channel || undefined }));
    if (!result.success) {
      setFormError(firstReportFormError(result));
      return;
    }
    setFormError("");
    setPage(1);
    query.refetch();
  };

  const report = query.data;

  return (
    <section className="fr-section" aria-label="تقرير المبيعات">
      <RangeFilters
        from={from}
        to={to}
        onFrom={setFrom}
        onTo={setTo}
        loading={query.isFetching}
        onApply={apply}
        extra={
          <Select
            label="القناة"
            value={channel}
            onChange={(event) => setChannel(event.target.value)}
            options={CHANNEL_OPTIONS}
            placeholder="كل القنوات"
          />
        }
      />
      {formError && (
        <p className="fr-error" role="alert">
          {formError}
        </p>
      )}
      <AsyncState loading={query.isLoading} error={query.error} onRetry={query.refetch} empty={false}>
        <QualityBanner dataQuality={report?.dataQuality} failedSources={report?.failedSources} />
        <SummaryGrid summary={report?.summary} />
        <h3>اتجاه المبيعات</h3>
        <DataTable
          columns={["الفترة", "القناة", "الفواتير", "المبيعات", "التكلفة", "الربح"]}
          rows={(report?.items || []).map((row, index) => ({
            key: row.id || index,
            cells: [
              rowDate(row),
              rowChannel(row),
              rowInvoices(row),
              <MoneyCell key="s" value={row.sales ?? row.total ?? row.netSales} />,
              <MoneyCell key="c" value={row.cost ?? row.costTotal} />,
              <MoneyCell key="p" value={row.profit ?? row.profitTotal} />,
            ],
          }))}
        />
        <ServerPagination meta={report?.pageMeta} onPageChange={setPage} disabled={query.isFetching} label="صف" />
      </AsyncState>
    </section>
  );
}

function InventoryTab() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [formError, setFormError] = useState("");

  const params = useMemo(() => cleanParams({ from, to, page, limit: 10 }), [from, to, page]);
  const query = useInventoryReport(params);

  const apply = (event) => {
    event.preventDefault();
    if (from && to && from > to) {
      setFormError("تاريخ البداية يجب أن يسبق تاريخ النهاية");
      return;
    }
    setFormError("");
    setPage(1);
    query.refetch();
  };

  const report = query.data;
  const valueByMaterial = report?.breakdowns?.valueByMaterial || [];
  const expiring = report?.breakdowns?.expiring || [];

  return (
    <section className="fr-section" aria-label="تقرير المخزون">
      <RangeFilters from={from} to={to} onFrom={setFrom} onTo={setTo} onApply={apply} loading={query.isFetching} />
      {formError && (
        <p className="fr-error" role="alert">
          {formError}
        </p>
      )}
      <AsyncState loading={query.isLoading} error={query.error} onRetry={query.refetch} empty={false}>
        <QualityBanner dataQuality={report?.dataQuality} failedSources={report?.failedSources} />
        <SummaryGrid summary={report?.summary} />
        <h3>حركات المخزون</h3>
        <DataTable
          columns={["المادة", "نوع الحركة", "الكمية", "القيمة", "التاريخ"]}
          rows={(report?.items || []).map((row, index) => ({
            key: row.id || row.materialId || index,
            cells: [
              row.materialName || row.name || "—",
              row.movementType || row.type || row.kind || "—",
              row.quantity ?? row.qty ?? "—",
              <MoneyCell key="v" value={row.value ?? row.totalValue ?? row.amount} />,
              rowDate(row),
            ],
          }))}
        />
        <ServerPagination meta={report?.pageMeta} onPageChange={setPage} disabled={query.isFetching} label="حركة" />
        <h3>القيمة حسب المادة</h3>
        <DataTable
          columns={["المادة", "الكمية", "القيمة"]}
          rows={valueByMaterial.map((row, index) => ({
            key: row.materialId || index,
            cells: [
              row.materialName || row.name || "—",
              row.quantity ?? row.qty ?? "—",
              <MoneyCell key="v" value={row.value ?? row.totalValue ?? row.amount} />,
            ],
          }))}
        />
        <h3>مواد قريبة الانتهاء</h3>
        <DataTable
          columns={["المادة", "الكمية", "تاريخ الانتهاء"]}
          rows={expiring.map((row, index) => ({
            key: row.materialId || row.batchId || index,
            cells: [row.materialName || row.name || "—", row.quantity ?? row.qty ?? "—", row.expiryDate || row.expiresAt || "—"],
          }))}
        />
      </AsyncState>
    </section>
  );
}

function DrawerTab() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [formError, setFormError] = useState("");

  const params = useMemo(() => cleanParams({ from, to, page, limit: 10 }), [from, to, page]);
  const query = useDrawerReport(params);

  const apply = (event) => {
    event.preventDefault();
    if (from && to && from > to) {
      setFormError("تاريخ البداية يجب أن يسبق تاريخ النهاية");
      return;
    }
    setFormError("");
    setPage(1);
    query.refetch();
  };

  const report = query.data;
  const byClass = report?.breakdowns?.byAccountingClass || [];

  return (
    <section className="fr-section" aria-label="تقرير الدرج">
      <RangeFilters from={from} to={to} onFrom={setFrom} onTo={setTo} onApply={apply} loading={query.isFetching} />
      {formError && (
        <p className="fr-error" role="alert">
          {formError}
        </p>
      )}
      <AsyncState loading={query.isLoading} error={query.error} onRetry={query.refetch} empty={false}>
        <QualityBanner dataQuality={report?.dataQuality} failedSources={report?.failedSources} />
        <SummaryGrid summary={report?.summary} />
        <h3>حركات الدرج</h3>
        <DataTable
          columns={["التسلسل", "الاتجاه", "المبلغ", "البيان", "التاريخ"]}
          rows={(report?.items || []).map((row, index) => ({
            key: row.id || index,
            cells: [
              row.sequenceNo ?? row.shiftId ?? "—",
              row.direction === "IN" ? "وارد" : row.direction === "OUT" ? "صادر" : row.direction || "—",
              <MoneyCell key="a" value={row.amount ?? row.total} />,
              row.description || row.notes || row.sourceType || "—",
              row.recordedAt ? new Date(row.recordedAt).toLocaleString("ar-EG") : rowDate(row),
            ],
          }))}
        />
        <ServerPagination meta={report?.pageMeta} onPageChange={setPage} disabled={query.isFetching} label="حركة" />
        <h3>حسب الفئة المحاسبية</h3>
        <DataTable
          columns={["الفئة", "العدد", "الإجمالي"]}
          rows={byClass.map((row, index) => ({
            key: row.accountingClass || index,
            cells: [
              row.accountingClass || row.class || "—",
              row.count ?? row.transactions ?? "—",
              <MoneyCell key="t" value={row.total ?? row.amount} />,
            ],
          }))}
        />
      </AsyncState>
    </section>
  );
}

function SuppliersTab() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [page, setPage] = useState(1);
  const [formError, setFormError] = useState("");

  const params = useMemo(
    () => cleanParams({ from, to, supplierId: supplierId.trim() || undefined, page, limit: 10 }),
    [from, to, supplierId, page],
  );
  const query = useSupplierReport(params);

  const apply = (event) => {
    event.preventDefault();
    if (from && to && from > to) {
      setFormError("تاريخ البداية يجب أن يسبق تاريخ النهاية");
      return;
    }
    const trimmed = supplierId.trim();
    const result = supplierReportFilterSchema.safeParse(
      cleanParams({ from, to, supplierId: trimmed || undefined }),
    );
    if (!result.success) {
      setFormError(firstReportFormError(result));
      return;
    }
    setFormError("");
    setPage(1);
    query.refetch();
  };

  const report = query.data;
  const topDebtors = report?.breakdowns?.topDebtors || [];
  const recentEntries = report?.breakdowns?.recentEntries || [];

  return (
    <section className="fr-section" aria-label="تقرير الموردين">
      <RangeFilters
        from={from}
        to={to}
        onFrom={setFrom}
        onTo={setTo}
        onApply={apply}
        loading={query.isFetching}
        extra={
          <Input
            label="معرف المورد (اختياري)"
            placeholder="ObjectId للمورد"
            value={supplierId}
            onChange={(event) => setSupplierId(event.target.value)}
          />
        }
      />
      {formError && (
        <p className="fr-error" role="alert">
          {formError}
        </p>
      )}
      <AsyncState loading={query.isLoading} error={query.error} onRetry={query.refetch} empty={false}>
        <QualityBanner dataQuality={report?.dataQuality} failedSources={report?.failedSources} />
        <SummaryGrid summary={report?.summary} />
        <h3>حسابات الموردين</h3>
        <DataTable
          columns={["المورد", "الدين", "المستحق", "الإجمالي"]}
          rows={(report?.items || []).map((row, index) => ({
            key: row.supplierId || row.id || index,
            cells: [
              row.supplierName || row.name || "—",
              <MoneyCell key="d" value={row.debtBalance ?? row.totalDebt} />,
              <MoneyCell key="r" value={row.receivableBalance ?? row.totalReceivable} />,
              <MoneyCell key="t" value={row.total ?? row.balance} />,
            ],
          }))}
        />
        <ServerPagination meta={report?.pageMeta} onPageChange={setPage} disabled={query.isFetching} label="حساب" />
        <h3>أعلى المدينين</h3>
        <DataTable
          columns={["المورد", "الدين"]}
          rows={topDebtors.map((row, index) => ({
            key: row.supplierId || index,
            cells: [row.supplierName || row.name || "—", <MoneyCell key="d" value={row.debtBalance ?? row.totalDebt ?? row.total} />],
          }))}
        />
        <h3>أحدث القيود</h3>
        <DataTable
          columns={["المورد", "النوع", "المبلغ", "التاريخ"]}
          rows={recentEntries.map((row, index) => ({
            key: row.id || index,
            cells: [
              row.supplierName || row.name || "—",
              row.kind || row.type || "—",
              <MoneyCell key="a" value={row.amount ?? row.total} />,
              row.occurredOn || rowDate(row),
            ],
          }))}
        />
      </AsyncState>
    </section>
  );
}

function DelegatesTab() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [delegateId, setDelegateId] = useState("");
  const [page, setPage] = useState(1);
  const [formError, setFormError] = useState("");

  const params = useMemo(
    () => cleanParams({ from, to, delegateId: delegateId.trim() || undefined, page, limit: 10 }),
    [from, to, delegateId, page],
  );
  const query = useDelegateReport(params);

  const apply = (event) => {
    event.preventDefault();
    if (from && to && from > to) {
      setFormError("تاريخ البداية يجب أن يسبق تاريخ النهاية");
      return;
    }
    const trimmed = delegateId.trim();
    const result = delegateReportFilterSchema.safeParse(
      cleanParams({ from, to, delegateId: trimmed || undefined }),
    );
    if (!result.success) {
      setFormError(firstReportFormError(result));
      return;
    }
    setFormError("");
    setPage(1);
    query.refetch();
  };

  const report = query.data;
  const perDelegate = report?.breakdowns?.perDelegate || [];

  return (
    <section className="fr-section" aria-label="تقرير المناديب">
      <RangeFilters
        from={from}
        to={to}
        onFrom={setFrom}
        onTo={setTo}
        onApply={apply}
        loading={query.isFetching}
        extra={
          <Input
            label="معرف المندوب (اختياري)"
            placeholder="ObjectId للمندوب"
            value={delegateId}
            onChange={(event) => setDelegateId(event.target.value)}
          />
        }
      />
      {formError && (
        <p className="fr-error" role="alert">
          {formError}
        </p>
      )}
      <AsyncState loading={query.isLoading} error={query.error} onRetry={query.refetch} empty={false}>
        <QualityBanner dataQuality={report?.dataQuality} failedSources={report?.failedSources} />
        <SummaryGrid summary={report?.summary} />
        <h3>مهام المناديب</h3>
        <DataTable
          columns={["المندوب", "المهمة", "المبلغ", "الحالة"]}
          rows={(report?.items || []).map((row, index) => ({
            key: row.id || row.assignmentId || index,
            cells: [
              row.delegateName || row.name || row.delegateId || "—",
              row.title || row.assignmentNo || "—",
              <MoneyCell key="a" value={row.amount ?? row.total} />,
              row.status || "—",
            ],
          }))}
        />
        <ServerPagination meta={report?.pageMeta} onPageChange={setPage} disabled={query.isFetching} label="مهمة" />
        <h3>إجمالي كل مندوب</h3>
        <DataTable
          columns={["المندوب", "عدد المهام", "الإجمالي"]}
          rows={perDelegate.map((row, index) => ({
            key: row.delegateId || index,
            cells: [
              row.delegateName || row.name || "—",
              row.assignments ?? row.count ?? "—",
              <MoneyCell key="t" value={row.total ?? row.amount} />,
            ],
          }))}
        />
      </AsyncState>
    </section>
  );
}

function ExportsTab({ canExport }) {
  const [reportType, setReportType] = useState("sales");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [format, setFormat] = useState("XLSX");
  const [formError, setFormError] = useState("");
  const [statusUrl, setStatusUrl] = useState(null);

  const request = useRequestExport();
  const status = useExportStatus(statusUrl, { enabled: Boolean(statusUrl) });
  const job = status.data || null;

  const submit = (event) => {
    event.preventDefault();
    if (from && to && from > to) {
      setFormError("تاريخ البداية يجب أن يسبق تاريخ النهاية");
      return;
    }
    const result = exportRequestSchema.safeParse(cleanParams({ reportType, from, to, format }));
    if (!result.success) {
      setFormError(firstReportFormError(result));
      return;
    }
    setFormError("");
    request.mutate(result.data, {
      onSuccess: (data) => {
        setStatusUrl(data?.export?.statusUrl || data?.statusUrl || null);
      },
    });
  };

  if (!canExport) {
    return (
      <section className="fr-section" aria-label="التصدير">
        <p className="fr-error" role="alert">
          التصدير يتطلب صلاحية reports.export.
        </p>
      </section>
    );
  }

  return (
    <section className="fr-section" aria-label="التصدير">
      <h2>طلب تصدير تقرير</h2>
      <p className="fr-section-help">
        الحد الأقصى 500 صف للتصدير الواحد. بعد إرسال الطلب تتم متابعة حالته حتى يصبح جاهزًا أو
        يفشل. الخادم يعيد بيانات وصفية فقط (عدد الصفوف وبصمة التحقق) ولا يوجد تنزيل ملف.
      </p>
      <form className="fr-export-form" onSubmit={submit}>
        <Select label="نوع التقرير" value={reportType} onChange={(event) => setReportType(event.target.value)} options={REPORT_TYPES} required />
        <Input label="من" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        <Input label="إلى" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        <Select label="الصيغة" value={format} onChange={(event) => setFormat(event.target.value)} options={EXPORT_FORMATS} required />
        <Button type="submit" loading={request.isPending}>
          طلب التصدير
        </Button>
      </form>
      {formError && (
        <p className="fr-error" role="alert">
          {formError}
        </p>
      )}
      {request.isError && (
        <p className="fr-error" role="alert">
          {getArabicErrorMessage(request.error)}
        </p>
      )}
      {statusUrl && (
        <article className="fr-export-status">
          <h3>حالة التصدير</h3>
          <AsyncState loading={status.isLoading} error={status.error} onRetry={status.refetch} empty={false}>
            {job ? (
              <dl>
                <div>
                  <dt>الحالة</dt>
                  <dd>{job.statusLabel || job.status || "—"}</dd>
                </div>
                <div>
                  <dt>رقم التصدير</dt>
                  <dd>{job.exportNo || job.id || "—"}</dd>
                </div>
                <div>
                  <dt>التقدم</dt>
                  <dd>{job.progress ?? "—"}{job.progress !== null && job.progress !== undefined ? "%" : ""}</dd>
                </div>
                <div>
                  <dt>عدد الصفوف</dt>
                  <dd>{job.rowCount ?? "—"}</dd>
                </div>
                <div>
                  <dt>بصمة التحقق</dt>
                  <dd className="fr-mono">{job.checksum || "—"}</dd>
                </div>
                {job.errorCode && (
                  <div>
                    <dt>رمز الخطأ</dt>
                    <dd>{job.errorCode}</dd>
                  </div>
                )}
                {job.expiresAt && (
                  <div>
                    <dt>تنتهي في</dt>
                    <dd>{new Date(job.expiresAt).toLocaleString("ar-EG")}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="fr-empty">بانتظار حالة التصدير...</p>
            )}
          </AsyncState>
        </article>
      )}
    </section>
  );
}

export default function FinancialReportsPage() {
  const [tab, setTab] = useState("overview");
  const permissions = useAuthStore((state) => state.permissions);
  const canRead = can(permissions, "reports.read");
  const canExport = can(permissions, "reports.export");

  return (
    <div className="fr-page" dir="rtl">
      <PageHeader title="التقارير المالية" breadcrumbs={["الإدارة", "التقارير المالية"]} />
      {!canRead ? (
        <p className="fr-error" role="alert">
          عرض التقارير يتطلب صلاحية reports.read.
        </p>
      ) : (
        <>
          <div className="fr-tabs" role="tablist" aria-label="أقسام التقارير">
            {TABS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={tab === entry.id}
                className={tab === entry.id ? "active" : ""}
                onClick={() => setTab(entry.id)}
              >
                {entry.label}
              </button>
            ))}
          </div>
          {tab === "overview" && <OverviewTab />}
          {tab === "sales" && <SalesTab />}
          {tab === "inventory" && <InventoryTab />}
          {tab === "drawer" && <DrawerTab />}
          {tab === "suppliers" && <SuppliersTab />}
          {tab === "delegates" && <DelegatesTab />}
          {tab === "exports" && <ExportsTab canExport={canExport} />}
          {tab === "refunds" && <RefundsSection />}
        </>
      )}
    </div>
  );
}
