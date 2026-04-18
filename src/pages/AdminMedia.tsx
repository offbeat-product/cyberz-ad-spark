import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Pencil, Plus, Star, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import type { Box, Transition } from "@/components/admin/MediaPreview";
import TransitionDemo from "@/components/admin/TransitionDemo";
import AssetFormModal, { AssetFormValue } from "@/components/admin/AssetFormModal";
import { useMediaMasters, type Frame, type Logo, type MediaMaster } from "@/hooks/useMediaMasters";

const transitionLabels: Record<Transition, string> = {
  none: "なし",
  "slide-lr": "スライド左→右",
  "slide-tb": "スライド上→下",
  fade: "フェード",
  "zoom-in": "ズームイン",
};

const switchPresets = [0.2, 0.3, 0.5, 0.8, 1.0];
const displayPresets = [1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0];

interface Frame {
  id: string;
  mediaMasterId: string;
  name: string;
  imageUrl: string | null;
  position: Box;
  isDefault: boolean;
}

interface Logo {
  id: string;
  mediaMasterId: string;
  name: string;
  imageUrl: string | null;
  position: Box;
  isDefault: boolean;
}

interface MediaMaster {
  id: string;
  name: string;
  transition: Transition;
  switchSec: number;
  displaySec: number;
  bgColor: string;
  noLogo: boolean;
}

const initialMedia: MediaMaster[] = [
  { id: "1", name: "ピッコマ", transition: "fade", switchSec: 0.3, displaySec: 2.0, bgColor: "#000000", noLogo: false },
  { id: "2", name: "コミックシーモア", transition: "slide-lr", switchSec: 0.5, displaySec: 2.5, bgColor: "#000000", noLogo: false },
  { id: "3", name: "まんが王国", transition: "zoom-in", switchSec: 0.3, displaySec: 3.0, bgColor: "#000000", noLogo: false },
];

const blankMaster = (): Omit<MediaMaster, "id"> => ({
  name: "",
  transition: "fade",
  switchSec: 0.3,
  displaySec: 2.0,
  bgColor: "#000000",
  noLogo: false,
});

const uid = () => Math.random().toString(36).slice(2, 10);

