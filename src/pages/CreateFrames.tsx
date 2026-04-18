import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, AlignLeft, AlignCenter, Upload, CheckCircle2 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableFrameCard from "@/components/create/SortableFrameCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PageHeader from "@/components/PageHeader";
import StepIndicator from "@/components/StepIndicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateFlow, FrameData } from "@/contexts/CreateFlowContext";
import { useMediaMasters } from "@/hooks/useMediaMasters";
import type { Transition } from "@/components/admin/MediaPreview";
import { toast } from "sonner";

const steps = [{ label: "基本設定" }, { label: "コマ設定" }, { label: "書き出し" }];

const displayPresets = [1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0];
const transitionPresets = [0.2, 0.3, 0.5, 0.8, 1.0];
const transitionOptions = ["なし", "スライド左→右", "スライド上→下", "フェード", "ズームイン"];
const blendModes = ["通常", "乗算", "スクリーン", "オーバーレイ"];
const fontOptions = ["Noto Sans JP", "Noto Serif JP", "M PLUS Rounded 1c", "Yusei Magic"];

const transitionKeyToLabel: Record<Transition, string> = {
  "none": "なし",
  "slide-lr": "スライド左→右",
  "slide-tb": "スライド上→下",
  "fade": "フェード",
  "zoom-in": "ズームイン",
};

const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

const gridPositions = [
  { label: "左上", x: 10, y: 10 },
  { label: "上", x: 50, y: 10 },
  { label: "右上", x: 90, y: 10 },
  { label: "左", x: 10, y: 50 },
  { label: "中央", x: 50, y: 50 },
  { label: "右", x: 90, y: 50 },
  { label: "左下", x: 10, y: 90 },
  { label: "下", x: 50, y: 90 },
  { label: "右下", x: 90, y: 90 },
];

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

