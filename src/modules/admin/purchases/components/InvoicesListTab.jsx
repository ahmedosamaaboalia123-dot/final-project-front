import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Eye, Pencil, Check, Trash2, ChevronRight, ChevronLeft, Loader2, Search as SearchIcon, RefreshCw
} from "lucide-react";
import InvoiceViewModal from "./InvoiceViewModal";
import GroupedInvoicesPanel from "./GroupedInvoicesPanel";
import { getPurchases } from "../services/purchasesService";

const STATUS_LABELS = {
  DRAFT: "مسودة",
  READY: "جاهزة",
};

const fmt = (v) => Number(v || 0).toLocaleString("ar-EG", { minimumFractionDigits: 2 });

const visibleStatus = (status) => status === "DRAFT" ? "DRAFT" : "READY";

function InvoicesListTab({ onEditRequest }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const listQuery = useQuery({
    queryKey: ["purchases", page, pageSize, status, debouncedSearch],
    queryFn: () => getPurchases({ page, pageSize, ...(status ? { status } : {}), ...(debouncedSearch ? { search: debouncedSearch } : {}) }),
  });

  const countQuery = useQuery({
    queryKey: ["purchases-count"],
    queryFn: () => getPurchases({ page: 1, pageSize: 1 }),
  });

  const rows = listQuery.data?.data || [];
  const pagination = listQuery.data?.pagination || { total: 0, totalPages: 1 };
  const totalCount = countQuery.data?.pagination?.total || 0;

  const onChanged = () => listQuery.refetch();

  if (listQuery.isLoading && rows.length === 0) {
    return <div className="list-loading"><Loader2 size={22} className="spin" /> جارٍ تحميل الفواتير...</div>;
  }

  return (
    <div className="invoices-list-tab">
      <GroupedInvoicesPanel onOpenPurchase={setSelectedId} />
      <div className="invoice-table-card">
        <div className="table-card-header filters-row">
          <div>
            <h3>الفواتير</h3>
            <p className="sub-text">إجمالي {totalCount} فاتورة</p>
          </div>
          <div className="list-filters">
            <div className="filter-search-wrap">
              <SearchIcon size={16} className="search-icon-inside" />
              <input type="text" className="purchases-input filter-search-input" placeholder="بحث برقم الفاتورة أو المورد..."
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="purchases-input purchases-select filter-status-select"
              value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">كل الحالات</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button type="button" className="refresh-btn" onClick={onChanged} title="تحديث"><RefreshCw size={16} /></button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="purchases-table invoices-status-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}>م</th>
                <th className="text-right">رقم الفاتورة</th>
                <th className="text-right">المورد</th>
                <th>التاريخ</th>
                <th>البنود</th>
                <th>الإجمالي النهائي</th>
                <th>المتبقي</th>
                <th>الحالة</th>
                <th className="sticky-actions-col">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="9" className="empty-table-cell">لا توجد فواتير مطابقة.</td></tr>
              ) : rows.map((inv, idx) => (
                <tr key={inv.id}>
                  <td>{(page - 1) * pageSize + idx + 1}</td>
                  <td className="text-right font-bold-name">{inv.invoiceNo}</td>
                  <td className="text-right">{inv.supplier?.name || "—"}</td>
                  <td dir="ltr">{(inv.invoiceDate || "").split("T")[0]}</td>
                  <td>{inv._count?.items ?? inv.itemsCount}</td>
                  <td className="font-bold">{fmt(inv.finalTotal)}</td>
                  <td>{fmt(inv.remainingBalance)}</td>
                  <td><span className={`inv-status-pill ${visibleStatus(inv.status).toLowerCase()}`}>{STATUS_LABELS[visibleStatus(inv.status)]}</span></td>
                  <td className="sticky-actions-col">
                    <div className="row-actions-group">
                      <button type="button" className="action-btn edit-btn" title="عرض" onClick={() => setSelectedId(inv.id)}>
                        <Eye size={15} /><span>عرض</span>
                      </button>
                      {inv.status === "DRAFT" && (
                        <>
                          {!inv.groupId && <button type="button" className="action-btn edit-btn" title="تعديل" onClick={() => onEditRequest(inv.id)}>
                            <Pencil size={15} /><span>تعديل</span>
                          </button>}
                          <button type="button" className="action-btn adjust-btn" title="اعتماد" onClick={() => setSelectedId(inv.id)}>
                            <Check size={15} /><span>اعتماد</span>
                          </button>
                          {!inv.groupId && <button type="button" className="action-btn cancel-item-btn" title="حذف" onClick={() => setSelectedId(inv.id)}>
                            <Trash2 size={15} /><span>حذف</span>
                          </button>}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="pagination-row">
            <button type="button" className="page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronRight size={16} />
            </button>
            <span className="page-info">صفحة {pagination.page} من {pagination.totalPages} ({pagination.total} فاتورة)</span>
            <button type="button" className="page-btn" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronLeft size={16} />
            </button>
          </div>
        )}
      </div>

      {selectedId && <InvoiceViewModal purchaseId={selectedId} onClose={() => setSelectedId(null)} onEditRequest={onEditRequest} />}
    </div>
  );
}

export default InvoicesListTab;
