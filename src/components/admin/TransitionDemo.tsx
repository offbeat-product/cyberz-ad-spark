import { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Transition = "none" | "slide-lr" | "slide-tb" | "fade" | "zoom-in";

interface Props {
  transition: Transition;
  compact?: boolean;
}

const TransitionDemo = ({ transition, compact }: Props) => {
  const [key, setKey] = useState(0);
  const [playing, setPlaying] = useState(false);

  const play = () => {
    setPlaying(true);
    setKey((k) => k + 1);
    setTimeout(() => setPlaying(false), 1100);
  };

  const cls = (() => {
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
    <div className={compact ? "inline-flex items-center gap-2" : "space-y-2"}>
      <Button type="button" size="sm" variant="outline" onClick={play}>
        <Play className="h-3 w-3" /> プレビュー
      </Button>
      <style>{`
        @keyframes slideInLR { from { transform: translateX(-100%);} to { transform: translateX(0);} }
        @keyframes slideInTB { from { transform: translateY(-100%);} to { transform: translateY(0);} }
        @keyframes fadeDemo { from { opacity: 0;} to { opacity: 1;} }
        @keyframes zoomDemo { from { transform: scale(0.4); opacity: 0;} to { transform: scale(1); opacity: 1;} }
      `}</style>
      {!compact && (
        <div className="relative h-32 w-full overflow-hidden rounded-md border border-border bg-muted/30">
          <div
            className="absolute inset-4"
            style={{ background: "rgba(120,120,120,0.6)" }}
          />
          {playing && (
            <div
              key={key}
              className={`absolute inset-4 ${cls}`}
              style={{ background: "rgba(60,60,60,0.95)" }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default TransitionDemo;
