import { readPageMeta } from "@/api/pagination";

export const WARNING_TYPES = Object.freeze({
  LOW_STOCK: "نقص مخزون",
  EXPIRING: "قرب انتهاء",
  EXPIRED: "منتهي الصلاحية",
  OPEN_SHIFT_LONG: "وردية مفتوحة طويلًا",
});

export const WARNING_SEVERITIES = Object.freeze({ CRITICAL: "حرجة", WARNING: "تحذير" });

const WARNING_TYPE_VALUES = Object.freeze(["LOW_STOCK", "EXPIRING", "EXPIRED", "OPEN_SHIFT_LONG"]);

export function normalizeWarningType(value) {
  return WARNING_TYPE_VALUES.includes(value) ? value : undefined;
}

const buildDetail = (warning = {}) => {
  if (warning.type === "LOW_STOCK") return `المتاح ${warning.currentValue ?? "—"} من حد ${warning.threshold ?? "—"}`;
  if (warning.type === "EXPIRING") return `تنتهي خلال ${warning.daysUntilExpiry ?? "—"} يوم (${warning.expiryOn ?? "—"})${warning.batch?.batchNumber ? ` — دفعة ${warning.batch.batchNumber}` : ""}`;
  if (warning.type === "EXPIRED") return `انتهت ${warning.expiryOn ?? "—"}${warning.batch?.batchNumber ? ` — دفعة ${warning.batch.batchNumber}` : ""}`;
  return warning.message || warning.detail || "—";
};

const cleanWarning = (warning = {}) => ({
  ...warning,
  id: String(warning.id || ""),
  type: warning.type || "",
  typeLabel: WARNING_TYPES[warning.type] || warning.type || "—",
  severity: warning.severity || "WARNING",
  severityLabel: WARNING_SEVERITIES[warning.severity] || warning.severity || "—",
  materialName: warning.material?.name || "—",
  detail: buildDetail(warning),
  material: warning.material ? { ...warning.material, id: String(warning.material.id || "") } : null,
  batch: warning.batch ? { ...warning.batch, id: String(warning.batch.id || "") } : null,
  supplier: warning.supplier ? { ...warning.supplier, id: String(warning.supplier?.id ?? "") } : null,
});

export function toWarningsScreen(data = {}) {
  const items = (data.items || []).map(cleanWarning);
  const summary = data.summary || null;
  return {
    items,
    summary: summary
      ? {
          lowStock: summary.lowStock ?? 0, expiring: summary.expiring ?? 0,
          expired: summary.expired ?? 0, openShiftLong: summary.openShiftLong ?? null,
        }
      : { lowStock: 0, expiring: 0, expired: 0, openShiftLong: null },
    evaluatedAt: data.evaluatedAt ?? null,
    businessToday: data.businessToday ?? null,
    timezone: data.timezone ?? "Africa/Cairo",
    dataQuality: data.dataQuality ?? "COMPLETE",
    failedSources: data.failedSources ?? [],
    pageMeta: readPageMeta(data.pageMeta, items.length),
  };
}

export function toWarningsSummary(data = {}) {
  const counts = data.counts || data.summary || {};
  return {
    lowStock: counts.lowStock ?? 0, expiring: counts.expiring ?? 0,
    expired: counts.expired ?? 0, openShiftLong: counts.openShiftLong ?? 0,
    dataQuality: data.dataQuality ?? "COMPLETE",
    evaluatedAt: data.evaluatedAt ?? null,
  };
}
