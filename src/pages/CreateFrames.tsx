import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StepIndicator from "@/components/StepIndicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const steps = [{ label: "基本設定" }, { label: "コマ設定" }, { label: "書き出し" }];

const displayPresets = [1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0];
const transitionPresets = [0.2, 0.3, 0.5, 0.8, 1.0];
const transitionOptions = ["なし", "スライド左→右", "スライド上→下", "フェード", "ズームイン"];
const blendModes = ["通常", "乗算", "スクリーン", "オーバーレイ"];
const fontOptions = ["Noto Sans JP", "Noto Serif JP", "M PLUS Rounded 1c", "Yusei Magic"];

interface Frame {
  id: string;
  display: number;
  transitionTime: number;
  transition: string;
}

const initialFrames: Frame[] = Array.from({ length: 5 }, (_, i) => ({
  id: `f${i + 1}`,
  display: 2.0,
  transitionTime: 0.3,
  transition: "フェード",
}));

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

const CreateFrames = () => {
  const navigate = useNavigate();
  const [frames, setFrames] = useState<Frame[]>(initialFrames);
  const [selectedId, setSelectedId] = useState<string>(initialFrames[0].id);

  const [vertical, setVertical] = useState(false);
  const [text, setText] = useState("運命を変える、その一歩。");
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [font, setFont] = useState("Noto Sans JP");
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState("#1a1a1a");
  const [blend, setBlend] = useState("通常");
  const [strokeColor, setStrokeColor] = useState("#ffffff");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [bgEnabled, setBgEnabled] = useState(true);
  const [bgColor, setBgColor] = useState("#1D9E75");
  const [bgOpacity, setBgOpacity] = useState(80);

  const updateFrame = (id: string, patch: Partial<Frame>) => {
    setFrames((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const addFrame = () => {
    const id = `f${Date.now()}`;
    setFrames((prev) => [...prev, { id, display: 2.0, transitionTime: 0.3, transition: "フェード" }]);
    setSelectedId(id);
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
            <Button onClick={() => navigate("/create/export")}>次へ</Button>
          </>
        }
      />
      <div className="p-8 pb-4 border-b border-border bg-background">
        <StepIndicator steps={steps} current={1} />
      </div>

      <div className="flex-1 grid grid-cols-[40%_60%] min-h-0">
        {/* Left: Frame list */}
        <div className="border-r border-border overflow-y-auto p-6 space-y-4 bg-muted/30">
          <h2 className="text-sm font-semibold">コマ一覧（{frames.length}）</h2>
          {frames.map((f, idx) => {
            const selected = f.id === selectedId;
            return (
              <div
                key={f.id}
                onClick={() => setSelectedId(f.id)}
                className={cn(
                  "rounded-lg border bg-card p-4 cursor-pointer transition-colors",
                  selected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-muted-foreground/30",
                )}
              >
                <div className="flex gap-4">
                  <div className="w-20 h-28 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground shrink-0">
                    コマ{idx + 1}
                  </div>
                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">コマ {idx + 1}</span>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">表示秒数</Label>
                      <div className="flex flex-wrap gap-1">
                        {displayPresets.map((p) => (
                          <button
                            key={p}
                            onClick={(e) => {
                              e.stopPropagation();
                              updateFrame(f.id, { display: p });
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
                          onChange={(e) => updateFrame(f.id, { display: Number(e.target.value) })}
                          onClick={(e) => e.stopPropagation()}
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
                              e.stopPropagation();
                              updateFrame(f.id, { transitionTime: p });
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
                          onChange={(e) => updateFrame(f.id, { transitionTime: Number(e.target.value) })}
                          onClick={(e) => e.stopPropagation()}
                          className="h-6 w-16 text-xs"
                          step="0.1"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">トランジション</Label>
                      <Select
                        value={f.transition}
                        onValueChange={(v) => updateFrame(f.id, { transition: v })}
                      >
                        <SelectTrigger className="h-8 text-xs" onClick={(e) => e.stopPropagation()}>
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
          })}

          <button
            onClick={addFrame}
            className="w-full rounded-lg border-2 border-dashed border-border p-6 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" /> コマを追加
          </button>
        </div>

        {/* Right: Preview + Text edit */}
        <div className="grid grid-cols-[1fr_320px] min-h-0">
          {/* Preview */}
          <div className="overflow-y-auto p-8 flex items-start justify-center bg-muted/20">
            <div
              className="relative bg-muted rounded-lg overflow-hidden shadow-sm"
              style={{ width: 360, height: 450 }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                コマプレビュー
              </div>
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
                onClick={() => setVertical(false)}
                className="flex-1"
              >
                <AlignLeft /> 横書き
              </Button>
              <Button
                variant={vertical ? "default" : "outline"}
                size="sm"
                onClick={() => setVertical(true)}
                className="flex-1"
              >
                <AlignCenter /> 縦書き
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">テキスト</Label>
              <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">位置（プリセット）</Label>
              <div className="grid grid-cols-3 gap-1">
                {gridPositions.map((g) => (
                  <button
                    key={g.label}
                    onClick={() => setPos({ x: g.x, y: g.y })}
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
                  onChange={(e) => setPos({ ...pos, x: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Y (%)</Label>
                <Input
                  type="number"
                  value={pos.y}
                  onChange={(e) => setPos({ ...pos, y: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">フォント</Label>
              <Select value={font} onValueChange={setFont}>
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
                onValueChange={(v) => setFontSize(v[0])}
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
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-14 rounded border border-border cursor-pointer"
                />
                <Input value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">描画モード</Label>
              <Select value={blend} onValueChange={setBlend}>
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
                  onChange={(e) => setStrokeColor(e.target.value)}
                  className="h-9 w-14 rounded border border-border cursor-pointer"
                />
                <Input
                  type="number"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
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
                <Switch checked={bgEnabled} onCheckedChange={setBgEnabled} />
              </div>
              {bgEnabled && (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="h-9 w-14 rounded border border-border cursor-pointer"
                    />
                    <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">透明度：{bgOpacity}%</Label>
                    <Slider
                      value={[bgOpacity]}
                      onValueChange={(v) => setBgOpacity(v[0])}
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
