import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Coffee, Minus, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import { createAdminOnlineOrder, createAdminTableOrder } from "../services/adminOrdersGateway";
import { getProductCatalog, getProductsForSection } from "../services/adminProductsService";
import "../styles/SalesPage.css";

export default function SalesPage() {
  const { type, id } = useParams();
  const navigate = useNavigate();

  const [sections, setSections] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [invoice, setInvoice] = useState([]);
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [fulfillmentType, setFulfillmentType] = useState("PICKUP");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const isTable = type === "table";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProductCatalog()
      .then((catalog) => {
        if (cancelled) return;
        setSections(catalog.categories);
        setProducts(catalog.products);
        if (catalog.categories.length) setActiveSection(catalog.categories[0]);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.response?.data?.message || e.message);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const visible = useMemo(
    () => (activeSection ? getProductsForSection(products, activeSection) : products),
    [products, activeSection]
  );

  const add = (product, variant, size) =>
    setInvoice((current) => {
      const key = `${product.id}-${size.id}`;
      const found = current.find((x) => x.key === key);
      if (found) return current.map((x) => (x.key === key ? { ...x, qty: x.qty + 1 } : x));
      return [
        ...current,
        {
          key,
          productId: product.id,
          productSizeId: size.id,
          name: product.name,
          variant: variant.type,
          size: size.name,
          price: Number(size.sellingPrice ?? size.finalPrice ?? size.price),
          qty: 1,
        },
      ];
    });

  const updateQty = (index, delta) =>
    setInvoice((x) =>
      x.map((v, i) =>
        i === index ? { ...v, qty: Math.max(1, v.qty + delta) } : v
      )
    );

  const removeItem = (index) => setInvoice((x) => x.filter((_, i) => i !== index));

  const total = invoice.reduce((sum, item) => sum + item.price * item.qty, 0);

  const confirm = async () => {
    if (!invoice.length || saving) return;
    if (!isTable && (!customer.name.trim() || !customer.phone.trim() || (fulfillmentType === "DELIVERY" && !customer.address.trim()))) {
      setError("الاسم ورقم الهاتف مطلوبان، والعنوان مطلوب عند اختيار التوصيل");
      return;
    }
    const idempotencyKey = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setSaving(true);
    setError("");
    try {
      const order = isTable
        ? await createAdminTableOrder({ tableNumber: Number(id), items: invoice }, idempotencyKey)
        : await createAdminOnlineOrder({
            ...customer,
            customerName: customer.name,
            fulfillmentType,
            items: invoice,
          }, idempotencyKey);
      if (isTable) {
        navigate(`/admin/orders/tables/${id}`, { replace: true });
      } else {
        navigate(type === "takeaway" ? "/admin/orders/takeaway" : "/admin/orders/online", { replace: true });
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sales-page">
      <PageHeader
        title={isTable ? `بيع - طاولة ${id}` : "طلب أونلاين"}
        breadcrumbs={["الطلبات", "صفحة البيع"]}
      />

      {error && <p role="alert" className="sales-error">{error}</p>}

      {loading && <p className="sales-loading">جاري تحميل المنتجات...</p>}

      {!isTable && (
        <div className="sales-customer-fields">
          <div className="fulfillment-switch" role="group" aria-label="نوع استلام الطلب">
            <button type="button" className={fulfillmentType === "PICKUP" ? "active" : ""} onClick={() => setFulfillmentType("PICKUP")}>تيك أواي</button>
            <button type="button" className={fulfillmentType === "DELIVERY" ? "active" : ""} onClick={() => setFulfillmentType("DELIVERY")}>توصيل</button>
          </div>
          <input placeholder="اسم العميل" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
          <input placeholder="رقم الهاتف" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
          {fulfillmentType === "DELIVERY" && <input placeholder="عنوان التوصيل" value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} />}
        </div>
      )}

      <div className="sales-layout">
        {/* الأقسام — يمين (RTL) */}
        <aside className="sales-sections-col">
          <h3 className="sales-col-title">الأقسام</h3>
          <div className="sales-sections-list">
            {sections.map((section) => (
              <button
                key={section.id || section.name}
                className={`sales-section-btn ${activeSection?.id === section.id ? "active" : ""}`}
                onClick={() => setActiveSection(section)}
              >
                {section.name}
              </button>
            ))}
          </div>
        </aside>

        {/* المنتجات — شمال/وسط (RTL) */}
        <section className="sales-products-col">
          <h3 className="sales-col-title">المنتجات{activeSection?.name ? ` — ${activeSection.name}` : ""}</h3>
          <div className="sales-products-grid">
            {visible.flatMap((product) =>
              (product.variants || []).flatMap((variant) =>
                (variant.sizes || []).map((size) => (
                  <button
                    key={`${product.id}-${size.id}`}
                    className="sales-product-card"
                    onClick={() => add(product, variant, size)}
                  >
                    <Coffee size={16} className="sales-product-icon" />
                    <div className="sales-product-info">
                      <strong className="sales-product-name">{product.name}</strong>
                      <span className="sales-product-variant">{variant.type} - {size.name}</span>
                    </div>
                    <span className="sales-product-price">{Number(size.sellingPrice ?? size.finalPrice ?? size.price).toFixed(2)} ج.م</span>
                  </button>
                ))
              )
            )}
            {!visible.length && !loading && (
              <div className="sales-empty">لا توجد منتجات في هذا القسم</div>
            )}
          </div>
        </section>
      </div>

      {/* الفاتورة — تحت (شريط كامل) */}
      <div className="sales-invoice-strip">
        <div className="sales-invoice-header">
          <h3 className="sales-col-title">الفاتورة</h3>
          <span className="sales-invoice-count">{invoice.length} منتج</span>
        </div>

        {invoice.length === 0 ? (
          <div className="sales-empty">لم تُضف أي منتج بعد</div>
        ) : (
          <div className="sales-invoice-body">
            {invoice.map((item, index) => (
              <div className="sales-invoice-item" key={item.key}>
                <div className="sales-invoice-item-info">
                  <strong>{item.name}</strong>
                  <span>{item.variant} - {item.size}</span>
                </div>
                <div className="sales-invoice-qty">
                  <button onClick={() => updateQty(index, -1)}><Minus size={14} /></button>
                  <span>{item.qty}</span>
                  <button onClick={() => updateQty(index, 1)}><Plus size={14} /></button>
                </div>
                <span className="sales-invoice-item-price">{(item.price * item.qty).toFixed(2)} ج.م</span>
                <button className="sales-invoice-item-remove" onClick={() => removeItem(index)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="sales-invoice-footer">
          <div className="sales-invoice-total">
            <span>الإجمالي</span>
            <strong>{total.toFixed(2)} ج.م</strong>
          </div>
          <button
            className="btn-confirm-invoice"
            disabled={saving || !invoice.length}
            onClick={confirm}
          >
            <CheckCircle2 size={16} />
            {saving ? "جاري الحفظ..." : "تأكيد الطلب"}
          </button>
        </div>
      </div>
    </div>
  );
}
