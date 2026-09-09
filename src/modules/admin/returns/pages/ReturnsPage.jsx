import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Search, CheckCircle2, Eye } from "lucide-react";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import { getAdminSocket } from "@/services/realtime";
import { getReturnableMaterialOptions } from "@/modules/admin/inventory/services/inventoryService";
import { createRawMaterialReturn, getRawMaterialReturns } from "../services/returnsService";
import "./ReturnsPage.css";

const money = (value) => Number(value || 0).toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const qty = (value) => Number(value || 0).toLocaleString("ar-EG", { maximumFractionDigits: 6 });
const availableQty = (item) => (item.batches || []).reduce((sum, batch) => sum + Math.max(Number(batch.quantity || 0), 0), 0);
const averageCost = (item) => {
  const available = availableQty(item);
  return available > 0 ? (item.batches || []).reduce((sum, batch) => sum + Math.max(Number(batch.quantity || 0), 0) * Number(batch.pricePerUnit || 0), 0) / available : 0;
};
const normalizeSearch = (value) => String(value || "")
  .trim().toLocaleLowerCase("ar")
  .normalize("NFKD")
  .replace(/[\u064B-\u065F\u0670]/g, "")
  .replace(/[أإآ]/g, "ا")
  .replace(/ة/g, "ه")
  .replace(/ى/g, "ي");

