import { ConciergeBell, Droplets, ReceiptText, SprayCan, UtensilsCrossed } from "lucide-react";

const services = [
  { type: "WAITER", title: "استدعاء الجرسون", text: "اطلب حضور الجرسون للطاولة", icon: ConciergeBell },
  { type: "BILL", title: "طلب الحساب", text: "اطلب تجهيز فاتورة الطاولة", icon: ReceiptText },
  { type: "UTENSILS", title: "أدوات إضافية", text: "مناديل أو أدوات للمائدة", icon: UtensilsCrossed },
  { type: "WATER", title: "مياه", text: "اطلب مياه للطاولة", icon: Droplets },
  { type: "CLEANING", title: "تنظيف الطاولة", text: "اطلب تنظيفًا سريعًا", icon: SprayCan },
];

export default function TableWaiterServicesGrid({ pendingType, onRequest }) {
  return <div className="waiter-services-grid">{services.map(({ type, title, text, icon: Icon }) => <button key={type} disabled={Boolean(pendingType)} onClick={() => onRequest(type, title)}><Icon/><strong>{pendingType === type ? "جاري الإرسال..." : title}</strong><span>{text}</span></button>)}</div>;
}
