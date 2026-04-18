import { useEffect, useRef, useState } from "react";
import ImageDropzone from "@/components/admin/ImageDropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Box } from "@/components/admin/MediaPreview";

const CANVAS_W = 1080;
const CANVAS_H = 1350;

export interface AssetFormValue {
  id?: string;
  name: string;
  imageUrl: string | null;
  position: Box;
  isDefault: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kind: "frame" | "logo";
  initial?: AssetFormValue | null;
  onSave: (value: AssetFormValue) => void;
  /** Default frame image to render behind logos in the preview (logo kind only). */
  defaultFrameUrl?: string | null;
}

const blank = (kind: "frame" | "logo"): AssetFormValue => ({
  name: "",
  imageUrl: null,
  position:
    kind === "frame"
      ? { x: 0, y: 0, w: 1080, h: 1350 }
      : { x: 40, y: 40, w: 200, h: 80 },
  isDefault: false,
});

const HISTORY_MAX = 20;

const AssetFormModal = ({ open, onOpenChange, kind, initial, onSave }: Props) => {
  const [form, setForm] = useState<AssetFormValue>(initial ?? blank(kind));
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);

  // Undo/redo history of position
  const [history, setHistory] = useState<Box[]>([]);
  const [future, setFuture] = useState<Box[]>([]);
  const lastCommittedRef = useRef<Box | null>(null);

  useEffect(() => {
    if (open) {
      const start = initial ?? blank(kind);
      setForm(start);
      setHistory([]);
      setFuture([]);
      lastCommittedRef.current = start.position;
    }
  }, [open, initial, kind]);

  // Recompute scale to fit canvas inside parent (both width and height)
  useEffect(() => {
    const compute = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      if (cw > 0 && ch > 0) {
        const sx = cw / Math.max(form.position.w, 1);
        const sy = ch / Math.max(form.position.h, 1);
        setScale(Math.min(sx, sy));
      }
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [open, form.position.w, form.position.h]);

  const commitPosition = (next: Box) => {
    const prev = lastCommittedRef.current;
    if (prev && (prev.x !== next.x || prev.y !== next.y || prev.w !== next.w || prev.h !== next.h)) {
      setHistory((h) => {
        const nh = [...h, prev];
        return nh.length > HISTORY_MAX ? nh.slice(nh.length - HISTORY_MAX) : nh;
      });
      setFuture([]);
    }
    lastCommittedRef.current = next;
  };

  const undo = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      const current = lastCommittedRef.current;
      if (current) setFuture((f) => [current, ...f].slice(0, HISTORY_MAX));
      lastCommittedRef.current = prev;
      setForm((p) => ({ ...p, position: prev }));
      return h.slice(0, -1);
    });
  };

  const redo = () => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      const current = lastCommittedRef.current;
      if (current) setHistory((h) => [...h, current].slice(-HISTORY_MAX));
      lastCommittedRef.current = next;
      setForm((p) => ({ ...p, position: next }));
      return f.slice(1);
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const sx = e.clientX;
    const sy = e.clientY;
    const orig = { ...form.position };
    const move = (ev: MouseEvent) => {
      const dx = (ev.clientX - sx) / scale;
      const dy = (ev.clientY - sy) / scale;
      setForm((p) => ({
        ...p,
        position: {
          ...orig,
          x: Math.round(orig.x + dx),
          y: Math.round(orig.y + dy),
        },
      }));
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      // Snapshot current position into history
      // Read latest position via setForm callback
      setForm((p) => {
        commitPosition(p.position);
        return p;
      });
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const updatePosField = (k: keyof Box, v: number) => {
    setForm((p) => {
      const next = { ...p.position, [k]: v };
      commitPosition(next);
      return { ...p, position: next };
    });
  };

  const MAX_W = 1080;
  const MAX_H = 1920;
  const fieldRange = (k: keyof Box): { min: number; max: number } => {
    if (k === "w") return { min: 1, max: MAX_W };
    if (k === "h") return { min: 1, max: MAX_H };
    return { min: -10000, max: 10000 };
  };
  const isFieldInvalid = (k: keyof Box) => {
    const { min, max } = fieldRange(k);
    const v = form.position[k];
    return !Number.isFinite(v) || v < min || v > max;
  };

  const submit = () => {
    if (!form.name.trim()) {
      toast.error("名前を入力してください");
      return;
    }
    if (!form.imageUrl) {
      toast.error("画像をアップロードしてください");
      return;
    }
    if (form.position.w < 1 || form.position.w > MAX_W) {
      toast.error(`幅は1〜${MAX_W}pxの範囲で入力してください`);
      return;
    }
    if (form.position.h < 1 || form.position.h > MAX_H) {
      toast.error(`高さは1〜${MAX_H}pxの範囲で入力してください`);
      return;
    }
    onSave(form);
    onOpenChange(false);
  };

  const title = kind === "frame" ? "フレーム" : "ロゴ";
  const editing = !!initial?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[900px] max-w-[95vw] h-[90vh] max-h-[90vh] overflow-hidden p-0 sm:rounded-lg">
        <div className="grid h-full grid-cols-2">
          <div className="flex h-full flex-col overflow-hidden border-r border-border">
            <div className="flex-1 overflow-y-auto p-6">
              <DialogHeader className="mb-4">
                <DialogTitle>
                  {title}を{editing ? "編集" : "追加"}
                </DialogTitle>
                <DialogDescription>
                  {title}画像と表示位置・サイズを設定します。
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>
                    名前 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={kind === "frame" ? "例：通常版" : "例：通常版・小サイズ"}
                  />
                </div>

                <div className="space-y-2">
                  <Label>画像</Label>
                  <ImageDropzone
                    value={form.imageUrl}
                    onChange={(url) => setForm((p) => ({ ...p, imageUrl: url }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>位置・サイズ</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["x", "y", "w", "h"] as const).map((k) => {
                      const { min, max } = fieldRange(k);
                      const invalid = isFieldInvalid(k);
                      return (
                        <div key={k} className="space-y-1">
                          <span className="text-xs text-muted-foreground">
                            {k === "w" ? "幅" : k === "h" ? "高さ" : k.toUpperCase()} (px)
                          </span>
                          <Input
                            type="number"
                            min={k === "w" || k === "h" ? min : undefined}
                            max={k === "w" || k === "h" ? max : undefined}
                            className={invalid ? "border-destructive focus-visible:ring-destructive" : ""}
                            value={form.position[k]}
                            onChange={(e) => {
                              let v = Number(e.target.value);
                              if (k === "w" || k === "h") {
                                if (v > max) v = max;
                              }
                              setForm((p) => ({
                                ...p,
                                position: { ...p.position, [k]: v },
                              }));
                            }}
                            onBlur={(e) => {
                              let v = Number(e.target.value);
                              if (k === "w" || k === "h") {
                                if (v > max) v = max;
                                if (v < min) v = min;
                              }
                              updatePosField(k, v);
                            }}
                          />
                          {invalid && (
                            <span className="text-[10px] text-destructive">
                              {min}〜{max}の範囲
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isDefault"
                    checked={form.isDefault}
                    onCheckedChange={(v) => setForm({ ...form, isDefault: !!v })}
                  />
                  <Label htmlFor="isDefault" className="cursor-pointer">
                    デフォルトに設定する
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-border bg-background px-6 py-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                キャンセル
              </Button>
              <Button onClick={submit}>{editing ? "更新" : "保存"}</Button>
            </DialogFooter>
          </div>

          <div className="flex h-full flex-col overflow-hidden bg-white p-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold">プレビュー</span>
              <span className="text-xs text-muted-foreground">
                {form.position.w}×{form.position.h}
              </span>
            </div>
            <div className="flex flex-1 justify-center overflow-hidden min-h-0">
              <div
                ref={canvasRef}
                className="relative overflow-hidden rounded-lg"
                style={{
                  aspectRatio: `${Math.max(form.position.w, 1)} / ${Math.max(form.position.h, 1)}`,
                  width: "100%",
                  maxHeight: "100%",
                  border: "1px solid #e0e0e0",
                  backgroundColor: "#f0f0f0",
                  alignSelf: "flex-start",
                }}
              >
                <div
                  ref={stageRef}
                  className="absolute left-0 top-0 origin-top-left"
                  style={{
                    width: Math.max(form.position.w, 1),
                    height: Math.max(form.position.h, 1),
                    transform: `scale(${scale})`,
                  }}
                >
                  {form.imageUrl && (
                    <img
                      src={form.imageUrl}
                      alt="preview"
                      draggable={false}
                      onMouseDown={startDrag}
                      className="absolute cursor-move select-none"
                      style={{
                        left: form.position.x,
                        top: form.position.y,
                        width: form.position.w,
                        height: form.position.h,
                        objectFit: "contain",
                        outline:
                          kind === "frame"
                            ? "2px dashed rgba(64,158,234,0.7)"
                            : "2px dashed rgba(239,159,39,0.8)",
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              ドラッグで位置調整 / ⌘Z で元に戻す・⌘⇧Z でやり直し
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssetFormModal;
