"use client";

import { createContext, useContext, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { PinDialog } from "@/components/task/pin-dialog";
import { CreateSpaceDialog } from "@/components/space/create-space-dialog";
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog";
import { CreateTaskDialog } from "@/components/task/create-task-dialog";
import { useSWRConfig } from "swr";

const TaskDetailModal = dynamic(
  () =>
    import("@/components/task/task-detail-modal").then(
      (mod) => mod.TaskDetailModal
    ),
  { ssr: false }
);

interface ModalContextType {
  taskId: string | null;
  openTaskModal: (id: string, locked?: boolean) => void;
  closeTaskModal: () => void;
  workspaceId: string | null;
  setWorkspaceId: (id: string) => void;
  openCreateSpace: (workspaceId: string) => void;
  openCreateWorkspace: () => void;
  openCreateTask: (workspaceId: string, defaultListId?: string, onCreated?: () => void) => void;
}

const ModalContext = createContext<ModalContextType>({
  taskId: null,
  openTaskModal: () => {},
  closeTaskModal: () => {},
  workspaceId: null,
  setWorkspaceId: () => {},
  openCreateSpace: () => {},
  openCreateWorkspace: () => {},
  openCreateTask: () => {},
});

interface ModalProviderProps {
  children: React.ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [pinTaskId, setPinTaskId] = useState<string | null>(null);
  const [createSpaceOpen, setCreateSpaceOpen] = useState(false);
  const [createSpaceWsId, setCreateSpaceWsId] = useState<string | null>(null);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createTaskWsId, setCreateTaskWsId] = useState<string | null>(null);
  const [createTaskListId, setCreateTaskListId] = useState<string | undefined>(undefined);
  const [createTaskCallback, setCreateTaskCallback] = useState<(() => void) | undefined>(undefined);
  const { mutate } = useSWRConfig();

  const openTaskModal = useCallback((id: string, locked = false) => {
    if (locked) {
      setPinTaskId(id);
    } else {
      setTaskId(id);
    }
  }, []);

  const closeTaskModal = useCallback(() => {
    setTaskId(null);
  }, []);

  const handlePinSuccess = useCallback(() => {
    if (pinTaskId) {
      setTaskId(pinTaskId);
      setPinTaskId(null);
    }
  }, [pinTaskId]);

  const handlePinCancel = useCallback(() => {
    setPinTaskId(null);
  }, []);

  const openCreateSpace = useCallback((wsId: string) => {
    setCreateSpaceWsId(wsId);
    setCreateSpaceOpen(true);
  }, []);

  const openCreateWorkspace = useCallback(() => {
    setCreateWorkspaceOpen(true);
  }, []);

  const openCreateTask = useCallback((wsId: string, defaultListId?: string, onCreated?: () => void) => {
    setCreateTaskWsId(wsId);
    setCreateTaskListId(defaultListId);
    setCreateTaskCallback(() => onCreated);
    setCreateTaskOpen(true);
  }, []);

  return (
    <ModalContext.Provider
      value={{
        taskId,
        openTaskModal,
        closeTaskModal,
        workspaceId,
        setWorkspaceId,
        openCreateSpace,
        openCreateWorkspace,
        openCreateTask,
      }}
    >
      {children}

      {pinTaskId && (
        <PinDialog
          open={!!pinTaskId}
          taskId={pinTaskId}
          onSuccess={handlePinSuccess}
          onCancel={handlePinCancel}
        />
      )}

      {taskId && (
        <TaskDetailModal
          taskId={taskId}
          workspaceId={workspaceId ?? ""}
          onClose={closeTaskModal}
        />
      )}

      {createSpaceWsId && (
        <CreateSpaceDialog
          open={createSpaceOpen}
          onOpenChange={setCreateSpaceOpen}
          workspaceId={createSpaceWsId}
          onCreated={() => mutate(`/api/spaces?workspaceId=${createSpaceWsId}`)}
        />
      )}

      <CreateWorkspaceDialog
        open={createWorkspaceOpen}
        onOpenChange={setCreateWorkspaceOpen}
      />

      {createTaskWsId && (
        <CreateTaskDialog
          open={createTaskOpen}
          onOpenChange={setCreateTaskOpen}
          workspaceId={createTaskWsId}
          defaultListId={createTaskListId}
          onCreated={createTaskCallback}
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
