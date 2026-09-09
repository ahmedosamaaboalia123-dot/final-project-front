import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import AddEmployeeForm from "../components/AddEmployeeForm";
import EmployeesTable from "../components/EmployeesTable";
import { useEmployees } from "../hooks/useEmployees";
import "./EmployeesPage.css";

export default function EmployeesPage() {
  const navigate = useNavigate();
  const employeesQuery = useEmployees();
  const employees = Array.isArray(employeesQuery.data) ? employeesQuery.data : employeesQuery.data?.data || [];

  return <div className="employees-page" dir="rtl">
    <PageHeader title="الموظفون" breadcrumbs={["الرئيسية", "الموظفون"]} icon={Users} />
    <div className="employees-shell">
      <AddEmployeeForm />
      {employeesQuery.isError && <p className="employee-alert error" role="alert">{employeesQuery.error?.response?.data?.message || employeesQuery.error.message}</p>}
      <EmployeesTable employees={employees} isLoading={employeesQuery.isLoading} onView={(id) => navigate(`/admin/employees/${id}`)} />
    </div>
  </div>;
}
