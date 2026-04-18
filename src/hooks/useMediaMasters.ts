import { useCallback, useEffect, useState } from "react";
import type { Box, Transition } from "@/components/admin/MediaPreview";

export interface Frame {
  id: string;
  mediaMasterId: string;
  name: string;
  imageUrl: string | null;
  position: Box;
  isDefault: boolean;
}

export interface Logo {
  id: string;
  mediaMasterId: string;
  name: string;
  imageUrl: string | null;
  position: Box;
  isDefault: boolean;
}

export interface MediaMaster {
  id: string;
  name: string;
  transition: Transition;
  switchSec: number;
  displaySec: number;
  bgColor: string;
  noLogo: boolean;
}

const STORAGE_KEY = "mediaMasters:v1";

interface PersistedState {
  media: MediaMaster[];
  frames: Frame[];
  logos: Logo[];
}

const defaultMedia: MediaMaster[] = [
  { id: "1", name: "ピッコマ", transition: "fade", switchSec: 0.3, displaySec: 2.0, bgColor: "#000000", noLogo: false },
  { id: "2", name: "コミックシーモア", transition: "slide-lr", switchSec: 0.5, displaySec: 2.5, bgColor: "#000000", noLogo: false },
  { id: "3", name: "まんが王国", transition: "zoom-in", switchSec: 0.3, displaySec: 3.0, bgColor: "#000000", noLogo: false },
];

const loadInitial = (): PersistedState => {
  if (typeof window === "undefined") {
    return { media: defaultMedia, frames: [], logos: [] };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { media: defaultMedia, frames: [], logos: [] };
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      media: parsed.media ?? defaultMedia,
      frames: parsed.frames ?? [],
      logos: parsed.logos ?? [],
    };
  } catch {
    return { media: defaultMedia, frames: [], logos: [] };
  }
};

/**
 * Persistent store for media masters and their frames/logos.
 * Today: localStorage. Future: swap internals for Supabase without touching callers.
 */
export const useMediaMasters = () => {
  const [{ media, frames, logos }, setState] = useState<PersistedState>(loadInitial);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ media, frames, logos }));
    } catch {
      // ignore quota/availability errors
    }
  }, [media, frames, logos]);

  const setMedia = useCallback(
    (updater: MediaMaster[] | ((prev: MediaMaster[]) => MediaMaster[])) =>
      setState((s) => ({ ...s, media: typeof updater === "function" ? (updater as any)(s.media) : updater })),
    [],
  );
  const setFrames = useCallback(
    (updater: Frame[] | ((prev: Frame[]) => Frame[])) =>
      setState((s) => ({ ...s, frames: typeof updater === "function" ? (updater as any)(s.frames) : updater })),
    [],
  );
  const setLogos = useCallback(
    (updater: Logo[] | ((prev: Logo[]) => Logo[])) =>
      setState((s) => ({ ...s, logos: typeof updater === "function" ? (updater as any)(s.logos) : updater })),
    [],
  );

  return { media, frames, logos, setMedia, setFrames, setLogos };
};
