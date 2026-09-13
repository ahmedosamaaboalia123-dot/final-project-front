import { Fragment, useMemo, useState } from "react";
import { History } from "lucide-react";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import Button from "@/shared/components/Button/Button";
import Input from "@/shared/components/Input/Input";
import Select from "@/shared/components/Select/Select";
import { AsyncState, DateTime, ServerPagination } from "@/shared/components";
import { can } from "@/modules/auth/permissions/permission";
import { useAuthStore } from "@/store/authStore";
import { AUDIT_RESULTS, AUDIT_SEVERITIES } from "../adapters/audit.adapter";
import {
  useAuditEvent,
  useAuditExportStatus,
  useAuditScreen,
  useEntityTimeline,
} from "../hooks/audit.queries";
import { useRequestAuditExport } from "../hooks/audit.mutations";
import {
  auditExportSchema,
  auditFilterSchema,
  firstAuditFormError,
} from "../schemas/audit.schema";
import "./AuditPage.css";

const PAGE_LIMIT = 10;
const EXPORT_FORMAT_OPTIONS = [
  { value: "PDF", label: "PDF" },
  { value: "XLSX", label: "Excel" },
  { value: "CSV", label: "CSV" },
];
const EXPORT_STATUS_LABELS = { PROCESSING: "قيد التجهيز", READY: "جاهز", FAILED: "فشل" };

const emptyDraft = { module: "", eventType: "", actorId: "", result: "", severity: "", from: "", to: "" };

const toIsoWithOffset = (localValue) => {
  if (!localValue) return undefined;
  const date = new Date(localValue);
  return Number.isNaN(date.getTime()) ? localValue : date.toISOString();
};

function JsonBlock({ title, value }) {
  if (value === null || value === undefined) return null;
  return (
    <details className="audit-details">
      <summary>{title}</summary>
      <pre dir="ltr">{JSON.stringify(value, null, 2)}</pre>
    </details>
  );
}

function AuditEventRowDetails({ event }) {
  const details = useAuditEvent(event.id);
  const full = details.data?.event || event;
  return (
    <tr className="audit-row audit-row--expanded">
      <td colSpan={8}>
        {details.isLoading && <p className="audit-muted">جاري تحميل تفاصيل الحدث...</p>}
        {details.isError && (
          <p className="audit-error" role="alert">{details.error?.message || "تعذر تحميل التفاصيل"}</p>
        )}
        <div className="audit-event-meta">
          <span>رقم الحدث: {full.eventNo || "—"}</span>
          <span>الإجراء: {full.action || "—"}</span>
          <span>الوقت: <DateTime value={full.occurredAt} /></span>
        </div>
        <JsonBlock title="الفاعل (actor)" value={full.actor} />
        <JsonBlock title="الكيان (entity)" value={full.entity} />
        <JsonBlock title="الحدث كاملًا (JSON)" value={full} />
      </td>
    </tr>
  );
}

