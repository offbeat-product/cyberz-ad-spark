import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ChevronUp, ChevronDown, Trash2, Type } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { FrameData } from "@/contexts/CreateFlowContext";

const displayPresets = [1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0];
const transitionPresets = [0.2, 0.3, 0.5, 0.8, 1.0];
const transitionOptions = ["なし", "スライド左→右", "スライド上→下", "フェード", "ズームイン"];

const truncate = (s: string, max = 20) =>
  s.length > max ? `${s.slice(0, max - 1)}…` : s;

interface Props {
  frame: FrameData;
  index: number;
  total: number;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<FrameData>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

const SortableFrameCard = ({
  frame: f,
  index: idx,
  total,
  selected,
  onSelect,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onDelete,
}: Props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: f.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const displayName = f.name ? truncate(f.name) : `コマ ${idx + 1}`;
  const ts = f.textSettings;
  const showTextIndicator = !!(ts && ts.visible && ts.text && ts.text.trim() !== "");
  const textPreview = showTextIndicator ? truncate(ts!.text.trim(), 20) : "";

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        "rounded-lg border bg-card p-4 cursor-pointer transition-colors",
        selected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:border-muted-foreground/30",
      )}
    >
      <div className="flex gap-3">
        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          onClick={stop}
          className="flex items-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing self-start mt-1"
          aria-label="ドラッグして並び替え"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Thumbnail */}
        <div className="w-20 h-28 bg-muted rounded overflow-hidden flex items-center justify-center text-xs text-muted-foreground shrink-0">
          {f.image ? (
            <img src={f.image} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <>コマ{idx + 1}</>
          )}
        </div>

        <div className="flex-1 space-y-3 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-medium truncate" title={f.name ?? displayName}>
                {displayName}
              </span>
              {showTextIndicator && (
                <span
                  className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground truncate"
                  title={ts!.text}
                >
                  <Type className="h-3 w-3 shrink-0 text-primary" />
                  <span className="truncate">{textPreview}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              {idx > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    stop(e);
                    onMoveUp();
                  }}
                  className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground"
                  aria-label="上に移動"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
              )}
              {idx < total - 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    stop(e);
                    onMoveDown();
                  }}
                  className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground"
                  aria-label="下に移動"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  stop(e);
                  onDelete();
                }}
                className="h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/10 text-destructive"
                aria-label="このコマを削除"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">表示秒数</Label>
            <div className="flex flex-wrap gap-1">
              {displayPresets.map((p) => (
                <button
                  key={p}
                  onClick={(e) => {
                    stop(e);
                    onUpdate({ display: p });
                  }}
                  className={cn(
                    "px-2 py-0.5 text-xs rounded border",
                    f.display === p
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-muted",
                  )}
                >
                  {p}s
                </button>
              ))}
              <Input
                type="number"
                value={f.display}
                onChange={(e) => onUpdate({ display: Number(e.target.value) })}
                onClick={stop}
                className="h-6 w-16 text-xs"
                step="0.1"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">切り替え秒数</Label>
            <div className="flex flex-wrap gap-1">
              {transitionPresets.map((p) => (
                <button
                  key={p}
                  onClick={(e) => {
                    stop(e);
                    onUpdate({ transitionTime: p });
                  }}
                  className={cn(
                    "px-2 py-0.5 text-xs rounded border",
                    f.transitionTime === p
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-muted",
                  )}
                >
                  {p}s
                </button>
              ))}
              <Input
                type="number"
                value={f.transitionTime}
                onChange={(e) => onUpdate({ transitionTime: Number(e.target.value) })}
                onClick={stop}
                className="h-6 w-16 text-xs"
                step="0.1"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">トランジション</Label>
            <Select value={f.transition} onValueChange={(v) => onUpdate({ transition: v })}>
              <SelectTrigger className="h-8 text-xs" onClick={stop}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {transitionOptions.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SortableFrameCard;
