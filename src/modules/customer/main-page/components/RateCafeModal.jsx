import React, { useState } from "react";
import { X, Star, Heart } from "lucide-react";

export default function RateCafeModal({ isOpen, onClose, onSubmitReview }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    if (onSubmitReview) {
      onSubmitReview({
        id: `rev_${Date.now()}`,
        name: name.trim() || "عميل مميز",
        initial: (name.trim() || "ع")[0],
        date: "الآن",
        rating,
        comment: comment.trim(),
      });
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setName("");
      setComment("");
      setRating(5);
      onClose();
    }, 1200);
  };

  return (
    <div className="customer-modal-backdrop" onClick={onClose}>
      <div
        className="customer-modal-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-sheet-header">
          <div className="modal-handle-bar" />
          <div className="modal-title-row">
            <h3 className="modal-title">تقييم الكافيه</h3>
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              aria-label="إغلاق"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="modal-sheet-body">
          {submitted ? (
            <div className="review-success-state">
              <div className="heart-icon-wrapper">
                <Heart size={44} className="heart-icon" />
              </div>
              <h4>شكراً لمشاركتك رأيك!</h4>
              <p>رأيك يهمنا دائماً ويساعدنا على تقديم أفضل تجربة في 404 كافيه.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rate-cafe-form">
              <p className="rate-intro-text">
                كيف كانت تجربتك معنا في 404 Coffee؟
              </p>

              {/* Star selector */}
              <div className="rating-stars-interactive">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="star-rate-btn"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    <Star
                      size={32}
                      className={`star-svg ${
                        (hoverRating || rating) >= star ? "filled" : "empty"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="form-field-group">
                <label className="field-label">اسمك (اختياري)</label>
                <input
                  type="text"
                  className="customer-text-input"
                  placeholder="مثال: أحمد محمد"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-field-group">
                <label className="field-label">رأيك بالتفصيل</label>
                <textarea
                  rows={4}
                  className="customer-textarea-input"
                  placeholder="أخبرنا عن جودة القهوة، الخدمة، أو الجو العام..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="submit-review-btn"
                disabled={!comment.trim()}
              >
                إرسال التقييم
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