export default function ReturnsPage() {
  const client = useQueryClient();
  const [quantities, setQuantities] = useState({});
  const [materialSearch, setMaterialSearch] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");

  const materialsQuery = useQuery({
    queryKey: ["returnable-raw-materials"],
    queryFn: getReturnableMaterialOptions,
    staleTime: 30 * 1000,
  });
  const returns = useQuery({
    queryKey: ["raw-material-returns", search],
    queryFn: () => getRawMaterialReturns({ page: 1, pageSize: 30, search }),
  });

  const materials = (materialsQuery.data?.data || []).filter((item) => availableQty(item) > 0);
  const normalizedMaterialSearch = normalizeSearch(materialSearch);
  const items = materials.filter((item) => !normalizedMaterialSearch || normalizeSearch(`${item.name} ${item.unit || ""}`).includes(normalizedMaterialSearch));
  const logs = returns.data?.data || [];
  const summary = returns.data?.summary || {};

  const selectedTotals = useMemo(() => materials.reduce((acc, item) => {
    const amount = Number(quantities[item.id] || 0);
    acc.quantity += amount;
    acc.value += amount * averageCost(item);
    return acc;
  }, { quantity: 0, value: 0 }), [materials, quantities]);

  const createReturn = useMutation({
    mutationFn: () => createRawMaterialReturn({
      items: materials.map((item) => ({
        rawMaterialId: item.id,
        quantity: Number(quantities[item.id] || 0),
      })).filter((item) => item.quantity > 0),
    }),
    onSuccess: () => {
      setMessage("تم اعتماد مرتجع المواد الخام وتحديث المخزون وحساب المورد.");
      setQuantities({});
      client.invalidateQueries({ queryKey: ["raw-material-returns"] });
      client.invalidateQueries({ queryKey: ["returnable-raw-materials"] });
      client.invalidateQueries({ queryKey: ["raw-materials"] });
      client.invalidateQueries({ queryKey: ["suppliers"] });
      client.invalidateQueries({ queryKey: ["warnings"] });
    },
    onError: (error) => setMessage(error?.response?.data?.message || error.message),
  });

  useEffect(() => {
    const socket = getAdminSocket();
    const refresh = () => {
      client.invalidateQueries({ queryKey: ["raw-material-returns"] });
      client.invalidateQueries({ queryKey: ["returnable-raw-materials"] });
      client.invalidateQueries({ queryKey: ["raw-materials"] });
      client.invalidateQueries({ queryKey: ["suppliers"] });
      client.invalidateQueries({ queryKey: ["warnings"] });
    };
    socket.on("purchase:return:created", refresh);
    return () => socket.off("purchase:return:created", refresh);
  }, [client]);

  const submit = () => {
    if (selectedTotals.quantity <= 0) return setMessage("حدد مادة خام واحدة على الأقل وأدخل الكمية.");
    if (!window.confirm(`تأكيد إرجاع المواد المحددة؟ سيتم خصمها فورًا من المخزون بدون أي تأثير مالي.`)) return;
    createReturn.mutate();
  };

  const toggleItem = (item, checked) => setQuantities((old) => ({
    ...old,
    [item.id]: checked ? Math.min(1, availableQty(item)) : "",
  }));

  return <div className="returns-page">
    <PageHeader title="مرتجعات المواد الخام" breadcrumbs={["الرئيسية", "مرتجعات المواد الخام"]} icon={RotateCcw}/>
    <div className="returns-page-container">
      {message && <div className="form-feedback">{message}</div>}

      <section className="returns-card">
        <div className="simple-return-heading"><div><h3 className="returns-card-title">إرجاع مواد خام</h3><p>حدد المواد والكميات مباشرة، بدون فاتورة أو مورد وبدون تأثير على الديون.</p></div><div><span>{summary.approvedCount || 0} مرتجع</span><strong>{money(summary.totalValue)} ج.م</strong></div></div>
        <div className="returns-form-grid simple-invoice-picker">
          <label>بحث عن مادة خام<input value={materialSearch} onChange={(e) => setMaterialSearch(e.target.value)} placeholder="اكتب اسم المادة"/></label>
        </div>
        <div className="returns-table-wrapper"><table className="returns-custom-table">
          <thead><tr><th>تحديد</th><th>المادة الخام</th><th>الوحدة</th><th>المتاح</th><th>الكمية المرتجعة</th></tr></thead>
          <tbody>{items.length === 0 ? <tr><td colSpan="5">لا توجد مواد متاحة.</td></tr> : items.map((item) => {
            const available = availableQty(item);
            const amount = Number(quantities[item.id] || 0);
            return <tr key={item.id}>
              <td><input className="return-item-checkbox" type="checkbox" checked={amount > 0} onChange={(e) => toggleItem(item, e.target.checked)}/></td>
              <td className="return-material-name">{item.name}</td><td>{item.unit}</td><td>{qty(available)} {item.unit}</td>
              <td><input type="number" min="0" max={available} step="any" disabled={amount <= 0} value={quantities[item.id] || ""} onChange={(e) => setQuantities((old) => ({ ...old, [item.id]: e.target.value }))}/></td>
            </tr>;
          })}</tbody>
        </table></div>
        <div className="returns-actions-row"><div><span>{qty(selectedTotals.quantity)} كمية محددة</span><strong>الإجمالي: {money(selectedTotals.value)} ج.م</strong></div><button className="btn-approve-return" onClick={submit} disabled={createReturn.isPending || selectedTotals.quantity <= 0}><CheckCircle2/>{createReturn.isPending ? "جارٍ التحديث..." : "تأكيد المرتجع"}</button></div>
      </section>

      <section className="returns-card">
        <div className="returns-card-header"><h3 className="returns-card-title">سجل مرتجعات المواد الخام</h3><label className="returns-search"><Search/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="رقم المرتجع أو الفاتورة أو المورد"/></label></div>
        <div className="returns-table-wrapper"><table className="returns-custom-table">
          <thead><tr><th>رقم المرتجع</th><th>التاريخ</th><th>المواد</th><th>الكمية</th><th>القيمة المخزنية</th><th>الحالة</th><th></th></tr></thead>
          <tbody>{logs.length === 0 ? <tr><td colSpan="7">لا توجد مرتجعات.</td></tr> : logs.map((entry) => <tr key={entry.id}>
            <td>{entry.returnNo}</td><td>{new Date(entry.returnDate).toLocaleString("ar-EG")}</td><td>{[...new Set(entry.items.map((item) => item.rawMaterial?.name))].join(" — ")}</td><td>{entry.items.map((item) => `${qty(item.quantity)} ${item.unit}`).join(" — ")}</td><td>{money(entry.totalValue)} ج.م</td><td>{entry.status === "APPROVED" ? "معتمد" : entry.status}</td><td><button className="btn-view-log-details" onClick={() => setSelected(entry)}><Eye/>تفاصيل</button></td>
          </tr>)}</tbody>
        </table></div>
      </section>
    </div>
    {selected && <div className="returns-modal-overlay" onClick={() => setSelected(null)}><div className="returns-modal-content" onClick={(e) => e.stopPropagation()}><h3>{selected.returnNo}</h3><div className="returns-table-wrapper"><table className="returns-custom-table"><thead><tr><th>الخامة</th><th>الدفعة المسحوب منها</th><th>الكمية</th><th>التكلفة</th><th>الإجمالي</th></tr></thead><tbody>{selected.items.map((item) => <tr key={item.id}><td>{item.rawMaterial?.name}</td><td>{item.batch?.batchNumber || "—"}</td><td>{qty(item.quantity)} {item.unit}</td><td>{money(item.pricePerUnit)}</td><td>{money(item.totalPrice)}</td></tr>)}</tbody></table></div><button className="btn-cancel-return" onClick={() => setSelected(null)}>إغلاق</button></div></div>}
  </div>;
}
