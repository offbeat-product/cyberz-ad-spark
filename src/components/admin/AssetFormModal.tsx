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

const AssetFormModal = ({ open, onOpenChange, kind, initial, onSave }: Props) => {
  const [form, setForm] = useState<AssetFormValue>(initial ?? blank(kind));
  const fileRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);

  useEffect(() => {
    if (open) setForm(initial ?? blank(kind));
  }, [open, initial, kind]);

  useEffect(() => {
    const compute = () => {
      const el = stageRef.current?.parentElement;
      if (!el) return;
      setScale(el.clientWidth / CANVAS_W);
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (stageRef.current?.parentElement) ro.observe(stageRef.current.parentElement);
    return () => ro.disconnect();
  }, [open]);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((p) => ({ ...p, imageUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

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
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
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
    onSave(form);
    onOpenChange(false);
  };

  const title = kind === "frame" ? "フレーム" : "ロゴ";
  const editing = !!initial?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[900px] max-w-[95vw] h-[85vh] max-h-[800px] overflow-hidden p-0 sm:rounded-lg">
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
                    {(["x", "y", "w", "h"] as const).map((k) => (
                      <div key={k} className="space-y-1">
                        <span className="text-xs text-muted-foreground">
                          {k === "w" ? "幅" : k === "h" ? "高さ" : k.toUpperCase()} (px)
                        </span>
                        <Input
                          type="number"
                          value={form.position[k]}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              position: { ...form.position, [k]: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                    ))}
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

          <div className="flex h-full flex-col overflow-hidden bg-muted/20 p-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold">プレビュー</span>
              <span className="text-xs text-muted-foreground">1080×1350</span>
            </div>
            <div className="flex flex-1 items-center justify-center overflow-hidden">
              <div
                className="relative h-full max-h-full w-auto overflow-hidden rounded-lg border border-border bg-black"
                style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
              >
                <div
                  ref={stageRef}
                  className="absolute left-0 top-0 origin-top-left"
                  style={{
                    width: CANVAS_W,
                    height: CANVAS_H,
                    transform: `scale(${scale})`,
                  }}
                >
                  {form.imageUrl && (
                    <img
                      src={form.imageUrl}
                      alt="preview"
                      draggable={false}
                      onMouseDown={startDrag}
                      className="absolute cursor-move select-none object-contain"
                      style={{
                        left: form.position.x,
                        top: form.position.y,
                        width: form.position.w,
                        height: form.position.h,
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
              プレビュー上でドラッグして位置を調整できます
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssetFormModal;
