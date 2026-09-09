import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Coffee } from "lucide-react";
import { getPublicMenu, getPublicProductById } from "@/services/catalogService";
import ProductDetailsModal from "../components/ProductDetailsModal";
import AiBotModal from "../../main-page/components/AiBotModal";
import CartDrawer from "../../main-page/components/CartDrawer";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [catalogReady, setCatalogReady] = useState(false);
  const [isAiBotOpen, setIsAiBotOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  // Ensure the live catalog is loaded (so getPublicProductById can resolve),
  // then find the requested product by id.
  useEffect(() => {
    let cancelled = false;
    getPublicMenu().then(() => {
      if (!cancelled) setCatalogReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  const currentProduct = catalogReady ? getPublicProductById(id) : null;

  const handleAddToCart = useCallback((customizedItem) => {
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
    setToastMessage(`🎉 تمت إضافة "${customizedItem.name}" إلى سلة المشتريات بنجاح!`);
    setTimeout(() => {
      setToastMessage(null);
      setIsCartOpen(true);
    }, 400);
  }, []);

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Not found (after catalog finished loading and product is missing)
  if (catalogReady && !currentProduct) {
    return (
      <div className="pd-page-container pd-404-state">
        <Coffee size={48} className="text-coffee-gold" />
        <h2>المنتج غير متوفر</h2>
        <p>لم نعثر على هذا المنتج في القائمة الحالية.</p>
        <Link to="/menu" className="pd-404-back-btn">الرجوع إلى القائمة</Link>
      </div>
    );
  }

  if (!currentProduct) {
    // Still loading catalog
    return (
      <div className="pd-page-container pd-404-state">
        <div className="menu-loading-spinner" />
        <p>جاري تحميل المنتج...</p>
      </div>
    );
  }

  return (
    <div className="pd-page-container">
      {toastMessage && (
        <div className="order-toast-notification">
          <span>{toastMessage}</span>
        </div>
      )}

      <ProductDetailsModal
        isOpen={true}
        product={currentProduct}
        onClose={() => navigate("/menu")}
        onAddToCart={handleAddToCart}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAiBot={() => navigate("/customer/chatbot")}
        cartCount={totalCartCount}
      />

      <AiBotModal
        isOpen={isAiBotOpen}
        onClose={() => setIsAiBotOpen(false)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={(itemId, qty) => {
          if (qty <= 0) setCartItems((prev) => prev.filter((it) => it.id !== itemId));
          else setCartItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, quantity: qty } : it)));
        }}
        onRemoveItem={(itemId) => setCartItems((prev) => prev.filter((it) => it.id !== itemId))}
        onCheckout={() => {
          setIsCartOpen(false);
          if (cartItems.length > 0) {
            navigate("/menu", { state: { openCheckout: true } });
          } else {
            navigate("/menu");
          }
        }}
      />
    </div>
  );
}