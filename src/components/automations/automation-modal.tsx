"use client";

import { useState } from "react";
import { Bot, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAutomations } from "@/hooks/use-automations";
import { useWorkspace } from "@/hooks/use-workspace";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

export function AutomationModal({ listId }: { listId: string }) {
  const { automations, isLoading, createAutomation, deleteAutomation } = useAutomations(listId);
  const { currentWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState("STATUS_CHANGED");
  const [triggerStatusId, setTriggerStatusId] = useState("");
  const [actionType, setActionType] = useState("SET_ASSIGNEE");
  const [actionAssigneeId, setActionAssigneeId] = useState("");

  const handleCreate = async () => {
    if (!name) return;
    try {
      await createAutomation({
        listId,
        name,
        triggerType,
        triggerCondition: triggerStatusId ? { statusId: triggerStatusId } : {},
        actionType,
        actionPayload: actionType === "SET_ASSIGNEE" ? { assigneeId: actionAssigneeId } : {},
      });
      setIsCreating(false);
      setName("");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bot className="h-4 w-4" />
          <span className="hidden sm:inline">Automatisations</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Automatisations de la liste</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 flex justify-center"><LoadingSpinner /></div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              {automations.map((auto) => (
                <div key={auto.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{auto.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Quand {auto.triggerType} ➡️ {auto.actionType}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteAutomation(auto.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {automations.length === 0 && !isCreating && (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune automatisation.</p>
              )}
            </div>

            {!isCreating ? (
              <Button className="w-full" variant="outline" onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" /> Nouvelle Règle
              </Button>
            ) : (
              <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom de la règle</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    placeholder="Ex: Assigner au chef de projet si Terminé"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Déclencheur (Quand...)</label>
                    <select
                      value={triggerType}
                      onChange={(e) => setTriggerType(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    >
                      <option value="STATUS_CHANGED">Le statut change</option>
                      <option value="TASK_CREATED">Une tâche est créée</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Action (Alors...)</label>
                    <select
                      value={actionType}
                      onChange={(e) => setActionType(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    >
                      <option value="SET_ASSIGNEE">Assigner à un membre</option>
                    </select>
                  </div>
                </div>

                {/* Simplified condition UI for demo */}
                {triggerType === "STATUS_CHANGED" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">ID du statut déclencheur (Optionnel)</label>
                    <input
                      type="text"
                      value={triggerStatusId}
                      onChange={(e) => setTriggerStatusId(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      placeholder="ID du statut"
                    />
                  </div>
                )}
                {actionType === "SET_ASSIGNEE" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">ID du Membre à assigner</label>
                    <input
                      type="text"
                      value={actionAssigneeId}
                      onChange={(e) => setActionAssigneeId(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      placeholder="User ID"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" onClick={() => setIsCreating(false)}>Annuler</Button>
                  <Button onClick={handleCreate} disabled={!name}>Créer</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
