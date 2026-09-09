import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Star } from "lucide-react";
import RateCafeModal from "@/modules/customer/main-page/components/RateCafeModal";
import { useState } from "react";
import "../../styles/TableExperience.css";

const reviews = ["القهوة ممتازة والخدمة كانت سريعة.", "تجربة هادئة وطلبنا وصل كامل.", "التصميم جميل والأكل طازج.", "الجرسون متعاون جدًا.", "أفضل سبانش لاتيه جربته.", "هنكرر الزيارة قريبًا."];
export default function TableFeedbackPage() { const navigate = useNavigate(); const { tableId } = useParams(); const [open, setOpen] = useState(false); return <div className="table-experience-page" dir="rtl"><header><button onClick={() => navigate(`/table/${tableId}`)}><ArrowRight/>الرئيسية</button><div><span>404 COFFEE</span><strong>آراء ضيوفنا</strong></div><button className="primary" onClick={() => setOpen(true)}>اترك تقييمك</button></header><main><div className="experience-hero"><span>تقييمات حقيقية</span><h1>رأيك يصنع تجربة أفضل</h1><p>شاهد آراء ضيوف 404 وشاركنا تجربتك.</p></div><div className="feedback-cards">{reviews.map((text, i) => <article key={text}><div>{Array.from({ length: 5 }).map((_, n) => <Star key={n} size={15} fill="currentColor"/>)}</div><p>“{text}”</p><strong>{["مريم أحمد","محمد علي","سارة محمود","أحمد خالد","نور حسن","ياسمين عمرو"][i]}</strong></article>)}</div></main><RateCafeModal isOpen={open} onClose={() => setOpen(false)} onSubmitRating={() => setOpen(false)}/></div>; }
