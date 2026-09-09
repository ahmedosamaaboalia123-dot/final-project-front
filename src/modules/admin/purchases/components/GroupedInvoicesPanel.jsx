import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Layers3, X } from "lucide-react";
import { getPurchaseGroups } from "../services/purchasesService";

const money = (value) => Number(value || 0).toLocaleString("ar-EG", { minimumFractionDigits: 2 });

function GroupDetails({ group, onClose, onOpenPurchase }) {
  return <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}><div className="preview-modal-content grouped-invoice-modal"><div className="modal-header"><div className="modal-header-title"><Layers3 size={18} /><h2>الفاتورة المجمعة {group.groupNo}</h2><span className={`inv-status-pill ${group.status.toLowerCase()}`}>{group.status === "DRAFT" ? "مسودة" : "جاهزة"}</span></div><button className="close-modal-btn" onClick={onClose}><X size={18} /></button></div><div className="modal-body">
    <div className="group-summary-grid"><div><span>التاريخ</span><strong>{String(group.invoiceDate).slice(0, 10)}</strong></div><div><span>عدد الموردين</span><strong>{group.purchases.length}</strong></div><div><span>عدد المواد</span><strong>{group.purchases.reduce((sum, purchase) => sum + purchase.items.length, 0)}</strong></div><div><span>الإجمالي</span><strong>{money(group.finalTotal)} ج.م</strong></div></div>
    <div className="group-supplier-list">{group.purchases.map((purchase) => <section className="group-supplier-card" key={purchase.id}><header><div><strong>{purchase.supplier.name}</strong><small>فاتورة {purchase.invoiceNo}</small></div><div><b>{money(purchase.finalTotal)} ج.م</b><span className="two-state-pill">{purchase.status === "DRAFT" ? "مسودة" : "جاهزة"}</span></div></header><div className="group-items-list">{purchase.items.map((item) => <span key={item.id}>{item.rawMaterial?.name} · {Number(item.quantity)} {item.unit}</span>)}</div><button className="group-open-child" onClick={() => onOpenPurchase(purchase.id)}><Eye size={14} />عرض فاتورة المورد</button></section>)}</div>
  </div></div></div>;
}

function GroupedInvoicesPanel({ onOpenPurchase }) {
  const [selected, setSelected] = useState(null);
  const query = useQuery({ queryKey: ["purchase-groups"], queryFn: () => getPurchaseGroups({ page: 1, pageSize: 30 }) });
  const groups = query.data?.data || [];
  return <><section className="grouped-invoices-section"><div className="grouped-section-header"><div><h3>الفواتير المجمعة</h3><p>فاتورة واحدة لكل عملية، وتحتها فاتورة مستقلة لكل مورد</p></div><span>{groups.length}</span></div><div className="grouped-invoices-grid">{groups.length === 0 ? <div className="grouped-empty">لا توجد فواتير مجمعة حتى الآن.</div> : groups.map((group) => <article className="grouped-invoice-card" key={group.id}><div className="grouped-card-main"><div className="grouped-icon"><Layers3 size={17} /></div><div><strong>{group.groupNo}</strong><small>{String(group.invoiceDate).slice(0, 10)} · {group.purchases.length} مورد</small></div></div><div className="grouped-card-total"><b>{money(group.finalTotal)} ج.م</b><span className={`two-state-pill ${group.status.toLowerCase()}`}>{group.status === "DRAFT" ? "مسودة" : "جاهزة"}</span></div><button onClick={() => setSelected(group)}><Eye size={14} />عرض</button></article>)}</div></section>{selected && <GroupDetails group={selected} onClose={() => setSelected(null)} onOpenPurchase={(id) => { setSelected(null); onOpenPurchase(id); }} />}</>;
}
export default GroupedInvoicesPanel;
