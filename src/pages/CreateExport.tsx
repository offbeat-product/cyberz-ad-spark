import { useNavigate } from "react-router-dom";
import { useRef, useState, ChangeEvent } from "react";
import {
  Music,
  Heart,
  Ghost,
  Sparkles,
  Wand2,
  Sun,
  Flame,
  VolumeX,
  Download,
  Play,
  Square,
  Upload,
  ChevronDown,
  Volume2,
  Trash2,
  Dices,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StepIndicator from "@/components/StepIndicator";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCreateFlow } from "@/contexts/CreateFlowContext";

const steps = [{ label: "基本設定" }, { label: "コマ設定" }, { label: "書き出し" }];

type BGMTrack = { id: string; name: string; url: string; duration?: number };
type BGMCategoryDef = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tracks: BGMTrack[];
};

const BGM_CATEGORIES: BGMCategoryDef[] = [
  {
    id: "sad",
    label: "切ない・悲しい",
    icon: Heart,
    tracks: [
      { id: "sad-01", name: "切ないピアノ01", url: "" },
      { id: "sad-02", name: "切ないピアノ02", url: "" },
      { id: "sad-03", name: "悲しみのストリングス", url: "" },
    ],
  },
  {
    id: "horror",
    label: "ホラー・グロ",
    icon: Ghost,
    tracks: [
      { id: "horror-01", name: "不気味な音色01", url: "" },
      { id: "horror-02", name: "緊張感のあるドラム", url: "" },
    ],
  },
  {
    id: "cute",
    label: "かわいい・ポップ",
    icon: Sparkles,
    tracks: [
      { id: "cute-01", name: "ポップなメロディ01", url: "" },
      { id: "cute-02", name: "軽快なビート", url: "" },
    ],
  },
  {
    id: "fantasy",
    label: "ファンタジー・転生",
    icon: Wand2,
    tracks: [
      { id: "fantasy-01", name: "壮大なオーケストラ", url: "" },
      { id: "fantasy-02", name: "神秘的なメロディ", url: "" },
    ],
  },
  {
    id: "refreshing",
    label: "爽やか・青春",
    icon: Sun,
    tracks: [
      { id: "refreshing-01", name: "爽やかなギター", url: "" },
      { id: "refreshing-02", name: "青春アコースティック", url: "" },
    ],
  },
  {
    id: "emotional",
    label: "エモーショナル",
    icon: Flame,
    tracks: [
      { id: "emotional-01", name: "感動的なピアノ", url: "" },
      { id: "emotional-02", name: "壮大なバラード", url: "" },
    ],
  },
  {
    id: "none",
    label: "BGMなし",
    icon: VolumeX,
    tracks: [],
  },
];

const formats = [
  { id: "main", label: "メイン", size: "1080×1350px" },
  { id: "vertical", label: "リサイズ縦型", size: "1080×1920px" },
  { id: "square", label: "リサイズ横型", size: "1080×1080px" },
];

const ACCEPTED_AUDIO = ["audio/mp3", "audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/m4a", "audio/x-m4a"];
const MAX_AUDIO_SIZE = 50 * 1024 * 1024;

type UploadedBGM = {
  id: string;
  name: string;
  url: string;
  isTemplate: boolean;
  templateCategory?: string;
};

