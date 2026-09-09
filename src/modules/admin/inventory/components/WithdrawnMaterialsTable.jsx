import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Boxes, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { getWithdrawals } from "../services/inventoryService";
import "./MaterialsTable.css";
import "./WithdrawnMaterialsTable.css";

function WithdrawnMaterialsTable() {
  const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(10);
  const query = useQuery({ queryKey: ["withdrawals", page, pageSize], queryFn: () => getWithdrawals({ page, pageSize }) });
  const rows = query.data?.data || []; const pagination = query.data?.pagination || { total: 0, totalPages: 1 };
  return <div className="materials-table-card"><div className="table-card-header"><div className="table-card-title"><Boxes size={20} /><span>سجل المواد المسحوبة يدويًا</span></div><button className="refresh-icon-btn" onClick={() => query.refetch()} aria-label="تحديث"><RefreshCw size={15} /></button></div>
    <div className="table-responsive"><table className="custom-materials-table"><thead><tr><th>م</th><th>المادة</th><th>الدفعة</th><th>الكمية</th><th>سعر الوحدة وقت السحب</th><th>إجمالي التكلفة</th><th>المورد</th><th>السبب</th><th>نفّذ بواسطة</th><th>التاريخ</th></tr></thead><tbody>{query.isLoading ? <tr><td colSpan="10">جاري التحميل...</td></tr> : rows.length === 0 ? <tr><td colSpan="10">لا توجد سحوبات مسجلة.</td></tr> : rows.map((row, index) => <tr key={row.id}><td>{(page - 1) * pageSize + index + 1}</td><td>{row.rawMaterial.name}</td><td>#{row.batch.batchNumber || row.batchId}</td><td>{Number(row.quantity)} {row.rawMaterial.unit}</td><td>{Number(row.unitCost).toFixed(2)}</td><td>{Number(row.totalCost).toFixed(2)}</td><td>{row.rawMaterial.supplier?.name || "—"}</td><td>{row.reason || "—"}</td><td>{row.processedBy.name}</td><td>{new Date(row.processedAt).toLocaleString("ar-EG")}</td></tr>)}</tbody></table></div>
    <div className="table-pagination"><div className="pagination-info"><select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}><option>10</option><option>25</option></select><span>إجمالي {pagination.total}</span></div><div className="pagination-controls"><button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronRight /></button><b>{page}</b><button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}><ChevronLeft /></button></div></div>
  </div>;
}
export default WithdrawnMaterialsTable;
