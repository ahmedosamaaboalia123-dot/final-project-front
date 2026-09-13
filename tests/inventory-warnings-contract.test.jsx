import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { INVENTORY_ENDPOINTS } from "@/modules/admin/inventory/api/inventory.api";
import { WARNING_ENDPOINTS } from "@/modules/admin/warnings/api/warnings.api";
import {
  convertForDisplay,
  toMaterialsScreen,
  toMaterialDetails,
  toUnitOptions,
  toWithdrawalsList,
} from "@/modules/admin/inventory/adapters/inventory.adapter";
import {
  firstInventoryFormError,
  materialFormSchema,
  withdrawFormSchema,
} from "@/modules/admin/inventory/schemas/inventory.schema";
import {
  normalizeWarningType,
  toWarningsScreen,
} from "@/modules/admin/warnings/adapters/warning.adapter";
import { renderApp } from "@/test/renderApp";
import InventoryPage from "@/modules/admin/inventory/pages/InventoryPage";
import MaterialDetailsPage from "@/modules/admin/inventory/pages/MaterialDetailsPage";
import WarningsPage from "@/modules/admin/warnings/pages/WarningsPage";

vi.mock("@/realtime/useRealtimeRoom", () => ({ useRealtimeRoom: () => {} }));
vi.mock("@/modules/admin/suppliers/services/suppliersService", () => ({ getSupplierOptions: () => Promise.resolve({ data: [] }) }));

vi.mock("@/modules/admin/inventory/hooks/inventory.queries", () => ({
  useMaterialsScreen: () => ({
    data: {
      materials: [
        { id: "m1", name: "بن أرابيكا", supplierId: "s1", largeUnitId: "u1", stockSmall: "1200", lastPurchasePrice: "450.00", nextExpiry: "2026-12-01", status: "ACTIVE", version: 4 },
        { id: "m2", name: "سكر", supplierId: "s2", largeUnitId: "u1", stockSmall: "300", lastPurchasePrice: "60.00", nextExpiry: null, status: "ACTIVE", version: 2 },
      ],
      summary: { materials: 2, lowStock: 1, expiring: 0, expired: 0, dataQuality: "COMPLETE" },
      filters: { suppliers: [{ id: "s1", name: "مورد النور" }, { id: "s2", name: "مورد الشمس" }], units: [], statuses: ["ACTIVE", "INACTIVE"] },
      pageMeta: { page: 1, limit: 10, totalItems: 2, totalPages: 1 },
    },
    isLoading: false, isError: false, isFetching: false, refetch: vi.fn(),
  }),
  useUnitsQuery: () => ({ data: [{ value: "u1", label: "كجم" }, { value: "u2", label: "جرام" }], isLoading: false }),
  useMaterialDetailsQuery: () => ({
    data: {
      material: { id: "m1", name: "بن أرابيكا", supplierId: "s1", largeUnitId: "u1", smallUnitId: "u2", conversionFactor: "1000", minStockSmall: "500", expiryAlertDays: 30, status: "ACTIVE", stockSmall: "1200", lastPurchasePrice: "450.00", nextExpiry: "2026-12-01", priorityVersion: 1, version: 4 },
      batches: { items: [
        { id: "b1", batchNumber: "B-001", initialQuantitySmall: "2000", remainingQuantitySmall: "1200", remainingInventoryValue: "540.00", receivedOn: "2026-09-01", expiryOn: "2026-12-01", salePriority: 1, version: 2 },
        { id: "b2", batchNumber: "B-002", initialQuantitySmall: "1000", remainingQuantitySmall: "0", remainingInventoryValue: "0.00", receivedOn: "2026-08-01", expiryOn: "2026-11-01", salePriority: 2, version: 1 },
      ] },
    },
    isLoading: false, isError: false, refetch: vi.fn(),
  }),
  useWithdrawalsQuery: () => ({
    data: { items: [{ id: "w1", kind: "WITHDRAWAL", quantitySmall: "100", inventoryValue: "45.00", quantityAfterSmall: "1100", reason: "هالك", occurredOn: "2026-09-12" }], pageMeta: { page: 1, limit: 10, totalItems: 1, totalPages: 1 } },
    isLoading: false, isError: false, isFetching: false, refetch: vi.fn(),
  }),
}));

vi.mock("@/modules/admin/warnings/hooks/warning.queries", () => ({
  useWarningsScreen: () => ({
    data: {
      items: [
        { id: "LOW_STOCK:m1", type: "LOW_STOCK", typeLabel: "نقص مخزون", severity: "CRITICAL", severityLabel: "حرجة", materialId: "m1", materialName: "سكر", detail: "المتاح 300 من حد 500" },
        { id: "EXPIRED:b9", type: "EXPIRED", typeLabel: "منتهي الصلاحية", severity: "CRITICAL", severityLabel: "حرجة", materialId: "m1", materialName: "بن أرابيكا", detail: "انتهت 2026-09-01 — دفعة B-009" },
      ],
      summary: { lowStock: 1, expiring: 0, expired: 1, openShiftLong: null },
      pageMeta: { page: 1, limit: 10, totalItems: 2, totalPages: 1 },
      dataQuality: "FULL",
    },
    isLoading: false, isError: false, isFetching: false, refetch: vi.fn(),
  }),
}));

