import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface InfoTooltipProps {
  title: string;
  formula?: string;
  description: string;
  interpretation?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  side?: "top" | "right" | "bottom" | "left";
}

export function InfoTooltip({
  title,
  formula,
  description,
  interpretation,
  className,
  size = "md",
  side = "top",
}: InfoTooltipProps) {
  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors p-0.5",
              className
            )}
            aria-label={`Information sur ${title}`}
          >
            <Info className={iconSizes[size]} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-xs p-4 space-y-2"
          sideOffset={5}
        >
          <p className="font-semibold text-foreground">{title}</p>
          
          {formula && (
            <div className="bg-muted rounded px-2 py-1 font-mono text-xs">
              {formula}
            </div>
          )}
          
          <p className="text-sm text-muted-foreground">{description}</p>
          
          {interpretation && (
            <p className="text-xs text-primary border-l-2 border-primary pl-2">
              💡 {interpretation}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Composant pour afficher un titre avec tooltip intégré
interface LabelWithInfoProps {
  label: string;
  tooltip: {
    title: string;
    formula?: string;
    description: string;
    interpretation?: string;
  };
  className?: string;
}

export function LabelWithInfo({ label, tooltip, className }: LabelWithInfoProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {label}
      <InfoTooltip {...tooltip} size="sm" />
    </span>
  );
}
