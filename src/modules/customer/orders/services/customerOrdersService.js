const STORAGE_KEY = "404_customer_orders_v2";

/**
 * Get all customer orders from localStorage.
 * No fake/demo seed data: an empty list is returned until a real order is saved.
 * Never clears client-side order data and never re-seeds demo orders.
 */
export function getCustomerOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error("Error reading customer orders:", err);
    return [];
  }
}

/**
 * Get single order by ID
 */
export function getCustomerOrderById(orderId) {
  const orders = getCustomerOrders();
  return (
    orders.find(
      (o) =>
        String(o.id).toLowerCase() === String(orderId).toLowerCase() ||
        String(o.orderNumber).toLowerCase() === String(orderId).toLowerCase()
    ) || null
  );
}

/**
 * Add a new order from cart / checkout
 */
export function saveCustomerOrder({
  items = [],
  customerInfo = {},
  paymentMethod = "cash",
  orderType = "online_pickup",
  branch = "فرع إيتاي البارود - البحيرة (شارع الجمهورية)",
}) {
  const currentOrders = getCustomerOrders();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderId = `ORD-404-${randomSuffix}`;
  const now = new Date();
  
  // Format Arabic Time
  const timeFormatter = new Intl.DateTimeFormat("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const dateFormatted = `اليوم، ${timeFormatter.format(now)}`;
  const timeNowStr = timeFormatter.format(now);

  const subtotal = items.reduce(
    (sum, it) => sum + (it.unitPrice || it.price || 0) * (it.quantity || 1),
    0
  );
  const deliveryFee = orderType === "delivery" ? 15 : 0;
  const serviceFee = 10;
  const vat = +(subtotal * 0.14).toFixed(2);
  const discount = 0;
  const total = +(subtotal + deliveryFee + serviceFee + vat - discount).toFixed(2);

  const newOrder = {
    id: orderId,
    orderNumber: String(randomSuffix),
    createdAt: now.toISOString(),
    dateFormatted,
    status: "in_progress",
    statusText: "جاري العمل عليه",
    statusStep: 2, // 1: تأكيد الطلب, 2: جاري العمل عليه, 3: تم الانتهاء, 4: تم التسليم
    orderType: orderType || "online_pickup",
    orderTypeText:
      orderType === "delivery"
        ? "توصيل للمنزل"
        : orderType === "takeaway"
        ? "تيك أواي (Takeaway)"
        : "أونلاين - استلام من الفرع",
    branch: branch || "فرع إيتاي البارود - البحيرة (شارع الجمهورية)",
    paymentMethod: paymentMethod || "cash",
    paymentMethodText:
      paymentMethod === "visa"
        ? "بطاقة بنكية (فيزا / ماستركارد)"
        : paymentMethod === "vodafone_cash"
        ? "محفظة إلكترونية (فودافون كاش)"
        : "الدفع عند الاستلام (كاش)",
    paymentStatus: paymentMethod === "cash" ? "pending" : "paid",
    paymentStatusText:
      paymentMethod === "cash" ? "قيد التحصيل عند الاستلام" : "مدفوع بالكامل",
    estimatedTime: "10-15 دقيقة",
    timeline: [
      {
        id: 1,
        title: "تأكيد الطلب",
        subtitle: "تم استلام الطلب وتأكيده بنجاح من النظام",
        time: timeNowStr,
        completed: true,
        active: false,
      },
      {
        id: 2,
        title: "جاري العمل عليه",
        subtitle: "الباريستا يقوم بتحضير القهوة والطلبات حالياً",
        time: timeNowStr,
        completed: false,
        active: true,
      },
      {
        id: 3,
        title: "تم الانتهاء",
        subtitle: "الطلب جاهز للاستلام والتسليم على الكاونتر",
        time: "متوقع قريباً",
        completed: false,
        active: false,
      },
      {
        id: 4,
        title: "تم التسليم",
        subtitle: "تم تسليم الطلب بالكامل للعميل",
        time: "--",
        completed: false,
        active: false,
      },
    ],
    customerInfo: {
      name: customerInfo.name || "عميل 404 كافيه",
      phone: customerInfo.phone || "01098765432",
      address:
        customerInfo.address ||
        (orderType === "delivery" ? "عنوان التوصيل" : "استلام من الفرع"),
      notes: customerInfo.notes || "",
    },
    items: items.map((it, idx) => ({
      id: it.id || `item-${idx}`,
      name: it.name,
      englishName: it.englishName || "",
      image:
        it.image ||
        "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=300&auto=format&fit=crop&q=80",
      price: it.price || 50,
      quantity: it.quantity || 1,
      isReady: idx === 0 && items.length > 1 ? true : false, // First item ready if multiple items
      readyTime: idx === 0 && items.length > 1 ? timeNowStr : null,
      customizations: it.customizations || {
        size: it.size || "عادي",
        sugar: it.sugar || "مضبوط",
        milk: it.milk || "عادي",
        addons: it.addons || [],
        notes: it.notes || "",
      },
      unitPrice: it.unitPrice || it.price || 50,
      totalPrice: (it.unitPrice || it.price || 50) * (it.quantity || 1),
    })),
    pricing: {
      subtotal,
      deliveryFee,
      serviceFee,
      vat,
      discount,
      total,
    },
  };

  const updatedOrders = [newOrder, ...currentOrders];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
  } catch (e) {
    console.error("Error saving new order:", e);
  }

  return newOrder;
}

