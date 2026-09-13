import React from "react";
import { Link } from "react-router-dom";
import {
  X,
  Home,
  Coffee,
  Receipt,
  Bell,
  Star,
  Gamepad2,
  LayoutDashboard,
  ArrowLeftRight,
} from "lucide-react";
import { useTable } from "../../context/TableContext";

export default function TableNavDrawer({
  isOpen,
  onClose,
  onNavigate,
}) {
  const { tableNumber } = useTable();

  if (!isOpen) return null;

  const links = [
    { id: "home", label: "الرئيسية للطاولة", icon: Home },
    { id: "menu", label: `منيو طاولة #${tableNumber}`, icon: Coffee },
    { id: "orders", label: "طلبات وفاتورة الطاولة", icon: Receipt },
    { id: "waiter", label: "استدعاء الويتر", icon: Bell },
    { id: "table_switch", label: `تبديل الطاولة (حالياً #${tableNumber})`, icon: ArrowLeftRight },
    { id: "games", label: "الألعاب والتحديات", icon: Gamepad2 },
    { id: "rate", label: "تقييم خدمة الطاولة", icon: Star },
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
              <span className="side-brand-sub">طاولة رقم {tableNumber} • صالة 404</span>
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

        <div className="side-drawer-nav-list">
          {links.map((lnk) => {
            const Icon = lnk.icon;
            return (
              <button
                key={lnk.id}
                type="button"
                className="side-nav-item"
                onClick={() => onNavigate && onNavigate(lnk.id)}
              >
                <Icon size={20} className="side-nav-icon" />
                <span>{lnk.label}</span>
              </button>
            );
          })}
        </div>

        <div className="side-drawer-footer">
          <Link
            to="/customer"
            className="side-footer-admin-btn"
            style={{ marginBottom: "8px", background: "#FAF6F0", color: "#593215" }}
            onClick={onClose}
          >
            <Coffee size={16} />
            <span>الانتقال لموقع العميل (أونلاين)</span>
          </Link>

          <Link
            to="/admin/dashboard"
            className="side-footer-admin-btn"
            onClick={onClose}
          >
            <LayoutDashboard size={16} />
            <span>لوحة تحكم الإدارة</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
