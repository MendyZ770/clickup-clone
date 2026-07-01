"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Folder,
  Plus,
} from "lucide-react";
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
  const FOLDER_KEY = `sidebar-folder-open-${folder.id}`;
  const [isOpen, setIsOpen] = useState(() => {
    try {
      const stored = localStorage.getItem(FOLDER_KEY);
      return stored === null ? true : stored === "1";
    } catch { return true; }
  });
  const [createListOpen, setCreateListOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    try { localStorage.setItem(FOLDER_KEY, open ? "1" : "0"); } catch { /* ignore */ }
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
        <div className="group flex items-center">
          <CollapsibleTrigger asChild>
            <motion.button
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              className="flex flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-all duration-200 hover:bg-primary/5 hover:text-primary outline-none ring-primary focus-visible:ring-2"
            >
              <motion.div
                animate={{ rotate: isOpen ? 90 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/70 transition-colors group-hover:text-primary" />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Folder className="h-4 w-4 shrink-0 text-muted-foreground/70 transition-colors group-hover:text-primary" />
              </motion.div>
              <span className="flex-1 truncate font-medium text-sidebar-foreground/80">
                {folder.name}
              </span>
            </motion.button>
          </CollapsibleTrigger>

          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              setCreateListOpen(true);
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="mr-1 rounded-md p-1.5 text-muted-foreground opacity-0 transition-all duration-200 hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
            title="Ajouter une liste"
          >
            <Plus className="h-4 w-4" />
          </motion.button>
        </div>

        <CollapsibleContent>
          <div className="ml-3 border-l border-sidebar-border pl-1.5">
            {folder.lists.map((list) => (
              <SidebarListItem key={list.id} list={list} workspaceId={workspaceId} spaceId={spaceId} />
            ))}
            {folder.lists.length === 0 && (
              <div className="px-2 py-1.5">
                <p className="text-[13px] text-muted-foreground/60">Aucune liste</p>
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
