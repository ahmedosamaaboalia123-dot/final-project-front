import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Bot, Sparkles, Coffee } from "lucide-react";
import { MENU_CATEGORIES, MENU_PRODUCTS, FILTER_OPTIONS } from "../data/menuData";
import MenuHeader from "../components/MenuHeader";
import MenuCategoryNav from "../components/MenuCategoryNav";
import MenuFilterSidebar from "../components/MenuFilterSidebar";
import MenuProductGrid from "../components/MenuProductGrid";
import MenuFloatingCartBar from "../components/MenuFloatingCartBar";
import ProductDetailsModal from "../../product-details/components/ProductDetailsModal";
import OrderCheckoutModal from "../../checkout/components/OrderCheckoutModal";
import OrderSuccessModal from "../../checkout/components/OrderSuccessModal";
import { createPublicOrder } from "../../checkout/services/orderGateway";
import { getPublicMenu, getPublicCategories, getTopProducts, isCatalogFromBackend } from "@/services/catalogService";
import { setLastOrder, saveCustomerProfile } from "../../checkout/services/checkoutCustomerService";
import { saveBackendOrder } from "../../orders/services/customerOrdersService";

// Shared/Main page modals for seamless full functionality
import CartDrawer from "../../main-page/components/CartDrawer";
import CustomerNavDrawer from "../../main-page/components/CustomerNavDrawer";
import AiBotModal from "../../main-page/components/AiBotModal";
import NotificationsModal from "../../main-page/components/NotificationsModal";
import TrackOrdersModal from "../../main-page/components/TrackOrdersModal";
import RateCafeModal from "../../main-page/components/RateCafeModal";
import CustomerFooter from "../../main-page/components/CustomerFooter";

import "../styles/MenuPage.css";
import "../../main-page/styles/CustomerMainPage.css";

// Builds category pills from the live catalog items. If no items exist yet we
// expose a single "الكل" fallback pill so the screen never blocks.
function buildCatalogCategories(items = []) {
  const byId = {};
  items.forEach((p) => {
    if (byId[p.category]) return;
    byId[p.category] = {
      id: p.category,
      title: p.categoryName || "الكل",
      englishTitle: "",
      icon: "Coffee",
    };
  });
  const list = Object.values(byId);
  if (!list.some((c) => c.id === "coffee") && list.length > 0) {
    list.unshift({ id: "coffee", title: "القهوة", englishTitle: "Coffee", icon: "Coffee" });
  }
  return list;
}

