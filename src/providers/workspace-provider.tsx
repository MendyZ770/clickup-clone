"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
interface WorkspaceData {
  id: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkspaceContextType {
  currentWorkspace: WorkspaceData | null;
  workspaces: WorkspaceData[];
  setCurrentWorkspace: (workspace: WorkspaceData) => void;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  currentWorkspace: null,
  workspaces: [],
  setCurrentWorkspace: () => {},
  isLoading: true,
});

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

const WORKSPACE_STORAGE_KEY = "clickup-clone-workspace-id";

interface WorkspaceProviderProps {
  children: React.ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const { status } = useSession();
  const [currentWorkspace, setCurrentWorkspaceState] =
    useState<WorkspaceData | null>(null);

  const { data, isLoading: swrLoading } = useSWR<WorkspaceData[]>(
    status === "authenticated" ? "/api/workspaces" : null,
    fetcher
  );

  const workspaces = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const isLoading = status === "loading" || swrLoading;

  const setCurrentWorkspace = useCallback((workspace: WorkspaceData) => {
    setCurrentWorkspaceState(workspace);
    try {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, workspace.id);
    } catch {
      // localStorage may not be available
    }
  }, []);

  useEffect(() => {
    if (workspaces.length === 0) return;

    let savedId: string | null = null;
    try {
      savedId = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    } catch {
      // localStorage may not be available
    }

    const saved = savedId
      ? workspaces.find((w) => w.id === savedId)
      : undefined;

    if (saved) {
      setCurrentWorkspaceState(saved);
    } else {
      setCurrentWorkspaceState(workspaces[0]);
    }
  }, [workspaces]);

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        workspaces,
        setCurrentWorkspace,
        isLoading,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
