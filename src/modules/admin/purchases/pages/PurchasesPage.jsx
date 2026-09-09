import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, PlusCircle, FileText } from "lucide-react";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import CreateInvoiceTab from "../components/CreateInvoiceTab";
import InvoicesListTab from "../components/InvoicesListTab";
import { getPurchases } from "../services/purchasesService";
import { getAdminSocket } from "@/services/realtime";
import "./PurchasesPage.css";

function PurchasesPage() {
  const [activeTab, setActiveTab] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getAdminSocket();
    const refreshPurchases = () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-groups"] });
      queryClient.invalidateQueries({ queryKey: ["purchases-count"] });
      queryClient.invalidateQueries({ queryKey: ["purchase"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-return-context"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-returns"] });
      queryClient.invalidateQueries({ queryKey: ["raw-materials"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      queryClient.invalidateQueries({ queryKey: ["warnings"] });
    };
    socket.on("purchase:updated", refreshPurchases);
    socket.on("purchase:return:created", refreshPurchases);
    return () => {
      socket.off("purchase:updated", refreshPurchases);
      socket.off("purchase:return:created", refreshPurchases);
    };
  }, [queryClient]);

  const countQuery = useQuery({
    queryKey: ["purchases-count"],
    queryFn: () => getPurchases({ page: 1, pageSize: 1 }),
    staleTime: 15 * 1000,
  });
  const totalCount = countQuery.data?.pagination?.total || 0;

  const handleEditRequest = (id) => {
    setEditingId(id);
    setActiveTab("create");
  };

  const handleSaved = (id) => {
    setEditingId(id);
  };

  return (
    <div className="purchases-page">
      <PageHeader
        title="المشتريات"
        breadcrumbs={["الرئيسية", "المشتريات"]}
        icon={ShoppingCart}
      />

      <div className="purchases-page-container">
        <div className="purchases-tabs-nav">
          <button
            type="button"
            className={`purchases-tab-btn ${activeTab === "create" ? "active" : ""}`}
            onClick={() => { setActiveTab("create"); setEditingId(null); }}
          >
            <PlusCircle size={18} />
            <span>إنشاء فاتورة</span>
          </button>

          <button
            type="button"
            className={`purchases-tab-btn ${activeTab === "list" ? "active" : ""}`}
            onClick={() => setActiveTab("list")}
          >
            <FileText size={18} />
            <span>الفواتير</span>
            <span className="tab-count-badge">{totalCount}</span>
          </button>
        </div>

        {activeTab === "create" && (
          <CreateInvoiceTab
            key={editingId || "new"}
            editId={editingId}
            onDoneEdit={() => setEditingId(null)}
            onSaved={handleSaved}
          />
        )}

        {activeTab === "list" && (
          <InvoicesListTab onEditRequest={handleEditRequest} />
        )}
      </div>
    </div>
  );
}

export default PurchasesPage;
