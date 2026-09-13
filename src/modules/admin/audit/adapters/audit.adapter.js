import { readPageMeta } from "@/api/pagination";

export const AUDIT_RESULTS = Object.freeze({ SUCCESS: "ناجح", FAILED: "فاشل", DENIED: "مرفوض" });
export const AUDIT_SEVERITIES = Object.freeze({ INFO: "معلومة", WARNING: "تحذير", CRITICAL: "حرج" });

const cleanEvent = (event = {}) => ({
  ...event,
  id: String(event.id || event._id || ""),
  eventNo: event.eventNo || "",
  eventType: event.eventType || "",
  module: event.module || "",
  action: event.action || "",
  actor: event.actor ?? null,
  entity: event.entity ?? null,
  result: event.result || "",
  resultLabel: AUDIT_RESULTS[event.result] || event.result || "—",
  severity: event.severity || "",
  severityLabel: AUDIT_SEVERITIES[event.severity] || event.severity || "—",
  occurredAt: event.occurredAt ?? null,
});

export function toAuditScreen(data = {}) {
  const items = (data.items || []).map(cleanEvent);
  return {
    items,
    summary: {
      total: Number(data.summary?.total ?? 0),
      success: Number(data.summary?.success ?? 0),
      failed: Number(data.summary?.failed ?? 0),
      denied: Number(data.summary?.denied ?? 0),
      warning: Number(data.summary?.warning ?? 0),
      critical: Number(data.summary?.critical ?? 0),
    },
    filters: data.filters ?? {},
    pageMeta: readPageMeta(data.pageMeta, items.length),
  };
}

export function toAuditEvent(data = {}) {
  return { event: data.event ? cleanEvent(data.event) : null };
}

export function toEntityTimeline(data = {}) {
  const items = (data.items || []).map(cleanEvent);
  return { items, pageMeta: readPageMeta(data.pageMeta, items.length) };
}
