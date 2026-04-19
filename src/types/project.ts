import type { BasicData, ExportSettings, FrameData, TextSettings } from "@/contexts/CreateFlowContext";

export type ProjectStatus = "draft" | "exported";

export type FrameMetadata = {
  id: string;
  fileName: string | null;
  display: number;
  transitionTime: number;
  transition: string;
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
  textSettings: TextSettings;
  exportSettings: ExportSettings;
};

export const stripFrameImages = (frames: FrameData[]): FrameMetadata[] =>
  frames.map((f) => ({
    id: f.id,
    fileName: f.name ?? null,
    display: f.display,
    transitionTime: f.transitionTime,
    transition: f.transition,
  }));

export const restoreFramesFromMetadata = (meta: FrameMetadata[]): FrameData[] =>
  meta.map((m) => ({
    id: m.id,
    display: m.display,
    transitionTime: m.transitionTime,
    transition: m.transition,
    image: null,
    name: m.fileName ?? undefined,
  }));
