import { useMemo, useState } from "react";
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

function AuditEventCardDetails({ event }) {
  const details = useAuditEvent(event.id);
  const full = details.data?.event || event;
  const infoRows = [
    ["رقم الحدث", full.eventNo || "—"],
    ["الإجراء", full.action || "—"],
    ["الوحدة", full.module || "—"],
    ["نوع الكيان", full.entity?.type || "—"],
    ["معرف الكيان", full.entity?.id ? String(full.entity.id) : "—"],
    ["النتيجة", full.resultLabel || full.result || "—"],
    ["الخطورة", full.severityLabel || full.severity || "—"],
    ["requestId", full.requestId || "—"],
  ];
  return (
    <div className="audit-event-full">
      {details.isLoading && <p className="audit-muted">جاري تحميل تفاصيل الحدث...</p>}
      {details.isError && (
        <p className="audit-error" role="alert">{details.error?.message || "تعذر تحميل التفاصيل"}</p>
      )}
      <dl className="audit-event-grid">
        {infoRows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd dir={label === "requestId" || label === "معرف الكيان" ? "ltr" : undefined}>{String(value)}</dd>
          </div>
        ))}
        <div>
          <dt>الوقت</dt>
          <dd><DateTime value={full.occurredAt} /></dd>
        </div>
      </dl>
      <JsonBlock title="بيانات إضافية (metadata)" value={full.metadataSafe ?? full.metadata} />
    </div>
  );
}

function AuditEventCard({ event, expanded, onToggle }) {
  const initial = (event.actorName || event.actorLabel || "؟").trim().charAt(0) || "؟";
  return (
    <article className="audit-event-card" aria-label={`حدث ${event.eventNo || event.eventType}`}>
      <div className="audit-event-card__top">
        <span className="audit-event-card__no">#{event.eventNo || "—"}</span>
        <strong className="audit-event-card__type">{event.eventLabel}</strong>
        <span className="audit-event-card__module">{event.module || "—"}</span>
        <span className={`audit-event-card__pill audit-event-card__pill--${String(event.result || "").toLowerCase()}`}>
          {event.resultLabel}
        </span>
        <span className={`audit-event-card__pill audit-event-card__pill--${String(event.severity || "").toLowerCase()}`}>
          {event.severityLabel}
        </span>
        <span className="audit-event-card__time"><DateTime value={event.occurredAt} /></span>
      </div>
      <div className="audit-event-card__actor">
        <span className="audit-event-card__avatar" aria-hidden="true">{initial}</span>
        <span className="audit-event-card__actor-name">{event.actorName || "غير متاح"}</span>
        <span className="audit-event-card__actor-type">{event.actorLabel}</span>
        <span className="audit-event-card__action">{event.action || "—"}</span>
        <button
          type="button"
          className="audit-expand-btn audit-event-card__toggle"
          aria-expanded={expanded}
          onClick={onToggle}
        >
          {expanded ? "إخفاء البيانات" : "عرض البيانات الكاملة"}
        </button>
      </div>
      {expanded && <AuditEventCardDetails event={event} />}
    </article>
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
            <div className="audit-events">
              {items.map((item) => (
                <AuditEventCard
                  key={item.id}
                  event={item}
                  expanded={expandedId === item.id}
                  onToggle={() => setExpandedId((c) => (c === item.id ? null : item.id))}
                />
              ))}
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