const adminAuth = {
  permissions: [
    { pageKey: "inventory", visible: true, actions: ["read", "create", "update", "manage", "withdraw", "priorities"] },
    { pageKey: "warnings", visible: true, actions: ["read"] },
  ],
};

describe("inventory + warnings v1 contract", () => {
  it("targets the real backend routes, not legacy paths", () => {
    expect(INVENTORY_ENDPOINTS.screen).toBe("/raw-materials-screen");
    expect(INVENTORY_ENDPOINTS.details("abc")).toBe("/raw-materials/abc");
    expect(INVENTORY_ENDPOINTS.withdraw("abc")).toBe("/raw-materials/abc/withdrawals");
    expect(INVENTORY_ENDPOINTS.priorities("abc")).toBe("/raw-materials/abc/batch-priorities");
    expect(INVENTORY_ENDPOINTS.withdrawals).toBe("/withdrawals");
    expect(INVENTORY_ENDPOINTS.units).toBe("/measurement-units");
    expect(WARNING_ENDPOINTS.screen).toBe("/warnings-screen");
    expect(WARNING_ENDPOINTS.summary).toBe("/warnings/summary");
  });

  it("keeps money as strings and cleans batches, units, and movements", () => {
    const screen = toMaterialsScreen({
      materials: [{ id: "m1", stockSmall: 1200, lastPurchasePrice: "450.00", version: 4 }],
      summary: { materials: 1 },
      filters: {},
    });
    expect(screen.materials[0].stockSmall).toBe("1200");
    expect(screen.materials[0].lastPurchasePrice).toBe("450.00");
    expect(screen.materials[0].version).toBe(4);
    expect(screen.summary.materials).toBe(1);
    const details = toMaterialDetails({
      material: { id: "m1", name: "x", priorityVersion: 1 },
      batches: { items: [{ id: "b2", salePriority: 2, remainingQuantitySmall: 0, remainingInventoryValue: 0 }, { id: "b1", salePriority: 1, remainingQuantitySmall: 5, remainingInventoryValue: 10 }] },
    });
    expect(details.batches.items).toHaveLength(2);
    expect(details.batches.items[0].remainingInventoryValue).toBe("0");
    expect(details.batches.items[1].remainingInventoryValue).toBe("10");
    expect(toUnitOptions({ items: [{ id: "u1", nameAr: "كيلوجرام", code: "KG", kind: "WEIGHT", physicalFactor: 1, isActive: true }, { id: "u2", nameAr: "قديم", code: "OLD", isActive: false }] })).toEqual([{ value: "u1", label: "كيلوجرام (KG)", kind: "WEIGHT", physicalFactor: "1" }]);
    const movements = toWithdrawalsList({ items: [{ id: "w1", quantitySmall: 100, inventoryValue: 45 }] });
    expect(movements.items[0].quantitySmall).toBe("100");
  });

  it("validates material and withdrawal bodies exactly like the backend", () => {
    const supplierId = "507f1f77bcf86cd799439011";
    const largeUnitId = "507f1f77bcf86cd799439012";
    const smallUnitId = "507f1f77bcf86cd799439013";
    const batchId = "507f1f77bcf86cd799439014";
    const good = materialFormSchema.safeParse({ name: "بن", supplierId, largeUnitId, smallUnitId, conversionFactor: "1000", smallQuantityStep: "1", minStockSmall: "500", expiryAlertDays: 30 });
    expect(good.success).toBe(true);
    expect(good.success && good.data.conversionFactor).toBe("1000");
    expect(materialFormSchema.safeParse({ name: "بن", supplierId, largeUnitId, smallUnitId: largeUnitId, conversionFactor: "1", smallQuantityStep: "1", minStockSmall: "0", expiryAlertDays: 0 }).success).toBe(false);
    expect(materialFormSchema.safeParse({ name: "بن", supplierId, largeUnitId, smallUnitId, conversionFactor: "0", smallQuantityStep: "1", minStockSmall: "0", expiryAlertDays: 0 }).success).toBe(false);
    expect(materialFormSchema.safeParse({ name: "بن", supplierId: "s1", largeUnitId, smallUnitId, conversionFactor: "1", smallQuantityStep: "1", minStockSmall: "0", expiryAlertDays: 0 }).success).toBe(false);
    expect(firstInventoryFormError(materialFormSchema.safeParse({ name: "", supplierId: "", largeUnitId: "", smallUnitId: "", conversionFactor: "", smallQuantityStep: "", minStockSmall: "" }))).toBeTruthy();
    expect(withdrawFormSchema.safeParse({ batchId, quantityLarge: "2", reason: "هالك تشغيل", occurredOn: "2026-09-12", expectedBatchVersion: 2 }).success).toBe(true);
    expect(withdrawFormSchema.safeParse({ batchId: "", quantityLarge: "0", reason: "ab", occurredOn: "x", expectedBatchVersion: 0 }).success).toBe(false);
  });

  it("converts display quantities without exposing unit management", () => {
    expect(convertForDisplay("2", "1000")).toBe("2000");
    expect(convertForDisplay("2000", "1000", "small-to-large")).toBe("2");
    expect(convertForDisplay("2", "0")).toBe("—");
  });

  it("normalizes warning type filters and labels severities", () => {
    expect(normalizeWarningType("all")).toBeUndefined();
    expect(normalizeWarningType("LOW_STOCK")).toBe("LOW_STOCK");
    expect(normalizeWarningType("bogus")).toBeUndefined();
    const screen = toWarningsScreen({
      warnings: undefined,
      items: undefined,
    });
    expect(screen.items).toEqual([]);
    const full = toWarningsScreen({
      items: [
        { id: "LOW_STOCK:m1", type: "LOW_STOCK", severity: "CRITICAL", threshold: "500", currentValue: "0", material: { id: "m1", name: "سكر" } },
        { id: "EXPIRING:b1", type: "EXPIRING", severity: "WARNING", daysUntilExpiry: 3, expiryOn: "2026-09-15", batch: { id: "b1", batchNumber: "B-001" }, material: { id: "m1", name: "بن" } },
        { id: "OPEN_SHIFT_LONG:x", type: "OPEN_SHIFT_LONG", severity: "WARNING" },
      ],
      summary: { lowStock: 1, expiring: 1, expired: 0, openShiftLong: null },
      pageMeta: { page: 1, limit: 10, totalItems: 3, totalPages: 1 },
      dataQuality: "FULL",
    });
    expect(full.items[0].severityLabel).toBe("حرجة");
    expect(full.items[0].typeLabel).toBe("نقص مخزون");
    expect(full.items[0].materialName).toBe("سكر");
    expect(full.items[0].detail).toContain("500");
    expect(full.items[1].severityLabel).toBe("تحذير");
    expect(full.items[1].detail).toContain("B-001");
    expect(full.items[2].materialName).toBe("—");
    expect(full.summary.openShiftLong).toBeNull();
  });
});

