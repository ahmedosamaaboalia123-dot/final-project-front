import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Package } from "lucide-react";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import AddMaterialForm from "../components/AddMaterialForm";
import MaterialsTable from "../components/MaterialsTable";
import WithdrawnMaterialsTable from "../components/WithdrawnMaterialsTable";
import { getAdminSocket } from "@/services/realtime";

const INVENTORY_TABS = [
    { id: "raw", label: "المواد الخام" },
    { id: "withdrawn", label: "المواد المسحوبة" }
];

function InventoryPage() {
    const [activeTab, setActiveTab] = useState("raw");
    const queryClient = useQueryClient();
    useEffect(() => {
        const socket = getAdminSocket();
        const refreshInventory = () => {
            queryClient.invalidateQueries({ queryKey: ["raw-materials"] });
            queryClient.invalidateQueries({ queryKey: ["raw-material"] });
            queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
            queryClient.invalidateQueries({ queryKey: ["warnings"] });
        };
        socket.on("inventory:updated", refreshInventory);
        return () => socket.off("inventory:updated", refreshInventory);
    }, [queryClient]);

    return (
        <div className="inventory-page">
            <PageHeader
                title="المخزون - المواد الخام"
                breadcrumbs={[
                    "الرئيسية",
                    "المخزون",
                    activeTab === "raw" ? "المواد الخام" : "المواد المسحوبة"
                ]}
                icon={Package}
                tabs={INVENTORY_TABS}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            <div style={{ padding: "18px 24px" }}>
                {activeTab === "raw" ? (
                    <>
                        <AddMaterialForm />
                        <MaterialsTable />
                    </>
                ) : (
                    <WithdrawnMaterialsTable />
                )}
            </div>
        </div>
    );
}

export default InventoryPage;
