import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTable } from "../../context/TableContext";

// Modular Main-Page Sub-Components
import TableActiveOrderHeroBar from "../components/TableActiveOrderHeroBar";
import TableNavDrawer from "../components/TableNavDrawer";
import CustomerHeader from "../../../customer/main-page/components/CustomerHeader";
import HeroBanner from "../../../customer/main-page/components/HeroBanner";
import SearchBar from "../../../customer/main-page/components/SearchBar";
import CategoryCards from "../../../customer/main-page/components/CategoryCards";
import BestSellersSection from "../../../customer/main-page/components/BestSellersSection";
import TableReviewsSection from "../components/TableReviewsSection";
import WeeklyOfferBanner from "../../../customer/main-page/components/WeeklyOfferBanner";
import BranchInfoCard from "../../../customer/main-page/components/BranchInfoCard";
import CustomerFooter from "../../../customer/main-page/components/CustomerFooter";
import CustomerBottomNav from "../../../customer/main-page/components/CustomerBottomNav";

// Shared Modals & Drawers
import CallWaiterModal from "../../components/CallWaiterModal";
import TableSelectorModal from "../../components/TableSelectorModal";
import TableCartDrawer from "../../components/TableCartDrawer";
import TableInvoiceModal from "../../components/TableInvoiceModal";
import AiBotModal from "../../../customer/main-page/components/AiBotModal";
import FortuneWheelModal from "../../../customer/main-page/components/FortuneWheelModal";
import PersonalityQuizModal from "../../../customer/main-page/components/PersonalityQuizModal";
import InviteFriendsModal from "../../../customer/main-page/components/InviteFriendsModal";
import NotificationsModal from "../../../customer/main-page/components/NotificationsModal";
import TrackOrdersModal from "../../../customer/main-page/components/TrackOrdersModal";
import RateCafeModal from "../../../customer/main-page/components/RateCafeModal";

// Data & Styles
import { MAIN_PAGE_DATA } from "../../../customer/main-page/data/mainPageData";
import { getTopProducts, getPublicMenu } from "@/services/catalogService";
import "../../../customer/main-page/styles/CustomerMainPage.css";
import "../../styles/TableModule.css";

