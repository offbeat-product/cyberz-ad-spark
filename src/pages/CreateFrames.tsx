import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, AlignLeft, AlignCenter, Upload, CheckCircle2, Save, AlertTriangle } from "lucide-react";
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
import CopyrightDraggable from "@/components/create/CopyrightDraggable";
import ScrubbyNumberInput from "@/components/create/ScrubbyNumberInput";
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
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
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
  const { basic, frames, setFrames, textSettings, setTextSettings, saveAsDraft } = useCreateFlow();
  const { media, frames: masterFrames, logos: masterLogos } = useMediaMasters();
  const [selectedId, setSelectedId] = useState<string>(frames[0]?.id ?? "");
  const [previewSize, setPreviewSize] = useState<"main" | "vertical" | "square">("main");

  // Layer visibility / logo selection
  const [showFrame, setShowFrame] = useState(true);
  const [showCopyright, setShowCopyright] = useState(true);
  const [copyrightSize, setCopyrightSize] = useState(12);
  type CopyrightPos =
    | "top-left" | "top-center" | "top-right"
    | "middle-left" | "middle-center" | "middle-right"
    | "bottom-left" | "bottom-center" | "bottom-right";
  // Inner comic area is 1080 x 1350 px (canvas coords)
  const CANVAS_W = 1080;
  const CANVAS_H = 1350;
  const PRESET_PADDING = 8;
  // Position is stored as preset + offset; final coord = preset + offset
  const [copyrightPos, setCopyrightPos] = useState<CopyrightPos>("bottom-left");
  const [copyrightOffset, setCopyrightOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  // Last measured element size in canvas px (kept in a ref for preset math)
  const copyrightSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  // プリセット位置を計算（フォントサイズ＝要素サイズ変化に追従）
  const computePresetCoord = (p: CopyrightPos) => {
    const { w, h } = copyrightSizeRef.current;
    let x = PRESET_PADDING;
    if (p.endsWith("-center")) x = Math.max(0, (CANVAS_W - w) / 2);
    else if (p.endsWith("-right")) x = Math.max(0, CANVAS_W - w - PRESET_PADDING);
    let y = PRESET_PADDING;
    if (p.startsWith("middle-")) y = Math.max(0, (CANVAS_H - h) / 2);
    else if (p.startsWith("bottom-")) y = Math.max(0, CANVAS_H - h - PRESET_PADDING);
    return { x, y };
  };

  // 最終表示座標 = プリセット位置 + オフセット
  const copyrightCoord = (() => {
    const base = computePresetCoord(copyrightPos);
    return { x: base.x + copyrightOffset.x, y: base.y + copyrightOffset.y };
  })();

  // Undo/Redo: snapshot of {pos, offset}
  const undoStackRef = useRef<{ pos: CopyrightPos; offset: { x: number; y: number } }[]>([]);
  const redoStackRef = useRef<{ pos: CopyrightPos; offset: { x: number; y: number } }[]>([]);
  const pushHistory = () => {
    undoStackRef.current.push({ pos: copyrightPos, offset: copyrightOffset });
    if (undoStackRef.current.length > 20) undoStackRef.current.shift();
    redoStackRef.current = [];
  };
  const [copyrightFont, setCopyrightFont] = useState("Noto Sans JP");
  const [copyrightColor, setCopyrightColor] = useState("#FFFFFF");
  const [logoId, setLogoId] = useState<string>("");

  // Resolve defaults from the selected media master (matched by id)
  const selectedMaster = media.find((m) => m.id === basic.mediaId);
  const mediaDefaults = {
    display: selectedMaster?.displaySec ?? 2.0,
    transitionTime: selectedMaster?.switchSec ?? 0.3,
    transition: selectedMaster ? transitionKeyToLabel[selectedMaster.transition] : "フェード",
  };
  const masterBgColor = selectedMaster?.bgColor ?? "#000000";
  const mediaFrameAssets = selectedMaster
    ? masterFrames.filter((f) => f.mediaMasterId === selectedMaster.id)
    : [];
  // Prefer the explicit default; fall back to first registered frame for this media
  const defaultFrameAsset =
    mediaFrameAssets.find((f) => f.isDefault) ?? mediaFrameAssets[0];
  const availableLogos = selectedMaster
    ? masterLogos.filter((l) => l.mediaMasterId === selectedMaster.id)
    : [];
  const defaultLogoAsset = availableLogos.find((l) => l.isDefault);

  // Initialize logo selection when media changes
  useEffect(() => {
    if (!selectedMaster) {
      setLogoId("");
      return;
    }
    if (selectedMaster.noLogo) {
      setLogoId("none");
    } else {
      setLogoId(defaultLogoAsset?.id ?? "none");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMaster?.id]);

  const activeLogoAsset = logoId && logoId !== "none"
    ? availableLogos.find((l) => l.id === logoId)
    : undefined;

  // Bulk upload state
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [uploadDone, setUploadDone] = useState(0);
  const [completedCount, setCompletedCount] = useState<number | null>(null);

  // Preview area measurement (to fit canvas)
  const previewAreaRef = useRef<HTMLDivElement>(null);
  const [previewAreaWidth, setPreviewAreaWidth] = useState(420);
  const [previewAreaHeight, setPreviewAreaHeight] = useState(640);
  useEffect(() => {
    const el = previewAreaRef.current;
    if (!el) return;
    const compute = () => {
      setPreviewAreaWidth(el.clientWidth);
      setPreviewAreaHeight(el.clientHeight);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Stage ref (the inner 1080xN scaled stage) for copyright drag math
  const stageRef = useRef<HTMLDivElement>(null);

  const undoCopyright = () => {
    const prev = undoStackRef.current.pop();
    if (!prev) return;
    redoStackRef.current.push({ pos: copyrightPos, offset: copyrightOffset });
    if (redoStackRef.current.length > 20) redoStackRef.current.shift();
    setCopyrightPos(prev.pos);
    setCopyrightOffset(prev.offset);
  };
  const redoCopyright = () => {
    const next = redoStackRef.current.pop();
    if (!next) return;
    undoStackRef.current.push({ pos: copyrightPos, offset: copyrightOffset });
    if (undoStackRef.current.length > 20) undoStackRef.current.shift();
    setCopyrightPos(next.pos);
    setCopyrightOffset(next.offset);
  };

  // Keyboard: Cmd/Ctrl+Z undo, Cmd/Ctrl+Shift+Z redo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (target && target.isContentEditable) return;
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        undoCopyright();
      } else if ((k === "z" && e.shiftKey) || k === "y") {
        e.preventDefault();
        redoCopyright();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Text settings shortcuts from context
  const {
    visible: textVisible,
    vertical, text, pos, font, fontSize, color, blend,
    strokeEnabled, strokeColor, strokeWidth, bgEnabled, bgColor, bgOpacity,
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

    // Snapshot of slots that need image rebinding (have name but missing image)
    const slotsByName = new Map<string, string>(); // fileName -> frameId
    frames.forEach((f) => {
      if (f.name && !f.image) slotsByName.set(f.name, f.id);
    });

    const rebinds: Array<{ id: string; image: string }> = [];
    const newFrames: FrameData[] = [];
    let rebindCount = 0;

    for (let i = 0; i < files.length; i++) {
      try {
        const dataUrl = await readFileAsDataUrl(files[i]);
        const matchedId = slotsByName.get(files[i].name);
        if (matchedId) {
          rebinds.push({ id: matchedId, image: dataUrl });
          slotsByName.delete(files[i].name);
          rebindCount++;
        } else {
          newFrames.push({
            id: `f${Date.now()}_${i}`,
            display: mediaDefaults.display,
            transitionTime: mediaDefaults.transitionTime,
            transition: mediaDefaults.transition,
            image: dataUrl,
            name: files[i].name,
          });
        }
      } catch (e) {
        // skip
      }
      setUploadDone(i + 1);
    }

    setFrames((prev) => {
      const rebindMap = new Map(rebinds.map((r) => [r.id, r.image]));
      const updated = prev.map((f) =>
        rebindMap.has(f.id) ? { ...f, image: rebindMap.get(f.id)! } : f,
      );
      return [...updated, ...newFrames];
    });
    if (newFrames.length > 0) setSelectedId(newFrames[0].id);
    setUploading(false);
    setCompletedCount(newFrames.length + rebindCount);
    if (rebindCount > 0) {
      toast.success(`${rebindCount}件の画像を保存時の設定で復元しました`);
    }
    setTimeout(() => setCompletedCount(null), 3000);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleBulkFiles(e.dataTransfer.files);
  };

  const selectedFrame = frames.find((f) => f.id === selectedId);

  // Frames whose image data was lost (e.g., after reload from localStorage)
  const missingFrames = useMemo(
    () => frames.filter((f) => !!f.name && !f.image),
    [frames],
  );

  const handleNext = () => {
    saveAsDraft({ step: 3, silent: true });
    navigate("/create/export");
  };

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
            <Button variant="outline" onClick={() => saveAsDraft({ step: 2 })}>
              <Save className="h-4 w-4" /> 下書き保存
            </Button>
            <Button onClick={handleNext}>次へ</Button>
          </>
        }
      />
      <div className="p-8 pb-4 border-b border-border bg-background">
        <StepIndicator steps={steps} current={1} />
        {missingFrames.length > 0 && (
          <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-foreground">
                画像を再アップロードしてください
              </p>
              <p className="text-muted-foreground text-xs">
                保存時に画像データは容量の都合で保存されていません。以下のファイルを再アップロードしてください：
              </p>
              <ul className="text-xs text-foreground list-disc pl-5">
                {missingFrames.map((f) => (
                  <li key={f.id}>{f.name}</li>
                ))}
              </ul>
              <p className="text-[11px] text-muted-foreground">
                ※ファイル名が一致するコマには、保存時の設定（秒数・トランジション等）が自動復元されます
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 grid grid-cols-[30%_40%_30%] min-h-0">
        {/* ===== Left column (30%): Bulk upload (sticky top) + Frame list (scroll) ===== */}
        <div className="border-r border-border min-h-0 flex flex-col bg-muted/30">
          {/* Sticky upload area */}
          <div className="p-4 border-b border-border bg-muted/30 space-y-3">
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
          </div>

          {/* Scrollable frame list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
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


        {/* ===== Middle column (40%): Preview ===== */}
        <div className="border-r border-border min-h-0 flex flex-col bg-muted/20">
          {/* Sticky controls (size selector only) */}
          <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-end gap-2 flex-wrap">
            {([
              { id: "main", label: "1080×1350" },
              { id: "vertical", label: "1080×1920" },
              { id: "square", label: "1080×1080" },
            ] as const).map((s) => {
              const active = previewSize === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setPreviewSize(s.id)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors border",
                    active
                      ? "text-white border-transparent shadow-sm"
                      : "bg-background border-border text-muted-foreground hover:bg-muted",
                  )}
                  style={
                    active
                      ? { background: "linear-gradient(90deg, #409EEA, #6C81FC)" }
                      : undefined
                  }
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Preview canvas area (no scroll, fills remaining space) */}
          <div ref={previewAreaRef} className="flex-1 min-h-0 p-6 flex items-center justify-center overflow-hidden">

            {(() => {
              const sizes = {
                main: { w: 1080, h: 1350 },
                vertical: { w: 1080, h: 1920 },
                square: { w: 1080, h: 1080 },
              } as const;
              const { w: canvasW, h: canvasH } = sizes[previewSize];
              // Comic area is always 1080x1350 centered inside canvas
              const innerW = 1080;
              const innerH = 1350;
              const offsetX = (canvasW - innerW) / 2;
              const offsetY = (canvasH - innerH) / 2;
              // Fit canvas to available preview area width and height
              const maxW = Math.max(160, previewAreaWidth - 48);
              const maxH = Math.max(200, previewAreaHeight - 48);
              const ratio = Math.min(maxW / canvasW, maxH / canvasH);
              const dispW = canvasW * ratio;
              const dispH = canvasH * ratio;

              return (
                <div className="flex items-center justify-center">

                  <div
                    className="relative rounded-lg overflow-hidden shadow-sm border border-border"
                    style={{
                      width: dispW,
                      height: dispH,
                      backgroundColor: previewSize === "main" ? "#e5e5e5" : masterBgColor,
                    }}
                  >
                    {/* Scaled stage at canvas pixel size */}
                    <div
                      className="absolute left-0 top-0 origin-top-left"
                      style={{
                        width: canvasW,
                        height: canvasH,
                        transform: `scale(${ratio})`,
                      }}
                    >
                      {/* ② Comic image area (1080x1350) centered */}
                      <div
                        className="absolute overflow-hidden bg-muted"
                        style={{ left: offsetX, top: offsetY, width: innerW, height: innerH }}
                      >
                        {selectedFrame?.image ? (
                          <img
                            src={selectedFrame.image}
                            alt="frame"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                            コマプレビュー
                          </div>
                        )}

                        {/* ③ Frame asset (full canvas, object-cover) */}
                        {showFrame && defaultFrameAsset?.imageUrl && (
                          <img
                            src={defaultFrameAsset.imageUrl}
                            alt="default frame"
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                          />
                        )}

                        {/* ④ Logo asset */}
                        {activeLogoAsset?.imageUrl && (
                          <img
                            src={activeLogoAsset.imageUrl}
                            alt="logo"
                            className="absolute pointer-events-none object-contain"
                            style={{
                              left: activeLogoAsset.position.x,
                              top: activeLogoAsset.position.y,
                              width: activeLogoAsset.position.w,
                              height: activeLogoAsset.position.h,
                            }}
                          />
                        )}

                        {/* ⑤ Text */}
                        {textVisible && (() => {
                          const translateY =
                            pos.y <= 25 ? "0%" :
                            pos.y >= 75 ? "-100%" :
                            "-50%";
                          const translateX =
                            pos.x <= 25 ? "0%" :
                            pos.x >= 75 ? "-100%" :
                            "-50%";
                          return (
                            <div
                              className="absolute px-6 py-2 select-none"
                              style={{
                                left: `${pos.x}%`,
                                top: `${pos.y}%`,
                                transform: `translate(${translateX}, ${translateY})`,
                                color,
                                fontFamily: font,
                                fontSize: fontSize,
                                writingMode: vertical ? "vertical-rl" : "horizontal-tb",
                                whiteSpace: "pre",
                                WebkitTextStroke: strokeEnabled ? `${strokeWidth}px ${strokeColor}` : "none",
                                background: bgEnabled
                                  ? `${bgColor}${Math.round((bgOpacity / 100) * 255)
                                      .toString(16)
                                      .padStart(2, "0")}`
                                  : "transparent",
                                mixBlendMode:
                                  blend === "通常"
                                    ? "normal"
                                    : blend === "乗算"
                                      ? "multiply"
                                      : blend === "スクリーン"
                                        ? "screen"
                                        : "overlay",
                              }}
                            >
                              {text || "テキスト"}
                            </div>
                          );
                        })()}

                        {/* ⑥ Copyright (draggable, px-based in canvas coords) */}
                        {showCopyright && basic.copyright && (
                          <CopyrightDraggable
                            text={basic.copyright}
                            color={copyrightColor}
                            font={copyrightFont}
                            fontSize={copyrightSize}
                            x={copyrightCoord.x}
                            y={copyrightCoord.y}
                            canvasW={CANVAS_W}
                            canvasH={CANVAS_H}
                            scale={ratio}
                            onSizeChange={(w, h) => {
                              copyrightSizeRef.current = { w, h };
                            }}
                            onDragStart={() => pushHistory()}
                            onDrag={(nx, ny) => {
                              const base = computePresetCoord(copyrightPos);
                              setCopyrightOffset({
                                x: nx - base.x,
                                y: ny - base.y,
                              });
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ===== Right column (30%): Settings panel (scrollable) ===== */}
        <div className="overflow-y-auto p-4 bg-background min-h-0">
          <Accordion type="multiple" className="space-y-2">
            {/* ① Frame settings */}
            <AccordionItem value="frame" className="border border-border rounded-md overflow-hidden bg-background">
              <AccordionTrigger className="px-3 py-2 bg-muted/40 hover:bg-muted hover:no-underline">
                <div className="flex-1 flex items-center justify-between gap-3 text-left">
                  <span className="text-sm font-semibold">フレーム設定</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {defaultFrameAsset && showFrame ? defaultFrameAsset.name : "未設定"}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pt-3 space-y-3">
                <div className={cn(
                  "flex items-center gap-2 text-xs",
                  defaultFrameAsset ? "text-muted-foreground" : "text-muted-foreground/50"
                )}>
                  <Switch
                    checked={showFrame && !!defaultFrameAsset}
                    onCheckedChange={setShowFrame}
                    disabled={!defaultFrameAsset}
                  />
                  <span className="whitespace-nowrap">
                    {defaultFrameAsset ? "フレームを表示" : "フレーム未登録"}
                  </span>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">フレーム選択</Label>
                  <Select
                    value={defaultFrameAsset?.id ?? ""}
                    onValueChange={() => {}}
                    disabled={mediaFrameAssets.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="フレーム未登録" />
                    </SelectTrigger>
                    <SelectContent>
                      {mediaFrameAssets.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ② Logo settings */}
            <AccordionItem value="logo" className="border border-border rounded-md overflow-hidden bg-background">
              <AccordionTrigger className="px-3 py-2 bg-muted/40 hover:bg-muted hover:no-underline">
                <div className="flex-1 flex items-center justify-between gap-3 text-left">
                  <span className="text-sm font-semibold">ロゴ設定</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {!selectedMaster
                      ? "未設定"
                      : logoId === "none" || !activeLogoAsset
                        ? "ロゴなし"
                        : activeLogoAsset.name}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pt-3 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">ロゴ選択</Label>
                  <Select value={logoId} onValueChange={setLogoId} disabled={!selectedMaster}>
                    <SelectTrigger>
                      <SelectValue placeholder="ロゴなし" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">ロゴなし</SelectItem>
                      {availableLogos.map((l) => (
                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ③ Copyright settings */}
            <AccordionItem value="copyright" className="border border-border rounded-md overflow-hidden bg-background">
              <AccordionTrigger className="px-3 py-2 bg-muted/40 hover:bg-muted hover:no-underline">
                <div className="flex-1 flex items-center justify-between gap-3 text-left">
                  <span className="text-sm font-semibold">コピーライト設定</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {showCopyright ? `表示中 ${copyrightSize}px` : "非表示"}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pt-3 space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch checked={showCopyright} onCheckedChange={setShowCopyright} />
                  <span className="whitespace-nowrap">コピーライトを表示</span>
                </div>
                {showCopyright && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs">フォントサイズ：{copyrightSize}px</Label>
                      <Slider
                        value={[copyrightSize]}
                        min={8}
                        max={100}
                        step={1}
                        onValueChange={(v) => setCopyrightSize(v[0])}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">フォント</Label>
                      <Select value={copyrightFont} onValueChange={setCopyrightFont}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["Noto Sans JP", "Noto Serif JP", "M PLUS Rounded 1c", "Zen Maru Gothic"].map((f) => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">カラー</Label>
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          type="color"
                          value={copyrightColor}
                          onChange={(e) => setCopyrightColor(e.target.value)}
                          className="h-9 w-14 cursor-pointer rounded border border-border bg-background p-0"
                        />
                        <div className="flex items-center gap-1">
                          {[
                            { c: "#FFFFFF", label: "白" },
                            { c: "#000000", label: "黒" },
                            { c: "#888888", label: "グレー" },
                          ].map((p) => (
                            <button
                              key={p.c}
                              type="button"
                              onClick={() => setCopyrightColor(p.c)}
                              title={p.label}
                              className={cn(
                                "h-7 w-7 rounded border transition-shadow",
                                copyrightColor.toLowerCase() === p.c.toLowerCase()
                                  ? "border-primary ring-2 ring-primary/40"
                                  : "border-border",
                              )}
                              style={{ backgroundColor: p.c }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">位置（プリセット）</Label>
                      <div className="grid grid-cols-3 gap-1">
                        {([
                          { id: "top-left", label: "左上" },
                          { id: "top-center", label: "上" },
                          { id: "top-right", label: "右上" },
                          { id: "middle-left", label: "左" },
                          { id: "middle-center", label: "中央" },
                          { id: "middle-right", label: "右" },
                          { id: "bottom-left", label: "左下" },
                          { id: "bottom-center", label: "下" },
                          { id: "bottom-right", label: "右下" },
                        ] as const).map((p) => {
                          const active = copyrightPos === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                pushHistory();
                                setCopyrightPos(p.id);
                                setCopyrightOffset({ x: 0, y: 0 });
                              }}
                              className={cn(
                                "aspect-square rounded border text-[10px] transition-colors",
                                active
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background border-border text-muted-foreground hover:bg-muted",
                              )}
                            >
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">微調整（プリセットからのオフセット）</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <ScrubbyNumberInput
                          label="X"
                          value={copyrightOffset.x}
                          onChange={(nx) => setCopyrightOffset((prev) => ({ ...prev, x: nx }))}
                          onDragStart={() => pushHistory()}
                          min={-500}
                          max={500}
                          unit="px"
                        />
                        <ScrubbyNumberInput
                          label="Y"
                          value={copyrightOffset.y}
                          onChange={(ny) => setCopyrightOffset((prev) => ({ ...prev, y: ny }))}
                          onDragStart={() => pushHistory()}
                          min={-500}
                          max={500}
                          unit="px"
                        />
                      </div>

                <div className="space-y-2">
                  <Label className="text-xs">フォント</Label>
                  <Select value={font} onValueChange={(v) => patchText({ font: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
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
                        <SelectItem key={b} value={b}>{b}</SelectItem>
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
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </>
  );
};

export default CreateFrames;
