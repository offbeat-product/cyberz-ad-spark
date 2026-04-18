import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  current: number; // 0-indexed
}

const StepIndicator = ({ steps, current }: StepIndicatorProps) => {
  return (
    <ol className="flex items-center w-full max-w-2xl">
      {steps.map((step, idx) => {
        const isDone = idx < current;
        const isActive = idx === current;
        return (
          <li key={step.label} className={cn("flex items-center", idx !== steps.length - 1 && "flex-1")}>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium border",
                  isDone && "bg-primary text-primary-foreground border-primary",
                  isActive && "bg-primary text-primary-foreground border-primary",
                  !isDone && !isActive && "bg-background text-muted-foreground border-border",
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : idx + 1}
              </div>
              <span
                className={cn(
                  "text-sm font-medium whitespace-nowrap",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {idx !== steps.length - 1 && (
              <div className={cn("h-px flex-1 mx-4", isDone ? "bg-primary" : "bg-border")} />
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default StepIndicator;
