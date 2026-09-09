import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import EmployeeActivity from "../components/EmployeeActivity";
import EmployeeDevices from "../components/EmployeeDevices";
import EmployeeEditor from "../components/EmployeeEditor";
import EmployeePageAccess from "../components/EmployeePageAccess";
import { useEmployeeDetails } from "../hooks/useEmployeeDetails";
import "./EmployeeDetailsPage.css";

export default function EmployeeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const employeeQuery = useEmployeeDetails(id);
  const employee = employeeQuery.data;

  if (employeeQuery.isLoading) return <p className="employee-details-state">جاري التحميل...</p>;
  if (!employee) return <p className="employee-details-state error">{employeeQuery.error?.response?.data?.message || employeeQuery.error?.message || "الموظف غير موجود"}</p>;

  const showMessage = (value) => {
    setMessage(value);
    window.setTimeout(() => setMessage(""), 3000);
  };

  return <div className="employee-details-page" dir="rtl">
    <PageHeader title={`الموظف: ${employee.name}`} breadcrumbs={["الموظفون", employee.name]}/>
    <div className="employee-details-shell">
      <button className="employee-back" onClick={() => navigate("/admin/employees")}><ArrowRight size={16}/>رجوع</button>
      {message && <p className="employee-alert success">{message}</p>}
      <EmployeeEditor employee={employee} onMessage={showMessage}/>
      <EmployeeDevices employeeId={id} devices={employee.devices} onMessage={showMessage}/>
      <EmployeePageAccess employeeId={id} pageAccess={employee.pageAccess} onMessage={showMessage}/>
      <EmployeeActivity attendanceRecords={employee.attendanceRecords} auditLogs={employee.auditLogs}/>
    </div>
  </div>;
}
