import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import WarningsStatsCards from "../components/WarningsStatsCards";
import WarningsFilterBar from "../components/WarningsFilterBar";
import WarningsTable from "../components/WarningsTable";
import { getWarnings } from "../services/warningsService";
import { getAdminSocket } from "@/services/realtime";

function WarningsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [warningType, setWarningType] = useState("all");
    const [dateRange, setDateRange] = useState("all");
    const queryClient = useQueryClient();
    const query = useQuery({queryKey:["warnings"],queryFn:async()=>{const response=await getWarnings();return response.data}});
    useEffect(() => {
        const socket = getAdminSocket();
        const refresh = () => queryClient.invalidateQueries({ queryKey: ["warnings"] });
        socket.on("inventory:updated", refresh);
        return () => socket.off("inventory:updated", refresh);
    }, [queryClient]);

    const handleReset = () => {
        setSearchTerm("");
        setWarningType("all");
        setDateRange("all");
    };

    return (
        <div className="warnings-page">
            <PageHeader
                title="التحذيرات"
                breadcrumbs={["الرئيسية", "التحذيرات"]}
                icon={AlertTriangle}
            />

            <div className="warnings-page-content">
                <WarningsStatsCards warnings={query.data} />

                <WarningsFilterBar
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    warningType={warningType}
                    setWarningType={setWarningType}
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                    onReset={handleReset}
                />

                <WarningsTable
                    warnings={query.data}
                    searchTerm={searchTerm}
                    warningType={warningType}
                    dateRange={dateRange}
                    onRefresh={()=>query.refetch()}
                    isFetching={query.isFetching}
                />
            </div>
        </div>
    );
}

export default WarningsPage;
