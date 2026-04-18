import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Music, Heart, Ghost, Sparkles, Wand2, Sun, Flame, VolumeX, Download } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StepIndicator from "@/components/StepIndicator";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const steps = [{ label: "基本設定" }, { label: "コマ設定" }, { label: "書き出し" }];

const bgmPresets = [
  { id: "sad", label: "切ない・悲しい", icon: Heart },
  { id: "horror", label: "ホラー・グロ", icon: Ghost },
  { id: "cute", label: "かわいい・ポップ", icon: Sparkles },
  { id: "fantasy", label: "ファンタジー・転生", icon: Wand2 },
  { id: "fresh", label: "爽やか・青春", icon: Sun },
  { id: "emotional", label: "エモーショナル", icon: Flame },
  { id: "none", label: "BGMなし", icon: VolumeX },
];

const formats = [
  { id: "main", label: "メイン", size: "1080×1350px" },
  { id: "vertical", label: "リサイズ縦型", size: "1080×1920px" },
  { id: "square", label: "リサイズ横型", size: "1080×1080px" },
];

const CreateExport = () => {
  const navigate = useNavigate();
  const [bgm, setBgm] = useState("fantasy");
  const [selectedFormats, setSelectedFormats] = useState<string[]>(["main"]);
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [showFrame, setShowFrame] = useState(true);
  const [showLogo, setShowLogo] = useState(true);

  const toggleFormat = (id: string) => {
    setSelectedFormats((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
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
      <div className="p-8 max-w-5xl space-y-8">
        <StepIndicator steps={steps} current={2} />

        {/* BGM */}
        <section className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Music className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">BGMプリセット</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {bgmPresets.map((b) => {
              const active = bgm === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => setBgm(b.id)}
                  className={cn(
                    "rounded-lg border p-4 text-left transition-all",
                    active
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border bg-background hover:border-muted-foreground/30",
                  )}
                >
                  <b.icon className={cn("h-5 w-5 mb-2", active ? "text-primary" : "text-muted-foreground")} />
                  <div className="text-sm font-medium">{b.label}</div>
                </button>
              );
            })}
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

        {/* Settings */}
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
    </>
  );
};

export default CreateExport;
