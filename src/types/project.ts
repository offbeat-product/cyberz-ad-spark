import type { BasicData, ExportSettings, FrameData, TextSettings } from "@/contexts/CreateFlowContext";

export type ProjectStatus = "draft" | "exported";

export type FrameMetadata = {
  id: string;
  fileName: string | null;
  display: number;
  transitionTime: number;
  transition: string;
  /** Per-frame text settings. Optional for backward compatibility with old drafts. */
  textSettings?: TextSettings;
};

export type CopyrightPosPreset =
  | "top-left" | "top-center" | "top-right"
  | "middle-left" | "middle-center" | "middle-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

export type CopyrightSettings = {
  show: boolean;
  size: number;
  font: string;
  color: string;
  pos: CopyrightPosPreset;
  offset: { x: number; y: number };
};

export type SavedProject = {
  id: string;
  title: string;
  mediaId: string;
  mediaName: string;
  status: ProjectStatus;
  lastEditedStep: 1 | 2 | 3;
  createdAt: string;
  updatedAt: string;
  basic: BasicData;
  frames: FrameMetadata[];
  /** @deprecated 旧形式: 作品単位のテキスト設定。新形式では frames[i].textSettings を使用。 */
  textSettings?: TextSettings;
  exportSettings: ExportSettings;
  /** ロゴ選択 ID（"none" or asset id）。古い保存データには無い場合あり。 */
  logoId?: string;
  /** コピーライト詳細設定。古い保存データには無い場合あり。 */
  copyright?: CopyrightSettings;
};

export const stripFrameImages = (frames: FrameData[]): FrameMetadata[] =>
  frames.map((f) => ({
    id: f.id,
    fileName: f.name ?? null,
    display: f.display,
    transitionTime: f.transitionTime,
    transition: f.transition,
    textSettings: f.textSettings,
  }));

export const restoreFramesFromMetadata = (meta: FrameMetadata[]): FrameData[] =>
  meta.map((m) => ({
    id: m.id,
    display: m.display,
    transitionTime: m.transitionTime,
    transition: m.transition,
    image: null,
    name: m.fileName ?? undefined,
    textSettings: m.textSettings,
  }));
