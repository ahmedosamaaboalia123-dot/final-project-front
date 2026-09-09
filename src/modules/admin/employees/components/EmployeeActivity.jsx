import { CalendarDays, Clock } from "lucide-react";

const fmt = (value) => value ? new Date(value).toLocaleString("ar-EG") : "—";

export default function EmployeeActivity({ attendanceRecords, auditLogs }) {
  const lateDays = attendanceRecords.filter((row) => row.status === "LATE").length;
  const lateMinutes = attendanceRecords.reduce((sum, row) => sum + Number(row.lateMinutes || 0), 0);
  return <>
    <section className="attendance-stats"><div><CalendarDays/><span>أيام الحضور</span><strong>{attendanceRecords.length}</strong></div><div><Clock/><span>أيام التأخير</span><strong>{lateDays}</strong></div><div><Clock/><span>إجمالي التأخير</span><strong>{lateMinutes} دقيقة</strong></div></section>
    <section className="employee-detail-card"><h2>سجل الحضور اليومي</h2><div className="employee-table-scroll"><table><thead><tr><th>اليوم</th><th>بداية العمل</th><th>وقت الدخول</th><th>التأخير</th><th>نهاية العمل</th><th>الحالة</th></tr></thead><tbody>{attendanceRecords.map((row) => <tr key={row.id}><td>{new Date(row.attendanceDate).toLocaleDateString("ar-EG")}</td><td>{row.scheduledStart || "—"}</td><td>{fmt(row.checkInAt)}</td><td>{row.lateMinutes ? `${row.lateMinutes} دقيقة` : "—"}</td><td>{row.scheduledEnd || "—"}</td><td><span className={`attendance-status ${(row.status || "ON_TIME").toLowerCase()}`}>{row.status === "LATE" ? "متأخر" : "في الموعد"}</span></td></tr>)}</tbody></table></div>{!attendanceRecords.length && <p className="employee-empty">لا يوجد حضور مسجل</p>}</section>
    <section className="employee-detail-card"><h2>سجل أحداث الموظف</h2><div className="employee-table-scroll"><table><thead><tr><th>التاريخ</th><th>الصفحة</th><th>الحدث</th><th>التفاصيل</th><th>IP</th></tr></thead><tbody>{auditLogs.map((log) => <tr key={log.id}><td>{fmt(log.createdAt)}</td><td>{log.page}</td><td>{log.action}</td><td>{log.description || "—"}</td><td>{log.ipAddress || "—"}</td></tr>)}</tbody></table></div>{!auditLogs.length && <p className="employee-empty">لا توجد أحداث</p>}</section>
  </>;
}
