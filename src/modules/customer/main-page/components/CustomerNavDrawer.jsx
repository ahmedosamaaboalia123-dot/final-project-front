import React from "react";
import {
  X,
  Home,
  Coffee,
  Truck,
  Bot,
  Star,
  Tag,
} from "lucide-react";

export default function CustomerNavDrawer({
  isOpen,
  onClose,
  onNavigate,
}) {
  if (!isOpen) return null;

  const links = [
    { id: "home", label: "الرئيسية", icon: Home },
    { id: "menu", label: "قائمة المينيو", icon: Coffee },
    { id: "orders", label: "طلباتي وفواتيري", icon: Truck },
    { id: "chatbot", label: "باريستا 404 الذكي", icon: Bot },
    { id: "offers", label: "العروض المميزة", icon: Tag },
    { id: "rate", label: "تقييم الكافيه", icon: Star },
  ];

  return (
    <div className="customer-modal-backdrop" onClick={onClose}>
      <div
        className="customer-side-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="side-drawer-header">
          <div className="side-brand-info">
            <div className="side-logo-box">
              <Coffee size={24} />
            </div>
            <div>
              <h3 className="side-brand-title">404 COFFEE</h3>
              <span className="side-brand-sub">إيتاي البارود - البحيرة</span>
            </div>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="إغلاق القائمة"
          >
            <X size={20} />
          </button>
        </div>

        <div className="side-drawer-links">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                type="button"
                className="side-link-btn"
                onClick={() => {
                  onNavigate && onNavigate(link.id);
                  onClose();
                }}
              >
                <Icon size={20} className="side-link-icon" />
                <span>{link.label}</span>
              </button>
            );
          })}

        </div>

        <div className="side-drawer-footer">
          <p className="side-hours-text">مفتوح يومياً من 8 صباحاً حتى 12 منتصف الليل</p>
          <span className="side-version-tag">404 Coffee App v1.0</span>
        </div>
      </div>
    </div>
  );
}
