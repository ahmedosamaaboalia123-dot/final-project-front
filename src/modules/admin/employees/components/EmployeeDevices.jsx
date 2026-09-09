import { Check, Laptop, X } from "lucide-react";
import { useReviewEmployeeDevice } from "../hooks/useEmployeeDetails";

const fmt = (value) => value ? new Date(value).toLocaleString("ar-EG") : "—";
const labels = { PENDING: "قيد المراجعة", APPROVED: "مسموح", BLOCKED: "محظور", REJECTED: "مرفوض" };

export default function EmployeeDevices({ employeeId, devices, onMessage }) {
  const review = useReviewEmployeeDevice(employeeId, { onSuccess: (_, { action }) => onMessage(action === "approve" ? "تم اعتماد الجهاز" : action === "block" ? "تم حظر الجهاز" : "تم رفض الجهاز") });
  const act = (deviceId, action) => review.mutate({ deviceId, action });
  return <section className="employee-detail-card"><h2><Laptop size={17}/>سجل الأجهزة</h2>
    {review.isError && <p className="employee-alert error" role="alert">{review.error?.response?.data?.message || review.error.message}</p>}
    <div className="employee-table-scroll"><table><thead><tr><th>الجهاز</th><th>المتصفح</th><th>النظام</th><th>البصمة</th><th>آخر استخدام</th><th>الحالة</th><th>الإجراء</th></tr></thead><tbody>
      {devices.map((device) => <tr key={device.id}><td>{device.name || "جهاز غير مسمى"}</td><td className="clip-cell" title={device.browser}>{device.browser || "—"}</td><td>{device.os || "—"}</td><td className="fingerprint-cell">{device.fingerprint}</td><td>{fmt(device.lastLoginAt || device.lastSeenAt || device.createdAt)}</td><td><span className={`device-status ${(device.status || "PENDING").toLowerCase()}`}>{labels[device.status] || device.status}</span></td><td><div className="device-actions">{device.status !== "APPROVED" && <button className="approve" disabled={review.isPending} onClick={() => act(device.id, "approve")}><Check size={14}/>قبول</button>}{device.status === "PENDING" && <button className="reject" disabled={review.isPending} onClick={() => act(device.id, "reject")}><X size={14}/>رفض</button>}{device.status === "APPROVED" && <button className="reject" disabled={review.isPending} onClick={() => act(device.id, "block")}><X size={14}/>حظر</button>}</div></td></tr>)}
    </tbody></table></div>{!devices.length && <p className="employee-empty">لم يسجل أي جهاز بعد</p>}
  </section>;
}
