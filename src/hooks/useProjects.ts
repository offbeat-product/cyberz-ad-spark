import { useCallback, useEffect, useState } from "react";
import type { SavedProject } from "@/types/project";

const STORAGE_KEY = "adgen-cyberz-projects";

const loadInitial = (): SavedProject[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedProject[]) : [];
  } catch {
    return [];
  }
};

const persist = (projects: SavedProject[]) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error("Failed to persist projects:", e);
  }
};

export const useProjects = () => {
  const [projects, setProjects] = useState<SavedProject[]>(loadInitial);

  // Sync across tabs / hook instances
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setProjects(loadInitial());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const saveProject = useCallback((project: SavedProject) => {
    setProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === project.id);
      const now = new Date().toISOString();
      const updated =
        idx >= 0
          ? prev.map((p, i) => (i === idx ? { ...project, updatedAt: now } : p))
          : [...prev, { ...project, createdAt: project.createdAt || now, updatedAt: now }];
      persist(updated);
      return updated;
    });
  }, []);

  const getProject = useCallback(
    (id: string) => projects.find((p) => p.id === id),
    [projects],
  );

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      persist(updated);
      return updated;
    });
  }, []);

  return { projects, saveProject, getProject, deleteProject };
};
