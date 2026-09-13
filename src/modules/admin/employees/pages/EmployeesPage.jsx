import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import Button from "@/shared/components/Button/Button";
import Input from "@/shared/components/Input/Input";
import Select from "@/shared/components/Select/Select";
import { AsyncState, ServerPagination } from "@/shared/components";
import { useRealtimeRoom } from "@/realtime/useRealtimeRoom";
import { queryKeys } from "@/api/queryKeys";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useEmployeesScreen } from "../hooks/employee.queries";
import AddEmployeeForm from "../components/AddEmployeeForm";
import EmployeesTable from "../components/EmployeesTable";
import DevicesTab from "../components/DevicesTab";
import AttendanceTab from "../components/AttendanceTab";
import RolesTab from "../components/RolesTab";
import "./EmployeesPage.css";

const TABS = [
  { id: "employees", label: "الموظفون" },
  { id: "devices", label: "الأجهزة" },
  { id: "attendance", label: "الحضور" },
  { id: "roles", label: "الأدوار" },
];

const initialTab = (search) => {
  const fromQuery = new URLSearchParams(search || "").get("tab");
  return TABS.some((tab) => tab.id === fromQuery) ? fromQuery : "employees";
};

function EmployeesTab() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 500);
  const query = useEmployeesScreen({
    page,
    limit: 10,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(status ? { status } : {}),
  });
  const screen = query.data;
  const employees = screen?.employees || [];
  const roles = screen?.roles || [];
  const summary = screen?.summary || { total: 0, active: 0, pendingDevices: 0 };

  return (
    <div className="employees-tab">
      <div className="employee-summary">
        <article>
          <span>الإجمالي</span>
          <strong>{summary.total ?? 0}</strong>
        </article>
        <article>
          <span>النشطون</span>
          <strong>{summary.active ?? 0}</strong>
        </article>
        <article>
          <span>أجهزة بانتظار الاعتماد</span>
          <strong>{summary.pendingDevices ?? 0}</strong>
        </article>
      </div>
      <AddEmployeeForm roles={roles} />
      <section className="employee-table-card" aria-label="بحث الموظفين">
        <div className="employee-filters">
          <Input label="بحث" name="employeeSearch" placeholder="ابحث بالاسم أو المنصب" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
          <Select
            label="الحالة"
            name="employeeStatus"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            options={[
              { value: "ACTIVE", label: "نشط" },
              { value: "INACTIVE", label: "موقوف" },
            ]}
            placeholder="كل الحالات"
          />
          <Button variant="secondary" disabled={query.isFetching} onClick={() => query.refetch()}>
            تحديث
          </Button>
        </div>
        <AsyncState loading={query.isLoading} error={query.error} onRetry={query.refetch} empty={!query.isLoading && employees.length === 0} emptyText="لا يوجد موظفون">
          <EmployeesTable employees={employees} roles={roles} page={query.data?.pageMeta?.page || page} />
        </AsyncState>
        <ServerPagination meta={screen?.pageMeta} onPageChange={setPage} disabled={query.isFetching} label="موظف" />
      </section>
    </div>
  );
}

export default function EmployeesPage() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(() => initialTab(location.search));

  useRealtimeRoom({
    scope: "employees:list",
    rooms: ["admin:employees"],
    enabled: true,
    onEvent: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
    },
  });

  return (
    <div className="employees-page" dir="rtl">
      <PageHeader title="الموظفون" breadcrumbs={["الرئيسية", "الموظفون"]} icon={Users} tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="employees-shell">
        {activeTab === "employees" && <EmployeesTab />}
        {activeTab === "devices" && <DevicesTab />}
        {activeTab === "attendance" && <AttendanceTab />}
        {activeTab === "roles" && <RolesTab />}
      </div>
    </div>
  );
}
