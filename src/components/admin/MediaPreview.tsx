import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Transition = "none" | "slide-lr" | "slide-tb" | "fade" | "zoom-in";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Props {
  frameImage: string | null;
  logoImage: string | null;
  framePos: Box;
  logoPos: Box;
  frameVisible: boolean;
  logoVisible: boolean;
  bgColor: string;
  transition: Transition;
  onFramePosChange: (b: Box) => void;
  onLogoPosChange: (b: Box) => void;
}

const CANVAS_W = 1080;
const CANVAS_H = 1350;

const MediaPreview = ({
  frameImage,
  logoImage,
  framePos,
  logoPos,
  frameVisible,
  logoVisible,
  bgColor,
  transition,
  onFramePosChange,
  onLogoPosChange,
}: Props) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);
  const [demoKey, setDemoKey] = useState(0);
  const [demoPlaying, setDemoPlaying] = useState(false);

  useEffect(() => {
    const compute = () => {
      const el = stageRef.current?.parentElement;
      if (!el) return;
      const w = el.clientWidth;
      setScale(w / CANVAS_W);
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (stageRef.current?.parentElement) ro.observe(stageRef.current.parentElement);
    return () => ro.disconnect();
  }, []);

  const startDrag = (
    e: React.MouseEvent,
    pos: Box,
    onChange: (b: Box) => void,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const orig = { ...pos };
    const move = (ev: MouseEvent) => {
      const dx = (ev.clientX - startX) / scale;
      const dy = (ev.clientY - startY) / scale;
      onChange({
        ...orig,
        x: Math.round(orig.x + dx),
        y: Math.round(orig.y + dy),
      });
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const playDemo = () => {
    setDemoPlaying(true);
    setDemoKey((k) => k + 1);
    setTimeout(() => setDemoPlaying(false), 1200);
  };

  const transitionClass = (() => {
    switch (transition) {
      case "slide-lr":
        return "animate-[slideInLR_0.8s_ease-out]";
      case "slide-tb":
        return "animate-[slideInTB_0.8s_ease-out]";
      case "fade":
        return "animate-[fadeDemo_0.8s_ease-out]";
      case "zoom-in":
        return "animate-[zoomDemo_0.8s_ease-out]";
      default:
        return "";
    }
  })();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">プレビュー</span>
        <Button type="button" size="sm" variant="outline" onClick={playDemo}>
          <Play className="h-3 w-3" /> トランジション再生
        </Button>
      </div>
      <style>{`
        @keyframes slideInLR { from { transform: translateX(-100%);} to { transform: translateX(0);} }
        @keyframes slideInTB { from { transform: translateY(-100%);} to { transform: translateY(0);} }
        @keyframes fadeDemo { from { opacity: 0;} to { opacity: 1;} }
        @keyframes zoomDemo { from { transform: scale(0.4); opacity: 0;} to { transform: scale(1); opacity: 1;} }
      `}</style>
      <div
        className="relative w-full overflow-hidden rounded-lg border border-border"
        style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
      >
        <div
          ref={stageRef}
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: CANVAS_W,
            height: CANVAS_H,
            transform: `scale(${scale})`,
            backgroundColor: bgColor,
          }}
        >
          {/* Frame */}
          {frameVisible && frameImage && (
            <img
              src={frameImage}
              alt="frame"
              draggable={false}
              onMouseDown={(e) => startDrag(e, framePos, onFramePosChange)}
              className="absolute cursor-move select-none object-contain"
              style={{
                left: framePos.x,
                top: framePos.y,
                width: framePos.w,
                height: framePos.h,
                outline: "2px dashed rgba(64,158,234,0.7)",
              }}
            />
          )}
          {/* Logo */}
          {logoVisible && logoImage && (
            <img
              src={logoImage}
              alt="logo"
              draggable={false}
              onMouseDown={(e) => startDrag(e, logoPos, onLogoPosChange)}
              className="absolute cursor-move select-none object-contain"
              style={{
                left: logoPos.x,
                top: logoPos.y,
                width: logoPos.w,
                height: logoPos.h,
                outline: "2px dashed rgba(239,159,39,0.8)",
              }}
            />
          )}

          {/* Demo rectangles */}
          {demoPlaying && (
            <div key={demoKey} className="absolute inset-0">
              <div
                className="absolute"
                style={{
                  left: CANVAS_W * 0.15,
                  top: CANVAS_H * 0.2,
                  width: CANVAS_W * 0.7,
                  height: CANVAS_H * 0.6,
                  background: "rgba(120,120,120,0.85)",
                }}
              />
              <div
                className={`absolute ${transitionClass}`}
                style={{
                  left: CANVAS_W * 0.15,
                  top: CANVAS_H * 0.2,
                  width: CANVAS_W * 0.7,
                  height: CANVAS_H * 0.6,
                  background: "rgba(60,60,60,0.95)",
                }}
              />
            </div>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        プレビュー上でフレーム・ロゴをドラッグして位置を調整できます（1080×1350）
      </p>
    </div>
  );
};

export default MediaPreview;