export default function TableMainPage() {
  const navigate = useNavigate();
  const {
    tableNumber,
    activeOrder,
    addToTableCart,
    tableCart,
    tableCartCount,
    isWaiterModalOpen,
    setIsWaiterModalOpen,
    isTableSelectorOpen,
    setIsTableSelectorOpen,
    isCartOpen,
    setIsCartOpen,
    toastMessage,
    triggerRequestBill,
  } = useTable();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("coffee");
  const [activeBottomTab, setActiveBottomTab] = useState("home");
  const [recentlyAddedId, setRecentlyAddedId] = useState(null);
  const [localToast, setLocalToast] = useState(null);
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

  // Modals state
  const [isAiBotOpen, setIsAiBotOpen] = useState(false);
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
  const [isTrackOrdersOpen, setIsTrackOrdersOpen] = useState(false);
  const [isRateCafeOpen, setIsRateCafeOpen] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  const showToast = (msg) => {
    setLocalToast(msg);
    setTimeout(() => setLocalToast(null), 3000);
  };

  // Filter products by search query
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

  const handleAddToCart = (product) => {
    addToTableCart(product, 1, "طاولة #" + tableNumber);
    setRecentlyAddedId(product.id);
    showToast(`تمت إضافة ${product.name} إلى سلة طاولة ${tableNumber} ☕`);
    setTimeout(() => setRecentlyAddedId(null), 1800);
  };

  const handleApplyOffer = (code) => {
    showToast(`تم تطبيق كود خصم الطاولات: ${code} بنجاح 🎉`);
  };

  const handleNavDrawerAction = (action) => {
    setIsNavDrawerOpen(false);
    if (action === "menu") {
      navigate(`/table/${tableNumber}/menu`);
    } else if (action === "orders" || action === "track") {
      navigate(`/table/${tableNumber}/orders`);
    } else if (action === "chatbot") {
      navigate(`/table/${tableNumber}/chatbot`);
    } else if (action === "waiter") {
      setIsWaiterModalOpen(true);
    } else if (action === "table_switch") {
      setIsTableSelectorOpen(true);
    } else if (action === "offers") {
      document.getElementById("offers-anchor")?.scrollIntoView({ behavior: "smooth" });
    } else if (action === "games") {
      navigate(`/table/${tableNumber}/feedback`);
    } else if (action === "rate") {
      setIsRateCafeOpen(true);
    }
  };

  const handleBottomTabChange = (tabId) => {
    setActiveBottomTab(tabId);
    if (tabId === "orders") {
      navigate(`/table/${tableNumber}/orders`);
    } else if (tabId === "menu") {
      navigate(`/table/${tableNumber}/menu`);
    } else if (tabId === "cart") {
      setIsCartOpen(true);
    } else if (tabId === "profile") {
      setIsRateCafeOpen(true);
    } else if (tabId === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const activeToast = toastMessage || localToast;

  return (
    <div className="customer-app-wrapper" dir="rtl">
      {/* Toast Notification */}
      {activeToast && (
        <div className="toast-float-pill">
          <span>{activeToast}</span>
        </div>
      )}

      <div className="customer-mobile-viewport">
        {/* 1. Header with 404 COFFEE EST. 2025, Table Badge, Notifications, and Cart */}
        <CustomerHeader
          tableNumber={tableNumber}
          cartCount={tableCartCount}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenMenu={() => setIsNavDrawerOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onNavigateSection={handleNavDrawerAction}
        />

        {/* Main Content Flow */}
        <main className="customer-page-content">
          {/* Pinned Active Order Bar if table has an active order */}
          {activeOrder && (
            <TableActiveOrderHeroBar
              onOpenInvoice={(ord) => setSelectedInvoiceOrder(ord || activeOrder)}
            />
          )}

          {/* 2. Hero Banner: المزاج مش موجود؟ القهوة موجودة + أهلاً بك على طاولة رقم X */}
          <HeroBanner
            tableNumber={tableNumber}
            onOrderNow={() => {
              navigate(`/table/${tableNumber}/menu`);
            }}
            onOpenOffers={() => document.getElementById("offers-anchor")?.scrollIntoView({ behavior: "smooth" })}
            onOpenOrders={() => navigate(`/table/${tableNumber}/orders`)}
            onOpenWaiter={() => navigate(`/table/${tableNumber}/services`)}
          />

          {/* 4. Search Bar & Filter Button */}
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={() => navigate(`/table/${tableNumber}/menu?search=${encodeURIComponent(searchQuery)}`)}
            onToggleCategoryFilter={() => navigate(`/table/${tableNumber}/menu`)}
          />

          {/* 5. Category Cards (القهوة، المشروبات الباردة، الحلويات، الوجبات الخفيفة، المزيد) */}
          <CategoryCards
            categories={MAIN_PAGE_DATA.categories}
            selectedCategory={selectedCategory}
            onSelectCategory={(id) => {
              setSelectedCategory(id);
              navigate(`/table/${tableNumber}/menu?category=${encodeURIComponent(id)}`);
            }}
          />

          {/* 6. Most Popular / Best Sellers Section (الأكثر طلباً لطاولات 404) */}
          <BestSellersSection
            products={filteredProducts.slice(0, 4)}
            onAddToCart={handleAddToCart}
            onViewAll={() => navigate(`/table/${tableNumber}/menu`)}
            addedItemId={recentlyAddedId}
          />

          <TableReviewsSection onMore={() => navigate(`/table/${tableNumber}/feedback`)} onAdd={() => setIsRateCafeOpen(true)} />

          {/* 7. Weekly Offer Banner (عرض الأسبوع لضيوف الطاولات) */}
          <WeeklyOfferBanner
            offerData={MAIN_PAGE_DATA.weeklyOffer}
            onApplyOffer={handleApplyOffer}
          />

          {/* 9. Branch Info & Table Amenities Card */}
          <BranchInfoCard
            branchData={MAIN_PAGE_DATA.branchInfo}
            onOpenLocationDetails={() => {
              showToast(`أنت جالس حالياً على طاولة رقم ${tableNumber} في فرع إيتاي البارود`);
            }}
          />

          {/* 10. Comprehensive Responsive Footer */}
          <CustomerFooter footerData={MAIN_PAGE_DATA.footer} />
        </main>

        {/* 11. Bottom Navigation Bar (Mobile / Tablet) */}
        <CustomerBottomNav
          activeTab={activeBottomTab}
          onChangeTab={handleBottomTabChange}
          cartCount={tableCartCount}
        />

        {/* Interactive Modals & Drawers */}
        <CallWaiterModal
          isOpen={isWaiterModalOpen}
          onClose={() => setIsWaiterModalOpen(false)}
        />

        <TableSelectorModal
          isOpen={isTableSelectorOpen}
          onClose={() => setIsTableSelectorOpen(false)}
        />

        <TableCartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
        />

        <TableInvoiceModal
          isOpen={Boolean(selectedInvoiceOrder)}
          onClose={() => setSelectedInvoiceOrder(null)}
          order={selectedInvoiceOrder}
        />

        <AiBotModal
          isOpen={isAiBotOpen}
          onClose={() => setIsAiBotOpen(false)}
        />

        <FortuneWheelModal
          isOpen={isWheelOpen}
          onClose={() => setIsWheelOpen(false)}
          onWinPrize={(prize) => {
            showToast(`مبروك! ربحت ${prize.label} لطاولة ${tableNumber}`);
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

        <TrackOrdersModal
          isOpen={isTrackOrdersOpen}
          onClose={() => setIsTrackOrdersOpen(false)}
          orders={MAIN_PAGE_DATA.sampleOrders}
        />

        <TableNavDrawer
          isOpen={isNavDrawerOpen}
          onClose={() => setIsNavDrawerOpen(false)}
          onNavigate={handleNavDrawerAction}
        />

        <RateCafeModal
          isOpen={isRateCafeOpen}
          onClose={() => setIsRateCafeOpen(false)}
          onSubmitRating={(rating) => {
            setIsRateCafeOpen(false);
            showToast(`شكراً لك على تقييم خدمة طاولة رقم ${tableNumber}! ❤️`);
          }}
        />
      </div>
    </div>
  );
}
