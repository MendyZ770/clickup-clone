"use client";

import { motion } from "framer-motion";
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
      <motion.div className="relative" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        {hasFilters && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white"
          >
            {activeCount}
          </motion.span>
        )}
      </motion.div>

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
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10 px-2"
            onClick={clearFilters}
          >
            <X className="h-4 w-4" />
            Effacer ({activeCount})
          </Button>
        </motion.div>
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
