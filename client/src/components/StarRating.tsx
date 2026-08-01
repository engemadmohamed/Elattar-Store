import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
}

export default function StarRating({ value, onChange, size = 18, readOnly = false }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-0.5">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={readOnly ? "cursor-default" : "cursor-pointer"}
          aria-label={`${star} نجوم`}
        >
          <Star
            width={size}
            height={size}
            className={star <= Math.round(value) ? "fill-foreground text-foreground" : "fill-none text-muted-foreground/30"}
          />
        </button>
      ))}
    </div>
  );
}
