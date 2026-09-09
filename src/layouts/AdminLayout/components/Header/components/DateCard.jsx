import { Calendar } from "lucide-react";

function DateCard() {
  const now = new Date();

  const weekday = now.toLocaleDateString(
    "ar-EG-u-nu-latn",
    { weekday: "long" }
  );

  const date = now.toLocaleDateString(
    "ar-EG-u-nu-latn",
    { day: "numeric", month: "long", year: "numeric" }
  );

  return (
    <div className="date-card">
      <Calendar size={16} className="date-card__icon" />
      <div className="date-card__text">
        <span className="date-card__weekday">{weekday}</span>
        <span className="date-card__date">{date}</span>
      </div>
    </div>
  );
}

export default DateCard;
