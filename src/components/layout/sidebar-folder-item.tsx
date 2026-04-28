"use client";

import { useState } from "react";
import {
  ChevronRight,
  Folder,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FolderWithLists } from "@/types";
import type { SpaceWithContents } from "@/types";
import type { KeyedMutator } from "swr";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SidebarListItem } from "./sidebar-list-item";
import { CreateListDialog } from "@/components/list/create-list-dialog";

interface SidebarFolderItemProps {
  folder: FolderWithLists;
  workspaceId: string;
  spaceId: string;
  mutateSpaces: KeyedMutator<SpaceWithContents[]>;
}

export function SidebarFolderItem({
  folder,
  workspaceId,
  spaceId,
  mutateSpaces,
}: SidebarFolderItemProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [createListOpen, setCreateListOpen] = useState(false);

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="group flex items-center">
          <CollapsibleTrigger asChild>
            <button className="flex flex-1 items-center gap-1.5 rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-white/5">
              <ChevronRight
                className={cn(
                  "h-3 w-3 shrink-0 text-gray-500 transition-transform duration-200",
                  isOpen && "rotate-90"
                )}
              />
              <Folder className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="flex-1 truncate text-gray-300">
                {folder.name}
              </span>
            </button>
          </CollapsibleTrigger>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setCreateListOpen(true);
            }}
            className="mr-1 rounded p-0.5 text-gray-500 opacity-0 transition-all hover:bg-white/10 hover:text-white group-hover:opacity-100"
            title="Ajouter une liste"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        <CollapsibleContent>
          <div className="ml-3 border-l border-white/5 pl-1.5">
            {folder.lists.map((list) => (
              <SidebarListItem key={list.id} list={list} workspaceId={workspaceId} spaceId={spaceId} />
            ))}
            {folder.lists.length === 0 && (
              <div className="px-2 py-1.5">
                <p className="text-[11px] text-gray-600">Aucune liste</p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <CreateListDialog
        open={createListOpen}
        onOpenChange={setCreateListOpen}
        spaceId={spaceId}
        folderId={folder.id}
        onCreated={() => mutateSpaces()}
      />
    </>
  );
}
