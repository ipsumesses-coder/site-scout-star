import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  label?: string;
  size?: "sm" | "default" | "lg";
}

export const ScoreBadge = ({ score, label, size = "default" }: ScoreBadgeProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "score-excellent";
    if (score >= 50) return "score-good"; 
    return "score-poor";
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    default: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2"
  };

  return (
    <Badge 
      className={cn(
        getScoreColor(score),
        sizeClasses[size],
        "font-semibold"
      )}
    >
      {label && `${label}: `}{score}
    </Badge>
  );
};