export default function AuditPage() {
  const permissions = useAuthStore((state) => state.permissions);
  const canRead = can(permissions, "audit.read");
  const canExport = can(permissions, "audit.export");

  const [draft, setDraft] = useState(emptyDraft);
  const [applied, setApplied] = useState({});
  const [formError, setFormError] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);

  const [timelineDraft, setTimelineDraft] = useState({ entityType: "", entityId: "" });
  const [timelineLookup, setTimelineLookup] = useState(null);
  const [timelineError, setTimelineError] = useState("");

  const [format, setFormat] = useState("PDF");
  const [exportError, setExportError] = useState("");
  const [statusUrl, setStatusUrl] = useState(null);

  const params = useMemo(() => ({ ...applied, page, limit: PAGE_LIMIT }), [applied, page]);
  const screen = useAuditScreen(params);
  const timeline = useEntityTimeline(timelineLookup?.entityType, timelineLookup?.entityId);
  const requestExport = useRequestAuditExport({
    onSuccess: (data) => setStatusUrl(data?.export?.statusUrl || data?.statusUrl || null),
  });
  const exportStatus = useAuditExportStatus(statusUrl, { enabled: canExport && Boolean(statusUrl) });

  if (!canRead) {
    return (
      <div className="audit-page" dir="rtl">
        <PageHeader title="سجل التدقيق" breadcrumbs={["الإدارة", "سجل التدقيق"]} icon={History} />
        <p className="audit-error" role="alert">ليس لديك صلاحية لعرض سجل التدقيق.</p>
      </div>
    );
  }

  const summary = screen.data?.summary;
  const items = screen.data?.items || [];
  const job = exportStatus.data?.export || exportStatus.data || null;

  const applyFilters = (event) => {
    event.preventDefault();
    const parsed = auditFilterSchema.safeParse({
      ...(draft.module.trim() ? { module: draft.module.trim() } : {}),
      ...(draft.eventType.trim() ? { eventType: draft.eventType.trim() } : {}),
      ...(draft.actorId.trim() ? { actorId: draft.actorId.trim() } : {}),
      ...(draft.result ? { result: draft.result } : {}),
      ...(draft.severity ? { severity: draft.severity } : {}),
      ...(draft.from ? { from: toIsoWithOffset(draft.from) } : {}),
      ...(draft.to ? { to: toIsoWithOffset(draft.to) } : {}),
    });
    if (!parsed.success) { setFormError(firstAuditFormError(parsed)); return; }
    setFormError("");
    setApplied(parsed.data);
    setPage(1);
    setExpandedId(null);
  };

  const resetFilters = () => {
    setDraft(emptyDraft);
    setFormError("");
    setApplied({});
    setPage(1);
    setExpandedId(null);
  };

  const lookupTimeline = (event) => {
    event.preventDefault();
    const entityType = timelineDraft.entityType.trim();
    const entityId = timelineDraft.entityId.trim();
    if (!entityType || !entityId) { setTimelineError("أدخل نوع الكيان ومعرفه أولًا"); return; }
    setTimelineError("");
    setTimelineLookup({ entityType, entityId });
  };

  const submitExport = (event) => {
    event.preventDefault();
    const parsed = auditExportSchema.safeParse({ filters: applied, format });
    if (!parsed.success) { setExportError(firstAuditFormError(parsed)); return; }
    setExportError("");
    setStatusUrl(null);
    requestExport.mutate({ reportType: "audit:events", ...parsed.data });
  };

  const chips = [
    ["الإجمالي", summary?.total ?? 0],
    ["ناجح", summary?.success ?? 0],
    ["فاشل", summary?.failed ?? 0],
    ["مرفوض", summary?.denied ?? 0],
    ["تحذير", summary?.warning ?? 0],
    ["حرج", summary?.critical ?? 0],
  ];

  return (
    <div className="audit-page" dir="rtl">
      <PageHeader title="سجل التدقيق" breadcrumbs={["الإدارة", "سجل التدقيق"]} icon={History} />

      <form className="audit-filters" onSubmit={applyFilters}>
        <Input label="الوحدة" placeholder="مثال: orders" value={draft.module} onChange={(e) => setDraft((c) => ({ ...c, module: e.target.value }))} />
        <Input label="نوع الحدث" placeholder="مثال: order.created" value={draft.eventType} onChange={(e) => setDraft((c) => ({ ...c, eventType: e.target.value }))} />
        <Input label="معرف الفاعل" placeholder="actorId" value={draft.actorId} onChange={(e) => setDraft((c) => ({ ...c, actorId: e.target.value }))} />
        <Select label="النتيجة" value={draft.result} onChange={(e) => setDraft((c) => ({ ...c, result: e.target.value }))} placeholder="الكل" options={Object.entries(AUDIT_RESULTS).map(([value, label]) => ({ value, label }))} />
        <Select label="الخطورة" value={draft.severity} onChange={(e) => setDraft((c) => ({ ...c, severity: e.target.value }))} placeholder="الكل" options={Object.entries(AUDIT_SEVERITIES).map(([value, label]) => ({ value, label }))} />
        <Input label="من" type="datetime-local" value={draft.from} onChange={(e) => setDraft((c) => ({ ...c, from: e.target.value }))} />
        <Input label="إلى" type="datetime-local" value={draft.to} onChange={(e) => setDraft((c) => ({ ...c, to: e.target.value }))} />
        <div className="audit-filters__actions">
          <Button type="submit" loading={screen.isFetching}>بحث</Button>
          <Button type="button" variant="secondary" onClick={resetFilters}>إعادة تعيين</Button>
        </div>
        {formError && <p className="audit-error audit-filters__error" role="alert">{formError}</p>}
      </form>

      <div className="audit-chips" aria-label="ملخص سجل التدقيق">
        {chips.map(([label, value]) => (
          <article key={label} className="audit-chip"><span>{label}</span><strong>{value}</strong></article>
        ))}
      </div>

      <section className="audit-card" aria-label="أحداث التدقيق">
        <h2>الأحداث</h2>
        <AsyncState loading={screen.isLoading} error={screen.error} onRetry={screen.refetch} empty={false}>
          {items.length === 0 ? (
            <p className="audit-muted">لا توجد أحداث مطابقة للفلاتر الحالية.</p>
          ) : (
            <div className="audit-table-wrap">
              <table className="audit-table">
                <thead>
                  <tr><th>الرقم</th><th>النوع</th><th>الوحدة</th><th>الإجراء</th><th>النتيجة</th><th>الخطورة</th><th>الوقت</th><th>التفاصيل</th></tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <Fragment key={item.id}>
                      <tr>
                        <td>{item.eventNo || "—"}</td>
                        <td>{item.eventType || "—"}</td>
                        <td>{item.module || "—"}</td>
                        <td>{item.action || "—"}</td>
                        <td>{item.resultLabel}</td>
                        <td>{item.severityLabel}</td>
                        <td><DateTime value={item.occurredAt} /></td>
                        <td>
                          <button type="button" className="audit-expand-btn" aria-expanded={expandedId === item.id} onClick={() => setExpandedId((c) => (c === item.id ? null : item.id))}>
                            {expandedId === item.id ? "إخفاء" : "عرض"}
                          </button>
                        </td>
                      </tr>
                      {expandedId === item.id && <AuditEventRowDetails event={item} />}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <ServerPagination meta={screen.data?.pageMeta} onPageChange={setPage} disabled={screen.isFetching} label="حدث" />
        </AsyncState>
      </section>

      <section className="audit-card" aria-label="الخط الزمني لكيان">
        <h2>الخط الزمني لكيان</h2>
        <form className="audit-timeline-form" onSubmit={lookupTimeline}>
          <Input label="نوع الكيان" placeholder="مثال: Order" value={timelineDraft.entityType} onChange={(e) => setTimelineDraft((c) => ({ ...c, entityType: e.target.value }))} />
          <Input label="معرف الكيان" placeholder="entityId" value={timelineDraft.entityId} onChange={(e) => setTimelineDraft((c) => ({ ...c, entityId: e.target.value }))} />
          <div className="audit-timeline-form__actions">
            <Button type="submit" loading={timeline.isFetching}>عرض الخط الزمني</Button>
          </div>
        </form>
        {timelineError && <p className="audit-error" role="alert">{timelineError}</p>}
        {!timelineLookup ? (
          <p className="audit-muted">أدخل نوع الكيان ومعرفه ثم اضغط عرض الخط الزمني.</p>
        ) : (
          <AsyncState loading={timeline.isLoading} error={timeline.error} onRetry={timeline.refetch} empty={!timeline.isLoading && !timeline.isError && (timeline.data?.items?.length ?? 0) === 0} emptyText="لا توجد أحداث لهذا الكيان.">
            <ul className="audit-timeline">
              {(timeline.data?.items || []).map((entry) => (
                <li key={entry.id}>
                  <strong>{entry.eventType || "—"}</strong>
                  <p>{entry.action || "—"} — {entry.resultLabel}</p>
                  <DateTime value={entry.occurredAt} />
                </li>
              ))}
            </ul>
          </AsyncState>
        )}
      </section>

      {canExport && (
        <section className="audit-card" aria-label="تصدير سجل التدقيق">
          <h2>تصدير سجل التدقيق</h2>
          <p className="audit-muted">يتم تصدير الأحداث المطابقة للفلاتر الحالية.</p>
          <form className="audit-export-form" onSubmit={submitExport}>
            <Select label="الصيغة" value={format} onChange={(e) => setFormat(e.target.value)} options={EXPORT_FORMAT_OPTIONS} placeholder="اختر الصيغة" />
            <div className="audit-export-form__actions">
              <Button type="submit" loading={requestExport.isPending}>طلب تصدير</Button>
            </div>
          </form>
          {exportError && <p className="audit-error" role="alert">{exportError}</p>}
          {requestExport.isError && <p className="audit-error" role="alert">{requestExport.error?.message || "تعذر طلب التصدير"}</p>}
          {requestExport.isSuccess && !statusUrl && <p className="audit-muted">تم استلام طلب التصدير.</p>}
          {statusUrl && (
            <div className="audit-export-status" role="status">
              <span>حالة التصدير: {job ? (EXPORT_STATUS_LABELS[job.status] || job.status || "—") : "قيد التجهيز..."}</span>
              {exportStatus.isError && <p className="audit-error">تعذر متابعة حالة التصدير.</p>}
              {job?.status === "FAILED" && <p className="audit-error">{job.errorCode || "فشل التصدير"}</p>}
              {job?.status === "READY" && <p className="audit-muted">اكتمل التصدير: {job.rowCount ?? "—"} صف — بصمة التحقق {job.checksum || "—"} (الباك يعيد بيانات التصدير الوصفية فقط، بلا ملف للتنزيل).</p>}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
