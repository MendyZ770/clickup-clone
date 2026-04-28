"use client";

import { useState } from "react";
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
import { cn } from "@/lib/utils";
import type { SpaceWithContents } from "@/types";
import type { KeyedMutator } from "swr";
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
}

export function SidebarSpaceItem({ space, workspaceId, mutateSpaces }: SidebarSpaceItemProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createListOpen, setCreateListOpen] = useState(false);

  const SpaceIcon = ICON_MAP[space.icon ?? "folder"] ?? Folder;

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="group flex items-center">
          <CollapsibleTrigger asChild>
            <button className="flex flex-1 items-center gap-1.5 rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-sidebar-accent">
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-90"
                )}
              />
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
                style={{ backgroundColor: space.color ?? "#3B82F6" }}
              >
                <SpaceIcon className="h-3 w-3 text-white" />
              </div>
              <span className="flex-1 truncate font-medium text-sidebar-foreground/90">
                {space.name}
              </span>
            </button>
          </CollapsibleTrigger>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="mr-1 rounded p-0.5 text-muted-foreground opacity-0 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="right">
              <DropdownMenuItem onClick={() => setCreateFolderOpen(true)}>
                <FolderPlus className="mr-2 h-4 w-4" />
                Nouveau dossier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCreateListOpen(true)}>
                <ListPlus className="mr-2 h-4 w-4" />
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
                <p className="text-[11px] text-muted-foreground/70">Aucune liste</p>
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
