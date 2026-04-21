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

/** @deprecated 新形式ではプリセット位置は廃止。読み込み時の後方互換のみで参照。 */
export type CopyrightPosPreset =
  | "top-left" | "top-center" | "top-right"
  | "middle-left" | "middle-center" | "middle-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

export type CopyrightSettings = {
  show: boolean;
  size: number;
  font: string;
  color: string;
  /**
   * 新座標系: 左下原点・Y正=下方向（画像下端からグレー余白側へ）。
   * 旧形式ではプリセット位置からの delta（`pos` と併用）。読み込み時に新座標系へ変換される。
   */
  offset: { x: number; y: number };
  /** @deprecated 旧形式: プリセット位置。新形式では使用せず、読み込み時に offset へ統合される。 */
  pos?: CopyrightPosPreset;
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
