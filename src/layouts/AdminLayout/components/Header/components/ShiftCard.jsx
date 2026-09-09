import { Clock } from "lucide-react";

function ShiftCard({ shift }) {
  return (
    <div className="shift-card">
      <Clock size={16} className="shift-card__icon" />
      <div className="shift-card__text">
        <strong>{shift?.name}</strong>
        <span>
          {shift?.start_time}
          -
          {shift?.end_time}
        </span>
      </div>
    </div>
  );
}

export default ShiftCard;
