import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CustomerHeader from "../components/CustomerHeader";
import HeroBanner from "../components/HeroBanner";
import SearchBar from "../components/SearchBar";
import CategoryCards from "../components/CategoryCards";
import BestSellersSection from "../components/BestSellersSection";
import WeeklyOfferBanner from "../components/WeeklyOfferBanner";
import CustomerReviews from "../components/CustomerReviews";
import BranchInfoCard from "../components/BranchInfoCard";
import CustomerFooter from "../components/CustomerFooter";
import CustomerBottomNav from "../components/CustomerBottomNav";

// Modals and Drawers
import AiBotModal from "../components/AiBotModal";
import FortuneWheelModal from "../components/FortuneWheelModal";
import PersonalityQuizModal from "../components/PersonalityQuizModal";
import InviteFriendsModal from "../components/InviteFriendsModal";
import NotificationsModal from "../components/NotificationsModal";
import CartDrawer from "../components/CartDrawer";
import CustomerNavDrawer from "../components/CustomerNavDrawer";
import TrackOrdersModal from "../components/TrackOrdersModal";
import RateCafeModal from "../components/RateCafeModal";
import OrderCheckoutModal from "../../checkout/components/OrderCheckoutModal";
import OrderSuccessModal from "../../checkout/components/OrderSuccessModal";
import { useCreatePublicOrder } from "../../checkout/hooks/useCreatePublicOrder";

import { MAIN_PAGE_DATA } from "../data/mainPageData";
import { getTopProducts, getPublicMenu } from "@/services/catalogService";
import "../styles/CustomerMainPage.css";