export default function MenuPage({ tableMode = false, tableNumberOverride, onTableRequestWaiter }) {
  const navigate = useNavigate();
  const { tableId } = useParams();
  const tableNumber = Number(tableNumberOverride || tableId) || 4;
  const [queryParams] = useSearchParams();
  const homePath = tableMode ? `/table/${tableNumber}` : "/";
  const menuPath = tableMode ? `/table/${tableNumber}/menu` : "/menu";
  const ordersPath = tableMode ? `/table/${tableNumber}/orders` : "/customer/orders";
  const chatbotPath = tableMode ? `/table/${tableNumber}/chatbot` : "/customer/chatbot";

  // Category State (Default: 'coffee' matching the mockup)
  const [activeCategory, setActiveCategory] = useState(queryParams.get("category") || "coffee");

  // Filters State (Default: 'مثلج' + 'عادي' + maxPrice 100 matching mockup)
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedSugars, setSelectedSugars] = useState([]);
  const [maxPrice, setMaxPrice] = useState(100);
  const [onlyBestSellers, setOnlyBestSellers] = useState(false);
  const [searchQuery, setSearchQuery] = useState(queryParams.get("search") || "");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Favorites
  const [favorites, setFavorites] = useState(["mocha_404", "spanish_latte"]);

  // Cart State (Initialized with 2 items matching the screenshot: Spanish Latte 65 EGP + Caramel Macchiato 70 EGP = 135 EGP)
  const [cartItems, setCartItems] = useState(() => {
    if (!tableMode) return [];
    try {
      return JSON.parse(localStorage.getItem(`404_table_cart_${tableNumber}`) || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!tableMode) return;
    localStorage.setItem(`404_table_cart_${tableNumber}`, JSON.stringify(cartItems));
    window.dispatchEvent(new CustomEvent("table-cart-updated", { detail: { tableNumber, items: cartItems } }));
  }, [cartItems, tableMode, tableNumber]);

  // Modal States
  const [selectedProductForDetails, setSelectedProductForDetails] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [isAiBotOpen, setIsAiBotOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isTrackOrdersOpen, setIsTrackOrdersOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [orderToast, setOrderToast] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  // Live catalog from the backend POS (shared for customer + table).
  const [catalog, setCatalog] = useState(null);
  const [catalogLoading, setCatalogLoading] = useState(() => !isCatalogFromBackend());
  const [catalogCategories, setCatalogCategories] = useState(null);
  const [bestSellerIds, setBestSellerIds] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getPublicMenu().then((res) => {
      if (cancelled) return;
      setCatalog(res);
      setCatalogLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  // Real "most ordered" product ids from the backend (drives the best-seller
  // filter and the "الأكثر طلباً" badge on product cards).
  useEffect(() => {
    let cancelled = false;
    getTopProducts({ limit: 8 }).then((tops) => {
      if (cancelled) return;
      setBestSellerIds(new Set((Array.isArray(tops) ? tops : []).map((t) => String(t.productId))));
    });
    return () => { cancelled = true; };
  }, []);

  // Real product sections from the backend (used to label category pills).
  useEffect(() => {
    let cancelled = false;
    getPublicCategories().then((res) => {
      if (cancelled) return;
      setCatalogCategories(res);
    });
    return () => { cancelled = true; };
  }, []);

  // Toggle filter types
  const handleToggleType = (typeValue) => {
    setSelectedTypes((prev) =>
      prev.includes(typeValue)
        ? prev.filter((t) => t !== typeValue)
        : [...prev, typeValue]
    );
  };

  // Toggle sugar levels
  const handleToggleSugar = (sugarValue) => {
    setSelectedSugars((prev) =>
      prev.includes(sugarValue)
        ? prev.filter((s) => s !== sugarValue)
        : [...prev, sugarValue]
    );
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedTypes([]);
    setSelectedSugars([]);
    setMaxPrice(100);
    setOnlyBestSellers(false);
    setSearchQuery("");
  };

  // Favorites toggle
  const handleToggleFavorite = (productId) => {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // Cart operations
  const handleAddToCart = (product) => {
    // Open product details modal for deep customization as shown in mockup
    setSelectedProductForDetails(product);
  };

  const handleAddToCartFromDetails = (customizedItem) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === customizedItem.id);
      if (existing) {
        return prev.map((item) =>
          item.id === customizedItem.id
            ? { ...item, quantity: item.quantity + (customizedItem.quantity || 1) }
            : item
        );
      }
      return [...prev, customizedItem];
    });

    setOrderToast(`🎉 تمت إضافة "${customizedItem.name}" إلى سلة المشتريات بنجاح!`);
    setTimeout(() => setOrderToast(null), 3500);
  };

  const handleIncrement = (productId) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const handleDecrement = (productId) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setIsCartOpen(false);
    if (tableMode) {
      onTableRequestWaiter?.();
      setOrderToast(`السلة جاهزة. أخبر الجرسون بطلبات طاولة رقم ${tableNumber} عند حضوره.`);
      setTimeout(() => setOrderToast(null), 4000);
      return;
    }
    setIsCheckoutOpen(true);
  };

  const handleCreateOrder = async (checkoutData) => {
    const order = await createPublicOrder(checkoutData);
    const orderNumber = order?.orderNumber || order?.publicCode || order?.id || "";
    const trackingToken = order?.trackingToken || "";
    const customerName = order?.customerName || checkoutData?.customer?.name || "";
    const customerPhone = order?.phone || checkoutData?.customer?.phone || "";
    const fulfillmentType = order?.fulfillmentType || checkoutData?.fulfillmentType || "";
    const total = Number(order?.total ?? checkoutData?.total ?? 0) || 0;
    const createdAt = order?.createdAt || new Date().toISOString();
    setLastOrder({ orderNumber: String(orderNumber), trackingToken, phone: String(customerPhone || ""), fulfillmentType, total, createdAt });
    if (checkoutData?.customer?.phone) {
      saveCustomerProfile({ name: checkoutData.customer.name || "", phone: checkoutData.customer.phone || "" });
    }
    saveBackendOrder({
      orderNumber: String(orderNumber),
      trackingToken,
      phone: String(customerPhone || ""),
      name: customerName || checkoutData?.customer?.name || "",
      fulfillmentType,
      total,
      status: "PENDING",
      statusText: "بانتظار التأكيد",
      items: order?.items || checkoutData?.items || [],
    });
    setIsCheckoutOpen(false);
    setCompletedOrder(order);
    setCartItems([]);
  };

  // Catalog data source. When the backend loaded (even if empty) we use its
  // results; otherwise we fall back to the bundled demo data.
  const catalogAvailable = Boolean(catalog?.fromBackend);
  const bestSellerSet = bestSellerIds ?? new Set();
  const sourceProducts = (catalogAvailable ? catalog.items : MENU_PRODUCTS).map(
    (product) => ({
      ...product,
      isBestSeller:
        bestSellerSet.has(String(product.id)) || Boolean(product.isBestSeller),
    })
  );
  const derivedCategories = catalogAvailable
    ? buildCatalogCategories(catalog.items)
    : MENU_CATEGORIES;
  // Sections come from the real backend products (buildCatalogCategories) so
  // each pill id matches the product categories exactly. When the public
  // backend category names are available, use them as the authoritative labels
  // for the matching pills (no fabricated sections, no empty pills).
  const sourceCategories = useMemo(() => {
    const base = derivedCategories;
    const backendCats = Array.isArray(catalogCategories) ? catalogCategories : [];
    if (!base || base.length === 0) return backendCats.length ? backendCats : MENU_CATEGORIES;
    const titleById = {};
    base.forEach((c) => {
      titleById[c.id] = titleById[c.id] || c.title;
    });
    backendCats.forEach((c) => {
      if (titleById[c.id]) titleById[c.id] = c.title;
    });
    return base.map((c) => ({ ...c, title: titleById[c.id] || c.title }));
  }, [derivedCategories, catalogCategories]);

  // Filter products logic
  const filteredProducts = useMemo(() => {
    return sourceProducts.filter((product) => {
      // Category filter (if category is selected)
      if (activeCategory && product.category !== activeCategory && product.categoryType !== activeCategory) {
        return false;
      }

      // Type filter
      if (selectedTypes.length > 0 && !selectedTypes.includes(product.type)) {
        return false;
      }

      // Sugar level filter
      if (selectedSugars.length > 0 && !selectedSugars.includes(product.sugarLevel)) {
        return false;
      }

      // Price filter
      if (product.price > maxPrice) {
        return false;
      }

      // Best sellers filter
      if (onlyBestSellers && !product.isBestSeller) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = product.name.toLowerCase().includes(query);
        const matchEng = product.englishName?.toLowerCase().includes(query);
        const matchDesc = product.description.toLowerCase().includes(query);
        if (!matchName && !matchEng && !matchDesc) return false;
      }

      return true;
    });
  }, [activeCategory, selectedTypes, selectedSugars, maxPrice, onlyBestSellers, searchQuery, sourceProducts]);

  // Cart calculations
  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Active Category Title
  const activeCategoryObj = sourceCategories.find((c) => c.id === activeCategory);
  const activeCategoryTitle = activeCategoryObj ? activeCategoryObj.title : "القهوة";

  const handleNavigation = (destId) => {
    if (destId === "home") {
      navigate(homePath);
    } else if (destId === "menu") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (destId === "orders" || destId === "track") {
      navigate(ordersPath);
    } else if (destId === "chatbot" || destId === "bot") {
      navigate(chatbotPath);
    } else if (destId === "rate") {
      setIsRateModalOpen(true);
    } else if (destId === "offers") {
      navigate(`${homePath}?section=offers`);
    }
  };

  return (
    <div className="menu-page-wrapper">
      {/* Toast Alert */}
      {orderToast && (
        <div className="order-toast-notification">
          <span>{orderToast}</span>
        </div>
      )}

      {/* 1. Header with Botanical Branch Art & 404 Branding */}
      <MenuHeader
        cartCount={totalCartCount}
        cartTotal={totalCartPrice}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenMenu={() => setIsMenuDrawerOpen(true)}
        onOpenAiBot={() => setIsAiBotOpen(true)}
        onOpenSearch={() => setIsSearchOpen(!isSearchOpen)}
        onOpenLocationModal={() => {}}
        onConfirmOrder={handleCheckout}
        homePath={homePath}
        ordersPath={ordersPath}
      />

      {tableMode && (
        <div className="table-context-strip">أهلاً بك على طاولة رقم {tableNumber}</div>
      )}

      {/* Expandable Quick Search Input if triggered */}
      {isSearchOpen && (
        <div className="menu-search-expand-bar">
          <div className="search-expand-inner">
            <input
              type="text"
              placeholder="ابحث عن مشروب، نكهة، أو نوع قهوة (مثلاً: سبانش لاتيه، كراميل...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="menu-search-input"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery("")}
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Category Navigation Pills */}
      <MenuCategoryNav
        categories={sourceCategories}
        activeCategory={activeCategory}
        onSelectCategory={(catId) => setActiveCategory(catId)}
      />

      {!tableMode && (
        <button type="button" className="menu-ai-strip" onClick={() => navigate(chatbotPath)}>
          <span className="menu-ai-strip__icon"><Bot size={22}/></span>
          <span><strong>مش عارف تختار؟ اسأل روبوت 404</strong><small>هيساعدك تختار المشروب المناسب لمزاجك</small></span>
          <Sparkles size={19}/>
        </button>
      )}

      {/* 3. Main Content: Sidebar Filter + 3-Column Products Grid */}
      <main className="menu-main-content-layout">
        {/* Desktop Filter Sidebar */}
        <MenuFilterSidebar
          categories={sourceCategories}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedTypes={selectedTypes}
          onToggleType={handleToggleType}
          selectedSugars={selectedSugars}
          onToggleSugar={handleToggleSugar}
          maxPrice={maxPrice}
          onChangeMaxPrice={setMaxPrice}
          onlyBestSellers={onlyBestSellers}
          onToggleBestSellers={setOnlyBestSellers}
          onResetFilters={handleResetFilters}
          totalItemsCount={filteredProducts.length}
        />

        {/* Products Grid */}
        {catalogLoading ? (
          <div className="menu-catalog-state">
            <div className="menu-loading-spinner" />
            <p>جاري تحميل القائمة...</p>
          </div>
        ) : catalogAvailable && sourceProducts.length === 0 ? (
          <div className="menu-catalog-state">
            <Coffee size={40} className="menu-catalog-state-icon" />
            <h3>القائمة فارغة حالياً</h3>
            <p>سيتم إضافة المنتجات قريباً، تفضل بالعودة بعد قليل.</p>
          </div>
        ) : (
        <MenuProductGrid
          categoryTitle={activeCategoryTitle}
          products={filteredProducts}
          cartItems={cartItems}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          onAddToCart={handleAddToCart}
          onSelectProduct={(product) => setSelectedProductForDetails(product)}
          onlyBestSellers={onlyBestSellers}
          onToggleBestSellers={setOnlyBestSellers}
          onOpenMobileFilter={() => setIsMobileFilterOpen(true)}
        />
        )}
      </main>

      {/* 5. Floating Quick Cart Bar (Visible if cart has items) */}
      <MenuFloatingCartBar
        cartItems={cartItems}
        totalPrice={totalCartPrice}
        totalCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onRemoveItem={handleRemoveFromCart}
        onConfirmOrder={handleCheckout}
      />

      {/* Product Details Customization Modal */}
      <ProductDetailsModal
        isOpen={!!selectedProductForDetails}
        product={selectedProductForDetails}
        onClose={() => setSelectedProductForDetails(null)}
        onAddToCart={handleAddToCartFromDetails}
        onOpenCart={() => {
          setSelectedProductForDetails(null);
          setIsCartOpen(true);
        }}
        onOpenAiBot={() => {
          setSelectedProductForDetails(null);
          navigate(chatbotPath);
        }}
        cartCount={totalCartCount}
      />

      {!tableMode && (
        <>
          <OrderCheckoutModal
            isOpen={isCheckoutOpen}
            items={cartItems}
            onClose={() => setIsCheckoutOpen(false)}
            onSubmit={handleCreateOrder}
          />
          <OrderSuccessModal
            order={completedOrder}
            onClose={() => setCompletedOrder(null)}
            onTrack={(order) => {
              const code = order.orderNumber || order.publicCode || order.id;
              const token = order.trackingToken ? `?token=${encodeURIComponent(order.trackingToken)}` : "";
              navigate(`/customer/orders/${code}/track${token}`);
            }}
          />
        </>
      )}

      {/* Mobile Filter Drawer Modal */}
      {isMobileFilterOpen && (
        <div
          className="mobile-filter-drawer-backdrop"
          onClick={() => setIsMobileFilterOpen(false)}
        >
          <div
            className="mobile-filter-drawer-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <MenuFilterSidebar
              categories={sourceCategories}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedTypes={selectedTypes}
              onToggleType={handleToggleType}
              selectedSugars={selectedSugars}
              onToggleSugar={handleToggleSugar}
              maxPrice={maxPrice}
              onChangeMaxPrice={setMaxPrice}
              onlyBestSellers={onlyBestSellers}
              onToggleBestSellers={setOnlyBestSellers}
              onResetFilters={handleResetFilters}
              totalItemsCount={filteredProducts.length}
              isMobileDrawer={true}
              onCloseMobileDrawer={() => setIsMobileFilterOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Customer Shared Modals */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={(id, qty) => {
          if (qty <= 0) handleRemoveFromCart(id);
          else {
            setCartItems((prev) =>
              prev.map((it) => (it.id === id ? { ...it, quantity: qty } : it))
            );
          }
        }}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={handleCheckout}
        checkoutLabel={tableMode ? "استدعاء الجرسون لأخذ الطلب" : "إتمام الطلب"}
        onEditItem={(item) => { setIsCartOpen(false); navigate(`${menuPath}/product/${item.productId || item.id}`); }}
      />

      <CustomerNavDrawer
        isOpen={isMenuDrawerOpen}
        onClose={() => setIsMenuDrawerOpen(false)}
        onNavigate={handleNavigation}
      />

      <AiBotModal
        isOpen={isAiBotOpen}
        onClose={() => setIsAiBotOpen(false)}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={[
          {
            id: "n1",
            title: "🎉 تم تفعيل كود خصم 20%",
            desc: "استخدم كود 404COLD للحصول على خصم 20% على المشروبات الباردة!",
            time: "منذ 10 دقائق",
            unread: true,
          },
        ]}
        onMarkAllAsRead={() => {}}
      />

      <TrackOrdersModal
        isOpen={isTrackOrdersOpen}
        onClose={() => setIsTrackOrdersOpen(false)}
        orders={[
          {
            id: "#404-9821",
            items: "2x سبانش لاتيه، 1x كراميل ماكياتو",
            total: "200 ج.م",
            status: "جاري التجهيز",
            statusStep: 2,
            time: "منذ 5 دقائق",
            type: "استلام من الفرع",
          },
        ]}
      />

      <RateCafeModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        onSubmitReview={() => {
          setIsRateModalOpen(false);
          setOrderToast("شكراً لتقييمك الرائع لـ 404 كافيه! ⭐");
          setTimeout(() => setOrderToast(null), 3000);
        }}
      />

      {/* Footer */}
      <CustomerFooter
        onOpenTrackOrders={() => setIsTrackOrdersOpen(true)}
        onOpenRateModal={() => setIsRateModalOpen(true)}
        onOpenLocationModal={() => {}}
      />
    </div>
  );
}
