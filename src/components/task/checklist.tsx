"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Plus, ListChecks } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChecklistItemRow } from "./checklist-item";
import type { ChecklistWithItems } from "@/types";
import { staggerContainer, staggerItem } from "@/components/ui/animated-container";

interface ChecklistProps {
  checklist: ChecklistWithItems;
  taskId: string;
  onChanged?: () => void;
}

export function Checklist({ checklist, taskId, onChanged }: ChecklistProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [newText, setNewText] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const doneCount = checklist.items.filter((i) => i.completed).length;
  const totalCount = checklist.items.length;
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  const handleAddItem = async () => {
    const trimmed = newText.trim();
    if (!trimmed || isCreating) return;
    setIsCreating(true);
    try {
      await fetch(
        `/api/tasks/${taskId}/checklists/${checklist.id}/items`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmed }),
        }
      );
      setNewText("");
      onChanged?.();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <motion.button
          onClick={() => setCollapsed(!collapsed)}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-1.5 text-sm font-semibold hover:text-primary transition-colors"
        >
          <motion.div
            animate={{ rotate: collapsed ? 0 : 90 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <ChevronRight className="h-5 w-5" />
          </motion.div>
          <motion.div whileHover={{ rotate: 5 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}>
            <ListChecks className="h-5 w-5" />
          </motion.div>
          {checklist.title}
        </motion.button>
        <span className="text-sm text-muted-foreground">
          {doneCount}/{totalCount}
        </span>
      </div>

      <AnimatePresence>
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="space-y-2 overflow-hidden"
        >
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ originX: 0 }}
          >
            <Progress value={progress} className="h-2" />
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-0.5"
          >
            {checklist.items.map((item) => (
              <motion.div key={item.id} variants={staggerItem}>
                <ChecklistItemRow
                  item={item}
                  taskId={taskId}
                  checklistId={checklist.id}
                  onChanged={onChanged}
                />
              </motion.div>
            ))}
          </motion.div>

          <div className="flex gap-1 px-2">
            <Input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Ajouter un élément..."
              className="h-8 text-sm"
              disabled={isCreating}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddItem();
                }
              }}
            />
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

interface ChecklistSectionProps {
  checklists: ChecklistWithItems[];
  taskId: string;
  onChanged?: () => void;
}

export function ChecklistSection({
  checklists,
  taskId,
  onChanged,
}: ChecklistSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateChecklist = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed || isCreating) return;
    setIsCreating(true);
    try {
      await fetch(`/api/tasks/${taskId}/checklists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      setNewTitle("");
      setIsAdding(false);
      onChanged?.();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Checklists</h3>
        {!isAdding && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-sm gap-1"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-4 w-4" />
              Ajouter une checklist
            </Button>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
      {isAdding && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          className="flex gap-2 overflow-hidden"
        >
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Titre de la checklist..."
            className="h-8 text-sm"
            autoFocus
            disabled={isCreating}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreateChecklist();
              }
              if (e.key === "Escape") {
                setIsAdding(false);
                setNewTitle("");
              }
            }}
          />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="sm"
              className="h-8"
              onClick={handleCreateChecklist}
              disabled={!newTitle.trim() || isCreating}
            >
              Ajouter
            </Button>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {checklists.map((cl) => (
          <motion.div key={cl.id} variants={staggerItem}>
            <Checklist
              checklist={cl}
              taskId={taskId}
              onChanged={onChanged}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