export default function CustomerMainPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("coffee");
  const [activeBottomTab, setActiveBottomTab] = useState("home");
  const [recentlyAddedId, setRecentlyAddedId] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Modals & Drawers states
  const [isAiBotOpen, setIsAiBotOpen] = useState(false);
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
  const [isTrackOrdersOpen, setIsTrackOrdersOpen] = useState(false);
  const [isRateCafeOpen, setIsRateCafeOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const createOrder = useCreatePublicOrder();

  // Cart items state
  const [cartItems, setCartItems] = useState([]);

  // Real "most ordered" products from the backend (joined with the live menu so
  // prices / sizing / images are ready for the cart).
  const [topProducts, setTopProducts] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getTopProducts({ limit: 4 }), getPublicMenu()]).then(([tops, menu]) => {
      if (cancelled) return;
      const items = Array.isArray(menu?.items) ? menu.items : [];
      const catalogById = new Map(items.map((p) => [String(p.id), p]));
      const joined = (Array.isArray(tops) ? tops : [])
        .map((t) => catalogById.get(String(t.productId)))
        .filter(Boolean);
      setTopProducts(joined);
    });
    return () => { cancelled = true; };
  }, []);

  const cartCount = useMemo(
    () => cartItems.reduce((acc, it) => acc + it.quantity, 0),
    [cartItems]
  );

  // Filter products by category & search query
  const bestSellers = topProducts && topProducts.length > 0 ? topProducts : MAIN_PAGE_DATA.bestSellers;
  const filteredProducts = useMemo(() => {
    return bestSellers.filter((prod) => {
      const matchesSearch =
        !searchQuery.trim() ||
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prod.englishName || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [searchQuery, bestSellers]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddToCart = (product) => {
    const existing = cartItems.find((it) => it.id === product.id);
    if (existing) {
      setCartItems(
        cartItems.map((it) =>
          it.id === product.id ? { ...it, quantity: it.quantity + 1 } : it
        )
      );
    } else {
      setCartItems([
        ...cartItems,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.image,
        },
      ]);
    }

    setRecentlyAddedId(product.id);
    showToast(`تمت إضافة ${product.name} إلى سلة الطلبات ☕`);
    setTimeout(() => setRecentlyAddedId(null), 1800);
  };

  const handleUpdateQuantity = (id, newQty) => {
    if (newQty <= 0) {
      setCartItems(cartItems.filter((it) => it.id !== id));
    } else {
      setCartItems(
        cartItems.map((it) =>
          it.id === id ? { ...it, quantity: newQty } : it
        )
      );
    }
  };

  const handleRemoveCartItem = (id) => {
    setCartItems(cartItems.filter((it) => it.id !== id));
  };

  const handleApplyOffer = (code) => {
    setAppliedCoupon(code);
    showToast(`تم نسخ وتطبيق كود الخصم: ${code} 🎉`);
  };

  const handleNavDrawerAction = (action) => {
    setIsNavDrawerOpen(false);
    if (action === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (action === "menu") {
      navigate("/menu");
    } else if (action === "orders" || action === "track") {
      navigate("/customer/orders");
    } else if (action === "table") {
      navigate("/table/4");
    } else if (action === "chatbot" || action === "bot") {
      navigate("/customer/chatbot");
    } else if (action === "offers") {
      document.getElementById("offers-anchor")?.scrollIntoView({ behavior: "smooth" });
    } else if (action === "reviews") {
      document.getElementById("reviews-anchor")?.scrollIntoView({ behavior: "smooth" });
    } else if (action === "branch") {
      document.getElementById("branch-anchor")?.scrollIntoView({ behavior: "smooth" });
    } else if (action === "rate") {
      setIsRateCafeOpen(true);
    }
  };

  const handleBottomTabChange = (tabId) => {
    setActiveBottomTab(tabId);
    if (tabId === "orders") {
      navigate("/customer/orders");
    } else if (tabId === "menu") {
      navigate("/menu");
    } else if (tabId === "profile") {
      setIsRateCafeOpen(true);
    } else if (tabId === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="customer-app-wrapper" dir="rtl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-float-pill">
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="customer-mobile-viewport">
        {/* 1. Header with 404 COFFEE EST. 2025, Location, and Notifications */}
        <CustomerHeader
          cartCount={cartCount}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenProfile={() => setIsRateCafeOpen(true)}
          onOpenMenu={() => setIsNavDrawerOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenLocationModal={() => {
            document.getElementById("branch-anchor")?.scrollIntoView({ behavior: "smooth" });
          }}
          onNavigateSection={handleNavDrawerAction}
        />

        {/* Main Content Flow */}
        <main className="customer-page-content">
          {/* 2. Hero Banner: المزاج مش موجود؟ القهوة موجودة. */}
          <HeroBanner
            onOrderNow={() => navigate("/menu")}
            onOpenAiBot={() => navigate("/customer/chatbot")}
            onOpenWaiter={() => navigate("/customer/chatbot")}
            onOpenOffers={() => document.getElementById("offers-anchor")?.scrollIntoView({ behavior: "smooth" })}
            onOpenOrders={() => navigate("/customer/orders")}
          />

          {/* 3. Search Bar & Filter Button */}
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onToggleCategoryFilter={() => {
              navigate("/menu");
            }}
            onSearchSubmit={() => navigate(`/menu?search=${encodeURIComponent(searchQuery)}`)}
          />

          {/* 4. Category Cards (القهوة، المشروبات الباردة، الحلويات، الوجبات الخفيفة، المزيد) */}
          <CategoryCards
            categories={MAIN_PAGE_DATA.categories}
            selectedCategory={selectedCategory}
            onSelectCategory={(id) => {
              setSelectedCategory(id);
              navigate(`/menu?category=${encodeURIComponent(id)}`);
            }}
          />

          {/* 5. Most Popular / Best Sellers Section (الأكثر طلباً) */}
          <BestSellersSection
            products={filteredProducts.slice(0, 4)}
            onAddToCart={handleAddToCart}
            onViewAll={() => navigate("/menu")}
            addedItemId={recentlyAddedId}
          />

          <CustomerReviews
            reviews={MAIN_PAGE_DATA.reviews.slice(0, 3)}
            onViewAllReviews={() => navigate("/customer/feedback")}
            onAddReview={() => setIsRateCafeOpen(true)}
          />

          {/* 6. Weekly Offer Banner (عرض الأسبوع - خصم 20% كود 404COLD) */}
          <WeeklyOfferBanner
            offerData={MAIN_PAGE_DATA.weeklyOffer}
            onApplyOffer={handleApplyOffer}
          />

          {/* 8. Branch Info Card (فرع إيتاي البارود - البحيرة) */}
          <BranchInfoCard
            branchData={MAIN_PAGE_DATA.branchInfo}
            onOpenLocationDetails={() => {
              showToast("العنوان: إيتاي البارود - البحيرة (شارع الجمهورية - أمام المحطة)");
            }}
          />

          {/* 9. Comprehensive Responsive Footer */}
          <CustomerFooter footerData={MAIN_PAGE_DATA.footer} />
        </main>

        {/* 10. Bottom Navigation Bar (Mobile / Tablet) */}
        <CustomerBottomNav
          activeTab={activeBottomTab}
          onChangeTab={handleBottomTabChange}
          cartCount={cartCount}
        />

        {/* Interactive Modals & Drawers */}
        <AiBotModal
          isOpen={isAiBotOpen}
          onClose={() => setIsAiBotOpen(false)}
        />

        <FortuneWheelModal
          isOpen={isWheelOpen}
          onClose={() => setIsWheelOpen(false)}
          onWinPrize={(prize) => {
            showToast(`مبروك! ربحت ${prize.label}`);
          }}
        />

        <PersonalityQuizModal
          isOpen={isQuizOpen}
          onClose={() => setIsQuizOpen(false)}
          onFinishQuiz={(drink) => {
            showToast(`تمت إضافة +${drink.points} نقطة لمشروب ${drink.name}!`);
          }}
        />

        <InviteFriendsModal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
        />

        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          notifications={MAIN_PAGE_DATA.notifications}
        />

        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveCartItem}
          onCheckout={() => {
            setIsCartOpen(false);
            setIsCheckoutOpen(true);
          }}
          onEditItem={(item) => {
            setIsCartOpen(false);
            navigate(`/product/${item.productId || item.id}`);
          }}
        />

        <OrderCheckoutModal
          isOpen={isCheckoutOpen}
          items={cartItems}
          onClose={() => setIsCheckoutOpen(false)}
          onSubmit={async (checkoutData) => {
            const order = await createOrder.mutateAsync(checkoutData);
            setIsCheckoutOpen(false);
            setCompletedOrder(order);
            setCartItems([]);
          }}
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

        <CustomerNavDrawer
          isOpen={isNavDrawerOpen}
          onClose={() => setIsNavDrawerOpen(false)}
          onNavigate={handleNavDrawerAction}
        />

        <TrackOrdersModal
          isOpen={isTrackOrdersOpen}
          onClose={() => setIsTrackOrdersOpen(false)}
          orders={MAIN_PAGE_DATA.sampleOrders}
        />

        <RateCafeModal
          isOpen={isRateCafeOpen}
          onClose={() => setIsRateCafeOpen(false)}
          onSubmitRating={(rating) => {
            setIsRateCafeOpen(false);
            showToast("شكراً لك على تقييمك ودعمك لكافيه 404! ❤️");
          }}
        />
      </div>
    </div>
  );
}
