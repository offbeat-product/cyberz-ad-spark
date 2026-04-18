import { createContext, useContext, useState, ReactNode, useCallback } from "react";

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
  reset: () => void;
}

const CreateFlowContext = createContext<CreateFlowContextValue | null>(null);

export const CreateFlowProvider = ({ children }: { children: ReactNode }) => {
  const [basic, setBasic] = useState<BasicData>(defaultBasic);
  const [frames, setFrames] = useState<FrameData[]>(defaultFrames);
  const [textSettings, setTextSettings] = useState<TextSettings>(defaultText);
  const [exportSettings, setExportSettings] = useState<ExportSettings>(defaultExport);

  const reset = useCallback(() => {
    setBasic(defaultBasic);
    setFrames(defaultFrames);
    setTextSettings(defaultText);
    setExportSettings(defaultExport);
  }, []);

  return (
    <CreateFlowContext.Provider
      value={{ basic, setBasic, frames, setFrames, textSettings, setTextSettings, exportSettings, setExportSettings, reset }}
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
