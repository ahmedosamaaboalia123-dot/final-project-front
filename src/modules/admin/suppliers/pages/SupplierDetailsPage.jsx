import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Building2, Package, Receipt, Truck } from "lucide-react";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import SupplierEditor from "../components/SupplierEditor";
import useSupplierDetails from "../hooks/useSupplierDetails";
import "./SupplierDetailsPage.css";

const today = () => new Date().toISOString().slice(0, 10);
const operations = {
  DEBT: { label:"تسجيل دين", type:"DEBT", category:"DEBT", help:"مبلغ علينا للمورد بسبب توريد أو التزام" },
  DEBT_PAYMENT: { label:"دفعة للدين", type:"PAYMENT", category:"DEBT", help:"تخصم من رصيد الديون" },
  RECEIVABLE: { label:"تسجيل مستحق لنا", type:"RECEIVABLE", category:"RECEIVABLE", help:"مبلغ لنا عند المورد ويزيد حقوقنا عليه" },
  RECEIVABLE_PAYMENT: { label:"تحصيل مستحق", type:"PAYMENT", category:"RECEIVABLE", help:"دفعة استلمناها من المورد وتخصم من المستحق لنا" },
};
const money = (value) => `${Number(value || 0).toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م`;

export default function SupplierDetailsPage() {
  const { id } = useParams(); const navigate = useNavigate();
  const [operation, setOperation] = useState("DEBT"); const [transaction, setTransaction] = useState({ amount:"", transactionDate:today(), notes:"" });
  const { supplierQuery: query, transactionsQuery, addTransaction: add, refreshSupplier: refresh } = useSupplierDetails(id, {
    onSuccess: () => setTransaction({ amount:"", transactionDate:today(), notes:"" }),
  });
  if (query.isLoading) return <div className="supplier-state">جاري تحميل المورد...</div>;
  if (!query.data) return <div className="supplier-state supplier-state--error">تعذر تحميل المورد.</div>;
  const supplier = query.data;
  const transactions = transactionsQuery.data?.data || supplier.transactions || [];
  const materials = supplier.rawMaterials || [];
  const effect = (row) => ["PAYMENT", "PURCHASE_RETURN", "RETURN"].includes(row.type) ? -Number(row.amount) : Number(row.amount);
  const debtBalance = Math.max(0, Number(supplier.openingBalance || 0) + transactions.filter((row) => row.category === "DEBT").reduce((sum, row) => sum + effect(row), 0));
  const receivableBalance = Math.max(0, transactions.filter((row) => row.category === "RECEIVABLE").reduce((sum, row) => sum + effect(row), 0));
  const apiSummary = transactionsQuery.data?.summary;
  const summary = supplier.accountSummary || (apiSummary ? {
    debtBalance:Number(apiSummary.totalOut || 0),
    receivableBalance:Number(apiSummary.totalIn || 0),
    netBalance:Number(apiSummary.balance || 0),
  } : { debtBalance, receivableBalance, netBalance:debtBalance - receivableBalance });
  const netBalance = Number(summary.netBalance ?? (summary.debtBalance - summary.receivableBalance));
  const netLabel = netBalance > 0 ? "صافي للمورد عندنا" : netBalance < 0 ? "صافي لنا عند المورد" : "الحساب متعادل";
  const selected = operations[operation];
  const saveTransaction = (e) => { e.preventDefault(); add.mutate({ type:selected.type, category:selected.category, amount:Number(transaction.amount), transactionDate:transaction.transactionDate, notes:transaction.notes.trim() }); };
  return <div className="supplier-details-page"><PageHeader title={`المورد: ${supplier.name}`} breadcrumbs={["الموردين", "تفاصيل المورد"]} icon={Truck}/><main className="supplier-details-container">
    <button className="supplier-back-btn" onClick={() => navigate("/admin/suppliers")}><ArrowRight size={17}/>رجوع للموردين</button>

    <section className="supplier-section"><header><Building2 size={19}/><div><h2>البيانات الأساسية</h2><p>بيانات المورد والمسؤول وبيانات التعامل</p></div></header><SupplierEditor supplier={supplier} onSaved={refresh}/></section>

    <section className="supplier-section"><header><Package size={19}/><div><h2>المواد الخام المرتبطة</h2><p>{materials.length} مادة مرتبطة بالمورد</p></div></header><div className="supplier-table-wrap"><table><thead><tr><th>الكود</th><th>المادة الخام</th><th>الوحدة</th><th>الكمية المتاحة</th></tr></thead><tbody>{materials.length ? materials.map((material) => <tr key={material.id}><td>RM-{material.id}</td><td>{material.name}</td><td>{material.unit}</td><td>{(material.batches || []).reduce((sum, batch) => sum + Number(batch.quantity), 0).toLocaleString("ar-EG")}</td></tr>) : <tr><td colSpan="4">لا توجد مواد خام مرتبطة بالمورد.</td></tr>}</tbody></table></div></section>

    <section className="supplier-summary"><article><span>الدين — للمورد عندنا</span><strong>{money(summary.debtBalance)}</strong></article><article><span>المستحق — لنا عند المورد</span><strong>{money(summary.receivableBalance)}</strong></article><article className="supplier-summary__total"><span>{netLabel}</span><strong>{money(Math.abs(netBalance))}</strong></article></section>

    <section className="supplier-section"><header><Receipt size={19}/><div><h2>تسجيل الديون والمستحقات والدفعات</h2><p>اختر العملية ثم أدخل المبلغ والتاريخ</p></div></header><div className="transaction-operation-tabs" role="group" aria-label="نوع المعاملة">{Object.entries(operations).map(([key, item]) => <button type="button" key={key} className={operation === key ? "active" : ""} onClick={() => setOperation(key)}>{item.label}</button>)}</div><p className="operation-help">{selected.help}</p>
      <form className="transaction-compact-form" onSubmit={saveTransaction}><label className="compact-field"><span>نوع العملية</span><input value={selected.label} readOnly/></label><label className="compact-field"><span>المبلغ</span><input type="number" min="0.01" step="0.01" required value={transaction.amount} onChange={(e) => setTransaction({ ...transaction, amount:e.target.value })}/></label><label className="compact-field"><span>التاريخ</span><input type="date" required value={transaction.transactionDate} onChange={(e) => setTransaction({ ...transaction, transactionDate:e.target.value })}/></label><label className="compact-field"><span>ملاحظات</span><input value={transaction.notes} onChange={(e) => setTransaction({ ...transaction, notes:e.target.value })}/></label><div className="compact-form-actions"><button disabled={add.isPending}>{add.isPending ? "جاري الحفظ..." : "حفظ المعاملة"}</button>{add.isError && <span role="alert">{add.error?.response?.data?.message || "تعذر حفظ المعاملة"}</span>}</div></form>
    </section>

    <section className="supplier-section"><header><Receipt size={19}/><div><h2>كشف حساب المورد</h2><p>جميع الديون والمستحقات والدفعات والمرتجعات — السجل غير قابل للحذف</p></div></header>{transactionsQuery.isError && <div className="supplier-state supplier-state--error" role="alert">تعذر تحميل كشف حساب المورد.</div>}<div className="supplier-table-wrap"><table><thead><tr><th>العملية</th><th>الحساب</th><th>المبلغ</th><th>التأثير</th><th>التاريخ</th><th>المصدر</th></tr></thead><tbody>{transactionsQuery.isLoading ? <tr><td colSpan="6">جاري تحميل كشف الحساب...</td></tr> : transactions.length ? transactions.map((row) => { const isPayment = row.type === "PAYMENT"; const isReturn = ["PURCHASE_RETURN", "RETURN"].includes(row.type); const isPurchase = row.type === "PURCHASE"; const rowDate = row.transactionDate || row.date || row.invoiceDate || row.returnDate; return <tr key={`${row.type}-${row.id}`}><td>{isReturn ? "مرتجع مشتريات" : isPayment ? "دفعة" : isPurchase ? "مشتريات" : row.type === "DEBT" ? "دين" : "مستحق"}</td><td>{row.category === "RECEIVABLE" || isReturn ? "المستحقات" : "الديون"}</td><td>{money(row.amount)}</td><td className={isPayment || isReturn ? "amount-minus" : "amount-plus"}>{isPayment || isReturn ? "خصم" : "إضافة"}</td><td>{rowDate ? new Date(rowDate).toLocaleDateString("ar-EG") : "—"}</td><td>{row.invoiceNo ? `فاتورة ${row.invoiceNo}` : row.returnNo ? `مرتجع ${row.returnNo}` : row.purchaseId ? `فاتورة #${row.purchaseId}` : row.returnId ? `مرتجع #${row.returnId}` : row.notes || "يدوي"}</td></tr>; }) : <tr><td colSpan="6">لا توجد معاملات مالية.</td></tr>}</tbody></table></div></section>
  </main></div>;
}
