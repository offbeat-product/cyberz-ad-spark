import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { SavedProject } from "@/types/project";
import { restoreFramesFromMetadata, stripFrameImages } from "@/types/project";

export interface FrameData {
  id: string;
  display: number;
  transitionTime: number;
  transition: string;
  image?: string | null;
  name?: string;
}

export interface BasicData {
  title: string;
  mediaId: string;
  media: string;
  copyright: string;
}

export interface TextSettings {
  visible: boolean;
  vertical: boolean;
  text: string;
  pos: { x: number; y: number };
  font: string;
  fontSize: number;
  color: string;
  blend: string;
  strokeColor: string;
  strokeWidth: number;
  bgEnabled: boolean;
  bgColor: string;
  bgOpacity: number;
}

export interface ExportSettings {
  bgm: string;
  selectedFormats: string[];
  bgColor: string;
  showFrame: boolean;
  showLogo: boolean;
  /** Per-format background color override. null/undefined => use media master default */
  formatBgColors: Record<string, string | null>;
}

const defaultBasic: BasicData = { title: "", mediaId: "", media: "", copyright: "" };

const defaultText: TextSettings = {
  visible: true,
  vertical: false,
  text: "運命を変える、その一歩。",
  pos: { x: 50, y: 50 },
  font: "Noto Sans JP",
  fontSize: 48,
  color: "#1a1a1a",
  blend: "通常",
  strokeColor: "#ffffff",
  strokeWidth: 2,
  bgEnabled: true,
  bgColor: "#1D9E75",
  bgOpacity: 80,
};

const defaultFrames: FrameData[] = [];

const defaultExport: ExportSettings = {
  bgm: "fantasy",
  selectedFormats: ["main"],
  bgColor: "#FFFFFF",
  showFrame: true,
  showLogo: true,
  formatBgColors: {},
};

const STORAGE_KEY = "adgen-cyberz-projects";

const readProjects = (): SavedProject[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedProject[]) : [];
  } catch {
    return [];
  }
};

const writeProjects = (projects: SavedProject[]) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error("Failed to persist projects:", e);
  }
};

interface CreateFlowContextValue {
  basic: BasicData;
  setBasic: (b: BasicData | ((prev: BasicData) => BasicData)) => void;
  frames: FrameData[];
  setFrames: (f: FrameData[] | ((prev: FrameData[]) => FrameData[])) => void;
  textSettings: TextSettings;
  setTextSettings: (t: TextSettings | ((prev: TextSettings) => TextSettings)) => void;
  exportSettings: ExportSettings;
  setExportSettings: (e: ExportSettings | ((prev: ExportSettings) => ExportSettings)) => void;
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
  saveAsDraft: (opts?: { step?: 1 | 2 | 3; silent?: boolean; status?: "draft" | "exported" }) => string;
  loadProject: (id: string) => SavedProject | null;
  reset: () => void;
}

const CreateFlowContext = createContext<CreateFlowContextValue | null>(null);

export const CreateFlowProvider = ({ children }: { children: ReactNode }) => {
  const [basic, setBasic] = useState<BasicData>(defaultBasic);
  const [frames, setFrames] = useState<FrameData[]>(defaultFrames);
  const [textSettings, setTextSettings] = useState<TextSettings>(defaultText);
  const [exportSettings, setExportSettings] = useState<ExportSettings>(defaultExport);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  // Refs to access latest state inside saveAsDraft without stale closures
  const stateRef = useRef({ basic, frames, textSettings, exportSettings, currentProjectId });
  stateRef.current = { basic, frames, textSettings, exportSettings, currentProjectId };

  const reset = useCallback(() => {
    setBasic(defaultBasic);
    setFrames(defaultFrames);
    setTextSettings(defaultText);
    setExportSettings(defaultExport);
    setCurrentProjectId(null);
  }, []);

  const saveAsDraft = useCallback<CreateFlowContextValue["saveAsDraft"]>((opts) => {
    const { basic: b, frames: f, textSettings: t, exportSettings: e, currentProjectId: cid } = stateRef.current;
    const step = opts?.step ?? 1;
    const status = opts?.status ?? "draft";
    const id = cid ?? `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const all = readProjects();
    const existing = all.find((p) => p.id === id);
    const project: SavedProject = {
      id,
      title: b.title || "（無題）",
      mediaId: b.mediaId,
      mediaName: b.media,
      status,
      lastEditedStep: step,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      basic: b,
      frames: stripFrameImages(f),
      textSettings: t,
      exportSettings: e,
    };
    const next = existing
      ? all.map((p) => (p.id === id ? project : p))
      : [...all, project];
    writeProjects(next);

    if (!cid) setCurrentProjectId(id);
    if (!opts?.silent) toast.success("下書きを保存しました");
    return id;
  }, []);

  const loadProject = useCallback<CreateFlowContextValue["loadProject"]>((id) => {
    const all = readProjects();
    const project = all.find((p) => p.id === id);
    if (!project) return null;
    setBasic(project.basic);
    setFrames(restoreFramesFromMetadata(project.frames));
    setTextSettings(project.textSettings);
    setExportSettings(project.exportSettings);
    setCurrentProjectId(project.id);
    return project;
  }, []);

  return (
    <CreateFlowContext.Provider
      value={{
        basic, setBasic,
        frames, setFrames,
        textSettings, setTextSettings,
        exportSettings, setExportSettings,
        currentProjectId, setCurrentProjectId,
        saveAsDraft, loadProject,
        reset,
      }}
    >
      {children}
    </CreateFlowContext.Provider>
  );
};

export const useCreateFlow = () => {
  const ctx = useContext(CreateFlowContext);
  if (!ctx) throw new Error("useCreateFlow must be used within CreateFlowProvider");
  return ctx;
};