describe("inventory pages on the v1 layer", () => {
  it("renders the server screen with material edit and delete actions", () => {
    renderApp(<InventoryPage />, { route: "/admin/inventory", auth: adminAuth });
    expect(screen.getByText("بن أرابيكا")).toBeInTheDocument();
    expect(screen.getByText("سكر")).toBeInTheDocument();
    expect(screen.getByText("إضافة مادة خام")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "حذف بن أرابيكا" })).toBeInTheDocument();
    expect(screen.queryByText("إضافة دفعة")).not.toBeInTheDocument();
  });

  it("renders material details with priority order and final-withdraw form", () => {
    renderApp(<MaterialDetailsPage />, { route: "/admin/inventory/m1", auth: adminAuth });
    expect(screen.getByText("تفاصيل المادة: بن أرابيكا")).toBeInTheDocument();
    expect(screen.getByText("سحب يدوي من المخزون (نهائي)")).toBeInTheDocument();
    expect(screen.getByText("تأكيد السحب النهائي")).toBeInTheDocument();
    expect(screen.queryByText("حذف الدفعة")).not.toBeInTheDocument();
  });

  it("shows supplier and unit names instead of raw IDs", () => {
    renderApp(<MaterialDetailsPage />, { route: "/admin/inventory/m1", auth: adminAuth });
    expect(screen.getByDisplayValue("مورد النور")).toBeInTheDocument();
    expect(screen.getByDisplayValue("كجم")).toBeInTheDocument();
    expect(screen.getByDisplayValue("جرام")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("s1")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("u1 / u2")).not.toBeInTheDocument();
  });
});

describe("warnings page on the v1 layer", () => {
  it("renders server summary and active warnings without local actions", () => {
    renderApp(<WarningsPage />, { route: "/admin/warnings", auth: adminAuth });
    expect(screen.getAllByText("نقص المخزون").length).toBeGreaterThan(0);
    expect(screen.getByText("سكر")).toBeInTheDocument();
    expect(screen.getAllByText("منتهية الصلاحية").length).toBeGreaterThan(0);
    expect(screen.queryByText("حل التحذير")).not.toBeInTheDocument();
  });
});
