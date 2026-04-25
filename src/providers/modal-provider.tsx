"use client";

import { createContext, useContext, useState, useCallback } from "react";
import dynamic from "next/dynamic";

const TaskDetailModal = dynamic(
  () =>
    import("@/components/task/task-detail-modal").then(
      (mod) => mod.TaskDetailModal
    ),
  { ssr: false }
);

interface ModalContextType {
  taskId: string | null;
  openTaskModal: (id: string) => void;
  closeTaskModal: () => void;
  workspaceId: string | null;
  setWorkspaceId: (id: string) => void;
}

const ModalContext = createContext<ModalContextType>({
  taskId: null,
  openTaskModal: () => {},
  closeTaskModal: () => {},
  workspaceId: null,
  setWorkspaceId: () => {},
});

interface ModalProviderProps {
  children: React.ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  const openTaskModal = useCallback((id: string) => {
    setTaskId(id);
  }, []);

  const closeTaskModal = useCallback(() => {
    setTaskId(null);
  }, []);

  return (
    <ModalContext.Provider
      value={{ taskId, openTaskModal, closeTaskModal, workspaceId, setWorkspaceId }}
    >
      {children}
      {taskId && (
        <TaskDetailModal
          taskId={taskId}
          workspaceId={workspaceId ?? ""}
          onClose={closeTaskModal}
        />
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
