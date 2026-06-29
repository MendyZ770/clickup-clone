"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Plus,
  FolderPlus,
  ListPlus,
  Star,
  Heart,
  Zap,
  Target,
  Briefcase,
  Code,
  BookOpen,
  Globe,
  Settings,
  Folder,
} from "lucide-react";
import type { SpaceWithContents } from "@/types";
import type { KeyedMutator } from "swr";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarFolderItem } from "./sidebar-folder-item";
import { SidebarListItem } from "./sidebar-list-item";
import { CreateFolderDialog } from "@/components/folder/create-folder-dialog";
import { CreateListDialog } from "@/components/list/create-list-dialog";

const ICON_MAP: Record<string, React.ElementType> = {
  folder: Folder,
  star: Star,
  heart: Heart,
  zap: Zap,
  target: Target,
  briefcase: Briefcase,
  code: Code,
  book: BookOpen,
  globe: Globe,
  settings: Settings,
};

interface SidebarSpaceItemProps {
  space: SpaceWithContents;
  workspaceId: string;
  mutateSpaces: KeyedMutator<SpaceWithContents[]>;
  collapsed?: boolean;
}

export function SidebarSpaceItem({ space, workspaceId, mutateSpaces, collapsed }: SidebarSpaceItemProps) {
  const STORAGE_KEY = `sidebar-space-open-${space.id}`;
  const [isOpen, setIsOpen] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === null ? true : stored === "1";
    } catch {
      return true;
    }
  });
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createListOpen, setCreateListOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    try { localStorage.setItem(STORAGE_KEY, open ? "1" : "0"); } catch { /* ignore */ }
  };

  const SpaceIcon = ICON_MAP[space.icon ?? "folder"] ?? Folder;

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex w-full items-center justify-center rounded-md py-1.5 transition-colors hover:bg-sidebar-accent"
            title={space.name}
          >
            <motion.div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded"
              style={{ backgroundColor: space.color ?? "#3B82F6" }}
              whileHover={{ rotate: 5 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <SpaceIcon className="h-5 w-5 text-white" />
            </motion.div>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="right">{space.name}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
        <div className="group flex items-center">
          <CollapsibleTrigger asChild>
            <motion.button
              whileHover={{ x: 1 }}
              whileTap={{ scale: 0.98 }}
              className="flex flex-1 items-center gap-1.5 rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-sidebar-accent"
            >
              <motion.div
                animate={{ rotate: isOpen ? 90 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </motion.div>
              <motion.div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded"
                style={{ backgroundColor: space.color ?? "#3B82F6" }}
                whileHover={{ scale: 1.05, rotate: 3 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <SpaceIcon className="h-5 w-5 text-white" />
              </motion.div>
              <span className="flex-1 truncate font-medium text-sidebar-foreground/90">
                {space.name}
              </span>
            </motion.button>
          </CollapsibleTrigger>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="mr-1 rounded p-0.5 text-muted-foreground opacity-40 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <Plus className="h-6 w-6" />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="right">
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setTimeout(() => setCreateFolderOpen(true), 100); }}>
                <FolderPlus className="mr-2 h-6 w-6" />
                Nouveau dossier
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setTimeout(() => setCreateListOpen(true), 100); }}>
                <ListPlus className="mr-2 h-6 w-6" />
                Nouvelle liste
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CollapsibleContent>
          <div className="ml-3 border-l border-sidebar-border pl-1.5">
            {/* Folders */}
            {space.folders.map((folder) => (
              <SidebarFolderItem
                key={folder.id}
                folder={folder}
                workspaceId={workspaceId}
                spaceId={space.id}
                mutateSpaces={mutateSpaces}
              />
            ))}

            {/* Lists directly under space (not in a folder) */}
            {space.lists.map((list) => (
              <SidebarListItem key={list.id} list={list} workspaceId={workspaceId} spaceId={space.id} />
            ))}

            {space.folders.length === 0 && space.lists.length === 0 && (
              <div className="px-2 py-2">
                <p className="text-sm text-muted-foreground/70">Aucune liste</p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        spaceId={space.id}
        onCreated={() => mutateSpaces()}
      />
      <CreateListDialog
        open={createListOpen}
        onOpenChange={setCreateListOpen}
        spaceId={space.id}
        onCreated={() => mutateSpaces()}
      />
    </>
  );
}
