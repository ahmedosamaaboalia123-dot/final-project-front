import { useState } from "react";
import { ArrowRight, MessageSquarePlus, Star, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CustomerHeader from "../../main-page/components/CustomerHeader";
import CustomerNavDrawer from "../../main-page/components/CustomerNavDrawer";
import CustomerFooter from "../../main-page/components/CustomerFooter";
import { MAIN_PAGE_DATA } from "../../main-page/data/mainPageData";
import "../styles/CustomerFeedbackPage.css";
import "../../main-page/styles/CustomerMainPage.css";

export default function CustomerFeedbackPage() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const navigateTo = (action) => {
    setDrawerOpen(false);
    if (action === "home") navigate("/");
    if (action === "menu") navigate("/menu");
    if (action === "orders") navigate("/customer/orders");
    if (action === "chatbot") navigate("/customer/chatbot");
    if (action === "offers") navigate("/#offers-anchor");
    if (action === "rate") setFormOpen(true);
  };
  return <div className="feedback-page" dir="rtl">
    <CustomerHeader cartCount={0} onOpenMenu={() => setDrawerOpen(true)} onOpenCart={() => navigate("/menu")} onNavigateSection={navigateTo}/>
    <main className="feedback-shell">
      <header className="feedback-hero">
        <button type="button" onClick={() => navigate(-1)}><ArrowRight size={18}/>رجوع</button>
        <div><span>تجارب حقيقية من عملائنا</span><h1>آراء وتقييمات 404</h1><p>كل رأي يساعدنا نقدم قهوة وتجربة أحسن في كل مرة.</p></div>
        <button type="button" className="feedback-add" onClick={() => setFormOpen(true)}><MessageSquarePlus size={18}/>اترك تقييمك</button>
      </header>
      <section className="feedback-summary"><strong>4.9</strong><div><div className="feedback-stars">{[1,2,3,4,5].map((n)=><Star key={n} size={18} fill="currentColor"/>)}</div><span>بناءً على تقييمات زوار 404</span></div></section>
      <section className="feedback-grid">
        {[...MAIN_PAGE_DATA.reviews, ...MAIN_PAGE_DATA.reviews].map((review, index) => <article key={`${review.id}-${index}`}>
          <div className="feedback-card-head"><span className="feedback-avatar">{review.initial}</span><div><strong>{review.name}</strong><small>{review.date}</small></div><div className="feedback-stars">{[1,2,3,4,5].map((n)=><Star key={n} size={14} fill={n<=review.rating?"currentColor":"none"}/>)}</div></div>
          <p>{review.comment}</p>
        </article>)}
      </section>
    </main>
    <CustomerFooter footerData={MAIN_PAGE_DATA.footer}/>
    <CustomerNavDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} onNavigate={navigateTo}/>
    {formOpen && <div className="feedback-modal-backdrop" onClick={() => setFormOpen(false)}><section className="feedback-modal" onClick={(e)=>e.stopPropagation()}>
      <button className="feedback-modal-close" onClick={() => setFormOpen(false)}><X size={18}/></button><span>شاركنا تجربتك</span><h2>اترك تقييمك</h2>
      <div className="feedback-rating-picker">{[1,2,3,4,5].map((n)=><button key={n} onClick={()=>setRating(n)}><Star size={25} fill={n<=rating?"currentColor":"none"}/></button>)}</div>
      <label>الاسم<input placeholder="اكتب اسمك"/></label><label>رأيك<textarea rows="4" placeholder="احكيلنا عن تجربتك مع 404..."/></label>
      <button className="feedback-submit" onClick={() => setFormOpen(false)}>إرسال التقييم</button>
    </section></div>}
  </div>;
}
