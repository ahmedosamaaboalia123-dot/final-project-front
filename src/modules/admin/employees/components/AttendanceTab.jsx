import { useState } from "react";
import { Clock } from "lucide-react";
import Button from "@/shared/components/Button/Button";
import Select from "@/shared/components/Select/Select";
import { AsyncState, ServerPagination } from "@/shared/components";
import { useAttendanceList } from "../hooks/employee.queries";
import AttendanceActions from "./AttendanceActions";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("ar-EG");
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("ar-EG");
};

export default function AttendanceTab() {
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const query = useAttendanceList({
    page,
    limit: 10,
    ...(status ? { status } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  });
  const items = query.data?.items || [];
  const summary = query.data?.summary || { total: 0, open: 0, closed: 0 };

  const reset = () => {
    setStatus("");
    setFrom("");
    setTo("");
    setPage(1);
  };

  return (
    <section className="employee-table-card" aria-label="سجل الحضور">
      <div className="employee-card-title">
        <Clock size={17} />
        <h2>الحضور والانصراف</h2>
      </div>
      <div className="employee-summary">
        <article>
          <span>الإجمالي</span>
          <strong>{summary.total ?? 0}</strong>
        </article>
        <article>
          <span>المفتوح</span>
          <strong>{summary.open ?? 0}</strong>
        </article>
        <article>
          <span>المغلق</span>
          <strong>{summary.closed ?? 0}</strong>
        </article>
      </div>
      <div className="employee-filters">
        <Select
          label="الحالة"
          name="attendanceStatus"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          options={[
            { value: "OPEN", label: "مفتوح" },
            { value: "CLOSED", label: "مغلق" },
          ]}
          placeholder="كل الحالات"
        />
        <label className="employee-date">
          <span>من (YYYY-MM-DD)</span>
          <input
            type="date"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="employee-date">
          <span>إلى (YYYY-MM-DD)</span>
          <input
            type="date"
            value={to}
            onChange={(event) => {
              setTo(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <Button variant="secondary" onClick={reset} disabled={query.isFetching}>
          تصفير
        </Button>
      </div>
      <AsyncState loading={query.isLoading} error={query.error} onRetry={query.refetch} empty={!query.isLoading && items.length === 0} emptyText="لا توجد سجلات حضور">
        <div className="employee-table-scroll">
          <table>
            <thead>
              <tr>
                <th>الموظف</th>
                <th>التاريخ</th>
                <th>الحضور</th>
                <th>الانصراف</th>
                <th>التأخير</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {items.map((record) => (
                <tr key={String(record.id)}>
                  <td dir="ltr">{String(record.employeeId || "—").slice(-6) || "—"}</td>
                  <td>{formatDate(record.attendanceDate)}</td>
                  <td>{formatDateTime(record.checkInAt)}</td>
                  <td>{formatDateTime(record.checkOutAt)}</td>
                  <td>{record.lateMinutes ?? "—"}</td>
                  <td>
                    <span className={`attendance-status attendance-status--${String(record.status || "OPEN").toLowerCase()}`}>
                      {record.statusLabel || record.status}
                    </span>
                  </td>
                  <td>
                    <AttendanceActions record={record} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AsyncState>
      <ServerPagination meta={query.data?.pageMeta} onPageChange={setPage} disabled={query.isFetching} label="سجل" />
    </section>
  );
}
