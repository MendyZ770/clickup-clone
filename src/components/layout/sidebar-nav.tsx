"use client";

import type { SpaceWithContents } from "@/types";
import { SidebarSpaceItem } from "./sidebar-space-item";
import type { KeyedMutator } from "swr";

interface SidebarNavProps {
  spaces: SpaceWithContents[];
  mutateSpaces: KeyedMutator<SpaceWithContents[]>;
}

export function SidebarNav({ spaces, mutateSpaces }: SidebarNavProps) {
  return (
    <div className="space-y-0.5">
      {spaces.map((space) => (
        <SidebarSpaceItem
          key={space.id}
          space={space}
          mutateSpaces={mutateSpaces}
        />
      ))}
    </div>
  );
}
