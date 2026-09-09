// Public facade for the real Orders API. Kept for imports outside this module.
export {
  closeAdminTable,
  createAdminOnlineOrder,
  createAdminTableOrder,
  getAdminOrder,
  getAdminOrders,
  getAdminOrderSummaries,
  getPrepOrders,
  handOverOrderToDelegate,
  payAdminOrder,
  updateAdminOrderItemStatus,
  updateAdminOrderStatus,
} from "./adminOrdersGateway";
