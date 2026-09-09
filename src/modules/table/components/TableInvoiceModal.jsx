import React from "react";
import {
  X,
  Printer,
  Share2,
  CheckCircle2,
  Clock,
  Coffee,
  Receipt,
  QrCode,
  ShieldCheck,
} from "lucide-react";

export default function TableInvoiceModal({ order, isOpen, onClose }) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `فاتورة طاولة ${order.tableNumber || 4} - طلب #${order.orderNumber}`,
        text: `تفاصيل فاتورة 404 كافيه لطاولة رقم ${order.tableNumber || 4}`,
        url: window.location.href,
      });
    }
  };

  return (
    <div className="tbl-modal-backdrop" onClick={onClose}>
      <div
        className="tbl-modal-card"
        style={{ maxWidth: "460px", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="tbl-modal-header">
          <div className="tbl-modal-title-row">
            <Receipt size={20} className="text-coffee-gold" />
            <h3 className="tbl-modal-title">فاتورة ضيافة الطاولة الإلكترونية</h3>
          </div>
          <button
            type="button"
            className="tbl-modal-close-btn"
            onClick={onClose}
            aria-label="إغلاق الفاتورة"
          >
            <X size={18} />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div
          style={{
            padding: "20px",
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            background: "#FFFFFF",
          }}
        >
          {/* Logo & Cafe Info */}
          <div style={{ textAlign: "center", borderBottom: "1.5px dashed #E8DDCE", paddingBottom: "14px" }}>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "1.4rem", fontWeight: 900, color: "#2C1E16", letterSpacing: "1px" }}>
              404 COFFEE
            </h2>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "#7A695C" }}>
              كافيه ومحمصة 404 للقهوة المختصة
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#A39385" }}>
              فرع إيتاي البارود - البحيرة (شارع الجمهورية)
            </p>
          </div>

          {/* Table & Order Highlight Box */}
          <div
            style={{
              background: "#FFF8EE",
              border: "1.5px solid #E5832E",
              borderRadius: "12px",
              padding: "10px 14px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              fontSize: "0.85rem",
            }}
          >
            <div>
              <span style={{ color: "#7A695C", fontSize: "0.75rem", display: "block" }}>رقم الطاولة:</span>
              <strong style={{ fontSize: "1.05rem", color: "#2C1E16" }}>🪑 طاولة #{order.tableNumber || 4}</strong>
            </div>
            <div>
              <span style={{ color: "#7A695C", fontSize: "0.75rem", display: "block" }}>رقم الطلب:</span>
              <strong style={{ fontSize: "1.05rem", color: "#E5832E" }}>#{order.orderNumber}</strong>
            </div>
            <div>
              <span style={{ color: "#7A695C", fontSize: "0.75rem", display: "block" }}>كابتن الصالة:</span>
              <strong style={{ color: "#2C1E16" }}>{order.waiterName || "كابتن سيف"}</strong>
            </div>
            <div>
              <span style={{ color: "#7A695C", fontSize: "0.75rem", display: "block" }}>التاريخ والوقت:</span>
              <strong style={{ color: "#2C1E16", fontSize: "0.75rem" }}>{order.dateFormatted}</strong>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ borderBottom: "1.5px dashed #E8DDCE", paddingBottom: "12px" }}>
            <h4 style={{ margin: "0 0 8px", fontSize: "0.85rem", color: "#2C1E16", fontWeight: 800 }}>
              تفاصيل الأصناف المطلوبة:
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {order.items?.map((it, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.85rem",
                    color: "#2C1E16",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span>
                      {it.name} <strong style={{ color: "#E5832E" }}>×{it.quantity}</strong>
                    </span>
                    {it.customizations?.size && (
                      <span style={{ fontSize: "0.72rem", color: "#7A695C" }}>
                        {it.customizations.size} • {it.customizations.sugar}
                      </span>
                    )}
                  </div>
                  <span style={{ fontWeight: 700 }}>
                    {it.totalPrice || (it.unitPrice || it.price) * it.quantity} EGP
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.82rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#7A695C" }}>
              <span>المجموع الفرعي:</span>
              <span>{order.pricing?.subtotal} EGP</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#7A695C" }}>
              <span>خدمة الصالة والضيافة:</span>
              <span>{order.pricing?.serviceFee || 15} EGP</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#7A695C" }}>
              <span>ضريبة القيمة المضافة (14%):</span>
              <span>{order.pricing?.vat} EGP</span>
            </div>
            {order.pricing?.discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "#1E7E34" }}>
                <span>الخصم المطبق:</span>
                <span>-{order.pricing?.discount} EGP</span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderTop: "1.5px solid #2C1E16",
                paddingTop: "6px",
                fontWeight: 900,
                fontSize: "1.1rem",
                color: "#2C1E16",
              }}
            >
              <span>الإجمالي المستحق:</span>
              <span style={{ color: "#E5832E" }}>{order.pricing?.total} EGP</span>
            </div>
          </div>

          {/* Payment Status */}
          <div
            style={{
              textAlign: "center",
              background: order.paymentStatus === "paid" ? "#EBF7EE" : "#FFF6E5",
              color: order.paymentStatus === "paid" ? "#1E7E34" : "#B76E00",
              padding: "6px",
              borderRadius: "8px",
              fontSize: "0.78rem",
              fontWeight: 800,
            }}
          >
            حالة الدفع: {order.paymentStatusText} ({order.paymentMethodText})
          </div>

          {/* QR Code Footer */}
          <div style={{ textAlign: "center", marginTop: "4px" }}>
            <div
              style={{
                display: "inline-flex",
                padding: "8px",
                background: "#FAF6F0",
                borderRadius: "10px",
                border: "1px solid #E8DDCE",
              }}
            >
              <QrCode size={48} className="text-coffee-espresso" />
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "0.7rem", color: "#7A695C" }}>
              فاتورة إلكترونية ضريبية معتمدة • شكراً لزيارتكم 404 كافيه!
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #E8DDCE", background: "#FAF6F0", display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={handlePrint}
            style={{
              flex: 1,
              height: "42px",
              borderRadius: "10px",
              background: "#2C1E16",
              color: "#FFFFFF",
              border: "none",
              fontSize: "0.85rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              cursor: "pointer",
            }}
          >
            <Printer size={16} />
            <span>طباعة الفاتورة</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            style={{
              height: "42px",
              padding: "0 14px",
              borderRadius: "10px",
              background: "#FFFFFF",
              color: "#2C1E16",
              border: "1px solid #E8DDCE",
              fontSize: "0.85rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              cursor: "pointer",
            }}
          >
            <Share2 size={16} />
            <span>مشاركة</span>
          </button>
        </div>
      </div>
    </div>
  );
}