const CreateFrames = () => {
  const navigate = useNavigate();
  const { basic, frames, setFrames, textSettings, setTextSettings } = useCreateFlow();
  const { media } = useMediaMasters();
  const [selectedId, setSelectedId] = useState<string>(frames[0]?.id ?? "");

  // Resolve defaults from the selected media master (basic.media holds the name)
  const selectedMaster = media.find((m) => m.name === basic.media);
  const mediaDefaults = {
    display: selectedMaster?.displaySec ?? 2.0,
    transitionTime: selectedMaster?.switchSec ?? 0.3,
    transition: selectedMaster ? transitionKeyToLabel[selectedMaster.transition] : "フェード",
  };

  // Bulk upload state
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [uploadDone, setUploadDone] = useState(0);
  const [completedCount, setCompletedCount] = useState<number | null>(null);

  // Text settings shortcuts from context
  const {
    vertical, text, pos, font, fontSize, color, blend,
    strokeColor, strokeWidth, bgEnabled, bgColor, bgOpacity,
  } = textSettings;
  const patchText = (patch: Partial<typeof textSettings>) =>
    setTextSettings((p) => ({ ...p, ...patch }));

  useEffect(() => {
    if (!selectedId && frames[0]) setSelectedId(frames[0].id);
  }, [frames, selectedId]);

  const updateFrame = (id: string, patch: Partial<FrameData>) => {
    setFrames((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const addFrame = () => {
    const id = `f${Date.now()}`;
    setFrames((prev) => [
      ...prev,
      {
        id,
        display: mediaDefaults.display,
        transitionTime: mediaDefaults.transitionTime,
        transition: mediaDefaults.transition,
        image: null,
      },
    ]);
    setSelectedId(id);
  };

  // Reorder / delete handlers
  const moveFrame = (from: number, to: number) => {
    if (to < 0 || to >= frames.length) return;
    setFrames((prev) => arrayMove(prev, from, to));
  };

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const requestDelete = (id: string) => setPendingDeleteId(id);
  const confirmDelete = () => {
    if (!pendingDeleteId) return;
    setFrames((prev) => prev.filter((f) => f.id !== pendingDeleteId));
    if (selectedId === pendingDeleteId) {
      const remaining = frames.filter((f) => f.id !== pendingDeleteId);
      setSelectedId(remaining[0]?.id ?? "");
    }
    setPendingDeleteId(null);
  };

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFrames((prev) => {
      const oldIndex = prev.findIndex((f) => f.id === active.id);
      const newIndex = prev.findIndex((f) => f.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleBulkFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter((f) => ACCEPTED.includes(f.type));
    const skipped = fileList.length - files.length;
    if (skipped > 0) toast.error(`${skipped}件のファイルは未対応の形式のためスキップしました`);
    if (files.length === 0) return;

    // Sort by file name (natural order so 001 → 002 etc.)
    files.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }),
    );

    setUploading(true);
    setUploadTotal(files.length);
    setUploadDone(0);
    setCompletedCount(null);

    const newFrames: FrameData[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const dataUrl = await readFileAsDataUrl(files[i]);
        newFrames.push({
          id: `f${Date.now()}_${i}`,
          display: mediaDefaults.display,
          transitionTime: mediaDefaults.transitionTime,
          transition: mediaDefaults.transition,
          image: dataUrl,
          name: files[i].name,
        });
      } catch (e) {
        // skip
      }
      setUploadDone(i + 1);
    }

    setFrames((prev) => [...prev, ...newFrames]);
    if (newFrames.length > 0) setSelectedId(newFrames[0].id);
    setUploading(false);
    setCompletedCount(newFrames.length);
    setTimeout(() => setCompletedCount(null), 3000);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleBulkFiles(e.dataTransfer.files);
  };

  const selectedFrame = frames.find((f) => f.id === selectedId);

  return (
    <>
      <PageHeader
        title="コマ設定"
        description="各コマの表示時間・テキストを編集します"
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("/create")}>
              戻る
            </Button>
            <Button onClick={() => navigate("/create/export")}>次へ</Button>
          </>
        }
      />
      <div className="p-8 pb-4 border-b border-border bg-background">
        <StepIndicator steps={steps} current={1} />
      </div>

      <div className="flex-1 grid grid-cols-[40%_60%] min-h-0">
        {/* Left: Bulk upload + Frame list */}
        <div className="border-r border-border overflow-y-auto p-6 space-y-4 bg-muted/30">
          {/* Bulk upload zone */}
          <div
            onClick={() => bulkInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cn(
              "cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors flex flex-col items-center gap-2",
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border bg-background hover:bg-muted/40",
            )}
          >
            <Upload className="h-7 w-7 text-muted-foreground" />
            <div className="text-sm font-medium">
              クリックまたはドラッグ&ドロップで画像を一括アップロード
            </div>
            <div className="text-xs text-muted-foreground">
              PNG / JPG / WebP対応・複数ファイル選択可（上限なし）
            </div>
            <input
              ref={bulkInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                handleBulkFiles(e.target.files);
                if (bulkInputRef.current) bulkInputRef.current.value = "";
              }}
            />
          </div>

          {uploading && (
            <div className="rounded-lg border border-border bg-card p-3 space-y-2">
              <div className="text-xs text-muted-foreground">
                {uploadTotal}枚中{uploadDone}枚アップロード中...
              </div>
              <Progress value={uploadTotal === 0 ? 0 : (uploadDone / uploadTotal) * 100} className="h-2" />
            </div>
          )}

          {!uploading && completedCount !== null && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center gap-2 text-sm text-primary">
              <CheckCircle2 className="h-4 w-4" />
              {completedCount}枚の画像をアップロードしました
            </div>
          )}

          <h2 className="text-sm font-semibold">コマ一覧（{frames.length}）</h2>

          {frames.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-background/40 p-6 text-center text-sm text-muted-foreground">
              まだコマがありません。上のエリアから画像をアップロードしてください。
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={frames.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {frames.map((f, idx) => (
                    <SortableFrameCard
                      key={f.id}
                      frame={f}
                      index={idx}
                      total={frames.length}
                      selected={f.id === selectedId}
                      onSelect={() => setSelectedId(f.id)}
                      onUpdate={(patch) => updateFrame(f.id, patch)}
                      onMoveUp={() => moveFrame(idx, idx - 1)}
                      onMoveDown={() => moveFrame(idx, idx + 1)}
                      onDelete={() => requestDelete(f.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          <button
            onClick={addFrame}
            className="w-full rounded-lg border-2 border-dashed border-border p-6 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" /> コマを追加
          </button>
        </div>

        <AlertDialog open={pendingDeleteId !== null} onOpenChange={(o) => !o && setPendingDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>このコマを削除しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                削除したコマは元に戻せません。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                削除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>


        {/* Right: Preview + Text edit */}
        <div className="grid grid-cols-[1fr_320px] min-h-0">
          {/* Preview */}
          <div className="overflow-y-auto p-8 flex items-start justify-center bg-muted/20">
            <div
              className="relative bg-muted rounded-lg overflow-hidden shadow-sm"
              style={{ width: 360, height: 450 }}
            >
              {selectedFrame?.image ? (
                <img src={selectedFrame.image} alt="frame" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                  コマプレビュー
                </div>
              )}
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1 cursor-move select-none"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  color,
                  fontFamily: font,
                  fontSize: fontSize / 2,
                  writingMode: vertical ? "vertical-rl" : "horizontal-tb",
                  WebkitTextStroke: `${strokeWidth / 2}px ${strokeColor}`,
                  background: bgEnabled
                    ? `${bgColor}${Math.round((bgOpacity / 100) * 255)
                        .toString(16)
                        .padStart(2, "0")}`
                    : "transparent",
                  mixBlendMode: blend === "通常" ? "normal" : blend === "乗算" ? "multiply" : blend === "スクリーン" ? "screen" : "overlay",
                }}
              >
                {text || "テキスト"}
              </div>
            </div>
          </div>

          {/* Text edit panel */}
          <div className="border-l border-border overflow-y-auto p-5 space-y-5 bg-background">
            <h2 className="text-sm font-semibold">テキスト設定</h2>

            <div className="flex gap-2">
              <Button
                variant={!vertical ? "default" : "outline"}
                size="sm"
                onClick={() => patchText({ vertical: false })}
                className="flex-1"
              >
                <AlignLeft /> 横書き
              </Button>
              <Button
                variant={vertical ? "default" : "outline"}
                size="sm"
                onClick={() => patchText({ vertical: true })}
                className="flex-1"
              >
                <AlignCenter /> 縦書き
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">テキスト</Label>
              <Textarea value={text} onChange={(e) => patchText({ text: e.target.value })} rows={3} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">位置（プリセット）</Label>
              <div className="grid grid-cols-3 gap-1">
                {gridPositions.map((g) => (
                  <button
                    key={g.label}
                    onClick={() => patchText({ pos: { x: g.x, y: g.y } })}
                    className={cn(
                      "aspect-square rounded border text-[10px]",
                      pos.x === g.x && pos.y === g.y
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:bg-muted",
                    )}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">X (%)</Label>
                <Input
                  type="number"
                  value={pos.x}
                  onChange={(e) => patchText({ pos: { ...pos, x: Number(e.target.value) } })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Y (%)</Label>
                <Input
                  type="number"
                  value={pos.y}
                  onChange={(e) => patchText({ pos: { ...pos, y: Number(e.target.value) } })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">フォント</Label>
              <Select value={font} onValueChange={(v) => patchText({ font: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">フォントサイズ：{fontSize}px</Label>
              <Slider
                value={[fontSize]}
                onValueChange={(v) => patchText({ fontSize: v[0] })}
                min={12}
                max={120}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">文字色</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => patchText({ color: e.target.value })}
                  className="h-9 w-14 rounded border border-border cursor-pointer"
                />
                <Input value={color} onChange={(e) => patchText({ color: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">描画モード</Label>
              <Select value={blend} onValueChange={(v) => patchText({ blend: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {blendModes.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 border-t border-border pt-4">
              <Label className="text-xs">枠線</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => patchText({ strokeColor: e.target.value })}
                  className="h-9 w-14 rounded border border-border cursor-pointer"
                />
                <Input
                  type="number"
                  value={strokeWidth}
                  onChange={(e) => patchText({ strokeWidth: Number(e.target.value) })}
                  min={0}
                  max={20}
                  className="w-20"
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs">背景帯</Label>
                <Switch checked={bgEnabled} onCheckedChange={(v) => patchText({ bgEnabled: v })} />
              </div>
              {bgEnabled && (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => patchText({ bgColor: e.target.value })}
                      className="h-9 w-14 rounded border border-border cursor-pointer"
                    />
                    <Input value={bgColor} onChange={(e) => patchText({ bgColor: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">透明度：{bgOpacity}%</Label>
                    <Slider
                      value={[bgOpacity]}
                      onValueChange={(v) => patchText({ bgOpacity: v[0] })}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateFrames;
