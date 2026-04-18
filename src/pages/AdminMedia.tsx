import { useRef, useState } from "react";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import MediaPreview, { Box, Transition } from "@/components/admin/MediaPreview";

const transitionLabels: Record<Transition, string> = {
  none: "なし",
  "slide-lr": "スライド左→右",
  "slide-tb": "スライド上→下",
  fade: "フェード",
  "zoom-in": "ズームイン",
};

const switchPresets = [0.2, 0.3, 0.5, 0.8, 1.0];
const displayPresets = [1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0];

interface Media {
  id: string;
  name: string;
  frameImage: string | null;
  logoImage: string | null;
  framePos: Box;
  logoPos: Box;
  frameVisible: boolean;
  logoVisible: boolean;
  transition: Transition;
  switchSec: number;
  displaySec: number;
  bgColor: string;
}

const initial: Media[] = [
  {
    id: "1",
    name: "ピッコマ",
    frameImage: null,
    logoImage: null,
    framePos: { x: 0, y: 0, w: 1080, h: 1350 },
    logoPos: { x: 40, y: 40, w: 200, h: 80 },
    frameVisible: true,
    logoVisible: true,
    transition: "fade",
    switchSec: 0.3,
    displaySec: 2.0,
    bgColor: "#000000",
  },
  {
    id: "2",
    name: "コミックシーモア",
    frameImage: null,
    logoImage: null,
    framePos: { x: 0, y: 0, w: 1080, h: 1080 },
    logoPos: { x: 40, y: 40, w: 200, h: 80 },
    frameVisible: true,
    logoVisible: true,
    transition: "slide-lr",
    switchSec: 0.5,
    displaySec: 2.5,
    bgColor: "#000000",
  },
  {
    id: "3",
    name: "まんが王国",
    frameImage: null,
    logoImage: null,
    framePos: { x: 0, y: 0, w: 1080, h: 1920 },
    logoPos: { x: 40, y: 40, w: 200, h: 80 },
    frameVisible: true,
    logoVisible: true,
    transition: "zoom-in",
    switchSec: 0.3,
    displaySec: 3.0,
    bgColor: "#000000",
  },
];

const blankForm = (): Omit<Media, "id"> => ({
  name: "",
  frameImage: null,
  logoImage: null,
  framePos: { x: 0, y: 0, w: 1080, h: 1350 },
  logoPos: { x: 40, y: 40, w: 200, h: 80 },
  frameVisible: true,
  logoVisible: true,
  transition: "fade",
  switchSec: 0.3,
  displaySec: 2.0,
  bgColor: "#000000",
});

