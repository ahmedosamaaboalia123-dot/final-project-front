import { useNavigate } from "react-router-dom";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import { useTableSummaries } from "../hooks/useTableSummaries";
import "../styles/TablesScreen.css";

const TABLE_COUNT = 20;

export default function TablesScreen() {
  const navigate = useNavigate();
  const { data: summaries = [], isLoading, error } = useTableSummaries();

  const byTable = new Map((summaries || []).map((s) => [Number(s.table), s]));

  const tables = Array.from({ length: TABLE_COUNT }, (_, i) => {
    const tableNum = i + 1;
    return { id: tableNum, summary: byTable.get(tableNum) };
  });

  const openTable = (table) => {
    if (table.summary) {
      navigate(`/admin/orders/tables/${table.id}`);
    } else {
      navigate(`/admin/orders/sales/table/${table.id}`);
    }
  };

  return (
    <div className="tables-page">
      <PageHeader title="الطاولات" breadcrumbs={["الطلبات", "الطاولات"]} />
      {error && <p role="alert" className="tables-error">{error?.response?.data?.message || error?.message}</p>}

      {isLoading ? (
        <p className="tables-loading">جاري تحميل الطاولات...</p>
      ) : (
        <div className="tables-grid">
          {tables.map((table) => {
            const isBusy = Boolean(table.summary);
            return (
              <button
                key={table.id}
                className={`table-card ${isBusy ? "table-card--busy" : ""}`}
                onClick={() => openTable(table)}
                type="button"
              >
                <span className="table-card__number">{table.id}</span>
                <span className="table-card__label">
                  {isBusy ? "مشغول" : "فارغة"}
                </span>
                {isBusy && table.summary.orderCount > 1 && (
                  <span className="table-card__orders">
                    {table.summary.orderCount} طلب
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}