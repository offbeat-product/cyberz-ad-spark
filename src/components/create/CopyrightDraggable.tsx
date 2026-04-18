import { useEffect, useLayoutEffect, useRef } from "react";

interface Props {
  text: string;
  color: string;
  font: string;
  fontSize: number;
  /** Top-left position in canvas px */
  x: number;
  y: number;
  canvasW: number;
  canvasH: number;
  /** Display scale: displayedPx / canvasPx */
  scale: number;
  onSizeChange: (wCanvasPx: number, hCanvasPx: number) => void;
  onDragStart: () => void;
  onDrag: (xCanvasPx: number, yCanvasPx: number) => void;
}

/**
 * Renders the copyright as an absolutely-positioned element inside the
 * canvas, using canvas-px coordinates. Dragging updates px positions
 * while clamping happens in the parent based on measured element size.
 */
const CopyrightDraggable = ({
  text,
  color,
  font,
  fontSize,
  x,
  y,
  canvasW,
  canvasH,
  scale,
  onSizeChange,
  onDragStart,
  onDrag,
}: Props) => {
  const ref = useRef<HTMLDivElement>(null);

  // Report measured size in canvas px whenever font/text changes.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Convert displayed px back to canvas px
    const w = scale > 0 ? rect.width / scale : rect.width;
    const h = scale > 0 ? rect.height / scale : rect.height;
    onSizeChange(w, h);
  }, [text, font, fontSize, scale, onSizeChange]);

  // Also react to runtime size changes (e.g. font load)
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (!r) return;
      const w = scale > 0 ? r.width / scale : r.width;
      const h = scale > 0 ? r.height / scale : r.height;
      onSizeChange(w, h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [scale, onSizeChange]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const stageEl = e.currentTarget.parentElement;
    if (!stageEl) return;
    const stageRect = stageEl.getBoundingClientRect();
    // displayed px per canvas px
    const sx = stageRect.width / canvasW;
    const sy = stageRect.height / canvasH;
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startX = x;
    const startY = y;
    onDragStart();
    (e.target as Element).setPointerCapture?.(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startClientX) / sx;
      const dy = (ev.clientY - startClientY) / sy;
      onDrag(startX + dx, startY + dy);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      className="absolute select-none cursor-grab active:cursor-grabbing whitespace-nowrap"
      style={{
        left: x,
        top: y,
        color,
        fontFamily: font,
        fontSize,
        textShadow: "0 1px 2px rgba(0,0,0,0.6)",
        touchAction: "none",
      }}
    >
      {text}
    </div>
  );
};

export default CopyrightDraggable;
