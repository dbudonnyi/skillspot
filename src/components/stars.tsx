import { Star } from "lucide-react";

export function Stars({
  value,
  size = "sm",
  showValue = true,
  count,
}: {
  value: number;
  size?: "sm" | "lg";
  showValue?: boolean;
  count?: number;
}) {
  const px = size === "lg" ? "size-5" : "size-3.5";
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`${px} ${
              value >= i - 0.5
                ? "fill-amber-400 text-amber-400"
                : value >= i - 1
                  ? "fill-amber-200 text-amber-400"
                  : "text-muted-foreground/40"
            }`}
          />
        ))}
      </span>
      {showValue && (
        <span className="text-xs font-medium text-muted-foreground">
          {value > 0 ? value.toFixed(1) : "new"}
          {count !== undefined && count > 0 && (
            <span className="ml-1">({count})</span>
          )}
        </span>
      )}
    </span>
  );
}
