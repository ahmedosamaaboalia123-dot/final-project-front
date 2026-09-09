import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams, useParams } from "react-router-dom";
import {
  ArrowRight,
  ShoppingBag,
  Search,
  Coffee,
  RotateCcw,
  Plus,
  FileText,
  Clock,
  AlertCircle,
  Filter,
} from "lucide-react";
import { useCustomerOrders } from "../hooks/useCustomerOrders";
import CustomerOrderCard from "../components/CustomerOrderCard";
import CustomerInvoiceModal from "../components/CustomerInvoiceModal";
import "../styles/CustomerOrders.css";

export default function CustomerOrdersPage({ tableMode = false }) {
  const navigate = useNavigate();
  const { tableId } = useParams();
  const tableNumber = Number(tableId) || 4;
  const menuPath = tableMode ? `/table/${tableNumber}/menu` : "/menu";
  const ordersPath = tableMode ? `/table/${tableNumber}/orders` : "/customer/orders";
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight") || searchParams.get("orderId");

  const orders = useCustomerOrders({ tableMode, tableNumber });
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'active' | 'completed' | 'cancelled'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Open a highlighted order when the API/local list has finished loading.
  useEffect(() => {
    if (highlightId) {
      const match = orders.find((o) => String(o.id) === String(highlightId) || String(o.orderNumber) === String(highlightId));
      if (match) setSelectedOrderForInvoice(match);
    }
  }, [highlightId, orders]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: orders.length,
      active: orders.filter(
        (o) => o.status === "in_progress" || o.status === "ready"
      ).length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Tab filter
      if (
        activeTab === "active" &&
        order.status !== "in_progress" &&
        order.status !== "ready"
      ) {
        return false;
      }
      if (activeTab === "cancelled" && order.status !== "cancelled") {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchId = String(order.orderNumber || order.id || "").toLowerCase().includes(query);
        const matchPhone = String(order.phone || order.customerPhone || "").includes(query);
        const matchType = String(order.orderTypeText || order.fulfillmentType || "").toLowerCase().includes(query);
        const matchItem = order.items?.some(
          (it) =>
            it.name.toLowerCase().includes(query) ||
            it.englishName?.toLowerCase().includes(query)
        );
        return matchId || matchPhone || matchType || matchItem;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  // Reorder handler
  const handleReorder = (order) => {
    setSelectedOrderForInvoice(null);
    setToastMessage(`☕ جاري إعادة طلب أصناف الفاتورة ${order.id}...`);
    setTimeout(() => {
      navigate(menuPath);
    }, 900);
  };

  return (
    <div className="customer-orders-page-root">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="pd-toast-notification">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="orders-page-header">
        <div className="orders-page-header-inner">
          <div className="orders-header-title-wrap">
            <button
              type="button"
              className="orders-back-btn"
              onClick={() => navigate(menuPath)}
              aria-label="الرجوع إلى المينيو"
              title="الرجوع للمينيو"
            >
              <ArrowRight size={20} />
            </button>

            <div>
              <h1 className="orders-page-main-heading">
                {tableMode ? `طلبات طاولة رقم ${tableNumber}` : "طلباتي"}
              </h1>
              <span className="orders-count-badge">
                {orders.length} {orders.length === 1 ? "طلب مسجل" : "طلبات مسجلة"}
              </span>
            </div>
          </div>

          <div className="orders-header-actions">
            <Link to={menuPath} className="orders-nav-menu-btn">
              <Plus size={16} />
              <span>طلب جديد</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="orders-page-container">
        {/* Toolbar: Search + Filter Tabs */}
        <div className="orders-filter-toolbar">
          <div className="orders-search-box">
            <Search size={18} className="orders-search-icon" />
            <input
              type="text"
              className="orders-search-input"
              placeholder="ابحث برقم الطلب أو رقم الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="orders-filter-tabs">
            <button
              type="button"
              className={`orders-tab-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              <span>جميع الطلبات</span>
              <span className="orders-tab-count">{tabCounts.all}</span>
            </button>

            <button
              type="button"
              className={`orders-tab-btn ${activeTab === "active" ? "active" : ""}`}
              onClick={() => setActiveTab("active")}
            >
              <Clock size={14} />
              <span>قيد التحضير والتسليم</span>
              <span className="orders-tab-count">{tabCounts.active}</span>
            </button>

            {tabCounts.cancelled > 0 && (
              <button
                type="button"
                className={`orders-tab-btn ${activeTab === "cancelled" ? "active" : ""}`}
                onClick={() => setActiveTab("cancelled")}
              >
                <AlertCircle size={14} />
                <span>الملغية</span>
                <span className="orders-tab-count">{tabCounts.cancelled}</span>
              </button>
            )}
          </div>
        </div>

        {/* Orders List / Empty State */}
        {filteredOrders.length === 0 ? (
          <div className="orders-empty-state-card">
            <div className="orders-empty-coffee-art">
              <Coffee size={36} />
            </div>
            <h3 className="orders-empty-title">لا توجد طلبات في هذا القسم</h3>
            <p className="orders-empty-desc">
              {searchQuery
                ? "لم نتمكن من العثور على طلب يطابق بحثك. جرّب البحث برقم طلب آخر."
                : "لم تقم بطلب أي مشروبات أو وجبات حتى الآن في هذا التبويب."}
            </p>
            <Link to={menuPath} className="orders-empty-cta-btn">
              <Coffee size={18} />
              <span>تصفح المينيو واطلب الآن</span>
            </Link>
          </div>
        ) : (
          <div className="orders-list-grid">
            {filteredOrders.map((order) => (
              <CustomerOrderCard
                key={order.id}
                order={order}
                onOpenInvoice={(ord) => setSelectedOrderForInvoice(ord)}
                onTrackOrder={(ord) => {
                  const code = ord.orderNumber || ord.id;
                  const token = ord.trackingToken ? `?token=${encodeURIComponent(ord.trackingToken)}` : "";
                  navigate(`${ordersPath}/${code}/track${token}`);
                }}
                onReorder={handleReorder}
              />
            ))}
          </div>
        )}
      </main>

      {/* Invoice Modal Popup */}
      <CustomerInvoiceModal
        isOpen={!!selectedOrderForInvoice}
        order={selectedOrderForInvoice}
        onClose={() => setSelectedOrderForInvoice(null)}
        onReorder={handleReorder}
      />
    </div>
  );
}
