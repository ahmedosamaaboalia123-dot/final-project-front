// Persists the customer's last used details across the customer site so the
// tracking screen can pre-fill the manual order-number + phone search fields.
// This data is NEVER cleared (see project rule: never wipe client-side data).

const PROFILE_KEY = "404_customer_profile_v1";

const EMPTY_PROFILE = { name: "", phone: "", lastOrder: { orderNumber: "", trackingToken: "", phone: "", fulfillmentType: "", total: null, createdAt: "" } };

export function getCustomerProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...EMPTY_PROFILE, lastOrder: { ...EMPTY_PROFILE.lastOrder } };
    const parsed = JSON.parse(raw);
    return {
      name: typeof parsed?.name === "string" ? parsed.name : "",
      phone: typeof parsed?.phone === "string" ? parsed.phone : "",
      lastOrder: {
        orderNumber: parsed?.lastOrder?.orderNumber || "",
        trackingToken: parsed?.lastOrder?.trackingToken || "",
        phone: typeof parsed?.lastOrder?.phone === "string" ? parsed.lastOrder.phone : "",
        fulfillmentType: typeof parsed?.lastOrder?.fulfillmentType === "string" ? parsed.lastOrder.fulfillmentType : "",
        total: typeof parsed?.lastOrder?.total === "number" ? parsed.lastOrder.total : null,
        createdAt: typeof parsed?.lastOrder?.createdAt === "string" ? parsed.lastOrder.createdAt : "",
      },
    };
  } catch (e) {
    console.error("getCustomerProfile error:", e);
    return { ...EMPTY_PROFILE, lastOrder: { ...EMPTY_PROFILE.lastOrder } };
  }
}

export function saveCustomerProfile(partial = {}) {
  try {
    const current = getCustomerProfile();
    const next = {
      ...current,
      ...(partial.name !== undefined ? { name: partial.name } : {}),
      ...(partial.phone !== undefined ? { phone: partial.phone } : {}),
      lastOrder: {
        ...current.lastOrder,
        ...(partial.lastOrder ? partial.lastOrder : {}),
      },
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    return next;
  } catch (e) {
    console.error("saveCustomerProfile error:", e);
    return getCustomerProfile();
  }
}

export function setLastOrder({ orderNumber = "", trackingToken = "", phone = "", fulfillmentType = "", total = null, createdAt = "" } = {}) {
  return saveCustomerProfile({ lastOrder: { orderNumber, trackingToken, phone, fulfillmentType, total, createdAt } });
}