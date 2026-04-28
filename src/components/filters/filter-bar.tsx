"use client";

import { X, Filter } from "lucide-react";
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
  const { getFilter, setFilter, setFilters, clearFilters } =
    useFilters();

  const statusIds = getFilter("statusId")?.split(",").filter(Boolean) ?? [];
  const priorities = getFilter("priority")?.split(",").filter(Boolean) ?? [];
  const assigneeIds =
    getFilter("assigneeId")?.split(",").filter(Boolean) ?? [];
  const dateFilter = getFilter("dateFilter");
  const sortBy = getFilter("sortBy");
  const sortOrder = (getFilter("sortOrder") as "asc" | "desc") ?? null;

  const hasFilters =
    statusIds.length > 0 ||
    priorities.length > 0 ||
    assigneeIds.length > 0 ||
    !!dateFilter;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Filter className="h-3.5 w-3.5 text-muted-foreground" />

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
          className="h-7 text-xs gap-1 text-muted-foreground"
          onClick={clearFilters}
        >
          <X className="h-3 w-3" />
          Effacer
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