const AdminMedia = () => {
  const [media, setMedia] = useState<MediaMaster[]>(initialMedia);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [logos, setLogos] = useState<Logo[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Master modal
  const [masterOpen, setMasterOpen] = useState(false);
  const [editingMasterId, setEditingMasterId] = useState<string | null>(null);
  const [masterForm, setMasterForm] = useState<Omit<MediaMaster, "id">>(blankMaster());
  // Wizard: 1 = basic info, 2 = frames/logos.
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  // Holds the in-progress master id once step 1 completes.
  const [wizardMasterId, setWizardMasterId] = useState<string | null>(null);

  // Asset modal
  const [assetModal, setAssetModal] = useState<{
    open: boolean;
    kind: "frame" | "logo";
    mediaId: string;
    initial: AssetFormValue | null;
  }>({ open: false, kind: "frame", mediaId: "", initial: null });

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreateMaster = () => {
    setMasterForm(blankMaster());
    setEditingMasterId(null);
    setWizardStep(1);
    setWizardMasterId(null);
    setMasterOpen(true);
  };

  const openEditMaster = (m: MediaMaster) => {
    const { id, ...rest } = m;
    setMasterForm(rest);
    setEditingMasterId(id);
    setWizardStep(1);
    setWizardMasterId(id);
    setMasterOpen(true);
  };

  // Step 1 → save (or update) and move to step 2.
  const submitStep1 = () => {
    if (!masterForm.name.trim()) {
      toast.error("媒体名を入力してください");
      return;
    }
    if (editingMasterId) {
      setMedia((p) =>
        p.map((m) => (m.id === editingMasterId ? { id: editingMasterId, ...masterForm } : m)),
      );
      setWizardMasterId(editingMasterId);
    } else {
      const newId = uid();
      setMedia((p) => [...p, { id: newId, ...masterForm }]);
      setWizardMasterId(newId);
    }
    setWizardStep(2);
  };

  const finishWizard = (showToast: boolean) => {
    if (wizardMasterId && !editingMasterId) {
      setExpanded((prev) => new Set(prev).add(wizardMasterId));
    }
    if (showToast) {
      toast.success(editingMasterId ? "媒体を更新しました" : "媒体を追加しました");
    }
    setMasterOpen(false);
  };

  const cancelWizard = () => {
    setMasterOpen(false);
  };

  const deleteMaster = (id: string) => {
    setMedia((p) => p.filter((m) => m.id !== id));
    setFrames((p) => p.filter((f) => f.mediaMasterId !== id));
    setLogos((p) => p.filter((l) => l.mediaMasterId !== id));
    toast.success("媒体を削除しました");
  };

  const openAddAsset = (mediaId: string, kind: "frame" | "logo") => {
    setAssetModal({ open: true, kind, mediaId, initial: null });
  };

  const openEditAsset = (mediaId: string, kind: "frame" | "logo", asset: Frame | Logo) => {
    setAssetModal({
      open: true,
      kind,
      mediaId,
      initial: {
        id: asset.id,
        name: asset.name,
        imageUrl: asset.imageUrl,
        position: asset.position,
        isDefault: asset.isDefault,
      },
    });
  };

  const saveAsset = (value: AssetFormValue) => {
    const { kind, mediaId, initial } = assetModal;
    const setter = kind === "frame" ? setFrames : setLogos;
    setter((prev: any) => {
      let next = [...prev];
      // If marked default, clear others for same master
      if (value.isDefault) {
        next = next.map((a) => (a.mediaMasterId === mediaId ? { ...a, isDefault: false } : a));
      }
      if (initial?.id) {
        next = next.map((a) =>
          a.id === initial.id
            ? { ...a, name: value.name, imageUrl: value.imageUrl, position: value.position, isDefault: value.isDefault }
            : a,
        );
      } else {
        next.push({
          id: uid(),
          mediaMasterId: mediaId,
          name: value.name,
          imageUrl: value.imageUrl,
          position: value.position,
          isDefault: value.isDefault,
        });
      }
      return next;
    });
    toast.success(initial?.id ? "更新しました" : "追加しました");
  };

  const deleteAsset = (kind: "frame" | "logo", id: string) => {
    const setter = kind === "frame" ? setFrames : setLogos;
    setter((prev: any) => prev.filter((a: any) => a.id !== id));
    toast.success("削除しました");
  };

  const setDefaultAsset = (kind: "frame" | "logo", mediaId: string, id: string) => {
    const setter = kind === "frame" ? setFrames : setLogos;
    setter((prev: any) =>
      prev.map((a: any) =>
        a.mediaMasterId === mediaId ? { ...a, isDefault: a.id === id } : a,
      ),
    );
  };

  const setNoLogo = (mediaId: string, value: boolean) => {
    setMedia((p) => p.map((m) => (m.id === mediaId ? { ...m, noLogo: value } : m)));
  };

  return (
    <>
      <PageHeader
        title="媒体マスター管理"
        description="広告媒体の登録・編集を行います"
        actions={
          <Button onClick={openCreateMaster}>
            <Plus /> 媒体を追加
          </Button>
        }
      />
      <div className="p-8">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-10" />
                <TableHead>媒体名</TableHead>
                <TableHead>フレーム</TableHead>
                <TableHead>ロゴ</TableHead>
                <TableHead>デフォルトトランジション</TableHead>
                <TableHead>表示秒数</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {media.map((m) => {
                const isOpen = expanded.has(m.id);
                const mediaFrames = frames.filter((f) => f.mediaMasterId === m.id);
                const mediaLogos = logos.filter((l) => l.mediaMasterId === m.id);
                return (
                  <>
                    <TableRow key={m.id} className="cursor-pointer" onClick={() => toggleExpand(m.id)}>
                      <TableCell>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="text-muted-foreground">{mediaFrames.length}件</TableCell>
                      <TableCell className="text-muted-foreground">
                        {m.noLogo ? "なし" : `${mediaLogos.length}件`}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{transitionLabels[m.transition]}</TableCell>
                      <TableCell className="text-muted-foreground">{m.displaySec}秒</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" onClick={() => openEditMaster(m)}>
                          <Pencil />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMaster(m.id)}>
                          <Trash2 />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {isOpen && (
                      <TableRow key={`${m.id}-exp`} className="hover:bg-transparent">
                        <TableCell colSpan={7} className="bg-muted/20 p-6">
                          <div className="grid grid-cols-2 gap-8">
                            {/* Frames */}
                            <AssetSection
                              title="フレーム一覧"
                              kind="frame"
                              assets={mediaFrames}
                              onAdd={() => openAddAsset(m.id, "frame")}
                              onEdit={(a) => openEditAsset(m.id, "frame", a)}
                              onDelete={(id) => deleteAsset("frame", id)}
                              onSetDefault={(id) => setDefaultAsset("frame", m.id, id)}
                            />
                            {/* Logos */}
                            <div className="space-y-4">
                              <AssetSection
                                title="ロゴ一覧"
                                kind="logo"
                                assets={mediaLogos}
                                disabled={m.noLogo}
                                onAdd={() => openAddAsset(m.id, "logo")}
                                onEdit={(a) => openEditAsset(m.id, "logo", a)}
                                onDelete={(id) => deleteAsset("logo", id)}
                                onSetDefault={(id) => setDefaultAsset("logo", m.id, id)}
                              />
                              <div className="flex items-center gap-2 pl-1">
                                <Checkbox
                                  id={`nologo-${m.id}`}
                                  checked={m.noLogo}
                                  onCheckedChange={(v) => setNoLogo(m.id, !!v)}
                                />
                                <Label htmlFor={`nologo-${m.id}`} className="cursor-pointer text-sm">
                                  ロゴなし（この媒体ではロゴを使用しない）
                                </Label>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Media master modal — 2-step wizard */}
      <Dialog open={masterOpen} onOpenChange={(v) => !v && cancelWizard()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMasterId ? "媒体を編集" : "媒体を追加"} ({wizardStep}/2)
            </DialogTitle>
            <DialogDescription>
              {wizardStep === 1
                ? "媒体の基本情報を入力します。"
                : "フレームとロゴを登録してください。後から追加・編集もできます。"}
            </DialogDescription>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-3 py-2">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  wizardStep === 1
                    ? "bg-gradient-to-r from-[#409EEA] to-[#6C81FC] text-white"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {wizardStep === 1 ? "1" : <Check className="h-3.5 w-3.5" />}
              </div>
              <span className={`text-sm ${wizardStep === 1 ? "font-semibold" : "text-muted-foreground"}`}>
                基本情報
              </span>
            </div>
            <div className="h-px flex-1 bg-border" />
            <div className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  wizardStep === 2
                    ? "bg-gradient-to-r from-[#409EEA] to-[#6C81FC] text-white"
                    : "border border-border bg-background text-muted-foreground"
                }`}
              >
                2
              </div>
              <span className={`text-sm ${wizardStep === 2 ? "font-semibold" : "text-muted-foreground"}`}>
                フレーム・ロゴ設定
              </span>
            </div>
          </div>

          {wizardStep === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>
                  媒体名 <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={masterForm.name}
                  onChange={(e) => setMasterForm({ ...masterForm, name: e.target.value })}
                  placeholder="例：ピッコマ"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>デフォルトトランジション</Label>
                <Select
                  value={masterForm.transition}
                  onValueChange={(v: Transition) => setMasterForm({ ...masterForm, transition: v })}
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
              </div>

              <PresetField
                label="デフォルト切り替え秒数"
                presets={switchPresets}
                value={masterForm.switchSec}
                onChange={(v) => setMasterForm({ ...masterForm, switchSec: v })}
              />

              <PresetField
                label="デフォルト表示秒数"
                presets={displayPresets}
                value={masterForm.displaySec}
                onChange={(v) => setMasterForm({ ...masterForm, displaySec: v })}
              />

              <div className="space-y-2">
                <Label>デフォルト背景色</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={masterForm.bgColor}
                    onChange={(e) => setMasterForm({ ...masterForm, bgColor: e.target.value })}
                    className="h-10 w-16 rounded border border-border bg-background cursor-pointer"
                  />
                  <Input
                    value={masterForm.bgColor}
                    onChange={(e) => setMasterForm({ ...masterForm, bgColor: e.target.value })}
                    className="w-32 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {wizardStep === 2 && wizardMasterId && (
            <WizardStep2
              mediaId={wizardMasterId}
              frames={frames.filter((f) => f.mediaMasterId === wizardMasterId)}
              logos={logos.filter((l) => l.mediaMasterId === wizardMasterId)}
              noLogo={media.find((m) => m.id === wizardMasterId)?.noLogo ?? false}
              onAddFrame={() => openAddAsset(wizardMasterId, "frame")}
              onAddLogo={() => openAddAsset(wizardMasterId, "logo")}
              onEditFrame={(a) => openEditAsset(wizardMasterId, "frame", a)}
              onEditLogo={(a) => openEditAsset(wizardMasterId, "logo", a)}
              onDeleteFrame={(id) => deleteAsset("frame", id)}
              onDeleteLogo={(id) => deleteAsset("logo", id)}
              onSetDefaultFrame={(id) => setDefaultAsset("frame", wizardMasterId, id)}
              onSetDefaultLogo={(id) => setDefaultAsset("logo", wizardMasterId, id)}
              onNoLogoChange={(v) => setNoLogo(wizardMasterId, v)}
            />
          )}

          <DialogFooter className="mt-4">
            {wizardStep === 1 ? (
              <>
                <Button variant="outline" onClick={cancelWizard}>
                  キャンセル
                </Button>
                <Button
                  onClick={submitStep1}
                  className="bg-gradient-to-r from-[#409EEA] to-[#6C81FC] text-white border-transparent hover:opacity-90"
                >
                  次へ <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </>
            ) : (
              <div className="flex w-full items-center justify-between gap-2">
                <Button variant="outline" onClick={() => setWizardStep(1)}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> 戻る
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => finishWizard(true)}>
                    後で設定する
                  </Button>
                  <Button
                    onClick={() => finishWizard(true)}
                    className="bg-gradient-to-r from-[#409EEA] to-[#6C81FC] text-white border-transparent hover:opacity-90"
                  >
                    完了
                  </Button>
                </div>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Asset modal */}
      <AssetFormModal
        open={assetModal.open}
        onOpenChange={(v) => setAssetModal((p) => ({ ...p, open: v }))}
        kind={assetModal.kind}
        initial={assetModal.initial}
        onSave={saveAsset}
        availableFrames={
          assetModal.kind === "logo"
            ? frames
                .filter((f) => f.mediaMasterId === assetModal.mediaId)
                .map((f) => ({
                  id: f.id,
                  name: f.name,
                  imageUrl: f.imageUrl,
                  width: f.position.w,
                  height: f.position.h,
                  isDefault: f.isDefault,
                }))
            : []
        }
      />
    </>
  );
};

interface WizardStep2Props {
  mediaId: string;
  frames: Frame[];
  logos: Logo[];
  noLogo: boolean;
  onAddFrame: () => void;
  onAddLogo: () => void;
  onEditFrame: (a: Frame) => void;
  onEditLogo: (a: Logo) => void;
  onDeleteFrame: (id: string) => void;
  onDeleteLogo: (id: string) => void;
  onSetDefaultFrame: (id: string) => void;
  onSetDefaultLogo: (id: string) => void;
  onNoLogoChange: (v: boolean) => void;
}

const WizardStep2 = ({
  frames,
  logos,
  noLogo,
  onAddFrame,
  onAddLogo,
  onEditFrame,
  onEditLogo,
  onDeleteFrame,
  onDeleteLogo,
  onSetDefaultFrame,
  onSetDefaultLogo,
  onNoLogoChange,
}: WizardStep2Props) => {
  const gradientBtn =
    "bg-gradient-to-r from-[#409EEA] to-[#6C81FC] text-white border-transparent hover:opacity-90";
  return (
    <div className="space-y-6">
      {/* Frames */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">フレーム一覧</h4>
          {frames.length > 0 && (
            <Button size="sm" className={gradientBtn} onClick={onAddFrame}>
              <Plus className="h-3 w-3" /> フレームを追加
            </Button>
          )}
        </div>
        {frames.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-background p-6 text-center">
            <div className="mb-3 text-xs text-muted-foreground">まだフレームが登録されていません</div>
            <Button size="sm" className={gradientBtn} onClick={onAddFrame}>
              <Plus className="h-3 w-3" /> フレームを追加
            </Button>
          </div>
        ) : (
          <AssetSection
            title=""
            kind="frame"
            assets={frames}
            onAdd={onAddFrame}
            onEdit={(a) => onEditFrame(a as Frame)}
            onDelete={onDeleteFrame}
            onSetDefault={onSetDefaultFrame}
            hideHeader
          />
        )}
      </div>

      <Separator />

      {/* Logos */}
      <div className={`space-y-3 ${noLogo ? "opacity-60" : ""}`}>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">ロゴ一覧</h4>
          {logos.length > 0 && !noLogo && (
            <Button size="sm" className={gradientBtn} onClick={onAddLogo}>
              <Plus className="h-3 w-3" /> ロゴを追加
            </Button>
          )}
        </div>
        {logos.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-background p-6 text-center">
            <div className="mb-3 text-xs text-muted-foreground">まだロゴが登録されていません</div>
            <Button size="sm" className={gradientBtn} onClick={onAddLogo} disabled={noLogo}>
              <Plus className="h-3 w-3" /> ロゴを追加
            </Button>
          </div>
        ) : (
          <AssetSection
            title=""
            kind="logo"
            assets={logos}
            disabled={noLogo}
            onAdd={onAddLogo}
            onEdit={(a) => onEditLogo(a as Logo)}
            onDelete={onDeleteLogo}
            onSetDefault={onSetDefaultLogo}
            hideHeader
          />
        )}
        <div className="flex items-center gap-2 pl-1">
          <Checkbox
            id="wizard-nologo"
            checked={noLogo}
            onCheckedChange={(v) => onNoLogoChange(!!v)}
          />
          <Label htmlFor="wizard-nologo" className="cursor-pointer text-sm">
            ロゴなし（この媒体ではロゴを使用しない）
          </Label>
        </div>
      </div>
    </div>
  );
};

interface AssetSectionProps {
  title: string;
  kind: "frame" | "logo";
  assets: (Frame | Logo)[];
  disabled?: boolean;
  hideHeader?: boolean;
  onAdd: () => void;
  onEdit: (a: Frame | Logo) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

const AssetSection = ({
  title,
  kind,
  assets,
  disabled,
  hideHeader,
  onAdd,
  onEdit,
  onDelete,
  onSetDefault,
}: AssetSectionProps) => (
  <div className={`space-y-3 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
    {!hideHeader && (
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{title}</h4>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus className="h-3 w-3" />
          {kind === "frame" ? "フレームを追加" : "ロゴを追加"}
        </Button>
      </div>
    )}
    {assets.length === 0 ? (
      <div className="rounded-md border border-dashed border-border bg-background py-6 text-center text-xs text-muted-foreground">
        まだ登録されていません
      </div>
    ) : (
      <div className="grid grid-cols-2 gap-3">
        {assets.map((a) => (
          <div
            key={a.id}
            className="rounded-md border border-border bg-background p-3 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {a.imageUrl ? (
                  <div
                    className="flex items-center justify-center rounded border border-border flex-shrink-0 overflow-hidden"
                    style={{ width: 80, height: 80, backgroundColor: "#f8f8f8" }}
                  >
                    <img
                      src={a.imageUrl}
                      alt={a.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div
                    className="rounded border border-dashed border-border flex-shrink-0"
                    style={{ width: 80, height: 80, backgroundColor: "#f8f8f8" }}
                  />
                )}
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{a.name}</div>
                  {a.isDefault && (
                    <Badge className="mt-0.5" variant="secondary">
                      デフォルト
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-1">
              {!a.isDefault && (
                <Button
                  size="icon"
                  variant="ghost"
                  title="デフォルトに設定"
                  onClick={() => onSetDefault(a.id)}
                >
                  <Star className="h-4 w-4" />
                </Button>
              )}
              <Button size="icon" variant="ghost" onClick={() => onEdit(a)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => onDelete(a.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    )}
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
