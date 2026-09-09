import { useEffect, useState } from "react";
import { getCustomerOrders } from "../services/customerOrdersService";
import { listMyOrdersByPhone } from "../../checkout/services/orderGateway";
import { getCustomerProfile } from "../../checkout/services/checkoutCustomerService";
import { getOrdersByTableNumber } from "../../../table/services/tableOrdersService";
import { getActiveTableOrder } from "../../../table/services/tableGateway";

export function useCustomerOrders({ tableMode, tableNumber }) {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    if (tableMode) {
      const local = getOrdersByTableNumber(tableNumber);
      setOrders(local);
      const token = sessionStorage.getItem(`404_table_token_${tableNumber}`) || "";
      getActiveTableOrder(tableNumber, token).then((remote) => {
        if (remote) setOrders((current) => [remote, ...current.filter((item) => item.id !== remote.id)]);
      }).catch(() => {});
      return undefined;
    }
    const profile = getCustomerProfile();
    setOrders(getCustomerOrders());
    if (!profile.phone) return undefined;
    const load = () => listMyOrdersByPhone(profile.phone).then((remote) => {
      if (!remote.length) return;
      setOrders((current) => [...remote, ...current.filter((local) => !remote.some((item) => String(item.orderNumber) === String(local.orderNumber)))]);
    }).catch(() => {});
    load();
    const timer = window.setInterval(load, 30_000);
    return () => window.clearInterval(timer);
  }, [tableMode, tableNumber]);
  return orders;
}