const AdminMedia = () => {
  const [media, setMedia] = useState<Media[]>(initial);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Media, "id">>(blankForm());
  const frameInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined, key: "frameImage" | "logoImage") => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((p) => ({ ...p, [key]: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!form.name) {
      toast.error("媒体名を入力してください");
      return;
    }
    if (editingId) {
      setMedia((prev) => prev.map((m) => (m.id === editingId ? { id: editingId, ...form } : m)));
      toast.success("媒体を更新しました");
    } else {
      setMedia((prev) => [...prev, { id: String(Date.now()), ...form }]);
      toast.success("媒体を追加しました");
    }
    setForm(blankForm());
    setEditingId(null);
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setMedia((prev) => prev.filter((m) => m.id !== id));
    toast.success("媒体を削除しました");
  };

  const openCreate = () => {
    setForm(blankForm());
    setEditingId(null);
    setOpen(true);
  };

  const openEdit = (m: Media) => {
    const { id, ...rest } = m;
    setForm(rest);
    setEditingId(id);
    setOpen(true);
  };

  return (
    <>
      <PageHeader
        title="媒体マスター管理"
        description="広告媒体の登録・編集を行います"
        actions={
          <Button onClick={openCreate}>
            <Plus /> 媒体を追加
          </Button>
        }
      />
      <div className="p-8">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>媒体名</TableHead>
                <TableHead>フレーム画像</TableHead>
                <TableHead>デフォルトトランジション</TableHead>
                <TableHead>表示秒数</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {media.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>
                    {m.frameImage ? (
                      <img
                        src={m.frameImage}
                        alt={`${m.name} frame`}
                        className="h-12 w-12 rounded border border-border object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
                        なし
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {transitionLabels[m.transition]}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{m.displaySec}秒</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                      <Pencil />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}>
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
          <div className="grid grid-cols-[60%_40%] max-h-[90vh]">
            {/* LEFT: Form */}
            <div className="overflow-y-auto p-6 border-r border-border">
              <DialogHeader className="mb-4">
                <DialogTitle>{editingId ? "媒体を編集" : "媒体を追加"}</DialogTitle>
                <DialogDescription>
                  {editingId ? "既存の媒体設定を更新します。" : "新しい広告媒体を登録します。"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* 基本情報 */}
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">基本情報</h3>
                  <div className="space-y-2">
                    <Label>
                      媒体名 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="例：LINEマンガ"
                    />
                  </div>
                </section>

                <Separator />

                {/* 画像設定 */}
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">画像設定</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <UploadArea
                      label="フレーム画像をアップロード"
                      preview={form.frameImage}
                      onClick={() => frameInputRef.current?.click()}
                    />
                    <input
                      ref={frameInputRef}
                      type="file"
                      accept="image/png,image/*"
                      className="hidden"
                      onChange={(e) => handleFile(e.target.files?.[0], "frameImage")}
                    />

                    <UploadArea
                      label="ロゴ画像をアップロード"
                      preview={form.logoImage}
                      onClick={() => logoInputRef.current?.click()}
                    />
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/*"
                      className="hidden"
                      onChange={(e) => handleFile(e.target.files?.[0], "logoImage")}
                    />
                  </div>
                </section>

                <Separator />

                {/* 位置設定 */}
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">フレーム・ロゴの位置設定</h3>

                  <PositionFields
                    label="フレーム位置・サイズ"
                    value={form.framePos}
                    onChange={(v) => setForm({ ...form, framePos: v })}
                  />
                  <div className="flex items-center justify-between">
                    <Label>フレーム表示</Label>
                    <Switch
                      checked={form.frameVisible}
                      onCheckedChange={(v) => setForm({ ...form, frameVisible: v })}
                    />
                  </div>

                  <PositionFields
                    label="ロゴ位置・サイズ"
                    value={form.logoPos}
                    onChange={(v) => setForm({ ...form, logoPos: v })}
                  />
                  <div className="flex items-center justify-between">
                    <Label>ロゴ表示</Label>
                    <Switch
                      checked={form.logoVisible}
                      onCheckedChange={(v) => setForm({ ...form, logoVisible: v })}
                    />
                  </div>
                </section>

                <Separator />

                {/* デフォルト設定 */}
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">デフォルト設定</h3>

                  <div className="space-y-2">
                    <Label>デフォルトトランジション</Label>
                    <Select
                      value={form.transition}
                      onValueChange={(v: Transition) => setForm({ ...form, transition: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(transitionLabels) as Transition[]).map((k) => (
                          <SelectItem key={k} value={k}>
                            {transitionLabels[k]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      右側プレビューの「トランジション再生」で動作確認できます
                    </p>
                  </div>

                  <PresetField
                    label="デフォルト切り替え秒数"
                    presets={switchPresets}
                    value={form.switchSec}
                    onChange={(v) => setForm({ ...form, switchSec: v })}
                  />

                  <PresetField
                    label="デフォルト表示秒数"
                    presets={displayPresets}
                    value={form.displaySec}
                    onChange={(v) => setForm({ ...form, displaySec: v })}
                  />
                </section>

                <Separator />

                {/* リサイズ設定 */}
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">リサイズ設定</h3>
                  <div className="space-y-2">
                    <Label>デフォルト背景色</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={form.bgColor}
                        onChange={(e) => setForm({ ...form, bgColor: e.target.value })}
                        className="h-10 w-16 rounded border border-border bg-background cursor-pointer"
                      />
                      <Input
                        value={form.bgColor}
                        onChange={(e) => setForm({ ...form, bgColor: e.target.value })}
                        className="w-32 font-mono"
                      />
                    </div>
                  </div>
                </section>
              </div>

              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleSave}>{editingId ? "更新" : "保存"}</Button>
              </DialogFooter>
            </div>

            {/* RIGHT: Preview */}
            <div className="overflow-y-auto bg-muted/20 p-6">
              <MediaPreview
                frameImage={form.frameImage}
                logoImage={form.logoImage}
                framePos={form.framePos}
                logoPos={form.logoPos}
                frameVisible={form.frameVisible}
                logoVisible={form.logoVisible}
                bgColor={form.bgColor}
                transition={form.transition}
                onFramePosChange={(v) => setForm((p) => ({ ...p, framePos: v }))}
                onLogoPosChange={(v) => setForm((p) => ({ ...p, logoPos: v }))}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

interface UploadAreaProps {
  label: string;
  preview: string | null;
  onClick: () => void;
}

const UploadArea = ({ label, preview, onClick }: UploadAreaProps) => (
  <button
    type="button"
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/20 p-4 text-center transition-colors hover:bg-muted/40 min-h-[140px]"
  >
    {preview ? (
      <img src={preview} alt={label} className="max-h-24 rounded object-contain" />
    ) : (
      <Upload className="h-6 w-6 text-muted-foreground" />
    )}
    <span className="text-xs text-muted-foreground">{label}</span>
  </button>
);

interface PositionFieldsProps {
  label: string;
  value: Box;
  onChange: (v: Box) => void;
}

const PositionFields = ({ label, value, onChange }: PositionFieldsProps) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <div className="grid grid-cols-4 gap-2">
      {(["x", "y", "w", "h"] as const).map((k) => (
        <div key={k} className="space-y-1">
          <span className="text-xs text-muted-foreground">
            {k === "w" ? "幅" : k === "h" ? "高さ" : k.toUpperCase()} (px)
          </span>
          <Input
            type="number"
            value={value[k]}
            onChange={(e) => onChange({ ...value, [k]: Number(e.target.value) })}
          />
        </div>
      ))}
    </div>
  </div>
);

interface PresetFieldProps {
  label: string;
  presets: number[];
  value: number;
  onChange: (v: number) => void;
}

const PresetField = ({ label, presets, value, onChange }: PresetFieldProps) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <div className="flex flex-wrap gap-2">
      {presets.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
            value === p
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background text-foreground hover:bg-muted"
          }`}
        >
          {p.toFixed(1)}秒
        </button>
      ))}
      <div className="flex items-center gap-2">
        <Input
          type="number"
          step="0.1"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24"
        />
        <span className="text-xs text-muted-foreground">秒</span>
      </div>
    </div>
  </div>
);

export default AdminMedia;
