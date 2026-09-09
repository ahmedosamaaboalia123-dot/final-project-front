import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import TableWaiterServicesGrid from "../components/TableWaiterServicesGrid";
import { useTable } from "../context/TableContext";
import { requestTableService } from "../services/tableGateway";
import "../styles/TableExperience.css";

export default function TableWaiterServicesPage() {
  const navigate = useNavigate();
  const { tableId } = useParams();
  const { showToast } = useTable();
  const [pendingType, setPendingType] = useState("");
  const [error, setError] = useState("");
  const tableToken = sessionStorage.getItem(`404_table_token_${tableId}`) || new URLSearchParams(window.location.search).get("token") || "";
  const send = async (type, title) => {
    if (pendingType) return;
    setPendingType(type); setError("");
    try { await requestTableService({ tableNumber: tableId, tableToken, type, reason: title }); showToast(`تم إرسال: ${title}`); }
    catch (reason) { setError(reason?.response?.data?.message || reason.message || "تعذر إرسال الطلب"); }
    finally { setPendingType(""); }
  };
  return <div className="table-experience-page" dir="rtl"><header><button onClick={() => navigate(`/table/${tableId}`)}><ArrowRight/>الرئيسية</button><div><span>طاولة رقم {tableId}</span><strong>خدمات الجرسون</strong></div></header><main><div className="experience-hero"><span>خدمة أسرع</span><h1>ماذا تحتاج على الطاولة؟</h1><p>اختر الخدمة وسيصل طلبك للجرسون.</p></div>{error && <p role="alert">{error}</p>}<TableWaiterServicesGrid pendingType={pendingType} onRequest={send}/></main></div>;
}