const CreateExport = () => {
  const navigate = useNavigate();
  const { exportSettings, setExportSettings } = useCreateFlow();
  const { selectedFormats, bgColor, showFrame, showLogo } = exportSettings;

  const setBgColor = (v: string) => setExportSettings((p) => ({ ...p, bgColor: v }));
  const setShowFrame = (v: boolean) => setExportSettings((p) => ({ ...p, showFrame: v }));
  const setShowLogo = (v: boolean) => setExportSettings((p) => ({ ...p, showLogo: v }));

  const toggleFormat = (id: string) => {
    setExportSettings((p) => ({
      ...p,
      selectedFormats: p.selectedFormats.includes(id)
        ? p.selectedFormats.filter((f) => f !== id)
        : [...p.selectedFormats, id],
    }));
  };

  // BGM state
  const [expandedCategory, setExpandedCategory] = useState<string | null>("fantasy");
  const [selectedBgmId, setSelectedBgmId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Uploaded BGM
  const [uploadedBgms, setUploadedBgms] = useState<UploadedBGM[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);
  const [uploadAsTemplate, setUploadAsTemplate] = useState<"yes" | "no">("no");
  const [uploadTemplateCategory, setUploadTemplateCategory] = useState<string>("");

  // Volume
  const [normalizeVolume, setNormalizeVolume] = useState(true);
  const [volume, setVolume] = useState(100);

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPreviewingId(null);
  };

  const playPreview = (id: string, url: string) => {
    if (previewingId === id) {
      stopPreview();
      return;
    }
    if (!url) {
      toast.info("音源準備中です");
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audio.volume = volume / 100;
    audio.onended = () => setPreviewingId(null);
    audio.play().catch(() => toast.error("再生できませんでした"));
    audioRef.current = audio;
    setPreviewingId(id);
  };

  const handleSelectTrack = (id: string) => {
    setSelectedBgmId(id);
  };

  const handleFileSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED_AUDIO.includes(file.type)) {
      toast.error("対応していない形式です", { description: "MP3 / WAV / M4A をアップロードしてください" });
      return;
    }
    if (file.size > MAX_AUDIO_SIZE) {
      toast.error("ファイルサイズが大きすぎます", { description: "50MB以下のファイルをアップロードしてください" });
      return;
    }
    setPendingUploadFile(file);
    setUploadAsTemplate("no");
    setUploadTemplateCategory("");
  };

  const confirmUpload = () => {
    if (!pendingUploadFile) return;
    if (uploadAsTemplate === "yes" && !uploadTemplateCategory) {
      toast.error("ジャンルを選択してください");
      return;
    }
    const url = URL.createObjectURL(pendingUploadFile);
    const newBgm: UploadedBGM = {
      id: `upload-${Date.now()}`,
      name: pendingUploadFile.name,
      url,
      isTemplate: uploadAsTemplate === "yes",
      templateCategory: uploadAsTemplate === "yes" ? uploadTemplateCategory : undefined,
    };
    setUploadedBgms((prev) => [...prev, newBgm]);
    setPendingUploadFile(null);
    toast.success("BGMをアップロードしました");
  };

  const removeUpload = (id: string) => {
    setUploadedBgms((prev) => prev.filter((b) => b.id !== id));
    if (selectedBgmId === id) setSelectedBgmId(null);
    if (previewingId === id) stopPreview();
  };

  const handleExport = () => {
    toast.success("動画の書き出しを開始しました", {
      description: `${selectedFormats.length}種類のフォーマットで生成中…`,
    });
  };

  return (
    <>
      <PageHeader
        title="書き出し設定"
        description="BGM・出力フォーマットを選択します"
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("/create/frames")}>
              戻る
            </Button>
            <Button onClick={handleExport}>
              <Download /> 動画を書き出す
            </Button>
          </>
        }
      />
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-8 max-w-5xl space-y-8">
          <StepIndicator steps={steps} current={2} />

          {/* BGM Presets */}
          <section className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Music className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">BGMプリセット</h2>
            </div>
            <div className="space-y-3">
              {BGM_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isExpanded = expandedCategory === cat.id;
                const hasSelectedFromCat = cat.tracks.some((t) => t.id === selectedBgmId) || (cat.id === "none" && selectedBgmId === "none");
                return (
                  <div
                    key={cat.id}
                    className={cn(
                      "rounded-lg border transition-colors",
                      isExpanded || hasSelectedFromCat
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (cat.id === "none") {
                          setSelectedBgmId("none");
                          stopPreview();
                          setExpandedCategory(null);
                          return;
                        }
                        setExpandedCategory(isExpanded ? null : cat.id);
                      }}
                      className="w-full flex items-center gap-3 p-4 text-left"
                    >
                      <Icon className={cn("h-5 w-5", hasSelectedFromCat ? "text-primary" : "text-muted-foreground")} />
                      <span className="text-sm font-medium flex-1">{cat.label}</span>
                      {cat.tracks.length > 0 && (
                        <>
                          <span className="text-xs text-muted-foreground">{cat.tracks.length}曲</span>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform",
                              isExpanded && "rotate-180",
                            )}
                          />
                        </>
                      )}
                    </button>
                    {isExpanded && cat.tracks.length > 0 && (
                      <div className="border-t border-border p-2 space-y-1">
                        {cat.tracks.map((track) => {
                          const selected = selectedBgmId === track.id;
                          const playing = previewingId === track.id;
                          return (
                            <div
                              key={track.id}
                              className={cn(
                                "flex items-center gap-2 rounded-md p-2 cursor-pointer transition-colors",
                                selected ? "bg-primary/10" : "hover:bg-muted/60",
                              )}
                              onClick={() => handleSelectTrack(track.id)}
                            >
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playPreview(track.id, track.url);
                                }}
                              >
                                {playing ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                              </Button>
                              <span className={cn("text-sm flex-1", selected && "font-medium text-primary")}>
                                {track.name}
                              </span>
                              {selected && <span className="text-xs text-primary">選択中</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* My Uploads */}
          <section className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">マイアップロード</h2>
              </div>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload /> BGMを個別でアップロード
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/mp3,audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/m4a,audio/x-m4a,.mp3,.wav,.m4a"
                className="hidden"
                onChange={handleFileSelected}
              />
            </div>
            {uploadedBgms.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                MP3 / WAV / M4A（最大50MB）をアップロードできます
              </p>
            ) : (
              <div className="space-y-1">
                {uploadedBgms.map((bgm) => {
                  const selected = selectedBgmId === bgm.id;
                  const playing = previewingId === bgm.id;
                  return (
                    <div
                      key={bgm.id}
                      className={cn(
                        "flex items-center gap-2 rounded-md p-2 cursor-pointer transition-colors border",
                        selected ? "bg-primary/10 border-primary" : "border-transparent hover:bg-muted/60",
                      )}
                      onClick={() => handleSelectTrack(bgm.id)}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          playPreview(bgm.id, bgm.url);
                        }}
                      >
                        {playing ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      </Button>
                      <div className="flex-1 min-w-0">
                        <div className={cn("text-sm truncate", selected && "font-medium text-primary")}>
                          {bgm.name}
                        </div>
                        {bgm.isTemplate && (
                          <div className="text-[10px] text-muted-foreground">
                            テンプレート登録: {BGM_CATEGORIES.find((c) => c.id === bgm.templateCategory)?.label}
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeUpload(bgm.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Volume */}
          <section className="rounded-lg border border-border bg-card p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">音量設定</h2>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label>自動音量正規化（-14LUFS）</Label>
                <p className="text-xs text-muted-foreground">
                  YouTube、Instagram、TikTok等で適正な音量になるよう自動調整します
                </p>
              </div>
              <Switch checked={normalizeVolume} onCheckedChange={setNormalizeVolume} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>音量</Label>
                <span className="text-sm text-muted-foreground tabular-nums">{volume}%</span>
              </div>
              <Slider
                value={[volume]}
                min={0}
                max={100}
                step={1}
                onValueChange={(v) => {
                  setVolume(v[0]);
                  if (audioRef.current) audioRef.current.volume = v[0] / 100;
                }}
              />
            </div>
          </section>

          {/* Formats */}
          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="font-semibold mb-4">出力フォーマット</h2>
            <div className="space-y-3">
              {formats.map((f) => (
                <label
                  key={f.id}
                  className="flex items-center gap-3 rounded-md border border-border p-4 cursor-pointer hover:bg-muted/40"
                >
                  <Checkbox
                    checked={selectedFormats.includes(f.id)}
                    onCheckedChange={() => toggleFormat(f.id)}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{f.label}</div>
                    <div className="text-xs text-muted-foreground">{f.size}</div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Display Settings */}
          <section className="rounded-lg border border-border bg-card p-6 space-y-5">
            <h2 className="font-semibold">表示設定</h2>

            <div className="space-y-2">
              <Label className="text-xs">リサイズ時の背景色</Label>
              <div className="flex items-center gap-2 max-w-xs">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-9 w-14 rounded border border-border cursor-pointer"
                />
                <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center justify-between max-w-md">
              <Label>フレーム表示</Label>
              <Switch checked={showFrame} onCheckedChange={setShowFrame} />
            </div>

            <div className="flex items-center justify-between max-w-md">
              <Label>ロゴ表示</Label>
              <Switch checked={showLogo} onCheckedChange={setShowLogo} />
            </div>
          </section>
        </div>
      </div>

      {/* Upload confirmation dialog */}
      <Dialog open={!!pendingUploadFile} onOpenChange={(open) => !open && setPendingUploadFile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>BGMをアップロード</DialogTitle>
            <DialogDescription>
              {pendingUploadFile?.name} をテンプレートとして登録しますか？
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <RadioGroup value={uploadAsTemplate} onValueChange={(v) => setUploadAsTemplate(v as "yes" | "no")}>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="tpl-no" />
                <Label htmlFor="tpl-no" className="font-normal cursor-pointer">
                  この案件のみで使用
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" id="tpl-yes" />
                <Label htmlFor="tpl-yes" className="font-normal cursor-pointer">
                  テンプレート登録する
                </Label>
              </div>
            </RadioGroup>

            {uploadAsTemplate === "yes" && (
              <div className="space-y-2">
                <Label className="text-xs">ジャンル（必須）</Label>
                <Select value={uploadTemplateCategory} onValueChange={setUploadTemplateCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="ジャンルを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {BGM_CATEGORIES.filter((c) => c.id !== "none").map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingUploadFile(null)}>
              キャンセル
            </Button>
            <Button onClick={confirmUpload}>アップロード</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateExport;