/**
 * Persist a REAL backend order (created via the public API) into the same
 * local list so "My Orders / Tracking" can reflect actual server orders.
 * Old demo/local orders are preserved and never deleted.
 */
export function saveBackendOrder({ orderNumber = "", trackingToken = "", phone = "", name = "", fulfillmentType = "", total = 0, status = "PENDING", statusText = "بانتظار التأكيد", items = [] }) {
  const currentOrders = getCustomerOrders();
  const dedup = currentOrders.filter(
    (o) => String(o.orderNumber || o.id || "").toLowerCase() !== String(orderNumber).toLowerCase()
  );
  const now = new Date();
  const timeFormatter = new Intl.DateTimeFormat("ar-EG", { hour: "2-digit", minute: "2-digit", hour12: true });

  const newOrder = {
    id: String(orderNumber),
    orderNumber: String(orderNumber),
    backend: true,
    trackingToken,
    createdAt: now.toISOString(),
    dateFormatted: `اليوم، ${timeFormatter.format(now)}`,
    status,
    statusText,
    statusStep: status === "PENDING" ? 1 : 2,
    orderType: fulfillmentType === "DELIVERY" ? "delivery" : "online_pickup",
    orderTypeText: fulfillmentType === "DELIVERY" ? "توصيل للمنزل" : "تيك أواي (استلام من الفرع)",
    branch: "فرع إيتاي البارود - البحيرة (شارع الجمهورية)",
    paymentMethod: "cash",
    paymentStatus: "pending",
    customerInfo: { name: name || "عميل 404 كافيه", phone: phone || "" },
    items: (Array.isArray(items) ? items : []).map((it, idx) => ({
      id: it.id || `item-${idx}`,
      name: it.name || it.product?.name || `منتج ${idx + 1}`,
      quantity: it.quantity || 1,
      unitPrice: it.unitPrice || 0,
      totalPrice: it.totalPrice || 0,
      isReady: false,
    })),
    pricing: { subtotal: Number(total) || 0, deliveryFee: 0, serviceFee: 0, vat: 0, discount: 0, total: Number(total) || 0 },
  };

  const updatedOrders = [newOrder, ...dedup];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
  } catch (e) {
    console.error("Error saving backend order:", e);
  }
  return newOrder;
}

/**
 * Toggle item readiness status (optional demo helper)
 */
export function toggleItemReadiness(orderId, itemId) {
  const currentOrders = getCustomerOrders();
  const updated = currentOrders.map((ord) => {
    if (ord.id === orderId || ord.orderNumber === orderId) {
      const updatedItems = ord.items.map((it) => {
        if (it.id === itemId) {
          const newReady = !it.isReady;
          return {
            ...it,
            isReady: newReady,
            readyTime: newReady
              ? new Intl.DateTimeFormat("ar-EG", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                }).format(new Date())
              : null,
          };
        }
        return it;
      });

      const allReady = updatedItems.every((it) => it.isReady);
      const someReady = updatedItems.some((it) => it.isReady);

      let newStatus = ord.status;
      let newStatusText = ord.statusText;
      let newStep = ord.statusStep;

      if (allReady && ord.status !== "completed") {
        newStatus = "ready";
        newStatusText = "تم الانتهاء (جاهز للاستلام)";
        newStep = 3;
      } else if (someReady && ord.status !== "completed") {
        newStatus = "in_progress";
        newStatusText = "جاري العمل عليه";
        newStep = 2;
      }

      return {
        ...ord,
        items: updatedItems,
        status: newStatus,
        statusText: newStatusText,
        statusStep: newStep,
      };
    }
    return ord;
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
  } catch (e) {
    console.error("Error updating item readiness:", e);
  }

  return updated.find((o) => o.id === orderId || o.orderNumber === orderId) || null;
}
