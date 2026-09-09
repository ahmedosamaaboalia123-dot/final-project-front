import { MessageCircleMore, Star } from "lucide-react";

const reviews = [
  { name: "مريم أحمد", text: "القهوة ممتازة والخدمة سريعة جدًا.", rating: 5 },
  { name: "محمد علي", text: "المكان هادي والطلب وصل مضبوط.", rating: 5 },
  { name: "سارة محمود", text: "تجربة جميلة وهكررها أكيد.", rating: 4 },
];

export default function TableReviewsSection({ onMore, onAdd }) {
  return <section className="table-reviews-section"><div className="section-title-bar"><div><h2 className="section-title-text">التقييمات</h2><p>آراء ضيوف 404</p></div><MessageCircleMore/></div><div className="table-reviews-grid">{reviews.map((review) => <article key={review.name}><div className="review-stars">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"}/>)}</div><p>“{review.text}”</p><strong>{review.name}</strong></article>)}</div><div className="reviews-actions"><button onClick={onMore}>عرض المزيد</button><button className="reviews-primary" onClick={onAdd}>اترك تقييمك</button></div></section>;
}
