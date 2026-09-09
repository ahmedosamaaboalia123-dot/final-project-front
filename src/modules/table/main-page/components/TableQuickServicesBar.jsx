import React from "react";
import { Bell, Receipt, Sparkles, Wifi, ArrowLeftRight } from "lucide-react";
import { useTable } from "../../context/TableContext";

export default function TableQuickServicesBar({
  onOpenWaiterModal,
  onOpenTableSelector,
  onOpenInvoice,
  onOpenAiBot,
}) {
  const { tableNumber, triggerRequestBill } = useTable();

  return (
    <section className="category-cards-section" style={{ marginTop: "12px", marginBottom: "20px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "12px",
          width: "100%",
        }}
      >
        {/* Service 1: Call Waiter */}
        <button
          type="button"
          onClick={onOpenWaiterModal}
          style={{
            background: "#FFFFFF",
            border: "1px solid #E8DED3",
            borderRadius: "16px",
            padding: "14px 12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "8px",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(43, 33, 27, 0.04)",
            transition: "all 0.2s ease",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              background: "rgba(224, 122, 95, 0.12)",
              color: "#E07A5F",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bell size={22} />
          </div>
          <div>
            <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#2B211B" }}>
              استدعاء الويتر
            </span>
            <span style={{ display: "block", fontSize: "0.72rem", color: "#6B5C52" }}>
              حضور الكابتن للطاولة
            </span>
          </div>
        </button>

        {/* Service 2: Request Bill */}
        <button
          type="button"
          onClick={() => triggerRequestBill("كاش أو فيزا")}
          style={{
            background: "#FFFFFF",
            border: "1px solid #E8DED3",
            borderRadius: "16px",
            padding: "14px 12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "8px",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(43, 33, 27, 0.04)",
            transition: "all 0.2s ease",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              background: "rgba(194, 155, 114, 0.15)",
              color: "#593215",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Receipt size={22} />
          </div>
          <div>
            <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#2B211B" }}>
              طلب الحساب
            </span>
            <span style={{ display: "block", fontSize: "0.72rem", color: "#6B5C52" }}>
              إحضار الفاتورة والدفع
            </span>
          </div>
        </button>

        {/* Service 3: AI Barista */}
        <button
          type="button"
          onClick={onOpenAiBot}
          style={{
            background: "#FFFFFF",
            border: "1px solid #E8DED3",
            borderRadius: "16px",
            padding: "14px 12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "8px",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(43, 33, 27, 0.04)",
            transition: "all 0.2s ease",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              background: "rgba(89, 50, 21, 0.1)",
              color: "#593215",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={22} />
          </div>
          <div>
            <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#2B211B" }}>
              باريستا 404
            </span>
            <span style={{ display: "block", fontSize: "0.72rem", color: "#6B5C52" }}>
              اقتراح مشروب لطاولتك
            </span>
          </div>
        </button>

        {/* Service 4: Switch Table */}
        <button
          type="button"
          onClick={onOpenTableSelector}
          style={{
            background: "#FFFFFF",
            border: "1px solid #E8DED3",
            borderRadius: "16px",
            padding: "14px 12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "8px",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(43, 33, 27, 0.04)",
            transition: "all 0.2s ease",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              background: "rgba(224, 122, 95, 0.1)",
              color: "#593215",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.1rem",
            }}
          >
            🪑
          </div>
          <div>
            <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#2B211B" }}>
              طاولة ({tableNumber})
            </span>
            <span style={{ display: "block", fontSize: "0.72rem", color: "#6B5C52" }}>
              تبديل مكان الجلوس
            </span>
          </div>
        </button>
      </div>
    </section>
  );
}
