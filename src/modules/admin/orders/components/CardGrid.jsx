import { useNavigate } from "react-router-dom";
import "../styles/CardGrid.css";

const labels = { PENDING:"لم يتم التأكيد", CONFIRMED:"لم يتم التأكيد", PREPARING:"جاري التحضير", READY:"جاهز", ASSIGNED_TO_DELEGATE:"جاهز", OUT_FOR_DELIVERY:"جاهز", DELIVERED:"جاهز", COMPLETED:"جاهز", CANCELLED:"لم يتم التأكيد" };
export default function CardGrid({ cards = [], type }) {
  const navigate = useNavigate();
  const open = (card) => { if (card.isNew || !card.orderId) navigate(`/admin/orders/sales/${type}/${card.id}`); else navigate(`/admin/orders/busy/${type}/${card.orderId}`); };
  return <div className="card-grid">{cards.map((card) => <button type="button" key={`${type}-${card.id}`} className={`card-item ${card.orderId ? "card-item--busy" : ""}`} onClick={() => open(card)}><div className="card-item__number">{type === "online" ? (card.isNew ? "إنشاء طلب أونلاين" : card.orderNumber) : `طاولة ${card.id}`}</div><div className={`card-item__status ${card.orderId ? "card-item__status--busy" : ""}`}>{card.orderId ? (labels[card.status] || card.status) : "فارغة"}</div>{card.fulfillmentType && <small>{card.fulfillmentType === "DELIVERY" ? "توصيل" : "تيك أواي"}</small>}{card.channel === "CUSTOMER_WEB" && <small className="card-item__outside">من الخارج</small>}{card.orderId && <div className="card-item__order">{card.itemsCount || 0} منتج • {Number(card.total || 0).toFixed(2)} ج.م</div>}</button>)}</div>;
}
