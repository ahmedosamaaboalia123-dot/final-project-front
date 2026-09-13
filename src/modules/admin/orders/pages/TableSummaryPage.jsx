import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Plus } from "lucide-react";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import { ConfirmAction, Money, PrintDocument } from "@/shared/components";
import { ordersApi } from "../api/orders.api";
import { useSessionDetails, useTableDetails } from "../hooks/order.queries";
import { useCancelSession, useCloseSession } from "../hooks/order.mutations";
import "../styles/TableSummary.css";
const errorText = (e) => e?.response?.data?.error?.messageAr || e?.message || "تعذر تنفيذ العملية";
export default function TableSummaryPage() { const { tableNumber: tableId } = useParams(); const navigate = useNavigate(); const tableQuery = useTableDetails(tableId); const sessionId = tableQuery.data?.session?.id; const sessionQuery = useSessionDetails(sessionId); const close = useCloseSession(); const cancel = useCancelSession(); const [error, setError] = useState(""); const tableNo = tableQuery.data?.table?.tableNumber || ""; const session = sessionQuery.data?.session; const order = sessionQuery.data?.order; const rows = sessionQuery.data?.items || [];
  const closeTable = async () => { const amount = String(order?.balanceDue || order?.total || "0"); try { await close.mutateAsync({ sessionId, body: { expectedVersion: session.version, ...(Number(amount) > 0 ? { payment: { method: "CASH", amount } } : {}) } }); navigate("/admin/orders/tables"); } catch (e) { setError(errorText(e)); } };
  const cancelTable = async (reason) => { try { await cancel.mutateAsync({ sessionId, body: { reason, expectedVersion: session.version } }); navigate("/admin/orders/tables"); } catch (e) { setError(errorText(e)); } };
  if (tableQuery.isLoading || (sessionId && sessionQuery.isLoading)) return <p>جاري تحميل الطاولة...</p>;
  return <div className="table-summary-page"><PageHeader title={`طاولة ${tableNo}`} breadcrumbs={["الطلبات", "الطاولات", `طاولة ${tableNo}`]}/>{error && <p role="alert">{error}</p>}<div className="table-summary-header"><button className="btn-back" onClick={() => navigate("/admin/orders/tables")}><ArrowRight size={16}/>رجوع</button><span>{tableQuery.data?.occupancy === "OCCUPIED" ? "مشغولة" : "فارغة"}</span></div>
    {order ? <><div className="table-order-card"><strong>طلب {order.orderNumber}</strong><span>{order.status}</span><span>{rows.length} منتج</span><Money value={order.total}/>{rows.map((x, i) => <div key={`${x.productName}-${i}`}>{x.productName} — {x.sizeName} × {x.quantity} — {x.status}</div>)}</div><div className="table-summary-actions"><button className="btn-table-action btn-table-action--new" onClick={() => navigate(`/admin/orders/sales/table/${tableId}`)}><Plus size={16}/>إضافة منتجات</button><PrintDocument title={`طاولة ${tableNo}`} loadPrintData={() => ordersApi.sessionPrint(sessionId)}/><ConfirmAction title="إلغاء جلسة الطاولة" requireReason pending={cancel.isPending} danger onConfirm={cancelTable}><span>إلغاء الطلب</span></ConfirmAction><ConfirmAction title="إنهاء الطلب" message="سيتم تحصيل المبلغ نقدًا وإغلاق الطاولة وإنشاء الفاتورة." pending={close.isPending} onConfirm={closeTable}><span>إنهاء وطباعة</span></ConfirmAction></div></> : <div className="table-summary-empty">الطاولة فارغة.<button onClick={() => navigate(`/admin/orders/sales/table/${tableId}`)}>إنشاء طلب</button></div>}</div>;
}
