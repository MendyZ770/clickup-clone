"use client";

import { X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusFilter } from "./status-filter";
import { PriorityFilter } from "./priority-filter";
import { AssigneeFilter } from "./assignee-filter";
import { DateFilter } from "./date-filter";
import { SortSelector } from "./sort-selector";
import { useFilters } from "@/hooks/use-filters";

interface FilterBarProps {
  listId: string;
  workspaceId: string;
}

export function FilterBar({ listId, workspaceId }: FilterBarProps) {
  const { getFilter, setFilter, setFilters, clearFilters } = useFilters();

  const statusIds = getFilter("statusId")?.split(",").filter(Boolean) ?? [];
  const priorities = getFilter("priority")?.split(",").filter(Boolean) ?? [];
  const assigneeIds = getFilter("assigneeId")?.split(",").filter(Boolean) ?? [];
  const dateFilter = getFilter("dateFilter");
  const sortBy = getFilter("sortBy");
  const sortOrder = (getFilter("sortOrder") as "asc" | "desc") ?? null;

  const activeCount =
    (statusIds.length > 0 ? 1 : 0) +
    (priorities.length > 0 ? 1 : 0) +
    (assigneeIds.length > 0 ? 1 : 0) +
    (dateFilter ? 1 : 0);
  const hasFilters = activeCount > 0;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Icône avec badge actif */}
      <div className="relative">
        <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
        {hasFilters && (
          <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </div>

      <StatusFilter
        listId={listId}
        selected={statusIds}
        onChange={(ids) =>
          setFilter("statusId", ids.length > 0 ? ids.join(",") : null)
        }
      />

      <PriorityFilter
        selected={priorities}
        onChange={(vals) =>
          setFilter("priority", vals.length > 0 ? vals.join(",") : null)
        }
      />

      <AssigneeFilter
        workspaceId={workspaceId}
        selected={assigneeIds}
        onChange={(ids) =>
          setFilter("assigneeId", ids.length > 0 ? ids.join(",") : null)
        }
      />

      <DateFilter
        selected={dateFilter}
        onChange={(val) => setFilter("dateFilter", val)}
      />

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[11px] gap-1 text-primary hover:text-primary hover:bg-primary/10 px-2"
          onClick={clearFilters}
        >
          <X className="h-3 w-3" />
          Effacer ({activeCount})
        </Button>
      )}

      <div className="ml-auto">
        <SortSelector
          sortBy={sortBy}
          sortOrder={sortOrder}
          onChange={(by, order) =>
            setFilters({ sortBy: by, sortOrder: order })
          }
        />
      </div>
    </div>
  );
}
