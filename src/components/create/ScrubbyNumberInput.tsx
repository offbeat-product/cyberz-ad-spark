import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ScrubbyNumberInputProps {
  label: string;
  value: number;
  onChange: (value: number, meta?: { source: "scrub" | "input" }) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  className?: string;
}

/**
 * Adobe-style scrubby number input.
 * Drag the label horizontally to change the value.
 * - Shift: x10 speed
 * - Alt: x0.1 speed
 */
const ScrubbyNumberInput = ({
  label,
  value,
  onChange,
  onDragStart,
  onDragEnd,
  min = -500,
  max = 500,
  step = 1,
  unit = "px",
  className,
}: ScrubbyNumberInputProps) => {
  const startValueRef = useRef(value);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const startClientX = e.clientX;
    startValueRef.current = value;
    onDragStart?.();
    document.body.style.cursor = "ew-resize";
    (e.target as Element).setPointerCapture?.(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startClientX;
      const speed = ev.shiftKey ? 10 : ev.altKey ? 0.1 : 1;
      const delta = Math.round(dx * speed * step);
      const next = Math.max(min, Math.min(max, startValueRef.current + delta));
      onChange(next, { source: "scrub" });
    };
    const onUp = () => {
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      onDragEnd?.();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div className={cn("space-y-1", className)}>
      <Label
        className="text-[10px] text-muted-foreground select-none cursor-ew-resize hover:text-primary transition-colors"
        onPointerDown={handlePointerDown}
      >
        {label} {unit && `(${unit})`} ⇔
      </Label>
      <Input
        type="number"
        value={Math.round(value)}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isNaN(n)) return;
          onChange(Math.max(min, Math.min(max, n)), { source: "input" });
        }}
      />
    </div>
  );
};

export default ScrubbyNumberInput;
